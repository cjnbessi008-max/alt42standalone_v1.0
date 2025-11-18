/**
 * Main Application
 * 부등식 트리 시각화 앱 메인 로직
 */

class InequalityTreeApp {
    constructor() {
        // API 설정
        this.apiBaseUrl = './api';

        // 상태 관리
        this.currentProblem = null;
        this.currentSession = null;
        this.attemptCount = 0;
        this.startTime = null;
        this.stats = {
            correct: 0,
            attempted: 0,
            totalTime: 0
        };

        // 트리 시각화 인스턴스
        this.visualizer = new TreeVisualizer('treeContainer', 'treeSvg');

        // 초기화
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        this.setupEventListeners();
        await this.initSession();
        await this.loadProblem();
        this.loadStats();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 새 문제 버튼
        document.getElementById('btnNewProblem').addEventListener('click', () => {
            this.loadRandomProblem();
        });

        // 답안 제출 버튼
        document.getElementById('btnSubmit').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Enter 키로 답안 제출
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // 트리 컨트롤
        document.getElementById('btnExpandAll').addEventListener('click', () => {
            this.visualizer.expandAll();
        });

        document.getElementById('btnCollapseAll').addEventListener('click', () => {
            this.visualizer.collapseAll();
        });

        // 힌트 토글
        const hintToggle = document.getElementById('hintToggle');
        if (hintToggle) {
            hintToggle.addEventListener('click', () => {
                this.toggleHint();
            });
        }

        // 노드 클릭 콜백
        this.visualizer.nodeClickCallback = (nodeData) => {
            this.onNodeClick(nodeData);
        };
    }

