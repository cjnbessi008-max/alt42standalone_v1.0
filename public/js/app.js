/**
 * Main Application
 * Extrema Blink 앱의 메인 로직
 */

class ExtremaBlinkApp {
    constructor() {
        this.renderer = null;
        this.currentExtrema = [];
        this.init();
    }

    /**
     * 앱 초기화
     */
    init() {
        // DOM이 로드된 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * 설정 및 이벤트 리스너 등록
     */
    setup() {
        // 렌더러 초기화
        this.renderer = new MathRenderer('graph-container');

        // 버튼 이벤트 리스너
        const plotBtn = document.getElementById('plot-btn');
        const showExtremaBtn = document.getElementById('show-extrema-btn');
        const functionInput = document.getElementById('function-input');

        if (plotBtn) {
            plotBtn.addEventListener('click', () => this.handlePlot());
        }

        if (showExtremaBtn) {
            showExtremaBtn.addEventListener('click', () => this.handleShowExtrema());
        }

        // Enter 키로 그래프 그리기
        if (functionInput) {
            functionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handlePlot();
                }
            });
        }

        // 초기 그래프 표시
        this.handlePlot();

        console.log('Extrema Blink App 초기화 완료');
    }

    /**
     * 그래프 그리기 핸들러
     */
    handlePlot() {
        const functionInput = document.getElementById('function-input');
        const rangeMin = document.getElementById('range-min');
        const rangeMax = document.getElementById('range-max');
        const extremaInfo = document.getElementById('extrema-info');

        if (!functionInput || !rangeMin || !rangeMax) {
            console.error('필수 입력 요소를 찾을 수 없습니다.');
            return;
        }

        const expression = functionInput.value.trim();
        const xMin = parseFloat(rangeMin.value);
        const xMax = parseFloat(rangeMax.value);

        // 유효성 검사
        if (!expression) {
            this.showNotification('함수를 입력해주세요.', 'error');
            return;
        }

        if (xMin >= xMax) {
            this.showNotification('X 범위를 올바르게 입력해주세요.', 'error');
            return;
        }

        // 로딩 상태 표시
        const plotBtn = document.getElementById('plot-btn');
        const originalText = plotBtn.textContent;
        plotBtn.disabled = true;
        plotBtn.innerHTML = '<span class="loading"></span> 그리는 중...';

        // 극값 정보 초기화
        extremaInfo.innerHTML = '<p>함수를 입력하고 "극값 표시" 버튼을 클릭하세요.</p>';
        this.currentExtrema = [];

        setTimeout(() => {
            try {
                // 그래프 그리기
                const success = this.renderer.plotFunction(expression, xMin, xMax);

                if (success) {
                    this.showNotification('그래프가 그려졌습니다.', 'success');
                }
            } catch (error) {
                console.error('그래프 그리기 오류:', error);
                this.showNotification('그래프를 그릴 수 없습니다.', 'error');
            } finally {
                plotBtn.disabled = false;
                plotBtn.textContent = originalText;
            }
        }, 100);
    }

    /**
     * 극값 표시 핸들러
     */
    handleShowExtrema() {
        const functionInput = document.getElementById('function-input');
        const rangeMin = document.getElementById('range-min');
        const rangeMax = document.getElementById('range-max');
        const extremaInfo = document.getElementById('extrema-info');

        if (!functionInput || !rangeMin || !rangeMax) {
            return;
        }

        const expression = functionInput.value.trim();
        const xMin = parseFloat(rangeMin.value);
        const xMax = parseFloat(rangeMax.value);

        if (!expression || !this.renderer.currentFunction) {
            this.showNotification('먼저 그래프를 그려주세요.', 'error');
            return;
        }

        // 로딩 상태
        const showExtremaBtn = document.getElementById('show-extrema-btn');
        const originalText = showExtremaBtn.textContent;
        showExtremaBtn.disabled = true;
        showExtremaBtn.innerHTML = '<span class="loading"></span> 계산 중...';

        extremaInfo.innerHTML = '<div class="loading"></div> 극값을 계산하고 있습니다...';

        setTimeout(() => {
            try {
                // 극값 계산
                this.currentExtrema = extremaCalculator.findExtrema(expression, xMin, xMax);

                if (this.currentExtrema.length === 0) {
                    extremaInfo.innerHTML = '<p>주어진 범위에서 극값을 찾을 수 없습니다.</p>';
                    this.showNotification('극값이 없습니다.', 'info');
                } else {
                    // 극값 정보 표시
                    this.displayExtremaInfo(this.currentExtrema);

                    // 그래프에 극값 표시 및 애니메이션
                    this.renderer.showExtrema(this.currentExtrema);

                    this.showNotification(`${this.currentExtrema.length}개의 극값을 찾았습니다.`, 'success');
                }
            } catch (error) {
                console.error('극값 계산 오류:', error);
                extremaInfo.innerHTML = '<p style="color: #ff4d4f;">극값을 계산할 수 없습니다.</p>';
                this.showNotification('극값 계산 중 오류가 발생했습니다.', 'error');
            } finally {
                showExtremaBtn.disabled = false;
                showExtremaBtn.textContent = originalText;
            }
        }, 100);
    }

    /**
     * 극값 정보를 화면에 표시
     * @param {Array} extrema - 극값 배열
     */
    displayExtremaInfo(extrema) {
        const extremaInfo = document.getElementById('extrema-info');
        if (!extremaInfo) return;

        let html = '<div class="extrema-list">';

        extrema.forEach((point, index) => {
            const icon = point.type === 'maximum' ? '▲' : '▼';
            const className = point.type === 'maximum' ? 'maximum' : 'minimum';

            html += `
                <div class="extrema-point ${className}" data-index="${index}">
                    <strong>${icon} ${point.label}점</strong>
                    <br>
                    좌표: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})
                </div>
            `;
        });

        html += '</div>';
        extremaInfo.innerHTML = html;

        // 클릭 이벤트 추가 (해당 극값 강조)
        const extremaPoints = extremaInfo.querySelectorAll('.extrema-point');
        extremaPoints.forEach((elem, index) => {
            elem.style.cursor = 'pointer';
            elem.addEventListener('click', () => {
                extremaAnimator.highlightExtrema(index);
            });
        });
    }

    /**
     * 알림 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, error, info)
     */
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // 스타일
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease-out;
        `;

        // 타입별 색상
        const colors = {
            success: { bg: '#52c41a', color: 'white' },
            error: { bg: '#ff4d4f', color: 'white' },
            info: { bg: '#1890ff', color: 'white' }
        };

        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.color = color.color;

        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Moodle LMS에서 문제 데이터 가져오기
     * @param {number} problemId - 문제 ID
     */
    async loadProblemFromMoodle(problemId) {
        try {
            const response = await fetch(`/api/get-problems.php?id=${problemId}`);
            const data = await response.json();

            if (data.success) {
                // 문제 데이터로 UI 업데이트
                const functionInput = document.getElementById('function-input');
                if (functionInput && data.function) {
                    functionInput.value = data.function;
                }

                if (data.xMin !== undefined && data.xMax !== undefined) {
                    document.getElementById('range-min').value = data.xMin;
                    document.getElementById('range-max').value = data.xMax;
                }

                // 자동으로 그래프 그리기
                this.handlePlot();

                this.showNotification('문제를 불러왔습니다.', 'success');
            } else {
                this.showNotification('문제를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('Moodle 연동 오류:', error);
            this.showNotification('서버 연결 오류', 'error');
        }
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
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

    .extrema-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .extrema-point:hover {
        transform: translateX(5px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);

// 앱 인스턴스 생성
const app = new ExtremaBlinkApp();
