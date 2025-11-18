/**
 * Magnitude Sound - Moodle API 통신
 * Moodle 서버와 데이터 송수신
 */

class MoodleAPI {
    constructor(baseURL = '../api') {
        this.baseURL = baseURL;
        this.currentQuestion = null;
        this.userId = null;
        this.attemptId = null;
    }

    /**
     * API 요청 헬퍼
     *
     * @param {string} endpoint - API 엔드포인트
     * @param {Object} options - fetch 옵션
     * @returns {Promise<Object>} 응답 데이터
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;

        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * 문제 정보 조회 (question_id)
     *
     * @param {number} questionId - 문제 ID
     * @returns {Promise<Object>} 문제 데이터
     */
    async getQuestion(questionId) {
        const data = await this.request(`get_problems.php?question_id=${questionId}`);
        this.currentQuestion = data;
        return data;
    }

    /**
     * Quiz의 모든 문제 조회
     *
     * @param {number} quizId - Quiz ID
     * @returns {Promise<Object>} 문제 목록
     */
    async getQuizQuestions(quizId) {
        return await this.request(`get_problems.php?quiz_id=${quizId}`);
    }

    /**
     * 코스의 벡터 문제 조회
     *
     * @param {number} courseId - 코스 ID
     * @returns {Promise<Object>} 문제 목록
     */
    async getCourseQuestions(courseId) {
        return await this.request(`get_problems.php?course_id=${courseId}`);
    }

    /**
     * 답안 제출
     *
     * @param {number} questionId - 문제 ID
     * @param {number} userId - 사용자 ID
     * @param {Object} vector - 벡터 데이터 {x, y}
     * @param {number} attemptId - 시도 ID (선택)
     * @returns {Promise<Object>} 제출 결과
     */
    async submitAnswer(questionId, userId, vector, attemptId = null) {
        const payload = {
            question_id: questionId,
            user_id: userId,
            vector_x: vector.x,
            vector_y: vector.y,
            attempt_id: attemptId
        };

        return await this.request('submit_answer.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * 사용자 ID 설정
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * 시도 ID 설정
     */
    setAttemptId(attemptId) {
        this.attemptId = attemptId;
    }

    /**
     * URL 파라미터에서 설정 자동 로드
     */
    loadFromURLParams() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('user_id')) {
            this.userId = parseInt(params.get('user_id'));
        }

        if (params.has('attempt_id')) {
            this.attemptId = parseInt(params.get('attempt_id'));
        }

        if (params.has('question_id')) {
            const questionId = parseInt(params.get('question_id'));
            this.getQuestion(questionId)
                .then(question => {
                    console.log('✅ Question loaded:', question);
                    this.displayQuestion(question);
                })
                .catch(error => {
                    console.error('❌ Failed to load question:', error);
                });
        }

        if (params.has('quiz_id')) {
            const quizId = parseInt(params.get('quiz_id'));
            this.getQuizQuestions(quizId)
                .then(data => {
                    console.log(`✅ Quiz questions loaded: ${data.total_questions} questions`);
                })
                .catch(error => {
                    console.error('❌ Failed to load quiz questions:', error);
                });
        }
    }

    /**
     * 문제를 UI에 표시
     *
     * @param {Object} question - 문제 데이터
     */
    displayQuestion(question) {
        const problemTextEl = document.getElementById('problem-text');
        if (problemTextEl && question.question_text) {
            problemTextEl.innerHTML = question.question_text;
        }

        // 벡터 정보가 있으면 표시
        if (question.vector_info && question.vector_info.has_vector) {
            console.log('📐 Vector info:', question.vector_info);

            // 문제 정보 배지 업데이트
            const badges = document.querySelectorAll('.badge');
            if (question.vector_info.magnitude_range && badges[0]) {
                const range = question.vector_info.magnitude_range;
                badges[0].textContent = `크기: ${range.min}~${range.max}`;
            }
            if (question.vector_info.angle_range && badges[1]) {
                const range = question.vector_info.angle_range;
                badges[1].textContent = `방향: ${range.min}°~${range.max}°`;
            }
        }
    }

    /**
     * 현재 문제 가져오기
     */
    getCurrentQuestion() {
        return this.currentQuestion;
    }
}

// 전역 변수로 내보내기
window.MoodleAPI = MoodleAPI;
