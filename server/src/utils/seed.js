/**
 * Database Seeding Script
 * Creates sample data for testing and demonstration
 */

import bcrypt from 'bcryptjs';
import { run, all, transaction } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🌱 Seeding database with sample data...\n');

const seedDatabase = transaction(() => {
    // ========================================================================
    // 1. Create Users
    // ========================================================================
    console.log('Creating users...');

    const password_hash = bcrypt.hashSync('password123', 10);

    // Teacher accounts
    const teacher1 = run(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?, ?)`,
        ['teacher1', 'teacher1@chaosharmony.edu', password_hash, '김지혜 교수', 'teacher']
    ).lastInsertRowid;

    const teacher2 = run(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?, ?)`,
        ['teacher2', 'teacher2@chaosharmony.edu', password_hash, '이민준 교수', 'teacher']
    ).lastInsertRowid;

    // Student accounts
    const students = [];
    const studentNames = [
        '박서준', '최유진', '정다은', '강민호', '송하늘',
        '윤지우', '임수빈', '한도윤', '오서연', '장예준'
    ];

    for (let i = 0; i < studentNames.length; i++) {
        const studentId = run(
            `INSERT INTO users (username, email, password_hash, full_name, role)
             VALUES (?, ?, ?, ?, ?)`,
            [
                `student${i + 1}`,
                `student${i + 1}@chaosharmony.edu`,
                password_hash,
                studentNames[i],
                'student'
            ]
        ).lastInsertRowid;

        students.push(studentId);

        // Initialize visualization state
        run(
            `INSERT INTO visualization_state (student_id, current_emotion, color_palette)
             VALUES (?, 'neutral', '{"primary":"#667eea","secondary":"#764ba2","accent":"#f093fb"}')`,
            [studentId]
        );
    }

    console.log(`  ✓ Created ${studentNames.length} students and 2 teachers`);

    // ========================================================================
    // 2. Create Quizzes
    // ========================================================================
    console.log('Creating quizzes...');

    const quiz1 = run(
        `INSERT INTO quizzes (title, description, teacher_id, time_limit, passing_score, max_attempts, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            '수학 기초 퀴즈',
            '기본적인 산술 연산과 대수 문제를 다룹니다.',
            teacher1,
            1800, // 30 minutes
            70.0,
            3,
            1
        ]
    ).lastInsertRowid;

    const quiz2 = run(
        `INSERT INTO quizzes (title, description, teacher_id, time_limit, passing_score, max_attempts, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            'JavaScript 프로그래밍 기초',
            'JavaScript의 기본 문법과 개념을 테스트합니다.',
            teacher2,
            2400, // 40 minutes
            75.0,
            2,
            1
        ]
    ).lastInsertRowid;

    const quiz3 = run(
        `INSERT INTO quizzes (title, description, teacher_id, time_limit, passing_score, max_attempts, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            '한국사 퀴즈',
            '조선시대 역사에 대한 이해도를 평가합니다.',
            teacher1,
            null, // No time limit
            60.0,
            5,
            1
        ]
    ).lastInsertRowid;

    console.log('  ✓ Created 3 quizzes');

    // ========================================================================
    // 3. Create Questions and Options
    // ========================================================================
    console.log('Creating questions...');

    // Quiz 1 Questions (Math)
    const mathQuestions = [
        {
            text: '12 + 15 = ?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: '25', correct: false },
                { text: '27', correct: true },
                { text: '30', correct: false },
                { text: '32', correct: false }
            ]
        },
        {
            text: '8 × 7 = ?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: '54', correct: false },
                { text: '56', correct: true },
                { text: '58', correct: false },
                { text: '60', correct: false }
            ]
        },
        {
            text: '방정식 2x + 5 = 13의 해는?',
            type: 'multiple_choice',
            difficulty: 'medium',
            options: [
                { text: 'x = 3', correct: false },
                { text: 'x = 4', correct: true },
                { text: 'x = 5', correct: false },
                { text: 'x = 6', correct: false }
            ]
        },
        {
            text: '원주율 π는 약 얼마인가?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: '2.14', correct: false },
                { text: '3.14', correct: true },
                { text: '4.14', correct: false },
                { text: '5.14', correct: false }
            ]
        },
        {
            text: '정삼각형의 내각의 합은?',
            type: 'multiple_choice',
            difficulty: 'medium',
            options: [
                { text: '90도', correct: false },
                { text: '120도', correct: false },
                { text: '180도', correct: true },
                { text: '360도', correct: false }
            ]
        }
    ];

    addQuestionsToQuiz(quiz1, mathQuestions);

    // Quiz 2 Questions (JavaScript)
    const jsQuestions = [
        {
            text: 'JavaScript에서 변수를 선언하는 키워드는?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: 'var, let, const', correct: true },
                { text: 'int, float, string', correct: false },
                { text: 'define, declare', correct: false },
                { text: 'variable, constant', correct: false }
            ]
        },
        {
            text: '배열의 마지막 요소를 제거하는 메서드는?',
            type: 'multiple_choice',
            difficulty: 'medium',
            options: [
                { text: 'shift()', correct: false },
                { text: 'pop()', correct: true },
                { text: 'remove()', correct: false },
                { text: 'delete()', correct: false }
            ]
        },
        {
            text: 'typeof null의 결과는?',
            type: 'multiple_choice',
            difficulty: 'hard',
            options: [
                { text: '"null"', correct: false },
                { text: '"undefined"', correct: false },
                { text: '"object"', correct: true },
                { text: '"number"', correct: false }
            ]
        },
        {
            text: 'Arrow function의 문법은?',
            type: 'multiple_choice',
            difficulty: 'medium',
            options: [
                { text: '() => {}', correct: true },
                { text: '() -> {}', correct: false },
                { text: 'function() {}', correct: false },
                { text: '() : {}', correct: false }
            ]
        }
    ];

    addQuestionsToQuiz(quiz2, jsQuestions);

    // Quiz 3 Questions (Korean History)
    const historyQuestions = [
        {
            text: '조선을 건국한 인물은?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: '이성계', correct: true },
                { text: '정도전', correct: false },
                { text: '이방원', correct: false },
                { text: '세종대왕', correct: false }
            ]
        },
        {
            text: '한글을 창제한 왕은?',
            type: 'multiple_choice',
            difficulty: 'easy',
            options: [
                { text: '태종', correct: false },
                { text: '세종', correct: true },
                { text: '성종', correct: false },
                { text: '정조', correct: false }
            ]
        },
        {
            text: '임진왜란이 발생한 연도는?',
            type: 'multiple_choice',
            difficulty: 'medium',
            options: [
                { text: '1492년', correct: false },
                { text: '1592년', correct: true },
                { text: '1692년', correct: false },
                { text: '1792년', correct: false }
            ]
        }
    ];

    addQuestionsToQuiz(quiz3, historyQuestions);

    console.log('  ✓ Created questions for all quizzes');

    // ========================================================================
    // 4. Create Sample Quiz Attempts and Answers
    // ========================================================================
    console.log('Creating sample quiz attempts...');

    // Have some students take quiz 1
    for (let i = 0; i < 5; i++) {
        const studentId = students[i];
        createSampleAttempt(studentId, quiz1);
    }

    // Have some students take quiz 2
    for (let i = 2; i < 7; i++) {
        const studentId = students[i];
        createSampleAttempt(studentId, quiz2);
    }

    console.log('  ✓ Created sample quiz attempts');

    // ========================================================================
    // 5. Generate Patterns
    // ========================================================================
    console.log('Generating patterns...');

    // Patterns will be generated when students access the visualization
    // through the /api/patterns/analyze endpoint

    console.log('  ✓ Pattern generation ready');
});

/**
 * Helper function to add questions to a quiz
 */
function addQuestionsToQuiz(quizId, questions) {
    questions.forEach((q, index) => {
        const questionId = run(
            `INSERT INTO questions (quiz_id, question_text, question_type, points, difficulty_level, order_num)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [quizId, q.text, q.type, 1.0, q.difficulty, index]
        ).lastInsertRowid;

        q.options.forEach((opt, optIndex) => {
            run(
                `INSERT INTO answer_options (question_id, option_text, is_correct, order_num)
                 VALUES (?, ?, ?, ?)`,
                [questionId, opt.text, opt.correct ? 1 : 0, optIndex]
            );
        });
    });
}

