/**
 * Math Renderer
 * Plotly.js를 사용하여 수학 함수를 그래프로 렌더링
 */

class MathRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentExtrema = [];
        this.currentFunction = null;
    }

    /**
     * 함수 그래프 그리기
     * @param {string} expression - 수식 문자열
     * @param {number} xMin - X 범위 최소값
     * @param {number} xMax - X 범위 최대값
     */
    plotFunction(expression, xMin, xMax) {
        try {
            // 함수 데이터 생성
            const data = extremaCalculator.generatePoints(expression, xMin, xMax);

            // Plotly 트레이스 생성
            const trace = {
                x: data.x,
                y: data.y,
                mode: 'lines',
                name: `f(x) = ${expression}`,
                line: {
                    color: '#667eea',
                    width: 3
                }
            };

            // 레이아웃 설정
            const layout = {
                title: {
                    text: '함수 그래프',
                    font: { size: 14, color: '#333' }
                },
                xaxis: {
                    title: 'x',
                    gridcolor: '#e0e0e0',
                    zeroline: true,
                    zerolinecolor: '#999',
                    zerolinewidth: 2
                },
                yaxis: {
                    title: 'f(x)',
                    gridcolor: '#e0e0e0',
                    zeroline: true,
                    zerolinecolor: '#999',
                    zerolinewidth: 2
                },
                margin: { l: 40, r: 20, t: 40, b: 40 },
                paper_bgcolor: 'white',
                plot_bgcolor: '#fafafa',
                hovermode: 'closest'
            };

            // 설정
            const config = {
                responsive: true,
                displayModeBar: false
            };

            // 그래프 그리기
            Plotly.newPlot(this.container, [trace], layout, config);
            this.currentFunction = expression;

            return true;
        } catch (error) {
            console.error('그래프 렌더링 오류:', error);
            this.showError('그래프를 그릴 수 없습니다. 수식을 확인해주세요.');
            return false;
        }
    }

    /**
     * 극값 표시 (블링크 애니메이션과 함께)
     * @param {Array} extrema - 극값 배열
     */
    async showExtrema(extrema) {
        if (!this.currentFunction || extrema.length === 0) {
            return;
        }

        this.currentExtrema = extrema;

        // 극대점 트레이스
        const maxima = extrema.filter(e => e.type === 'maximum');
        const minimaPoints = extrema.filter(e => e.type === 'minimum');

        const traces = [];

        // 극대점
        if (maxima.length > 0) {
            traces.push({
                x: maxima.map(e => e.x),
                y: maxima.map(e => e.y),
                mode: 'markers',
                name: '극대',
                marker: {
                    color: '#52c41a',
                    size: 12,
                    symbol: 'circle',
                    line: {
                        color: 'white',
                        width: 2
                    }
                },
                hovertemplate: '<b>극대점</b><br>x: %{x:.4f}<br>y: %{y:.4f}<extra></extra>'
            });
        }

        // 극소점
        if (minimaPoints.length > 0) {
            traces.push({
                x: minimaPoints.map(e => e.x),
                y: minimaPoints.map(e => e.y),
                mode: 'markers',
                name: '극소',
                marker: {
                    color: '#ff4d4f',
                    size: 12,
                    symbol: 'circle',
                    line: {
                        color: 'white',
                        width: 2
                    }
                },
                hovertemplate: '<b>극소점</b><br>x: %{x:.4f}<br>y: %{y:.4f}<extra></extra>'
            });
        }

        // 극값 포인트 추가
        try {
            await Plotly.addTraces(this.container, traces);

            // 블링크 애니메이션 트리거
            if (window.extremaAnimator) {
                extremaAnimator.animateExtrema(extrema);
            }
        } catch (error) {
            console.error('극값 표시 오류:', error);
        }
    }

    /**
     * 그래프 초기화
     */
    clear() {
        if (this.container) {
            Plotly.purge(this.container);
            this.currentExtrema = [];
            this.currentFunction = null;
        }
    }

    /**
     * 오류 메시지 표시
     * @param {string} message - 오류 메시지
     */
    showError(message) {
        this.container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff4d4f; text-align: center; padding: 20px;">
                <div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 10px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="margin: 0; font-size: 14px;">${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * 현재 극값 가져오기
     * @returns {Array} - 극값 배열
     */
    getExtrema() {
        return this.currentExtrema;
    }
}

// 전역 인스턴스는 app.js에서 생성
