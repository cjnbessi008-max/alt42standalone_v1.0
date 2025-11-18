<?php
/**
 * Library of interface functions and constants for module selfexplanation
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return true | null True if the feature is supported, null otherwise.
 */
function selfexplanation_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return false; // Can be enabled if grading is needed
        case FEATURE_GROUPINGS:
            return true;
        case FEATURE_GROUPS:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the selfexplanation into the database
 *
 * @param stdClass $selfexplanation An object from the form in mod_form.php
 * @param mod_selfexplanation_mod_form $mform The form instance itself (if needed)
 * @return int The id of the newly inserted selfexplanation record
 */
function selfexplanation_add_instance(stdClass $selfexplanation, mod_selfexplanation_mod_form $mform = null) {
    global $DB;

    $selfexplanation->timecreated = time();
    $selfexplanation->timemodified = time();

    // Set default prompt text if not provided
    if (empty($selfexplanation->prompttext)) {
        $selfexplanation->prompttext = get_string('prompttype_' . $selfexplanation->prompttype, 'selfexplanation');
    }

    $selfexplanation->id = $DB->insert_record('selfexplanation', $selfexplanation);

    return $selfexplanation->id;
}

/**
 * Updates an instance of the selfexplanation in the database
 *
 * @param stdClass $selfexplanation An object from the form in mod_form.php
 * @param mod_selfexplanation_mod_form $mform The form instance itself (if needed)
 * @return boolean Success/Fail
 */
function selfexplanation_update_instance(stdClass $selfexplanation, mod_selfexplanation_mod_form $mform = null) {
    global $DB;

    $selfexplanation->timemodified = time();
    $selfexplanation->id = $selfexplanation->instance;

    return $DB->update_record('selfexplanation', $selfexplanation);
}

/**
 * Removes an instance of the selfexplanation from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function selfexplanation_delete_instance($id) {
    global $DB;

    if (!$selfexplanation = $DB->get_record('selfexplanation', array('id' => $id))) {
        return false;
    }

    // Delete all responses
    $DB->delete_records('selfexplanation_responses', array('selfexplanationid' => $id));

    // Delete analytics for responses
    $responses = $DB->get_records('selfexplanation_responses', array('selfexplanationid' => $id));
    foreach ($responses as $response) {
        $DB->delete_records('selfexplanation_analytics', array('responseid' => $response->id));
    }

    // Delete the instance
    $DB->delete_records('selfexplanation', array('id' => $id));

    return true;
}

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function selfexplanation_get_coursemodule_info($coursemodule) {
    global $DB;

    $dbparams = array('id' => $coursemodule->instance);
    $fields = 'id, name, intro, introformat';
    if (!$selfexplanation = $DB->get_record('selfexplanation', $dbparams, $fields)) {
        return false;
    }

    $result = new cached_cm_info();
    $result->name = $selfexplanation->name;

    if ($coursemodule->showdescription) {
        // Convert intro to html. Do not filter cached version, filters run at display time.
        $result->content = format_module_intro('selfexplanation', $selfexplanation, $coursemodule->id, false);
    }

    return $result;
}

/**
 * Mark the activity completed (if required) and trigger the course_module_viewed event.
 *
 * @param  stdClass $selfexplanation   selfexplanation object
 * @param  stdClass $course     course object
 * @param  stdClass $cm         course module object
 * @param  stdClass $context    context object
 * @since Moodle 3.0
 */
function selfexplanation_view($selfexplanation, $course, $cm, $context) {

    // Trigger course_module_viewed event.
    $params = array(
        'context' => $context,
        'objectid' => $selfexplanation->id
    );

    $event = \mod_selfexplanation\event\course_module_viewed::create($params);
    $event->add_record_snapshot('course_modules', $cm);
    $event->add_record_snapshot('course', $course);
    $event->add_record_snapshot('selfexplanation', $selfexplanation);
    $event->trigger();

    // Completion.
    $completion = new completion_info($course);
    $completion->set_module_viewed($cm);
}

/**
 * Submit a self-explanation response
 *
 * @param int $selfexplanationid The selfexplanation activity ID
 * @param int $userid The user ID
 * @param string $responsetext The response text
 * @param string $status Status: draft or submitted
 * @return int The response ID
 */
