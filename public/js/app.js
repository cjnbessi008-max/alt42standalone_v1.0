/**
 * Ratio Alive - 메인 애플리케이션
 * Moodle LMS 연동 및 UI 컨트롤
 */

// 전역 변수
let ratioApp = null;
let currentProblem = null;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    // RatioAlive 인스턴스 생성
    ratioApp = new RatioAlive('ratioCanvas');

    // 이벤트 리스너 등록
    initEventListeners();

    // Moodle에서 문제 정보 로드
    loadProblemFromMoodle();

    // 자동 재생 시작
    setTimeout(() => {
        ratioApp.play();
    }, 1000);
});

/**
 * 이벤트 리스너 초기화
 */
function initEventListeners() {
    // 도형 선택 버튼
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 활성 버튼 변경
            shapeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 도형 변경
            const shape = this.dataset.shape;
            ratioApp.setShape(shape);
            updateInfoText(shape);
        });
    });

    // 비율 슬라이더
    const ratio1 = document.getElementById('ratio1');
    const ratio1Value = document.getElementById('ratio1Value');
    const ratio2 = document.getElementById('ratio2');
    const ratio2Value = document.getElementById('ratio2Value');

    ratio1.addEventListener('input', function() {
        const a = parseInt(this.value);
        const b = parseInt(ratio2.value);
        ratio1Value.textContent = a;
        ratioApp.setRatio(a, b);
        updateRatioDisplay(a, b);
    });

    ratio2.addEventListener('input', function() {
        const a = parseInt(ratio1.value);
        const b = parseInt(this.value);
        ratio2Value.textContent = b;
        ratioApp.setRatio(a, b);
        updateRatioDisplay(a, b);
    });

    // 애니메이션 컨트롤
    document.getElementById('playBtn').addEventListener('click', function() {
        ratioApp.play();
        showMessage('애니메이션 재생 중...', 'success');
    });

    document.getElementById('pauseBtn').addEventListener('click', function() {
        ratioApp.pause();
        showMessage('애니메이션 일시정지', 'info');
    });

    document.getElementById('resetBtn').addEventListener('click', function() {
        ratioApp.reset();
        showMessage('애니메이션 리셋', 'info');
    });

    // 속도 조절
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');

    speedSlider.addEventListener('input', function() {
        const speed = parseFloat(this.value);
        speedValue.textContent = speed + 'x';
        ratioApp.setSpeed(speed);
    });

    // 답안 제출
    document.getElementById('submitBtn').addEventListener('click', submitAnswer);
}

/**
 * 비율 표시 업데이트
 */
function updateRatioDisplay(a, b) {
    document.getElementById('currentRatio').textContent = `${a}:${b}`;

    const percentage = ((a / b) * 100).toFixed(1);
    document.getElementById('percentage').textContent = `${percentage}%`;
}

/**
 * 정보 텍스트 업데이트
 */
function updateInfoText(shape) {
    const infoText = document.getElementById('infoText');
    const messages = {
        'triangle': '삼각형의 밑변과 높이 비율을 관찰하세요!',
        'rectangle': '직사각형의 가로와 세로 비율을 관찰하세요!',
        'pentagon': '오각형의 크기가 변해도 비율은 일정합니다!'
    };

    infoText.textContent = messages[shape] || '도형을 관찰하세요!';
}

/**
 * Moodle에서 문제 정보 로드
 */
