<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Renderer for missed question feedback
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_missedquestionfeedback\output;

defined('MOODLE_INTERNAL') || die();

use plugin_renderer_base;

/**
 * Renderer class for missed question feedback
 */
class renderer extends plugin_renderer_base {

    /**
     * Render the misconception feedback block
     *
     * @param object $misconception Misconception data
     * @param int $interactionid Interaction ID for tracking
     * @return string HTML output
     */
    public function render_feedback_block($misconception, $interactionid) {
        $data = [
            'title' => get_string('whatyoumissed', 'local_missedquestionfeedback'),
            'conceptlabel' => get_string('concepttested', 'local_missedquestionfeedback'),
            'conceptname' => $misconception->conceptname,
            'conceptcategory' => $misconception->conceptcategory,
            'misconceptionlabel' => get_string('yourmisconception', 'local_missedquestionfeedback'),
            'misconceptionname' => $misconception->name,
            'explanation' => format_text($misconception->explanation, FORMAT_HTML),
            'correctlabel' => get_string('correctunderstanding', 'local_missedquestionfeedback'),
            'correctunderstanding' => format_text($misconception->correctunderstanding, FORMAT_HTML),
            'hasremediation' => !empty($misconception->remediationstrategy),
            'remediationlabel' => get_string('remediationstrategy', 'local_missedquestionfeedback'),
            'remediation' => !empty($misconception->remediationstrategy) ?
                format_text($misconception->remediationstrategy, FORMAT_HTML) : '',
            'hasresource' => !empty($misconception->resourceurl),
            'resourceurl' => $misconception->resourceurl ?? '',
            'resourcetitle' => $misconception->resourcetitle ?? get_string('learnmore', 'local_missedquestionfeedback'),
            'interactionid' => $interactionid,
            'severityclass' => self::get_severity_class($misconception->severity),
        ];

        return $this->render_from_template('local_missedquestionfeedback/feedback_block', $data);
    }

    /**
     * Render analytics dashboard
     *
     * @param array $analytics Analytics data
     * @return string HTML output
     */
    public function render_analytics_dashboard($analytics) {
        $data = [
            'title' => get_string('analytics', 'local_missedquestionfeedback'),
            'commonmisconceptionstitle' => get_string('mostcommonmisconceptions', 'local_missedquestionfeedback'),
            'misconceptions' => array_values($analytics['common_misconceptions']),
            'engagement' => $analytics['engagement'],
            'engagementtitle' => get_string('studentengagement', 'local_missedquestionfeedback'),
            'feedbackviewedlabel' => get_string('feedbackviewed', 'local_missedquestionfeedback'),
            'resourcesclickedlabel' => get_string('resourcesclicked', 'local_missedquestionfeedback'),
            'avgtimespentlabel' => get_string('averagetimespent', 'local_missedquestionfeedback'),
        ];

        return $this->render_from_template('local_missedquestionfeedback/analytics_dashboard', $data);
    }

    /**
     * Get CSS class for severity level
     *
     * @param int $severity Severity level (1-3)
     * @return string CSS class
     */
    private static function get_severity_class($severity) {
        switch ($severity) {
            case 3:
                return 'severity-critical';
            case 2:
                return 'severity-moderate';
            case 1:
            default:
                return 'severity-minor';
        }
    }

    /**
     * Render concept list
     *
     * @param array $concepts Array of concept objects
     * @return string HTML output
     */
    public function render_concept_list($concepts) {
        $data = [
            'concepts' => array_values($concepts),
            'hasdata' => !empty($concepts),
        ];

        return $this->render_from_template('local_missedquestionfeedback/concept_list', $data);
    }

    /**
     * Render misconception list
     *
     * @param array $misconceptions Array of misconception objects
     * @return string HTML output
     */
    public function render_misconception_list($misconceptions) {
        foreach ($misconceptions as &$misconception) {
            $misconception->severitytext = self::get_severity_text($misconception->severity);
        }

        $data = [
            'misconceptions' => array_values($misconceptions),
            'hasdata' => !empty($misconceptions),
        ];

        return $this->render_from_template('local_missedquestionfeedback/misconception_list', $data);
    }

    /**
     * Get severity text
     *
     * @param int $severity Severity level
     * @return string Severity text
     */
    private static function get_severity_text($severity) {
        switch ($severity) {
            case 3:
                return get_string('severitycritical', 'local_missedquestionfeedback');
            case 2:
                return get_string('severitymoderate', 'local_missedquestionfeedback');
            case 1:
            default:
                return get_string('severityminor', 'local_missedquestionfeedback');
        }
    }
}
