<?php
/**
 * Moodle LTI Integration Service
 * Handles LTI 1.3 launches and grade passback
 */

class MoodleLtiIntegration {
    private $db;
    private $consumerKey;
    private $sharedSecret;

    public function __construct($database, $consumerKey, $sharedSecret) {
        $this->db = $database;
        $this->consumerKey = $consumerKey;
        $this->sharedSecret = $sharedSecret;
    }

    /**
     * Handle LTI launch request from Moodle
     *
     * @param array $ltiParams LTI launch parameters
     * @return array User and session information
     */
    public function handleLtiLaunch($ltiParams) {
        // Validate OAuth signature
        if (!$this->validateOAuthSignature($ltiParams)) {
            throw new Exception('Invalid OAuth signature');
        }

        // Extract user information
        $userId = $ltiParams['user_id'] ?? null;
        $username = $ltiParams['lis_person_name_given'] ?? 'Student';
        $email = $ltiParams['lis_person_contact_email_primary'] ?? '';
        $fullName = $ltiParams['lis_person_name_full'] ?? $username;

        if (!$userId) {
            throw new Exception('Missing user_id in LTI parameters');
        }

        // Get or create student record
        $student = $this->getOrCreateStudent($userId, $username, $email, $fullName);

        // Store LTI session data
        $ltiSessionId = $this->storeLtiSession($student['id'], $ltiParams);

        return [
            'student' => $student,
            'lti_session_id' => $ltiSessionId,
            'context_id' => $ltiParams['context_id'] ?? null,
            'resource_link_id' => $ltiParams['resource_link_id'] ?? null
        ];
    }

    /**
     * Validate OAuth 1.0 signature
     */
    private function validateOAuthSignature($params) {
        // This is a simplified validation
        // In production, use a proper OAuth library

        if (!isset($params['oauth_signature'])) {
            return false;
        }

        // Store and remove signature
        $providedSignature = $params['oauth_signature'];
        unset($params['oauth_signature']);
        unset($params['oauth_signature_method']);

        // Build base string
        $baseString = $this->buildOAuthBaseString('POST', $_SERVER['REQUEST_URI'], $params);

        // Calculate expected signature
        $key = rawurlencode($this->sharedSecret) . '&';
        $expectedSignature = base64_encode(hash_hmac('sha1', $baseString, $key, true));

        return $providedSignature === $expectedSignature;
    }

    /**
     * Build OAuth base string
     */
    private function buildOAuthBaseString($method, $url, $params) {
        // Normalize parameters
        ksort($params);
        $paramString = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

        // Build base string
        return strtoupper($method) . '&' .
               rawurlencode($url) . '&' .
               rawurlencode($paramString);
    }

    /**
     * Get or create student record
     */
    private function getOrCreateStudent($moodleUserId, $username, $email, $fullName) {
        // Check if student exists
        $query = "SELECT * FROM students WHERE moodle_user_id = :moodle_user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['moodle_user_id' => $moodleUserId]);
        $student = $stmt->fetch();

        if ($student) {
            // Update existing record
            $updateQuery = "
                UPDATE students
                SET username = :username, email = :email, full_name = :full_name
                WHERE id = :id
            ";
            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->execute([
                'id' => $student['id'],
                'username' => $username,
                'email' => $email,
                'full_name' => $fullName
            ]);

            return $student;
        } else {
            // Create new student
            $insertQuery = "
                INSERT INTO students (moodle_user_id, username, email, full_name)
                VALUES (:moodle_user_id, :username, :email, :full_name)
            ";
            $insertStmt = $this->db->prepare($insertQuery);
            $insertStmt->execute([
                'moodle_user_id' => $moodleUserId,
                'username' => $username,
                'email' => $email,
                'full_name' => $fullName
            ]);

            return [
                'id' => $this->db->lastInsertId(),
                'moodle_user_id' => $moodleUserId,
                'username' => $username,
                'email' => $email,
                'full_name' => $fullName
            ];
        }
    }

