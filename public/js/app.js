/**
 * Venn Glow 메인 애플리케이션
 * Moodle LMS와 연동하여 집합 문제를 표시
 */
class VennGlowApp {
    constructor() {
        this.apiBase = '../api';
        this.currentProblem = null;
        this.vennGlow = null;
        this.viewport = null;

        this.init();
    }

    async init() {
        console.log('Venn Glow App 초기화...');

        // Venn 다이어그램 초기화
        this.vennGlow = new VennGlow('venn-canvas', {
            radiusA: 70,
            radiusB: 70,
            overlap: 35,
            glowIntensity: 15,
            pulseSpeed: 0.015,
            showLabels: true,
            showElements: true
        });

        // 스마트폰 뷰포트 초기화
        this.viewport = new SmartphoneViewport();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 초기 문제 로드
        await this.loadSampleProblem();

        console.log('Venn Glow App 준비 완료!');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 새 문제 버튼
        const btnNewProblem = document.getElementById('btn-new-problem');
        if (btnNewProblem) {
            btnNewProblem.addEventListener('click', () => this.loadRandomProblem());
        }

        // 샘플 문제 버튼
        const btnSampleProblem = document.getElementById('btn-sample-problem');
        if (btnSampleProblem) {
            btnSampleProblem.addEventListener('click', () => this.loadSampleProblem());
        }

        // 애니메이션 재생 버튼
        const btnAnimate = document.getElementById('btn-animate');
        if (btnAnimate) {
            btnAnimate.addEventListener('click', () => {
                this.vennGlow.playIntersectionAnimation();
                this.viewport.pulse();
            });
        }

        // 체크박스 이벤트
        const showUnion = document.getElementById('show-union');
        const showIntersection = document.getElementById('show-intersection');

        if (showUnion) {
            showUnion.addEventListener('change', (e) => {
                this.vennGlow.options.showElements = e.target.checked;
                this.vennGlow.draw();
            });
        }

        if (showIntersection) {
            showIntersection.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.vennGlow.playIntersectionAnimation();
                } else {
                    this.vennGlow.intersectionGlow = 0;
                }
            });
        }
    }

    /**
     * 샘플 문제 로드
     */
    async loadSampleProblem() {
        try {
            const response = await fetch(`${this.apiBase}/get_problem.php`);
            const data = await response.json();

            if (data.success) {
                this.displayProblem(data.problem);
            } else {
                throw new Error(data.message || '문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('샘플 문제 로드 오류:', error);
            this.showError('샘플 문제를 불러오는데 실패했습니다.');

            // 폴백: 하드코딩된 샘플 문제
            this.displayProblem({
                id: 'fallback_1',
                name: '집합의 교집합',
                questionText: '집합 A와 집합 B의 교집합을 구하세요.',
                setA: [1, 2, 3, 4, 5],
                setB: [3, 4, 5, 6, 7],
                intersection: [3, 4, 5]
            });
        }
    }

    /**
     * 무작위 문제 로드
     */
    async loadRandomProblem() {
        try {
            const response = await fetch(`${this.apiBase}/get_problem.php?random=1`);
            const data = await response.json();

            if (data.success) {
                this.displayProblem(data.problem);
                this.viewport.pulse();
            } else {
                throw new Error(data.message || '문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('무작위 문제 로드 오류:', error);
            this.showError('새 문제를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 특정 문제 ID로 로드
     */
    async loadProblem(problemId) {
        try {
            const response = await fetch(`${this.apiBase}/get_problem.php?problem_id=${problemId}`);
            const data = await response.json();

            if (data.success) {
                this.displayProblem(data.problem);
            } else {
                throw new Error(data.message || '문제를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('문제 로드 오류:', error);
            this.showError('문제를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 문제 표시
     */
    displayProblem(problem) {
        this.currentProblem = problem;

        // 문제 텍스트 표시
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.textContent = problem.questionText || problem.name;
        }

        // 집합 정보 표시
        const setADisplay = document.getElementById('set-a-display');
        const setBDisplay = document.getElementById('set-b-display');

        if (setADisplay) {
            setADisplay.textContent = `{ ${problem.setA.join(', ')} }`;
        }

        if (setBDisplay) {
            setBDisplay.textContent = `{ ${problem.setB.join(', ')} }`;
        }

        // Venn 다이어그램 업데이트
        this.vennGlow.setData(problem.setA, problem.setB);

        // 설명 텍스트 업데이트
        const explanationText = document.getElementById('explanation-text');
        if (explanationText) {
            const intersectionCount = problem.intersection.length;
            if (intersectionCount > 0) {
                explanationText.textContent =
                    `교집합: { ${problem.intersection.join(', ')} } (${intersectionCount}개)`;
            } else {
                explanationText.textContent = '두 집합은 교집합이 없습니다 (서로소)';
            }
        }

        // 애니메이션 자동 재생
        setTimeout(() => {
            this.vennGlow.playIntersectionAnimation();
        }, 500);
    }

    /**
     * 답안 제출
     */
    async submitAnswer(answer) {
        if (!this.currentProblem) {
            this.showError('문제가 로드되지 않았습니다.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/submit_answer.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: this.currentProblem.id,
                    student_id: 1, // 임시 학생 ID
                    answer: answer
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.correct) {
                    this.showSuccess('정답입니다! 🎉');
                    this.vennGlow.playIntersectionAnimation();
                } else {
                    this.showError(`오답입니다. 정답: ${data.correctAnswer}`);
                }
            } else {
                throw new Error(data.message || '답안 제출 실패');
            }
        } catch (error) {
            console.error('답안 제출 오류:', error);
            this.showError('답안을 제출하는데 실패했습니다.');
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        console.log('✅', message);
        // TODO: UI에 성공 메시지 표시
        alert(message);
    }

    /**
     * 오류 메시지 표시
     */
    showError(message) {
        console.error('❌', message);
        // TODO: UI에 오류 메시지 표시
        alert(message);
    }
}

// DOM이 로드되면 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VennGlowApp();
});
