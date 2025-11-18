<?php
/**
 * Common Header
 *
 * @package InvariantFinder
 */

$currentUser = getCurrentUser();
?>
<header class="main-header">
    <nav class="navbar">
        <div class="container">
            <a href="<?php echo isLoggedIn() ? 'dashboard.php' : 'index.php'; ?>" class="logo">
                <?php echo APP_NAME; ?>
            </a>

            <?php if (isLoggedIn()): ?>
                <div class="nav-menu">
                    <a href="dashboard.php" class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>">
                        Dashboard
                    </a>
                    <a href="progress.php" class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'progress.php' ? 'active' : ''; ?>">
                        Progress
                    </a>
                    <a href="leaderboard.php" class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'leaderboard.php' ? 'active' : ''; ?>">
                        Leaderboard
                    </a>

                    <div class="nav-dropdown">
                        <button class="nav-link dropdown-toggle">
                            <?php echo htmlspecialchars($currentUser['username']); ?> ▾
                        </button>
                        <div class="dropdown-menu">
                            <a href="profile.php" class="dropdown-item">Profile</a>
                            <a href="settings.php" class="dropdown-item">Settings</a>
                            <div class="dropdown-divider"></div>
                            <a href="logout.php" class="dropdown-item">Logout</a>
                        </div>
                    </div>
                </div>
            <?php else: ?>
                <div class="nav-menu">
                    <a href="login.php" class="nav-link">Login</a>
                    <a href="register.php" class="btn btn-primary">Register</a>
                </div>
            <?php endif; ?>
        </div>
    </nav>
</header>
