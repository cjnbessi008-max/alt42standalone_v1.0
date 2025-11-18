<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\AIConceptAnalyzer;
use App\Models\Problem;

class AIController
{
    private $analyzer;

    public function __construct()
    {
        $this->analyzer = new AIConceptAnalyzer();
    }

    /**
     * POST /api/ai/analyze - Analyze problem text and suggest concepts
     */
    public function analyze(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['content'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Content is required',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $text = $data['content'];
        $subject = $data['subject'] ?? null;

        // Analyze
        $result = $this->analyzer->analyzeProblem($text, $subject);

        $responseData = [
            'success' => true,
            'data' => [
                'suggestions' => $result['suggestions'],
                'processing_time_ms' => $result['processing_time'],
                'method' => $result['method'],
            ],
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/ai/suggest-for-problem/{id} - Analyze existing problem and attach suggested concepts
     */
    public function suggestForProblem(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Get combined text
        $text = $problem->getCombinedText();

        // Analyze
        $result = $this->analyzer->analyzeProblem($text, $problem->subject);

        // Attach suggested concepts to problem
        foreach ($result['suggestions'] as $suggestion) {
            $problem->attachConceptWithAI(
                $suggestion['concept_id'],
                $suggestion['confidence'],
                false // not primary by default
            );
        }

        // Log the analysis
        $this->analyzer->logAnalysis(
            $problem->id,
            $text,
            $result['suggestions'],
            $result['processing_time'],
            $result['method']
        );

        $responseData = [
            'success' => true,
            'message' => 'Concepts suggested and attached successfully',
            'data' => [
                'problem_id' => $problem->id,
                'suggestions' => $result['suggestions'],
                'processing_time_ms' => $result['processing_time'],
            ],
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/ai/batch-analyze - Batch analyze multiple problems
     */
    public function batchAnalyze(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $problemIds = $data['problem_ids'] ?? [];

        if (empty($problemIds)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'problem_ids array is required',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $results = [];
        $totalTime = 0;

        foreach ($problemIds as $problemId) {
            $problem = Problem::find($problemId);

            if (!$problem) {
                $results[] = [
                    'problem_id' => $problemId,
                    'success' => false,
                    'message' => 'Problem not found',
                ];
                continue;
            }

            $text = $problem->getCombinedText();
            $result = $this->analyzer->analyzeProblem($text, $problem->subject);

            // Attach concepts
            foreach ($result['suggestions'] as $suggestion) {
                $problem->attachConceptWithAI(
                    $suggestion['concept_id'],
                    $suggestion['confidence']
                );
            }

            $results[] = [
                'problem_id' => $problemId,
                'success' => true,
                'suggestions_count' => count($result['suggestions']),
                'processing_time_ms' => $result['processing_time'],
            ];

            $totalTime += $result['processing_time'];
        }

        $responseData = [
            'success' => true,
            'data' => [
                'results' => $results,
                'total_problems' => count($problemIds),
                'successful' => count(array_filter($results, fn($r) => $r['success'])),
                'total_time_ms' => $totalTime,
            ],
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
