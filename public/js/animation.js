/**
 * Extrema Animation
 * 극값 포인트의 블링크 애니메이션 효과
 */

class ExtremaAnimator {
    constructor() {
        this.markers = [];
        this.animationDelay = 300; // 각 극값이 나타나는 지연 시간 (ms)
    }

    /**
     * 극값 블링크 애니메이션 실행
     * @param {Array} extrema - 극값 배열
     */
    animateExtrema(extrema) {
        // 기존 마커 제거
        this.clearMarkers();

        // 각 극값을 순차적으로 블링크 애니메이션과 함께 표시
        extrema.forEach((point, index) => {
            setTimeout(() => {
                this.createBlinkMarker(point, index);
            }, index * this.animationDelay);
        });
    }

    /**
     * 블링크 마커 생성
     * @param {Object} point - 극값 정보 {x, y, type}
     * @param {number} index - 인덱스
     */
    createBlinkMarker(point, index) {
        const graphContainer = document.getElementById('graph-container');
        if (!graphContainer) return;

        // Plotly 그래프의 좌표를 화면 픽셀 좌표로 변환
        const plotlyDiv = graphContainer.querySelector('.plotly');
        if (!plotlyDiv) return;

        try {
            // Plotly의 내부 레이아웃 정보 사용
            const fullLayout = plotlyDiv._fullLayout;
            if (!fullLayout) return;

            const xaxis = fullLayout.xaxis;
            const yaxis = fullLayout.yaxis;

            // 데이터 좌표를 픽셀 좌표로 변환
            const xPixel = xaxis.l2p(point.x) + xaxis._offset;
            const yPixel = yaxis.l2p(point.y) + yaxis._offset;

            // 마커 엘리먼트 생성
            const marker = document.createElement('div');
            marker.className = `extrema-marker ${point.type} blink`;
            marker.style.left = `${xPixel}px`;
            marker.style.top = `${yPixel}px`;

            // 툴팁 추가
            marker.title = `${point.label}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;

            // 그래프 컨테이너에 추가
            plotlyDiv.appendChild(marker);
            this.markers.push(marker);

            // 사운드 효과 (선택적)
            this.playBlinkSound();

            // 일정 시간 후 블링크 클래스 제거 (계속 깜빡이지 않도록)
            setTimeout(() => {
                marker.classList.remove('blink');
            }, 2000);

        } catch (error) {
            console.error('마커 생성 오류:', error);
        }
    }

    /**
     * 블링크 사운드 재생 (선택적)
     */
    playBlinkSound() {
        try {
            // Web Audio API를 사용한 간단한 비프음
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // 주파수 (Hz)
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // 사운드 재생 실패는 무시 (중요하지 않음)
        }
    }

    /**
     * 모든 마커 제거
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            if (marker.parentNode) {
                marker.parentNode.removeChild(marker);
            }
        });
        this.markers = [];
    }

    /**
     * 특정 극값만 강조
     * @param {number} index - 강조할 극값의 인덱스
     */
    highlightExtrema(index) {
        this.markers.forEach((marker, i) => {
            if (i === index) {
                marker.classList.add('blink');
                setTimeout(() => marker.classList.remove('blink'), 1000);
            }
        });
    }

    /**
     * 애니메이션 속도 설정
     * @param {number} delay - 지연 시간 (ms)
     */
    setAnimationDelay(delay) {
        this.animationDelay = delay;
    }
}

// 전역 인스턴스 생성
const extremaAnimator = new ExtremaAnimator();
