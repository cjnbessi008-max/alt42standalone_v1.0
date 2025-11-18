<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($title ?? 'Quiz Explanation App'); ?></title>

    <!-- Bootstrap 4 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-graduation-cap"></i> Quiz Explanation App
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
                    <?php if (isLoggedIn()): ?>
                        <?php $user = getCurrentUser(); ?>

                        <?php if (hasRole('teacher')): ?>
                            <li class="nav-item">
                                <a class="nav-link" href="/teacher/index.php">
                                    <i class="fas fa-chalkboard-teacher"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/teacher/create_question.php">
                                    <i class="fas fa-plus-circle"></i> Create Question
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/teacher/review_answers.php">
                                    <i class="fas fa-clipboard-check"></i> Review Answers
                                </a>
                            </li>
                        <?php elseif (hasRole('student')): ?>
                            <li class="nav-item">
                                <a class="nav-link" href="/student/index.php">
                                    <i class="fas fa-book-reader"></i> My Quizzes
                                </a>
                            </li>
                        <?php endif; ?>

                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown">
                                <i class="fas fa-user"></i> <?php echo htmlspecialchars($user['full_name']); ?>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item" href="/profile.php">
                                    <i class="fas fa-user-circle"></i> Profile
                                </a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="/logout.php">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </a>
                            </div>
                        </li>
                    <?php else: ?>
                        <li class="nav-item">
                            <a class="nav-link" href="/login.php">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </a>
                        </li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </nav>

    <main class="container mt-4">
