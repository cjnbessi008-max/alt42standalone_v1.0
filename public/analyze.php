<?php
/**
 * Run Weak Link Analysis
 */

require_once __DIR__ . '/../config/config.php';

$message = '';
$messageType = 'info';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Initialize components
        $extractor = new ConceptExtractor();
        $detector = new WeakLinkDetector();

        // Step 1: Build concept relationships
        $relationshipsCreated = $extractor->buildConceptRelationships();

        // Step 2: Detect weak links
        $weakLinks = $detector->detectWeakLinks();

        $message = "분석 완료! {$relationshipsCreated}개의 개념 관계가 생성되었고, " .
                   count($weakLinks) . "개의 약한 연결이 발견되었습니다.";
        $messageType = 'success';

    } catch (Exception $e) {
        $message = "분석 중 오류 발생: " . $e->getMessage();
        $messageType = 'danger';
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>약한 연결 분석 - 약한 개념 연결 탐지 시스템</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>🔍 약한 연결 분석</h1>
            <p><a href="index.php" style="color: white;">← 대시보드로 돌아가기</a></p>
        </div>
    </header>

    <div class="container">
        <div class="card">
            <h2>분석 실행</h2>

            <?php if ($message): ?>
                <div class="alert alert-<?= $messageType ?>">
                    <?= htmlspecialchars($message) ?>
                </div>
            <?php endif; ?>

            <div class="alert alert-info">
                <strong>분석 알고리즘:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    <li><strong>낮은 정답률:</strong> 두 개념 모두 정답률이 <?= LOW_ACCURACY_THRESHOLD ?>% 미만인 연결을 탐지</li>
                    <li><strong>높은 오답 상관관계:</strong> 한 개념에서 실패한 학생이 다른 개념에서도 실패하는 패턴 (상관도 <?= CORRELATION_THRESHOLD * 100 ?>% 이상)</li>
                    <li><strong>선수 개념 미숙:</strong> 선수 개념을 충분히 학습하지 못해 다음 개념에서 어려움을 겪는 경우</li>
                    <li><strong>개념 간격:</strong> 난이도 차이가 크지만 연결이 약한 경우, 중간 개념이 필요할 수 있음</li>
                </ul>
            </div>

            <form method="POST" action="">
                <p style="margin: 20px 0;">
                    <button type="submit" class="btn btn-success" style="font-size: 1.1em; padding: 15px 30px;">
                        ▶️ 분석 시작
                    </button>
                </p>
            </form>

            <div class="alert alert-warning">
                <strong>참고:</strong> 분석을 실행하기 전에 Moodle 데이터가 동기화되어 있어야 합니다.
                <a href="sync.php" class="btn btn-primary" style="margin-left: 10px;">Moodle 데이터 동기화</a>
            </div>
        </div>

        <div class="card">
            <h2>📊 분석 설정</h2>
            <table>
                <tr>
                    <th>설정 항목</th>
                    <th>현재 값</th>
                </tr>
                <tr>
                    <td>약한 연결 임계값</td>
                    <td><?= WEAK_LINK_THRESHOLD ?> (연결 강도가 이 값보다 낮으면 약함)</td>
                </tr>
                <tr>
                    <td>낮은 정답률 임계값</td>
                    <td><?= LOW_ACCURACY_THRESHOLD ?>%</td>
                </tr>
                <tr>
                    <td>최소 시도 횟수</td>
                    <td><?= MIN_ATTEMPTS_FOR_ANALYSIS ?>회 (신뢰성 있는 분석을 위해)</td>
                </tr>
                <tr>
                    <td>오답 상관도 임계값</td>
                    <td><?= CORRELATION_THRESHOLD * 100 ?>%</td>
                </tr>
            </table>
            <p style="margin-top: 15px; font-size: 0.9em; color: #7f8c8d;">
                이 설정은 <code>config/config.php</code> 파일에서 변경할 수 있습니다.
            </p>
        </div>
    </div>

    <footer>
        <p>Weak Concept Link Detection System v1.0</p>
    </footer>
</body>
</html>
