<?php
/**
 * Boundary Slider - Moodle 연동 웹앱
 * 적분 경계값 조정 슬라이더
 */
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title><?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <!-- 메인 컨텐츠 영역 -->
        <div class="main-content">
            <header>
                <h1>적분 경계값 설정</h1>
                <div id="problem-info"></div>
            </header>

            <main>
                <!-- 문제 표시 영역 -->
                <section id="problem-section">
                    <div id="problem-text"></div>
                    <div id="integral-display"></div>
                </section>

                <!-- 경계값 슬라이더 -->
                <section id="boundary-controls">
                    <div class="slider-group">
                        <label for="lower-bound">하한 (a)</label>
                        <div class="slider-container">
                            <input
                                type="range"
                                id="lower-bound"
                                class="boundary-slider"
                                min="-10"
                                max="10"
                                step="0.1"
                                value="0">
                            <span class="slider-value" id="lower-value">0</span>
                        </div>
                    </div>

                    <div class="slider-group">
                        <label for="upper-bound">상한 (b)</label>
                        <div class="slider-container">
                            <input
                                type="range"
                                id="upper-bound"
                                class="boundary-slider"
                                min="-10"
                                max="10"
                                step="0.1"
                                value="1">
                            <span class="slider-value" id="upper-value">1</span>
                        </div>
                    </div>
                </section>

                <!-- 적분 결과 표시 -->
                <section id="result-section">
                    <div id="integral-result"></div>
                    <button id="submit-btn" class="submit-button">답안 제출</button>
                </section>
            </main>
        </div>

        <!-- 우측 하단 가상 스마트폰 화면 -->
        <div class="smartphone-simulator">
            <div class="phone-frame">
                <div class="phone-screen">
                    <div class="phone-header">
                        <span class="time">10:24</span>
                        <span class="battery">🔋</span>
                    </div>
                    <div class="phone-content" id="phone-display">
                        <!-- 실시간 동기화된 슬라이더 상태 표시 -->
                        <h3>현재 설정</h3>
                        <div class="phone-info">
                            <p>하한: <span id="phone-lower">0</span></p>
                            <p>상한: <span id="phone-upper">1</span></p>
                            <div id="phone-integral"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/boundary-slider.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
