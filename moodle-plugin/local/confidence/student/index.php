<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once('../../../config.php');
require_once($CFG->libdir.'/formslib.php');

$courseid = required_param('courseid', PARAM_INT);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_capability('local/confidence:submitconfidence', $context);

$PAGE->set_url('/local/confidence/student/index.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('myconfidence', 'local_confidence'));
$PAGE->set_heading($course->fullname);
$PAGE->set_pagelayout('incourse');

// Get user's scores
$scores = \local_confidence\score_manager::get_user_scores($USER->id, $courseid);
$avg_score = \local_confidence\score_manager::get_user_average($USER->id, $courseid);

echo $OUTPUT->header();

?>

<div class="local-confidence-student-view">
    <h2><?php echo get_string('myconfidence', 'local_confidence'); ?></h2>

    <?php if ($avg_score > 0): ?>
    <div class="alert alert-info">
        <strong><?php echo get_string('avgconfidence', 'local_confidence'); ?>:</strong>
        <?php echo $avg_score; ?> / 5.0
    </div>
    <?php endif; ?>

    <div class="concept-list">
        <?php if (empty($scores)): ?>
            <div class="alert alert-warning">
                <?php echo get_string('error:conceptnotfound', 'local_confidence'); ?>
            </div>
        <?php else: ?>
            <?php foreach ($scores as $concept): ?>
                <div class="concept-card card mb-3" data-conceptid="<?php echo $concept->id; ?>">
                    <div class="card-body">
                        <h3 class="card-title"><?php echo format_string($concept->conceptname); ?></h3>

                        <?php if (!empty($concept->description)): ?>
                            <p class="concept-description text-muted">
                                <?php echo format_text($concept->description); ?>
                            </p>
                        <?php endif; ?>

                        <!-- Star Rating -->
                        <div class="confidence-rating mb-3">
                            <label class="font-weight-bold">
                                <?php echo get_string('yourconfidence', 'local_confidence'); ?>:
                            </label>
                            <div class="star-rating" data-current-score="<?php echo $concept->score ?: 0; ?>">
                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <span class="star <?php echo ($concept->score && $i <= $concept->score) ? 'selected' : ''; ?>"
                                          data-value="<?php echo $i; ?>">★</span>
                                <?php endfor; ?>
                            </div>
                            <div class="score-labels d-flex justify-content-between small text-muted mt-1">
                                <span><?php echo get_string('score_verylow', 'local_confidence'); ?></span>
                                <span><?php echo get_string('score_low', 'local_confidence'); ?></span>
                                <span><?php echo get_string('score_medium', 'local_confidence'); ?></span>
                                <span><?php echo get_string('score_high', 'local_confidence'); ?></span>
                                <span><?php echo get_string('score_veryhigh', 'local_confidence'); ?></span>
                            </div>
                        </div>

                        <!-- Comment -->
                        <div class="confidence-comment mb-3">
                            <label>
                                <?php echo get_string('comment', 'local_confidence'); ?>
                                <small class="text-muted">(<?php echo get_string('optional', 'local_confidence'); ?>)</small>
                            </label>
                            <textarea class="form-control" rows="2"
                                      placeholder="<?php echo get_string('help:comment', 'local_confidence'); ?>"
                                      maxlength="500"><?php echo s($concept->comment); ?></textarea>
                            <small class="form-text text-muted">
                                <?php echo get_string('commenttoolong', 'local_confidence'); ?>
                            </small>
                        </div>

                        <button class="btn btn-primary btn-submit-confidence">
                            <?php echo get_string('saveconfidence', 'local_confidence'); ?>
                        </button>

                        <?php if ($concept->score): ?>
                            <div class="previous-score mt-2 small text-muted">
                                <?php echo get_string('previousscore', 'local_confidence'); ?>:
                                <?php echo $concept->score; ?> / 5
                                (<?php echo userdate($concept->timemodified, get_string('strftimedatetime')); ?>)
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<style>
.concept-card {
    border: 1px solid #ddd;
    transition: box-shadow 0.3s;
}

.concept-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.star-rating {
    font-size: 2em;
    cursor: pointer;
    user-select: none;
}

.star-rating .star {
    color: #ddd;
    transition: color 0.2s;
}

.star-rating .star.hover,
.star-rating .star.selected {
    color: #ffd700;
}

.score-labels {
    max-width: 400px;
    font-size: 0.75rem;
}

.confidence-comment textarea {
    resize: vertical;
}
</style>

<script>
require(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    // Star rating hover effect
    $('.star-rating .star').on('mouseenter', function() {
        var value = $(this).data('value');
        var $rating = $(this).parent();

        $rating.find('.star').each(function(index) {
            if (index < value) {
                $(this).addClass('hover');
            } else {
                $(this).removeClass('hover');
            }
        });
    });

    $('.star-rating').on('mouseleave', function() {
        $(this).find('.star').removeClass('hover');
    });

    // Star rating click
    $('.star-rating .star').on('click', function() {
        var value = $(this).data('value');
        var $rating = $(this).parent();

        $rating.find('.star').removeClass('selected');
        $rating.find('.star').each(function(index) {
            if (index < value) {
                $(this).addClass('selected');
            }
        });

        $rating.data('selected-score', value);
    });

    // Submit confidence score
    $('.btn-submit-confidence').on('click', function() {
        var $button = $(this);
        var $card = $button.closest('.concept-card');
        var conceptid = $card.data('conceptid');
        var score = $card.find('.star-rating').data('selected-score');
        var comment = $card.find('textarea').val();

        if (!score) {
            Notification.alert(
                '<?php echo get_string('error', 'moodle'); ?>',
                '<?php echo get_string('pleaseselectscore', 'local_confidence'); ?>',
                '<?php echo get_string('ok'); ?>'
            );
            return;
        }

        var $originalText = $button.text();
        $button.prop('disabled', true).text('<?php echo get_string('saving', 'admin'); ?>...');

        $.ajax({
            url: M.cfg.wwwroot + '/local/confidence/student/submit.php',
            type: 'POST',
            dataType: 'json',
            data: {
                sesskey: M.cfg.sesskey,
                courseid: <?php echo $courseid; ?>,
                conceptid: conceptid,
                score: score,
                comment: comment
            },
            success: function(response) {
                if (response.success) {
                    Notification.addNotification({
                        message: '<?php echo get_string('confidencesaved', 'local_confidence'); ?>',
                        type: 'success'
                    });

                    // Update previous score display
                    var now = new Date();
                    var dateStr = now.toLocaleString('<?php echo current_language(); ?>');

                    $card.find('.previous-score').remove();
                    $card.find('.card-body').append(
                        '<div class="previous-score mt-2 small text-muted">' +
                        '<?php echo get_string('previousscore', 'local_confidence'); ?>: ' +
                        score + ' / 5 (' + dateStr + ')' +
                        '</div>'
                    );
                } else {
                    Notification.alert(
                        '<?php echo get_string('error'); ?>',
                        response.message || '<?php echo get_string('error:savefailed', 'local_confidence'); ?>',
                        '<?php echo get_string('ok'); ?>'
                    );
                }
                $button.prop('disabled', false).text($originalText);
            },
            error: function() {
                Notification.alert(
                    '<?php echo get_string('error'); ?>',
                    '<?php echo get_string('error:savefailed', 'local_confidence'); ?>',
                    '<?php echo get_string('ok'); ?>'
                );
                $button.prop('disabled', false).text($originalText);
            }
        });
    });
});
</script>

<?php
echo $OUTPUT->footer();
