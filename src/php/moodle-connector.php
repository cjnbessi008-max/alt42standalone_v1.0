<?php
/**
 * Moodle Connector - Moodle 3.7 LMS 연동
 */

class MoodleConnector {
    private $db;
    private $moodleConfig;

    public function __construct($dbConnection) {
        $this->db = new Database();
        $this->moodleConfig = [
            'url' => defined('MOODLE_URL') ? MOODLE_URL : '',
            'token' => defined('MOODLE_TOKEN') ? MOODLE_TOKEN : '',
            'enabled' => defined('MOODLE_ENABLED') ? MOODLE_ENABLED : false
        ];
    }

    /**
     * Moodle 연결 확인
     */
    public function checkConnection() {
        if (!$this->moodleConfig['enabled']) {
            return false;
        }

        try {
            // Moodle Web Service API 호출 테스트
            $response = $this->callMoodleAPI('core_webservice_get_site_info', []);
            return isset($response['sitename']);
        } catch (Exception $e) {
            error_log("Moodle connection check failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle API 호출
     */
    private function callMoodleAPI($function, $params) {
        if (!$this->moodleConfig['enabled'] || empty($this->moodleConfig['url'])) {
            throw new Exception("Moodle is not configured");
        }

        $url = $this->moodleConfig['url'] . '/webservice/rest/server.php';

        $data = [
            'wstoken' => $this->moodleConfig['token'],
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        $data = array_merge($data, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API error: HTTP " . $httpCode);
        }

        return json_decode($response, true);
    }

    /**
     * 문제 ID로 문제 가져오기
     */
    public function getProblemById($problemId) {
        $sql = "SELECT * FROM problems WHERE id = ? AND active = 1";
        $problem = $this->db->fetchOne($sql, [$problemId]);

        if ($problem) {
            $problem['expectedRoots'] = json_decode($problem['expected_roots'], true);
            return $problem;
        }

        return null;
    }

    /**
     * 랜덤 문제 가져오기
     */
    public function getRandomProblem() {
        $sql = "SELECT * FROM problems WHERE active = 1 ORDER BY RAND() LIMIT 1";
        $problem = $this->db->fetchOne($sql);

        if ($problem) {
            $problem['expectedRoots'] = json_decode($problem['expected_roots'], true);
            return $problem;
        }

        return null;
    }

    /**
     * 문제 목록 가져오기
     */
    public function getProblemList($limit = 20) {
        $sql = "SELECT * FROM problems WHERE active = 1 ORDER BY difficulty, id LIMIT ?";
        $problems = $this->db->fetchAll($sql, [$limit]);

        foreach ($problems as &$problem) {
            $problem['expectedRoots'] = json_decode($problem['expected_roots'], true);
        }

        return $problems;
    }

    /**
     * 답안 평가
     */
    public function evaluateAnswer($problemId, $userRoots, $userId) {
        // 문제 정보 가져오기
        $problem = $this->getProblemById($problemId);

        if (!$problem) {
            throw new Exception("Problem not found");
        }

        $expectedRoots = $problem['expectedRoots'];

        // 근 비교 (허용 오차)
        $tolerance = 0.01;
        $correctCount = 0;
        $totalExpected = count($expectedRoots);

        foreach ($expectedRoots as $expected) {
            foreach ($userRoots as $userRoot) {
                if (abs($userRoot['x'] - $expected) < $tolerance) {
                    $correctCount++;
                    break;
                }
            }
        }

        // 점수 계산 (0-100)
        $score = $totalExpected > 0 ? round(($correctCount / $totalExpected) * 100) : 0;

        // 추가 감점: 잘못된 근을 찾은 경우
        $extraRoots = count($userRoots) - $correctCount;
        if ($extraRoots > 0) {
            $score -= $extraRoots * 10; // 잘못된 근 하나당 -10점
            $score = max(0, $score);
        }

        // 피드백 생성
        $feedback = $this->generateFeedback($correctCount, $totalExpected, $extraRoots);

        return [
            'score' => $score,
            'correct' => $correctCount === $totalExpected && $extraRoots === 0,
            'correctCount' => $correctCount,
            'totalExpected' => $totalExpected,
            'extraRoots' => $extraRoots,
            'feedback' => $feedback
        ];
    }

    /**
     * 피드백 생성
     */
    private function generateFeedback($correct, $total, $extra) {
        if ($correct === $total && $extra === 0) {
            return "완벽합니다! 모든 근을 정확하게 찾았습니다.";
        } elseif ($correct === $total && $extra > 0) {
            return "모든 근을 찾았지만, {$extra}개의 잘못된 근이 포함되어 있습니다.";
        } elseif ($correct > 0) {
            $missing = $total - $correct;
            return "{$total}개 중 {$correct}개의 근을 찾았습니다. {$missing}개의 근이 누락되었습니다.";
        } else {
            return "근을 찾지 못했습니다. 다시 시도해보세요.";
        }
    }

    /**
     * 답안 저장
     */
    public function saveAnswer($problemId, $userId, $roots, $score, $timestamp) {
        $sql = "INSERT INTO answers (problem_id, user_id, roots, score, submitted_at)
                VALUES (?, ?, ?, ?, ?)";

        $rootsJson = json_encode($roots, JSON_UNESCAPED_UNICODE);

        $result = $this->db->execute($sql, [
            $problemId,
            $userId,
            $rootsJson,
            $score,
            $timestamp
        ]);

        return $result['insert_id'];
    }

    /**
     * 진행 상황 저장
     */
    public function saveProgress($problemId, $userId, $roots, $timestamp) {
        $sql = "INSERT INTO progress (problem_id, user_id, roots, updated_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE roots = ?, updated_at = ?";

        $rootsJson = json_encode($roots, JSON_UNESCAPED_UNICODE);

        $result = $this->db->execute($sql, [
            $problemId,
            $userId,
            $rootsJson,
            $timestamp,
            $rootsJson,
            $timestamp
        ]);

        return $result['affected_rows'] > 0;
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUserInfo($userId) {
        // 로컬 DB에서 사용자 정보 조회
        $sql = "SELECT * FROM users WHERE id = ?";
        $user = $this->db->fetchOne($sql, [$userId]);

        if ($user) {
            return $user;
        }

        // Moodle에서 사용자 정보 가져오기 (선택적)
        if ($this->moodleConfig['enabled']) {
            try {
                $moodleUser = $this->callMoodleAPI('core_user_get_users_by_field', [
                    'field' => 'username',
                    'values[0]' => $userId
                ]);

                if (!empty($moodleUser)) {
                    return [
                        'id' => $userId,
                        'username' => $moodleUser[0]['username'],
                        'fullname' => $moodleUser[0]['fullname'],
                        'email' => $moodleUser[0]['email']
                    ];
                }
            } catch (Exception $e) {
                error_log("Failed to fetch user from Moodle: " . $e->getMessage());
            }
        }

        // 기본 사용자 정보
        return [
            'id' => $userId,
            'username' => $userId,
            'fullname' => 'Guest User',
            'email' => ''
        ];
    }

    /**
     * 사용자 통계 가져오기
     */
    public function getUserStatistics($userId) {
        $sql = "SELECT
                    COUNT(*) as total_submissions,
                    AVG(score) as average_score,
                    MAX(score) as best_score,
                    COUNT(DISTINCT problem_id) as problems_attempted
                FROM answers
                WHERE user_id = ?";

        return $this->db->fetchOne($sql, [$userId]);
    }
}
