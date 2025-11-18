<?php
/**
 * Moodle Sync Service
 * Moodle 데이터 동기화 서비스
 */

namespace OverconfidenceDetector\Services;

use OverconfidenceDetector\Utils\Database;
use OverconfidenceDetector\Utils\Logger;

class MoodleSync
{
    private $mainDb;
    private $moodleDb;
    private $config;
    private $tablePrefix;

    public function __construct()
    {
        $this->mainDb = Database::getInstance('main');
        $this->moodleDb = Database::getInstance('moodle');

        $dbConfig = require __DIR__ . '/../../config/database.php';
        $this->tablePrefix = $dbConfig['moodle']['prefix'];

        $appConfig = require __DIR__ . '/../../config/app.php';
        $this->config = $appConfig['sync'];
    }

    /**
     * 전체 동기화 실행
     *
     * @return array 동기화 결과
     */
    public function syncAll()
    {
        Logger::info("Starting full sync from Moodle");

        $syncLogId = $this->createSyncLog('full');

        try {
            $this->mainDb->beginTransaction();

            $results = [
                'quizzes' => $this->syncQuizzes(),
                'students' => $this->syncStudents(),
                'questions' => $this->syncQuestions(),
                'attempts' => $this->syncAttempts(),
            ];

            $this->mainDb->commit();

            $totalSynced = array_sum($results);
            $this->updateSyncLog($syncLogId, 'completed', $totalSynced);

            Logger::info("Full sync completed", $results);

            return $results;
        } catch (\Exception $e) {
            $this->mainDb->rollback();
            $this->updateSyncLog($syncLogId, 'failed', 0, $e->getMessage());

            Logger::error("Sync failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 퀴즈 동기화
     *
     * @return int 동기화된 퀴즈 수
     */
    public function syncQuizzes()
    {
        Logger::debug("Syncing quizzes");

        // Moodle에서 퀴즈 가져오기
        $query = "
            SELECT
                q.id,
                q.course,
                q.name,
                q.timelimit,
                COUNT(DISTINCT qa.question) as questions_count
            FROM {$this->tablePrefix}quiz q
            LEFT JOIN {$this->tablePrefix}quiz_attempts qa ON q.id = qa.quiz
            WHERE q.timemodified > DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
            GROUP BY q.id, q.course, q.name, q.timelimit
        ";

        $quizzes = $this->moodleDb->select($query, [
            'lookback_days' => $this->config['lookback_days']
        ]);

        $count = 0;
        foreach ($quizzes as $quiz) {
            $this->upsertQuiz($quiz);
            $count++;
        }

        return $count;
    }

    /**
     * 학생 동기화
     *
     * @return int 동기화된 학생 수
     */
    public function syncStudents()
    {
        Logger::debug("Syncing students");

        // Moodle에서 학생 가져오기 (role = student)
        $query = "
            SELECT DISTINCT
                u.id,
                u.username,
                u.firstname,
                u.lastname,
                u.email
            FROM {$this->tablePrefix}user u
            INNER JOIN {$this->tablePrefix}role_assignments ra ON u.id = ra.userid
            INNER JOIN {$this->tablePrefix}role r ON ra.roleid = r.id
            WHERE r.shortname = 'student'
                AND u.deleted = 0
                AND u.suspended = 0
            LIMIT :batch_size
        ";

        $students = $this->moodleDb->select($query, [
            'batch_size' => $this->config['batch_size']
        ]);

        $count = 0;
        foreach ($students as $student) {
            $this->upsertStudent($student);
            $count++;
        }

        return $count;
    }

    /**
     * 문제 동기화
     *
     * @return int 동기화된 문제 수
     */
    public function syncQuestions()
    {
        Logger::debug("Syncing questions");

        // Moodle에서 문제 가져오기
        $query = "
            SELECT DISTINCT
                q.id,
                qs.quizid as quiz_id,
                q.qtype,
                q.questiontext,
                q.defaultmark
            FROM {$this->tablePrefix}question q
            INNER JOIN {$this->tablePrefix}quiz_slots qs ON q.id = qs.questionid
            WHERE q.parent = 0
            LIMIT :batch_size
        ";

        $questions = $this->moodleDb->select($query, [
            'batch_size' => $this->config['batch_size']
        ]);

        $count = 0;
        foreach ($questions as $question) {
            // 먼저 quiz_id를 내부 ID로 변환
            $localQuiz = $this->mainDb->selectOne(
                "SELECT id FROM quizzes WHERE moodle_quiz_id = ?",
                [$question['quiz_id']]
            );

            if ($localQuiz) {
                $this->upsertQuestion($question, $localQuiz['id']);
                $count++;
            }
        }

        return $count;
    }

    /**
     * 시도 기록 동기화
     *
     * @return int 동기화된 시도 수
     */
    public function syncAttempts()
    {
        Logger::debug("Syncing attempts");

        // Moodle에서 시도 기록 가져오기
        $query = "
            SELECT
                qa.id,
                qa.quiz,
                qa.userid,
                qas.questionid,
                UNIX_TIMESTAMP(FROM_UNIXTIME(qas.timecreated)) as time_started,
                UNIX_TIMESTAMP(FROM_UNIXTIME(qas.timemodified)) as time_finished,
                (qas.timemodified - qas.timecreated) as time_spent_seconds,
                qas.fraction * q.defaultmark as score,
                qas.sequencenumber,
                qas.state,
                qr.answer
            FROM {$this->tablePrefix}quiz_attempts qa
            INNER JOIN {$this->tablePrefix}question_attempts qas ON qa.uniqueid = qas.questionusageid
            INNER JOIN {$this->tablePrefix}question q ON qas.questionid = q.id
            LEFT JOIN {$this->tablePrefix}question_attempt_steps qr ON qas.id = qr.questionattemptid
                AND qr.sequencenumber = (
                    SELECT MAX(sequencenumber)
                    FROM {$this->tablePrefix}question_attempt_steps
                    WHERE questionattemptid = qas.id
                )
            WHERE qa.timemodified > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL :lookback_days DAY))
                AND qas.timemodified > qas.timecreated
            ORDER BY qa.timemodified DESC
            LIMIT :batch_size
        ";

        $attempts = $this->moodleDb->select($query, [
            'lookback_days' => $this->config['lookback_days'],
            'batch_size' => $this->config['batch_size']
        ]);

        $count = 0;
        foreach ($attempts as $attempt) {
            // ID 변환
            $localQuiz = $this->mainDb->selectOne(
                "SELECT id FROM quizzes WHERE moodle_quiz_id = ?",
                [$attempt['quiz']]
            );
            $localStudent = $this->mainDb->selectOne(
                "SELECT id FROM students WHERE moodle_user_id = ?",
                [$attempt['userid']]
            );
            $localQuestion = $this->mainDb->selectOne(
                "SELECT id FROM questions WHERE moodle_question_id = ?",
                [$attempt['questionid']]
            );

            if ($localQuiz && $localStudent && $localQuestion) {
                $this->upsertAttempt($attempt, $localQuiz['id'], $localStudent['id'], $localQuestion['id']);
                $count++;
            }
        }

        return $count;
    }

    /**
     * 퀴즈 데이터 삽입/업데이트
     */
    private function upsertQuiz($quiz)
    {
        $existing = $this->mainDb->selectOne(
            "SELECT id FROM quizzes WHERE moodle_quiz_id = ?",
            [$quiz['id']]
        );

        $data = [
            'moodle_quiz_id' => $quiz['id'],
            'course_id' => $quiz['course'],
            'quiz_name' => $quiz['name'],
            'time_limit' => $quiz['timelimit'],
            'questions_count' => $quiz['questions_count'] ?? 0,
            'last_sync_at' => date('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->mainDb->updateArray('quizzes', $data, ['id' => $existing['id']]);
        } else {
            $this->mainDb->insertArray('quizzes', $data);
        }
    }

    /**
     * 학생 데이터 삽입/업데이트
     */
    private function upsertStudent($student)
    {
        $existing = $this->mainDb->selectOne(
            "SELECT id FROM students WHERE moodle_user_id = ?",
            [$student['id']]
        );

        $data = [
            'moodle_user_id' => $student['id'],
            'username' => $student['username'],
            'firstname' => $student['firstname'],
            'lastname' => $student['lastname'],
            'email' => $student['email'],
        ];

        if ($existing) {
            $this->mainDb->updateArray('students', $data, ['id' => $existing['id']]);
        } else {
            $this->mainDb->insertArray('students', $data);
        }
    }

    /**
     * 문제 데이터 삽입/업데이트
     */
    private function upsertQuestion($question, $localQuizId)
    {
        $existing = $this->mainDb->selectOne(
            "SELECT id FROM questions WHERE moodle_question_id = ?",
            [$question['id']]
        );

        $data = [
            'moodle_question_id' => $question['id'],
            'quiz_id' => $localQuizId,
            'question_type' => $question['qtype'],
            'question_text' => strip_tags($question['questiontext'] ?? ''),
            'max_score' => $question['defaultmark'] ?? 1.0,
        ];

        if ($existing) {
            $this->mainDb->updateArray('questions', $data, ['id' => $existing['id']]);
        } else {
            $this->mainDb->insertArray('questions', $data);
        }
    }

    /**
     * 시도 데이터 삽입/업데이트
     */
    private function upsertAttempt($attempt, $quizId, $studentId, $questionId)
    {
        $existing = $this->mainDb->selectOne(
            "SELECT id FROM attempts WHERE moodle_attempt_id = ?",
            [$attempt['id']]
        );

        $isCorrect = in_array($attempt['state'], ['gradedright', 'mangrright']);

        $data = [
            'moodle_attempt_id' => $attempt['id'],
            'quiz_id' => $quizId,
            'student_id' => $studentId,
            'question_id' => $questionId,
            'time_started' => date('Y-m-d H:i:s', $attempt['time_started']),
            'time_finished' => date('Y-m-d H:i:s', $attempt['time_finished']),
            'time_spent_seconds' => max(1, $attempt['time_spent_seconds']), // 최소 1초
            'score' => $attempt['score'] ?? 0,
            'is_correct' => $isCorrect,
            'answer_text' => $attempt['answer'] ?? '',
        ];

        if ($existing) {
            $this->mainDb->updateArray('attempts', $data, ['id' => $existing['id']]);
        } else {
            $this->mainDb->insertArray('attempts', $data);
        }
    }

    /**
     * 동기화 로그 생성
     */
    private function createSyncLog($type)
    {
        return $this->mainDb->insertArray('sync_logs', [
            'sync_type' => $type,
            'status' => 'running',
            'started_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * 동기화 로그 업데이트
     */
    private function updateSyncLog($id, $status, $recordsSynced, $errorMessage = null)
    {
        $this->mainDb->updateArray('sync_logs', [
            'status' => $status,
            'records_synced' => $recordsSynced,
            'error_message' => $errorMessage,
            'completed_at' => date('Y-m-d H:i:s'),
        ], ['id' => $id]);
    }
}
