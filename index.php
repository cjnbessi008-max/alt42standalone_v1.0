<?php
/**
 * Condition Verification System
 * Main Landing Page
 */

require_once __DIR__ . '/config/database.php';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 48px;
            text-align: center;
        }

        h1 {
            font-size: 36px;
            color: #2d3748;
            margin-bottom: 16px;
        }

        .subtitle {
            font-size: 18px;
            color: #718096;
            margin-bottom: 48px;
        }

        .links {
            display: grid;
            gap: 16px;
        }

        .link-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
        }

        .link-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .link-card h2 {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .link-card p {
            font-size: 14px;
            opacity: 0.9;
        }

        .features {
            margin-top: 48px;
            padding-top: 48px;
            border-top: 2px solid #e2e8f0;
        }

        .features h3 {
            font-size: 20px;
            color: #2d3748;
            margin-bottom: 24px;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            text-align: left;
        }

        .feature {
            padding: 16px;
            background: #f7fafc;
            border-radius: 8px;
        }

        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .feature h4 {
            font-size: 14px;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .feature p {
            font-size: 12px;
            color: #718096;
        }

        @media (max-width: 640px) {
            .container {
                padding: 32px;
            }

            h1 {
                font-size: 28px;
            }

            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><?php echo APP_NAME; ?></h1>
        <p class="subtitle">
            학생들이 문제의 중요한 조건을 제대로 읽고 이해했는지 확인하는 교육용 시스템
        </p>

        <div class="links">
            <a href="admin/index.php?teacher_id=1" class="link-card">
                <h2>👨‍🏫 교사 관리 페이지</h2>
                <p>문제 생성, 조건 설정, 학생 분석</p>
            </a>

            <a href="student/problem_view.php?problem_id=1&student_id=1" class="link-card">
                <h2>👨‍🎓 학생 문제 풀이</h2>
                <p>문제 읽기 및 조건 확인 체험</p>
            </a>
        </div>

        <div class="features">
            <h3>주요 기능</h3>
            <div class="feature-grid">
                <div class="feature">
                    <div class="feature-icon">⏱️</div>
                    <h4>읽기 시간 추적</h4>
                    <p>학생의 문제 읽기 시간을 자동으로 측정합니다</p>
                </div>

                <div class="feature">
                    <div class="feature-icon">✅</div>
                    <h4>조건 확인 시스템</h4>
                    <p>중요 조건을 체크해야만 제출 가능</p>
                </div>

                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <h4>학습 분석</h4>
                    <p>학생의 읽기 패턴과 이해도 분석</p>
                </div>

                <div class="feature">
                    <div class="feature-icon">🎨</div>
                    <h4>조건 하이라이트</h4>
                    <p>중요 조건을 색상으로 강조 표시</p>
                </div>
            </div>
        </div>

        <div style="margin-top: 32px; padding-top: 32px; border-top: 2px solid #e2e8f0;">
            <p style="font-size: 13px; color: #718096;">
                기본 로그인 정보 (데모용)<br>
                교사 ID: 1 | 학생 ID: 1-3 | 비밀번호: password
            </p>
        </div>
    </div>
</body>
</html>
