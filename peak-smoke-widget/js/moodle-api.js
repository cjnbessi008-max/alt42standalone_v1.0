/**
 * Moodle API Integration Module
 * Moodle 3.7 + PHP 7.1.9 + MySQL 5.7 환경과 연동
 */

class MoodleAPI {
    constructor(baseUrl = '', token = '') {
        this.baseUrl = baseUrl;
        this.token = token;
        this.wsFunction = 'webservice/rest/server.php';
    }

    /**
     * Moodle Web Service API 호출
     * @param {string} functionName - Moodle 함수명
     * @param {object} params - 파라미터
     * @returns {Promise<object>} API 응답
     */
    async call(functionName, params = {}) {
        if (!this.baseUrl || !this.token) {
            console.warn('Moodle API URL 또는 토큰이 설정되지 않았습니다. 데모 데이터를 사용합니다.');
            return this.getMockData(functionName, params);
        }

        const url = new URL(this.wsFunction, this.baseUrl);
        url.searchParams.append('wstoken', this.token);
        url.searchParams.append('wsfunction', functionName);
        url.searchParams.append('moodlewsrestformat', 'json');

        // 파라미터 추가
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message || 'Moodle API 오류');
            }

            return data;
        } catch (error) {
            console.error('Moodle API 호출 실패:', error);
            // 실패 시 목 데이터 반환
            return this.getMockData(functionName, params);
        }
    }

    /**
     * 문제 정보 가져오기
     * @param {string} problemId - 문제 ID
     * @returns {Promise<object>} 문제 데이터
     */
    async getProblem(problemId) {
        return await this.call('mod_quiz_get_quiz_question', {
            questionid: problemId
        });
    }

    /**
     * 퀴즈 정보 가져오기
     * @param {string} quizId - 퀴즈 ID
     * @returns {Promise<object>} 퀴즈 데이터
     */
    async getQuiz(quizId) {
        return await this.call('mod_quiz_get_quizzes_by_courses', {
            courseids: [quizId]
        });
    }

    /**
     * 수학 문제 데이터 파싱
     * @param {object} problemData - Moodle 문제 데이터
     * @returns {object} 파싱된 수학 문제
     */
    parseMathProblem(problemData) {
        // Moodle의 문제 텍스트에서 수학 함수 추출
        const questionText = problemData.questiontext || '';

        // LaTeX 또는 일반 텍스트에서 함수 추출
        const functionPattern = /f\(x\)\s*=\s*([^<\n]+)/i;
        const match = questionText.match(functionPattern);

        let functionStr = 'x*x - 4*x + 3'; // 기본값
        if (match && match[1]) {
            functionStr = this.convertLatexToJS(match[1].trim());
        }

        return {
            id: problemData.id,
            name: problemData.name || '수학 문제',
            question: questionText,
            function: functionStr,
            range: this.extractRange(questionText) || { min: -2, max: 6 },
            category: problemData.category || 'calculus'
        };
    }

    /**
     * LaTeX 수식을 JavaScript로 변환
     * @param {string} latex - LaTeX 수식
     * @returns {string} JavaScript 표현식
     */
    convertLatexToJS(latex) {
        let js = latex;

        // 간단한 변환 규칙
        js = js.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))');
        js = js.replace(/\^(\d+)/g, '**$1');
        js = js.replace(/\^{([^}]+)}/g, '**($1)');
        js = js.replace(/\\sqrt\{([^}]+)\}/g, 'Math.sqrt($1)');
        js = js.replace(/\\sin/g, 'Math.sin');
        js = js.replace(/\\cos/g, 'Math.cos');
        js = js.replace(/\\tan/g, 'Math.tan');
        js = js.replace(/\\pi/g, 'Math.PI');
        js = js.replace(/\\cdot/g, '*');
        js = js.replace(/\s+/g, '');

        return js;
    }

    /**
     * 문제 텍스트에서 범위 추출
     * @param {string} text - 문제 텍스트
     * @returns {object|null} {min, max}
     */
    extractRange(text) {
        const rangePattern = /\[(-?\d+),\s*(-?\d+)\]/;
        const match = text.match(rangePattern);

        if (match) {
            return {
                min: parseFloat(match[1]),
                max: parseFloat(match[2])
            };
        }

        return null;
    }

    /**
     * 목 데이터 생성 (데모용)
     * @param {string} functionName - 함수명
     * @param {object} params - 파라미터
     * @returns {object} 목 데이터
     */
    getMockData(functionName, params) {
        const mockProblems = {
            '12345': {
                id: '12345',
                name: '이차함수의 극값',
                questiontext: '함수 f(x) = x^2 - 4x + 3의 극값을 구하시오. 범위는 [-2, 6]입니다.',
                function: 'x*x - 4*x + 3',
                range: { min: -2, max: 6 },
                category: 'calculus'
            },
            '12346': {
                id: '12346',
                name: '삼차함수의 극값',
                questiontext: '함수 f(x) = x^3 - 6x^2 + 9x + 1의 극값을 구하시오. 범위는 [-1, 5]입니다.',
                function: 'x*x*x - 6*x*x + 9*x + 1',
                range: { min: -1, max: 5 },
                category: 'calculus'
            },
            '12347': {
                id: '12347',
                name: '삼각함수의 극값',
                questiontext: '함수 f(x) = Math.sin(x) + Math.cos(x)의 극값을 구하시오. 범위는 [0, 2*Math.PI]입니다.',
                function: 'Math.sin(x) + Math.cos(x)',
                range: { min: 0, max: 2 * Math.PI },
                category: 'trigonometry'
            }
        };

        const problemId = params.questionid || params.problemId || '12345';
        return mockProblems[problemId] || mockProblems['12345'];
    }

    /**
     * 학습자 진행도 전송
     * @param {string} userId - 사용자 ID
     * @param {string} problemId - 문제 ID
     * @param {object} progressData - 진행도 데이터
     */
    async submitProgress(userId, problemId, progressData) {
        return await this.call('core_grades_update_grades', {
            source: 'peak_smoke_widget',
            courseid: problemId,
            component: 'mod_quiz',
            activityid: problemId,
            itemnumber: 0,
            grades: [{
                studentid: userId,
                grade: progressData.score,
                feedback: JSON.stringify(progressData)
            }]
        });
    }

    /**
     * 연결 상태 확인
     * @returns {Promise<boolean>} 연결 여부
     */
    async checkConnection() {
        if (!this.baseUrl || !this.token) {
            return false;
        }

        try {
            const result = await this.call('core_webservice_get_site_info');
            return !!result.sitename;
        } catch (error) {
            return false;
        }
    }
}

// 전역 인스턴스
window.moodleAPI = new MoodleAPI();

// 연결 상태 업데이트 함수
async function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    const isConnected = await window.moodleAPI.checkConnection();

    if (isConnected) {
        statusElement.classList.remove('disconnected');
        statusElement.title = 'Moodle 연결됨';
    } else {
        statusElement.classList.add('disconnected');
        statusElement.title = '데모 모드 (Moodle 미연결)';
    }
}

// 페이지 로드 시 연결 확인
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        updateConnectionStatus();
        // 30초마다 연결 상태 확인
        setInterval(updateConnectionStatus, 30000);
    });
}
