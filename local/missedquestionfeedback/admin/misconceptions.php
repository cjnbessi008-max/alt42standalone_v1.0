<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Manage misconceptions page
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/adminlib.php');

use local_missedquestionfeedback\api;

require_login();
require_capability('local/missedquestionfeedback:manage', context_system::instance());

$action = optional_param('action', 'list', PARAM_ALPHA);
$id = optional_param('id', 0, PARAM_INT);

$PAGE->set_url(new moodle_url('/local/missedquestionfeedback/admin/misconceptions.php'));
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('managemisconceptions', 'local_missedquestionfeedback'));
$PAGE->set_heading(get_string('managemisconceptions', 'local_missedquestionfeedback'));

// Handle actions
if ($action === 'delete' && $id && confirm_sesskey()) {
    $misconception = $DB->get_record('missed_feedback_misconceptions', ['id' => $id]);
    if ($misconception && optional_param('confirm', 0, PARAM_INT)) {
        api::delete_misconception($id);
        redirect($PAGE->url, get_string('success:misconceptiondeleted', 'local_missedquestionfeedback'));
    }
} else if ($action === 'edit' || $action === 'add') {
    if ($data = data_submitted() && confirm_sesskey()) {
        $misconception = new stdClass();
        if ($id) {
            $misconception->id = $id;
        }
        $misconception->conceptid = required_param('conceptid', PARAM_INT);
        $misconception->name = required_param('name', PARAM_TEXT);
        $misconception->description = optional_param('description', '', PARAM_TEXT);
        $misconception->explanation = required_param('explanation', PARAM_TEXT);
        $misconception->correctunderstanding = required_param('correctunderstanding', PARAM_TEXT);
        $misconception->remediationstrategy = optional_param('remediationstrategy', '', PARAM_TEXT);
        $misconception->resourceurl = optional_param('resourceurl', '', PARAM_URL);
        $misconception->resourcetitle = optional_param('resourcetitle', '', PARAM_TEXT);
        $misconception->severity = required_param('severity', PARAM_INT);

        api::save_misconception($misconception);

        $message = $id ? 'success:misconceptionupdated' : 'success:misconceptioncreated';
        redirect($PAGE->url, get_string($message, 'local_missedquestionfeedback'));
    }
}

echo $OUTPUT->header();

