<?php
/**
 * AI Evaluator for problem explanations using Claude API
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_problemexplain;

defined('MOODLE_INTERNAL') || die();

/**
 * Class to handle AI evaluation of student explanations
 */
class ai_evaluator {

    /** @var string Claude API endpoint */
    private $api_endpoint = 'https://api.anthropic.com/v1/messages';

    /** @var string API version */
    private $api_version = '2023-06-01';

    /**
     * Evaluate a submission using AI
     *
     * @param int $submission_id Submission ID
     * @param stdClass $problemexplain Problem explanation instance
     * @return stdClass|false Evaluation results or false on failure
     */
    public function evaluate_submission($submission_id, $problemexplain) {
        global $DB, $CFG;

        // Get API key from config
        $api_key = get_config('problemexplain', 'claude_api_key');
        if (empty($api_key)) {
            debugging('Claude API key not configured', DEBUG_DEVELOPER);
            return false;
        }

        // Get submission and steps
        $submission = $DB->get_record('problemexplain_submissions', array('id' => $submission_id));
        if (!$submission) {
            return false;
        }

        $steps = $DB->get_records('problemexplain_steps',
            array('submission_id' => $submission_id),
            'step_number ASC'
        );

        // Build prompt for AI evaluation
        $prompt = $this->build_evaluation_prompt($problemexplain, $submission, $steps);

        // Call Claude API
        $response = $this->call_claude_api($api_key, $prompt);

        if (!$response) {
            debugging('Failed to get AI evaluation response', DEBUG_DEVELOPER);
            return false;
        }

        // Parse response and save evaluation
        $evaluation = $this->parse_evaluation_response($response);

        if ($evaluation) {
            $eval_record = new \stdClass();
            $eval_record->submission_id = $submission_id;
            $eval_record->clarity_score = $evaluation['clarity_score'];
            $eval_record->completeness_score = $evaluation['completeness_score'];
            $eval_record->accuracy_score = $evaluation['accuracy_score'];
            $eval_record->pedagogy_score = $evaluation['pedagogy_score'];
            $eval_record->overall_score = $evaluation['overall_score'];
            $eval_record->feedback_text = $evaluation['feedback_text'];
            $eval_record->suggestions = $evaluation['suggestions'];
            $eval_record->ai_model = 'claude-3-sonnet-20240229';
            $eval_record->timecreated = time();

            // Check if evaluation already exists
            $existing = $DB->get_record('problemexplain_ai_eval', array('submission_id' => $submission_id));
            if ($existing) {
                $eval_record->id = $existing->id;
                $DB->update_record('problemexplain_ai_eval', $eval_record);
            } else {
                $eval_record->id = $DB->insert_record('problemexplain_ai_eval', $eval_record);
            }

            return $eval_record;
        }

        return false;
    }

    /**
     * Build evaluation prompt for Claude API
     *
     * @param stdClass $problemexplain Problem explanation instance
     * @param stdClass $submission Submission record
     * @param array $steps Array of step records
     * @return string Prompt text
     */
    private function build_evaluation_prompt($problemexplain, $submission, $steps) {
        $prompt = <<<EOD
You are an expert mathematics education evaluator. Your task is to evaluate a student's explanation of a problem, assessing how well they could teach this concept to others.

## Problem Being Explained:
{$problemexplain->problem_text}

Problem Type: {$problemexplain->problem_type}

## Student's Explanation:
Title: {$submission->explanation_title}

EOD;

        // Add each step
        $stepnum = 1;
        foreach ($steps as $step) {
            $prompt .= "\nStep {$stepnum}: {$step->step_title}\n";
            $prompt .= "Explanation: {$step->step_explanation}\n";
            if (!empty($step->step_reasoning)) {
                $prompt .= "Reasoning: {$step->step_reasoning}\n";
            }
            $stepnum++;
        }

        $prompt .= <<<EOD


## Evaluation Criteria:

Evaluate the student's explanation on these four dimensions (0-100 scale):

1. **Clarity Score (0-100)**: How clear and understandable is the explanation?
   - Are technical terms explained?
   - Is the language accessible to someone learning this concept?
   - Are the steps logically organized?

2. **Completeness Score (0-100)**: Does the explanation cover all necessary aspects?
   - Are all key steps included?
   - Are there any gaps in the reasoning?
   - Would someone be able to replicate this solution?

3. **Accuracy Score (0-100)**: Is the explanation mathematically correct?
   - Are the calculations correct?
   - Are the concepts explained accurately?
   - Are there any misconceptions?

4. **Pedagogy Score (0-100)**: How effective is this as a teaching tool?
   - Does it explain WHY, not just HOW?
   - Does it use examples or analogies?
   - Would this help someone truly understand, not just memorize?

## Response Format:

Provide your evaluation in the following JSON format:

```json
{
    "clarity_score": <number 0-100>,
    "completeness_score": <number 0-100>,
    "accuracy_score": <number 0-100>,
    "pedagogy_score": <number 0-100>,
    "overall_score": <number 0-100>,
    "feedback_text": "<2-3 sentences of positive feedback on what the student did well>",
    "suggestions": "<3-5 specific, actionable suggestions for improvement>"
}
```

The overall_score should be a weighted average:
- Clarity: 25%
- Completeness: 25%
- Accuracy: 30%
- Pedagogy: 20%

Be encouraging but honest. Focus on helping the student improve their teaching skills.
EOD;

        return $prompt;
    }

    /**
     * Call Claude API
     *
     * @param string $api_key API key
     * @param string $prompt Prompt text
     * @return string|false Response or false on failure
     */
    private function call_claude_api($api_key, $prompt) {
        $data = array(
            'model' => 'claude-3-sonnet-20240229',
            'max_tokens' => 2000,
            'messages' => array(
                array(
                    'role' => 'user',
                    'content' => $prompt
                )
            )
        );

        $ch = curl_init($this->api_endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'x-api-key: ' . $api_key,
            'anthropic-version: ' . $this->api_version
        ));

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code != 200) {
            debugging('Claude API returned HTTP ' . $http_code . ': ' . $response, DEBUG_DEVELOPER);
            return false;
        }

        return $response;
    }

    /**
     * Parse evaluation response from Claude API
     *
     * @param string $response API response JSON
     * @return array|false Parsed evaluation or false on failure
     */
    private function parse_evaluation_response($response) {
        $data = json_decode($response, true);

        if (!$data || !isset($data['content'][0]['text'])) {
            return false;
        }

        $text = $data['content'][0]['text'];

        // Extract JSON from response (it might be wrapped in markdown code blocks)
        if (preg_match('/```json\s*(.*?)\s*```/s', $text, $matches)) {
            $json_text = $matches[1];
        } else if (preg_match('/\{.*\}/s', $text, $matches)) {
            $json_text = $matches[0];
        } else {
            return false;
        }

        $evaluation = json_decode($json_text, true);

        if (!$evaluation) {
            return false;
        }

        // Validate required fields
        $required = array('clarity_score', 'completeness_score', 'accuracy_score',
                         'pedagogy_score', 'overall_score', 'feedback_text', 'suggestions');

        foreach ($required as $field) {
            if (!isset($evaluation[$field])) {
                return false;
            }
        }

        return $evaluation;
    }
}
