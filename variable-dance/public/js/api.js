/**
 * API Communication Module
 * PHP 백엔드와 통신하는 API 모듈
 */

const API = {
    baseURL: '../api',

    /**
     * API 호출 헬퍼
     */
    async call(endpoint, action, method = 'GET', data = null) {
        const url = `${this.baseURL}/${endpoint}.php?action=${action}`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (method === 'POST' && data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'API call failed');
            }

            return result.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * 모든 문제 가져오기
     */
    async getAllProblems() {
        return await this.call('problem-handler', 'get_all_problems');
    },

    /**
     * 특정 문제 가져오기
     */
    async getProblem(id) {
        const url = `${this.baseURL}/problem-handler.php?action=get_problem&id=${id}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },

    /**
     * 해집합 계산
     */
    async calculateSolution(problemId, variables) {
        return await this.call('problem-handler', 'calculate_solution', 'POST', {
            problem_id: problemId,
            variables: variables
        });
    },

    /**
     * 학습 세션 생성
     */
    async createSession(studentId, problemId) {
        return await this.call('problem-handler', 'create_session', 'POST', {
            student_id: studentId,
            problem_id: problemId
        });
    },

    /**
     * 변수 이동 이벤트 로깅
     */
    async logEvent(sessionId, variableName, oldValue, newValue, solutionBefore, solutionAfter) {
        return await this.call('problem-handler', 'log_event', 'POST', {
            session_id: sessionId,
            variable_name: variableName,
            old_value: oldValue,
            new_value: newValue,
            solution_before: solutionBefore,
            solution_after: solutionAfter
        });
    },

    /**
     * 세션 완료
     */
    async completeSession(sessionId, score) {
        return await this.call('problem-handler', 'complete_session', 'POST', {
            session_id: sessionId,
            score: score
        });
    },

    /**
     * Moodle 연결 테스트
     */
    async testMoodleConnection() {
        return await this.call('moodle-connector', 'test');
    },

    /**
     * Moodle에서 문제 가져오기
     */
    async getMoodleProblem(problemId) {
        const url = `${this.baseURL}/moodle-connector.php?action=get_problem&problem_id=${problemId}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.data;
    },

    /**
     * Moodle에 결과 제출
     */
    async submitToMoodle(userId, problemId, score, attempts) {
        return await this.call('moodle-connector', 'submit_result', 'POST', {
            user_id: userId,
            problem_id: problemId,
            score: score,
            attempts: attempts
        });
    }
};