if ($action === 'delete' && $id) {
    $misconception = $DB->get_record('missed_feedback_misconceptions', ['id' => $id]);
    if ($misconception) {
        echo $OUTPUT->confirm(
            get_string('confirmdeletemisconception', 'local_missedquestionfeedback', $misconception->name),
            new moodle_url($PAGE->url, ['action' => 'delete', 'id' => $id, 'confirm' => 1, 'sesskey' => sesskey()]),
            $PAGE->url
        );
    }
} else if ($action === 'edit' || $action === 'add') {
    $misconception = $id ? $DB->get_record('missed_feedback_misconceptions', ['id' => $id]) : new stdClass();
    $concepts = api::get_concepts();

    ?>
    <form method="post" action="<?php echo $PAGE->url; ?>">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="<?php echo $action; ?>">
        <?php if ($id): ?>
            <input type="hidden" name="id" value="<?php echo $id; ?>">
        <?php endif; ?>

        <div class="form-group">
            <label for="conceptid"><?php echo get_string('concepttested', 'local_missedquestionfeedback'); ?> *</label>
            <select class="form-control" id="conceptid" name="conceptid" required>
                <option value="">-- Select Concept --</option>
                <?php foreach ($concepts as $concept): ?>
                    <option value="<?php echo $concept->id; ?>"
                        <?php echo (isset($misconception->conceptid) && $misconception->conceptid == $concept->id) ? 'selected' : ''; ?>>
                        <?php echo s($concept->name); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="form-group">
            <label for="name"><?php echo get_string('misconceptionname', 'local_missedquestionfeedback'); ?> *</label>
            <input type="text" class="form-control" id="name" name="name"
                   value="<?php echo s($misconception->name ?? ''); ?>" required>
        </div>

        <div class="form-group">
            <label for="description"><?php echo get_string('misconceptiondescription', 'local_missedquestionfeedback'); ?></label>
            <textarea class="form-control" id="description" name="description" rows="2"><?php
                echo s($misconception->description ?? '');
            ?></textarea>
        </div>

        <div class="form-group">
            <label for="explanation"><?php echo get_string('explanation', 'local_missedquestionfeedback'); ?> *</label>
            <textarea class="form-control" id="explanation" name="explanation" rows="3" required><?php
                echo s($misconception->explanation ?? '');
            ?></textarea>
        </div>

        <div class="form-group">
            <label for="correctunderstanding"><?php echo get_string('correctunderstanding', 'local_missedquestionfeedback'); ?> *</label>
            <textarea class="form-control" id="correctunderstanding" name="correctunderstanding" rows="3" required><?php
                echo s($misconception->correctunderstanding ?? '');
            ?></textarea>
        </div>

        <div class="form-group">
            <label for="remediationstrategy"><?php echo get_string('remediationstrategy', 'local_missedquestionfeedback'); ?></label>
            <textarea class="form-control" id="remediationstrategy" name="remediationstrategy" rows="3"><?php
                echo s($misconception->remediationstrategy ?? '');
            ?></textarea>
        </div>

        <div class="form-group">
            <label for="resourceurl"><?php echo get_string('resourceurl', 'local_missedquestionfeedback'); ?></label>
            <input type="url" class="form-control" id="resourceurl" name="resourceurl"
                   value="<?php echo s($misconception->resourceurl ?? ''); ?>">
        </div>

        <div class="form-group">
            <label for="resourcetitle"><?php echo get_string('resourcetitle', 'local_missedquestionfeedback'); ?></label>
            <input type="text" class="form-control" id="resourcetitle" name="resourcetitle"
                   value="<?php echo s($misconception->resourcetitle ?? ''); ?>">
        </div>

        <div class="form-group">
            <label for="severity"><?php echo get_string('severity', 'local_missedquestionfeedback'); ?> *</label>
            <select class="form-control" id="severity" name="severity" required>
                <option value="1" <?php echo (isset($misconception->severity) && $misconception->severity == 1) ? 'selected' : ''; ?>>
                    <?php echo get_string('severityminor', 'local_missedquestionfeedback'); ?>
                </option>
                <option value="2" <?php echo (isset($misconception->severity) && $misconception->severity == 2) ? 'selected' : ''; ?>>
                    <?php echo get_string('severitymoderate', 'local_missedquestionfeedback'); ?>
                </option>
                <option value="3" <?php echo (isset($misconception->severity) && $misconception->severity == 3) ? 'selected' : ''; ?>>
                    <?php echo get_string('severitycritical', 'local_missedquestionfeedback'); ?>
                </option>
            </select>
        </div>

        <div class="form-group">
            <button type="submit" class="btn btn-primary">
                <?php echo $id ? get_string('save') : get_string('add'); ?>
            </button>
            <a href="<?php echo $PAGE->url; ?>" class="btn btn-secondary">
                <?php echo get_string('cancel'); ?>
            </a>
        </div>
    </form>
    <?php
} else {
    // List view
    echo html_writer::link(
        new moodle_url($PAGE->url, ['action' => 'add']),
        get_string('addmisconception', 'local_missedquestionfeedback'),
        ['class' => 'btn btn-primary mb-3']
    );

    $misconceptions = api::get_all_misconceptions();

    if (empty($misconceptions)) {
        echo html_writer::tag('p', 'No misconceptions found. Please add some.');
    } else {
        $table = new html_table();
        $table->head = [
            get_string('misconceptionname', 'local_missedquestionfeedback'),
            get_string('concepttested', 'local_missedquestionfeedback'),
            get_string('severity', 'local_missedquestionfeedback'),
            get_string('actions')
        ];

        foreach ($misconceptions as $misconception) {
            $editurl = new moodle_url($PAGE->url, ['action' => 'edit', 'id' => $misconception->id]);
            $deleteurl = new moodle_url($PAGE->url, ['action' => 'delete', 'id' => $misconception->id, 'sesskey' => sesskey()]);

            $actions = html_writer::link($editurl, get_string('edit')) . ' | ' .
                       html_writer::link($deleteurl, get_string('delete'));

            $severitylevels = [1 => 'Minor', 2 => 'Moderate', 3 => 'Critical'];

            $table->data[] = [
                $misconception->name,
                $misconception->conceptname,
                $severitylevels[$misconception->severity],
                $actions
            ];
        }

        echo html_writer::table($table);
    }
}

echo $OUTPUT->footer();
