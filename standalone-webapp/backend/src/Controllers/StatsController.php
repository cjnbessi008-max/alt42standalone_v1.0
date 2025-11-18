<?php

namespace DualDance\Controllers;

use DualDance\Utils\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class StatsController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get user statistics
     */
    public function userStats(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');

        try {
            $stats = $this->db->fetchOne('SELECT * FROM v_user_stats WHERE user_id = :id', ['id' => $userId]);

            if (!$stats) {
                // Return empty stats if no records yet
                $stats = [
                    'user_id' => $userId,
                    'total_attempts' => 0,
                    'correct_attempts' => 0,
                    'average_grade' => 0,
                    'total_time' => 0,
                    'best_streak' => 0,
                    'current_streak' => 0,
                    'level' => 1,
                    'experience_points' => 0,
                    'accuracy_percentage' => 0
                ];
            }

            // Get performance by problem type
            $performanceByType = $this->db->fetchAll(
                'SELECT
                    p.problem_type,
                    COUNT(*) as attempts,
                    SUM(a.is_correct) as correct,
                    AVG(a.grade) as avg_grade,
                    AVG(a.time_spent) as avg_time
                 FROM attempts a
                 JOIN problems p ON a.problem_id = p.id
                 WHERE a.user_id = :user_id
                 GROUP BY p.problem_type',
                ['user_id' => $userId]
            );

            // Get recent progress (last 7 days)
            $recentProgress = $this->db->fetchAll(
                'SELECT
                    DATE(created_at) as date,
                    COUNT(*) as attempts,
                    SUM(is_correct) as correct,
                    AVG(grade) as avg_grade
                 FROM attempts
                 WHERE user_id = :user_id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 GROUP BY DATE(created_at)
                 ORDER BY date DESC',
                ['user_id' => $userId]
            );

            return $this->jsonResponse($response, [
                'success' => true,
                'stats' => $stats,
                'performance_by_type' => $performanceByType,
                'recent_progress' => $recentProgress
            ]);
        } catch (\Exception $e) {
            error_log("Get user stats error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get statistics'], 500);
        }
    }

    /**
     * Get leaderboard
     */
    public function leaderboard(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $limit = min(100, max(1, (int)($params['limit'] ?? 10)));

        try {
            $sql = 'SELECT * FROM v_leaderboard LIMIT :limit';
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->execute();
            $leaderboard = $stmt->fetchAll();

            return $this->jsonResponse($response, [
                'success' => true,
                'leaderboard' => $leaderboard
            ]);
        } catch (\Exception $e) {
            error_log("Get leaderboard error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get leaderboard'], 500);
        }
    }

    /**
     * Get recent activity
     */
    public function recentActivity(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $limit = min(100, max(1, (int)($params['limit'] ?? 10)));

        try {
            $sql = 'SELECT * FROM v_recent_activity LIMIT :limit';
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->execute();
            $activity = $stmt->fetchAll();

            return $this->jsonResponse($response, [
                'success' => true,
                'activity' => $activity
            ]);
        } catch (\Exception $e) {
            error_log("Get recent activity error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get activity'], 500);
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