    /**
     * Store LTI session information
     */
    private function storeLtiSession($studentId, $ltiParams) {
        $query = "
            INSERT INTO moodle_lti_sessions (
                student_id,
                lti_consumer_key,
                lti_context_id,
                lti_resource_link_id,
                lti_user_id,
                launch_data
            ) VALUES (
                :student_id,
                :consumer_key,
                :context_id,
                :resource_link_id,
                :user_id,
                :launch_data
            )
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'student_id' => $studentId,
            'consumer_key' => $ltiParams['oauth_consumer_key'] ?? $this->consumerKey,
            'context_id' => $ltiParams['context_id'] ?? null,
            'resource_link_id' => $ltiParams['resource_link_id'] ?? null,
            'user_id' => $ltiParams['user_id'] ?? null,
            'launch_data' => json_encode($ltiParams)
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Send grade back to Moodle
     *
     * @param int $ltiSessionId LTI session ID
     * @param float $score Score (0.0 to 1.0)
     * @return bool Success status
     */
    public function sendGradeToMoodle($ltiSessionId, $score) {
        // Get LTI session data
        $query = "SELECT * FROM moodle_lti_sessions WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['id' => $ltiSessionId]);
        $ltiSession = $stmt->fetch();

        if (!$ltiSession) {
            throw new Exception('LTI session not found');
        }

        $launchData = json_decode($ltiSession['launch_data'], true);

        // Check if grade passback is supported
        if (!isset($launchData['lis_outcome_service_url']) ||
            !isset($launchData['lis_result_sourcedid'])) {
            throw new Exception('Grade passback not supported for this launch');
        }

        // Build LTI Outcomes XML
        $xml = $this->buildOutcomesXml(
            $launchData['lis_result_sourcedid'],
            $score
        );

        // Send grade via HTTP POST
        $response = $this->sendOutcomesRequest(
            $launchData['lis_outcome_service_url'],
            $xml
        );

        // Update last sync time
        $updateQuery = "
            UPDATE moodle_lti_sessions
            SET last_grade_sync = NOW()
            WHERE id = :id
        ";
        $updateStmt = $this->db->prepare($updateQuery);
        $updateStmt->execute(['id' => $ltiSessionId]);

        return $response;
    }

    /**
     * Build LTI Outcomes XML for grade passback
     */
    private function buildOutcomesXml($sourcedId, $score) {
        $messageId = uniqid('', true);

        return '<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
    <imsx_POXHeader>
        <imsx_POXRequestHeaderInfo>
            <imsx_version>V1.0</imsx_version>
            <imsx_messageIdentifier>' . $messageId . '</imsx_messageIdentifier>
        </imsx_POXRequestHeaderInfo>
    </imsx_POXHeader>
    <imsx_POXBody>
        <replaceResultRequest>
            <resultRecord>
                <sourcedGUID>
                    <sourcedId>' . htmlspecialchars($sourcedId) . '</sourcedId>
                </sourcedGUID>
                <result>
                    <resultScore>
                        <language>en</language>
                        <textString>' . number_format($score, 2) . '</textString>
                    </resultScore>
                </result>
            </resultRecord>
        </replaceResultRequest>
    </imsx_POXBody>
</imsx_POXEnvelopeRequest>';
    }

    /**
     * Send Outcomes request to Moodle
     */
    private function sendOutcomesRequest($url, $xml) {
        // Build OAuth-signed request
        $oauth = new OAuth($this->consumerKey, $this->sharedSecret,
                          OAUTH_SIG_METHOD_HMACSHA1, OAUTH_AUTH_TYPE_AUTHORIZATION);

        try {
            $oauth->fetch($url, $xml, OAUTH_HTTP_METHOD_POST, [
                'Content-Type' => 'application/xml'
            ]);

            $response = $oauth->getLastResponse();

            // Parse response
            $xmlResponse = simplexml_load_string($response);

            if ($xmlResponse) {
                $status = (string)$xmlResponse->imsx_POXHeader
                                              ->imsx_POXResponseHeaderInfo
                                              ->imsx_statusInfo
                                              ->imsx_codeMajor;

                return $status === 'success';
            }

            return false;

        } catch (Exception $e) {
            error_log("Grade passback error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate grade from DMN drift metrics and session performance
     *
     * @param int $sessionId Learning session ID
     * @return float Grade (0.0 to 1.0)
     */
    public function calculateGradeFromSession($sessionId) {
        $query = "
            SELECT
                ls.dmn_drift_score,
                AVG(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as accuracy_rate,
                COUNT(pa.id) as total_attempts,
                ls.total_duration_seconds
            FROM learning_sessions ls
            LEFT JOIN problem_attempts pa ON ls.id = pa.session_id
            WHERE ls.id = :session_id
            GROUP BY ls.id
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute(['session_id' => $sessionId]);
        $sessionData = $stmt->fetch();

        if (!$sessionData) {
            return 0.0;
        }

        // Calculate composite grade
        // 70% accuracy, 20% engagement (inverse of drift), 10% completion
        $accuracyScore = $sessionData['accuracy_rate'] ?? 0;
        $engagementScore = 1 - ($sessionData['dmn_drift_score'] / 100);
        $completionScore = min(1, $sessionData['total_attempts'] / 10); // 10 problems = full completion

        $grade = (
            ($accuracyScore * 0.7) +
            ($engagementScore * 0.2) +
            ($completionScore * 0.1)
        );

        return max(0, min(1, $grade));
    }
}
