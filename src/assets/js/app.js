/**
 * ALT42 Area Learning App
 * 메인 애플리케이션 로직
 */

class AreaLearningApp {
    constructor() {
        this.currentQuestion = null;
        this.currentResponseId = null;
        this.areaDetector = null;
        this.userId = this.getUserId();

        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        this.setupEventListeners();
        this.updateStatusTime();
        await this.loadQuestion();
    }

    /**
     * 사용자 ID 가져오기 (Moodle 세션에서)
     */
    getUserId() {
        // URL 파라미터에서 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user_id');

        if (userId) {
            sessionStorage.setItem('user_id', userId);
            return userId;
        }

        // 세션 스토리지에서 가져오기
        return sessionStorage.getItem('user_id') || 1; // 기본값 1 (테스트용)
    }

    /**
     * 문제 로드
     */
    async loadQuestion() {
        try {
            // URL 파라미터에서 문제 ID 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            const questionId = urlParams.get('question_id') || 1; // 기본값 1 (테스트용)

            const response = await fetch(`../api/questions.php?action=get&id=${questionId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            this.currentQuestion = result.data;
            this.displayQuestion();
            this.initializeDrawing();

        } catch (err) {
            console.error('Failed to load question:', err);
            this.showError('문제를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 문제 표시
     */
    displayQuestion() {
        const questionDataEl = document.getElementById('questionData');
        const data = this.currentQuestion.data;

        let html = '';

        switch (this.currentQuestion.type) {
            case 'area_rectangle':
                html = `
                    <p>다음 직사각형의 넓이를 구하세요.</p>
                    <p><strong>가로:</strong> ${data.width} ${data.unit}</p>
                    <p><strong>세로:</strong> ${data.height} ${data.unit}</p>
                `;
                break;

            case 'area_triangle':
                html = `
                    <p>다음 삼각형의 넓이를 구하세요.</p>
                    <p><strong>밑변:</strong> ${data.base} ${data.unit}</p>
                    <p><strong>높이:</strong> ${data.height} ${data.unit}</p>
                `;
                break;

            case 'area_circle':
                html = `
                    <p>다음 원의 넓이를 구하세요.</p>
                    <p><strong>반지름:</strong> ${data.radius} ${data.unit}</p>
                `;
                break;

            default:
                html = '<p>알 수 없는 문제 유형입니다.</p>';
        }

        questionDataEl.innerHTML = html;
    }

    /**
     * 그리기 초기화
     */
    initializeDrawing() {
        const canvas = document.getElementById('drawingCanvas');

        this.areaDetector = new AreaDetector({
            canvas: canvas,
            questionData: this.currentQuestion.data,
            responseId: this.currentResponseId,
            completionThreshold: 95,
            onComplete: this.onAreaComplete.bind(this)
        });

        // 진행률 업데이트 (매 0.5초마다)
        setInterval(() => {
            this.updateProgress();
        }, 500);
    }

    /**
     * 진행률 업데이트
     */
    updateProgress() {
        if (!this.areaDetector) return;

        const progress = this.areaDetector.getProgress();
        const progressIndicator = document.getElementById('progressIndicator');

        progressIndicator.textContent = `${Math.round(progress)}%`;

        if (progress >= 95) {
            progressIndicator.style.color = '#4CAF50';
        } else if (progress >= 50) {
            progressIndicator.style.color = '#FF9800';
        } else {
            progressIndicator.style.color = '#667eea';
        }
    }

    /**
     * 넓이 완성 콜백
     */
    async onAreaComplete(data) {
        console.log('Area completed:', data);

        // 완성 오버레이 표시
        const overlay = document.getElementById('completionOverlay');
        overlay.classList.add('show');

        // 캔버스에 완성 스타일 적용
        const canvas = document.getElementById('drawingCanvas');
        canvas.classList.add('completed');

        // 3초 후 오버레이 숨기기
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 3000);

        // 응답 생성 (아직 없으면)
        if (!this.currentResponseId) {
            await this.createResponse(data.area);
        }
    }

    /**
     * 응답 생성
     */
    async createResponse(answer) {
        try {
            const response = await fetch('../api/responses.php?action=submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    question_id: this.currentQuestion.id,
                    answer: answer
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentResponseId = result.data.response_id;
                console.log('Response created:', this.currentResponseId);
            }

        } catch (err) {
            console.error('Failed to create response:', err);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 리셋 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetDrawing();
        });

        // 제출 버튼
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitAnswer();
        });

        // 볼륨 슬라이더
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            window.areaChime.setVolume(volume);

            // 종소리 상태 업데이트
            const chimeStatus = document.getElementById('chimeStatus');
            if (volume === 0) {
                chimeStatus.textContent = '꺼짐';
                chimeStatus.classList.add('disabled');
            } else {
                chimeStatus.textContent = '활성화';
                chimeStatus.classList.remove('disabled');
            }
        });

        // 종소리 상태 클릭 (테스트 재생)
        document.getElementById('chimeStatus').addEventListener('click', () => {
            window.areaChime.play();
        });
    }

    /**
     * 그리기 리셋
     */
    resetDrawing() {
        if (this.areaDetector) {
            this.areaDetector.reset();

            // 캔버스 완성 스타일 제거
            const canvas = document.getElementById('drawingCanvas');
            canvas.classList.remove('completed');

            // 진행률 초기화
            const progressIndicator = document.getElementById('progressIndicator');
            progressIndicator.textContent = '0%';
            progressIndicator.style.color = '#667eea';
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (!this.areaDetector) return;

        const currentArea = this.areaDetector.calculateCurrentArea();

        if (currentArea === 0) {
            alert('먼저 도형을 그려주세요.');
            return;
        }

        try {
            // 응답 생성 (아직 없으면)
            if (!this.currentResponseId) {
                await this.createResponse(currentArea);
            }

            // 완성 여부 확인
            const isCompleted = this.areaDetector.getProgress() >= 95;

            if (isCompleted) {
                alert('정답입니다! 🎉');
            } else {
                const percentage = Math.round(this.areaDetector.getProgress());
                alert(`아직 ${percentage}% 완성되었습니다. 조금 더 그려보세요!`);
            }

        } catch (err) {
            console.error('Failed to submit answer:', err);
            alert('답안 제출에 실패했습니다.');
        }
    }

    /**
     * 상태바 시간 업데이트
     */
    updateStatusTime() {
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('statusTime').textContent = `${hours}:${minutes}`;
        };

        updateTime();
        setInterval(updateTime, 60000); // 1분마다 업데이트
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new AreaLearningApp();
    window.areaApp = app;

    console.log('🚀 ALT42 Area Learning App initialized!');
});
