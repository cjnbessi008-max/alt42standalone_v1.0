/**
 * Graph Chime - Main Application
 */

// 앱 상태
const appState = {
    currentProblem: null,
    sessionId: null,
    apiBaseUrl: '../backend/api.php' // 실제 배포시 수정 필요
};

// DOM 요소
const elements = {
    // 입력
    moodleQuestionId: document.getElementById('moodleQuestionId'),
    studentId: document.getElementById('studentId'),
    loadProblemBtn: document.getElementById('loadProblemBtn'),

    // 문제 정보
    problemTitle: document.getElementById('problemTitle'),
    problemDescription: document.getElementById('problemDescription'),
    equationText: document.getElementById('equationText'),
    yInterceptValue: document.getElementById('yInterceptValue'),
    xInterceptValue: document.getElementById('xInterceptValue'),

    // 음향 버튼
    playYInterceptBtn: document.getElementById('playYInterceptBtn'),
    playXInterceptBtn: document.getElementById('playXInterceptBtn'),
    playBothBtn: document.getElementById('playBothBtn'),

    // 스마트폰 화면
    currentNote: document.getElementById('currentNote'),
    visualizer: document.querySelector('.audio-visualizer'),
    graphCanvas: document.getElementById('graphCanvas')
};

// 그래프 렌더러 초기화
const graphRenderer = new GraphRenderer('graphCanvas');

/**
 * 초기화
 */
function init() {
    // 세션 ID 생성
    appState.sessionId = generateSessionId();

    // 이벤트 리스너 등록
    elements.loadProblemBtn.addEventListener('click', loadProblem);
    elements.playYInterceptBtn.addEventListener('click', () => playIntercept('y'));
    elements.playXInterceptBtn.addEventListener('click', () => playIntercept('x'));
    elements.playBothBtn.addEventListener('click', playBothIntercepts);

    // 초기 그래프 그리기
    graphRenderer.render(null);

    console.log('Graph Chime initialized. Session ID:', appState.sessionId);
}

/**
 * 세션 ID 생성
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 문제 불러오기
 */
