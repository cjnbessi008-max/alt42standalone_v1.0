<?php
/**
 * AI Service for Solution Generation
 * Uses Anthropic Claude API
 */

require_once __DIR__ . '/../../config/app.php';

class AIService {
    private $apiKey;
    private $model;
    private $maxTokens;
    private $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct() {
        $this->apiKey = AI_API_KEY;
        $this->model = AI_MODEL;
        $this->maxTokens = AI_MAX_TOKENS;

        if (empty($this->apiKey)) {
            throw new Exception('AI API key not configured');
        }
    }

    /**
     * Generate correct and incorrect solutions for a problem
     */
    public function generateSolutions($problemData, $mistakeType = null) {
        $prompt = $this->buildSolutionPrompt($problemData, $mistakeType);

        $response = $this->callClaudeAPI($prompt);

        return $this->parseSolutionResponse($response);
    }

    /**
     * Build prompt for solution generation
     */
    private function buildSolutionPrompt($problemData, $mistakeType = null) {
        $mistakeInstruction = $mistakeType
            ? "Generate an incorrect solution with this specific mistake type: {$mistakeType}"
            : "Generate an incorrect solution with a common student mistake";

        $prompt = <<<PROMPT
You are an expert mathematics teacher specializing in pedagogical error analysis. Your task is to generate TWO solutions for the given problem:

1. A CORRECT solution (step-by-step, clear, pedagogically sound)
2. An INCORRECT solution (containing a common student mistake that looks plausible)

**Problem Details:**
Title: {$problemData['title']}
Description: {$problemData['description']}
Subject: {$problemData['subject']}
Grade Level: {$problemData['grade_level']}
Difficulty: {$problemData['difficulty_level']}

**Instructions for CORRECT solution:**
- Provide clear, logical steps
- Use proper mathematical notation
- Include explanations for each step
- Arrive at the correct answer

**Instructions for INCORRECT solution:**
{$mistakeInstruction}
- Make the mistake subtle and realistic (what students actually do)
- The mistake should be in the PROCESS, not obvious at first glance
- Explain what mistake was made and why it's wrong

**Common mistake types to consider:**
- Sign errors (negative/positive confusion)
- Order of operations (PEMDAS/BODMAS violations)
- Fraction operations (adding denominators, etc.)
- Exponent rules (incorrect distribution)
- Division by zero
- Conceptual misunderstandings

**Output format (JSON):**
```json
{
  "correct_solution": {
    "title": "Correct Solution",
    "steps": [
      {"step_number": 1, "description": "...", "calculation": "...", "result": "..."},
      {"step_number": 2, "description": "...", "calculation": "...", "result": "..."}
    ],
    "final_answer": "...",
    "explanation": "Why this solution is correct..."
  },
  "incorrect_solution": {
    "title": "Solution with [Mistake Type]",
    "steps": [
      {"step_number": 1, "description": "...", "calculation": "...", "result": "...", "error": "optional error marker"},
      {"step_number": 2, "description": "...", "calculation": "...", "result": "..."}
    ],
    "final_answer": "...",
    "mistake_type": "Sign Error|Order of Operations|Fraction Addition|etc.",
    "mistake_description": "Brief description of what went wrong",
    "explanation": "Detailed explanation of why this is incorrect and how to fix it"
  }
}
```

Generate the solutions now:
PROMPT;

        return $prompt;
    }

    /**
     * Call Claude API
     */
    private function callClaudeAPI($prompt, $systemPrompt = null) {
        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey,
            'anthropic-version: 2023-06-01'
        ];

        $data = [
            'model' => $this->model,
            'max_tokens' => $this->maxTokens,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ];

        if ($systemPrompt) {
            $data['system'] = $systemPrompt;
        }

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("API request failed: {$error}");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("API returned error code {$httpCode}: {$response}");
        }

        $decoded = json_decode($response, true);

        if (!isset($decoded['content'][0]['text'])) {
            throw new Exception("Invalid API response format");
        }

        return $decoded['content'][0]['text'];
    }

    /**
     * Parse solution response from Claude
     */
    private function parseSolutionResponse($response) {
        // Extract JSON from markdown code blocks if present
        if (preg_match('/```json\s*(.*?)\s*```/s', $response, $matches)) {
            $jsonString = $matches[1];
        } elseif (preg_match('/```\s*(.*?)\s*```/s', $response, $matches)) {
            $jsonString = $matches[1];
        } else {
            $jsonString = $response;
        }

        $data = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Failed to parse AI response: " . json_last_error_msg());
        }

        if (!isset($data['correct_solution']) || !isset($data['incorrect_solution'])) {
            throw new Exception("Invalid solution format from AI");
        }

        return [
            'correct' => $data['correct_solution'],
            'incorrect' => $data['incorrect_solution']
        ];
    }

    /**
     * Generate explanation for why a solution is incorrect
     */
    public function generateExplanation($incorrectSolution, $correctSolution, $problemData) {
        $prompt = <<<PROMPT
You are a patient mathematics teacher explaining to a student why their solution is incorrect.

**Problem:** {$problemData['title']}
{$problemData['description']}

**Student's Incorrect Approach:**
{$this->formatSolutionForPrompt($incorrectSolution)}

**Correct Approach:**
{$this->formatSolutionForPrompt($correctSolution)}

**Task:** Generate a supportive, educational explanation that:
1. Identifies where the mistake occurred
2. Explains WHY it's incorrect
3. Shows the correct approach
4. Provides tips to avoid this mistake in the future

Keep the tone encouraging and educational. The student should feel they can learn from this mistake.

Format your response as a clear, well-structured explanation (plain text, no JSON).
PROMPT;

        return $this->callClaudeAPI($prompt);
    }

    /**
     * Format solution for prompt
     */
    private function formatSolutionForPrompt($solution) {
        $formatted = "Title: {$solution['title']}\n";
        $formatted .= "Steps:\n";

        foreach ($solution['steps'] as $step) {
            $formatted .= "  {$step['step_number']}. {$step['description']}\n";
            if (isset($step['calculation'])) {
                $formatted .= "     Calculation: {$step['calculation']}\n";
            }
            if (isset($step['result'])) {
                $formatted .= "     Result: {$step['result']}\n";
            }
        }

        $formatted .= "Final Answer: {$solution['final_answer']}\n";

        return $formatted;
    }

    /**
     * Generate hints for a problem
     */
    public function generateHints($problemData, $difficulty = 'medium') {
        $prompt = <<<PROMPT
Generate progressive hints for this mathematics problem. Hints should gradually guide the student without giving away the answer.

**Problem:** {$problemData['title']}
{$problemData['description']}

Generate 3 hints:
1. Hint 1: General approach (very subtle)
2. Hint 2: More specific guidance
3. Hint 3: Almost gives the method (but not the answer)

Return as JSON array:
```json
{
  "hints": [
    {"level": 1, "text": "..."},
    {"level": 2, "text": "..."},
    {"level": 3, "text": "..."}
  ]
}
```
PROMPT;

        $response = $this->callClaudeAPI($prompt);

        // Parse JSON response
        if (preg_match('/```json\s*(.*?)\s*```/s', $response, $matches)) {
            $jsonString = $matches[1];
        } else {
            $jsonString = $response;
        }

        $data = json_decode($jsonString, true);

        return $data['hints'] ?? [];
    }
}
