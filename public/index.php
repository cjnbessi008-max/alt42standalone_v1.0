<?php
/**
 * Pattern Loop Animation System - Main Page
 * Moodle 연동 주기함수 패턴 애니메이션 시스템
 */

require_once __DIR__ . '/../app/config/config.php';

// 패턴 모델 인스턴스
$patternModel = new PatternLoop();
$patterns = $patternModel->getAllActivePatterns();

// 데모용 문제 ID (실제로는 Moodle에서 가져옴)
$demoQuestionId = $_GET['question_id'] ?? 'demo';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="css/smartphone.css">
</head>
<body>
    <div class="main-container">
        <!-- 좌측 컨트롤 패널 -->
        <div class="control-panel">
            <h1>Pattern Loop Animation</h1>
            <p class="subtitle">주기함수의 반복이 패턴 애니메이션으로 보이는 시스템</p>

            <!-- 문제 정보 -->
            <div class="question-info">
                <h2>📚 현재 문제</h2>
                <div class="question-text" id="questionText">
                    데모 모드: 주기함수 시각화를 통한 삼각함수 학습
                </div>
                <div class="question-meta">
                    <span>🎯 문제 유형: <strong id="questionType">numerical</strong></span>
                    <span>⏱️ 시간 제한: <strong id="timeLimit">없음</strong></span>
                </div>
            </div>

            <!-- 패턴 목록 -->
            <div class="pattern-list">
                <h3>🎨 활성 패턴</h3>
                <div id="patternListContainer">
                    <?php foreach ($patterns as $pattern): ?>
                    <div class="pattern-item" data-pattern-id="<?php echo $pattern['id']; ?>">
                        <div class="pattern-info">
                            <div class="pattern-name"><?php echo htmlspecialchars($pattern['name']); ?></div>
                            <div class="pattern-params">
                                타입: <?php echo $pattern['function_type']; ?> |
                                진폭: <?php echo $pattern['amplitude']; ?> |
                                주파수: <?php echo $pattern['frequency']; ?>
                            </div>
                        </div>
                        <div class="pattern-color" style="background-color: <?php echo $pattern['color']; ?>"></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 컨트롤 -->
            <div class="controls">
                <button class="btn btn-primary" id="playBtn">
                    ▶️ 재생
                </button>
                <button class="btn btn-danger" id="pauseBtn">
                    ⏸️ 일시정지
                </button>
                <button class="btn btn-secondary" id="resetBtn">
                    🔄 리셋
                </button>
                <button class="btn btn-success" id="toggleGridBtn">
                    📊 그리드 토글
                </button>
            </div>

            <!-- 상태 표시 -->
            <div class="status-bar">
                <div class="status-indicator" id="statusIndicator"></div>
                <span id="statusText">준비됨</span>
            </div>

            <!-- Moodle 연동 (관리자용) -->
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                <h3 style="font-size: 16px; margin-bottom: 12px;">🔗 Moodle 연동</h3>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="quizIdInput" placeholder="퀴즈 ID"
                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <button class="btn btn-primary" id="syncQuizBtn">동기화</button>
                </div>
            </div>
        </div>
    </div>

    <!-- 가상 스마트폰 (우측 하단) -->
    <div class="smartphone-container" id="smartphoneContainer">
        <button class="toggle-phone" id="togglePhoneBtn">숨기기</button>
        <div class="smartphone">
            <div class="phone-button"></div>
            <div class="smartphone-screen">
                <canvas id="patternCanvas"></canvas>
            </div>
        </div>
    </div>

    <!-- 패턴 데이터 (JSON) -->
    <script>
        window.PATTERNS_DATA = <?php echo json_encode($patterns); ?>;
        window.API_BASE_URL = '<?php echo BASE_URL; ?>/public/api.php';
    </script>

    <!-- JavaScript -->
    <script src="js/pattern-loop.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
