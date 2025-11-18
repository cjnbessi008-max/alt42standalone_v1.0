/**
 * Moodle API Integration
 * Moodle LMS와 통신하여 문제 정보를 가져오는 모듈
 */

class MoodleAPI {
    constructor(baseUrl = 'php/api.php') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    /**
     * API 요청 헬퍼 함수
     * @param {string} endpoint - API 엔드포인트
     * @param {object} data - 전송할 데이터
     * @returns {Promise} - 응답 데이터
     */
    async request(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}?action=${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Moodle에서 문제 목록 가져오기
     * @param {number} courseId - 코스 ID
     * @returns {Promise<Array>} - 문제 목록
     */
    async getProblems(courseId = null) {
        try {
            const data = courseId ? { course_id: courseId } : {};
            const result = await this.request('getProblems', data);
            return result.problems || [];
        } catch (error) {
            console.error('Failed to fetch problems:', error);
            // 오류 시 샘플 문제 반환
            return this.getSampleProblems();
        }
    }

    /**
     * 특정 문제 가져오기
     * @param {number} problemId - 문제 ID
     * @returns {Promise<object>} - 문제 데이터
     */
    async getProblem(problemId) {
        try {
            const result = await this.request('getProblem', { problem_id: problemId });
            return result.problem || null;
        } catch (error) {
            console.error('Failed to fetch problem:', error);
            return null;
        }
    }

    /**
     * 학생 답안 제출
     * @param {number} problemId - 문제 ID
     * @param {string} answer - 학생의 답안 ('ge' 또는 'le')
     * @param {number} studentId - 학생 ID
     * @returns {Promise<object>} - 제출 결과
     */
    async submitAnswer(problemId, answer, studentId) {
        try {
            const result = await this.request('submitAnswer', {
                problem_id: problemId,
                answer: answer,
                student_id: studentId,
                timestamp: new Date().toISOString()
            });
            return result;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 학생 진행 상황 가져오기
     * @param {number} studentId - 학생 ID
     * @returns {Promise<object>} - 진행 상황 데이터
     */
    async getProgress(studentId) {
        try {
            const result = await this.request('getProgress', { student_id: studentId });
            return result.progress || { score: 0, total_problems: 0, correct: 0 };
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            return { score: 0, total_problems: 0, correct: 0 };
        }
    }

    /**
     * 샘플 문제 생성 (Moodle 연결 실패 시 사용)
     * @returns {Array} - 샘플 문제 배열
     */
    getSampleProblems() {
        return [
            {
                id: 1,
                left_number: 5,
                right_number: 3,
                correct_answer: 'ge',
                description: '5는 3보다 크거나 같습니까?',
                difficulty: 'easy'
            },
            {
                id: 2,
                left_number: 2,
                right_number: 7,
                correct_answer: 'le',
                description: '2는 7보다 작거나 같습니까?',
                difficulty: 'easy'
            },
            {
                id: 3,
                left_number: 10,
                right_number: 10,
                correct_answer: 'ge',
                description: '10은 10과 같거나 큽니까?',
                difficulty: 'medium'
            },
            {
                id: 4,
                left_number: 8,
                right_number: 4,
                correct_answer: 'ge',
                description: '8은 4보다 크거나 같습니까?',
                difficulty: 'easy'
            },
            {
                id: 5,
                left_number: 3,
                right_number: 9,
                correct_answer: 'le',
                description: '3은 9보다 작거나 같습니까?',
                difficulty: 'easy'
            },
            {
                id: 6,
                left_number: 15,
                right_number: 12,
                correct_answer: 'ge',
                description: '15는 12보다 크거나 같습니까?',
                difficulty: 'medium'
            },
            {
                id: 7,
                left_number: 6,
                right_number: 6,
                correct_answer: 'le',
                description: '6은 6과 같거나 작습니까?',
                difficulty: 'medium'
            },
            {
                id: 8,
                left_number: 20,
                right_number: 18,
                correct_answer: 'ge',
                description: '20은 18보다 크거나 같습니까?',
                difficulty: 'hard'
            }
        ];
    }

    /**
     * 랜덤 문제 생성
     * @param {string} difficulty - 난이도 ('easy', 'medium', 'hard')
     * @returns {object} - 생성된 문제
     */
    generateRandomProblem(difficulty = 'easy') {
        let maxNumber;
        switch (difficulty) {
            case 'easy':
                maxNumber = 10;
                break;
            case 'medium':
                maxNumber = 20;
                break;
            case 'hard':
                maxNumber = 50;
                break;
            default:
                maxNumber = 10;
        }

        const leftNumber = Math.floor(Math.random() * maxNumber) + 1;
        const rightNumber = Math.floor(Math.random() * maxNumber) + 1;
        const correctAnswer = leftNumber >= rightNumber ? 'ge' : 'le';

        return {
            id: Date.now(),
            left_number: leftNumber,
            right_number: rightNumber,
            correct_answer: correctAnswer,
            description: `${leftNumber}은(는) ${rightNumber}보다 크거나 같습니까? 작거나 같습니까?`,
            difficulty: difficulty
        };
    }
}

// 전역 인스턴스 생성
const moodleAPI = new MoodleAPI();
