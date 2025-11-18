<?php
/**
 * Moodle 연동 API
 * Moodle 3.7에서 문제 정보를 가져오는 API
 */

require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../lib/equation_extractor.php';

/**
 * 특정 문제 정보 가져오기
 *
 * @param int $questionId 문제 ID
 * @return array 방정식 데이터
 */
function getQuestionById($questionId) {
    try {
        // Moodle에서 문제 정보 가져오기
        $question = callMoodleAPI('core_question_get_questions', [
            'questionids' => [$questionId]
        ]);

        if (empty($question)) {
            throw new Exception("문제를 찾을 수 없습니다");
        }

        $questionData = $question[0];

        // 문제 텍스트에서 방정식 추출
        $equation = extractEquationFromQuestion($questionData);

        return [
            'id' => $questionData['id'],
            'expression' => $equation['expression'],
            'type' => $equation['type'],
            'title' => strip_tags($questionData['name']),
            'questionText' => strip_tags($questionData['questiontext']),
            'difficulty' => estimateDifficulty($equation['expression'])
        ];

    } catch (Exception $e) {
        error_log("문제 가져오기 오류: " . $e->getMessage());
        throw $e;
    }
}

/**
 * 퀴즈의 모든 문제 가져오기
 *
 * @param int $quizId 퀴즈 ID
 * @return array 문제 목록
 */
function getQuizQuestions($quizId) {
    try {
        // Moodle에서 퀴즈 정보 가져오기
        $quiz = callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
            'courseids' => []
        ]);

        // 퀴즈의 문제 목록 가져오기
        $questions = callMoodleAPI('mod_quiz_get_quiz_questions', [
            'quizid' => $quizId
        ]);

        $result = [];
        foreach ($questions as $question) {
            $equation = extractEquationFromQuestion($question);

            $result[] = [
                'id' => $question['id'],
                'expression' => $equation['expression'],
                'type' => $equation['type'],
                'title' => strip_tags($question['name']),
                'difficulty' => estimateDifficulty($equation['expression'])
            ];
        }

        return $result;

    } catch (Exception $e) {
        error_log("퀴즈 문제 목록 가져오기 오류: " . $e->getMessage());
        throw $e;
    }
}

/**
 * 학생 답안 제출
 *
 * @param int $questionId 문제 ID
 * @param array $answer 답안 데이터
 * @return array 제출 결과
 */
function submitStudentAnswer($questionId, $answer) {
    try {
        // Moodle에 답안 제출
        $result = callMoodleAPI('mod_quiz_process_attempt', [
            'attemptid' => $answer['attemptId'],
            'data' => $answer['responses']
        ]);

        return [
            'success' => true,
            'result' => $result
        ];

    } catch (Exception $e) {
        error_log("답안 제출 오류: " . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

/**
 * 난이도 추정
 *
 * @param string $expression 방정식
 * @return string 난이도 (easy, medium, hard)
 */
function estimateDifficulty($expression) {
    // 간단한 난이도 추정 알고리즘
    $score = 0;

    // 이차방정식이면 +2
    if (preg_match('/x\^2|x²/', $expression)) {
        $score += 2;
    }

    // 괄호가 있으면 +1
    if (preg_match('/\(.*\)/', $expression)) {
        $score += 1;
    }

    // 분수가 있으면 +1
    if (preg_match('/\//', $expression)) {
        $score += 1;
    }

    // 항의 개수
    $terms = preg_split('/[+\-]/', $expression);
    if (count($terms) > 3) {
        $score += 1;
    }

    if ($score <= 1) return 'easy';
    if ($score <= 3) return 'medium';
    return 'hard';
}
