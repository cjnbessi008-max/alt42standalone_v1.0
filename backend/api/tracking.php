<?php
/**
 * Eye Tracking Data API
 *
 * Endpoints:
 * - POST /api/tracking.php - Submit eye tracking events (batch)
 * - GET /api/tracking.php/{session_id} - Get tracking data for session
 */

require_once __DIR__ . '/BaseAPI.php';

class TrackingAPI extends BaseAPI {

    public function handleRequest() {
        switch ($this->requestMethod) {
            case 'POST':
                return $this->submitTrackingData();
            case 'GET':
                return $this->getTrackingData();
            default:
                $this->sendError('Method not allowed', 405);
        }
    }

    /**
     * Submit eye tracking events (batch)
     *
     * POST /api/tracking.php
     * Body: {
     *   "session_id": "abc123",
     *   "events": [
     *     {
     *       "timestamp": 1234567890123,
     *       "relative_time": 5000,
     *       "blink_detected": false,
     *       "gaze_x": 0.5,
     *       "gaze_y": 0.5,
     *       "gaze_on_screen": true,
     *       "face_direction": "center",
     *       "face_distance": 50.5,
     *       "tracking_confidence": 0.95,
     *       "face_detected": true
     *     },
     *     ...
     *   ]
     * }
     */
    private function submitTrackingData() {
        // Validate required parameters
        $this->validateRequired(['session_id', 'events']);

        $sessionID = $this->getParam('session_id');
        $events = $this->getParam('events');

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        if (!is_array($events) || empty($events)) {
            $this->sendError('Events must be a non-empty array', 400);
        }

        // Limit batch size
        $maxEvents = $this->config['tracking']['max_events_per_request'];
        if (count($events) > $maxEvents) {
            $this->sendError("Too many events. Maximum $maxEvents events per request", 400);
        }

        // Verify session exists and is active
        $session = $this->getSession($sessionID);
        if (!$session) {
            $this->sendError('Session not found', 404);
        }

        if ($session['status'] !== 'active') {
            $this->sendError('Session is not active', 400);
        }

        try {
            $this->db->beginTransaction();

            $insertedCount = 0;
            $blinkCount = 0;

            foreach ($events as $event) {
                // Validate event structure
                if (!isset($event['timestamp']) || !isset($event['relative_time'])) {
                    continue; // Skip invalid events
                }

                // Insert event
                $eventData = [
                    'session_id' => $sessionID,
                    'timestamp' => $event['timestamp'],
                    'relative_time' => $event['relative_time'],
                    'blink_detected' => isset($event['blink_detected']) ? (int)$event['blink_detected'] : 0,
                    'blink_duration' => $event['blink_duration'] ?? null,
                    'gaze_x' => $event['gaze_x'] ?? null,
                    'gaze_y' => $event['gaze_y'] ?? null,
                    'gaze_on_screen' => isset($event['gaze_on_screen']) ? (int)$event['gaze_on_screen'] : 1,
                    'face_direction' => $event['face_direction'] ?? 'center',
                    'face_distance' => $event['face_distance'] ?? null,
                    'head_rotation_x' => $event['head_rotation_x'] ?? null,
                    'head_rotation_y' => $event['head_rotation_y'] ?? null,
                    'head_rotation_z' => $event['head_rotation_z'] ?? null,
                    'tracking_confidence' => $event['tracking_confidence'] ?? null,
                    'face_detected' => isset($event['face_detected']) ? (int)$event['face_detected'] : 1,
                ];

                $this->db->insert('eye_tracking_events', $eventData);
                $insertedCount++;

                if ($event['blink_detected'] ?? false) {
                    $blinkCount++;
                }
            }

            // Update session totals
            $this->db->query(
                'UPDATE tracking_sessions
                 SET total_events = total_events + ?,
                     total_blinks = total_blinks + ?,
                     updated_at = NOW()
                 WHERE session_id = ?',
                [$insertedCount, $blinkCount, $sessionID]
            );

            $this->db->commit();

            // Check if we need to calculate metrics for this window
            $this->checkAndCalculateMetrics($sessionID);

            $this->sendSuccess([
                'inserted' => $insertedCount,
                'blinks' => $blinkCount,
                'session_id' => $sessionID
            ], 'Tracking data submitted successfully');

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollback();
            }
            $this->sendError('Failed to submit tracking data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get tracking data for session
     *
     * GET /api/tracking.php?session_id=xxx&limit=100&offset=0
     */
    private function getTrackingData() {
        $sessionID = $this->getParam('session_id');
        $limit = min((int)$this->getParam('limit', 100), 1000);
        $offset = (int)$this->getParam('offset', 0);

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        try {
            $events = $this->db->fetchAll(
                'SELECT * FROM eye_tracking_events
                 WHERE session_id = ?
                 ORDER BY timestamp ASC
                 LIMIT ? OFFSET ?',
                [$sessionID, $limit, $offset]
            );

            $totalCount = $this->db->fetchValue(
                'SELECT COUNT(*) FROM eye_tracking_events WHERE session_id = ?',
                [$sessionID]
            );

            $this->sendSuccess([
                'events' => $events,
                'total' => (int)$totalCount,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $totalCount
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve tracking data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get session details
     */
    private function getSession($sessionID) {
        return $this->db->fetchOne(
            'SELECT * FROM tracking_sessions WHERE session_id = ?',
            [$sessionID]
        );
    }

    /**
     * Check if metrics calculation is needed and trigger it
     */
    private function checkAndCalculateMetrics($sessionID) {
        // Get the latest metric window
        $latestMetric = $this->db->fetchOne(
            'SELECT window_end FROM attention_metrics
             WHERE session_id = ?
             ORDER BY window_end DESC
             LIMIT 1',
            [$sessionID]
        );

        $windowDuration = $this->config['tracking']['window_duration_ms'];
        $currentTime = $this->getTimestampMs();

        $lastWindowEnd = $latestMetric ? $latestMetric['window_end'] : 0;

        // If enough time has passed, calculate metrics for the new window
        if ($currentTime - $lastWindowEnd >= $windowDuration) {
            $this->calculateMetricsForWindow($sessionID, $lastWindowEnd, $currentTime);
        }
    }

    /**
     * Calculate attention metrics for a time window
     */
    private function calculateMetricsForWindow($sessionID, $windowStart, $windowEnd) {
        try {
            // Get events in this window
            $events = $this->db->fetchAll(
                'SELECT * FROM eye_tracking_events
                 WHERE session_id = ?
                   AND timestamp > ?
                   AND timestamp <= ?
                 ORDER BY timestamp ASC',
                [$sessionID, $windowStart, $windowEnd]
            );

            if (empty($events)) {
                return; // No events in this window
            }

            // Calculate metrics
            $metrics = $this->analyzeEvents($events, $windowStart, $windowEnd);

            // Insert metrics
            $metricID = $this->db->insert('attention_metrics', array_merge([
                'session_id' => $sessionID,
                'window_start' => $windowStart,
                'window_end' => $windowEnd,
                'window_duration' => $windowEnd - $windowStart,
            ], $metrics));

            // Calculate attention score using stored procedure
            $this->db->query('CALL sp_calculate_attention_score(?)', [$metricID]);

            // Check for alerts
            $this->checkForAlerts($sessionID, $metricID, $metrics);

            // Update session average
            $avgScore = $this->db->fetchValue(
                'SELECT AVG(attention_score) FROM attention_metrics WHERE session_id = ?',
                [$sessionID]
            );

            $this->db->update(
                'tracking_sessions',
                ['avg_attention_score' => $avgScore],
                'session_id = :session_id',
                [':session_id' => $sessionID]
            );

        } catch (Exception $e) {
            error_log('Failed to calculate metrics: ' . $e->getMessage());
        }
    }

    /**
     * Analyze events and calculate metrics
     */
    private function analyzeEvents($events, $windowStart, $windowEnd) {
        $totalEvents = count($events);
        $blinkCount = 0;
        $blinkDurations = [];
        $gazeOnScreenCount = 0;
        $faceCenterCount = 0;
        $faceDetectedCount = 0;
        $distances = [];
        $gazePositions = [];

        foreach ($events as $event) {
            if ($event['blink_detected']) {
                $blinkCount++;
                if ($event['blink_duration']) {
                    $blinkDurations[] = $event['blink_duration'];
                }
            }

            if ($event['gaze_on_screen']) {
                $gazeOnScreenCount++;
            }

            if ($event['face_direction'] === 'center') {
                $faceCenterCount++;
            }

            if ($event['face_detected']) {
                $faceDetectedCount++;
            }

            if ($event['face_distance']) {
                $distances[] = $event['face_distance'];
            }

            if ($event['gaze_x'] !== null && $event['gaze_y'] !== null) {
                $gazePositions[] = ['x' => $event['gaze_x'], 'y' => $event['gaze_y']];
            }
        }

        // Calculate blink rate (per minute)
        $windowDurationMin = ($windowEnd - $windowStart) / 1000 / 60;
        $blinkRate = $windowDurationMin > 0 ? $blinkCount / $windowDurationMin : 0;

        // Calculate average blink duration
        $avgBlinkDuration = !empty($blinkDurations) ? array_sum($blinkDurations) / count($blinkDurations) : null;

        // Calculate blink irregularity (standard deviation)
        $blinkIrregularity = $this->calculateStdDev($blinkDurations);

        // Calculate ratios
        $gazeOnScreenRatio = $totalEvents > 0 ? $gazeOnScreenCount / $totalEvents : 0;
        $faceCenterRatio = $totalEvents > 0 ? $faceCenterCount / $totalEvents : 0;
        $faceDetectedRatio = $totalEvents > 0 ? $faceDetectedCount / $totalEvents : 0;

        // Calculate average face distance
        $avgFaceDistance = !empty($distances) ? array_sum($distances) / count($distances) : null;

        // Calculate gaze movement score
        $gazeMovementScore = $this->calculateGazeMovement($gazePositions);

        return [
            'blink_count' => $blinkCount,
            'blink_rate' => round($blinkRate, 2),
            'avg_blink_duration' => $avgBlinkDuration ? round($avgBlinkDuration, 2) : null,
            'blink_irregularity' => $blinkIrregularity,
            'gaze_on_screen_ratio' => round($gazeOnScreenRatio, 4),
            'gaze_movement_score' => round($gazeMovementScore, 2),
            'avg_gaze_fixation_duration' => null, // TODO: Implement fixation detection
            'face_center_ratio' => round($faceCenterRatio, 4),
            'face_detected_ratio' => round($faceDetectedRatio, 4),
            'avg_face_distance' => $avgFaceDistance ? round($avgFaceDistance, 2) : null,
            'posture_stability' => null, // TODO: Implement posture stability
        ];
    }

    /**
     * Calculate standard deviation
     */
    private function calculateStdDev($values) {
        if (empty($values)) {
            return null;
        }

        $count = count($values);
        $mean = array_sum($values) / $count;
        $variance = array_sum(array_map(function($v) use ($mean) {
            return pow($v - $mean, 2);
        }, $values)) / $count;

        return round(sqrt($variance), 4);
    }

    /**
     * Calculate gaze movement score
     */
    private function calculateGazeMovement($positions) {
        if (count($positions) < 2) {
            return 0;
        }

        $totalDistance = 0;
        for ($i = 1; $i < count($positions); $i++) {
            $dx = $positions[$i]['x'] - $positions[$i-1]['x'];
            $dy = $positions[$i]['y'] - $positions[$i-1]['y'];
            $distance = sqrt($dx * $dx + $dy * $dy);
            $totalDistance += $distance;
        }

        return $totalDistance * 100; // Scale up for readability
    }

    /**
     * Check for attention alerts
     */
    private function checkForAlerts($sessionID, $metricID, $metrics) {
        $thresholds = $this->config['thresholds'];
        $alerts = [];

        // Check blink rate
        if ($metrics['blink_rate'] > $thresholds['blink_rate_max']) {
            $alerts[] = [
                'alert_type' => 'excessive_blinking',
                'severity' => 'warning',
                'threshold_value' => $thresholds['blink_rate_max'],
                'actual_value' => $metrics['blink_rate'],
                'description' => 'Excessive blinking detected (possible fatigue or stress)'
            ];
        } elseif ($metrics['blink_rate'] < $thresholds['blink_rate_min']) {
            $alerts[] = [
                'alert_type' => 'insufficient_blinking',
                'severity' => 'warning',
                'threshold_value' => $thresholds['blink_rate_min'],
                'actual_value' => $metrics['blink_rate'],
                'description' => 'Insufficient blinking detected (possible eye strain)'
            ];
        }

        // Check gaze on screen ratio
        if ($metrics['gaze_on_screen_ratio'] < $thresholds['gaze_on_screen_min_ratio']) {
            $alerts[] = [
                'alert_type' => 'gaze_away',
                'severity' => $metrics['gaze_on_screen_ratio'] < 0.3 ? 'critical' : 'warning',
                'threshold_value' => $thresholds['gaze_on_screen_min_ratio'],
                'actual_value' => $metrics['gaze_on_screen_ratio'],
                'description' => 'Frequent gaze away from screen detected'
            ];
        }

        // Check face detected ratio
        if ($metrics['face_detected_ratio'] < $thresholds['face_detected_min_ratio']) {
            $alerts[] = [
                'alert_type' => 'no_face_detected',
                'severity' => $metrics['face_detected_ratio'] < 0.5 ? 'critical' : 'warning',
                'threshold_value' => $thresholds['face_detected_min_ratio'],
                'actual_value' => $metrics['face_detected_ratio'],
                'description' => 'Face not detected (possible absence from seat)'
            ];
        }

        // Insert alerts
        foreach ($alerts as $alert) {
            $this->db->insert('attention_alerts', array_merge([
                'session_id' => $sessionID,
                'metric_id' => $metricID,
                'detected_at' => $this->getTimestampMs(),
            ], $alert));
        }
    }
}

// Handle request
$api = new TrackingAPI();
$api->handleRequest();
