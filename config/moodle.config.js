/**
 * Moodle 연동 설정
 *
 * 사용법:
 * 1. Moodle 서버의 관리자 페이지에서 웹 서비스를 활성화합니다.
 * 2. 새로운 웹 서비스 토큰을 생성합니다.
 * 3. 아래 설정을 업데이트합니다.
 */

const MoodleConfig = {
    // Moodle 서버 URL (끝에 /를 제거하세요)
    baseUrl: 'http://localhost/moodle',

    // 웹 서비스 토큰 (Moodle 관리자 페이지에서 생성)
    token: 'YOUR_MOODLE_TOKEN_HERE',

    // 웹 서비스 이름
    serviceName: 'moodle_mobile_app',

    // 로컬 모드 (true: Moodle 서버 없이 테스트, false: 실제 Moodle 연동)
    localMode: true,

    // 기본 코스 ID
    defaultCourseId: 1,

    // 기본 퀴즈 ID
    defaultQuizId: 1,

    // API 요청 타임아웃 (밀리초)
    timeout: 10000,

    // 디버그 모드
    debug: true
};

// Node.js 환경
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleConfig;
}

// 브라우저 환경
if (typeof window !== 'undefined') {
    window.MoodleConfig = MoodleConfig;
}
