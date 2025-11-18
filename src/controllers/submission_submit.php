<?php
/**
 * Submission Submit Controller
 * Handles student submissions and triggers AI verification
 */

// Check authentication
if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    http_response_code(401);
    die(json_encode(['error' => 'Not authenticated']));
}

$user = $_SESSION['user'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method not allowed');
}

$problemId = intval($_POST['problem_id'] ?? 0);
$studentAnswer = trim($_POST['student_answer'] ?? '');
$workShown = trim($_POST['work_shown'] ?? '');
$selfVerification = trim($_POST['self_verification'] ?? '');
$timeSpent = intval($_POST['time_spent_seconds'] ?? 0);
$saveDraft = isset($_POST['save_draft']);
$submissionId = isset($_POST['submission_id']) ? intval($_POST['submission_id']) : null;

// Validate input
if ($problemId === 0) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid problem ID']));
}

if (empty($studentAnswer)) {
    http_response_code(400);
    die(json_encode(['error' => 'Answer is required']));
}

// Load problem
$problemModel = new Problem();
$problem = $problemModel->getById($problemId);

if (!$problem) {
    http_response_code(404);
    die(json_encode(['error' => 'Problem not found']));
}

// Validate required fields
if ($problem['requires_work_shown'] && empty($workShown) && !$saveDraft) {
    http_response_code(400);
    die(json_encode(['error' => 'Work shown is required']));
}

if ($problem['requires_verification'] && empty($selfVerification) && !$saveDraft) {
    http_response_code(400);
    die(json_encode(['error' => 'Self-verification is required']));
}

$submissionModel = new Submission();

try {
    // Check if answer is correct
    $isCorrect = $problemModel->checkAnswer($problemId, $studentAnswer);

    // If this is an update to existing submission
    if ($submissionId) {
        $submissionModel->update($submissionId, [
            'student_answer' => $studentAnswer,
            'work_shown' => $workShown,
            'self_verification' => $selfVerification,
            'time_spent_seconds' => $timeSpent,
            'is_correct' => $isCorrect,
            'status' => $saveDraft ? 'draft' : 'submitted',
            'submitted_at' => $saveDraft ? null : date('Y-m-d H:i:s')
        ]);
    } else {
        // Create new submission
        $attemptNumber = $submissionModel->getNextAttemptNumber($user['id'], $problemId);

        $submissionId = $submissionModel->create([
            'problem_id' => $problemId,
            'student_id' => $user['id'],
            'lti_resource_link_id' => $_SESSION['lti_session_id'] ?? null,
            'student_answer' => $studentAnswer,
            'work_shown' => $workShown,
            'self_verification' => $selfVerification,
            'is_correct' => $isCorrect,
            'time_spent_seconds' => $timeSpent,
            'attempt_number' => $attemptNumber,
            'status' => $saveDraft ? 'draft' : 'submitted',
            'max_score' => $problem['points']
        ]);

        if (!$saveDraft) {
            $submissionModel->submit($submissionId);
        }
    }

    // If not a draft and verification is required, run AI analysis
    if (!$saveDraft && $problem['requires_verification'] && !empty($selfVerification)) {
        $aiVerifier = new AIVerifier();

        // Run AI verification
        $verificationResult = $aiVerifier->verifyStudentWork(
            $problem,
            $studentAnswer,
            $selfVerification
        );

        // Store AI verification
        $submissionModel->addAIVerification($submissionId, array_merge(
            $verificationResult,
            ['verification_text' => $selfVerification]
        ));

        // Calculate final score
        $finalScore = $aiVerifier->calculateFinalScore(
            $isCorrect,
            $verificationResult['ai_score'],
            $problem['points']
        );

        // Update submission with score
        $submissionModel->grade(
            $submissionId,
            $finalScore,
            $problem['points'],
            $isCorrect,
            null // Teacher can add feedback later
        );

        // Send grade back to Moodle if LTI session exists
        if (isset($_SESSION['lti_session_id'])) {
            $ltiHandler = new LTIHandler();
            $ltiHandler->sendGrade(
                $_SESSION['lti_session_id'],
                $finalScore,
                $problem['points']
            );
        }

        Logger::info('Submission graded with AI', [
            'submission_id' => $submissionId,
            'is_correct' => $isCorrect,
            'ai_score' => $verificationResult['ai_score'],
            'final_score' => $finalScore
        ]);
    }

    // Return response
    if ($saveDraft) {
        if (isset($_POST['auto_save'])) {
            die(json_encode(['success' => true, 'message' => 'Auto-saved']));
        }
        die(json_encode([
            'success' => true,
            'message' => 'Draft saved successfully',
            'submission_id' => $submissionId
        ]));
    } else {
        $_SESSION['flash_message'] = 'Submission completed! Your work has been graded.';
        header('Location: /submission/view?id=' . $submissionId);
        exit;
    }

} catch (Exception $e) {
    Logger::error('Submission failed: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode(['error' => 'Submission failed: ' . $e->getMessage()]));
}
