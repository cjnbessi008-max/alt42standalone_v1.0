/**
 * Factor Lego - Main Application
 * 메인 애플리케이션 로직
 */

// 애플리케이션 상태
const appState = {
    currentProblemId: 1, // 기본값 (URL 파라미터에서 가져올 수 있음)
    studentId: 1, // 기본값 (Moodle 세션에서 가져와야 함)
    startTime: null,
    correctAnswers: 0,
    totalAttempts: 0,
    isMinimized: false
};

// DOM 요소
const elements = {
    problemExpression: document.getElementById('problemExpression'),
    dropZone: document.getElementById('dropZone'),
    legoPalette: document.getElementById('legoPalette'),
    submitBtn: document.getElementById('submitBtn'),
    clearBtn: document.getElementById('clearBtn'),
    hintBtn: document.getElementById('hintBtn'),
    toggleBtn: document.getElementById('toggleBtn'),
    feedbackSection: document.getElementById('feedbackSection'),
    feedbackContent: document.getElementById('feedbackContent'),
    hintModal: document.getElementById('hintModal'),
    closeHintModal: document.getElementById('closeHintModal'),
    hintContent: document.getElementById('hintContent'),
    progressFill: document.getElementById('progressFill'),
    correctCount: document.getElementById('correctCount'),
    totalCount: document.getElementById('totalCount'),
    smartphoneContainer: document.querySelector('.smartphone-container')
};

/**
 * 애플리케이션 초기화
 */
async function initializeApp() {
    try {
        // URL 파라미터에서 문제 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problem_id') || appState.currentProblemId;
        const studentId = urlParams.get('student_id') || appState.studentId;

        appState.currentProblemId = parseInt(problemId);
        appState.studentId = parseInt(studentId);

        // 드래그 앤 드롭 핸들러 초기화
        dragDropHandler.initialize(elements.dropZone, elements.legoPalette);

        // 문제 로드
        await loadProblem(appState.currentProblemId);

        // 이벤트 리스너 설정
        setupEventListeners();

        // 타이머 시작
        appState.startTime = Date.now();

        // 진행 상황 로드
        loadProgress();

        console.log('Factor Lego 앱이 초기화되었습니다.');
    } catch (error) {
        console.error('초기화 오류:', error);
        showError('앱을 초기화하는 중 오류가 발생했습니다.');
    }
}

/**
 * 문제 로드
 * @param {number} problemId - 문제 ID
 */
async function loadProblem(problemId) {
    try {
        showLoading();

        // 문제 데이터 가져오기
        const problem = await legoEngine.loadProblem(problemId);

        // 문제 표시
        elements.problemExpression.textContent = problem.expression;

        // 레고 팔레트 생성
        const palette = legoEngine.generatePalette(problem.expression);
        dragDropHandler.renderPalette(palette);

        hideLoading();
    } catch (error) {
        console.error('문제 로드 오류:', error);
        showError('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 제출 버튼
    elements.submitBtn.addEventListener('click', handleSubmit);

    // 초기화 버튼
    elements.clearBtn.addEventListener('click', () => {
        if (confirm('모든 조각을 지우시겠습니까?')) {
            dragDropHandler.clearWorkspace();
            hideFeedback();
        }
    });

    // 힌트 버튼
    elements.hintBtn.addEventListener('click', showHints);

    // 힌트 모달 닫기
    elements.closeHintModal.addEventListener('click', () => {
        elements.hintModal.style.display = 'none';
    });

    // 모달 외부 클릭 시 닫기
    elements.hintModal.addEventListener('click', (e) => {
        if (e.target === elements.hintModal) {
            elements.hintModal.style.display = 'none';
        }
    });

    // 토글 버튼 (최소화/최대화)
    elements.toggleBtn.addEventListener('click', toggleSmartphone);

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter: 제출
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit();
        }
        // Ctrl/Cmd + H: 힌트
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            showHints();
        }
        // Escape: 모달 닫기
        if (e.key === 'Escape') {
            elements.hintModal.style.display = 'none';
        }
    });
}

/**
 * 답안 제출 처리
 */
