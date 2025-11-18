<?php
/**
 * Home Page
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once 'config.php';

// Redirect to dashboard if logged in
if (isLoggedIn()) {
    redirect('dashboard.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - Discover Geometric Invariants</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="landing-page">
    <header class="landing-header">
        <nav class="navbar">
            <div class="container">
                <h1 class="logo"><?php echo APP_NAME; ?></h1>
                <div class="nav-links">
                    <a href="login.php" class="btn btn-outline">Login</a>
                    <a href="register.php" class="btn btn-primary">Get Started</a>
                </div>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <div class="hero-content">
                    <h2 class="hero-title">Discover the Magic of<br>Geometric Invariants</h2>
                    <p class="hero-subtitle">
                        An interactive learning app that helps students explore shapes
                        and discover properties that remain constant through transformations
                    </p>
                    <div class="hero-actions">
                        <a href="register.php" class="btn btn-primary btn-lg">Start Learning</a>
                        <a href="#features" class="btn btn-outline btn-lg">Learn More</a>
                    </div>
                </div>
                <div class="hero-image">
                    <div class="smartphone-preview">
                        <div class="smartphone-frame-preview">
                            <div class="screen-content">
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    <polygon points="100,40 60,140 140,140" fill="#3498db" opacity="0.7" stroke="#2980b9" stroke-width="3"/>
                                    <text x="100" y="160" text-anchor="middle" fill="#333" font-size="12">180°</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="features" class="features">
            <div class="container">
                <h2 class="section-title">Features</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>Smartphone Interface</h3>
                        <p>Beautiful smartphone viewport that makes learning engaging and modern</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🔍</div>
                        <h3>Interactive Shapes</h3>
                        <p>Scale, rotate, and manipulate geometric shapes in real-time</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">📐</div>
                        <h3>Auto-Detection</h3>
                        <p>Automatically detects and highlights invariant properties</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">💯</div>
                        <h3>Smart Grading</h3>
                        <p>Intelligent scoring based on discoveries and efficiency</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Progress Tracking</h3>
                        <p>Monitor your learning journey with detailed analytics</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🏆</div>
                        <h3>Leaderboard</h3>
                        <p>Compete with peers and see who masters invariants first</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="shapes-section">
            <div class="container">
                <h2 class="section-title">Explore Different Shapes</h2>
                <div class="shapes-grid">
                    <div class="shape-card">
                        <div class="shape-icon" style="background: #3498db;">△</div>
                        <h3>Triangle</h3>
                        <p>Discover angle sums and side ratios</p>
                    </div>

                    <div class="shape-card">
                        <div class="shape-icon" style="background: #e74c3c;">▢</div>
                        <h3>Rectangle</h3>
                        <p>Learn about right angles and aspect ratios</p>
                    </div>

                    <div class="shape-card">
                        <div class="shape-icon" style="background: #2ecc71;">●</div>
                        <h3>Circle</h3>
                        <p>Explore the magic of π (pi)</p>
                    </div>

                    <div class="shape-card">
                        <div class="shape-icon" style="background: #9b59b6;">▱</div>
                        <h3>Parallelogram</h3>
                        <p>Master parallel sides and angles</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="cta-section">
            <div class="container">
                <h2>Ready to Start Your Journey?</h2>
                <p>Join thousands of students discovering geometric invariants</p>
                <a href="register.php" class="btn btn-primary btn-lg">Create Free Account</a>
            </div>
        </section>
    </main>

    <footer class="landing-footer">
        <div class="container">
            <p>&copy; 2025 <?php echo APP_NAME; ?>. Created by KAIST Touch Math Academy.</p>
            <p>Version <?php echo APP_VERSION; ?></p>
        </div>
    </footer>
</body>
</html>