async function loadProblem() {
    const moodleQuestionId = elements.moodleQuestionId.value;

    if (!moodleQuestionId) {
        alert('Moodle 문제 ID를 입력하세요.');
        return;
    }

    elements.loadProblemBtn.disabled = true;
    elements.loadProblemBtn.textContent = '불러오는 중...';

    try {
        const response = await fetch(
            `${appState.apiBaseUrl}/problem?moodle_question_id=${moodleQuestionId}`
        );

        const result = await response.json();

        if (result.success && result.data) {
            appState.currentProblem = result.data;
            displayProblem(result.data);
            graphRenderer.render(result.data);

            // 로그 기록
            await logAction('load_problem', {
                problem_id: result.data.id,
                equation: result.data.equation
            });

            console.log('Problem loaded:', result.data);
        } else {
            throw new Error(result.error || '문제를 불러오지 못했습니다.');
        }
    } catch (error) {
        console.error('Error loading problem:', error);
        alert('문제를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
        elements.loadProblemBtn.disabled = false;
        elements.loadProblemBtn.textContent = '문제 불러오기';
    }
}

/**
 * 문제 정보 표시
 */
function displayProblem(problem) {
    elements.problemTitle.textContent = problem.title || '일차함수 그래프';
    elements.problemDescription.textContent = problem.description || '';
    elements.equationText.textContent = problem.equation;

    const yIntercept = parseFloat(problem.y_intercept);
    const xIntercept = problem.x_intercept ? parseFloat(problem.x_intercept) : null;

    elements.yInterceptValue.textContent = yIntercept.toFixed(2);
    elements.xInterceptValue.textContent = xIntercept ? xIntercept.toFixed(2) : 'N/A';

    // 버튼 활성화
    elements.playYInterceptBtn.disabled = false;
    elements.playXInterceptBtn.disabled = xIntercept === null;
    elements.playBothBtn.disabled = xIntercept === null;
}

/**
 * 절편 음향 재생
 */
async function playIntercept(type) {
    if (!appState.currentProblem) {
        alert('먼저 문제를 불러오세요.');
        return;
    }

    const value = type === 'y'
        ? parseFloat(appState.currentProblem.y_intercept)
        : parseFloat(appState.currentProblem.x_intercept);

    const interceptType = type === 'y' ? 'y_intercept' : 'x_intercept';

    try {
        // Audio Context 초기화 (사용자 제스처)
        audioEngine.init();

        // 절편 값에 해당하는 음계 정보 가져오기
        const noteData = audioEngine.interceptToNote(value, interceptType);

        // 시각화 활성화
        showVisualizer(noteData.noteName);

        // 음향 재생
        await audioEngine.playTone(
            noteData.frequency,
            800, // 800ms
            noteData.waveType
        );

        // 시각화 비활성화
        hideVisualizer();

        // 로그 기록
        await logAction('play_sound', {
            problem_id: appState.currentProblem.id,
            intercept_type: interceptType,
            intercept_value: value,
            frequency: noteData.frequency,
            note: noteData.noteName
        });

    } catch (error) {
        console.error('Error playing sound:', error);
        alert('음향 재생 중 오류가 발생했습니다.');
    }
}

/**
 * 두 절편 음향 동시 재생
 */
async function playBothIntercepts() {
    if (!appState.currentProblem) {
        alert('먼저 문제를 불러오세요.');
        return;
    }

    const yValue = parseFloat(appState.currentProblem.y_intercept);
    const xValue = parseFloat(appState.currentProblem.x_intercept);

    try {
        audioEngine.init();

        // 두 음계 정보 가져오기
        const yNote = audioEngine.interceptToNote(yValue, 'y_intercept');
        const xNote = audioEngine.interceptToNote(xValue, 'x_intercept');

        // 시각화
        showVisualizer(`${yNote.noteName} + ${xNote.noteName}`);

        // 화음 재생
        await audioEngine.playChord(
            [yNote.frequency, xNote.frequency],
            1000,
            'sine'
        );

        hideVisualizer();

        // 로그 기록
        await logAction('play_chord', {
            problem_id: appState.currentProblem.id,
            y_intercept: yValue,
            x_intercept: xValue,
            y_note: yNote.noteName,
            x_note: xNote.noteName
        });

    } catch (error) {
        console.error('Error playing chord:', error);
        alert('음향 재생 중 오류가 발생했습니다.');
    }
}

/**
 * 시각화 표시
 */
function showVisualizer(noteName) {
    elements.currentNote.textContent = `♪ ${noteName}`;
    elements.visualizer.classList.add('active');
}

/**
 * 시각화 숨기기
 */
function hideVisualizer() {
    setTimeout(() => {
        elements.visualizer.classList.remove('active');
        elements.currentNote.textContent = '♪ -';
    }, 200);
}

/**
 * 액션 로그 기록
 */
async function logAction(actionType, actionData) {
    try {
        const response = await fetch(`${appState.apiBaseUrl}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: appState.sessionId,
                student_id: parseInt(elements.studentId.value) || 1,
                problem_id: appState.currentProblem?.id || null,
                action_type: actionType,
                action_data: actionData
            })
        });

        const result = await response.json();

        if (!result.success) {
            console.warn('Failed to log action:', result.error);
        }
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

/**
 * 응답 제출
 */
async function submitResponse(responseData) {
    if (!appState.currentProblem) {
        return;
    }

    try {
        const response = await fetch(`${appState.apiBaseUrl}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problem_id: appState.currentProblem.id,
                student_id: parseInt(elements.studentId.value) || 1,
                session_id: appState.sessionId,
                response_type: 'graph_interaction',
                response_data: responseData,
                is_correct: 1,
                score: 100,
                time_spent: 0,
                sound_played: 1
            })
        });

        const result = await response.json();
        console.log('Response submitted:', result);

    } catch (error) {
        console.error('Error submitting response:', error);
    }
}

// 페이지 로드시 초기화
window.addEventListener('DOMContentLoaded', init);

// 페이지 떠날 때 세션 종료 로그
window.addEventListener('beforeunload', () => {
    logAction('session_end', {
        duration: Date.now() - parseInt(appState.sessionId.split('_')[1])
    });
});
