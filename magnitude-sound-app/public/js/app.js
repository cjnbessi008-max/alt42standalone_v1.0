/**
 * Magnitude Sound - 메인 애플리케이션
 * 모든 모듈을 통합하고 이벤트 처리
 */

// 전역 인스턴스
let vectorInput;
let soundEngine;
let moodleAPI;

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('🚀 Initializing Magnitude Sound App...');

    // 1. 벡터 입력 인스턴스 생성
    vectorInput = new VectorInput('vector-canvas');
    console.log('✅ Vector Input initialized');

    // 2. 사운드 엔진 인스턴스 생성
    soundEngine = new SoundEngine();
    console.log('✅ Sound Engine created (not yet initialized)');

    // 3. Moodle API 인스턴스 생성
    moodleAPI = new MoodleAPI('../api');
    console.log('✅ Moodle API initialized');

    // 4. URL 파라미터에서 설정 로드
    moodleAPI.loadFromURLParams();

    // 5. 이벤트 리스너 설정
    setupEventListeners();

    // 6. 시간 표시 시작
    updateTime();
    setInterval(updateTime, 1000);

    // 7. 오디오 초기화 오버레이 표시
    showAudioInitOverlay();

    console.log('✅ App initialization complete');
}

/**
 * 오디오 초기화 오버레이 표시
 */
function showAudioInitOverlay() {
    const overlay = document.getElementById('audio-init-overlay');
    const initBtn = document.getElementById('audio-init-btn');

    if (overlay && initBtn) {
        initBtn.addEventListener('click', async () => {
            const success = await soundEngine.initialize();
            if (success) {
                overlay.classList.add('hidden');
                console.log('✅ Audio initialized by user gesture');

                // 테스트 사운드 재생 (선택)
                // playTestSound();
            } else {
                alert('오디오 초기화에 실패했습니다. 브라우저를 확인해주세요.');
            }
        });
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 벡터 변경 이벤트
    const canvas = document.getElementById('vector-canvas');
    if (canvas) {
        canvas.addEventListener('vectorChange', (event) => {
            const vector = event.detail;
            console.log('📐 Vector changed:', vector);

            // 실시간 사운드 파라미터 UI 업데이트
            if (soundEngine && vector.magnitude > 0) {
                const params = soundEngine.vectorToSoundParams(vector);
                soundEngine.params = params;
                soundEngine.updateSoundUI();
            }
        });
    }

    // 소리 재생 버튼
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            await handleSubmit();
        });
    }

    // 초기화 버튼
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            handleReset();
        });
    }

    // 키보드 단축키
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.repeat) {
            handleSubmit();
        } else if (event.key === 'Escape') {
            handleReset();
        } else if (event.key === ' ') {
            event.preventDefault();
            soundEngine.stopSound();
        }
    });
}

/**
 * 제출 처리
 */
async function handleSubmit() {
    const vector = vectorInput.getVector();

    if (!vector || vector.magnitude === 0) {
        alert('벡터를 먼저 입력해주세요!');
        return;
    }

    // 오디오가 초기화되지 않았으면 초기화
    if (!soundEngine.isReady()) {
        const success = await soundEngine.initialize();
        if (!success) {
            alert('오디오 시스템을 초기화할 수 없습니다.');
            return;
        }
        // 오버레이 숨기기
        const overlay = document.getElementById('audio-init-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // 버튼 비활성화
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🎵 재생 중...';
    }

    try {
        // 1. 소리 재생
        await soundEngine.playSound(vector);
        console.log('🎵 Sound played successfully');

        // 2. Moodle에 답안 제출 (userId가 있을 때만)
        if (moodleAPI.userId) {
            const currentQuestion = moodleAPI.getCurrentQuestion();
            if (currentQuestion && currentQuestion.id) {
                const result = await moodleAPI.submitAnswer(
                    currentQuestion.id,
                    moodleAPI.userId,
                    vector,
                    moodleAPI.attemptId
                );

                console.log('✅ Answer submitted to Moodle:', result);

                // 결과 표시 (선택)
                showSubmissionResult(result);
            }
        }

        // 재생 완료 후 버튼 활성화
        const duration = soundEngine.getParams().duration * 1000;
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '✨ 소리 재생하기';
            }
        }, duration);

    } catch (error) {
        console.error('❌ Submission error:', error);
        alert('오류가 발생했습니다: ' + error.message);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✨ 소리 재생하기';
        }
    }
}

