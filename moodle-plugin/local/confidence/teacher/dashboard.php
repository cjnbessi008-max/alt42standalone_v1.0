<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once('../../../config.php');
require_once($CFG->libdir.'/tablelib.php');

$courseid = required_param('courseid', PARAM_INT);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_capability('local/confidence:viewreports', $context);

$PAGE->set_url('/local/confidence/teacher/dashboard.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('classdashboard', 'local_confidence'));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('incourse');

// Get statistics
$stats = \local_confidence\analytics::get_course_statistics($courseid);
$concept_stats = \local_confidence\analytics::get_concept_statistics($courseid);
$at_risk_students = \local_confidence\analytics::get_at_risk_students($courseid);

echo $OUTPUT->header();

?>

<div class="local-confidence-teacher-dashboard">
    <h2><?php echo get_string('classdashboard', 'local_confidence'); ?></h2>

    <!-- Summary Cards -->
    <div class="row mb-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h5 class="card-title"><?php echo get_string('avgconfidence', 'local_confidence'); ?></h5>
                    <div class="display-4 text-primary">
                        <?php echo $stats['avg_confidence']; ?>
                    </div>
                    <small class="text-muted">/ 5.0</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h5 class="card-title"><?php echo get_string('totalstudents', 'local_confidence'); ?></h5>
                    <div class="display-4"><?php echo $stats['total_students']; ?></div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h5 class="card-title"><?php echo get_string('participationrate', 'local_confidence'); ?></h5>
                    <div class="display-4 text-success">
                        <?php echo $stats['participation_rate']; ?>%
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center <?php echo $stats['at_risk_count'] > 0 ? 'bg-warning' : ''; ?>">
                <div class="card-body">
                    <h5 class="card-title"><?php echo get_string('studentsatrisk', 'local_confidence'); ?></h5>
                    <div class="display-4 <?php echo $stats['at_risk_count'] > 0 ? 'text-white' : ''; ?>">
                        <?php echo $stats['at_risk_count']; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Concept Statistics Table -->
    <div class="card mb-4">
        <div class="card-header">
            <h3><?php echo get_string('conceptdistribution', 'local_confidence'); ?></h3>
        </div>
        <div class="card-body">
            <?php if (empty($concept_stats)): ?>
                <div class="alert alert-info">
                    <?php echo get_string('error:conceptnotfound', 'local_confidence'); ?>
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th><?php echo get_string('conceptname', 'local_confidence'); ?></th>
                                <th><?php echo get_string('category', 'local_confidence'); ?></th>
                                <th class="text-center"><?php echo get_string('avgconfidence', 'local_confidence'); ?></th>
                                <th class="text-center">Total Responses</th>
                                <th class="text-center">Low Confidence (<= 2)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($concept_stats as $stat): ?>
                                <tr>
                                    <td><?php echo format_string($stat->conceptname); ?></td>
                                    <td><?php echo format_string($stat->category); ?></td>
                                    <td class="text-center">
                                        <?php if ($stat->avg_score !== null): ?>
                                            <span class="badge badge-<?php
                                                if ($stat->avg_score >= 4) echo 'success';
                                                elseif ($stat->avg_score >= 3) echo 'primary';
                                                elseif ($stat->avg_score >= 2) echo 'warning';
                                                else echo 'danger';
                                            ?>">
                                                <?php echo $stat->avg_score; ?> / 5.0
                                            </span>
                                        <?php else: ?>
                                            <span class="text-muted">-</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-center"><?php echo $stat->total_responses; ?></td>
                                    <td class="text-center">
                                        <?php if ($stat->low_confidence_count > 0): ?>
                                            <span class="badge badge-danger">
                                                <?php echo $stat->low_confidence_count; ?>
                                            </span>
                                        <?php else: ?>
                                            <span class="text-muted">0</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <a href="reports.php?courseid=<?php echo $courseid; ?>&conceptid=<?php echo $stat->id; ?>"
                                           class="btn btn-sm btn-outline-primary">
                                            <?php echo get_string('viewdetail', 'local_confidence'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Students At Risk -->
    <?php if (!empty($at_risk_students)): ?>
        <div class="card mb-4">
            <div class="card-header bg-warning">
                <h3 class="mb-0"><?php echo get_string('needsattention', 'local_confidence'); ?></h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th><?php echo get_string('studentname', 'local_confidence'); ?></th>
                                <th><?php echo get_string('email'); ?></th>
                                <th class="text-center"><?php echo get_string('avgconfidencescore', 'local_confidence'); ?></th>
                                <th class="text-center">Concepts Rated</th>
                                <th><?php echo get_string('lowconfidenceconcepts', 'local_confidence'); ?></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($at_risk_students as $student): ?>
                                <tr>
                                    <td><?php echo fullname($student); ?></td>
                                    <td><?php echo s($student->email); ?></td>
                                    <td class="text-center">
                                        <span class="badge badge-danger">
                                            <?php echo $student->avg_score; ?>
                                        </span>
                                    </td>
                                    <td class="text-center"><?php echo $student->concepts_rated; ?></td>
                                    <td>
                                        <small><?php echo s($student->low_concepts); ?></small>
                                    </td>
                                    <td>
                                        <a href="../student/index.php?courseid=<?php echo $courseid; ?>&userid=<?php echo $student->id; ?>"
                                           class="btn btn-sm btn-outline-primary">
                                            <?php echo get_string('viewdetail', 'local_confidence'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Action Buttons -->
    <div class="mb-4">
        <a href="concepts.php?courseid=<?php echo $courseid; ?>"
           class="btn btn-primary">
            <?php echo get_string('manageconcepts', 'local_confidence'); ?>
        </a>
        <a href="export.php?courseid=<?php echo $courseid; ?>"
           class="btn btn-secondary">
            <?php echo get_string('exportdata', 'local_confidence'); ?>
        </a>
    </div>
</div>

<style>
.display-4 {
    font-size: 2.5rem;
    font-weight: 300;
}

.card {
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.badge {
    font-size: 0.875rem;
    padding: 0.35em 0.65em;
}

.table-hover tbody tr:hover {
    background-color: #f5f5f5;
}
</style>

<?php
echo $OUTPUT->footer();
