<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Answer Reason Tracker - Home</title>
    <link rel="stylesheet" href="public/css/style.css">
    <style>
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }

        .hero h1 {
            font-size: 48px;
            margin-bottom: 20px;
        }

        .hero p {
            font-size: 20px;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 40px;
        }

        .action-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .hero-btn {
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }

        .hero-btn-primary {
            background: white;
            color: #667eea;
        }

        .hero-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .hero-btn-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid white;
        }

        .hero-btn-secondary:hover {
            background: rgba(255,255,255,0.3);
        }

        .features {
            padding: 60px 20px;
            background: white;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .feature-card {
            text-align: center;
            padding: 30px;
            border-radius: 8px;
            background: var(--light-gray);
        }

        .feature-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }

        .feature-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .feature-description {
            color: var(--text-muted);
            line-height: 1.6;
        }

        .info-section {
            background: var(--light-gray);
            padding: 60px 20px;
        }

        .info-content {
            max-width: 800px;
            margin: 0 auto;
        }

        .info-section h2 {
            text-align: center;
            margin-bottom: 40px;
            color: var(--text-dark);
        }

        .info-list {
            list-style: none;
            padding: 0;
        }

        .info-list li {
            padding: 15px;
            margin-bottom: 10px;
            background: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .info-list li:before {
            content: "✓";
            background: var(--success-color);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>📝 Answer Reason Tracker</h1>
            <p>
                학생들이 틀린 문제의 이유를 작성하고, 교사가 이를 분석하여
                더 효과적인 학습을 지원하는 시스템입니다.
            </p>
            <div class="action-buttons">
                <a href="/student" class="hero-btn hero-btn-primary">학생 페이지</a>
                <a href="/teacher" class="hero-btn hero-btn-secondary">교사 대시보드</a>
            </div>
        </div>
    </div>

    <div class="features">
        <div class="container">
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-title">오답 원인 분석</div>
                    <div class="feature-description">
                        학생이 직접 틀린 이유를 작성하면서 자기 성찰과 메타인지를 향상시킬 수 있습니다.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">데이터 기반 인사이트</div>
                    <div class="feature-description">
                        카테고리별 통계와 학생별 분석을 통해 교사가 맞춤형 지도를 할 수 있습니다.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">🔗</div>
                    <div class="feature-title">Moodle 연동</div>
                    <div class="feature-description">
                        Moodle LMS와 연동하여 퀴즈 데이터를 자동으로 가져오고 동기화할 수 있습니다.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">💡</div>
                    <div class="feature-title">실시간 피드백</div>
                    <div class="feature-description">
                        학생이 제출한 이유를 교사가 실시간으로 확인하고 피드백을 제공할 수 있습니다.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">📈</div>
                    <div class="feature-title">학습 패턴 추적</div>
                    <div class="feature-description">
                        시간에 따른 학습 패턴과 개선 사항을 추적하여 성장을 시각화합니다.
                    </div>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">🎨</div>
                    <div class="feature-title">직관적인 UI</div>
                    <div class="feature-description">
                        학생과 교사 모두 쉽게 사용할 수 있는 직관적인 사용자 인터페이스를 제공합니다.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="info-section">
        <div class="container">
            <div class="info-content">
                <h2>시스템 특징</h2>
                <ul class="info-list">
                    <li>
                        <span>5가지 오답 카테고리: 개념 이해 부족, 계산 실수, 부주의한 실수, 문제 오독, 기타</span>
                    </li>
                    <li>
                        <span>Moodle 3.7+ 호환 (Web Services API 사용)</span>
                    </li>
                    <li>
                        <span>MySQL 5.7+ 데이터베이스 지원</span>
                    </li>
                    <li>
                        <span>PHP 7.1.9+ 환경에서 실행</span>
                    </li>
                    <li>
                        <span>RESTful API 제공으로 확장 가능</span>
                    </li>
                    <li>
                        <span>반응형 디자인으로 모바일에서도 사용 가능</span>
                    </li>
                    <li>
                        <span>교사 대시보드에서 통계 및 분석 제공</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="hero" style="padding: 40px 20px;">
        <div class="container">
            <h2>지금 바로 시작하세요</h2>
            <p style="margin: 20px auto 30px;">학습 효과를 높이는 첫 걸음을 내딛어보세요</p>
            <div class="action-buttons">
                <a href="/setup" class="hero-btn hero-btn-primary">초기 설정하기</a>
                <a href="https://github.com" class="hero-btn hero-btn-secondary" target="_blank">문서 보기</a>
            </div>
        </div>
    </div>

    <footer style="background: #333; color: white; padding: 20px; text-align: center;">
        <p>&copy; 2024 Answer Reason Tracker. All rights reserved.</p>
        <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">
            Built with PHP 7.1.9 + MySQL 5.7 + Moodle 3.7 Integration
        </p>
    </footer>
</body>
</html>
