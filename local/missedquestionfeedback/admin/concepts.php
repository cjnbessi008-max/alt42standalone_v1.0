<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Manage concepts page
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

$PAGE->set_url(new moodle_url('/local/missedquestionfeedback/admin/concepts.php'));
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('manageconcepts', 'local_missedquestionfeedback'));
$PAGE->set_heading(get_string('manageconcepts', 'local_missedquestionfeedback'));

// Handle actions
if ($action === 'delete' && $id && confirm_sesskey()) {
    $concept = api::get_concept($id);
    if ($concept && optional_param('confirm', 0, PARAM_INT)) {
        api::delete_concept($id);
        redirect($PAGE->url, get_string('success:conceptdeleted', 'local_missedquestionfeedback'));
    }
} else if ($action === 'edit' || $action === 'add') {
    // Handle form submission
    if ($data = data_submitted() && confirm_sesskey()) {
        $concept = new stdClass();
        if ($id) {
            $concept->id = $id;
        }
        $concept->name = required_param('name', PARAM_TEXT);
        $concept->description = optional_param('description', '', PARAM_TEXT);
        $concept->category = optional_param('category', '', PARAM_TEXT);

        api::save_concept($concept);

        $message = $id ? 'success:conceptupdated' : 'success:conceptcreated';
        redirect($PAGE->url, get_string($message, 'local_missedquestionfeedback'));
    }
}

echo $OUTPUT->header();

if ($action === 'delete' && $id) {
    $concept = api::get_concept($id);
    if ($concept) {
        echo $OUTPUT->confirm(
            get_string('confirmdeleteconcept', 'local_missedquestionfeedback', $concept->name),
            new moodle_url($PAGE->url, ['action' => 'delete', 'id' => $id, 'confirm' => 1, 'sesskey' => sesskey()]),
            $PAGE->url
        );
    }
} else if ($action === 'edit' || $action === 'add') {
    $concept = $id ? api::get_concept($id) : new stdClass();

    ?>
    <form method="post" action="<?php echo $PAGE->url; ?>">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="<?php echo $action; ?>">
        <?php if ($id): ?>
            <input type="hidden" name="id" value="<?php echo $id; ?>">
        <?php endif; ?>

        <div class="form-group">
            <label for="name"><?php echo get_string('conceptname', 'local_missedquestionfeedback'); ?> *</label>
            <input type="text" class="form-control" id="name" name="name"
                   value="<?php echo s($concept->name ?? ''); ?>" required>
        </div>

        <div class="form-group">
            <label for="description"><?php echo get_string('conceptdescription', 'local_missedquestionfeedback'); ?></label>
            <textarea class="form-control" id="description" name="description" rows="3"><?php
                echo s($concept->description ?? '');
            ?></textarea>
        </div>

        <div class="form-group">
            <label for="category"><?php echo get_string('conceptcategory', 'local_missedquestionfeedback'); ?></label>
            <input type="text" class="form-control" id="category" name="category"
                   value="<?php echo s($concept->category ?? ''); ?>">
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
        get_string('addconcept', 'local_missedquestionfeedback'),
        ['class' => 'btn btn-primary mb-3']
    );

    $concepts = api::get_concepts();

    if (empty($concepts)) {
        echo html_writer::tag('p', get_string('noconcepts', 'local_missedquestionfeedback'));
    } else {
        $table = new html_table();
        $table->head = [
            get_string('conceptname', 'local_missedquestionfeedback'),
            get_string('conceptcategory', 'local_missedquestionfeedback'),
            get_string('conceptdescription', 'local_missedquestionfeedback'),
            get_string('actions')
        ];

        foreach ($concepts as $concept) {
            $editurl = new moodle_url($PAGE->url, ['action' => 'edit', 'id' => $concept->id]);
            $deleteurl = new moodle_url($PAGE->url, ['action' => 'delete', 'id' => $concept->id, 'sesskey' => sesskey()]);

            $actions = html_writer::link($editurl, get_string('edit')) . ' | ' .
                       html_writer::link($deleteurl, get_string('delete'));

            $table->data[] = [
                $concept->name,
                $concept->category ?? '-',
                shorten_text($concept->description ?? '', 100),
                $actions
            ];
        }

        echo html_writer::table($table);
    }
}

echo $OUTPUT->footer();
