/**
 * Question Set Controller
 *
 * 문제 세트 및 Data Shuffle 관련 API 엔드포인트
 *
 * @module QuestionSetController
 */

const { ShuffleService } = require('../services/ShuffleService');
const { Pool } = require('pg');

class QuestionSetController {
    constructor(dbPool) {
        this.db = dbPool;
    }

    /**
     * 문제 세트 생성
     * POST /api/question-sets
     */
    async createQuestionSet(req, res) {
        try {
            const {
                module_id,
                name,
                description,
                shuffle_questions = false,
                shuffle_answers = false,
                shuffle_strategy = 'seeded',
                preserve_groups = false,
                preserve_difficulty_order = false,
                section_based_shuffle = false
            } = req.body;

            // 입력 검증
            if (!name) {
                return res.status(400).json({
                    error: 'Name is required'
                });
            }

            const teacherId = req.user.id; // 인증 미들웨어에서 설정됨

            const result = await this.db.query(
                `INSERT INTO question_sets (
                    module_id, name, description,
                    shuffle_questions, shuffle_answers, shuffle_strategy,
                    preserve_groups, preserve_difficulty_order, section_based_shuffle,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    module_id, name, description,
                    shuffle_questions, shuffle_answers, shuffle_strategy,
                    preserve_groups, preserve_difficulty_order, section_based_shuffle,
                    teacherId
                ]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating question set:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * 문제 추가
     * POST /api/question-sets/:id/questions
     */
    async addQuestion(req, res) {
        try {
            const { id: questionSetId } = req.params;
            const {
                question_text,
                question_type = 'mcq',
                original_order,
                difficulty_level = 3,
                section,
                group_id,
                points = 1.0,
                time_limit_seconds,
                explanation,
                choices = []
            } = req.body;

            // 입력 검증
            if (!question_text) {
                return res.status(400).json({
                    error: 'Question text is required'
                });
            }

            // 트랜잭션 시작
            const client = await this.db.connect();

            try {
                await client.query('BEGIN');

                // 문제 삽입
                const questionResult = await client.query(
                    `INSERT INTO questions (
                        question_set_id, question_text, question_type,
                        original_order, difficulty_level, section, group_id,
                        points, time_limit_seconds, explanation
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *`,
                    [
                        questionSetId, question_text, question_type,
                        original_order, difficulty_level, section, group_id,
                        points, time_limit_seconds, explanation
                    ]
                );

                const question = questionResult.rows[0];

                // 선택지 삽입
                const insertedChoices = [];
                for (const choice of choices) {
                    const choiceResult = await client.query(
                        `INSERT INTO answer_choices (
                            question_id, choice_text, is_correct,
                            original_order, is_fixed, explanation
                        )
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *`,
                        [
                            question.id,
                            choice.text,
                            choice.is_correct || false,
                            choice.original_order,
                            choice.is_fixed || false,
                            choice.explanation
                        ]
                    );
                    insertedChoices.push(choiceResult.rows[0]);
                }

                await client.query('COMMIT');

                res.status(201).json({
                    success: true,
                    data: {
                        ...question,
                        choices: insertedChoices
                    }
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error adding question:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * 학생용 셔플된 문제 세트 조회
     * GET /api/question-sets/:id/student-view
     */
    async getStudentView(req, res) {
        try {
            const { id: questionSetId } = req.params;
            const studentId = req.user.id; // 학생 인증

            // 문제 세트 설정 조회
            const setResult = await this.db.query(
                'SELECT * FROM question_sets WHERE id = $1',
                [questionSetId]
            );

            if (setResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Question set not found'
                });
            }

            const questionSet = setResult.rows[0];

            // 기존 셔플 맵 확인
            let shuffleMap = await this._getOrCreateShuffleMap(
                studentId,
                questionSetId,
                questionSet
            );

            // 문제 및 선택지 조회
            const questions = await this._getQuestionsWithChoices(questionSetId);

            // 셔플 맵 적용
            const shuffledQuestions = this._applyShuffleMap(
                questions,
                shuffleMap
            );

            res.json({
                success: true,
                data: {
                    question_set_id: questionSetId,
                    name: questionSet.name,
                    description: questionSet.description,
                    shuffle_map_id: shuffleMap.id,
                    shuffle_seed: shuffleMap.shuffle_seed,
                    total_questions: shuffledQuestions.length,
                    questions: shuffledQuestions.map((q, index) => ({
                        id: q.id,
                        displayed_position: index + 1,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        points: q.points,
                        time_limit_seconds: q.time_limit_seconds,
                        choices: q.choices ? q.choices.map((c, cIndex) => ({
                            id: c.id,
                            displayed_position: String.fromCharCode(65 + cIndex), // A, B, C, D
                            choice_text: c.choice_text
                            // is_correct는 전송하지 않음 (보안)
                        })) : null
                    }))
                }
            });
        } catch (error) {
            console.error('Error getting student view:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * 답안 제출
     * POST /api/question-sets/:id/submit
     */
    async submitAnswers(req, res) {
        try {
            const { id: questionSetId } = req.params;
            const studentId = req.user.id;
            const { shuffle_map_id, answers } = req.body;

            // 셔플 맵 검증
            const mapResult = await this.db.query(
                `SELECT * FROM student_shuffle_maps
                 WHERE id = $1 AND student_id = $2 AND question_set_id = $3`,
                [shuffle_map_id, studentId, questionSetId]
            );

            if (mapResult.rows.length === 0) {
                return res.status(403).json({
                    error: 'Invalid shuffle map'
                });
            }

            const client = await this.db.connect();

            try {
                await client.query('BEGIN');

                const submittedAnswers = [];

                for (const answer of answers) {
                    // 정답 확인
                    const choiceResult = await client.query(
                        'SELECT is_correct FROM answer_choices WHERE id = $1',
                        [answer.selected_choice_id]
                    );

                    const isCorrect = choiceResult.rows[0]?.is_correct || false;

                    // 답안 저장
                    const answerResult = await client.query(
                        `INSERT INTO student_answers (
                            student_id, question_id, shuffle_map_id,
                            selected_choice_id, displayed_position,
                            answer_text, is_correct, auto_graded
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *`,
                        [
                            studentId,
                            answer.question_id,
                            shuffle_map_id,
                            answer.selected_choice_id,
                            answer.displayed_position,
                            answer.answer_text,
                            isCorrect,
                            true
                        ]
                    );

                    submittedAnswers.push(answerResult.rows[0]);
                }

                await client.query('COMMIT');

                // 결과 계산
                const totalQuestions = answers.length;
                const correctAnswers = submittedAnswers.filter(a => a.is_correct).length;
                const score = (correctAnswers / totalQuestions) * 100;

                res.json({
                    success: true,
                    data: {
                        total_questions: totalQuestions,
                        correct_answers: correctAnswers,
                        score: score.toFixed(2),
                        submitted_at: new Date().toISOString()
                    }
                });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error submitting answers:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * 결과 조회
     * GET /api/question-sets/:id/results/:student_id
     */
    async getResults(req, res) {
        try {
            const { id: questionSetId, student_id: studentId } = req.params;

            // 권한 확인 (교사 또는 본인만)
            if (req.user.role !== 'teacher' && req.user.id !== studentId) {
                return res.status(403).json({
                    error: 'Forbidden'
                });
            }

            const result = await this.db.query(
                `SELECT
                    sa.*,
                    q.question_text,
                    q.original_order,
                    q.points,
                    ac.choice_text,
                    ac.original_order as choice_original_order
                FROM student_answers sa
                JOIN questions q ON sa.question_id = q.id
                LEFT JOIN answer_choices ac ON sa.selected_choice_id = ac.id
                WHERE sa.student_id = $1
                  AND q.question_set_id = $2
                ORDER BY sa.submitted_at`,
                [studentId, questionSetId]
            );

            const totalQuestions = result.rows.length;
            const correctAnswers = result.rows.filter(r => r.is_correct).length;
            const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

            res.json({
                success: true,
                data: {
                    total_questions: totalQuestions,
                    correct_answers: correctAnswers,
                    score: score.toFixed(2),
                    details: result.rows.map(r => ({
                        question_id: r.question_id,
                        question_text: r.question_text,
                        original_position: r.original_order,
                        displayed_position: r.displayed_position,
                        selected_choice: r.choice_text,
                        is_correct: r.is_correct,
                        points: r.is_correct ? r.points : 0,
                        submitted_at: r.submitted_at
                    }))
                }
            });
        } catch (error) {
            console.error('Error getting results:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * 셔플 맵 가져오기 또는 생성
     * @private
     */
    async _getOrCreateShuffleMap(studentId, questionSetId, questionSet) {
        // 기존 맵 확인
        const existingMap = await this.db.query(
            'SELECT * FROM student_shuffle_maps WHERE student_id = $1 AND question_set_id = $2',
            [studentId, questionSetId]
        );

        if (existingMap.rows.length > 0) {
            return existingMap.rows[0];
        }

        // 새로운 맵 생성
        const questions = await this._getQuestionsWithChoices(questionSetId);

        const shuffleResult = ShuffleService.performShuffle({
            studentId,
            questionSetId,
            questions,
            shuffleQuestions: questionSet.shuffle_questions,
            shuffleAnswers: questionSet.shuffle_answers,
            options: {
                preserveGroups: questionSet.preserve_groups,
                preserveDifficultyOrder: questionSet.preserve_difficulty_order,
                sectionBased: questionSet.section_based_shuffle
            }
        });

        const result = await this.db.query(
            `INSERT INTO student_shuffle_maps (
                student_id, question_set_id, shuffle_seed,
                question_order, answer_order_map
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                studentId,
                questionSetId,
                shuffleResult.seed,
                JSON.stringify(shuffleResult.questionOrder),
                JSON.stringify(shuffleResult.answerOrderMap)
            ]
        );

        return result.rows[0];
    }

    /**
     * 문제 및 선택지 조회
     * @private
     */
    async _getQuestionsWithChoices(questionSetId) {
        const questionsResult = await this.db.query(
            `SELECT * FROM questions
             WHERE question_set_id = $1
             ORDER BY original_order`,
            [questionSetId]
        );

        const questions = questionsResult.rows;

        // 각 문제의 선택지 조회
        for (const question of questions) {
            const choicesResult = await this.db.query(
                `SELECT * FROM answer_choices
                 WHERE question_id = $1
                 ORDER BY original_order`,
                [question.id]
            );
            question.choices = choicesResult.rows;
        }

        return questions;
    }

    /**
     * 셔플 맵 적용
     * @private
     */
    _applyShuffleMap(questions, shuffleMap) {
        const questionOrder = JSON.parse(shuffleMap.question_order);
        const answerOrderMap = JSON.parse(shuffleMap.answer_order_map);

        // 문제 순서 적용
        const shuffledQuestions = questionOrder.map(questionId => {
            return questions.find(q => q.id === questionId);
        }).filter(q => q !== undefined);

        // 답안 순서 적용
        shuffledQuestions.forEach(question => {
            if (question.choices && answerOrderMap[question.id]) {
                const orderMap = answerOrderMap[question.id];
                const shuffledChoices = orderMap.map(index => question.choices[index])
                    .filter(c => c !== undefined);
                question.choices = shuffledChoices;
            }
        });

        return shuffledQuestions;
    }
}

module.exports = QuestionSetController;
