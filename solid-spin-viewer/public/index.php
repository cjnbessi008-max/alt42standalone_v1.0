<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Solid Spin Viewer - 3D 입체도형 뷰어</title>
    <meta name="description" content="Moodle LMS 연동 3D 입체도형 학습 뷰어">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Main Application Container -->
    <div id="app-container">
        <!-- Phone Frame (Bottom-Right Corner) -->
        <div id="phone-frame" class="phone-frame">
            <!-- Phone Screen -->
            <div class="phone-screen">
                <!-- Header -->
                <div class="viewer-header">
                    <h2 id="shape-title">입체도형 뷰어</h2>
                    <div class="question-info">
                        <span id="question-name"></span>
                    </div>
                </div>

                <!-- 3D Canvas Container -->
                <div id="canvas-container" class="canvas-container">
                    <canvas id="viewer-canvas"></canvas>

                    <!-- Loading Overlay -->
                    <div id="loading-overlay" class="loading-overlay">
                        <div class="spinner"></div>
                        <p>로딩 중...</p>
                    </div>

                    <!-- Error Message -->
                    <div id="error-message" class="error-message hidden">
                        <p id="error-text"></p>
                        <button onclick="location.reload()">다시 시도</button>
                    </div>
                </div>

                <!-- Controls Panel -->
                <div class="controls-panel">
                    <div class="control-group">
                        <button id="btn-rotate-toggle" class="control-btn" title="자동 회전">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                        </button>
                        <button id="btn-reset" class="control-btn" title="초기화">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                            </svg>
                        </button>
                        <button id="btn-wireframe" class="control-btn" title="와이어프레임">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                            </svg>
                        </button>
                    </div>

                    <div class="control-group">
                        <label for="rotation-speed">회전 속도:</label>
                        <input type="range" id="rotation-speed" min="0" max="0.05" step="0.001" value="0.01">
                        <span id="speed-value">1x</span>
                    </div>

                    <div class="control-group">
                        <label for="shape-selector">입체도형 선택:</label>
                        <select id="shape-selector" class="shape-selector">
                            <option value="">문제에서 불러오기...</option>
                        </select>
                    </div>
                </div>

                <!-- Information Panel -->
                <div class="info-panel">
                    <div class="info-item">
                        <span class="info-label">도형명:</span>
                        <span id="info-name">-</span>
                        <span id="info-name-kr" class="info-kr">-</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">분류:</span>
                        <span id="info-category">-</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">회전 각도:</span>
                        <span id="info-rotation">X: 0° Y: 0° Z: 0°</span>
                    </div>
                </div>
            </div>

            <!-- Phone Frame Decorations -->
            <div class="phone-notch"></div>
            <div class="phone-button"></div>
        </div>
    </div>

    <!-- Configuration (Can be passed from Moodle) -->
    <script>
        // Configuration loaded from URL parameters or embedded by Moodle
        window.SOLID_VIEWER_CONFIG = {
            questionId: <?php echo isset($_GET['question_id']) ? intval($_GET['question_id']) : 'null'; ?>,
            userId: <?php echo isset($_GET['user_id']) ? intval($_GET['user_id']) : 'null'; ?>,
            sessionToken: <?php echo isset($_GET['session_token']) ? '"' . htmlspecialchars($_GET['session_token']) . '"' : 'null'; ?>,
            apiBaseUrl: '<?php echo '//' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/api'; ?>',
            debugMode: <?php echo (isset($_GET['debug']) && $_GET['debug'] === '1') ? 'true' : 'false'; ?>
        };
    </script>

    <!-- Three.js Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <!-- Solid Viewer Application -->
    <script src="js/solid-viewer.js"></script>
</body>
</html>
