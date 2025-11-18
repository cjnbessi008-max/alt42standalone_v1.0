<?php
/**
 * Focus Highlights - Home Page
 */
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Highlights - LMS Focus Tracking System</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Focus Highlights</h1>
            <p>AI-Powered Learning Focus Tracking System</p>
        </div>
    </header>

    <nav>
        <ul>
            <li><a href="index.php" class="active">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
        </ul>
    </nav>

    <div class="container">
        <!-- Welcome Section -->
        <div class="dashboard-section">
            <h2>Welcome to Focus Highlights</h2>
            <p style="font-size: 1.1em; line-height: 1.8;">
                Focus Highlights is an intelligent learning analytics system that automatically detects and highlights
                moments of deep concentration during online learning. Integrated with Moodle LMS, it provides valuable
                insights for both students and teachers.
            </p>
        </div>

        <!-- Features -->
        <div class="dashboard-section" id="features">
            <h2>✨ Key Features</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <h3 style="color: #667eea; margin-bottom: 10px;">🎯 Smart Focus Detection</h3>
                    <p>Automatically identifies peak concentration moments based on:</p>
                    <ul style="margin-top: 10px;">
                        <li>Continuous learning time (5+ minutes)</li>
                        <li>High accuracy rate (80%+)</li>
                        <li>Fast response times</li>
                        <li>Active interaction patterns</li>
                    </ul>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <h3 style="color: #4CAF50; margin-bottom: 10px;">📊 Comprehensive Analytics</h3>
                    <p>Detailed insights including:</p>
                    <ul style="margin-top: 10px;">
                        <li>Focus scores (0-100)</li>
                        <li>Session duration tracking</li>
                        <li>Accuracy metrics</li>
                        <li>Course-wise breakdown</li>
                    </ul>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
                    <h3 style="color: #FF9800; margin-bottom: 10px;">👥 Multi-User Dashboards</h3>
                    <p>Tailored views for different roles:</p>
                    <ul style="margin-top: 10px;">
                        <li>Student dashboard for self-monitoring</li>
                        <li>Teacher dashboard for class insights</li>
                        <li>Real-time data visualization</li>
                        <li>Historical trend analysis</li>
                    </ul>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #E91E63;">
                    <h3 style="color: #E91E63; margin-bottom: 10px;">🔗 Moodle Integration</h3>
                    <p>Seamless LMS connectivity:</p>
                    <ul style="margin-top: 10px;">
                        <li>Moodle API integration</li>
                        <li>User synchronization</li>
                        <li>Course data import</li>
                        <li>Independent web application</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- How It Works -->
        <div class="dashboard-section" id="how-it-works">
            <h2>🔄 How It Works</h2>
            <div style="margin-top: 20px;">
                <div style="display: flex; align-items: start; margin-bottom: 30px;">
                    <div style="background: #667eea; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 20px;">1</div>
                    <div>
                        <h3 style="color: #667eea; margin-bottom: 10px;">Track Learning Activity</h3>
                        <p>Students study on Moodle while our JavaScript tracker silently monitors interactions, including clicks, keypresses, quiz submissions, and page navigation patterns.</p>
                    </div>
                </div>

                <div style="display: flex; align-items: start; margin-bottom: 30px;">
                    <div style="background: #4CAF50; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 20px;">2</div>
                    <div>
                        <h3 style="color: #4CAF50; margin-bottom: 10px;">Analyze Focus Patterns</h3>
                        <p>Our AI algorithm calculates a focus score based on multiple factors: session duration, interaction frequency, accuracy rate, and response timing.</p>
                    </div>
                </div>

                <div style="display: flex; align-items: start; margin-bottom: 30px;">
                    <div style="background: #FF9800; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 20px;">3</div>
                    <div>
                        <h3 style="color: #FF9800; margin-bottom: 10px;">Identify Highlights</h3>
                        <p>Sessions that meet quality thresholds (70+ focus score, 5+ minutes, 80%+ accuracy) are automatically marked as highlights with detailed reasons.</p>
                    </div>
                </div>

                <div style="display: flex; align-items: start;">
                    <div style="background: #E91E63; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 20px;">4</div>
                    <div>
                        <h3 style="color: #E91E63; margin-bottom: 10px;">Visualize & Improve</h3>
                        <p>Students and teachers access personalized dashboards to review highlights, track progress, identify patterns, and optimize learning strategies.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Access -->
        <div class="dashboard-section">
            <h2>🚀 Quick Access</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                <a href="student_dashboard.php?user_id=1" style="display: block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; text-decoration: none; border-radius: 10px; transition: transform 0.3s;">
                    <div style="font-size: 3em; margin-bottom: 10px;">👨‍🎓</div>
                    <h3>Student Dashboard</h3>
                    <p style="margin-top: 10px; opacity: 0.9;">View your focus highlights and learning statistics</p>
                </a>

                <a href="teacher_dashboard.php?teacher_id=2" style="display: block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; text-decoration: none; border-radius: 10px; transition: transform 0.3s;">
                    <div style="font-size: 3em; margin-bottom: 10px;">👨‍🏫</div>
                    <h3>Teacher Dashboard</h3>
                    <p style="margin-top: 10px; opacity: 0.9;">Monitor student engagement and class performance</p>
                </a>
            </div>
            <p style="text-align: center; margin-top: 20px; color: #999;">
                <small>Note: For demo purposes, use ?user_id=X or ?teacher_id=X in the URL</small>
            </p>
        </div>

        <!-- Technical Details -->
        <div class="dashboard-section">
            <h2>⚙️ Technical Specifications</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #667eea; margin-bottom: 15px;">System Requirements</h3>
                <ul style="line-height: 2;">
                    <li><strong>PHP:</strong> 7.1.9 or higher</li>
                    <li><strong>MySQL:</strong> 5.7 or higher</li>
                    <li><strong>Moodle:</strong> 3.7 or higher</li>
                    <li><strong>Web Server:</strong> Apache or Nginx</li>
                    <li><strong>Browser:</strong> Modern browsers with JavaScript enabled</li>
                </ul>

                <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px;">Key Technologies</h3>
                <ul style="line-height: 2;">
                    <li>Backend: PHP 7.1+ with PDO</li>
                    <li>Database: MySQL 5.7 with InnoDB</li>
                    <li>Frontend: Vanilla JavaScript (ES5/ES6)</li>
                    <li>Integration: Moodle Web Services API</li>
                    <li>Architecture: RESTful API design</li>
                </ul>
            </div>
        </div>

        <!-- Installation Note -->
        <div class="success-message" style="margin-top: 30px;">
            <strong>📝 First Time Setup?</strong><br>
            Run the installation script at <code>/focus-highlights/install.php</code> to set up the database and configure Moodle integration.
        </div>

    </div>

    <footer style="background: #333; color: white; text-align: center; padding: 30px 0; margin-top: 50px;">
        <div class="container">
            <p>&copy; 2024 Focus Highlights - LMS Focus Tracking System</p>
            <p style="margin-top: 10px; opacity: 0.8;">
                Integrated with Moodle 3.7 | PHP 7.1.9 | MySQL 5.7
            </p>
        </div>
    </footer>

    <style>
        a:hover {
            transform: translateY(-5px) !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }
    </style>

</body>
</html>
