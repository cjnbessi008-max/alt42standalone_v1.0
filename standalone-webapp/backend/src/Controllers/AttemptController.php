<?php

namespace DualDance\Controllers;

use DualDance\Utils\Database;
use DualDance\Utils\ProblemGenerator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AttemptController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Submit answer attempt
     */
    public function submit(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = $request->getParsedBody();

        // Validate input
        if (!isset($data['problem_id']) || !isset($data['answer'])) {
            return $this->jsonResponse($response, ['error' => 'Problem ID and answer are required'], 400);
        }

        $problemId = (int)$data['problem_id'];
        $answer = (float)$data['answer'];
        $timeSpent = max(0, (int)($data['time_spent'] ?? 0));
        $interactionData = $data['interaction_data'] ?? null;

        try {
            // Get problem
            $problem = $this->db->fetchOne('SELECT * FROM problems WHERE id = :id', ['id' => $problemId]);

            if (!$problem) {
                return $this->jsonResponse($response, ['error' => 'Problem not found'], 404);
            }

            // Check answer
            $isCorrect = ProblemGenerator::checkAnswer($answer, (float)$problem['answer'], (float)$problem['tolerance']);
            $grade = ProblemGenerator::calculateGrade($isCorrect, $timeSpent);

            // Save attempt
            $attemptId = $this->db->insert('attempts', [
                'user_id' => $userId,
                'problem_id' => $problemId,
                'answer' => $answer,
                'is_correct' => $isCorrect ? 1 : 0,
                'time_spent' => $timeSpent,
                'interaction_data' => is_array($interactionData) ? json_encode($interactionData) : $interactionData,
                'grade' => $grade
            ]);

            $attempt = $this->db->fetchOne('SELECT * FROM attempts WHERE id = :id', ['id' => $attemptId]);

            return $this->jsonResponse($response, [
                'success' => true,
                'attempt' => array_merge($attempt, [
                    'correct_answer' => $problem['answer']
                ])
            ]);
        } catch (\Exception $e) {
            error_log("Submit attempt error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to submit attempt'], 500);
        }
    }

    /**
     * Get user attempts
     */
    public function list(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $params = $request->getQueryParams();

        $limit = min(100, max(1, (int)($params['limit'] ?? 20)));
        $offset = max(0, (int)($params['offset'] ?? 0));

        try {
            $sql = 'SELECT a.*, p.problem_type, p.difficulty, p.question_text
                    FROM attempts a
                    JOIN problems p ON a.problem_id = p.id
                    WHERE a.user_id = :user_id
                    ORDER BY a.created_at DESC
                    LIMIT :limit OFFSET :offset';

            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            $attempts = $stmt->fetchAll();

            return $this->jsonResponse($response, [
                'success' => true,
                'attempts' => $attempts,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'count' => count($attempts)
                ]
            ]);
        } catch (\Exception $e) {
            error_log("List attempts error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to list attempts'], 500);
        }
    }

    /**
     * Get specific attempt
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $attemptId = $args['id'];

        try {
            $attempt = $this->db->fetchOne(
                'SELECT a.*, p.problem_type, p.difficulty, p.question_text, p.answer as correct_answer
                 FROM attempts a
                 JOIN problems p ON a.problem_id = p.id
                 WHERE a.id = :id AND a.user_id = :user_id',
                ['id' => $attemptId, 'user_id' => $userId]
            );

            if (!$attempt) {
                return $this->jsonResponse($response, ['error' => 'Attempt not found'], 404);
            }

            return $this->jsonResponse($response, [
                'success' => true,
                'attempt' => $attempt
            ]);
        } catch (\Exception $e) {
            error_log("Get attempt error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get attempt'], 500);
        }
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