    /**
     * 세션 초기화
     */
    async initSession() {
        try {
            // 임시 사용자 ID (실제로는 Moodle에서 가져와야 함)
            const moodleUserId = this.getMoodleUserId() || 1;

            const response = await fetch(`${this.apiBaseUrl}/session.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moodle_user_id: moodleUserId,
                    device_info: navigator.userAgent
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSession = data.data;
                console.log('Session initialized:', this.currentSession);
            }
        } catch (error) {
            console.error('Session initialization failed:', error);
        }
    }

    /**
     * Moodle 사용자 ID 가져오기 (URL 파라미터 또는 localStorage)
     */
    getMoodleUserId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('user_id') || localStorage.getItem('moodle_user_id') || 1;
    }

    /**
     * 문제 로드 (최초 또는 특정 ID)
     */
    async loadProblem(problemId = null) {
        this.showLoading(true);

        try {
            let url = `${this.apiBaseUrl}/get-problems.php`;

            if (problemId) {
                url += `?id=${problemId}`;
            } else {
                // URL에서 Moodle 문제 ID 확인
                const urlParams = new URLSearchParams(window.location.search);
                const moodleQuestionId = urlParams.get('question_id');

                if (moodleQuestionId) {
                    url += `?moodle_id=${moodleQuestionId}`;
                } else {
                    // 기본적으로 첫 번째 문제 로드
                    url += `?limit=1`;
                }
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                const problem = problemId || data.data.moodle_question_id
                    ? data.data
                    : data.data.problems[0];

                if (problem) {
                    await this.displayProblem(problem);
                } else {
                    this.showError('문제를 찾을 수 없습니다.');
                }
            } else {
                this.showError(data.error || '문제 로드 실패');
            }
        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showError('문제를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 랜덤 문제 로드
     */
    async loadRandomProblem() {
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/get-problems.php?limit=10`);
            const data = await response.json();

            if (data.success && data.data.problems.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.data.problems.length);
                const problem = data.data.problems[randomIndex];

                // 전체 문제 정보 로드 (solution_steps 포함)
                await this.loadProblem(problem.id);
            }
        } catch (error) {
            console.error('Failed to load random problem:', error);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 문제 표시
     */
    async displayProblem(problem) {
        this.currentProblem = problem;
        this.attemptCount = 0;
        this.startTime = Date.now();

        // 난이도 배지 업데이트
        const difficultyBadge = document.getElementById('difficultyBadge');
        const difficultyMap = {
            'easy': '초급',
            'medium': '중급',
            'hard': '고급'
        };
        difficultyBadge.textContent = difficultyMap[problem.difficulty_level] || '중급';

        // 부등식 표시 (MathJax 렌더링)
        const expressionEl = document.getElementById('inequalityExpression');
        const mathJaxExpression = inequalityParser.toMathJax(problem.inequality_expression);
        expressionEl.innerHTML = mathJaxExpression;

        // MathJax 렌더링
        if (window.MathJax) {
            MathJax.typesetPromise([expressionEl]).catch(err => console.error(err));
        }

        // 풀이 단계 트리 생성 및 시각화
        if (problem.solution_steps) {
            const steps = typeof problem.solution_steps === 'string'
                ? JSON.parse(problem.solution_steps).steps
                : problem.solution_steps.steps;

            const treeData = treeBuilder.buildFromSteps(steps);
            this.visualizer.render(treeData);
        }

        // 답안 입력 초기화
        document.getElementById('answerInput').value = '';
        document.getElementById('attemptCount').textContent = '0';

        // 피드백 숨기기
        this.hideFeedback();

        // 힌트 준비
        this.prepareHints(problem);
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const userAnswer = answerInput.value.trim();

        if (!userAnswer) {
            this.showFeedback('답을 입력해주세요.', false);
            return;
        }

        if (!this.currentProblem) {
            this.showError('문제가 로드되지 않았습니다.');
            return;
        }

        this.attemptCount++;
        document.getElementById('attemptCount').textContent = this.attemptCount;

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            const response = await fetch(`${this.apiBaseUrl}/save-progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moodle_user_id: this.getMoodleUserId(),
                    problem_id: this.currentProblem.id,
                    user_answer: userAnswer,
                    time_spent_seconds: timeSpent,
                    tree_interactions: this.getTreeInteractions()
                })
            });

            const data = await response.json();

            if (data.success) {
                const result = data.data;

                if (result.is_correct) {
                    this.showFeedback(result.feedback, true);
                    this.updateStats(true, timeSpent);
                    this.celebrateSuccess();

                    // 3초 후 새 문제 로드
                    setTimeout(() => {
                        this.loadRandomProblem();
                    }, 3000);
                } else {
                    this.showFeedback(
                        `${result.feedback} (정답: ${result.correct_answer})`,
                        false
                    );
                    this.updateStats(false, 0);

                    // 힌트 표시
                    this.showHintSection();
                }
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.showError('답안 제출 중 오류가 발생했습니다.');
        }
    }

    /**
     * 피드백 표시
     */
    showFeedback(message, isCorrect) {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.textContent = message;
        feedbackArea.className = `feedback-area show ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackArea.classList.add('fade-in');
    }

    /**
     * 피드백 숨기기
     */
    hideFeedback() {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.classList.remove('show');
    }

    /**
     * 힌트 준비
     */
    prepareHints(problem) {
        const hintList = document.getElementById('hintList');
        hintList.innerHTML = '';

        const hints = [
            '부등식의 좌변과 우변을 확인하세요.',
            '양변에 같은 수를 더하거나 빼도 부등호는 바뀌지 않습니다.',
            '음수로 나누면 부등호의 방향이 바뀝니다.',
            '트리의 각 단계를 클릭하여 자세한 설명을 확인하세요.'
        ];

        hints.forEach(hint => {
            const li = document.createElement('li');
            li.textContent = hint;
            hintList.appendChild(li);
        });
    }

    /**
     * 힌트 섹션 표시
     */
    showHintSection() {
        const hintSection = document.getElementById('hintSection');
        hintSection.style.display = 'block';
    }

    /**
     * 힌트 토글
     */
    toggleHint() {
        const hintContent = document.getElementById('hintContent');
        const toggleIcon = document.querySelector('.toggle-icon');

        if (hintContent.style.display === 'none') {
            hintContent.style.display = 'block';
            toggleIcon.classList.add('expanded');
        } else {
            hintContent.style.display = 'none';
            toggleIcon.classList.remove('expanded');
        }
    }

    /**
     * 노드 클릭 핸들러
     */
    onNodeClick(nodeData) {
        console.log('Node clicked:', nodeData);
    }

    /**
     * 통계 업데이트
     */
    updateStats(isCorrect, timeSpent) {
        this.stats.attempted++;

        if (isCorrect) {
            this.stats.correct++;
            this.stats.totalTime += timeSpent;
        }

        this.saveStats();
        this.displayStats();
    }

    /**
     * 통계 표시
     */
    displayStats() {
        document.getElementById('statCorrect').textContent = this.stats.correct;
        document.getElementById('statAttempted').textContent = this.stats.attempted;

        const avgTime = this.stats.correct > 0
            ? Math.floor(this.stats.totalTime / this.stats.correct)
            : 0;
        document.getElementById('statTime').textContent = `${avgTime}s`;
    }

    /**
     * 통계 저장 (localStorage)
     */
    saveStats() {
        localStorage.setItem('inequalityTreeStats', JSON.stringify(this.stats));
    }

    /**
     * 통계 로드
     */
    loadStats() {
        const saved = localStorage.getItem('inequalityTreeStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
        this.displayStats();
    }

    /**
     * 성공 애니메이션
     */
    celebrateSuccess() {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.style.animation = 'none';
        setTimeout(() => {
            feedbackArea.style.animation = 'fadeIn 0.3s ease-out';
        }, 10);
    }

    /**
     * 트리 인터랙션 기록 가져오기
     */
    getTreeInteractions() {
        // 실제로는 클릭한 노드, 소요 시간 등을 추적
        return {
            nodes_clicked: [],
            time_on_tree: 0
        };
    }

    /**
     * 로딩 표시
     */
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message);  // 실제로는 더 나은 UI 사용
    }
}

// DOM 로드 완료 후 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InequalityTreeApp();
});
