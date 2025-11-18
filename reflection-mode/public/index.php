<?php
/**
 * Reflection Mode - Main Interface
 * LMS Integration for Math Visualization
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

session_start();

// Load configuration
require_once '../config/database.php';

// Get problem data from LMS or session
$problem_id = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;
$problem_data = null;

if ($problem_id && isset($db)) {
    $stmt = $db->prepare("SELECT * FROM problems WHERE id = ?");
    $stmt->bind_param("i", $problem_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $problem_data = $result->fetch_assoc();
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reflection Mode - y=x 대칭 시각화</title>
    <link rel="stylesheet" href="../assets/css/smartphone.css">
    <link rel="stylesheet" href="../assets/css/reflection.css">
</head>
<body>
    <div class="container">
        <!-- Main Control Panel (Left Side) -->
        <div class="control-panel">
            <h1>Reflection Mode 제어판</h1>

            <div class="problem-info">
                <h2>문제 정보</h2>
                <?php if ($problem_data): ?>
                    <p><strong>문제 ID:</strong> <?php echo htmlspecialchars($problem_data['id']); ?></p>
                    <p><strong>제목:</strong> <?php echo htmlspecialchars($problem_data['title']); ?></p>
                    <p><strong>설명:</strong> <?php echo htmlspecialchars($problem_data['description']); ?></p>
                <?php else: ?>
                    <p>문제를 선택하거나 새로운 도형을 그려주세요.</p>
                <?php endif; ?>
            </div>

            <div class="controls">
                <h3>시각화 옵션</h3>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="showOriginal" checked>
                        원본 도형 표시
                    </label>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="showReflected" checked>
                        대칭 도형 표시
                    </label>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="showOverlap" checked>
                        겹치는 부분 강조
                    </label>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="showAxis" checked>
                        y=x 축 표시
                    </label>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="showGrid">
                        격자 표시
                    </label>
                </div>

                <div class="control-group">
                    <label for="overlapOpacity">겹침 투명도:</label>
                    <input type="range" id="overlapOpacity" min="0" max="100" value="70">
                    <span id="opacityValue">70%</span>
                </div>

                <div class="control-group">
                    <label for="shapeType">도형 종류:</label>
                    <select id="shapeType">
                        <option value="polygon">다각형</option>
                        <option value="circle">원</option>
                        <option value="rectangle">직사각형</option>
                        <option value="triangle">삼각형</option>
                        <option value="custom">사용자 정의</option>
                    </select>
                </div>

                <div class="button-group">
                    <button id="btnDraw" class="btn btn-primary">도형 그리기</button>
                    <button id="btnClear" class="btn btn-secondary">지우기</button>
                    <button id="btnReset" class="btn btn-secondary">초기화</button>
                </div>

                <div class="button-group">
                    <button id="btnAnimate" class="btn btn-success">애니메이션 시작</button>
                    <button id="btnExport" class="btn btn-info">이미지 저장</button>
                </div>
            </div>

            <div class="statistics">
                <h3>분석 결과</h3>
                <p><strong>원본 면적:</strong> <span id="originalArea">0</span></p>
                <p><strong>겹치는 면적:</strong> <span id="overlapArea">0</span></p>
                <p><strong>겹침 비율:</strong> <span id="overlapRatio">0%</span></p>
            </div>
        </div>

        <!-- Virtual Smartphone Display (Right Bottom) -->
        <div class="smartphone-container">
            <div class="smartphone-frame">
                <div class="smartphone-header">
                    <div class="notch"></div>
                    <div class="time">10:42</div>
                    <div class="status-icons">
                        <span class="signal">📶</span>
                        <span class="battery">🔋</span>
                    </div>
                </div>

                <div class="smartphone-screen">
                    <div class="app-header">
                        <h2>Reflection Mode</h2>
                        <p class="subtitle">y=x 기준 대칭 시각화</p>
                    </div>

                    <canvas id="reflectionCanvas" width="360" height="640"></canvas>

                    <div class="app-footer">
                        <div class="touch-hint">
                            👆 터치하여 점 추가 / 드래그하여 이동
                        </div>
                    </div>
                </div>

                <div class="smartphone-bottom">
                    <div class="home-button"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Load JavaScript -->
    <script src="../assets/js/reflection-engine.js"></script>
    <script src="../assets/js/smartphone-app.js"></script>

    <script>
        // Initialize with problem data from PHP
        <?php if ($problem_data && isset($problem_data['shape_data'])): ?>
        const problemData = <?php echo $problem_data['shape_data']; ?>;
        window.addEventListener('load', () => {
            if (problemData && window.reflectionEngine) {
                window.reflectionEngine.loadProblemData(problemData);
            }
        });
        <?php endif; ?>
    </script>
</body>
</html>
