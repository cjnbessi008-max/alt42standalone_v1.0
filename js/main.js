/**
 * 메인 애플리케이션 로직
 * UI 이벤트 처리 및 3D 뷰어, Moodle API 통합
 */

// 전역 변수
let viewer3D = null;
let moodleAPI = null;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing 3D Cross-Section Viewer...');

    // 3D 뷰어 초기화
    try {
        viewer3D = new Viewer3D('viewerContainer');
        console.log('3D Viewer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize 3D Viewer:', error);
        alert('3D 뷰어 초기화에 실패했습니다: ' + error.message);
        return;
    }

    // Moodle API 초기화
    initializeMoodleAPI();

    // UI 이벤트 리스너 설정
    setupEventListeners();

    console.log('Application initialized successfully');
});

/**
 * Moodle API 초기화
 */
function initializeMoodleAPI() {
    const config = loadMoodleConfig();

    moodleAPI = new MoodleAPI({
        baseUrl: config.baseUrl,
        token: config.token,
        onConnectionChange: (isConnected, data) => {
            updateConnectionStatus(isConnected);
            if (isConnected) {
                console.log('Connected to Moodle:', data);
            }
        },
        onDataReceived: (data) => {
            console.log('Quiz data received:', data);
            applyQuizDataToViewer(data);
        },
        onError: (error) => {
            console.error('Moodle API Error:', error);
            showError('Moodle 연결 오류: ' + error.message);
        }
    });

    updateConnectionStatus(moodleAPI.getConnectionStatus());
}

/**
 * UI 이벤트 리스너 설정
 */
function setupEventListeners() {
    // Cross-Section 활성화/비활성화
    const enableCrossSection = document.getElementById('enableCrossSection');
    enableCrossSection.addEventListener('change', (e) => {
        updateViewerFromUI();
    });

    // Clip Position
    const clipPosition = document.getElementById('clipPosition');
    const clipPositionValue = document.getElementById('clipPositionValue');
    clipPosition.addEventListener('input', (e) => {
        clipPositionValue.textContent = parseFloat(e.target.value).toFixed(1);
        updateViewerFromUI();
    });

    // Clip Rotation X
    const clipRotationX = document.getElementById('clipRotationX');
    const clipRotationXValue = document.getElementById('clipRotationXValue');
    clipRotationX.addEventListener('input', (e) => {
        clipRotationXValue.textContent = e.target.value + '°';
        updateViewerFromUI();
    });

    // Clip Rotation Y
    const clipRotationY = document.getElementById('clipRotationY');
    const clipRotationYValue = document.getElementById('clipRotationYValue');
    clipRotationY.addEventListener('input', (e) => {
        clipRotationYValue.textContent = e.target.value + '°';
        updateViewerFromUI();
    });

    // Glow Intensity
    const glowIntensity = document.getElementById('glowIntensity');
    const glowIntensityValue = document.getElementById('glowIntensityValue');
    glowIntensity.addEventListener('input', (e) => {
        glowIntensityValue.textContent = parseFloat(e.target.value).toFixed(1);
        updateViewerFromUI();
    });

    // Glow Color
    const glowColor = document.getElementById('glowColor');
    glowColor.addEventListener('input', (e) => {
        updateViewerFromUI();
    });

    // Glow Thickness
    const glowThickness = document.getElementById('glowThickness');
    const glowThicknessValue = document.getElementById('glowThicknessValue');
    glowThickness.addEventListener('input', (e) => {
        glowThicknessValue.textContent = parseFloat(e.target.value).toFixed(2);
        updateViewerFromUI();
    });

    // Model Selection
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.addEventListener('change', (e) => {
        viewer3D.loadModel(e.target.value);
    });

    // Reset View
    const resetViewBtn = document.getElementById('resetView');
    resetViewBtn.addEventListener('click', () => {
        viewer3D.resetView();
    });

    // Load from Moodle
    const loadFromMoodleBtn = document.getElementById('loadFromMoodle');
    loadFromMoodleBtn.addEventListener('click', () => {
        loadFromMoodle();
    });
}

/**
 * UI 값을 읽어 뷰어 업데이트
 */
function updateViewerFromUI() {
    if (!viewer3D) return;

    // Cross-Section 설정
    const enabled = document.getElementById('enableCrossSection').checked;
    const position = parseFloat(document.getElementById('clipPosition').value);
    const rotationX = parseFloat(document.getElementById('clipRotationX').value);
    const rotationY = parseFloat(document.getElementById('clipRotationY').value);

    viewer3D.updateCrossSection(position, rotationX, rotationY, enabled);

    // Glow 설정
    const intensity = parseFloat(document.getElementById('glowIntensity').value);
    const color = document.getElementById('glowColor').value;
    const thickness = parseFloat(document.getElementById('glowThickness').value);

    viewer3D.updateGlowSettings(intensity, color, thickness);
}

/**
 * Moodle에서 데이터 로드
 */
