/**
 * Main Application Logic
 * LMS 연동 및 UI 제어
 */

// Volume Fill 인스턴스 초기화
let volumeFill;
let startTime;
let timerInterval;

// 학습 상태
const learningState = {
    totalProblems: 10,
    correctAnswers: 0,
    studentName: "홍길동",
    studentId: null,
    quizId: null
};

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', () => {
    volumeFill = new VolumeFill();
    initializeUI();
    startTimer();
});

/**
 * UI 초기화
 */
function initializeUI() {
    // 컨트롤 이벤트 리스너
    document.getElementById('progress').addEventListener('input', handleProgressChange);
    document.getElementById('problem-count').addEventListener('change', handleProblemCountChange);
    document.getElementById('correct-count').addEventListener('change', handleCorrectCountChange);
    document.getElementById('submit-answer').addEventListener('click', handleSubmitAnswer);
    document.getElementById('load-from-moodle').addEventListener('click', handleLoadFromMoodle);
    document.getElementById('reset').addEventListener('click', handleReset);

    // 초기 상태 표시
    updateDisplay();
}

/**
 * 진도율 슬라이더 변경 핸들러
 */
function handleProgressChange(e) {
    const percentage = parseInt(e.target.value);
    document.getElementById('progress-value').textContent = `${percentage}%`;
    volumeFill.setPercentage(percentage);
}

/**
 * 문제 수 변경 핸들러
 */
function handleProblemCountChange(e) {
    learningState.totalProblems = parseInt(e.target.value);
    updateDisplay();
    updateProgressFromAnswers();
}

/**
 * 정답 수 변경 핸들러
 */
function handleCorrectCountChange(e) {
    learningState.correctAnswers = parseInt(e.target.value);
    updateDisplay();
    updateProgressFromAnswers();
}

/**
 * 정답 제출 핸들러
 */
function handleSubmitAnswer() {
    if (learningState.correctAnswers < learningState.totalProblems) {
        learningState.correctAnswers++;
        document.getElementById('correct-count').value = learningState.correctAnswers;
        updateDisplay();
        updateProgressFromAnswers();

        // 성공 효과
        showNotification('정답입니다! ✅', 'success');
    } else {
        showNotification('모든 문제를 완료했습니다! 🎉', 'info');
    }
}

/**
 * Moodle에서 데이터 불러오기
 */
async function handleLoadFromMoodle() {
    try {
        showNotification('Moodle에서 데이터를 불러오는 중...', 'info');

        // API 호출 (실제 환경에서는 실제 endpoint 사용)
        const response = await fetch('/api/get-progress.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: learningState.studentId || 1,
                quiz_id: learningState.quizId || 1
            })
        });

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();

        if (data.success) {
            // 데이터 업데이트
            learningState.totalProblems = data.data.total_questions;
            learningState.correctAnswers = data.data.correct_answers;
            learningState.studentName = data.data.student_name;

            // UI 업데이트
            document.getElementById('problem-count').value = learningState.totalProblems;
            document.getElementById('correct-count').value = learningState.correctAnswers;
            document.getElementById('student-name').textContent = `학생: ${learningState.studentName}`;

            updateDisplay();
            updateProgressFromAnswers();

            showNotification('데이터를 성공적으로 불러왔습니다! ✅', 'success');
        } else {
            throw new Error(data.message || '데이터 로드 실패');
        }
    } catch (error) {
        console.error('Moodle 데이터 로드 오류:', error);
        showNotification('데이터를 불러오는데 실패했습니다. 데모 데이터를 사용합니다.', 'warning');

        // 데모 데이터 사용
        useDemoData();
    }
}

/**
 * 데모 데이터 사용
 */
function useDemoData() {
    learningState.totalProblems = 15;
    learningState.correctAnswers = 8;
    learningState.studentName = "김철수 (데모)";

    document.getElementById('problem-count').value = learningState.totalProblems;
    document.getElementById('correct-count').value = learningState.correctAnswers;
    document.getElementById('student-name').textContent = `학생: ${learningState.studentName}`;

    updateDisplay();
    updateProgressFromAnswers();
}

/**
 * 리셋 핸들러
 */
function handleReset() {
    learningState.correctAnswers = 0;
    learningState.totalProblems = 10;

    document.getElementById('progress').value = 0;
    document.getElementById('progress-value').textContent = '0%';
    document.getElementById('problem-count').value = 10;
    document.getElementById('correct-count').value = 0;

    volumeFill.reset();
    updateDisplay();

    // 타이머 리셋
    startTime = Date.now();

    showNotification('초기화되었습니다.', 'info');
}

/**
 * 정답 수를 기반으로 진도율 업데이트
 */
function updateProgressFromAnswers() {
    const percentage = (learningState.correctAnswers / learningState.totalProblems) * 100;
    volumeFill.setPercentage(percentage);

    // 슬라이더도 업데이트
    document.getElementById('progress').value = Math.round(percentage);
    document.getElementById('progress-value').textContent = `${Math.round(percentage)}%`;
}

/**
 * 화면 표시 업데이트
 */
function updateDisplay() {
    // 통계 업데이트
    document.getElementById('total-problems').textContent = learningState.totalProblems;
    document.getElementById('correct-answers').textContent = learningState.correctAnswers;

    const accuracy = learningState.totalProblems > 0
        ? ((learningState.correctAnswers / learningState.totalProblems) * 100).toFixed(1)
        : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;

    // 스마트폰 화면 업데이트
    document.getElementById('phone-total').textContent = learningState.totalProblems;
    document.getElementById('phone-correct').textContent = learningState.correctAnswers;
}

/**
 * 타이머 시작
 */
function startTimer() {
    startTime = Date.now();

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('phone-time').textContent = timeString;
    }, 1000);
}

/**
 * 알림 표시
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 알림 색상 반환
 */
function getNotificationColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    return colors[type] || colors.info;
}

// 알림 애니메이션
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(notificationStyle);

/**
 * URL 파라미터에서 학생 정보 로드
 */
function loadFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('student_id')) {
        learningState.studentId = urlParams.get('student_id');
    }

    if (urlParams.has('quiz_id')) {
        learningState.quizId = urlParams.get('quiz_id');
    }

    if (urlParams.has('auto_load') && urlParams.get('auto_load') === 'true') {
        // 자동으로 Moodle에서 데이터 로드
        setTimeout(() => handleLoadFromMoodle(), 500);
    }
}

// URL 파라미터 확인
loadFromURLParams();
