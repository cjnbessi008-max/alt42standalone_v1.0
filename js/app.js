/**
 * Cardinality Beam Application
 * 메인 애플리케이션 로직
 */

class CardinalityApp {
    constructor() {
        this.currentProblemIndex = 0;
        this.problems = [];
        this.beam = null;
        this.score = 0;
        this.totalAttempts = 0;

        this.init();
    }

    async init() {
        // Cardinality Beam 초기화
        this.beam = new CardinalityBeam('beamCanvas');

        // 문제 데이터 로드
        await this.loadProblems();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 첫 번째 문제 표시
        this.displayCurrentProblem();
    }

    async loadProblems() {
        // 샘플 문제 데이터 (나중에 외부 JSON이나 API로 확장 가능)
        this.problems = [
            {
                id: 1,
                title: "집합 A의 원소는 몇 개일까요?",
                set: [1, 2, 3],
                setName: "A",
                visualType: "numbers"
            },
            {
                id: 2,
                title: "집합 B의 원소는 몇 개일까요?",
                set: [2, 4, 6, 8, 10],
                setName: "B",
                visualType: "numbers"
            },
            {
                id: 3,
                title: "과일 집합의 원소는 몇 개일까요?",
                set: ["🍎", "🍌", "🍊", "🍇"],
                setName: "C",
                visualType: "emoji"
            },
            {
                id: 4,
                title: "빈 집합의 원소는 몇 개일까요?",
                set: [],
                setName: "D",
                visualType: "numbers"
            },
            {
                id: 5,
                title: "알파벳 집합의 원소는 몇 개일까요?",
                set: ["a", "b", "c", "d", "e", "f", "g"],
                setName: "E",
                visualType: "letters"
            },
            {
                id: 6,
                title: "동물 집합의 원소는 몇 개일까요?",
                set: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊"],
                setName: "F",
                visualType: "emoji"
            },
            {
                id: 7,
                title: "10보다 작은 소수 집합의 원소는 몇 개일까요?",
                set: [2, 3, 5, 7],
                setName: "G",
                visualType: "numbers"
            },
            {
                id: 8,
                title: "색깔 집합의 원소는 몇 개일까요?",
                set: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪"],
                setName: "H",
                visualType: "emoji"
            },
            {
                id: 9,
                title: "1부터 15까지의 홀수 집합의 원소는 몇 개일까요?",
                set: [1, 3, 5, 7, 9, 11, 13, 15],
                setName: "I",
                visualType: "numbers"
            },
            {
                id: 10,
                title: "계절 집합의 원소는 몇 개일까요?",
                set: ["봄", "여름", "가을", "겨울"],
                setName: "J",
                visualType: "text"
            }
        ];
    }

    setupEventListeners() {
        // 제출 버튼
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Enter 키로 제출
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // 이전/다음 버튼
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousProblem();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextProblem();
        });
    }

    displayCurrentProblem() {
        const problem = this.problems[this.currentProblemIndex];

        // 문제 번호 업데이트
        document.getElementById('currentProblem').textContent = this.currentProblemIndex + 1;

        // 문제 제목
        document.getElementById('problemTitle').textContent = problem.title;

        // 집합 표기
        const setContent = this.formatSet(problem.set, problem.setName);
        document.getElementById('setContent').textContent = setContent;

        // 시각적 원소 표시
        this.displayVisualElements(problem.set);

        // Cardinality Beam 업데이트
        this.beam.setCardinality(problem.set.length);

        // 입력 필드 초기화
        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').focus();

        // 피드백 초기화
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';

        // 버튼 상태 업데이트
        document.getElementById('prevBtn').disabled = this.currentProblemIndex === 0;
        document.getElementById('nextBtn').disabled = this.currentProblemIndex === this.problems.length - 1;
    }

    formatSet(elements, setName) {
        if (elements.length === 0) {
            return `${setName} = ∅ (빈 집합)`;
        }

        const formattedElements = elements.map(el => {
            if (typeof el === 'string' && el.length > 1 && !el.match(/[\u{1F300}-\u{1F9FF}]/u)) {
                return `"${el}"`;
            }
            return el;
        }).join(', ');

        return `${setName} = {${formattedElements}}`;
    }

    displayVisualElements(elements) {
        const container = document.getElementById('visualElements');
        container.innerHTML = '';

        elements.forEach((element, index) => {
            setTimeout(() => {
                const elementDiv = document.createElement('div');
                elementDiv.className = 'element-item';
                elementDiv.textContent = element;
                elementDiv.style.animationDelay = `${index * 0.1}s`;
                container.appendChild(elementDiv);
            }, index * 100);
        });
    }

    checkAnswer() {
        const userAnswer = parseInt(document.getElementById('answerInput').value);
        const problem = this.problems[this.currentProblemIndex];
        const correctAnswer = problem.set.length;

        const feedback = document.getElementById('feedback');
        this.totalAttempts++;

        if (userAnswer === correctAnswer) {
            // 정답
            feedback.textContent = `🎉 정답입니다! 집합 ${problem.setName}의 원소는 ${correctAnswer}개입니다.`;
            feedback.className = 'feedback correct';
            this.score++;

            // 빔 효과 강조
            this.beam.setCardinality(correctAnswer);

            // 자동으로 다음 문제로 (2초 후)
            setTimeout(() => {
                if (this.currentProblemIndex < this.problems.length - 1) {
                    this.nextProblem();
                } else {
                    this.showCompletionMessage();
                }
            }, 2000);

        } else if (isNaN(userAnswer)) {
            // 입력 없음
            feedback.textContent = '⚠️ 숫자를 입력해주세요!';
            feedback.className = 'feedback incorrect';
        } else {
            // 오답
            feedback.textContent = `❌ 틀렸습니다. 다시 한 번 세어보세요! (힌트: 시각적으로 표시된 원소를 세어보세요)`;
            feedback.className = 'feedback incorrect';

            // 입력 필드 초기화
            document.getElementById('answerInput').value = '';
            document.getElementById('answerInput').focus();
        }
    }

    nextProblem() {
        if (this.currentProblemIndex < this.problems.length - 1) {
            this.currentProblemIndex++;
            this.displayCurrentProblem();
        }
    }

    previousProblem() {
        if (this.currentProblemIndex > 0) {
            this.currentProblemIndex--;
            this.displayCurrentProblem();
        }
    }

    showCompletionMessage() {
        const feedback = document.getElementById('feedback');
        const accuracy = ((this.score / this.problems.length) * 100).toFixed(0);

        feedback.textContent = `🎓 모든 문제를 완료했습니다! 정확도: ${accuracy}% (${this.score}/${this.problems.length})`;
        feedback.className = 'feedback correct';

        // 처음부터 다시 시작 옵션
        setTimeout(() => {
            if (confirm('모든 문제를 완료했습니다! 처음부터 다시 시작하시겠습니까?')) {
                this.currentProblemIndex = 0;
                this.score = 0;
                this.totalAttempts = 0;
                this.displayCurrentProblem();
            }
        }, 2000);
    }
}

// 앱 시작
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CardinalityApp();
});