function loadProblemFromMoodle() {
    const problemInfo = document.getElementById('problemInfo');

    // URL 파라미터에서 문제 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('problemId') || urlParams.get('id');
    const sessionId = urlParams.get('sessionId') || urlParams.get('session');

    if (!problemId) {
        // 문제 ID가 없으면 데모 모드
        problemInfo.innerHTML = `
            <h2>데모 모드</h2>
            <p><strong>주제:</strong> 비율의 개념</p>
            <p><strong>학습 목표:</strong> 도형의 크기가 변해도 비율은 일정함을 이해한다.</p>
            <p><strong>난이도:</strong> 중급</p>
            <div class="demo-notice" style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; color: #856404;">
                💡 Moodle LMS와 연동하려면 URL에 problemId 파라미터를 추가하세요.
            </div>
        `;
        return;
    }

    // Moodle API 호출
    fetch(`../api/problem_api.php?id=${problemId}&session=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentProblem = data.problem;
                displayProblemInfo(data.problem);

                // 문제에 지정된 초기 설정 적용
                if (data.problem.initialShape) {
                    ratioApp.setShape(data.problem.initialShape);
                    document.querySelector(`[data-shape="${data.problem.initialShape}"]`).click();
                }

                if (data.problem.initialRatio) {
                    const [a, b] = data.problem.initialRatio.split(':').map(Number);
                    document.getElementById('ratio1').value = a;
                    document.getElementById('ratio2').value = b;
                    document.getElementById('ratio1Value').textContent = a;
                    document.getElementById('ratio2Value').textContent = b;
                    ratioApp.setRatio(a, b);
                    updateRatioDisplay(a, b);
                }
            } else {
                problemInfo.innerHTML = `
                    <h2>오류</h2>
                    <p style="color: #d32f2f;">${data.message || '문제를 불러올 수 없습니다.'}</p>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading problem:', error);
            problemInfo.innerHTML = `
                <h2>연결 오류</h2>
                <p style="color: #d32f2f;">Moodle 서버에 연결할 수 없습니다.</p>
                <p style="font-size: 0.9em; color: #666;">데모 모드로 계속 사용할 수 있습니다.</p>
            `;
        });
}

/**
 * 문제 정보 표시
 */
function displayProblemInfo(problem) {
    const problemInfo = document.getElementById('problemInfo');

    problemInfo.innerHTML = `
        <h2>${problem.title || '문제 정보'}</h2>
        <p><strong>주제:</strong> ${problem.topic || '비율과 비례'}</p>
        <p><strong>설명:</strong> ${problem.description || '도형의 비율을 관찰하고 이해하세요.'}</p>
        <p><strong>난이도:</strong> ${problem.difficulty || '중급'}</p>
        ${problem.instructions ? `<p><strong>지시사항:</strong> ${problem.instructions}</p>` : ''}
        <div style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
            <small>📚 Moodle LMS에서 로드됨</small>
        </div>
    `;
}

/**
 * 답안 제출
 */
function submitAnswer() {
    const answerText = document.getElementById('answerText').value.trim();

    if (!answerText) {
        showMessage('답안을 작성해주세요.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    // URL 파라미터
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('problemId') || urlParams.get('id') || 'demo';
    const sessionId = urlParams.get('sessionId') || urlParams.get('session') || 'demo';

    // 답안 데이터
    const answerData = {
        problemId: problemId,
        sessionId: sessionId,
        answer: answerText,
        currentRatio: `${document.getElementById('ratio1').value}:${document.getElementById('ratio2').value}`,
        currentShape: document.querySelector('.shape-btn.active').dataset.shape,
        timestamp: new Date().toISOString()
    };

    // Moodle API로 제출
    fetch('../api/problem_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('답안이 성공적으로 제출되었습니다!', 'success');
            document.getElementById('answerText').value = '';

            // 피드백 표시
            if (data.feedback) {
                showFeedback(data.feedback);
            }
        } else {
            showMessage(data.message || '제출에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting answer:', error);
        showMessage('서버 연결 오류가 발생했습니다.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '제출';
    });
}

/**
 * 메시지 표시
 */
function showMessage(message, type = 'info') {
    const infoText = document.getElementById('infoText');
    const originalText = infoText.textContent;

    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };

    infoText.textContent = `${icons[type]} ${message}`;

    setTimeout(() => {
        infoText.textContent = originalText;
    }, 3000);
}

/**
 * 피드백 표시
 */
function showFeedback(feedback) {
    const problemInfo = document.getElementById('problemInfo');

    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = 'margin-top: 15px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 5px;';
    feedbackDiv.innerHTML = `
        <strong>📝 피드백:</strong><br>
        ${feedback}
    `;

    problemInfo.appendChild(feedbackDiv);

    // 5초 후 피드백 제거
    setTimeout(() => {
        feedbackDiv.remove();
    }, 5000);
}

/**
 * 페이지 언로드 시 세션 저장
 */
window.addEventListener('beforeunload', function() {
    // 현재 상태 저장 (로컬 스토리지)
    const state = {
        shape: document.querySelector('.shape-btn.active').dataset.shape,
        ratioA: document.getElementById('ratio1').value,
        ratioB: document.getElementById('ratio2').value,
        answer: document.getElementById('answerText').value
    };

    localStorage.setItem('ratioAliveState', JSON.stringify(state));
});
