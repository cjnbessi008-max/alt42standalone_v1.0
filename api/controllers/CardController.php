<?php
/**
 * Card Controller
 * Manages student card collection
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class CardController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        Auth::require();

        switch ($action) {
            case '':
            case 'collection':
                if ($method === 'GET') {
                    $this->getCollection();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'detail':
                if ($method === 'GET') {
                    $this->getCardDetail($id);
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'favorite':
                if ($method === 'POST') {
                    $this->toggleFavorite();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * Get student's card collection
     * GET /api/cards/collection
     */
    private function getCollection()
    {
        $studentId = Auth::studentId();

        $stmt = $this->pdo->prepare("
            SELECT
                sc.id,
                sc.card_id,
                sc.current_level,
                sc.acquired_at,
                sc.last_interaction_at,
                sc.total_interactions,
                sc.favorite,
                cc.concept_name,
                cc.spirit_name,
                cc.spirit_alias,
                cc.spirit_personality,
                cc.card_image_url,
                cc.card_background_color,
                cc.max_level,
                sp.total_points_earned,
                sp.current_stage
            FROM student_cards sc
            JOIN concept_cards cc ON sc.card_id = cc.card_id
            LEFT JOIN student_progress sp ON sc.student_id = sp.student_id AND sc.card_id = sp.card_id
            WHERE sc.student_id = ?
            ORDER BY sc.favorite DESC, sc.acquired_at DESC
        ");

        $stmt->execute([$studentId]);
        $cards = $stmt->fetchAll();

        // Get total stats
        $stmt = $this->pdo->prepare("
            SELECT
                COUNT(*) as total_cards,
                SUM(total_points_earned) as total_points
            FROM student_cards sc
            LEFT JOIN student_progress sp ON sc.student_id = sp.student_id AND sc.card_id = sp.card_id
            WHERE sc.student_id = ?
        ");

        $stmt->execute([$studentId]);
        $stats = $stmt->fetch();

        Response::success([
            'cards' => $cards,
            'stats' => $stats,
            'total_possible_cards' => 12
        ]);
    }

    /**
     * Get detailed info for a specific card
     * GET /api/cards/detail/{card_id}
     */
    private function getCardDetail($cardId)
    {
        $studentId = Auth::studentId();

        if (empty($cardId)) {
            Response::validationError(['card_id is required']);
        }

        // Get card info
        $stmt = $this->pdo->prepare("
            SELECT
                sc.*,
                cc.*,
                sp.current_stage,
                sp.stage_1_completed, sp.stage_1_score, sp.stage_1_completed_at,
                sp.stage_2_completed, sp.stage_2_score, sp.stage_2_completed_at,
                sp.stage_3_completed, sp.stage_3_score, sp.stage_3_completed_at,
                sp.stage_4_completed, sp.stage_4_score, sp.stage_4_completed_at,
                sp.stage_5_completed, sp.stage_5_score, sp.stage_5_completed_at,
                sp.total_points_earned,
                sp.total_time_spent_seconds
            FROM student_cards sc
            JOIN concept_cards cc ON sc.card_id = cc.card_id
            LEFT JOIN student_progress sp ON sc.student_id = sp.student_id AND sc.card_id = sp.card_id
            WHERE sc.student_id = ? AND sc.card_id = ?
        ");

        $stmt->execute([$studentId, $cardId]);
        $card = $stmt->fetch();

        if (!$card) {
            Response::notFound('Card not found in your collection');
        }

        // Get recent activity for this card
        $stmt = $this->pdo->prepare("
            SELECT *
            FROM points_log
            WHERE student_id = ? AND card_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");

        $stmt->execute([$studentId, $cardId]);
        $recentActivity = $stmt->fetchAll();

        Response::success([
            'card' => $card,
            'recent_activity' => $recentActivity
        ]);
    }

    /**
     * Toggle favorite status for a card
     * POST /api/cards/favorite
     * Body: { "card_id": 1, "favorite": true }
     */
    private function toggleFavorite()
    {
        $studentId = Auth::studentId();
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['card_id'])) {
            Response::validationError(['card_id is required']);
        }

        $cardId = $input['card_id'];
        $favorite = !empty($input['favorite']);

        // Update favorite status
        $stmt = $this->pdo->prepare("
            UPDATE student_cards
            SET favorite = ?
            WHERE student_id = ? AND card_id = ?
        ");

        $stmt->execute([$favorite, $studentId, $cardId]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Card not found in your collection');
        }

        Response::success(['favorite' => $favorite], 'Favorite status updated');
    }
}
