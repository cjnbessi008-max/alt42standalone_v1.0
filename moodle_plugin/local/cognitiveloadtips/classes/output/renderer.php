<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Renderer for cognitive load tips
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_cognitiveloadtips\output;

defined('MOODLE_INTERNAL') || die();

use plugin_renderer_base;

/**
 * Renderer class for cognitive load tips
 */
class renderer extends plugin_renderer_base {

    /**
     * Render tip display
     *
     * @param tip_display $tipdisplay
     * @return string HTML
     */
    protected function render_tip_display(tip_display $tipdisplay) {
        $data = $tipdisplay->export_for_template($this);
        return $this->render_from_template('local_cognitiveloadtips/tip_display', $data);
    }
}
