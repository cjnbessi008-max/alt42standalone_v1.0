<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>1문장 핵심 - 학습 요약 시스템</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>💡 1문장 핵심</h1>
        <p class="subtitle">학습한 내용을 자신의 언어로 요약해보세요</p>

        <div class="activity-info">
            <h2 id="activityName">
                <?php
                    // URL 파라미터에서 활동 이름 가져오기
                    $activityName = $_GET['activity_name'] ?? '분수의 이해 퀴즈';
                    echo htmlspecialchars($activityName);
                ?>
            </h2>
            <p>이 활동에서 배운 가장 중요한 개념을 1-2문장으로 요약해주세요.</p>
        </div>

        <form id="summaryForm" onsubmit="return false;">
            <div class="form-group">
                <label for="summaryText">
                    학습 내용 요약 <span class="required">*</span>
                </label>
                <textarea
                    id="summaryText"
                    name="summaryText"
                    placeholder="예: 분수는 전체를 똑같이 나눈 것 중 일부를 나타내는 수입니다. 분자는 선택한 부분의 개수이고, 분모는 전체를 나눈 개수입니다."
                    maxlength="200"
                ></textarea>
                <div class="char-counter" id="charCounter">0 / 200자</div>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="autoFeedback" checked>
                    AI 피드백 자동 생성
                </label>
            </div>

            <button type="button" id="submitBtn" class="btn btn-primary" disabled>
                제출하기
            </button>
        </form>

        <div class="feedback-section" id="feedbackSection">
            <h2 style="margin-bottom: 20px;">📊 AI 피드백</h2>

            <div class="score-container">
                <div class="score-item">
                    <div class="score-label">명확성</div>
                    <div class="score-value" id="clarityScore">0</div>
                </div>
                <div class="score-item">
                    <div class="score-label">관련성</div>
                    <div class="score-value" id="relevanceScore">0</div>
                </div>
                <div class="score-item">
                    <div class="score-label">완성도</div>
                    <div class="score-value" id="completenessScore">0</div>
                </div>
                <div class="score-item">
                    <div class="score-label">종합 점수</div>
                    <div class="score-value" id="overallScore">0</div>
                </div>
            </div>

            <div class="feedback-text">
                <h3>✨ 피드백</h3>
                <p id="feedbackMessage">잘 작성하셨습니다!</p>
            </div>

            <div class="suggestions">
                <h3>💡 개선 제안</h3>
                <p id="suggestionMessage">더 구체적인 예시를 추가하면 좋을 것 같아요.</p>
            </div>
        </div>

        <div id="previousSummaries" style="margin-top: 40px; display: none;"></div>
    </div>

    <script src="js/summary.js"></script>
</body>
</html>
