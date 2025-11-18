<?php
/**
 * Session Management API
 *
 * Endpoints:
 * - POST /api/sessions.php - Start new tracking session
 * - PUT /api/sessions.php/{session_id} - Update session
 * - GET /api/sessions.php/{session_id} - Get session details
 * - DELETE /api/sessions.php/{session_id} - End session
 */

require_once __DIR__ . '/BaseAPI.php';

class SessionAPI extends BaseAPI {

    public function handleRequest() {
        switch ($this->requestMethod) {
            case 'POST':
                return $this->startSession();
            case 'PUT':
                return $this->updateSession();
            case 'GET':
                return $this->getSession();
            case 'DELETE':
                return $this->endSession();
            default:
                $this->sendError('Method not allowed', 405);
        }
    }

    /**
     * Start new tracking session
     *
     * POST /api/sessions.php
     * Body: {
     *   "user_id": 123,
     *   "course_id": 456,
     *   "activity_id": 789,
     *   "activity_type": "quiz",
     *   "screen_width": 1920,
     *   "screen_height": 1080
     * }
     */
    private function startSession() {
        // Validate required parameters
        $this->validateRequired(['user_id', 'course_id']);

        $userID = $this->getParam('user_id');
        $courseID = $this->getParam('course_id');
        $activityID = $this->getParam('activity_id');
        $activityType = $this->getParam('activity_type');
        $screenWidth = $this->getParam('screen_width');
        $screenHeight = $this->getParam('screen_height');

        // Check if user has given consent
        $consent = $this->checkUserConsent($userID);
        if (!$consent) {
            $this->sendError('User has not given consent for tracking', 403);
        }

        // Check if user already has an active session
        $activeSession = $this->getActiveSessionByUser($userID);
        if ($activeSession) {
            // Return existing active session
            $this->sendSuccess([
                'session_id' => $activeSession['session_id'],
                'started_at' => $activeSession['started_at'],
                'existing' => true
            ], 'Active session already exists');
        }

        try {
            // Generate session ID
            $sessionID = $this->generateUUID();

            // Get user agent and IP
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $ipAddress = $this->getClientIP();

            // Call stored procedure to start session
            $sql = "CALL sp_start_session(?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $this->db->query($sql, [
                $sessionID,
                $userID,
                $courseID,
                $activityID,
                $activityType,
                $userAgent,
                $ipAddress,
                $screenWidth,
                $screenHeight
            ]);

            $this->sendSuccess([
                'session_id' => $sessionID,
                'started_at' => date('Y-m-d H:i:s'),
                'config' => [
                    'sampling_rate_ms' => $this->config['tracking']['sampling_rate_ms'],
                    'window_duration_ms' => $this->config['tracking']['window_duration_ms'],
                ]
            ], 'Session started successfully');

        } catch (Exception $e) {
            $this->sendError('Failed to start session: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update session
     *
     * PUT /api/sessions.php?session_id=xxx
     */
    private function updateSession() {
        $sessionID = $this->getParam('session_id');

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        $updates = [];
        $allowedFields = ['total_blinks', 'total_events', 'avg_attention_score'];

        foreach ($allowedFields as $field) {
            $value = $this->getParam($field);
            if ($value !== null) {
                $updates[$field] = $value;
            }
        }

        if (empty($updates)) {
            $this->sendError('No valid fields to update', 400);
        }

        try {
            $updates['updated_at'] = date('Y-m-d H:i:s');

            $rowCount = $this->db->update(
                'tracking_sessions',
                $updates,
                'session_id = :session_id AND status = :status',
                [':session_id' => $sessionID, ':status' => 'active']
            );

            if ($rowCount === 0) {
                $this->sendError('Session not found or already ended', 404);
            }

            $this->sendSuccess(['updated' => $rowCount], 'Session updated successfully');

        } catch (Exception $e) {
            $this->sendError('Failed to update session: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get session details
     *
     * GET /api/sessions.php?session_id=xxx
     */
    private function getSession() {
        $sessionID = $this->getParam('session_id');

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        try {
            $session = $this->db->fetchOne(
                'SELECT * FROM tracking_sessions WHERE session_id = ?',
                [$sessionID]
            );

            if (!$session) {
                $this->sendError('Session not found', 404);
            }

            // Get recent metrics
            $metrics = $this->db->fetchAll(
                'SELECT * FROM attention_metrics
                 WHERE session_id = ?
                 ORDER BY window_start DESC
                 LIMIT 10',
                [$sessionID]
            );

            // Get alerts
            $alerts = $this->db->fetchAll(
                'SELECT * FROM attention_alerts
                 WHERE session_id = ?
                 ORDER BY detected_at DESC
                 LIMIT 20',
                [$sessionID]
            );

            $this->sendSuccess([
                'session' => $session,
                'recent_metrics' => $metrics,
                'recent_alerts' => $alerts
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve session: ' . $e->getMessage(), 500);
        }
    }

    /**
     * End session
     *
     * DELETE /api/sessions.php?session_id=xxx
     */
    private function endSession() {
        $sessionID = $this->getParam('session_id');

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        try {
            // Call stored procedure to end session
            $sql = "CALL sp_end_session(?)";
            $this->db->query($sql, [$sessionID]);

            // Get final session data
            $session = $this->db->fetchOne(
                'SELECT * FROM tracking_sessions WHERE session_id = ?',
                [$sessionID]
            );

            if (!$session) {
                $this->sendError('Session not found', 404);
            }

            $this->sendSuccess([
                'session_id' => $sessionID,
                'ended_at' => $session['ended_at'],
                'duration_seconds' => $session['duration_seconds'],
                'avg_attention_score' => $session['avg_attention_score'],
                'total_events' => $session['total_events'],
                'total_blinks' => $session['total_blinks']
            ], 'Session ended successfully');

        } catch (Exception $e) {
            $this->sendError('Failed to end session: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Check if user has given consent
     */
    private function checkUserConsent($userID) {
        $settings = $this->db->fetchOne(
            'SELECT consent_given, tracking_enabled
             FROM user_settings
             WHERE user_id = ?',
            [$userID]
        );

        if (!$settings) {
            // No settings found - create default settings
            $this->db->insert('user_settings', [
                'user_id' => $userID,
                'consent_given' => false,
                'tracking_enabled' => false
            ]);
            return false;
        }

        return $settings['consent_given'] && $settings['tracking_enabled'];
    }

    /**
     * Get active session by user ID
     */
    private function getActiveSessionByUser($userID) {
        return $this->db->fetchOne(
            'SELECT session_id, started_at
             FROM tracking_sessions
             WHERE user_id = ? AND status = ?
             ORDER BY started_at DESC
             LIMIT 1',
            [$userID, 'active']
        );
    }
}

// Handle request
$api = new SessionAPI();
$api->handleRequest();
