<?php
/**
 * Jump Thinking Detection System
 * Main Entry Point
 */

require_once __DIR__ . '/../src/autoload.php';

session_start();

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jump Thinking Detection System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            text-align: center;
        }
        h1 {
            color: #2c3e50;
            font-size: 32px;
            margin-bottom: 15px;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 18px;
            margin-bottom: 40px;
        }
        .features {
            text-align: left;
            margin: 30px 0;
        }
        .feature {
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .feature h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 5px;
        }
        .feature p {
            color: #7f8c8d;
            font-size: 14px;
        }
        .info-box {
            background: #e8f4f8;
            border: 1px solid #bee5eb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .info-box h3 {
            color: #0c5460;
            margin-bottom: 10px;
        }
        .info-box p {
            color: #0c5460;
            line-height: 1.6;
        }
        .version {
            margin-top: 30px;
            color: #95a5a6;
            font-size: 14px;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Jump Thinking Detection System</h1>
        <p class="subtitle">비약 사고 감지 및 분석 시스템</p>

        <div class="features">
            <div class="feature">
                <h3>📊 실시간 패턴 감지</h3>
                <p>학생의 문제 풀이 과정에서 단계 건너뛰기, 빠른 풀이 등을 실시간 감지</p>
            </div>

            <div class="feature">
                <h3>🔗 Moodle LTI 연동</h3>
                <p>Moodle 3.7과 LTI 1.1 표준 프로토콜로 원활한 연동</p>
            </div>

            <div class="feature">
                <h3>📈 교사 분석 대시보드</h3>
                <p>학생별 학습 패턴과 비약 사고 경향성을 시각화하여 제공</p>
            </div>

            <div class="feature">
                <h3>🎓 개인화된 피드백</h3>
                <p>각 학생의 사고 유형(순차형/비약형/혼합형)에 따른 맞춤 조언</p>
            </div>
        </div>

        <div class="info-box">
            <h3>🚀 시작하기</h3>
            <p>
                이 시스템은 <strong>Moodle LMS</strong>를 통해 접근합니다.<br>
                Moodle에서 외부 도구로 이 애플리케이션을 추가한 후 사용할 수 있습니다.
            </p>
            <p style="margin-top: 15px;">
                <strong>LTI Launch URL:</strong><br>
                <code style="background: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                    <?php echo htmlspecialchars($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST']); ?>/lti_launch.php
                </code>
            </p>
        </div>

        <?php if (isset($_SESSION['user_id'])): ?>
            <div style="margin-top: 30px;">
                <p style="color: #27ae60; margin-bottom: 15px;">
                    ✓ 로그인됨: <?php echo htmlspecialchars($_SESSION['user_role']); ?>
                </p>
                <?php if ($_SESSION['user_role'] === 'teacher'): ?>
                    <a href="/teacher/dashboard.php" style="display: inline-block; padding: 12px 30px; background: #3498db; color: white; border-radius: 6px; margin: 5px;">
                        교사 대시보드
                    </a>
                <?php else: ?>
                    <a href="/student/solve.php" style="display: inline-block; padding: 12px 30px; background: #3498db; color: white; border-radius: 6px; margin: 5px;">
                        문제 풀이
                    </a>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <p class="version">
            Version 1.0.0 |
            <a href="https://github.com" target="_blank">GitHub</a> |
            <a href="/docs" target="_blank">문서</a>
        </p>
    </div>
</body>
</html>
