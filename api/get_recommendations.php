<?php
/**
 * API Endpoint: Get AI-based learning recommendations
 * Analyzes user data and returns personalized recommendations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance()->getConnection();

    // Get parameters
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;

    if ($userId === 0) {
        throw new Exception('User ID is required');
    }

    // Fetch user's learning data
    $sql = "SELECT
                qa.id,
                qa.sumgrades,
                qa.timefinish,
                qa.timestart,
                qa.attempt,
                q.name as quizname,
                q.grade as maxgrade,
                q.id as quiz_id
            FROM mdl_quiz_attempts qa
            JOIN mdl_quiz q ON qa.quiz = q.id
            WHERE qa.userid = :userid
              AND qa.state = 'finished'
              AND qa.timefinish > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
            ORDER BY qa.timefinish ASC";

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':userid', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $attempts = $stmt->fetchAll();

    // Analyze patterns and generate recommendations
    $recommendations = generateRecommendations($attempts);

    // Limit recommendations
    $recommendations = array_slice($recommendations, 0, $limit);

    $response = array(
        'success' => true,
        'userId' => $userId,
        'recommendations' => $recommendations,
        'insights' => generateInsights($attempts),
        'generatedAt' => time()
    );

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

/**
 * Generate recommendations based on learning data
 */
function generateRecommendations($attempts) {
    $recommendations = array();

    if (empty($attempts)) {
        return array(
            array(
                'type' => 'getting_started',
                'priority' => 'high',
                'title' => '학습 시작하기',
                'description' => '첫 퀴즈를 풀어보고 당신의 학습 여정을 시작하세요!',
                'icon' => '🎯',
                'confidence' => 1.0,
                'suggestedContent' => array('입문 퀴즈', '기초 개념 학습')
            )
        );
    }

    // Calculate statistics
    $scores = array();
    $timeTaken = array();
    $quizzes = array();

    foreach ($attempts as $attempt) {
        $normalizedScore = $attempt['maxgrade'] > 0
            ? ($attempt['sumgrades'] / $attempt['maxgrade']) * 100
            : 0;

        $scores[] = $normalizedScore;
        $timeTaken[] = $attempt['timefinish'] - $attempt['timestart'];

        if (!isset($quizzes[$attempt['quizname']])) {
            $quizzes[$attempt['quizname']] = array('count' => 0, 'scores' => array());
        }
        $quizzes[$attempt['quizname']]['count']++;
        $quizzes[$attempt['quizname']]['scores'][] = $normalizedScore;
    }

    $avgScore = array_sum($scores) / count($scores);
    $recentScores = array_slice($scores, -5);
    $recentAvg = array_sum($recentScores) / count($recentScores);

    // Recommendation 1: Performance-based
    if ($recentAvg < $avgScore - 10) {
        $recommendations[] = array(
            'type' => 'performance',
            'priority' => 'high',
            'title' => '최근 성적 하락 주의',
            'description' => '최근 성적이 평균보다 낮습니다. 기초를 다시 복습하는 것을 추천합니다.',
            'icon' => '📉',
            'confidence' => 0.85,
            'action' => 'review_basics',
            'suggestedContent' => array(
                '기초 개념 복습',
                '오답 노트 확인',
                '학습 속도 조절'
            )
        );
    } elseif ($recentAvg > $avgScore + 10) {
        $recommendations[] = array(
            'type' => 'performance',
            'priority' => 'medium',
            'title' => '훌륭한 성과!',
            'description' => '최근 성적이 크게 향상되었습니다. 다음 단계로 진행할 준비가 되었습니다.',
            'icon' => '📈',
            'confidence' => 0.9,
            'action' => 'advance_level',
            'suggestedContent' => array(
                '심화 학습',
                '고급 문제 도전',
                '프로젝트 실습'
            )
        );
    }

    // Recommendation 2: Weak areas
    $weakQuizzes = array();
    foreach ($quizzes as $name => $data) {
        $quizAvg = array_sum($data['scores']) / count($data['scores']);
        if ($quizAvg < 70) {
            $weakQuizzes[] = array(
                'name' => $name,
                'avg' => $quizAvg,
                'count' => $data['count']
            );
        }
    }

    if (!empty($weakQuizzes)) {
        usort($weakQuizzes, function($a, $b) {
            return $a['avg'] - $b['avg'];
        });

        $weakest = $weakQuizzes[0];
        $recommendations[] = array(
            'type' => 'weak_area',
            'priority' => 'high',
            'title' => $weakest['name'] . ' 집중 학습',
            'description' => $weakest['name'] . '에서 평균 ' . round($weakest['avg'], 1) . '점을 기록했습니다. 이 부분을 집중적으로 학습하세요.',
            'icon' => '🎯',
            'confidence' => 0.8,
            'action' => 'focus_weak_area',
            'suggestedContent' => array(
                $weakest['name'] . ' 기본 개념',
                $weakest['name'] . ' 연습 문제',
                $weakest['name'] . ' 심화 학습'
            ),
            'metadata' => array(
                'quizName' => $weakest['name'],
                'averageScore' => $weakest['avg']
            )
        );
    }

    // Recommendation 3: Consistency
    $timestamps = array_map(function($a) { return $a['timefinish']; }, $attempts);
    sort($timestamps);

    $gaps = array();
    for ($i = 1; $i < count($timestamps); $i++) {
        $gaps[] = $timestamps[$i] - $timestamps[$i - 1];
    }

    $avgGap = !empty($gaps) ? array_sum($gaps) / count($gaps) : 0;
    $daysGap = $avgGap / 86400;

    if ($daysGap > 7) {
        $recommendations[] = array(
            'type' => 'consistency',
            'priority' => 'medium',
            'title' => '꾸준한 학습 필요',
            'description' => '평균 ' . round($daysGap, 1) . '일 간격으로 학습하고 있습니다. 더 자주 학습하면 효과가 좋습니다.',
            'icon' => '📅',
            'confidence' => 0.75,
            'action' => 'improve_consistency',
            'suggestedContent' => array(
                '매일 15분 학습 루틴',
                '학습 알림 설정',
                '주간 목표 설정'
            )
        );
    }

    // Recommendation 4: Time management
    $avgTime = array_sum($timeTaken) / count($timeTaken);
    if ($avgTime > 3600) { // More than 1 hour
        $recommendations[] = array(
            'type' => 'time_management',
            'priority' => 'low',
            'title' => '학습 시간 최적화',
            'description' => '평균 ' . round($avgTime / 60, 0) . '분이 소요되고 있습니다. 시간 관리 전략을 개선해보세요.',
            'icon' => '⏱️',
            'confidence' => 0.7,
            'action' => 'optimize_time',
            'suggestedContent' => array(
                '타이머 사용하기',
                '집중 학습 기법',
                '효율적인 노트 정리'
            )
        );
    }

    // Recommendation 5: Challenge
    if ($avgScore > 85) {
        $recommendations[] = array(
            'type' => 'challenge',
            'priority' => 'low',
            'title' => '고급 과정 도전',
            'description' => '평균 ' . round($avgScore, 1) . '점으로 우수한 성과를 보이고 있습니다. 더 어려운 과정에 도전해보세요!',
            'icon' => '🏆',
            'confidence' => 0.9,
            'action' => 'advanced_challenge',
            'suggestedContent' => array(
                '고급 심화 과정',
                '실전 프로젝트',
                '경시대회 준비'
            )
        );
    }

    return $recommendations;
}

