<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

/**
 * Chance Mood block - Summarizes probability problems with emotional colors
 *
 * @package    block_chancemood
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_chancemood extends block_base {

    /**
     * Initialize block
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_chancemood');
    }

    /**
     * Allow multiple instances
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
     * Locations where block can be displayed
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'site' => true,
            'mod' => true,
            'my' => true
        );
    }

    /**
     * Get block content
     */
    public function get_content() {
        global $CFG, $COURSE, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass;
        $this->content->text = '';
        $this->content->footer = '';

        // Add JavaScript and CSS
        $PAGE->requires->js('/blocks/chancemood/js/smartphone_display.js');
        $PAGE->requires->css('/blocks/chancemood/styles/chancemood.css');

        // Get probability problems from course
        $problems = $this->get_probability_problems($COURSE->id);

        // Analyze and create mood summary
        $mood_data = $this->analyze_problems($problems);

        // Create smartphone display HTML
        $this->content->text = $this->render_smartphone_display($mood_data);

        return $this->content;
    }

    /**
     * Get probability/chance problems from Moodle database
     *
     * @param int $courseid Course ID
     * @return array Array of probability problems
     */
    private function get_probability_problems($courseid) {
        global $DB;

        $problems = array();

        try {
            // Query quiz questions related to probability/chance
            // Looking for questions with keywords: 확률, 경우의 수, probability, chance, combination, permutation
            $sql = "SELECT q.id, q.name, q.questiontext, q.qtype, qa.rightanswer, qa.fraction
                    FROM {question} q
                    LEFT JOIN {question_attempts} qa ON qa.questionid = q.id
                    JOIN {quiz_slots} qs ON qs.questionid = q.id
                    JOIN {quiz} qz ON qz.id = qs.quizid
                    WHERE qz.course = :courseid
                    AND (q.questiontext LIKE '%확률%'
                         OR q.questiontext LIKE '%경우의 수%'
                         OR q.questiontext LIKE '%probability%'
                         OR q.questiontext LIKE '%chance%'
                         OR q.questiontext LIKE '%조합%'
                         OR q.questiontext LIKE '%순열%'
                         OR q.name LIKE '%확률%'
                         OR q.name LIKE '%경우의 수%')
                    ORDER BY q.id DESC
                    LIMIT 50";

            $records = $DB->get_records_sql($sql, array('courseid' => $courseid));

            foreach ($records as $record) {
                $problems[] = array(
                    'id' => $record->id,
                    'name' => $record->name,
                    'text' => strip_tags($record->questiontext),
                    'type' => $record->qtype,
                    'answer' => isset($record->rightanswer) ? $record->rightanswer : null,
                    'success_rate' => isset($record->fraction) ? $record->fraction : 0.5
                );
            }

        } catch (Exception $e) {
            // Fallback: create sample data for demonstration
            $problems = $this->get_sample_problems();
        }

        return $problems;
    }

    /**
     * Get sample probability problems for demonstration
     *
     * @return array Sample problems
     */
    private function get_sample_problems() {
        return array(
            array(
                'id' => 1,
                'name' => '주사위 확률',
                'text' => '주사위를 두 번 던져서 합이 7이 나올 확률은?',
                'type' => 'multichoice',
                'answer' => '1/6',
                'success_rate' => 0.65
            ),
            array(
                'id' => 2,
                'name' => '카드 뽑기',
                'text' => '52장의 카드에서 하트를 뽑을 확률은?',
                'type' => 'numerical',
                'answer' => '1/4',
                'success_rate' => 0.82
            ),
            array(
                'id' => 3,
                'name' => '동전 던지기',
                'text' => '동전을 3번 던져서 모두 앞면이 나올 확률은?',
                'type' => 'multichoice',
                'answer' => '1/8',
                'success_rate' => 0.45
            ),
            array(
                'id' => 4,
                'name' => '구슬 뽑기',
                'text' => '빨간 구슬 3개, 파란 구슬 5개 중에서 빨간 구슬을 뽑을 확률은?',
                'type' => 'numerical',
                'answer' => '3/8',
                'success_rate' => 0.71
            )
        );
    }

    /**
     * Analyze problems and create emotional mood data
     *
     * @param array $problems Array of problems
     * @return object Mood analysis data
     */
    private function analyze_problems($problems) {
        $mood_data = new stdClass;
        $mood_data->problems = $problems;
        $mood_data->total = count($problems);
        $mood_data->emotions = array();

        if (empty($problems)) {
            $mood_data->overall_mood = 'neutral';
            $mood_data->overall_color = '#95a5a6';
            $mood_data->message = '문제 데이터가 없습니다.';
            return $mood_data;
        }

        // Calculate average success rate
        $total_success = 0;
        foreach ($problems as $problem) {
            $total_success += $problem['success_rate'];
        }
        $avg_success = $total_success / count($problems);

        // Assign emotional color based on difficulty/success rate
        foreach ($problems as $problem) {
            $emotion = $this->get_emotion_from_success_rate($problem['success_rate']);
            $mood_data->emotions[] = $emotion;
        }

        // Determine overall mood
        $mood_data->overall_mood = $this->get_emotion_from_success_rate($avg_success);
        $mood_data->overall_color = $this->get_color_from_emotion($mood_data->overall_mood);
        $mood_data->avg_success_rate = round($avg_success * 100, 1);
        $mood_data->message = $this->get_mood_message($mood_data->overall_mood, $avg_success);

        return $mood_data;
    }

    /**
     * Get emotion category from success rate
     *
     * @param float $success_rate Success rate (0-1)
     * @return string Emotion category
     */
    private function get_emotion_from_success_rate($success_rate) {
        if ($success_rate >= 0.8) {
            return 'joy';        // 기쁨 - 쉬운 문제
        } else if ($success_rate >= 0.6) {
            return 'confidence'; // 자신감 - 적당한 문제
        } else if ($success_rate >= 0.4) {
            return 'challenge';  // 도전 - 어려운 문제
        } else if ($success_rate >= 0.2) {
            return 'struggle';   // 고군분투 - 매우 어려운 문제
        } else {
            return 'frustration'; // 좌절 - 극도로 어려운 문제
        }
    }

    /**
     * Get color from emotion category
     *
     * @param string $emotion Emotion category
     * @return string Hex color code
     */
    private function get_color_from_emotion($emotion) {
        $colors = array(
            'joy' => '#2ecc71',        // 밝은 초록 - 기쁨
            'confidence' => '#3498db',  // 파란색 - 자신감
            'challenge' => '#f39c12',   // 주황색 - 도전
            'struggle' => '#e67e22',    // 진한 주황 - 고군분투
            'frustration' => '#e74c3c', // 빨간색 - 좌절
            'neutral' => '#95a5a6'      // 회색 - 중립
        );

        return isset($colors[$emotion]) ? $colors[$emotion] : $colors['neutral'];
    }

    /**
     * Get mood message based on emotion
     *
     * @param string $mood Mood category
     * @param float $avg_success Average success rate
     * @return string Message
     */
    private function get_mood_message($mood, $avg_success) {
        $messages = array(
            'joy' => '훌륭해요! 경우의 수 문제를 잘 이해하고 있어요! 🎉',
            'confidence' => '좋아요! 꾸준히 실력이 향상되고 있어요! 💪',
            'challenge' => '도전하는 중이에요. 조금만 더 노력하면 돼요! 🎯',
            'struggle' => '어려운 문제들이네요. 기초부터 다시 복습해봐요! 📚',
            'frustration' => '힘들 수 있어요. 선생님께 도움을 요청해보세요! 🆘',
            'neutral' => '경우의 수 학습 현황을 확인하세요. 📊'
        );

        $message = isset($messages[$mood]) ? $messages[$mood] : $messages['neutral'];
        $message .= sprintf(' (성공률: %.1f%%)', $avg_success * 100);

        return $message;
    }

    /**
     * Render smartphone display HTML
     *
     * @param object $mood_data Mood analysis data
     * @return string HTML content
     */
    private function render_smartphone_display($mood_data) {
        $color = $mood_data->overall_color;
        $message = $mood_data->message;
        $total = $mood_data->total;

        $html = <<<HTML
        <div id="chancemood-container">
            <div class="smartphone-frame">
                <div class="smartphone-screen">
                    <div class="mood-header" style="background-color: {$color};">
                        <h3>Chance Mood</h3>
                        <p class="mood-subtitle">경우의 수 학습 현황</p>
                    </div>
                    <div class="mood-content">
                        <div class="mood-emoji">
                            {$this->get_mood_emoji($mood_data->overall_mood)}
                        </div>
                        <div class="mood-message">
                            {$message}
                        </div>
                        <div class="mood-stats">
                            <div class="stat-item">
                                <span class="stat-label">분석된 문제</span>
                                <span class="stat-value">{$total}개</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">평균 성공률</span>
                                <span class="stat-value">{$mood_data->avg_success_rate}%</span>
                            </div>
                        </div>
                        <div class="mood-chart">
                            {$this->render_emotion_chart($mood_data)}
                        </div>
                    </div>
                </div>
                <div class="smartphone-button"></div>
            </div>
        </div>
HTML;

        return $html;
    }

    /**
     * Get emoji for mood
     *
     * @param string $mood Mood category
     * @return string Emoji
     */
    private function get_mood_emoji($mood) {
        $emojis = array(
            'joy' => '😊',
            'confidence' => '😎',
            'challenge' => '🤔',
            'struggle' => '😰',
            'frustration' => '😫',
            'neutral' => '😐'
        );

        return isset($emojis[$mood]) ? $emojis[$mood] : $emojis['neutral'];
    }

    /**
     * Render emotion distribution chart
     *
     * @param object $mood_data Mood data
     * @return string HTML for chart
     */
    private function render_emotion_chart($mood_data) {
        if (empty($mood_data->emotions)) {
            return '<p class="no-data">차트 데이터가 없습니다.</p>';
        }

        // Count emotions
        $emotion_counts = array_count_values($mood_data->emotions);

        $html = '<div class="emotion-chart">';
        $html .= '<h4>감정 분포</h4>';
        $html .= '<div class="chart-bars">';

        $emotion_labels = array(
            'joy' => '기쁨',
            'confidence' => '자신감',
            'challenge' => '도전',
            'struggle' => '고군분투',
            'frustration' => '좌절'
        );

        foreach ($emotion_counts as $emotion => $count) {
            $percentage = round(($count / $mood_data->total) * 100, 1);
            $color = $this->get_color_from_emotion($emotion);
            $label = isset($emotion_labels[$emotion]) ? $emotion_labels[$emotion] : $emotion;

            $html .= <<<CHART
            <div class="chart-bar-wrapper">
                <span class="chart-label">{$label}</span>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: {$percentage}%; background-color: {$color};"></div>
                </div>
                <span class="chart-value">{$count}</span>
            </div>
CHART;
        }

        $html .= '</div></div>';

        return $html;
    }
}