/**
 * Helper function to create a sample quiz attempt
 */
function createSampleAttempt(studentId, quizId) {
    // Get questions for this quiz
    const questions = all('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_num', [quizId]);

    if (questions.length === 0) return;

    // Create attempt
    const attemptId = run(
        'INSERT INTO quiz_attempts (quiz_id, student_id) VALUES (?, ?)',
        [quizId, studentId]
    ).lastInsertRowid;

    let totalPoints = 0;
    let earnedPoints = 0;

    // Answer each question with varying accuracy (simulate realistic performance)
    questions.forEach((question, index) => {
        const options = all('SELECT * FROM answer_options WHERE question_id = ?', [question.id]);
        const correctOption = options.find(opt => opt.is_correct);

        // Simulate answer with 70% accuracy overall
        const isCorrect = Math.random() < 0.7;
        const selectedOption = isCorrect && correctOption ? correctOption : options[Math.floor(Math.random() * options.length)];

        const pointsEarned = selectedOption.is_correct ? question.points : 0;
        const responseTime = Math.floor(Math.random() * 60) + 10; // 10-70 seconds

        run(
            `INSERT INTO student_answers
             (attempt_id, question_id, selected_option_id, is_correct, points_earned, response_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [attemptId, question.id, selectedOption.id, selectedOption.is_correct, pointsEarned, responseTime]
        );

        totalPoints += question.points;
        earnedPoints += pointsEarned;
    });

    // Complete the attempt
    const score = (earnedPoints / totalPoints) * 100;
    const timeSpent = questions.length * 45; // Approx 45 seconds per question

    run(
        `UPDATE quiz_attempts
         SET is_completed = 1, completed_at = CURRENT_TIMESTAMP,
             score = ?, total_points = ?, time_spent = ?
         WHERE id = ?`,
        [score, totalPoints, timeSpent, attemptId]
    );
}

// Run the seeding
try {
    seedDatabase();
    console.log('\n✓ Database seeded successfully!');
    console.log('\n📝 Sample credentials:');
    console.log('   Teacher: teacher1 / password123');
    console.log('   Student: student1 / password123');
    console.log('');
    process.exit(0);
} catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
}
