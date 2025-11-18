<?php
/**
 * Moodle Integration - Inject Vector Digest Display
 * This file should be included in Moodle's theme or question rendering
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Inject Vector Digest into question page
 * Call this from theme layout or question renderer
 */
function inject_vector_digest_display() {
    global $PAGE, $CFG;

    // Only inject on question attempt pages
    if (strpos($PAGE->pagetype, 'mod-quiz-') === false &&
        strpos($PAGE->pagetype, 'question-') === false) {
        return;
    }

    $base_url = $CFG->wwwroot . '/local/vector-digest';

    // Add CSS
    $PAGE->requires->css($base_url . '/frontend/css/smartphone-style.css');

    // Add JavaScript
    $PAGE->requires->js($base_url . '/frontend/js/vector-digest.js', true);

    // Add HTML at end of body
    $PAGE->requires->js_init_code(get_vector_digest_init_code());
}

/**
 * Get initialization code for Vector Digest
 */
function get_vector_digest_init_code() {
    return <<<'EOT'
(function() {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVectorDigest);
    } else {
        initVectorDigest();
    }

    function initVectorDigest() {
        // Create container if not exists
        if (!document.getElementById('vector-digest-smartphone')) {
            fetch('/local/vector-digest/frontend/smartphone-display.html')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const container = doc.getElementById('vector-digest-smartphone');

                    if (container) {
                        document.body.appendChild(container);

                        // Initialize Vector Digest
                        const questionId = getQuestionIdFromMoodle();
                        if (questionId) {
                            window.vectorDigest = new VectorDigest({
                                apiUrl: '/local/vector-digest/api/VectorDigestAPI.php',
                                questionId: questionId,
                                autoLoad: true
                            });
                        }
                    }
                })
                .catch(err => console.error('Vector Digest loading error:', err));
        }
    }

    function getQuestionIdFromMoodle() {
        // Method 1: From URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let qid = urlParams.get('q') || urlParams.get('questionid');

        // Method 2: From Moodle page data
        if (!qid && typeof M !== 'undefined' && M.core_question) {
            const slots = document.querySelectorAll('[data-slot]');
            if (slots.length > 0) {
                // Get first question slot
                const slotNum = slots[0].getAttribute('data-slot');
                const questionData = M.core_question.get_question_data(slotNum);
                if (questionData) {
                    qid = questionData.questionid;
                }
            }
        }

        // Method 3: From question div
        if (!qid) {
            const questionDiv = document.querySelector('.que[data-question-id]');
            if (questionDiv) {
                qid = questionDiv.getAttribute('data-question-id');
            }
        }

        // Method 4: From form input
        if (!qid) {
            const input = document.querySelector('input[name="questionid"]');
            if (input) {
                qid = input.value;
            }
        }

        return qid;
    }
})();
EOT;
}

/**
 * Hook into Moodle's question renderer
 * Add this to your theme's renderers.php or lib.php
 */
class theme_custom_core_question_renderer extends core_question_renderer {

    protected function formulation_and_controls(question_attempt $qa, question_display_options $options) {
        $output = parent::formulation_and_controls($qa, $options);

        // Add data attribute for question ID
        $question = $qa->get_question();
        $output = '<div data-question-id="' . $question->id . '" class="vector-digest-enabled">' .
                  $output . '</div>';

        return $output;
    }
}

/**
 * Alternative: Add to theme's footer
 * Put this in theme/yourtheme/layout/includes/footer.php
 */
function echo_vector_digest_footer() {
    global $CFG;
    $base_url = $CFG->wwwroot . '/local/vector-digest';

    echo <<<HTML
<!-- Vector Digest Integration -->
<link rel="stylesheet" href="{$base_url}/frontend/css/smartphone-style.css">
<script src="{$base_url}/frontend/js/vector-digest.js"></script>
<div id="vector-digest-container"></div>
<script>
(function() {
    fetch('{$base_url}/frontend/smartphone-display.html')
        .then(r => r.text())
        .then(html => {
            const container = document.getElementById('vector-digest-container');
            if (container) {
                container.innerHTML = html;
                const questionId = getQuestionIdFromMoodle();
                if (questionId) {
                    window.vectorDigest = new VectorDigest({
                        apiUrl: '{$base_url}/api/VectorDigestAPI.php',
                        questionId: questionId,
                        autoLoad: true
                    });
                }
            }
        });

    function getQuestionIdFromMoodle() {
        const urlParams = new URLSearchParams(window.location.search);
        let qid = urlParams.get('q') || urlParams.get('questionid');

        if (!qid) {
            const questionDiv = document.querySelector('.que[data-question-id]');
            if (questionDiv) qid = questionDiv.getAttribute('data-question-id');
        }

        if (!qid) {
            const input = document.querySelector('input[name="questionid"]');
            if (input) qid = input.value;
        }

        return qid;
    }
})();
</script>
HTML;
}
