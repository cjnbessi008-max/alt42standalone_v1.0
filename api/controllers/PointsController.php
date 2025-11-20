<?php
/**
 * Points Controller
 * Manages points and achievements
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class PointsController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        Auth::require();

        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }

        switch ($action) {
            case '':
            case 'history':
                $this->getHistory();
                break;

            case 'summary':
                $this->getSummary();
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * Get points history
     * GET /api/points/history?limit=50
     */
    private function getHistory()
    {
        $studentId = Auth::studentId();
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 50;

        $stmt = $this->pdo->prepare("
            SELECT
                pl.*,
                cc.concept_name,
                cc.spirit_name
            FROM points_log pl
            JOIN concept_cards cc ON pl.card_id = cc.card_id
            WHERE pl.student_id = ?
            ORDER BY pl.created_at DESC
            LIMIT ?
        ");

        $stmt->execute([$studentId, $limit]);
        $history = $stmt->fetchAll();

        Response::success($history);
    }

    /**
     * Get points summary
     * GET /api/points/summary
     */
    private function getSummary()
    {
        $studentId = Auth::studentId();

        // Total points
        $stmt = $this->pdo->prepare("
            SELECT
                SUM(points_earned) as total_points,
                COUNT(*) as total_transactions,
                MAX(created_at) as last_earned_at
            FROM points_log
            WHERE student_id = ?
        ");

        $stmt->execute([$studentId]);
        $total = $stmt->fetch();

        // Points by achievement type
        $stmt = $this->pdo->prepare("
            SELECT
                achievement_type,
                SUM(points_earned) as points,
                COUNT(*) as count
            FROM points_log
            WHERE student_id = ?
            GROUP BY achievement_type
            ORDER BY points DESC
        ");

        $stmt->execute([$studentId]);
        $byType = $stmt->fetchAll();

        // Points by game
        $stmt = $this->pdo->prepare("
            SELECT
                cc.concept_name,
                cc.spirit_name,
                SUM(pl.points_earned) as points,
                COUNT(*) as count
            FROM points_log pl
            JOIN concept_cards cc ON pl.card_id = cc.card_id
            WHERE pl.student_id = ?
            GROUP BY cc.card_id, cc.concept_name, cc.spirit_name
            ORDER BY points DESC
        ");

        $stmt->execute([$studentId]);
        $byGame = $stmt->fetchAll();

        Response::success([
            'total' => $total,
            'by_type' => $byType,
            'by_game' => $byGame
        ]);
    }
}
