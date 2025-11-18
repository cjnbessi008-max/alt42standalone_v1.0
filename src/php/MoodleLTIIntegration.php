<?php
/**
 * Moodle 3.7 LTI Integration
 * PHP 7.1.9 Compatible
 *
 * Purpose: LTI (Learning Tools Interoperability) provider for Moodle integration
 * Handles authentication, user mapping, and grade synchronization
 */

namespace AltEducation\Moodle;

use PDO;
use PDOException;
use Exception;

class MoodleLTIIntegration
{
    private $db;
    private $config;

    // LTI 1.1 Required Parameters
    const LTI_VERSION = 'LTI-1p0';
    const LTI_MESSAGE_TYPE = 'basic-lti-launch-request';

    /**
     * Constructor
     *
     * @param PDO $db Database connection
     * @param array $config Configuration array
     */
    public function __construct(PDO $db, array $config = [])
    {
        $this->db = $db;
        $this->config = array_merge([
            'lti_consumer_key' => '',
            'lti_shared_secret' => '',
            'session_timeout' => 3600,
            'grade_sync_enabled' => true,
        ], $config);
    }

    /**
     * LTI 요청 검증
     *
     * @param array $params LTI launch parameters
     * @return bool|array Returns user data if valid, false otherwise
     */
    public function validateLTIRequest(array $params)
    {
        // 1. 필수 파라미터 검증
        $requiredParams = [
            'lti_message_type',
            'lti_version',
            'resource_link_id',
            'user_id',
            'oauth_consumer_key',
            'oauth_signature',
            'oauth_signature_method',
            'oauth_timestamp',
            'oauth_nonce'
        ];

        foreach ($requiredParams as $param) {
            if (!isset($params[$param])) {
                error_log("LTI Validation Failed: Missing parameter {$param}");
                return false;
            }
        }

        // 2. LTI 버전 확인
        if ($params['lti_version'] !== self::LTI_VERSION) {
            error_log("LTI Validation Failed: Unsupported version {$params['lti_version']}");
            return false;
        }

        // 3. Consumer Key 확인
        if ($params['oauth_consumer_key'] !== $this->config['lti_consumer_key']) {
            error_log("LTI Validation Failed: Invalid consumer key");
            return false;
        }

        // 4. OAuth 서명 검증
        if (!$this->verifyOAuthSignature($params)) {
            error_log("LTI Validation Failed: Invalid OAuth signature");
            return false;
        }

        // 5. Timestamp와 Nonce 검증 (재생 공격 방지)
        if (!$this->verifyTimestampAndNonce($params['oauth_timestamp'], $params['oauth_nonce'])) {
            error_log("LTI Validation Failed: Invalid timestamp or nonce");
            return false;
        }

        // 검증 성공 - 사용자 데이터 반환
        return [
            'moodle_user_id' => $params['user_id'],
            'username' => $params['lis_person_name_given'] ?? 'Unknown',
            'email' => $params['lis_person_contact_email_primary'] ?? '',
            'full_name' => $params['lis_person_name_full'] ?? '',
            'role' => $this->extractRole($params),
            'context_id' => $params['context_id'] ?? '',
            'resource_link_id' => $params['resource_link_id']
        ];
    }