/**
 * Generate learning insights
 */
function generateInsights($attempts) {
    if (empty($attempts)) {
        return array(
            'learningRate' => 0,
            'consistency' => 0,
            'averageScore' => 0,
            'totalActivities' => 0
        );
    }

    $scores = array();
    foreach ($attempts as $attempt) {
        $normalizedScore = $attempt['maxgrade'] > 0
            ? ($attempt['sumgrades'] / $attempt['maxgrade']) * 100
            : 0;
        $scores[] = $normalizedScore;
    }

    // Calculate learning rate (slope)
    $n = count($scores);
    $x = range(0, $n - 1);
    $y = $scores;

    $sumX = array_sum($x);
    $sumY = array_sum($y);
    $sumXY = 0;
    $sumX2 = 0;

    for ($i = 0; $i < $n; $i++) {
        $sumXY += $x[$i] * $y[$i];
        $sumX2 += $x[$i] * $x[$i];
    }

    $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);

    // Calculate consistency
    $avgScore = $sumY / $n;
    $variance = 0;
    foreach ($scores as $score) {
        $variance += pow($score - $avgScore, 2);
    }
    $variance /= $n;
    $stdDev = sqrt($variance);
    $consistency = $avgScore > 0 ? max(0, 1 - ($stdDev / $avgScore)) : 0;

    return array(
        'learningRate' => round($slope, 2),
        'consistency' => round($consistency, 2),
        'averageScore' => round($avgScore, 1),
        'totalActivities' => $n,
        'trend' => $slope > 0 ? 'improving' : ($slope < 0 ? 'declining' : 'stable')
    );
}
?>
