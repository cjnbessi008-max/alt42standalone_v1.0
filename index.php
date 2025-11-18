<?php
/**
 * Vector Star Map - Main Entry Point
 * Educational Web Application with Moodle LMS Integration
 */

require_once __DIR__ . '/config/config.php';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - 학습 별자리 시각화</title>
    <meta name="description" content="벡터 끝점이 별자리처럼 연결되는 학습 경로 시각화 시스템">

    <!-- Styles -->
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

    <!-- Desktop Content Area -->
    <div class="desktop-container">
        <div class="desktop-content">
            <h1>📚 Vector Star Map</h1>
            <p>
                <strong>학습 개념을 별자리처럼 시각화하는 교육 시스템</strong>
            </p>
            <p>
                각 학습 개념을 벡터의 끝점(별)으로 표현하고, 관련된 개념들을 선으로 연결하여
                학습 경로를 직관적으로 이해할 수 있습니다.
            </p>

            <div class="info-box">
                <h3>🌟 주요 기능</h3>
                <ul class="feature-list">
                    <li><strong>벡터 별자리 시각화</strong> - 학습 개념을 우주의 별처럼 배치</li>
                    <li><strong>개념 간 연결</strong> - 선수학습, 관련 개념을 별자리 선으로 표시</li>
                    <li><strong>학습 진도 추적</strong> - 완료한 개념은 밝게, 미완료는 어둡게</li>
                    <li><strong>난이도 표시</strong> - 별의 색상으로 난이도 구분</li>
                    <li><strong>실시간 애니메이션</strong> - 파티클 효과와 글로우 효과</li>
                    <li><strong>Moodle 연동</strong> - LMS에서 문제 정보 동기화</li>
                </ul>
            </div>

            <div class="info-box">
                <h3>🎨 별자리 의미</h3>
                <p>
                    <strong>별의 색상:</strong><br>
                    • 회색 - 아직 시작 안함<br>
                    • 주황색 - 진행중<br>
                    • 초록색 - 완료<br>
                    • 파란색 - 마스터<br><br>

                    <strong>연결선 종류:</strong><br>
                    • 파란선 + 화살표 - 선수학습 (이 개념을 먼저 학습해야 함)<br>
                    • 보라선 - 관련 개념<br>
                    • 주황선 - 심화 개념<br>
                </p>
            </div>

            <div class="info-box">
                <h3>⚙️ 시스템 정보</h3>
                <p>
                    <strong>버전:</strong> <?php echo APP_VERSION; ?><br>
                    <strong>LMS:</strong> Moodle 3.7 호환<br>
                    <strong>데이터베이스:</strong> MySQL 5.7<br>
                    <strong>서버:</strong> PHP 7.1.9<br>
                    <strong>시각화:</strong> HTML5 Canvas<br>
                </p>
            </div>

            <p style="margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
                우측 하단의 스마트폰 화면에서 Vector Star Map을 확인하세요 →
            </p>
        </div>
    </div>

    <!-- Mobile Screen Simulator (Bottom-Right Corner) -->
    <div class="mobile-simulator">
        <div id="mobileScreen">
            <!-- Mobile app will be rendered here by JavaScript -->
            <div class="loading"></div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/vector-star-map.js"></script>
    <script src="js/mobile-app.js"></script>

</body>
</html>