    /**
     * OAuth 1.0 서명 검증
     *
     * @param array $params Request parameters
     * @return bool
     */
    private function verifyOAuthSignature(array $params)
    {
        // 서명 제외한 파라미터로 기본 문자열 생성
        $baseParams = $params;
        unset($baseParams['oauth_signature']);

        // 파라미터 정렬 및 인코딩
        ksort($baseParams);
        $paramString = '';
        foreach ($baseParams as $key => $value) {
            if ($paramString !== '') {
                $paramString .= '&';
            }
            $paramString .= rawurlencode($key) . '=' . rawurlencode($value);
        }

        // 기본 문자열 생성
        $baseUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $baseUrl = strtok($baseUrl, '?'); // 쿼리 문자열 제거

        $baseString = 'POST&' . rawurlencode($baseUrl) . '&' . rawurlencode($paramString);

        // HMAC-SHA1 서명 생성
        $key = rawurlencode($this->config['lti_shared_secret']) . '&';
        $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));

        // 서명 비교
        return hash_equals($signature, $params['oauth_signature']);
    }

    /**
     * Timestamp와 Nonce 검증 (재생 공격 방지)
     *
     * @param string $timestamp OAuth timestamp
     * @param string $nonce OAuth nonce
     * @return bool
     */
    private function verifyTimestampAndNonce($timestamp, $nonce)
    {
        // Timestamp 확인 (5분 이내)
        $currentTime = time();
        $timeDiff = abs($currentTime - (int)$timestamp);

        if ($timeDiff > 300) { // 5분
            return false;
        }

        // Nonce 중복 확인 (데이터베이스에 저장)
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO oauth_nonces (nonce, timestamp, created_at) VALUES (?, ?, NOW())"
            );
            $stmt->execute([$nonce, $timestamp]);

            // 오래된 nonce 정리 (10분 이상 된 것)
            $this->db->exec("DELETE FROM oauth_nonces WHERE timestamp < " . ($currentTime - 600));

            return true;
        } catch (PDOException $e) {
            // Duplicate entry - nonce already used
            if ($e->getCode() === '23000') {
                return false;
            }
            error_log("Nonce verification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 사용자 역할 추출
     *
     * @param array $params LTI parameters
     * @return string
     */
    private function extractRole(array $params)
    {
        $roles = isset($params['roles']) ? explode(',', $params['roles']) : [];

        foreach ($roles as $role) {
            $role = strtolower(trim($role));
            if (strpos($role, 'instructor') !== false || strpos($role, 'teacher') !== false) {
                return 'teacher';
            }
            if (strpos($role, 'learner') !== false || strpos($role, 'student') !== false) {
                return 'student';
            }
        }

        return 'student'; // 기본값
    }

    /**
     * Moodle 사용자와 로컬 사용자 매핑
     *
     * @param array $userData User data from LTI
     * @return string Local student UUID
     */
    public function mapMoodleUser(array $userData)
    {
        try {
            // 기존 매핑 확인
            $stmt = $this->db->prepare(
                "SELECT local_student_id FROM moodle_user_mapping WHERE moodle_user_id = ?"
            );
            $stmt->execute([$userData['moodle_user_id']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // 매핑 업데이트
                $stmt = $this->db->prepare(
                    "UPDATE moodle_user_mapping
                     SET moodle_username = ?, moodle_email = ?, last_sync_at = NOW()
                     WHERE moodle_user_id = ?"
                );
                $stmt->execute([
                    $userData['username'],
                    $userData['email'],
                    $userData['moodle_user_id']
                ]);

                return $existing['local_student_id'];
            }

            // 새 사용자 생성
            $localStudentId = $this->generateUUID();

            $stmt = $this->db->prepare(
                "INSERT INTO moodle_user_mapping
                 (moodle_user_id, local_student_id, moodle_username, moodle_email, created_at)
                 VALUES (?, ?, ?, ?, NOW())"
            );
            $stmt->execute([
                $userData['moodle_user_id'],
                $localStudentId,
                $userData['username'],
                $userData['email']
            ]);

            return $localStudentId;

        } catch (PDOException $e) {
            error_log("User mapping error: " . $e->getMessage());
            throw new Exception("Failed to map Moodle user");
        }
    }

    /**
     * Moodle에 성적 동기화
     *
     * @param string $studentId Local student UUID
     * @param string $moduleId Module UUID
     * @param float $gradeValue Grade value (0-100)
     * @param string $activityId Moodle activity ID
     * @return bool
     */
    public function syncGradeToMoodle($studentId, $moduleId, $gradeValue, $activityId)
    {
        if (!$this->config['grade_sync_enabled']) {
            return true; // 동기화 비활성화 시 성공 반환
        }

        try {
            // 성적 동기화 레코드 생성
            $stmt = $this->db->prepare(
                "INSERT INTO moodle_grade_sync
                 (student_id, module_id, moodle_activity_id, grade_value, sync_status, created_at)
                 VALUES (?, ?, ?, ?, 'pending', NOW())
                 ON DUPLICATE KEY UPDATE
                 grade_value = ?, sync_status = 'pending', updated_at = NOW()"
            );
            $stmt->execute([
                $studentId,
                $moduleId,
                $activityId,
                $gradeValue,
                $gradeValue
            ]);

            // 실제 Moodle API 호출 (비동기로 처리하는 것이 좋음)
            $syncResult = $this->sendGradeToMoodle($studentId, $activityId, $gradeValue);

            if ($syncResult) {
                // 성공 시 상태 업데이트
                $stmt = $this->db->prepare(
                    "UPDATE moodle_grade_sync
                     SET sync_status = 'synced', last_sync_at = NOW()
                     WHERE student_id = ? AND module_id = ? AND moodle_activity_id = ?"
                );
                $stmt->execute([$studentId, $moduleId, $activityId]);

                return true;
            } else {
                // 실패 시 상태 업데이트
                $stmt = $this->db->prepare(
                    "UPDATE moodle_grade_sync
                     SET sync_status = 'failed', sync_attempts = sync_attempts + 1,
                         error_message = ?, updated_at = NOW()
                     WHERE student_id = ? AND module_id = ? AND moodle_activity_id = ?"
                );
                $stmt->execute([
                    'Failed to sync grade to Moodle',
                    $studentId,
                    $moduleId,
                    $activityId
                ]);

                return false;
            }

        } catch (PDOException $e) {
            error_log("Grade sync error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle Gradebook API로 성적 전송
     *
     * @param string $studentId Student ID
     * @param string $activityId Activity ID
     * @param float $gradeValue Grade value
     * @return bool
     */
    private function sendGradeToMoodle($studentId, $activityId, $gradeValue)
    {
        // Moodle 사용자 ID 가져오기
        $stmt = $this->db->prepare(
            "SELECT moodle_user_id FROM moodle_user_mapping WHERE local_student_id = ?"
        );
        $stmt->execute([$studentId]);
        $mapping = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mapping) {
            error_log("No Moodle user mapping found for student: {$studentId}");
            return false;
        }

        // Moodle Web Service API 호출
        $moodleUrl = $this->getMoodleUrl();
        if (!$moodleUrl) {
            return false;
        }

        $params = [
            'source' => 'alt42_lti',
            'courseid' => $activityId,
            'component' => 'mod_lti',
            'activityid' => $activityId,
            'itemnumber' => 0,
            'grades' => [
                [
                    'studentid' => $mapping['moodle_user_id'],
                    'grade' => $gradeValue
                ]
            ]
        ];

        // cURL로 Moodle API 호출
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $moodleUrl . '/webservice/rest/server.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            error_log("Grade synced to Moodle successfully");
            return true;
        } else {
            error_log("Failed to sync grade to Moodle. HTTP Code: {$httpCode}, Response: {$response}");
            return false;
        }
    }

    /**
     * Moodle URL 가져오기
     *
     * @return string|null
     */
    private function getMoodleUrl()
    {
        try {
            $stmt = $this->db->query(
                "SELECT moodle_url FROM moodle_integration WHERE is_active = TRUE LIMIT 1"
            );
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result ? $result['moodle_url'] : null;
        } catch (PDOException $e) {
            error_log("Failed to get Moodle URL: " . $e->getMessage());
            return null;
        }
    }

    /**
     * UUID 생성 (PHP 7.1 호환)
     *
     * @return string
     */
    private function generateUUID()
    {
        $data = random_bytes(16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * 세션 생성
     *
     * @param array $userData User data
     * @param string $localStudentId Local student UUID
     * @return string Session token
     */
    public function createSession(array $userData, $localStudentId)
    {
        $sessionToken = bin2hex(random_bytes(32));

        $_SESSION['lti_session'] = [
            'token' => $sessionToken,
            'student_id' => $localStudentId,
            'moodle_user_id' => $userData['moodle_user_id'],
            'role' => $userData['role'],
            'context_id' => $userData['context_id'],
            'resource_link_id' => $userData['resource_link_id'],
            'created_at' => time(),
            'expires_at' => time() + $this->config['session_timeout']
        ];

        return $sessionToken;
    }

    /**
     * 세션 검증
     *
     * @param string $token Session token
     * @return bool|array Returns session data if valid, false otherwise
     */
    public function validateSession($token)
    {
        if (!isset($_SESSION['lti_session'])) {
            return false;
        }

        $session = $_SESSION['lti_session'];

        // 토큰 확인
        if (!hash_equals($session['token'], $token)) {
            return false;
        }

        // 만료 확인
        if (time() > $session['expires_at']) {
            unset($_SESSION['lti_session']);
            return false;
        }

        return $session;
    }
}

/**
 * OAuth Nonce 테이블 생성 (한 번만 실행)
 *
 * CREATE TABLE IF NOT EXISTS oauth_nonces (
 *     id INT PRIMARY KEY AUTO_INCREMENT,
 *     nonce VARCHAR(100) NOT NULL UNIQUE,
 *     timestamp INT NOT NULL,
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     INDEX idx_timestamp (timestamp)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 */