async function loadFromMoodle() {
    if (!moodleAPI) {
        showError('Moodle API가 초기화되지 않았습니다.');
        return;
    }

    // 데모 모드: Mock 데이터 사용
    try {
        console.log('Loading quiz data from Moodle...');

        // 실제 환경에서는 퀴즈 ID를 URL 파라미터나 사용자 입력으로 받아야 함
        const quizId = new URLSearchParams(window.location.search).get('quizId') || 'quiz1';

        // Mock 데이터 로드 (데모용)
        const data = await getMockQuizData(quizId);

        console.log('Quiz data loaded:', data);
        applyQuizDataToViewer(data);

        showSuccess('Moodle에서 문제 데이터를 불러왔습니다.');
    } catch (error) {
        console.error('Failed to load quiz data:', error);
        showError('문제 데이터 로드 실패: ' + error.message);
    }

    // 실제 Moodle 연동 코드 (주석 처리)
    /*
    if (!moodleAPI.getConnectionStatus()) {
        // 연결되지 않은 경우 연결 시도
        const url = prompt('Moodle URL을 입력하세요:');
        const token = prompt('Web Service Token을 입력하세요:');

        if (url && token) {
            const result = await moodleAPI.connect(url, token);
            if (!result.success) {
                showError('Moodle 연결 실패: ' + result.error);
                return;
            }
            saveMoodleConfig({ baseUrl: url, token: token });
        } else {
            return;
        }
    }

    // 퀴즈 ID 입력
    const quizId = prompt('퀴즈 ID를 입력하세요:', '1');
    if (!quizId) return;

    try {
        const data = await moodleAPI.getQuizData(quizId);
        applyQuizDataToViewer(data);
        showSuccess('문제 데이터를 불러왔습니다.');
    } catch (error) {
        showError('문제 데이터 로드 실패: ' + error.message);
    }
    */
}

/**
 * 퀴즈 데이터를 뷰어에 적용
 */
function applyQuizDataToViewer(data) {
    if (!data || !viewer3D) return;

    // 모델 타입 변경
    if (data.modelType) {
        document.getElementById('modelSelect').value = data.modelType;
        viewer3D.loadModel(data.modelType);
    }

    // Cross-Section 설정
    if (data.clipPosition !== undefined) {
        document.getElementById('clipPosition').value = data.clipPosition;
        document.getElementById('clipPositionValue').textContent = data.clipPosition.toFixed(1);
    }

    if (data.clipRotationX !== undefined) {
        document.getElementById('clipRotationX').value = data.clipRotationX;
        document.getElementById('clipRotationXValue').textContent = data.clipRotationX + '°';
    }

    if (data.clipRotationY !== undefined) {
        document.getElementById('clipRotationY').value = data.clipRotationY;
        document.getElementById('clipRotationYValue').textContent = data.clipRotationY + '°';
    }

    // Glow 설정
    if (data.glowColor) {
        document.getElementById('glowColor').value = data.glowColor;
    }

    if (data.glowIntensity !== undefined) {
        document.getElementById('glowIntensity').value = data.glowIntensity;
        document.getElementById('glowIntensityValue').textContent = data.glowIntensity.toFixed(1);
    }

    if (data.glowThickness !== undefined) {
        document.getElementById('glowThickness').value = data.glowThickness;
        document.getElementById('glowThicknessValue').textContent = data.glowThickness.toFixed(2);
    }

    // 뷰어 업데이트
    updateViewerFromUI();
}

/**
 * 연결 상태 UI 업데이트
 */
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('moodleStatus');
    const indicator = statusElement.querySelector('.status-indicator');

    if (isConnected) {
        indicator.classList.remove('disconnected');
        indicator.classList.add('connected');
        statusElement.innerHTML = '<span class="status-indicator connected"></span>Connected';
    } else {
        indicator.classList.remove('connected');
        indicator.classList.add('disconnected');
        statusElement.innerHTML = '<span class="status-indicator disconnected"></span>Disconnected';
    }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    console.error(message);
    // 간단한 알림 (실제로는 더 나은 UI 사용)
    alert('오류: ' + message);
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
    console.log(message);
    // 간단한 알림 (실제로는 더 나은 UI 사용)
    alert('성공: ' + message);
}

/**
 * 페이지 언로드 시 정리
 */
window.addEventListener('beforeunload', () => {
    if (viewer3D) {
        viewer3D.dispose();
    }

    if (moodleAPI) {
        moodleAPI.disconnect();
    }
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // R 키: 뷰 리셋
    if (e.key === 'r' || e.key === 'R') {
        viewer3D.resetView();
    }

    // C 키: Cross-Section 토글
    if (e.key === 'c' || e.key === 'C') {
        const checkbox = document.getElementById('enableCrossSection');
        checkbox.checked = !checkbox.checked;
        updateViewerFromUI();
    }

    // 1-4 키: 모델 변경
    const models = ['cube', 'sphere', 'torus', 'knot'];
    const keyNum = parseInt(e.key);
    if (keyNum >= 1 && keyNum <= 4) {
        const modelType = models[keyNum - 1];
        document.getElementById('modelSelect').value = modelType;
        viewer3D.loadModel(modelType);
    }
});