function selfexplanation_submit_response($selfexplanationid, $userid, $responsetext, $status = 'submitted') {
    global $DB;

    $response = new stdClass();
    $response->selfexplanationid = $selfexplanationid;
    $response->userid = $userid;
    $response->responsetext = $responsetext;
    $response->responseformat = FORMAT_HTML;
    $response->wordcount = selfexplanation_count_words($responsetext);
    $response->status = $status;
    $response->timecreated = time();
    $response->timemodified = time();

    // Check if response already exists
    $existing = $DB->get_record('selfexplanation_responses',
        array('selfexplanationid' => $selfexplanationid, 'userid' => $userid));

    if ($existing) {
        $response->id = $existing->id;
        $response->timecreated = $existing->timecreated; // Keep original creation time
        $DB->update_record('selfexplanation_responses', $response);
        $responseid = $response->id;
    } else {
        $responseid = $DB->insert_record('selfexplanation_responses', $response);
    }

    // Calculate analytics
    selfexplanation_calculate_analytics($responseid, $responsetext);

    return $responseid;
}

/**
 * Count words in text (handles both English and Korean)
 *
 * @param string $text The text to count words in
 * @return int The word count
 */
function selfexplanation_count_words($text) {
    // Remove HTML tags
    $text = strip_tags($text);

    // For Korean text, count characters (as Korean doesn't use spaces like English)
    // For English, count words
    $korean_chars = preg_match_all('/[\x{AC00}-\x{D7A3}]/u', $text);
    $english_words = str_word_count($text);

    // Return the maximum (handles mixed Korean/English text)
    return max($korean_chars, $english_words);
}

/**
 * Calculate analytics for a response
 *
 * @param int $responseid The response ID
 * @param string $responsetext The response text
 */
function selfexplanation_calculate_analytics($responseid, $responsetext) {
    global $DB;

    $analytics = new stdClass();
    $analytics->responseid = $responseid;

    // Strip HTML
    $plaintext = strip_tags($responsetext);

    // Count sentences
    $analytics->sentencecount = preg_match_all('/[.!?。]/u', $plaintext);

    // Count metacognitive keywords (Korean and English)
    $keywords = array(
        '왜', '어떻게', '때문에', '그래서', '이유', '설명', '생각', '이해',
        'why', 'because', 'reason', 'therefore', 'think', 'understand', 'explain', 'know'
    );

    $keywordcount = 0;
    foreach ($keywords as $keyword) {
        $keywordcount += substr_count(mb_strtolower($plaintext), mb_strtolower($keyword));
    }
    $analytics->keywordcount = $keywordcount;

    // Calculate average sentence length
    if ($analytics->sentencecount > 0) {
        $analytics->avgsentencelen = selfexplanation_count_words($plaintext) / $analytics->sentencecount;
    } else {
        $analytics->avgsentencelen = 0;
    }

    // Calculate quality score (simple heuristic)
    $wordcount = selfexplanation_count_words($plaintext);
    $qualityscore = 0;

    // Word count contributes to quality (up to 50 points)
    $qualityscore += min(50, $wordcount * 0.5);

    // Keyword usage contributes (up to 30 points)
    $qualityscore += min(30, $keywordcount * 5);

    // Sentence variety contributes (up to 20 points)
    if ($analytics->avgsentencelen >= 10 && $analytics->avgsentencelen <= 25) {
        $qualityscore += 20;
    } else if ($analytics->avgsentencelen >= 5) {
        $qualityscore += 10;
    }

    $analytics->qualityscore = round($qualityscore, 2);
    $analytics->timecreated = time();

    // Delete existing analytics and insert new
    $DB->delete_records('selfexplanation_analytics', array('responseid' => $responseid));
    $DB->insert_record('selfexplanation_analytics', $analytics);
}

/**
 * Get user's response for an activity
 *
 * @param int $selfexplanationid The selfexplanation activity ID
 * @param int $userid The user ID
 * @return stdClass|false The response object or false if not found
 */
function selfexplanation_get_user_response($selfexplanationid, $userid) {
    global $DB;

    return $DB->get_record('selfexplanation_responses',
        array('selfexplanationid' => $selfexplanationid, 'userid' => $userid));
}
