<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Renderable class for displaying cognitive load tips
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_cognitiveloadtips\output;

defined('MOODLE_INTERNAL') || die();

use renderable;
use renderer_base;
use templatable;
use stdClass;

/**
 * Class containing data for tip display
 */
class tip_display implements renderable, templatable {

    /** @var array Tips to display */
    protected $tips;

    /** @var bool Allow skip */
    protected $allowskip;

    /** @var int Question ID */
    protected $questionid;

    /** @var int Quiz ID */
    protected $quizid;

    /** @var int Difficulty level */
    protected $difficulty;

    /**
     * Constructor
     *
     * @param array $tips Array of tip objects
     * @param bool $allowskip Allow user to skip
     * @param int $questionid Question ID
     * @param int $quizid Quiz ID
     * @param int $difficulty Difficulty level
     */
    public function __construct($tips, $allowskip = true, $questionid = null, $quizid = null, $difficulty = 3) {
        $this->tips = $tips;
        $this->allowskip = $allowskip;
        $this->questionid = $questionid;
        $this->quizid = $quizid;
        $this->difficulty = $difficulty;
    }

    /**
     * Export data for template
     *
     * @param renderer_base $output
     * @return stdClass
     */
    public function export_for_template(renderer_base $output) {
        global $CFG;

        $data = new stdClass();
        $data->tips = array();
        $data->allowskip = $this->allowskip;
        $data->questionid = $this->questionid;
        $data->quizid = $this->quizid;
        $data->difficulty = $this->difficulty;
        $data->difficulty_stars = str_repeat('★', $this->difficulty) . str_repeat('☆', 5 - $this->difficulty);

        foreach ($this->tips as $tip) {
            $tipdata = new stdClass();
            $tipdata->id = $tip->id;
            $tipdata->title = format_string($tip->title);
            $tipdata->content = format_text($tip->content, FORMAT_PLAIN);
            $tipdata->category = $tip->category;
            $tipdata->duration = $tip->display_duration;
            $tipdata->is_mandatory = $tip->is_mandatory;

            // Category icon
            switch ($tip->category) {
                case 'breathing':
                    $tipdata->icon = '🫁';
                    $tipdata->category_name = get_string('category_breathing', 'local_cognitiveloadtips');
                    break;
                case 'focus':
                    $tipdata->icon = '🎯';
                    $tipdata->category_name = get_string('category_focus', 'local_cognitiveloadtips');
                    break;
                case 'strategy':
                    $tipdata->icon = '📝';
                    $tipdata->category_name = get_string('category_strategy', 'local_cognitiveloadtips');
                    break;
                case 'mindset':
                    $tipdata->icon = '💪';
                    $tipdata->category_name = get_string('category_mindset', 'local_cognitiveloadtips');
                    break;
                default:
                    $tipdata->icon = '💡';
                    $tipdata->category_name = get_string('category_general', 'local_cognitiveloadtips');
            }

            $data->tips[] = $tipdata;
        }

        $data->hasmultipletips = count($data->tips) > 1;
        $data->wwwroot = $CFG->wwwroot;

        return $data;
    }
}
