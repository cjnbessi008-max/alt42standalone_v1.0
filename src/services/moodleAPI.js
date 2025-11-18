/**
 * Moodle API 연동 서비스
 * Moodle 3.7과 통신하여 문제 정보를 가져오고 결과를 전송
 */

class MoodleAPI {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost/moodle';
        this.token = config.token || '';
        this.serviceName = config.serviceName || 'moodle_mobile_app';
        this.isConnected = false;

        // 로컬 모드 (Moodle 서버 없이 테스트)
        this.localMode = config.localMode !== false; // 기본값 true
    }

    /**
     * Moodle 서버 연결 테스트
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        if (this.localMode) {
            console.log('로컬 모드로 실행 중 (Moodle 서버 연결 안 함)');
            this.isConnected = true;
            return true;
        }

        try {
            const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.token,
                    wsfunction: 'core_webservice_get_site_info',
                    moodlewsrestformat: 'json'
                })
            });

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message);
            }

            this.isConnected = true;
            console.log('Moodle 서버 연결 성공:', data.sitename);
            return true;
        } catch (error) {
            console.error('Moodle 서버 연결 실패:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 문제 목록 가져오기
     * @param {number} courseId - 코스 ID
     * @param {number} quizId - 퀴즈 ID
     * @returns {Promise<Array>}
     */
    async getProblems(courseId = 1, quizId = 1) {
        if (this.localMode) {
            // 로컬 모드: 샘플 데이터 반환
            return this.getSampleProblems();
        }

        try {
            const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.token,
                    wsfunction: 'mod_quiz_get_quiz_data',
                    moodlewsrestformat: 'json',
                    quizid: quizId
                })
            });

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message);
            }

            return this.parseProblems(data);
        } catch (error) {
            console.error('문제 가져오기 실패:', error);
            // 에러 발생 시 샘플 데이터 반환
            return this.getSampleProblems();
        }
    }

    /**
     * 샘플 문제 데이터 (로컬 테스트용)
     * @returns {Array}
     */
    getSampleProblems() {
        return [
            {
                id: 1,
                name: '이차 함수의 넓이',
                description: '함수 y = x²의 그래프와 x축으로 둘러싸인 영역의 넓이를 구하세요. (x: -3 ~ 3)',
                function: 'x**2',
                xMin: -3,
                xMax: 3,
                difficulty: '쉬움',
                correctArea: 18,
                points: 10,
                category: 'integration'
            },
            {
                id: 2,
                name: '일차 함수의 넓이',
                description: '함수 y = 2x + 1의 그래프와 x축으로 둘러싸인 영역의 넓이를 구하세요. (x: 0 ~ 4)',
                function: '2*x + 1',
                xMin: 0,
                xMax: 4,
                difficulty: '쉬움',
                correctArea: 24,
                points: 8,
                category: 'integration'
            },
            {
                id: 3,
                name: '삼차 함수의 넓이',
                description: '함수 y = x³ - 2x의 그래프와 x축으로 둘러싸인 영역의 넓이를 구하세요. (x: -2 ~ 2)',
                function: 'x**3 - 2*x',
                xMin: -2,
                xMax: 2,
                difficulty: '보통',
                correctArea: 8,
                points: 15,
                category: 'integration'
            },
            {
                id: 4,
                name: '사인 함수의 넓이',
                description: '함수 y = sin(x) + 2의 그래프와 x축으로 둘러싸인 영역의 넓이를 구하세요. (x: 0 ~ 2π)',
                function: 'sin(x) + 2',
                xMin: 0,
                xMax: 6.28,
                difficulty: '보통',
                correctArea: 12.56,
                points: 20,
                category: 'trigonometry'
            }
        ];
    }

    /**
     * Moodle 응답 데이터를 문제 형식으로 변환
     * @param {Object} data - Moodle API 응답
     * @returns {Array}
     */
    parseProblems(data) {
        // Moodle 데이터 구조에 맞게 파싱
        // 실제 Moodle API 응답 형식에 따라 수정 필요
        if (!data.questions) {
            return this.getSampleProblems();
        }

        return data.questions.map(q => ({
            id: q.id,
            name: q.name,
            description: q.questiontext,
            function: q.customdata?.function || 'x**2',
            xMin: q.customdata?.xMin || -5,
            xMax: q.customdata?.xMax || 5,
            difficulty: q.customdata?.difficulty || '보통',
            correctArea: q.customdata?.correctArea || 0,
            points: q.maxmark || 10,
            category: q.category || 'integration'
        }));
    }

    /**
     * 답안 제출
     * @param {number} problemId - 문제 ID
     * @param {number} userId - 사용자 ID
     * @param {number} answer - 사용자 답안
     * @param {number} timeSpent - 소요 시간 (초)
     * @returns {Promise<Object>}
     */
    async submitAnswer(problemId, userId, answer, timeSpent) {
        const submissionData = {
            problemId,
            userId,
            answer,
            timeSpent,
            timestamp: new Date().toISOString()
        };

        if (this.localMode) {
            // 로컬 모드: 콘솔에만 출력
            console.log('답안 제출 (로컬 모드):', submissionData);
            return {
                success: true,
                message: '답안이 제출되었습니다.',
                data: submissionData
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.token,
                    wsfunction: 'mod_quiz_process_attempt',
                    moodlewsrestformat: 'json',
                    attemptid: problemId,
                    data: JSON.stringify(submissionData)
                })
            });

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message);
            }

            return {
                success: true,
                message: '답안이 제출되었습니다.',
                data: data
            };
        } catch (error) {
            console.error('답안 제출 실패:', error);
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    /**
     * 학습 진행률 저장
     * @param {number} userId - 사용자 ID
     * @param {Object} progressData - 진행률 데이터
     * @returns {Promise<Object>}
     */
    async saveProgress(userId, progressData) {
        if (this.localMode) {
            console.log('진행률 저장 (로컬 모드):', { userId, ...progressData });
            localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));
            return { success: true };
        }

        try {
            // Moodle API를 통한 진행률 저장
            const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.token,
                    wsfunction: 'core_user_update_user_preferences',
                    moodlewsrestformat: 'json',
                    preferences: JSON.stringify([{
                        name: `areapaint_progress`,
                        value: JSON.stringify(progressData),
                        userid: userId
                    }])
                })
            });

            const data = await response.json();
            return { success: !data.exception };
        } catch (error) {
            console.error('진행률 저장 실패:', error);
            return { success: false };
        }
    }

    /**
     * 학습 진행률 불러오기
     * @param {number} userId - 사용자 ID
     * @returns {Promise<Object>}
     */
    async loadProgress(userId) {
        if (this.localMode) {
            const saved = localStorage.getItem(`progress_${userId}`);
            return saved ? JSON.parse(saved) : null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    wstoken: this.token,
                    wsfunction: 'core_user_get_user_preferences',
                    moodlewsrestformat: 'json',
                    name: 'areapaint_progress',
                    userid: userId
                })
            });

            const data = await response.json();

            if (data.preferences && data.preferences.length > 0) {
                return JSON.parse(data.preferences[0].value);
            }

            return null;
        } catch (error) {
            console.error('진행률 불러오기 실패:', error);
            return null;
        }
    }
}

// 전역 객체로 노출
window.MoodleAPI = MoodleAPI;
