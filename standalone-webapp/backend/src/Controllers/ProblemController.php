<?php

namespace DualDance\Controllers;

use DualDance\Utils\Database;
use DualDance\Utils\ProblemGenerator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ProblemController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Generate new problem
     */
    public function generate(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = $request->getParsedBody();

        $difficulty = $data['difficulty'] ?? 3;
        $difficulty = max(1, min(5, (int)$difficulty));

        try {
            $problemData = ProblemGenerator::generate($difficulty, $userId);
            $problemId = $this->db->insert('problems', $problemData);

            $problem = $this->db->fetchOne('SELECT * FROM problems WHERE id = :id', ['id' => $problemId]);

            return $this->jsonResponse($response, [
                'success' => true,
                'problem' => $problem
            ]);
        } catch (\Exception $e) {
            error_log("Generate problem error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to generate problem'], 500);
        }
    }

    /**
     * Get problem by ID
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $problemId = $args['id'];

        try {
            $problem = $this->db->fetchOne('SELECT * FROM problems WHERE id = :id', ['id' => $problemId]);

            if (!$problem) {
                return $this->jsonResponse($response, ['error' => 'Problem not found'], 404);
            }

            return $this->jsonResponse($response, [
                'success' => true,
                'problem' => $problem
            ]);
        } catch (\Exception $e) {
            error_log("Get problem error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get problem'], 500);
        }
    }

    /**
     * List problems with filters
     */
    public function list(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $limit = min(100, max(1, (int)($params['limit'] ?? 20)));
        $offset = max(0, (int)($params['offset'] ?? 0));
        $difficulty = isset($params['difficulty']) ? (int)$params['difficulty'] : null;
        $problemType = $params['type'] ?? null;

        try {
            $where = ['1=1'];
            $whereParams = [];

            if ($difficulty !== null) {
                $where[] = 'difficulty = :difficulty';
                $whereParams['difficulty'] = $difficulty;
            }

            if ($problemType !== null) {
                $where[] = 'problem_type = :problem_type';
                $whereParams['problem_type'] = $problemType;
            }

            $sql = sprintf(
                'SELECT * FROM problems WHERE %s ORDER BY created_at DESC LIMIT %d OFFSET %d',
                implode(' AND ', $where),
                $limit,
                $offset
            );

            $problems = $this->db->fetchAll($sql, $whereParams);

            return $this->jsonResponse($response, [
                'success' => true,
                'problems' => $problems,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'count' => count($problems)
                ]
            ]);
        } catch (\Exception $e) {
            error_log("List problems error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to list problems'], 500);
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
