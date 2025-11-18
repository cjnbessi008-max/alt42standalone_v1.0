/**
 * Moodle LMS API 연동 클래스
 * Moodle 3.7의 Web Services API를 사용하여 문제 정보를 가져옵니다.
 */

class MoodleAPI {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '';
        this.token = config.token || '';
        this.wsFunction = config.wsFunction || 'core_webservice_get_site_info';
        this.isConnected = false;

        // 콜백
        this.onConnectionChange = config.onConnectionChange || (() => {});
        this.onDataReceived = config.onDataReceived || (() => {});
        this.onError = config.onError || (() => {});
    }

    /**
     * Moodle 서버에 연결 테스트
     */
    async connect(url, token) {
        this.baseUrl = url;
        this.token = token;

        try {
            const response = await this.callWebService('core_webservice_get_site_info');

            if (response && !response.exception) {
                this.isConnected = true;
                this.onConnectionChange(true, response);
                return {
                    success: true,
                    data: response
                };
            } else {
                throw new Error(response.message || 'Connection failed');
            }
        } catch (error) {
            this.isConnected = false;
            this.onConnectionChange(false, null);
            this.onError(error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Moodle Web Service 호출
     */
    async callWebService(functionName, params = {}) {
        if (!this.baseUrl || !this.token) {
            throw new Error('Moodle URL and token are required');
        }

        const url = new URL(`${this.baseUrl}/webservice/rest/server.php`);
        url.searchParams.append('wstoken', this.token);
        url.searchParams.append('wsfunction', functionName);
        url.searchParams.append('moodlewsrestformat', 'json');

        // 파라미터 추가
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message || 'Moodle API Error');
            }

            return data;
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * 퀴즈 문제 정보 가져오기
     * (Moodle의 mod_quiz 모듈 사용)
     */
    async getQuizData(quizId) {
        try {
            const quiz = await this.callWebService('mod_quiz_get_quiz_by_instance', {
                quizid: quizId
            });

            // 문제에서 3D 모델 정보 추출
            // (실제로는 Moodle의 커스텀 필드나 JSON 데이터에서 가져와야 함)
            const modelData = this.parseModelDataFromQuiz(quiz);

            this.onDataReceived(modelData);
            return modelData;
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * 퀴즈 데이터에서 3D 모델 정보 파싱
     * (예시 구현 - 실제 구조에 맞게 수정 필요)
     */
    parseModelDataFromQuiz(quiz) {
        // Moodle 퀴즈 데이터 구조 예시:
        // {
        //   "quiz": {
        //     "intro": "3D 모델 문제",
        //     "introformat": 1,
        //     "questions": [{
        //       "questiontext": "다음 3D 모델의 단면을 확인하세요",
        //       "customdata": "{\"modelType\":\"sphere\",\"clipPosition\":0.5}"
        //     }]
        //   }
        // }

        const defaultData = {
            modelType: 'sphere',
            clipPosition: 0,
            clipRotationX: 0,
            clipRotationY: 0,
            glowColor: '#00ffff',
            glowIntensity: 2.0,
            glowThickness: 0.1
        };

        try {
            // quiz 데이터에서 커스텀 데이터 추출
            if (quiz && quiz.quiz && quiz.quiz.intro) {
                // intro 필드에 JSON 형태로 모델 데이터가 포함되어 있다고 가정
                const jsonMatch = quiz.quiz.intro.match(/\{.*\}/);
                if (jsonMatch) {
                    const customData = JSON.parse(jsonMatch[0]);
                    return { ...defaultData, ...customData };
                }
            }
        } catch (error) {
            console.warn('Failed to parse model data from quiz:', error);
        }

        return defaultData;
    }

    /**
     * 학생 답안 제출
     */
    async submitAnswer(quizId, attemptId, answers) {
        try {
            const result = await this.callWebService('mod_quiz_process_attempt', {
                attemptid: attemptId,
                data: JSON.stringify(answers),
                finishattempt: false
            });

            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.onError(error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 연결 해제
     */
    disconnect() {
        this.isConnected = false;
        this.baseUrl = '';
        this.token = '';
        this.onConnectionChange(false, null);
    }

    /**
     * 연결 상태 확인
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

/**
 * Moodle 설정을 로컬 스토리지에서 로드
 */
function loadMoodleConfig() {
    try {
        const config = localStorage.getItem('moodleConfig');
        if (config) {
            return JSON.parse(config);
        }
    } catch (error) {
        console.error('Failed to load Moodle config:', error);
    }
    return {
        baseUrl: '',
        token: ''
    };
}

/**
 * Moodle 설정을 로컬 스토리지에 저장
 */
function saveMoodleConfig(config) {
    try {
        localStorage.setItem('moodleConfig', JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Failed to save Moodle config:', error);
        return false;
    }
}

/**
 * 데모용 Mock 데이터
 */
const MOCK_QUIZ_DATA = {
    quiz1: {
        modelType: 'sphere',
        clipPosition: 0.5,
        clipRotationX: 45,
        clipRotationY: 0,
        glowColor: '#00ffff',
        glowIntensity: 2.5,
        glowThickness: 0.15
    },
    quiz2: {
        modelType: 'torus',
        clipPosition: 0,
        clipRotationX: 0,
        clipRotationY: 45,
        glowColor: '#ff00ff',
        glowIntensity: 3.0,
        glowThickness: 0.2
    },
    quiz3: {
        modelType: 'knot',
        clipPosition: -0.5,
        clipRotationX: 30,
        clipRotationY: 30,
        glowColor: '#ffff00',
        glowIntensity: 2.0,
        glowThickness: 0.1
    }
};

/**
 * 데모 모드: Mock 데이터 반환
 */
function getMockQuizData(quizId = 'quiz1') {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_QUIZ_DATA[quizId] || MOCK_QUIZ_DATA.quiz1);
        }, 500);
    });
}
