/**
 * Moodle Integration Module
 * Moodle LMS와의 연동을 담당하는 모듈
 */

class MoodleIntegration {
    constructor() {
        this.apiEndpoint = 'api/get_problem.php';
        this.problemId = this.getProblemIdFromUrl();
        this.problemData = null;
    }

    /**
     * URL에서 문제 ID 추출 (query parameter)
     * 예: ?problem_id=123
     */
    getProblemIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('problem_id') || urlParams.get('id') || null;
    }

    /**
     * Moodle에서 문제 정보 가져오기
     */
    async loadProblem() {
        try {
            const statusElement = document.querySelector('.status-dot');
            const problemContentElement = document.getElementById('problem-content');

            if (!this.problemId) {
                // 문제 ID가 없으면 데모 모드
                this.loadDemoData();
                return;
            }

            // Loading state
            if (statusElement) {
                statusElement.style.background = '#fbbf24'; // yellow
            }
            problemContentElement.innerHTML = '<p>Moodle에서 문제를 불러오는 중...</p>';

            // API 호출
            const response = await fetch(`${this.apiEndpoint}?problem_id=${this.problemId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.problemData = data.problem;
                this.displayProblem(data.problem);

                // Connected state
                if (statusElement) {
                    statusElement.style.background = '#4ade80'; // green
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }

        } catch (error) {
            console.error('Moodle 연동 오류:', error);
            this.displayError(error.message);

            // Error state
            const statusElement = document.querySelector('.status-dot');
            if (statusElement) {
                statusElement.style.background = '#ef4444'; // red
            }

            // Fallback to demo mode
            setTimeout(() => {
                this.loadDemoData();
            }, 2000);
        }
    }

    /**
     * 문제 정보 화면에 표시
     */
    displayProblem(problem) {
        const problemContentElement = document.getElementById('problem-content');

        const html = `
            <div class="problem-detail">
                <h3>${problem.title || '벡터 크기 계산 문제'}</h3>
                <p><strong>문제 설명:</strong></p>
                <p>${problem.description || problem.question_text || ''}</p>

                ${problem.vectors ? this.renderVectorData(problem.vectors) : ''}

                ${problem.hints ? `
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; color: #667eea; font-weight: 600;">
                            💡 힌트 보기
                        </summary>
                        <p style="margin-top: 10px;">${problem.hints}</p>
                    </details>
                ` : ''}
            </div>
        `;

        problemContentElement.innerHTML = html;

        // 문제에 벡터 데이터가 있으면 자동으로 입력
        if (problem.vectors && problem.vectors.length > 0) {
            this.autoFillVector(problem.vectors[0]);
        }
    }

    /**
     * 벡터 데이터 렌더링
     */
    renderVectorData(vectors) {
        if (!vectors || vectors.length === 0) return '';

        let html = '<div style="margin-top: 15px;"><strong>주어진 벡터:</strong><ul style="margin-left: 20px; margin-top: 10px;">';

        vectors.forEach((vector, index) => {
            html += `<li>벡터 ${index + 1}: (${vector.x}, ${vector.y}, ${vector.z || 0})</li>`;
        });

        html += '</ul></div>';
        return html;
    }

    /**
     * 벡터 값을 입력 필드에 자동 입력
     */
    autoFillVector(vector) {
        if (vector) {
            document.getElementById('vector-x').value = vector.x || 0;
            document.getElementById('vector-y').value = vector.y || 0;
            document.getElementById('vector-z').value = vector.z || 0;

            // 시각화 업데이트
            if (window.visualizer) {
                visualizer.updateFromInputs();
            }
        }
    }

    /**
     * 오류 메시지 표시
     */
    displayError(errorMessage) {
        const problemContentElement = document.getElementById('problem-content');
        problemContentElement.innerHTML = `
            <div style="color: #ef4444; padding: 15px; background: #fee; border-radius: 5px;">
                <strong>⚠️ 오류 발생:</strong>
                <p>${errorMessage}</p>
                <p style="margin-top: 10px; font-size: 0.9em;">데모 모드로 전환합니다...</p>
            </div>
        `;
    }

    /**
     * 데모 모드 - 샘플 데이터 로드
     */
    loadDemoData() {
        const demoProblems = [
            {
                title: '3차원 벡터의 크기 계산',
                description: '벡터 v = (3, 4, 0)의 크기를 계산하고, 파동으로 시각화해보세요.',
                vectors: [{x: 3, y: 4, z: 0}],
                hints: '벡터의 크기는 √(x² + y² + z²) 공식을 사용합니다. 이 경우 √(9 + 16 + 0) = √25 = 5입니다.'
            },
            {
                title: '2차원 벡터 문제',
                description: '벡터 u = (5, 12)의 크기를 구하세요.',
                vectors: [{x: 5, y: 12, z: 0}],
                hints: '5-12-13은 유명한 피타고라스 수입니다.'
            },
            {
                title: '복잡한 3차원 벡터',
                description: '벡터 w = (2, 3, 6)의 크기를 계산하세요.',
                vectors: [{x: 2, y: 3, z: 6}],
                hints: '√(4 + 9 + 36) = √49 = 7'
            }
        ];

        // 랜덤하게 하나 선택
        const randomProblem = demoProblems[Math.floor(Math.random() * demoProblems.length)];

        const problemContentElement = document.getElementById('problem-content');
        problemContentElement.innerHTML = `
            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <strong>📚 데모 모드</strong>
                <p style="margin-top: 5px; font-size: 0.9em;">
                    Moodle 연동이 설정되지 않아 샘플 문제를 표시합니다.
                </p>
            </div>
        `;

        this.displayProblem(randomProblem);

        // 연결 상태 업데이트
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.app-status span:last-child');
        if (statusDot) {
            statusDot.style.background = '#fbbf24';
        }
        if (statusText) {
            statusText.textContent = '데모 모드';
        }
    }

    /**
     * 학습자 응답을 Moodle로 전송
     */
    async submitAnswer(magnitude, vectorData) {
        if (!this.problemId) {
            console.log('데모 모드: 응답 전송 생략');
            return;
        }

        try {
            const response = await fetch('api/submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problem_id: this.problemId,
                    magnitude: magnitude,
                    vector: vectorData,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('응답 제출 성공:', data);
                this.showSubmitFeedback(true, data.message);
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            console.error('응답 제출 오류:', error);
            this.showSubmitFeedback(false, error.message);
        }
    }

    /**
     * 제출 피드백 표시
     */
    showSubmitFeedback(success, message) {
        // TODO: 사용자에게 피드백 표시
        alert(success ? `✓ ${message}` : `✗ ${message}`);
    }
}

// Initialize Moodle integration
let moodleIntegration;

document.addEventListener('DOMContentLoaded', () => {
    moodleIntegration = new MoodleIntegration();
    moodleIntegration.loadProblem();

    console.log('Moodle Integration initialized');
});
