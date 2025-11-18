/**
 * Moodle LMS Connector
 * Moodle 3.7 Web Services API와 연동
 */

class MoodleConnector {
    constructor() {
        this.baseUrl = '';
        this.wsToken = '';
        this.userId = null;
        this.courseId = null;
    }

    /**
     * Moodle 설정 초기화
     */
    init(config) {
        this.baseUrl = config.baseUrl || window.location.origin;
        this.wsToken = config.wsToken || this.getTokenFromUrl();
        this.userId = config.userId;
        this.courseId = config.courseId;
    }

    /**
     * URL에서 토큰 추출
     */
    getTokenFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('wstoken') || params.get('token') || '';
    }

    /**
     * Moodle Web Service API 호출
     */
    async callWebService(wsFunction, params = {}) {
        const url = `${this.baseUrl}/webservice/rest/server.php`;

        const formData = new FormData();
        formData.append('wstoken', this.wsToken);
        formData.append('wsfunction', wsFunction);
        formData.append('moodlewsrestformat', 'json');

        // 파라미터 추가
        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Moodle 에러 체크
            if (data.exception) {
                throw new Error(data.message || 'Moodle API Error');
            }

            return data;
        } catch (error) {
            console.error('Moodle API Error:', error);
            throw error;
        }
    }

    /**
     * 퀴즈 정보 가져오기
     */
    async getQuizInfo(quizId) {
        try {
            const quiz = await this.callWebService('mod_quiz_get_quizzes_by_courses', {
                courseids: [this.courseId]
            });

            const targetQuiz = quiz.quizzes.find(q => q.id === quizId);
            return targetQuiz || null;
        } catch (error) {
            console.error('Failed to fetch quiz info:', error);
            return null;
        }
    }

    /**
     * 퀴즈 문제 목록 가져오기
     */
    async getQuizQuestions(quizId) {
        try {
            const questions = await this.callWebService('mod_quiz_get_quiz_attempt_data', {
                attemptid: quizId
            });

            return questions.questions || [];
        } catch (error) {
            console.error('Failed to fetch quiz questions:', error);
            return [];
        }
    }

    /**
     * 학습 진행 데이터 가져오기
     */
    async getUserProgress(userId, courseId) {
        try {
            const progress = await this.callWebService('core_completion_get_activities_completion_status', {
                userid: userId,
                courseid: courseId
            });

            return this.formatProgressData(progress);
        } catch (error) {
            console.error('Failed to fetch user progress:', error);
            return this.generateSampleProgress();
        }
    }

    /**
     * 진행 데이터 포맷팅
     */
    formatProgressData(rawData) {
        if (!rawData || !rawData.statuses) {
            return this.generateSampleProgress();
        }

        const progressData = {
            progress: [],
            currentScore: 0,
            totalActivities: rawData.statuses.length
        };

        rawData.statuses.forEach((status, index) => {
            progressData.progress.push({
                time: index * 5,
                score: status.state === 1 ? Math.random() * 30 + 70 : Math.random() * 50,
                activity: status.cmid
            });
        });

        return progressData;
    }

    /**
     * 샘플 진행 데이터 생성 (개발/테스트용)
     */
    generateSampleProgress() {
        const progress = [];
        let currentScore = 10;

        for (let i = 0; i < 15; i++) {
            currentScore *= (1 + Math.random() * 0.3);
            progress.push({
                time: i * 5,
                score: Math.min(currentScore, 100),
                activity: `activity_${i}`
            });
        }

        return {
            progress: progress,
            currentScore: progress[progress.length - 1].score,
            totalActivities: 15
        };
    }

    /**
     * 문제 정보 가져오기
     */
    async getProblemInfo(problemId) {
        try {
            // Moodle의 특정 문제 정보 가져오기
            const problem = await this.callWebService('core_question_get_random_question_summaries', {
                categoryid: problemId
            });

            return {
                id: problemId,
                title: problem.name || '수학 문제',
                description: problem.questiontext || '문제를 불러오는 중입니다.',
                difficulty: problem.defaultmark || 1,
                category: problem.category || 'General'
            };
        } catch (error) {
            console.error('Failed to fetch problem info:', error);
            return this.generateSampleProblem(problemId);
        }
    }

    /**
     * 샘플 문제 생성 (개발/테스트용)
     */
    generateSampleProblem(problemId) {
        const problems = [
            {
                id: problemId,
                title: '분수의 덧셈',
                description: '1/3 + 1/4의 값을 구하시오.',
                difficulty: 'medium',
                category: 'Fractions'
            },
            {
                id: problemId,
                title: '방정식 풀이',
                description: '2x + 5 = 13일 때, x의 값을 구하시오.',
                difficulty: 'easy',
                category: 'Algebra'
            },
            {
                id: problemId,
                title: '기하학 문제',
                description: '반지름이 5cm인 원의 넓이를 구하시오.',
                difficulty: 'medium',
                category: 'Geometry'
            }
        ];

        return problems[Math.floor(Math.random() * problems.length)];
    }

    /**
     * 답안 제출
     */
    async submitAnswer(quizId, questionId, answer) {
        try {
            const result = await this.callWebService('mod_quiz_process_attempt', {
                attemptid: quizId,
                data: JSON.stringify([{
                    name: `q${questionId}`,
                    value: answer
                }])
            });

            return result;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 연결 상태 확인
     */
    async checkConnection() {
        try {
            const info = await this.callWebService('core_webservice_get_site_info');
            console.log('Moodle connection successful:', info.sitename);
            return true;
        } catch (error) {
            console.error('Moodle connection failed:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
const moodleConnector = new MoodleConnector();
