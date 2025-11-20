<?php
/**
 * Game Controller
 * Handles game launching, session management, and stage completion
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class GameController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        Auth::require(); // All game actions require authentication

        switch ($action) {
            case '':
            case 'list':
                if ($method === 'GET') {
                    $this->listGames();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'launch':
                if ($method === 'POST') {
                    $this->launchGame();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'session':
                if ($method === 'GET') {
                    $this->getSession($id);
                } elseif ($method === 'PUT') {
                    $this->updateSession($id);
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'complete':
                if ($method === 'POST') {
                    $this->completeStage();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * List all available games with student's progress
     * GET /api/games
     */
    private function listGames()
    {
        $studentId = Auth::studentId();

        $stmt = $this->pdo->prepare("
            SELECT
                cc.card_id,
                cc.concept_name,
                cc.spirit_name,
                cc.spirit_alias,
                cc.card_image_url,
                cc.card_background_color,
                cc.description_text,
                cc.unlock_points_required,
                cc.game_folder,
                sp.current_stage,
                sp.total_points_earned,
                sp.stage_1_completed,
                sp.stage_2_completed,
                sp.stage_3_completed,
                sp.stage_4_completed,
                sp.stage_5_completed,
                sc.current_level as card_level,
                sc.acquired_at as card_acquired_at
            FROM concept_cards cc
            LEFT JOIN student_progress sp ON cc.card_id = sp.card_id AND sp.student_id = ?
            LEFT JOIN student_cards sc ON cc.card_id = sc.card_id AND sc.student_id = ?
            WHERE cc.is_active = TRUE
            ORDER BY cc.display_order ASC
        ");

        $stmt->execute([$studentId, $studentId]);
        $games = $stmt->fetchAll();

        Response::success($games);
    }

    /**
     * Launch a game (create session)
     * POST /api/games/launch
     * Body: { "concept_name": "fractions", "stage": 1 }
     */
    private function launchGame()
    {
        $studentId = Auth::studentId();
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['concept_name'])) {
            Response::validationError(['concept_name is required']);
        }

        // Get card info
        $stmt = $this->pdo->prepare("SELECT * FROM concept_cards WHERE concept_name = ? AND is_active = TRUE");
        $stmt->execute([$input['concept_name']]);
        $card = $stmt->fetch();

        if (!$card) {
            Response::notFound('Game not found');
        }

        $cardId = $card['card_id'];

        // Get or create student progress
        $stmt = $this->pdo->prepare("SELECT * FROM student_progress WHERE student_id = ? AND card_id = ?");
        $stmt->execute([$studentId, $cardId]);
        $progress = $stmt->fetch();

        if (!$progress) {
            // Create initial progress
            $stmt = $this->pdo->prepare("
                INSERT INTO student_progress (student_id, card_id, current_stage)
                VALUES (?, ?, 1)
            ");
            $stmt->execute([$studentId, $cardId]);

            $progress = [
                'student_id' => $studentId,
                'card_id' => $cardId,
                'current_stage' => 1,
                'total_points_earned' => 0,
            ];
        }

        // Determine which stage to start (from input or current progress)
        $startStage = $input['stage'] ?? $progress['current_stage'];

        // Validate stage access
        if ($startStage > $progress['current_stage']) {
            Response::error('Stage not yet unlocked', 403);
        }

        // Create game session
        $sessionId = Auth::generateSessionToken();
        $stmt = $this->pdo->prepare("
            INSERT INTO game_sessions (session_id, student_id, card_id, current_stage, session_data, started_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");

        $sessionData = json_encode([
            'start_time' => time(),
            'attempts' => 0,
        ]);

        $stmt->execute([$sessionId, $studentId, $cardId, $startStage, $sessionData]);

        Response::success([
            'session_id' => $sessionId,
            'card' => $card,
            'progress' => $progress,
            'starting_stage' => $startStage,
            'game_url' => "/games/{$card['game_folder']}/index.html"
        ], 'Game launched successfully');
    }

    /**
     * Get session data
     * GET /api/games/session/{session_id}
     */
    private function getSession($sessionId)
    {
        $studentId = Auth::studentId();

        $stmt = $this->pdo->prepare("
            SELECT gs.*, cc.concept_name, cc.spirit_name, cc.game_folder
            FROM game_sessions gs
            JOIN concept_cards cc ON gs.card_id = cc.card_id
            WHERE gs.session_id = ? AND gs.student_id = ?
        ");

        $stmt->execute([$sessionId, $studentId]);
        $session = $stmt->fetch();

        if (!$session) {
            Response::notFound('Session not found');
        }

        // Decode JSON session_data
        $session['session_data'] = json_decode($session['session_data'], true);

        Response::success($session);
    }

    /**
     * Update session data (save progress mid-game)
     * PUT /api/games/session/{session_id}
     * Body: { "session_data": {...} }
     */
    private function updateSession($sessionId)
    {
        $studentId = Auth::studentId();
        $input = json_decode(file_get_contents('php://input'), true);

        // Verify session belongs to student
        $stmt = $this->pdo->prepare("SELECT session_id FROM game_sessions WHERE session_id = ? AND student_id = ?");
        $stmt->execute([$sessionId, $studentId]);
        if (!$stmt->fetch()) {
            Response::forbidden('Session not accessible');
        }

        // Update session data
        $stmt = $this->pdo->prepare("
            UPDATE game_sessions
            SET session_data = ?, last_updated_at = NOW()
            WHERE session_id = ?
        ");

        $stmt->execute([json_encode($input['session_data']), $sessionId]);

        Response::success(null, 'Session updated');
    }

    /**
     * Complete a stage
     * POST /api/games/complete
     * Body: {
     *   "session_id": "...",
     *   "stage": 1,
     *   "score": 85.5,
     *   "time_spent": 120
     * }
     */
    private function completeStage()
    {
        $studentId = Auth::studentId();
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        $required = ['session_id', 'stage', 'score', 'time_spent'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                Response::validationError(["$field is required"]);
            }
        }

        $sessionId = $input['session_id'];
        $stage = (int)$input['stage'];
        $score = (float)$input['score'];
        $timeSpent = (int)$input['time_spent'];

        // Get session
        $stmt = $this->pdo->prepare("SELECT * FROM game_sessions WHERE session_id = ? AND student_id = ?");
        $stmt->execute([$sessionId, $studentId]);
        $session = $stmt->fetch();

        if (!$session) {
            Response::forbidden('Invalid session');
        }

        $cardId = $session['card_id'];

        // Check if score meets minimum threshold
        if ($score < MIN_STAGE_SCORE_TO_PASS) {
            Response::error('Score too low to complete stage. Keep practicing!', 400, [
                'minimum_score' => MIN_STAGE_SCORE_TO_PASS,
                'your_score' => $score
            ]);
        }

        // Use stored procedure to complete stage
        try {
            $stmt = $this->pdo->prepare("CALL complete_stage(?, ?, ?, ?, ?)");
            $stmt->execute([$studentId, $cardId, $stage, $score, $timeSpent]);

            // Mark session as completed
            $stmt = $this->pdo->prepare("
                UPDATE game_sessions
                SET is_completed = TRUE, completed_at = NOW()
                WHERE session_id = ?
            ");
            $stmt->execute([$sessionId]);

            // Get updated progress
            $stmt = $this->pdo->prepare("SELECT * FROM student_progress WHERE student_id = ? AND card_id = ?");
            $stmt->execute([$studentId, $cardId]);
            $progress = $stmt->fetch();

            // Check if card was unlocked
            $stmt = $this->pdo->prepare("SELECT * FROM student_cards WHERE student_id = ? AND card_id = ?");
            $stmt->execute([$studentId, $cardId]);
            $card = $stmt->fetch();

            $cardUnlocked = !empty($card) && $card['acquired_at'] > date('Y-m-d H:i:s', strtotime('-5 seconds'));

            Response::success([
                'stage_completed' => $stage,
                'score' => $score,
                'progress' => $progress,
                'card_unlocked' => $cardUnlocked,
                'next_stage_available' => $stage < 5 && $progress['current_stage'] > $stage
            ], 'Stage completed successfully!');

        } catch (PDOException $e) {
            error_log("Stage completion error: " . $e->getMessage());
            Response::error('Failed to complete stage', 500);
        }
    }
}
