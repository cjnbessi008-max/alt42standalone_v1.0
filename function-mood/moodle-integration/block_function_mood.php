<?php
/**
 * Moodle Block Plugin for Function Mood
 * This block can be added to Moodle courses to embed Function Mood visualization
 *
 * Installation:
 * 1. Copy this file to: moodle/blocks/function_mood/block_function_mood.php
 * 2. Create version.php in the same directory
 * 3. Install the plugin through Moodle admin interface
 *
 * Compatible with Moodle 3.7
 */

defined('MOODLE_INTERNAL') || die();

class block_function_mood extends block_base {

    /**
     * Initialize the block
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_function_mood');
    }

    /**
     * Allow multiple instances per page
     */
    public function instance_allow_multiple() {
        return false;
    }

    /**
     * Has config
     */
    public function has_config() {
        return true;
    }

    /**
     * Applicable formats
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'mod' => true,
            'my' => true
        );
    }

    /**
     * Get the content of the block
     */
    public function get_content() {
        global $CFG, $COURSE, $USER;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        // Get Function Mood base URL from config
        $functionmood_url = get_config('block_function_mood', 'base_url');

        if (empty($functionmood_url)) {
            $this->content->text = html_writer::div(
                'Function Mood URL이 설정되지 않았습니다. 관리자에게 문의하세요.',
                'alert alert-warning'
            );
            return $this->content;
        }

        // Get current course ID
        $courseid = $COURSE->id;

        // Build iframe embed code
        $iframe_url = $functionmood_url . '/index.html?course=' . $courseid . '&user=' . $USER->id;

        $iframe = html_writer::tag('iframe', '', array(
            'src' => $iframe_url,
            'width' => '100%',
            'height' => '600',
            'frameborder' => '0',
            'style' => 'border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
        ));

        // Sync button
        $sync_button = html_writer::tag('button', '문제 동기화', array(
            'class' => 'btn btn-primary',
            'onclick' => "syncFunctionMood($courseid)",
            'style' => 'margin-bottom: 10px;'
        ));

        // JavaScript for sync
        $script = html_writer::script("
            function syncFunctionMood(courseId) {
                fetch('$functionmood_url/api/index.php?path=sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_id: courseId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('동기화 완료: ' + data.sync_result.imported + '개 문제 가져옴');
                        location.reload();
                    } else {
                        alert('동기화 실패: ' + data.error);
                    }
                })
                .catch(error => {
                    alert('오류: ' + error.message);
                });
            }
        ");

        $this->content->text = $sync_button . $iframe . $script;

        return $this->content;
    }

    /**
     * Serialize and store config data
     */
    public function instance_config_save($data, $nolongerused = false) {
        parent::instance_config_save($data, $nolongerused);
    }
}