/**
 * 초기화 처리
 */
function handleReset() {
    // 벡터 입력 초기화
    vectorInput.reset();

    // 소리 중지
    soundEngine.stopSound();

    // UI 초기화
    const magnitudeEl = document.getElementById('magnitude-value');
    const directionEl = document.getElementById('direction-value');
    const coordinatesEl = document.getElementById('coordinates-value');

    if (magnitudeEl) magnitudeEl.textContent = '0.00';
    if (directionEl) directionEl.textContent = '0°';
    if (coordinatesEl) coordinatesEl.textContent = '(0, 0)';

    // 사운드 UI 초기화
    const volumeBar = document.getElementById('volume-bar');
    const frequencyBar = document.getElementById('frequency-bar');
    const frequencyValue = document.getElementById('frequency-value');
    const waveformValue = document.getElementById('waveform-value');

    if (volumeBar) volumeBar.style.width = '0%';
    if (frequencyBar) frequencyBar.style.width = '0%';
    if (frequencyValue) frequencyValue.textContent = '220 Hz';
    if (waveformValue) {
        waveformValue.textContent = 'sine';
        waveformValue.style.background = '#6366f1';
    }

    console.log('🔄 App reset');
}

/**
 * 제출 결과 표시
 */
function showSubmissionResult(result) {
    // 간단한 알림 (실제로는 더 세련된 UI 사용 가능)
    const message = `
✅ 답안이 제출되었습니다!

📐 벡터: (${result.vector.x}, ${result.vector.y})
📏 크기: ${result.calculated.magnitude}
🧭 방향: ${result.calculated.direction_degrees}°

🎵 사운드 파라미터:
   - 음량: ${(result.sound_params.volume * 100).toFixed(0)}%
   - 주파수: ${result.sound_params.frequency} Hz
   - 파형: ${result.sound_params.waveform}
   - 패닝: ${result.sound_params.pan}
    `;

    console.log(message);

    // 선택: 토스트 알림이나 모달로 표시
    // alert(message);
}

/**
 * 시간 업데이트
 */
function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    }
}

/**
 * 테스트 사운드 재생
 */
function playTestSound() {
    const testVector = {
        x: 5,
        y: 5,
        magnitude: 7.07,
        direction: 45
    };

    soundEngine.playSound(testVector);
    console.log('🎵 Test sound played');
}

/**
 * 데모 모드 (URL 파라미터 없을 때)
 */
function setupDemoMode() {
    // 데모 문제 표시
    const problemTextEl = document.getElementById('problem-text');
    if (problemTextEl) {
        problemTextEl.innerHTML = `
            <strong>데모 문제:</strong><br>
            벡터 <strong>v</strong>를 입력하고 크기와 방향을 소리로 확인하세요.<br><br>
            - 크기가 클수록 소리가 커지고 주파수가 높아집니다.<br>
            - 방향에 따라 파형과 스테레오 위치가 바뀝니다.<br><br>
            <em>힌트: 다양한 벡터를 시도해보세요! 🎵</em>
        `;
    }

    // 데모 사용자 ID 설정
    moodleAPI.setUserId(1);
}

// DOM이 로드되면 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 데모 모드 설정 (URL 파라미터가 없으면)
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('question_id') && !params.has('quiz_id')) {
        setupDemoMode();
    }
});

// 전역 함수로 내보내기 (디버깅용)
window.app = {
    vectorInput,
    soundEngine,
    moodleAPI,
    reset: handleReset,
    playTest: playTestSound
};
