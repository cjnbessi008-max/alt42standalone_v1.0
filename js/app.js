/**
 * 메인 애플리케이션 로직
 * Moodle LMS 연동 및 UI 제어
 */

class BoundarySliderApp {
    constructor() {
        this.slider = null;
        this.currentProblem = null;
        this.apiBaseUrl = './api';

        this.init();
    }

    async init() {
        try {
            // Boundary Slider 초기화
            this.slider = new BoundarySlider({
                lowerBound: 0,
                upperBound: 1,
                min: -10,
                max: 10,
                step: 0.1,
                onChange: (bounds) => this.handleBoundaryChange(bounds),
                onSubmit: (bounds) => this.submitAnswer(bounds)
            });

            // 제출 버튼 이벤트
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submitAnswer());
            }

            // URL 파라미터에서 문제 ID 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('problem_id');

            if (problemId) {
                await this.loadProblem(problemId);
            } else {
                this.showDemoMode();
            }

            console.log('Boundary Slider App 초기화 완료');
        } catch (error) {
            console.error('초기화 오류:', error);
            this.showError('애플리케이션 초기화 중 오류가 발생했습니다.');
        }
    }

    async loadProblem(problemId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/get_problem.php?id=${problemId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.displayProblem(data.problem);
            } else {
                throw new Error(data.message || '문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('문제 로딩 오류:', error);
            this.showError('문제를 불러오는 중 오류가 발생했습니다.');
            this.showDemoMode();
        }
    }

    displayProblem(problem) {
        const problemInfo = document.getElementById('problem-info');
        const problemText = document.getElementById('problem-text');

        if (problemInfo) {
            problemInfo.innerHTML = `
                <strong>문제 ID:</strong> ${problem.id} |
                <strong>과목:</strong> ${problem.subject || '미적분학'} |
                <strong>난이도:</strong> ${problem.difficulty || '중급'}
            `;
        }

        if (problemText) {
            problemText.innerHTML = `
                <h3>${problem.title || '적분 경계값 설정'}</h3>
                <p>${problem.description || '주어진 함수의 적분 구간을 설정하세요.'}</p>
                ${problem.function ? `<p><strong>함수:</strong> f(x) = ${problem.function}</p>` : ''}
            `;
        }

        // 문제에 따라 슬라이더 범위 설정
        if (problem.min_bound !== undefined && problem.max_bound !== undefined) {
            this.slider.setRange(
                parseFloat(problem.min_bound),
                parseFloat(problem.max_bound),
                parseFloat(problem.step || 0.1)
            );
        }

        // 초기 경계값이 있으면 설정
        if (problem.initial_lower !== undefined && problem.initial_upper !== undefined) {
            this.slider.setBounds(
                parseFloat(problem.initial_lower),
                parseFloat(problem.initial_upper)
            );
        }
    }

    showDemoMode() {
        const problemInfo = document.getElementById('problem-info');
        const problemText = document.getElementById('problem-text');

        if (problemInfo) {
            problemInfo.innerHTML = `
                <strong>데모 모드</strong> - Moodle 연동 없이 실행 중입니다.
            `;
        }

        if (problemText) {
            problemText.innerHTML = `
                <h3>적분 경계값 설정 데모</h3>
                <p>슬라이더를 움직여 적분의 하한(a)과 상한(b)을 설정하세요.</p>
                <p><strong>함수:</strong> f(x) = x²</p>
            `;
        }

        console.log('데모 모드로 실행 중');
    }

    handleBoundaryChange(bounds) {
        // 실시간으로 적분 결과 계산 (데모용)
        this.calculateIntegral(bounds);
    }

    calculateIntegral(bounds) {
        const resultDiv = document.getElementById('integral-result');

        if (!resultDiv) return;

        // 간단한 예시: f(x) = x² 의 적분
        // ∫ x² dx = x³/3
        const lower = bounds.lower;
        const upper = bounds.upper;

        const result = (Math.pow(upper, 3) / 3) - (Math.pow(lower, 3) / 3);

        resultDiv.innerHTML = `
            <strong>적분 결과 (f(x) = x²):</strong><br>
            ∫<sub>${lower.toFixed(1)}</sub><sup>${upper.toFixed(1)}</sup> x² dx ≈ ${result.toFixed(4)}
        `;
    }

    async submitAnswer() {
        const bounds = this.slider.getBounds();

        try {
            // Moodle로 답안 제출
            const response = await fetch(`${this.apiBaseUrl}/submit_answer.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problem_id: this.currentProblem ? this.currentProblem.id : null,
                    lower_bound: bounds.lower,
                    upper_bound: bounds.upper,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('답안이 성공적으로 제출되었습니다!');
            } else {
                throw new Error(data.message || '제출 실패');
            }
        } catch (error) {
            console.error('답안 제출 오류:', error);

            // 데모 모드에서는 로컬 알림만 표시
            this.showSuccess(`
                답안 제출 (데모 모드):<br>
                하한: ${bounds.lower.toFixed(1)}<br>
                상한: ${bounds.upper.toFixed(1)}
            `);
        }
    }

    showSuccess(message) {
        const resultDiv = document.getElementById('integral-result');
        if (resultDiv) {
            resultDiv.style.background = '#e8f5e9';
            resultDiv.style.color = '#2e7d32';
            resultDiv.innerHTML = `✅ ${message}`;

            setTimeout(() => {
                resultDiv.style.background = '#fff3e0';
                resultDiv.style.color = '#333';
            }, 3000);
        }
    }

    showError(message) {
        const resultDiv = document.getElementById('integral-result');
        if (resultDiv) {
            resultDiv.style.background = '#ffebee';
            resultDiv.style.color = '#c62828';
            resultDiv.innerHTML = `❌ ${message}`;
        }
    }
}

// DOM 로드 완료 후 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BoundarySliderApp();
});
