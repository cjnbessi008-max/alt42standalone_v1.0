<?php
/**
 * Main Index Page
 * Redirects to appropriate dashboard based on user role
 */

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

ensureSession();

// Redirect based on login status and role
if (isLoggedIn()) {
    $user = getCurrentUser();

    if ($user['role'] === 'teacher') {
        header('Location: /teacher/index.php');
    } elseif ($user['role'] === 'student') {
        header('Location: /student/index.php');
    } else {
        header('Location: /login.php');
    }
    exit;
}

// Not logged in - show landing page
$title = 'Welcome';
require_once __DIR__ . '/templates/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-8">
        <div class="text-center mb-5">
            <h1 class="display-4 mb-4">
                <i class="fas fa-graduation-cap text-primary"></i><br>
                Quiz Explanation App
            </h1>
            <p class="lead">
                A modern quiz platform that emphasizes understanding.<br>
                Not just <em>what</em> you know, but <em>why</em> you know it.
            </p>
        </div>

        <div class="row mb-5">
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-user-graduate fa-3x text-primary mb-3"></i>
                        <h4>For Students</h4>
                        <p class="text-muted">
                            Take quizzes and demonstrate your understanding by explaining your answers.
                        </p>
                        <ul class="list-unstyled text-left">
                            <li><i class="fas fa-check text-success"></i> Answer questions</li>
                            <li><i class="fas fa-check text-success"></i> Explain your reasoning</li>
                            <li><i class="fas fa-check text-success"></i> Get detailed feedback</li>
                            <li><i class="fas fa-check text-success"></i> Track your progress</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-chalkboard-teacher fa-3x text-success mb-3"></i>
                        <h4>For Teachers</h4>
                        <p class="text-muted">
                            Create quizzes that assess both knowledge and understanding.
                        </p>
                        <ul class="list-unstyled text-left">
                            <li><i class="fas fa-check text-success"></i> Create custom quizzes</li>
                            <li><i class="fas fa-check text-success"></i> Auto-evaluate explanations</li>
                            <li><i class="fas fa-check text-success"></i> Review student answers</li>
                            <li><i class="fas fa-check text-success"></i> Sync with Moodle</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-light">
            <div class="card-body">
                <h4 class="text-center mb-4">
                    <i class="fas fa-star text-warning"></i> Key Features
                </h4>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <h6><i class="fas fa-brain text-info"></i> Explanation-Based Learning</h6>
                        <p class="small text-muted">Students explain their answers, promoting deeper understanding.</p>
                    </div>

                    <div class="col-md-6 mb-3">
                        <h6><i class="fas fa-robot text-primary"></i> Auto-Evaluation</h6>
                        <p class="small text-muted">Keyword-based automatic evaluation of student explanations.</p>
                    </div>

                    <div class="col-md-6 mb-3">
                        <h6><i class="fas fa-comments text-success"></i> Teacher Feedback</h6>
                        <p class="small text-muted">Teachers can review and provide personalized feedback.</p>
                    </div>

                    <div class="col-md-6 mb-3">
                        <h6><i class="fas fa-sync text-warning"></i> Moodle Integration</h6>
                        <p class="small text-muted">Seamless integration with Moodle 3.7 LMS.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center mt-5">
            <a href="/login.php" class="btn btn-primary btn-lg">
                <i class="fas fa-sign-in-alt"></i> Login to Get Started
            </a>
        </div>

        <div class="alert alert-info mt-4">
            <h6><i class="fas fa-info-circle"></i> About This System</h6>
            <p class="small mb-0">
                This quiz platform is designed to integrate with Moodle 3.7. It uses MySQL 5.7 and PHP 7.1.9,
                and focuses on explanation-based assessment to promote deeper learning and understanding.
            </p>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/templates/footer.php'; ?>
