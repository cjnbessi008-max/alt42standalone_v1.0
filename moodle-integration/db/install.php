<?php
/**
 * Post-installation script for Thinking Routine Consistency block
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Post installation procedure
 *
 * @return bool Success/Failure
 */
function xmldb_block_thinkroutine_consistency_install() {
    global $DB;

    $time = time();

    // Insert default thinking routine patterns
    $patterns = [
        [
            'name' => 'Problem Decomposition',
            'description' => 'Breaking complex problems into smaller, manageable parts',
            'category' => 'problem_solving',
            'expected_steps' => json_encode([
                'identify_problem',
                'break_into_parts',
                'solve_subproblems',
                'combine_solutions',
                'verify_solution'
            ]),
            'weight' => 1.0,
        ],
        [
            'name' => 'Visual Representation',
            'description' => 'Creating diagrams or visual models to understand concepts',
            'category' => 'visualization',
            'expected_steps' => json_encode([
                'read_problem',
                'create_diagram',
                'label_elements',
                'analyze_visual',
                'solve_using_visual'
            ]),
            'weight' => 1.0,
        ],
        [
            'name' => 'Systematic Checking',
            'description' => 'Verifying solutions through organized review',
            'category' => 'reasoning',
            'expected_steps' => json_encode([
                'complete_solution',
                'check_calculation',
                'verify_logic',
                'test_edge_cases',
                'confirm_answer'
            ]),
            'weight' => 0.8,
        ],
        [
            'name' => 'Pattern Recognition',
            'description' => 'Identifying recurring structures or relationships',
            'category' => 'reasoning',
            'expected_steps' => json_encode([
                'observe_examples',
                'identify_similarities',
                'formulate_pattern',
                'test_pattern',
                'apply_pattern'
            ]),
            'weight' => 1.2,
        ],
        [
            'name' => 'Self-Reflection',
            'description' => 'Thinking about your own thinking process',
            'category' => 'metacognition',
            'expected_steps' => json_encode([
                'review_approach',
                'identify_strengths',
                'identify_challenges',
                'plan_improvements',
                'apply_learnings'
            ]),
            'weight' => 0.9,
        ],
    ];

    foreach ($patterns as $pattern) {
        $pattern['timecreated'] = $time;
        $pattern['timemodified'] = $time;
        $DB->insert_record('block_trc_patterns', (object)$pattern);
    }

    return true;
}
