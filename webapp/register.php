<?php
/**
 * Registration Page
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
$formData = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formData = [
        'username' => clean($_POST['username'] ?? ''),
        'email' => clean($_POST['email'] ?? ''),
        'full_name' => clean($_POST['full_name'] ?? ''),
    ];

    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    // Validation
    if (empty($formData['username']) || empty($formData['email']) || empty($password)) {
        $error = 'Please fill in all required fields';
    } elseif ($password !== $confirmPassword) {
        $error = 'Passwords do not match';
    } else {
        $result = registerUser(
            $formData['username'],
            $formData['email'],
            $password,
            $formData['full_name']
        );

        if ($result['success']) {
            setFlash('success', 'Registration successful! Please login.');
            redirect('login.php');
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
    <title>Register - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <h1><?php echo APP_NAME; ?></h1>
                <p>Create Your Account</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="auth-form">
                <div class="form-group">
                    <label for="username">Username <span class="required">*</span></label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value="<?php echo htmlspecialchars($formData['username'] ?? ''); ?>"
                        required
                        autofocus
                        placeholder="Choose a username"
                        minlength="3"
                    >
                    <small class="form-text">At least 3 characters</small>
                </div>

                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="<?php echo htmlspecialchars($formData['email'] ?? ''); ?>"
                        required
                        placeholder="your@email.com"
                    >
                </div>

                <div class="form-group">
                    <label for="full_name">Full Name</label>
                    <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value="<?php echo htmlspecialchars($formData['full_name'] ?? ''); ?>"
                        placeholder="Your full name"
                    >
                </div>

                <div class="form-group">
                    <label for="password">Password <span class="required">*</span></label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        placeholder="Create a password"
                        minlength="<?php echo PASSWORD_MIN_LENGTH; ?>"
                    >
                    <small class="form-text">At least <?php echo PASSWORD_MIN_LENGTH; ?> characters</small>
                </div>

                <div class="form-group">
                    <label for="confirm_password">Confirm Password <span class="required">*</span></label>
                    <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        required
                        placeholder="Confirm your password"
                    >
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                    Create Account
                </button>
            </form>

            <div class="auth-footer">
                <p>Already have an account? <a href="login.php">Login here</a></p>
            </div>
        </div>
    </div>

    <script>
        // Client-side password validation
        document.querySelector('.auth-form').addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match!');
                return false;
            }
        });
    </script>
</body>
</html>
