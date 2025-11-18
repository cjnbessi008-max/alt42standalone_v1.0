/**
 * Moodle API Connector
 * Moodle LMS와 통신하여 문제 정보를 가져옴
 */

class MoodleAPI {
    constructor(config = {}) {
        this.apiEndpoint = config.apiEndpoint || '/api/connector.php';
        this.moodleUrl = config.moodleUrl || '';
        this.token = config.token || '';
        this.courseId = config.courseId || null;
        this.activityId = config.activityId || null;
    }

    /**
     * Moodle에서 비율 문제 데이터 가져오기
     */
    async fetchRatioProblem(problemId) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=get_problem&id=${problemId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.parseProblemData(data);
        } catch (error) {
            console.error('Error fetching problem from Moodle:', error);
            throw error;
        }
    }

    /**
     * 현재 활동에서 문제 목록 가져오기
     */
    async fetchProblems(activityId = null) {
        const id = activityId || this.activityId;

        try {
            const response = await fetch(`${this.apiEndpoint}?action=get_problems&activity_id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.problems || [];
        } catch (error) {
            console.error('Error fetching problems list:', error);
            throw error;
        }
    }

    /**
     * 학생 응답 제출
     */
    async submitAnswer(problemId, answer) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=submit_answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    problem_id: problemId,
                    answer: answer,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * URL 파라미터에서 Moodle 정보 추출
     */
    extractMoodleParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            courseId: params.get('course_id'),
            activityId: params.get('activity_id'),
            problemId: params.get('problem_id'),
            userId: params.get('user_id'),
            token: params.get('token')
        };
    }

    /**
     * 문제 데이터 파싱
     */
    parseProblemData(data) {
        // Moodle에서 받은 데이터를 앱에서 사용할 형식으로 변환
        return {
            id: data.id,
            type: data.type || 'ratio',
            ratioA: parseInt(data.ratio_a) || 2,
            ratioB: parseInt(data.ratio_b) || 3,
            question: data.question || '',
            description: data.description || '',
            hints: data.hints || [],
            correctAnswer: data.correct_answer,
            difficulty: data.difficulty || 'medium',
            metadata: data.metadata || {}
        };
    }

    /**
     * 로컬 스토리지에서 캐시된 데이터 가져오기
     */
    getCachedProblem(problemId) {
        try {
            const cached = localStorage.getItem(`problem_${problemId}`);
            if (cached) {
                const data = JSON.parse(cached);
                // 캐시가 1시간 이내인지 확인
                if (Date.now() - data.timestamp < 3600000) {
                    return data.problem;
                }
            }
        } catch (error) {
            console.error('Error reading cache:', error);
        }
        return null;
    }

    /**
     * 문제 데이터 캐싱
     */
    cacheProblem(problemId, problemData) {
        try {
            localStorage.setItem(`problem_${problemId}`, JSON.stringify({
                problem: problemData,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error caching problem:', error);
        }
    }

    /**
     * 데모 데이터 생성 (Moodle 없이 테스트용)
     */
    generateDemoData() {
        const problems = [
            {
                id: 1,
                type: 'ratio',
                ratio_a: 2,
                ratio_b: 3,
                question: '피자를 2:3 비율로 나누어 보세요',
                description: '두 명의 친구가 피자를 2:3 비율로 나누어 먹습니다.',
                hints: ['먼저 전체를 5등분 해보세요', '2:3은 5조각 중 2조각과 3조각입니다'],
                difficulty: 'easy'
            },
            {
                id: 2,
                type: 'ratio',
                ratio_a: 3,
                ratio_b: 4,
                question: '물과 주스를 3:4 비율로 섞어보세요',
                description: '건강한 음료를 만들기 위해 물과 주스를 섞습니다.',
                difficulty: 'medium'
            },
            {
                id: 3,
                type: 'ratio',
                ratio_a: 5,
                ratio_b: 2,
                question: '남학생과 여학생의 비율은 5:2입니다',
                description: '우리 반의 남녀 학생 비율을 나타냅니다.',
                difficulty: 'medium'
            }
        ];

        return problems;
    }

    /**
     * 랜덤 비율 문제 생성
     */
    generateRandomProblem() {
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 5) + 1;

        return {
            id: Date.now(),
            type: 'ratio',
            ratio_a: a,
            ratio_b: b,
            question: `비율 ${a}:${b}을 표현해보세요`,
            description: '스프링의 길이로 비율을 이해해봅시다.',
            difficulty: 'random'
        };
    }
}

/**
 * Moodle 이벤트 리스너
 */
class MoodleEventHandler {
    constructor() {
        this.listeners = {};
    }

    /**
     * 이벤트 등록
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * 이벤트 발생
     */
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                callback(data);
            });
        }
    }

    /**
     * PostMessage를 통한 Moodle과의 통신 리스닝
     */
    listenToMoodle() {
        window.addEventListener('message', (event) => {
            // 보안: origin 확인 (실제 배포 시 Moodle URL로 제한)
            // if (event.origin !== 'https://your-moodle-site.com') return;

            if (event.data && event.data.type === 'moodle_problem') {
                this.emit('problem_received', event.data.problem);
            }

            if (event.data && event.data.type === 'moodle_command') {
                this.emit('command_received', event.data.command);
            }
        });
    }

    /**
     * Moodle로 메시지 전송
     */
    sendToMoodle(type, data) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: type,
                data: data,
                source: 'ratio_spring_app'
            }, '*'); // 실제 배포 시 특정 origin으로 제한
        }
    }
}
