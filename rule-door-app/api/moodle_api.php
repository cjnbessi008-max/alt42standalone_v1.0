<?php
/**
 * Moodle Integration API Endpoints
 */

function handleMoodleAPI($method, $path_parts, $data) {
    $moodle = new MoodleConnector();

    // GET /moodle/quiz/{quiz_id} - Get quiz information
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'quiz') {
        $quiz_id = intval($path_parts[2]);
        $quiz_info = $moodle->getQuizInfo($quiz_id);

        if ($quiz_info) {
            ApiResponse::success($quiz_info, 'Quiz information retrieved successfully');
        } else {
            ApiResponse::error('Quiz not found', 404);
        }
    }

    // GET /moodle/quiz/{quiz_id}/questions - Get quiz questions
    if ($method === 'GET' && count($path_parts) === 4 &&
        $path_parts[1] === 'quiz' && $path_parts[3] === 'questions') {
        $quiz_id = intval($path_parts[2]);
        $questions = $moodle->getQuizQuestions($quiz_id);

        ApiResponse::success($questions, 'Quiz questions retrieved successfully');
    }

    // GET /moodle/quiz/{quiz_id}/student/{student_id}/attempts - Get student quiz attempts
    if ($method === 'GET' && count($path_parts) === 6 &&
        $path_parts[1] === 'quiz' && $path_parts[3] === 'student' && $path_parts[5] === 'attempts') {
        $quiz_id = intval($path_parts[2]);
        $student_id = intval($path_parts[4]);

        $attempts = $moodle->getStudentQuizAttempts($quiz_id, $student_id);
        ApiResponse::success($attempts, 'Student quiz attempts retrieved successfully');
    }

    // GET /moodle/student/{student_id} - Get student information
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'student') {
        $student_id = intval($path_parts[2]);
        $student_info = $moodle->getStudentInfo($student_id);

        if ($student_info) {
            ApiResponse::success($student_info, 'Student information retrieved successfully');
        } else {
            ApiResponse::error('Student not found', 404);
        }
    }

    // GET /moodle/course/{course_id} - Get course information
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'course') {
        $course_id = intval($path_parts[2]);
        $course_info = $moodle->getCourseInfo($course_id);

        if ($course_info) {
            ApiResponse::success($course_info, 'Course information retrieved successfully');
        } else {
            ApiResponse::error('Course not found', 404);
        }
    }

    // GET /moodle/course/{course_id}/students - Get enrolled students
    if ($method === 'GET' && count($path_parts) === 4 &&
        $path_parts[1] === 'course' && $path_parts[3] === 'students') {
        $course_id = intval($path_parts[2]);
        $students = $moodle->getCourseStudents($course_id);

        ApiResponse::success($students, 'Course students retrieved successfully');
    }

    // GET /moodle/quiz/{quiz_id}/settings - Get quiz settings
    if ($method === 'GET' && count($path_parts) === 4 &&
        $path_parts[1] === 'quiz' && $path_parts[3] === 'settings') {
        $quiz_id = intval($path_parts[2]);
        $settings = $moodle->getQuizSettings($quiz_id);

        if ($settings) {
            ApiResponse::success($settings, 'Quiz settings retrieved successfully');
        } else {
            ApiResponse::error('Quiz not found', 404);
        }
    }

    // POST /moodle/verify-session - Verify Moodle session
    if ($method === 'POST' && count($path_parts) === 2 && $path_parts[1] === 'verify-session') {
        if (!isset($data['session_key'])) {
            ApiResponse::error('Missing session_key', 400);
        }

        $session = $moodle->verifyMoodleSession($data['session_key']);

        if ($session) {
            ApiResponse::success($session, 'Session verified successfully');
        } else {
            ApiResponse::error('Invalid or expired session', 401);
        }
    }

    // GET /moodle/quiz/{quiz_id}/student/{student_id}/active-attempt
    if ($method === 'GET' && count($path_parts) === 6 &&
        $path_parts[1] === 'quiz' && $path_parts[3] === 'student' && $path_parts[5] === 'active-attempt') {
        $quiz_id = intval($path_parts[2]);
        $student_id = intval($path_parts[4]);

        $active_attempt = $moodle->hasActiveAttempt($quiz_id, $student_id);

        if ($active_attempt) {
            ApiResponse::success($active_attempt, 'Active attempt found');
        } else {
            ApiResponse::success(null, 'No active attempt');
        }
    }

    ApiResponse::error('Invalid endpoint or method', 400);
}
