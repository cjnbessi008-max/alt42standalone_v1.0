<?php
/**
 * Relation Lines - Get Question API
 * Moodle에서 문제 데이터를 가져오는 API
 */

require_once 'config.php';

// GET 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('GET 요청만 허용됩니다.', 405);
}

// 문제 ID 가져오기
$questionId = isset($_GET['qid']) ? intval($_GET['qid']) : 0;

if ($questionId <= 0) {
    sendErrorResponse('유효하지 않은 문제 ID입니다.');
}

try {
    $pdo = getDBConnection();

    if (!$pdo) {
        // DB 연결 실패시 샘플 데이터 반환
        sendSampleQuestion($questionId);
    }

    // Moodle에서 문제 데이터 가져오기
    // 실제 Moodle 스키마에 맞게 수정 필요
    $stmt = $pdo->prepare("
        SELECT
            q.id,
            q.name as title,
            q.questiontext as description,
            q.qtype,
            qd.data as question_data
        FROM " . MOODLE_PREFIX . "question q
        LEFT JOIN " . MOODLE_PREFIX . "question_relationlines qd ON q.id = qd.questionid
        WHERE q.id = :questionId
        LIMIT 1
    ");

    $stmt->execute(['questionId' => $questionId]);
    $question = $stmt->fetch();

    if (!$question) {
        // 문제를 찾지 못한 경우 샘플 데이터 반환
        sendSampleQuestion($questionId);
    }

    // 문제 데이터 파싱
    $questionData = json_decode($question['question_data'], true);

    if (!$questionData) {
        // JSON 파싱 실패시 샘플 데이터 반환
        sendSampleQuestion($questionId);
    }

    // 응답 데이터 구성
    $response = [
        'success' => true,
        'question' => [
            'id' => $question['id'],
            'title' => strip_tags($question['title']),
            'description' => strip_tags($question['description']),
            'leftNumbers' => $questionData['leftNumbers'] ?? [],
            'rightNumbers' => $questionData['rightNumbers'] ?? [],
            'correctAnswers' => $questionData['correctAnswers'] ?? []
        ]
    ];

    sendJsonResponse($response);

} catch (Exception $e) {
    error_log("Get Question Error: " . $e->getMessage());
    sendSampleQuestion($questionId);
}

/**
 * 샘플 문제 데이터 반환 (DB 연결 실패시 또는 테스트용)
 */
function sendSampleQuestion($questionId) {
    $samples = [
        1 => [
            'title' => '분수와 소수 매칭하기',
            'description' => '같은 값을 가진 분수와 소수를 연결하세요.',
            'leftNumbers' => ['1/2', '1/4', '3/4', '1/5', '2/5'],
            'rightNumbers' => ['0.5', '0.25', '0.75', '0.2', '0.4'],
            'correctAnswers' => [
                '1/2' => '0.5',
                '1/4' => '0.25',
                '3/4' => '0.75',
                '1/5' => '0.2',
                '2/5' => '0.4'
            ]
        ],
        2 => [
            'title' => '곱셈구구 연결하기',
            'description' => '왼쪽 식과 오른쪽 답을 연결하세요.',
            'leftNumbers' => ['2 × 3', '3 × 4', '4 × 5', '5 × 6', '6 × 7'],
            'rightNumbers' => ['6', '12', '20', '30', '42'],
            'correctAnswers' => [
                '2 × 3' => '6',
                '3 × 4' => '12',
                '4 × 5' => '20',
                '5 × 6' => '30',
                '6 × 7' => '42'
            ]
        ],
        3 => [
            'title' => '영어 단어와 뜻 연결하기',
            'description' => '영어 단어와 한글 뜻을 연결하세요.',
            'leftNumbers' => ['Apple', 'Book', 'Cat', 'Dog', 'Eye'],
            'rightNumbers' => ['사과', '책', '고양이', '개', '눈'],
            'correctAnswers' => [
                'Apple' => '사과',
                'Book' => '책',
                'Cat' => '고양이',
                'Dog' => '개',
                'Eye' => '눈'
            ]
        ],
        4 => [
            'title' => '도형과 면의 개수',
            'description' => '도형과 면의 개수를 연결하세요.',
            'leftNumbers' => ['삼각형', '사각형', '오각형', '육각형', '원'],
            'rightNumbers' => ['3', '4', '5', '6', '무한'],
            'correctAnswers' => [
                '삼각형' => '3',
                '사각형' => '4',
                '오각형' => '5',
                '육각형' => '6',
                '원' => '무한'
            ]
        ],
        5 => [
            'title' => '국가와 수도 연결하기',
            'description' => '국가와 수도를 연결하세요.',
            'leftNumbers' => ['한국', '일본', '중국', '미국', '영국'],
            'rightNumbers' => ['서울', '도쿄', '베이징', '워싱턴', '런던'],
            'correctAnswers' => [
                '한국' => '서울',
                '일본' => '도쿄',
                '중국' => '베이징',
                '미국' => '워싱턴',
                '영국' => '런던'
            ]
        ]
    ];

    // 문제 ID에 해당하는 샘플이 없으면 1번 문제 반환
    $sampleId = isset($samples[$questionId]) ? $questionId : 1;
    $sample = $samples[$sampleId];

    $response = [
        'success' => true,
        'question' => array_merge(['id' => $questionId], $sample),
        'note' => 'This is sample data for testing purposes.'
    ];

    sendJsonResponse($response);
}
