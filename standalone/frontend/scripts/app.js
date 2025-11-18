/**
 * 메인 앱 로직
 */

let currentProblem = null;
let startTime = null;
let hintShown = false;
let recommendationType = 'ai'; // 'ai' or 'weakness'

// 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // 로그인 확인
    const user = await API.getCurrentUser();

    if (user.success) {
        showAppPage();
    } else {
        document.getElementById('loginPage').classList.add('active');
    }
});

// AI 추천 문제 가져오기
async function getRecommendedProblems() {
    showLoading(true);
    recommendationType = 'ai';

    const result = await API.getRecommendations(1);

    if (result.success && result.data.length > 0) {
        displayProblem(result.data[0]);
    } else {
        showToast('문제를 불러올 수 없습니다.', 'error');
        showLoading(false);
    }
}

// 약점 보완 문제 가져오기
async function getWeaknessProblems() {
    showLoading(true);
    recommendationType = 'weakness';

    const result = await API.getWeaknessRecommendations(1);

    if (result.success && result.data.length > 0) {
        const problemData = {
            problem: result.data[0],
            score: 1.0,
            reasons: { weakness: 1.0 }
        };
        displayProblem(problemData);
    } else {
        showToast('문제를 불러올 수 없습니다.', 'error');
        showLoading(false);
    }
}

// 문제 표시
function displayProblem(problemData) {
    currentProblem = problemData.problem;
    startTime = Date.now();
    hintShown = false;

    // UI 초기화
    document.getElementById('answerInput').value = '';
    document.getElementById('feedbackArea').style.display = 'none';
    document.getElementById('hintText').style.display = 'none';
    document.getElementById('hintBtn').textContent = '💡 힌트 보기';

    // 문제 유형 표시
    const typeNames = {
        'arithmetic': '산술 수열',
        'geometric': '기하 수열',
        'fibonacci': '피보나치',
        'pattern': '패턴 수열'
    };

    document.getElementById('problemTypeBadge').textContent =
        typeNames[currentProblem.problem_type] || currentProblem.problem_type;

    // 추천 이유 표시
    if (problemData.score) {
        const topReason = Object.entries(problemData.reasons || {})
            .sort((a, b) => b[1] - a[1])[0];

        const reasonNames = {
            'difficulty': '적절한 난이도',
            'mastery': '약점 보완',
            'variety': '다양성',
            'collaborative': '유사 학생 패턴',
            'recent_performance': '최근 성과 고려',
            'randomness': '새로운 시도'
        };

        document.getElementById('recommendationReason').textContent =
            '🤖 ' + (reasonNames[topReason?.[0]] || 'AI 추천');

        // 점수 분석 표시
        displayScoreBreakdown(problemData.reasons);
    } else {
        document.getElementById('recommendationReason').textContent = '📈 약점 보완';
    }

    // 힌트 설정
    document.getElementById('hintText').textContent = currentProblem.hint_text || '힌트가 없습니다.';

    // 수열 애니메이션으로 표시
    displaySequenceWithAnimation(
        currentProblem.sequence_data,
        currentProblem.animation_type || 'slide'
    );

    showLoading(false);
}

// 점수 분석 표시
function displayScoreBreakdown(reasons) {
    if (!reasons) return;

    const container = document.getElementById('currentScoreBreakdown');
    let html = '<h4>현재 문제 추천 점수</h4><div class="score-bars">';

    const reasonNames = {
        'difficulty': '난이도 매칭',
        'mastery': '약점 보완',
        'variety': '다양성',
        'collaborative': '협업 필터링',
        'recent_performance': '최근 성과',
        'randomness': '탐색'
    };

    for (const [key, value] of Object.entries(reasons)) {
        const percentage = Math.round(value * 100);
        html += `
            <div class="score-bar-item">
                <span>${reasonNames[key] || key}</span>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${percentage}%">${percentage}%</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// 힌트 토글
function toggleHint() {
    const hintText = document.getElementById('hintText');
    const hintBtn = document.getElementById('hintBtn');

    if (hintShown) {
        hintText.style.display = 'none';
        hintBtn.textContent = '💡 힌트 보기';
        hintShown = false;
    } else {
        hintText.style.display = 'block';
        hintBtn.textContent = '💡 힌트 숨기기';
        hintShown = true;
    }
}

// 답안 제출
async function submitAnswer() {
    if (!currentProblem) {
        showToast('먼저 문제를 불러와주세요.', 'error');
        return;
    }

    const answer = parseInt(document.getElementById('answerInput').value);

    if (isNaN(answer)) {
        showToast('숫자를 입력해주세요.', 'error');
        return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // 버튼 비활성화
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    const result = await API.submitAnswer(
        currentProblem.id,
        answer,
        timeSpent,
        hintShown
    );

    submitBtn.disabled = false;
    submitBtn.textContent = '제출';

    if (result.success) {
        displayFeedback(result.data.feedback);

        // 통계 업데이트
        if (result.data.stats) {
            updateStatsDisplay(result.data.stats);
        }

        // 애니메이션으로 정답 표시
        revealAnswer(result.data.feedback.correct_answer, result.data.feedback.is_correct);
    } else {
        showToast(result.message, 'error');
    }
}

// 피드백 표시
function displayFeedback(feedback) {
    const area = document.getElementById('feedbackArea');
    area.innerHTML = '';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'feedback-message';
    messageDiv.textContent = feedback.message;

    const detailDiv = document.createElement('div');
    detailDiv.className = 'feedback-detail';
    detailDiv.innerHTML = `
        <p>제출한 답: ${feedback.student_answer}</p>
        <p>정답: ${feedback.correct_answer}</p>
        <p>시도 횟수: ${feedback.attempt_number}회</p>
    `;

    area.appendChild(messageDiv);
    area.appendChild(detailDiv);

    area.className = 'feedback-area ' + (feedback.is_correct ? 'correct' : 'incorrect');
    area.style.display = 'block';

    // 정답이면 3초 후 다음 문제
    if (feedback.is_correct) {
        setTimeout(() => {
            if (recommendationType === 'ai') {
                getRecommendedProblems();
            } else {
                getWeaknessProblems();
            }
        }, 3000);
    }
}

// 통계 표시 업데이트
function updateStatsDisplay(stats) {
    document.getElementById('statLevel').textContent = stats.current_level || 1;
    document.getElementById('statTotal').textContent = stats.total_problems || 0;
    document.getElementById('statAccuracy').textContent = (stats.accuracy || 0) + '%';
    document.getElementById('statXP').textContent = (stats.experience_points || 0) + ' XP';

    updateMasteryBar('masteryArithmetic', stats.arithmetic_mastery || 0);
    updateMasteryBar('masteryGeometric', stats.geometric_mastery || 0);
    updateMasteryBar('masteryFibonacci', stats.fibonacci_mastery || 0);
    updateMasteryBar('masteryPattern', stats.pattern_mastery || 0);
}

// 로딩 표시
function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    const content = document.getElementById('problemContent');

    if (show) {
        loading.style.display = 'block';
        content.style.display = 'none';
    } else {
        loading.style.display = 'none';
        content.style.display = 'block';
    }
}

// Enter 키로 제출
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('appPage').classList.contains('active')) {
        const answerInput = document.getElementById('answerInput');
        if (document.activeElement === answerInput) {
            submitAnswer();
        }
    }
});
