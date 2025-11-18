# Infinity Breath - LMS 연동 학습 앱

무한수열을 숨결처럼 표현하는 **Infinity Breath** 애니메이션을 적용한 LMS 연동 웹 애플리케이션입니다.

## 🌟 주요 특징

### Infinity Breath 애니메이션
- **무한대 기호 (∞)** 가 마치 숨을 쉬는 것처럼 자연스럽게 커졌다 작아지는 애니메이션
- **3가지 동시 애니메이션 효과**:
  1. **Scale 변화**: 1.0 ↔ 1.2 크기로 부드럽게 변화 (4초 주기)
  2. **Glow 효과**: 빛나는 그림자 효과가 숨쉬기에 맞춰 변화
  3. **Subtle Rotation**: 미묘한 회전 효과 (-2° ↔ 2°, 8초 주기)

- **배경 그라데이션**: 회전하는 방사형 그라데이션 배경 (10초 주기)
- **부드러운 전환**: `ease-in-out` 타이밍 함수로 자연스러운 움직임
- **무한 반복**: 연속적인 애니메이션으로 생동감 표현

## 📱 시스템 요구사항

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ 지원
- CSS3 애니메이션 지원

## 🚀 설치 및 실행

### 1. 기본 실행 (로컬 개발)

```bash
# 프로젝트 디렉토리로 이동
cd /home/user/alt42standalone_v1.0

# 간단한 HTTP 서버 실행 (Python 3)
python3 -m http.server 8000

# 또는 PHP 내장 서버
php -S localhost:8000

# 브라우저에서 열기
open http://localhost:8000
```

### 2. Moodle 연동 설정

#### Moodle Web Service 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리** 이동
3. **웹 서비스 활성화** 체크
4. **REST 프로토콜 활성화**

#### 토큰 생성
1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. 새 토큰 생성
3. `app.js` 파일의 `LMS_CONFIG.wsToken`에 토큰 입력

```javascript
const LMS_CONFIG = {
    apiEndpoint: '/moodle/webservice/rest/server.php',
    wsToken: 'YOUR_TOKEN_HERE', // 여기에 토큰 입력
    format: 'json'
};
```

### 3. MySQL 데이터베이스 설정

```sql
-- 데이터베이스 생성
CREATE DATABASE lms_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON lms_app.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📐 화면 구성

### 가상 스마트폰 화면 (375px × 667px)
- **위치**: 우측 하단에 배치
- **크기**: iPhone 8/SE 기준 (375×667)
- **특징**: 실제 스마트폰과 유사한 프레임 디자인

### UI 구성요소
1. **상단 헤더**
   - 앱 타이틀
   - 시간 및 배터리 상태 표시

2. **Infinity Breath 섹션** ✨
   - 무한대 기호 애니메이션
   - "무한한 학습의 여정" 라벨

3. **학습 모듈 정보**
   - 현재 학습 중인 모듈명
   - 모듈 설명
   - 진행률 바 (애니메이션 포함)

4. **학습 상태**
   - 현재 상태 (학습 중)
   - 완료한 문제 수

5. **하단 네비게이션**
   - 홈, 학습, 진행상황, 설정

## 🎮 인터랙션 기능

### 사용자 인터랙션
- **무한대 기호 클릭**: 애니메이션 일시정지/재생
- **모듈 카드 클릭**: 다음 문제 로드 (진행도 증가)
- **네비게이션 버튼**: 페이지 전환

### 자동 기능
- **실시간 시간 업데이트**: 1분마다 자동 갱신
- **진행률 동기화**: LMS 데이터와 자동 동기화
- **애니메이션 자동 재생**: 페이지 로드 시 자동 시작

## 🛠️ 개발자 모드

브라우저 콘솔에서 다음 명령어로 앱을 제어할 수 있습니다:

```javascript
// 애니메이션 속도 조절 (2배속)
appControls.setSpeed(2);

// 진행도 직접 설정
appControls.setProgress(15);

// 애니메이션 토글
appControls.toggle();

// 데이터베이스 동기화
await appControls.sync();

// 성공 애니메이션 표시
appControls.success();
```

## 📂 파일 구조

```
alt42standalone_v1.0/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일 및 애니메이션 정의
├── app.js              # 앱 로직 및 LMS 연동
├── README.md           # 이 파일
└── tasks/              # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 🎨 애니메이션 커스터마이징

### 애니메이션 속도 변경
`styles.css`에서 애니메이션 duration 수정:

```css
.infinity-symbol {
    animation:
        infinity-breath 4s ease-in-out infinite,  /* 4s → 원하는 시간 */
        glow-pulse 4s ease-in-out infinite,
        subtle-rotate 8s ease-in-out infinite;
}
```

### 색상 변경
그라데이션 색상 커스터마이징:

```css
.infinity-symbol {
    background: linear-gradient(
        135deg,
        #667eea 0%,      /* 시작 색상 */
        #764ba2 50%,     /* 중간 색상 */
        #f093fb 100%     /* 끝 색상 */
    );
}
```

### 크기 변경
Scale 범위 조절:

```css
@keyframes infinity-breath {
    0%, 100% {
        transform: scale(1);    /* 최소 크기 */
    }
    50% {
        transform: scale(1.2);  /* 최대 크기 (1.2 → 원하는 크기) */
    }
}
```

## 🔌 LMS API 연동

### 지원하는 Moodle API
- `core_course_get_contents`: 코스 컨텐츠 가져오기
- `mod_quiz_get_quizzes_by_courses`: 퀴즈 정보 조회
- `mod_quiz_get_attempt_summary`: 시도 요약 정보
- `core_user_get_users_by_field`: 사용자 정보 조회

### API 호출 예시
```javascript
// LMS에서 문제 데이터 가져오기
const data = await app.lms.fetchProblemData(moduleId);

// 답안 제출
const result = await app.lms.submitAnswer(problemId, answer);

// 데이터베이스 동기화
await app.lms.syncWithDatabase();
```

## 🌐 브라우저 호환성

| 브라우저 | 최소 버전 | 상태 |
|---------|---------|------|
| Chrome  | 60+     | ✅ 완전 지원 |
| Firefox | 55+     | ✅ 완전 지원 |
| Safari  | 11+     | ✅ 완전 지원 |
| Edge    | 79+     | ✅ 완전 지원 |
| IE      | -       | ❌ 미지원 |

## 📱 반응형 디자인

- **데스크톱**: 우측 하단에 스마트폰 화면 표시
- **모바일**: 화면 중앙에 전체 크기로 표시
- **브레이크포인트**: 768px

## 🔧 성능 최적화

- CSS 애니메이션 사용 (GPU 가속)
- `will-change` 속성으로 렌더링 최적화
- 이벤트 디바운싱 적용
- 레이지 로딩 준비

## 📄 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📞 지원

문제가 발생하면 이슈를 등록해주세요.

---

**Made with ❤️ and ∞ (Infinity Breath)**
