<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Post installation hook for adding default cognitive load tips
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Post installation procedure
 */
function xmldb_local_cognitiveloadtips_install() {
    global $DB;

    $time = time();

    // Default Korean cognitive load tips
    $default_tips_ko = array(
        array(
            'title' => '심호흡하기',
            'content' => '어려운 문제를 풀기 전에 깊게 숨을 들이쉬고 천천히 내쉬세요. 3회 반복하면 집중력이 높아집니다.',
            'category' => 'breathing',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 1,
        ),
        array(
            'title' => '문제 천천히 읽기',
            'content' => '문제를 최소 2번 이상 천천히 읽으세요. 중요한 숫자나 조건을 놓치지 않도록 주의하세요.',
            'category' => 'strategy',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 2,
        ),
        array(
            'title' => '그림으로 시각화하기',
            'content' => '복잡한 문제는 간단한 그림이나 도표로 나타내보세요. 시각적으로 표현하면 이해가 쉬워집니다.',
            'category' => 'strategy',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 15,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 3,
        ),
        array(
            'title' => '단계별로 나누기',
            'content' => '어려운 문제는 작은 단계로 나누어 하나씩 해결하세요. 한 번에 모든 것을 해결하려고 하지 마세요.',
            'category' => 'strategy',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 4,
        ),
        array(
            'title' => '알고 있는 것 정리하기',
            'content' => '문제에서 주어진 정보와 구해야 하는 것을 먼저 정리하세요. 무엇을 알고 무엇을 모르는지 명확히 하세요.',
            'category' => 'strategy',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 5,
        ),
        array(
            'title' => '잠시 휴식하기',
            'content' => '막혔다면 잠시 눈을 감고 쉬세요. 5초만 쉬어도 새로운 아이디어가 떠오를 수 있습니다.',
            'category' => 'focus',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 6,
        ),
        array(
            'title' => '긍정적으로 생각하기',
            'content' => '"나는 이 문제를 풀 수 있다"고 스스로에게 말하세요. 긍정적인 마음가짐이 문제 해결에 도움이 됩니다.',
            'category' => 'mindset',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'ko',
            'sortorder' => 7,
        ),
    );

    // Default English cognitive load tips
    $default_tips_en = array(
        array(
            'title' => 'Take Deep Breaths',
            'content' => 'Before solving a difficult problem, take a deep breath in and slowly exhale. Repeat 3 times to improve focus.',
            'category' => 'breathing',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 1,
        ),
        array(
            'title' => 'Read Slowly',
            'content' => 'Read the problem at least twice carefully. Pay attention to important numbers and conditions.',
            'category' => 'strategy',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 2,
        ),
        array(
            'title' => 'Visualize with Drawings',
            'content' => 'Draw simple pictures or diagrams for complex problems. Visual representation makes understanding easier.',
            'category' => 'strategy',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 15,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 3,
        ),
        array(
            'title' => 'Break Into Steps',
            'content' => 'Divide difficult problems into smaller steps and solve one at a time. Don\'t try to solve everything at once.',
            'category' => 'strategy',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 4,
        ),
        array(
            'title' => 'Organize What You Know',
            'content' => 'First, organize the given information and what you need to find. Clarify what you know and don\'t know.',
            'category' => 'strategy',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 12,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 5,
        ),
        array(
            'title' => 'Take a Short Break',
            'content' => 'If you\'re stuck, close your eyes and rest briefly. Even 5 seconds can bring new ideas.',
            'category' => 'focus',
            'difficulty_min' => 4,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 6,
        ),
        array(
            'title' => 'Think Positively',
            'content' => 'Tell yourself "I can solve this problem". A positive mindset helps with problem-solving.',
            'category' => 'mindset',
            'difficulty_min' => 3,
            'difficulty_max' => 5,
            'display_duration' => 10,
            'is_mandatory' => 0,
            'language' => 'en',
            'sortorder' => 7,
        ),
    );

    // Insert Korean tips
    foreach ($default_tips_ko as $tip) {
        $tip['enabled'] = 1;
        $tip['timecreated'] = $time;
        $tip['timemodified'] = $time;
        $DB->insert_record('local_clt_tips', $tip);
    }

    // Insert English tips
    foreach ($default_tips_en as $tip) {
        $tip['enabled'] = 1;
        $tip['timecreated'] = $time;
        $tip['timemodified'] = $time;
        $DB->insert_record('local_clt_tips', $tip);
    }

    return true;
}
