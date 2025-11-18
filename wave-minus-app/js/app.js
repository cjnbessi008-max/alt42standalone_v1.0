/**
 * Wave Minus 앱 메인 애플리케이션
 */

// DOM 요소
const setAContainer = document.getElementById('setA');
const setBContainer = document.getElementById('setB');
const resultContainer = document.getElementById('result');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const newProblemBtn = document.getElementById('newProblemBtn');

// Wave Minus 인스턴스
const waveMinus = new WaveMinus();

// 현재 문제 데이터
let currentProblem = null;

/**
 * 초기화
 */
function init() {
    loadNewProblem();
    setupEventListeners();

    // Moodle 연동 확인 (URL 파라미터로 문제 데이터 받기)
    checkMoodleIntegration();
}

/**
 * 새 문제 로드
 */
function loadNewProblem() {
    // 랜덤 문제 생성
    currentProblem = WaveMinus.generateRandomProblem(5, 8, 15);

    // 집합 설정
    waveMinus.setSets(currentProblem.setA, currentProblem.setB);

    // 렌더링
    waveMinus.renderSetA(setAContainer);
    waveMinus.renderSetB(setBContainer);
    resultContainer.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">애니메이션을 실행하세요</p>';

    // 버튼 상태
    playBtn.disabled = false;
    playBtn.textContent = '애니메이션 실행';

    console.log('새 문제 로드:', currentProblem);
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 애니메이션 실행 버튼
    playBtn.addEventListener('click', playAnimation);

    // 초기화 버튼
    resetBtn.addEventListener('click', resetProblem);

    // 새 문제 버튼
    newProblemBtn.addEventListener('click', loadNewProblem);
}

/**
 * 애니메이션 실행
 */
async function playAnimation() {
    if (waveMinus.isAnimating) return;

    playBtn.disabled = true;
    playBtn.textContent = '애니메이션 실행 중...';

    // 결과 초기화
    resultContainer.innerHTML = '';

    // Wave 애니메이션 실행
    await waveMinus.playWaveAnimation(
        setAContainer,
        resultContainer,
        () => {
            playBtn.disabled = false;
            playBtn.textContent = '다시 실행';
            console.log('애니메이션 완료. 결과:', waveMinus.result);
        }
    );
}

/**
 * 문제 초기화
 */
function resetProblem() {
    if (waveMinus.isAnimating) return;

    // 현재 문제 다시 렌더링
    waveMinus.renderSetA(setAContainer);
    waveMinus.renderSetB(setBContainer);
    resultContainer.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">애니메이션을 실행하세요</p>';

    playBtn.disabled = false;
    playBtn.textContent = '애니메이션 실행';
}

/**
 * Moodle 연동 확인
 * URL 파라미터에서 문제 데이터를 가져옴
 */
function checkMoodleIntegration() {
    const urlParams = new URLSearchParams(window.location.search);

    // Moodle에서 전달된 파라미터 확인
    const moodleSetA = urlParams.get('setA');
    const moodleSetB = urlParams.get('setB');
    const problemId = urlParams.get('problemId');

    if (moodleSetA && moodleSetB) {
        try {
            // JSON 파싱
            const setA = JSON.parse(decodeURIComponent(moodleSetA));
            const setB = JSON.parse(decodeURIComponent(moodleSetB));

            // Moodle 문제로 설정
            currentProblem = { setA, setB, problemId };
            waveMinus.setSets(setA, setB);

            // 렌더링
            waveMinus.renderSetA(setAContainer);
            waveMinus.renderSetB(setBContainer);

            console.log('Moodle 문제 로드:', currentProblem);

            // 문제 정보 표시 업데이트
            updateProblemDisplay(problemId);
        } catch (error) {
            console.error('Moodle 데이터 파싱 오류:', error);
            loadNewProblem();
        }
    }
}

/**
 * 문제 정보 표시 업데이트
 */
function updateProblemDisplay(problemId) {
    const problemText = document.querySelector('.problem-text p');
    if (problemId) {
        problemText.innerHTML = `<strong>문제 #${problemId}:</strong> A - B를 구하세요`;
    }
}

/**
 * Moodle에 결과 전송
 * @param {Array} result - 계산 결과
 */
async function sendResultToMoodle(result) {
    if (!currentProblem || !currentProblem.problemId) {
        console.log('Moodle 연동 없음');
        return;
    }

    try {
        const response = await fetch('php/submit_answer.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                problemId: currentProblem.problemId,
                answer: result,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        console.log('Moodle 제출 결과:', data);

        if (data.success) {
            showFeedback(data.feedback);
        }
    } catch (error) {
        console.error('Moodle 제출 오류:', error);
    }
}

/**
 * 피드백 표시
 * @param {string} message - 피드백 메시지
 */
function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideDown 0.5s ease-out;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.animation = 'slideUp 0.5s ease-out';
        setTimeout(() => feedback.remove(), 500);
    }, 3000);
}

// CSS 애니메이션
const feedbackStyle = document.createElement('style');
feedbackStyle.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(feedbackStyle);

// 앱 초기화
document.addEventListener('DOMContentLoaded', init);

// 전역 객체로 노출 (디버깅용)
window.waveMinus = waveMinus;
window.app = {
    loadNewProblem,
    playAnimation,
    resetProblem,
    sendResultToMoodle
};