async function handleSubmit() {
    const assembledPieces = dragDropHandler.getAssembledPieces();

    // 조각이 없는 경우
    if (assembledPieces.length === 0) {
        showFeedback('레고 조각을 조립해주세요!', 'error');
        return;
    }

    try {
        showLoading();

        // 경과 시간 계산
        const timeSpent = Math.floor((Date.now() - appState.startTime) / 1000);

        // 답안 제출
        const result = await legoEngine.submitAnswer(
            appState.studentId,
            appState.currentProblemId,
            assembledPieces,
            {
                timeSpent: timeSpent,
                interactionsCount: dragDropHandler.getInteractionsCount()
            }
        );

        hideLoading();

        // 결과 처리
        if (result.success) {
            appState.totalAttempts++;

            if (result.is_correct) {
                appState.correctAnswers++;
                dragDropHandler.showCorrectEffect();
                showFeedback(result.feedback.message, 'success', result.feedback.details);

                // 다음 문제로 이동 (3초 후)
                setTimeout(() => {
                    if (confirm('다음 문제로 넘어가시겠습니까?')) {
                        loadNextProblem();
                    }
                }, 3000);
            } else {
                dragDropHandler.showIncorrectEffect();
                showFeedback(
                    result.feedback.message,
                    'error',
                    result.feedback.hints ? result.feedback.hints.join('<br>') : ''
                );
            }

            // 진행 상황 업데이트
            updateProgress();
        } else {
            showError('답안 제출 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('제출 오류:', error);
        hideLoading();
        showError('답안을 제출하는 중 오류가 발생했습니다.');
    }
}

/**
 * 힌트 표시
 */
function showHints() {
    const hints = legoEngine.getHints();

    let hintsHTML = '<div class="hints-list">';
    hints.forEach((hint, index) => {
        hintsHTML += `
            <div class="hint-item">
                <div class="hint-number">힌트 ${index + 1}</div>
                <div class="hint-text">${hint}</div>
            </div>
        `;
    });
    hintsHTML += '</div>';

    elements.hintContent.innerHTML = hintsHTML;
    elements.hintModal.style.display = 'flex';
}

/**
 * 피드백 표시
 * @param {string} message - 메시지
 * @param {string} type - 타입 (success/error)
 * @param {string} details - 상세 내용
 */
function showFeedback(message, type, details = '') {
    elements.feedbackSection.className = `feedback-section ${type}`;
    elements.feedbackContent.innerHTML = `
        <div class="feedback-message"><strong>${message}</strong></div>
        ${details ? `<div class="feedback-details">${details}</div>` : ''}
    `;
    elements.feedbackSection.style.display = 'block';

    // 자동으로 숨기기 (오류가 아닌 경우)
    if (type !== 'error') {
        setTimeout(() => {
            hideFeedback();
        }, 5000);
    }
}

/**
 * 피드백 숨기기
 */
function hideFeedback() {
    elements.feedbackSection.style.display = 'none';
}

/**
 * 에러 표시
 * @param {string} message - 에러 메시지
 */
function showError(message) {
    showFeedback(message, 'error');
}

/**
 * 로딩 표시
 */
function showLoading() {
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '⏳ 처리 중...';
}

/**
 * 로딩 숨기기
 */
function hideLoading() {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = '✅ 제출';
}

/**
 * 진행 상황 업데이트
 */
function updateProgress() {
    const percentage = appState.totalAttempts > 0
        ? Math.round((appState.correctAnswers / appState.totalAttempts) * 100)
        : 0;

    elements.progressFill.style.width = `${percentage}%`;
    elements.correctCount.textContent = `정답: ${appState.correctAnswers}`;
    elements.totalCount.textContent = `시도: ${appState.totalAttempts}`;

    // 로컬 스토리지에 저장
    saveProgress();
}

/**
 * 진행 상황 로드
 */
function loadProgress() {
    const savedProgress = localStorage.getItem('factorLegoProgress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            appState.correctAnswers = progress.correctAnswers || 0;
            appState.totalAttempts = progress.totalAttempts || 0;
            updateProgress();
        } catch (error) {
            console.error('진행 상황 로드 오류:', error);
        }
    }
}

/**
 * 진행 상황 저장
 */
function saveProgress() {
    const progress = {
        correctAnswers: appState.correctAnswers,
        totalAttempts: appState.totalAttempts,
        lastUpdate: Date.now()
    };
    localStorage.setItem('factorLegoProgress', JSON.stringify(progress));
}

/**
 * 다음 문제 로드
 */
async function loadNextProblem() {
    appState.currentProblemId++;
    dragDropHandler.clearWorkspace();
    dragDropHandler.resetInteractionsCount();
    hideFeedback();
    appState.startTime = Date.now();

    try {
        await loadProblem(appState.currentProblemId);
    } catch (error) {
        showError('다음 문제를 불러올 수 없습니다.');
        appState.currentProblemId--; // 롤백
    }
}

/**
 * 스마트폰 최소화/최대화
 */
function toggleSmartphone() {
    appState.isMinimized = !appState.isMinimized;

    if (appState.isMinimized) {
        elements.smartphoneContainer.classList.add('minimized');
        elements.toggleBtn.textContent = '📱';
    } else {
        elements.smartphoneContainer.classList.remove('minimized');
        elements.toggleBtn.textContent = '📱';
    }
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 페이지 언로드 시 진행 상황 저장
window.addEventListener('beforeunload', () => {
    saveProgress();
});
