import { MoodleApiConfig } from '../types'

/**
 * Moodle API 설정 예제
 *
 * 실제 사용 시:
 * 1. 이 파일을 moodle.config.ts로 복사
 * 2. 실제 Moodle 정보로 변경
 * 3. .gitignore에 moodle.config.ts 추가 (보안)
 */

export const moodleConfig: MoodleApiConfig = {
  // Moodle 서버 URL
  baseUrl: 'https://your-moodle-site.com',

  // Moodle Web Service Token
  // Moodle 관리자 페이지에서 생성:
  // Site administration > Plugins > Web services > Manage tokens
  token: 'your-web-service-token-here',

  // 코스 ID
  courseId: '1',
}

/**
 * Moodle Web Service 활성화 방법:
 *
 * 1. Moodle 관리자로 로그인
 * 2. Site administration > Advanced features
 *    - "Enable web services" 체크
 *
 * 3. Site administration > Plugins > Web services > Overview
 *    - 모든 단계 완료
 *
 * 4. Site administration > Plugins > Web services > External services
 *    - 새 서비스 생성
 *    - 필요한 함수 추가:
 *      * mod_quiz_get_attempt_data
 *      * mod_quiz_get_user_attempts
 *      * core_completion_get_activities_completion_status
 *
 * 5. Site administration > Plugins > Web services > Manage tokens
 *    - 사용자 및 서비스 선택
 *    - 토큰 생성
 *
 * 6. 생성된 토큰을 위 config에 입력
 */

/**
 * 필요한 Moodle 권한:
 * - mod/quiz:attempt
 * - mod/quiz:viewreports
 * - moodle/course:viewparticipants
 * - webservice/rest:use
 */

/**
 * MySQL 데이터베이스 정보 (참고용):
 * - MySQL 5.7
 * - 주요 테이블:
 *   * mdl_quiz: 퀴즈 정보
 *   * mdl_quiz_attempts: 퀴즈 시도 기록
 *   * mdl_question_attempts: 문제별 시도
 *   * mdl_user: 사용자 정보
 *   * mdl_course: 코스 정보
 */

/**
 * PHP 버전: 7.1.9
 * Moodle 버전: 3.7
 */
