/**
 * 미스터리 힌트 카드 앱 - 메인 로직
 */

let cardManager = null;

/**
 * 앱 초기화
 */
async function initApp() {
    try {
        // 힌트 데이터 로드
        const response = await fetch('data/hints.json');
        const hintsData = await response.json();

        // 카드 매니저 초기화
        cardManager = new MysteryCardManager(hintsData);

        // UI 렌더링
        renderCards();
        updateProgress();

        // 이벤트 리스너 등록
        setupEventListeners();

        console.log('미스터리 힌트 카드 앱이 초기화되었습니다.');
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        showError('앱을 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 카드 렌더링
 */
function renderCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    const cards = cardManager.getAllCards();

    cards.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
}

/**
 * 카드 엘리먼트 생성
 */
function createCardElement(card) {
    const isUnlocked = card.unlocked;
    const canUnlock = cardManager.canUnlock(card.id);

    const cardDiv = document.createElement('div');
    cardDiv.className = `mystery-card ${isUnlocked ? 'flipped' : ''} ${canUnlock ? 'unlocked' : 'locked'}`;
    cardDiv.dataset.cardId = card.id;

    cardDiv.innerHTML = `
        <div class="card-inner">
            <!-- 카드 뒷면 (미개봉) -->
            <div class="card-face card-back">
                <div class="card-number">#${card.id}</div>
                <div class="card-label">미스터리 카드</div>
                <div class="lock-icon">${isUnlocked ? '✨' : '🔒'}</div>
            </div>

            <!-- 카드 앞면 (개봉) -->
            <div class="card-face card-front">
                <div class="hint-title">${card.title}</div>
                <div class="hint-shape">${card.shape}</div>
                <div class="hint-text">${card.text}</div>
            </div>
        </div>
    `;

    // 클릭 이벤트
    if (!isUnlocked && canUnlock) {
        cardDiv.addEventListener('click', () => handleCardClick(card.id));
    }

    return cardDiv;
}

/**
 * 카드 클릭 처리
 */
function handleCardClick(cardId) {
    if (cardManager.unlockCard(cardId)) {
        // 카드 개봉 애니메이션
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        cardElement.classList.add('flipped');

        // 효과음 (옵션)
        playUnlockSound();

        // 진행 상황 업데이트
        setTimeout(() => {
            updateProgress();
            renderCards(); // 다음 카드 활성화를 위해 재렌더링
        }, 300);

        // 모든 카드 개봉 시 축하 메시지
        const progress = cardManager.getProgress();
        if (progress.current === progress.total) {
            setTimeout(() => {
                showCongratulations();
            }, 1000);
        }
    }
}

/**
 * 진행 상황 업데이트
 */
function updateProgress() {
    const progress = cardManager.getProgress();

    // 프로그레스 바
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${progress.percentage}%`;

    // 프로그레스 텍스트
    const progressText = document.getElementById('progressText');
    progressText.textContent = `${progress.current} / ${progress.total} 카드 개봉`;
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 리셋 버튼
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', handleReset);
}

/**
 * 리셋 처리
 */
function handleReset() {
    if (confirm('모든 카드를 다시 잠글까요?')) {
        cardManager.reset();
        renderCards();
        updateProgress();
    }
}

/**
 * 개봉 효과음 재생 (옵션)
 */
function playUnlockSound() {
    // Web Audio API를 사용한 간단한 효과음
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // 오디오 재생 실패 시 무시
        console.log('효과음 재생 불가');
    }
}

/**
 * 축하 메시지 표시
 */
function showCongratulations() {
    // 간단한 축하 알림
    const message = '🎉 축하합니다!\n\n모든 힌트 카드를 개봉했습니다!\n이제 문제를 풀어보세요! 💪';

    // 커스텀 알림 (더 예쁘게 만들 수 있음)
    if (confirm(message)) {
        // 문제 섹션으로 스크롤 (모바일이 아닌 경우)
        if (window.innerWidth > 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #e74c3c;">
            <div style="font-size: 3rem;">⚠️</div>
            <div style="margin-top: 20px; font-size: 1rem;">${message}</div>
        </div>
    `;
}

/**
 * Moodle/LMS 연동을 위한 API 함수들
 */
const MoodleAPI = {
    /**
     * 문제 정보 가져오기
     */
    async getProblemData(problemId) {
        // TODO: Moodle API 연동
        // 예: /api/problems/{problemId}
        try {
            const response = await fetch(`/api/problems/${problemId}`);
            return await response.json();
        } catch (error) {
            console.error('문제 데이터 로드 실패:', error);
            return null;
        }
    },

    /**
     * 학생 진행 상황 저장
     */
    async saveProgress(studentId, problemId, progressData) {
        // TODO: Moodle API 연동
        // 예: POST /api/progress
        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    problemId,
                    progressData
                })
            });
            return await response.json();
        } catch (error) {
            console.error('진행 상황 저장 실패:', error);
            return null;
        }
    },

    /**
     * 힌트 사용 기록
     */
    async logHintUsage(studentId, problemId, hintId) {
        // TODO: Moodle API 연동
        try {
            const response = await fetch('/api/hints/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    problemId,
                    hintId,
                    timestamp: new Date().toISOString()
                })
            });
            return await response.json();
        } catch (error) {
            console.error('힌트 사용 기록 실패:', error);
            return null;
        }
    }
};

/**
 * URL 파라미터에서 설정 가져오기
 */
function getConfigFromURL() {
    const params = new URLSearchParams(window.location.search);

    return {
        problemId: params.get('problemId') || 'fraction-addition-001',
        studentId: params.get('studentId') || null,
        mode: params.get('mode') || 'standalone' // 'standalone' | 'moodle'
    };
}

/**
 * 앱 시작
 */
document.addEventListener('DOMContentLoaded', () => {
    const config = getConfigFromURL();
    console.log('앱 설정:', config);

    initApp();
});

// 전역 함수로 내보내기 (디버깅용)
window.MysteryCardApp = {
    cardManager,
    MoodleAPI,
    renderCards,
    updateProgress
};
