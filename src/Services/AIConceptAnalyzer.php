<?php

namespace App\Services;

use App\Models\Concept;
use App\Models\ConceptKeyword;
use App\Models\AIAnalysisLog;

/**
 * AI-based Concept Analyzer
 * Analyzes problem text and suggests relevant concepts
 */
class AIConceptAnalyzer
{
    private $stopWords = ['은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '도', '만', '까지', '부터', '에서'];

    /**
     * Analyze problem text and suggest concepts
     *
     * @param string $text Problem title + content
     * @param string $subject Subject filter (optional)
     * @return array Suggested concepts with confidence scores
     */
    public function analyzeProblem(string $text, ?string $subject = null): array
    {
        $startTime = microtime(true);

        // Method 1: Keyword-based matching (default)
        $suggestions = $this->keywordBasedAnalysis($text, $subject);

        // Method 2: OpenAI API (if configured)
        if (!empty($_ENV['OPENAI_API_KEY'])) {
            $aiSuggestions = $this->openAIAnalysis($text, $subject);
            $suggestions = $this->mergeSuggestions($suggestions, $aiSuggestions);
        }

        $processingTime = round((microtime(true) - $startTime) * 1000); // ms

        // Sort by confidence score (descending)
        usort($suggestions, function($a, $b) {
            return $b['confidence'] <=> $a['confidence'];
        });

        // Take top 5
        $suggestions = array_slice($suggestions, 0, 5);

        return [
            'suggestions' => $suggestions,
            'processing_time' => $processingTime,
            'method' => !empty($_ENV['OPENAI_API_KEY']) ? 'hybrid' : 'keyword',
        ];
    }

    /**
     * Keyword-based concept analysis
     */
    private function keywordBasedAnalysis(string $text, ?string $subject): array
    {
        // Tokenize and clean text
        $tokens = $this->tokenize($text);

        // Get all concept keywords
        $query = ConceptKeyword::with('concept');

        if ($subject) {
            $query->whereHas('concept', function($q) use ($subject) {
                $q->where('subject', $subject)->where('is_active', true);
            });
        } else {
            $query->whereHas('concept', function($q) {
                $q->where('is_active', true);
            });
        }

        $allKeywords = $query->get();

        // Calculate TF-IDF scores
        $conceptScores = [];

        foreach ($allKeywords as $kw) {
            $keyword = $kw->keyword;
            $conceptId = $kw->concept_id;

            // Count keyword occurrences in text
            $frequency = 0;
            foreach ($tokens as $token) {
                if (mb_stripos($token, $keyword) !== false || mb_stripos($keyword, $token) !== false) {
                    $frequency++;
                }
            }

            if ($frequency > 0) {
                $score = $frequency * $kw->weight;

                if (!isset($conceptScores[$conceptId])) {
                    $conceptScores[$conceptId] = [
                        'concept' => $kw->concept,
                        'score' => 0,
                        'matched_keywords' => [],
                    ];
                }

                $conceptScores[$conceptId]['score'] += $score;
                $conceptScores[$conceptId]['matched_keywords'][] = $keyword;
            }
        }

        // Normalize scores to 0-1 range
        if (!empty($conceptScores)) {
            $maxScore = max(array_column($conceptScores, 'score'));

            $suggestions = [];
            foreach ($conceptScores as $conceptId => $data) {
                $confidence = min(1.0, $data['score'] / $maxScore);

                // Only include concepts with confidence > 0.3
                if ($confidence >= 0.3) {
                    $suggestions[] = [
                        'concept_id' => $conceptId,
                        'concept_name' => $data['concept']->name,
                        'concept_path' => $data['concept']->getFullPath(),
                        'confidence' => round($confidence, 3),
                        'matched_keywords' => array_unique($data['matched_keywords']),
                        'method' => 'keyword',
                    ];
                }
            }

            return $suggestions;
        }

        return [];
    }

    /**
     * OpenAI API-based analysis
     */
    private function openAIAnalysis(string $text, ?string $subject): array
    {
        try {
            $apiKey = $_ENV['OPENAI_API_KEY'];
            $model = $_ENV['OPENAI_MODEL'] ?? 'gpt-3.5-turbo';

            // Get all concepts for context
            $query = Concept::where('is_active', true);
            if ($subject) {
                $query->where('subject', $subject);
            }
            $concepts = $query->get();

            $conceptList = $concepts->map(fn($c) => "{$c->id}: {$c->name} ({$c->getFullPath()})")->implode("\n");

            $prompt = "다음 문제 텍스트를 분석하여 가장 관련 있는 핵심 개념 3-5개를 선택하세요.\n\n";
            $prompt .= "문제:\n{$text}\n\n";
            $prompt .= "사용 가능한 개념:\n{$conceptList}\n\n";
            $prompt .= "JSON 형식으로 응답하세요: [{\"concept_id\": 숫자, \"confidence\": 0-1 사이 값, \"reason\": \"이유\"}]";

            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => '당신은 교육 전문가입니다. 문제를 분석하여 핵심 개념을 추출합니다.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.3,
                ],
                'timeout' => 30,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            $content = $result['choices'][0]['message']['content'] ?? '';

            // Parse JSON from response
            $aiSuggestions = json_decode($content, true);

            if (!is_array($aiSuggestions)) {
                return [];
            }

            // Format suggestions
            $formatted = [];
            foreach ($aiSuggestions as $suggestion) {
                $conceptId = $suggestion['concept_id'];
                $concept = Concept::find($conceptId);

                if ($concept) {
                    $formatted[] = [
                        'concept_id' => $conceptId,
                        'concept_name' => $concept->name,
                        'concept_path' => $concept->getFullPath(),
                        'confidence' => (float)$suggestion['confidence'],
                        'reason' => $suggestion['reason'] ?? '',
                        'method' => 'openai',
                    ];
                }
            }

            return $formatted;

        } catch (\Exception $e) {
            error_log("OpenAI API error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Merge suggestions from multiple methods
     */
    private function mergeSuggestions(array $suggestions1, array $suggestions2): array
    {
        $merged = [];

        // Index by concept_id
        foreach ($suggestions1 as $s) {
            $merged[$s['concept_id']] = $s;
        }

        foreach ($suggestions2 as $s) {
            $conceptId = $s['concept_id'];

            if (isset($merged[$conceptId])) {
                // Average the confidence scores
                $merged[$conceptId]['confidence'] = ($merged[$conceptId]['confidence'] + $s['confidence']) / 2;
                $merged[$conceptId]['method'] = 'hybrid';
            } else {
                $merged[$conceptId] = $s;
            }
        }

        return array_values($merged);
    }

    /**
     * Tokenize Korean/English text
     */
    private function tokenize(string $text): array
    {
        // Convert to lowercase
        $text = mb_strtolower($text);

        // Remove special characters except Korean, English, numbers, spaces
        $text = preg_replace('/[^\p{Hangul}\p{Latin}\d\s]/u', ' ', $text);

        // Split by whitespace
        $tokens = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        // Remove stop words
        $tokens = array_filter($tokens, function($token) {
            return !in_array($token, $this->stopWords) && mb_strlen($token) >= 2;
        });

        return array_values($tokens);
    }

    /**
     * Log AI analysis
     */
    public function logAnalysis(int $problemId, string $inputText, array $suggestions, int $processingTime, string $method)
    {
        try {
            // Note: You'll need to create AIAnalysisLog model if you want to use this
            // For now, just log to file
            $logData = [
                'problem_id' => $problemId,
                'input_length' => mb_strlen($inputText),
                'suggestions_count' => count($suggestions),
                'processing_time' => $processingTime,
                'method' => $method,
                'timestamp' => date('Y-m-d H:i:s'),
            ];

            error_log("AI Analysis: " . json_encode($logData, JSON_UNESCAPED_UNICODE));
        } catch (\Exception $e) {
            error_log("Failed to log AI analysis: " . $e->getMessage());
        }
    }
}
