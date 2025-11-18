<?php
/**
 * Login Page
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once 'config.php';

// Redirect if already logged in
if (isLoggedIn()) {
    redirect('dashboard.php');
}

$error = '';
$success = getFlash('success');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = clean($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']);

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        $result = loginUser($username, $password, $remember);

        if ($result['success']) {
            $redirectUrl = $_SESSION['redirect_after_login'] ?? 'dashboard.php';
            unset($_SESSION['redirect_after_login']);
            redirect($redirectUrl);
        } else {
            $error = $result['error'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <h1><?php echo APP_NAME; ?></h1>
                <p>Discover Geometric Invariants</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success">
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="auth-form">
                <div class="form-group">
                    <label for="username">Username or Email</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value="<?php echo htmlspecialchars($username ?? ''); ?>"
                        required
                        autofocus
                        placeholder="Enter your username or email"
                    >
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        placeholder="Enter your password"
                    >
                </div>

                <div class="form-group form-check">
                    <input type="checkbox" id="remember" name="remember">
                    <label for="remember">Remember me</label>
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                    Login
                </button>
            </form>

            <div class="auth-footer">
                <p>Don't have an account? <a href="register.php">Register here</a></p>
                <p class="text-muted">Demo: username: <strong>admin</strong>, password: <strong>admin123</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
