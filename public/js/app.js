/**
 * Pattern Loop Application Logic
 * 애플리케이션 메인 로직
 */

class PatternLoopApp {
    constructor() {
        this.engine = null;
        this.currentPatterns = [];
        this.isPlaying = false;
        this.showGrid = true;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // Pattern Loop Engine 초기화
        this.engine = new PatternLoopEngine('patternCanvas', {
            width: 360,
            height: 640,
            fps: 60,
            showGrid: true
        });

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 초기 패턴 로드
        this.loadPatterns();

        console.log('Pattern Loop App initialized');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 재생 버튼
        document.getElementById('playBtn').addEventListener('click', () => {
            this.play();
        });

        // 일시정지 버튼
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pause();
        });

        // 리셋 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        // 그리드 토글 버튼
        document.getElementById('toggleGridBtn').addEventListener('click', () => {
            this.toggleGrid();
        });

        // 스마트폰 토글 버튼
        document.getElementById('togglePhoneBtn').addEventListener('click', () => {
            this.togglePhone();
        });

        // 퀴즈 동기화 버튼
        document.getElementById('syncQuizBtn').addEventListener('click', () => {
            this.syncQuiz();
        });

        // 패턴 아이템 클릭
        document.querySelectorAll('.pattern-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const patternId = parseInt(e.currentTarget.dataset.patternId);
                this.togglePattern(patternId);
            });
        });
    }

    /**
     * 패턴 로드
     */
    loadPatterns() {
        if (window.PATTERNS_DATA && window.PATTERNS_DATA.length > 0) {
            // 기본적으로 첫 번째 패턴만 활성화
            this.addPatternToEngine(window.PATTERNS_DATA[0]);

            // 첫 번째 패턴 아이템 활성화 표시
            const firstItem = document.querySelector('.pattern-item');
            if (firstItem) {
                firstItem.classList.add('active');
            }
        }
    }

    /**
     * 엔진에 패턴 추가
     */
    addPatternToEngine(patternData) {
        const pattern = this.engine.addPattern(patternData);
        this.currentPatterns.push({
            id: patternData.id,
            pattern: pattern
        });
        console.log('Pattern added:', patternData.name);
    }

    /**
     * 패턴 토글
     */
    togglePattern(patternId) {
        const item = document.querySelector(`.pattern-item[data-pattern-id="${patternId}"]`);
        const isActive = item.classList.contains('active');

        if (isActive) {
            // 패턴 제거
            const index = this.currentPatterns.findIndex(p => p.id === patternId);
            if (index !== -1) {
                this.engine.removePattern(index);
                this.currentPatterns.splice(index, 1);
                item.classList.remove('active');
            }
        } else {
            // 최대 패턴 수 체크
            if (this.currentPatterns.length >= 5) {
                alert('최대 5개의 패턴까지만 동시에 표시할 수 있습니다.');
                return;
            }

            // 패턴 추가
            const patternData = window.PATTERNS_DATA.find(p => p.id === patternId);
            if (patternData) {
                this.addPatternToEngine(patternData);
                item.classList.add('active');
            }
        }
    }

    /**
     * 재생
     */
    play() {
        this.engine.play();
        this.isPlaying = true;
        this.updateStatus('재생 중', true);
    }

    /**
     * 일시정지
     */
    pause() {
        this.engine.pause();
        this.isPlaying = false;
        this.updateStatus('일시정지', false);
    }

    /**
     * 리셋
     */
    reset() {
        this.engine.reset();
        this.isPlaying = false;
        this.updateStatus('리셋됨', false);
    }

    /**
     * 그리드 토글
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.engine.setShowGrid(this.showGrid);

        const btn = document.getElementById('toggleGridBtn');
        btn.textContent = this.showGrid ? '📊 그리드 숨기기' : '📊 그리드 표시';
    }

    /**
     * 스마트폰 토글
     */
    togglePhone() {
        const container = document.getElementById('smartphoneContainer');
        const btn = document.getElementById('togglePhoneBtn');

        container.classList.toggle('hidden');
        btn.textContent = container.classList.contains('hidden') ? '표시' : '숨기기';
    }

    /**
     * 상태 업데이트
     */
    updateStatus(text, active) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        statusText.textContent = text;

        if (active) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }

    /**
     * Moodle 퀴즈 동기화
     */
    async syncQuiz() {
        const quizId = document.getElementById('quizIdInput').value;

        if (!quizId) {
            alert('퀴즈 ID를 입력하세요.');
            return;
        }

        this.updateStatus('동기화 중...', true);

        try {
            const response = await fetch(`${window.API_BASE_URL}?action=sync_quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quiz_id: quizId })
            });

            const result = await response.json();

            if (result.success) {
                alert(`동기화 완료!\n성공: ${result.data.success}개\n실패: ${result.data.failed}개\n전체: ${result.data.total}개`);
                this.updateStatus('동기화 완료', false);
            } else {
                alert('동기화 실패: ' + result.error);
                this.updateStatus('동기화 실패', false);
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('동기화 오류: ' + error.message);
            this.updateStatus('오류', false);
        }
    }

    /**
     * 문제 정보 로드
     */
    async loadQuestion(questionId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}?action=get_question&id=${questionId}`);
            const result = await response.json();

            if (result.success) {
                this.displayQuestion(result.data);
            }
        } catch (error) {
            console.error('Load question error:', error);
        }
    }

    /**
     * 문제 정보 표시
     */
    displayQuestion(question) {
        document.getElementById('questionText').innerHTML = question.question_text;
        document.getElementById('questionType').textContent = question.question_type;

        // 문제에 연결된 패턴 로드
        if (question.pattern_config && question.pattern_config.patterns) {
            this.loadQuestionPatterns(question.pattern_config.patterns);
        }
    }

    /**
     * 문제 패턴 로드
     */
    loadQuestionPatterns(patternIds) {
        // 현재 패턴 초기화
        this.engine.clearPatterns();
        this.currentPatterns = [];

        // 모든 패턴 아이템 비활성화
        document.querySelectorAll('.pattern-item').forEach(item => {
            item.classList.remove('active');
        });

        // 지정된 패턴들 활성화
        patternIds.forEach(patternId => {
            const patternData = window.PATTERNS_DATA.find(p => p.id === patternId);
            if (patternData) {
                this.addPatternToEngine(patternData);

                const item = document.querySelector(`.pattern-item[data-pattern-id="${patternId}"]`);
                if (item) {
                    item.classList.add('active');
                }
            }
        });

        // 자동 재생
        this.play();
    }
}

// 앱 인스턴스 생성
let app;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    app = new PatternLoopApp();
});
