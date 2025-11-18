# Color Union Module

**색감이 섞이며 확장되는 합집합 - 집합론 교육 모듈**

LMS와 연동하여 집합의 합집합(Union)을 색상 혼합을 통해 시각적으로 학습하는 교육용 웹 애플리케이션입니다. 우측 하단에 표시되는 가상 스마트폰 화면에서 대화형 문제를 풀며 집합론의 기본 개념을 익힐 수 있습니다.

## 주요 기능

### 1. 시각적 학습
- **색상 혼합 애니메이션**: 두 집합의 합집합을 색상이 혼합되는 시각 효과로 표현
- **확장 애니메이션**: 합집합이 점진적으로 확장되는 동적 효과
- **입자 효과**: 색상 입자가 흩어지며 합쳐지는 물리 효과

### 2. 가상 스마트폰 UI
- 우측 하단에 고정 배치되는 가상 스마트폰 화면
- 실제 모바일 기기를 모방한 디자인
- 상태 표시줄, 노치, 카메라 등 세부 디테일 구현

### 3. 문제 자동 생성
- 난이도별 자동 문제 생성
- 집합의 크기와 중복 요소를 고려한 알고리즘
- 10개의 다양한 문제로 구성된 세션

### 4. Moodle LMS 연동
- **Moodle 3.7** 호환
- 자동 성적 동기화
- 학습 진행 상황 추적
- 완료 상태 자동 업데이트

### 5. 데이터베이스 통합
- **MySQL 5.7** 데이터베이스
- 학생 답안 및 진행 상황 저장
- 성과 분석 및 통계

## 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 고급 애니메이션 및 그라데이션
- **JavaScript (ES6+)**: 객체 지향 프로그래밍

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터 저장소
- **Moodle 3.7**: LMS 통합

### 주요 기술
- CSS Grid & Flexbox 레이아웃
- CSS 애니메이션 및 트랜지션
- JSON 데이터 처리
- PDO를 사용한 안전한 데이터베이스 연결
- 세션 관리

## 설치 방법

### 1. 사전 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 설치 환경
- Apache 또는 Nginx 웹 서버

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < db/schema.sql

# 사용자 생성 (권장)
CREATE USER 'color_union_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON color_union_db.* TO 'color_union_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 파일 배포

```bash
# Moodle 모듈 디렉토리에 복사
cp -r color-union-module /var/www/html/moodle/mod/colorunion/

# 또는 독립 실행형으로 설치
cp -r color-union-module /var/www/html/color-union/
```

### 4. PHP 설정

`php/config.php` 파일을 열어 데이터베이스 및 Moodle 경로 설정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'color_union_db');
define('DB_USER', 'color_union_user');
define('DB_PASS', 'your_secure_password');

define('MOODLE_DIR', '/var/www/html/moodle');
```

### 5. 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p color-union-module/logs
chmod 755 color-union-module/logs
chown www-data:www-data color-union-module/logs
```

### 6. Moodle 통합

Moodle 관리자 페이지에서:
1. **Site Administration** > **Plugins** > **Install plugins** 이동
2. Color Union 모듈 설치 또는 활성화
3. 코스에 활동 추가: **Add an activity or resource** > **Color Union**

## 사용 방법

### 학생 사용법

1. Moodle 코스에서 Color Union 활동 클릭
2. 우측 하단에 나타나는 가상 스마트폰 화면 확인
3. 문제를 읽고 두 집합(A, B) 확인
4. **"합집합 보기"** 버튼 클릭하여 색상 혼합 애니메이션 관찰
5. 합집합의 원소 확인 후 다음 문제로 이동
6. 10개 문제 완료 시 자동으로 성적이 Moodle에 기록됨

### 교사 사용법

1. Moodle 코스에 Color Union 활동 추가
2. 설정에서 평가 방법 및 완료 조건 설정
3. 학생 진행 상황 및 성적 확인
4. 데이터베이스에서 상세 통계 조회 가능

## 파일 구조

```
color-union-module/
├── index.html              # 메인 HTML 페이지
├── css/
│   ├── smartphone.css      # 가상 스마트폰 스타일
│   └── color-union.css     # Color Union 특화 스타일
├── js/
│   ├── config.js           # 설정 및 상수
│   ├── color-union.js      # 메인 애플리케이션 로직
│   ├── animation.js        # 애니메이션 헬퍼
│   └── moodle-integration.js # Moodle 연동
├── php/
│   ├── config.php          # PHP 설정 및 유틸리티
│   ├── get-session.php     # 세션 초기화
│   ├── save-progress.php   # 진행 상황 저장
│   └── save-final-results.php # 최종 결과 저장
├── db/
│   └── schema.sql          # 데이터베이스 스키마
└── README.md               # 본 문서
```

## 데이터베이스 구조

### 주요 테이블

- **cu_users**: 사용자 정보 (Moodle 동기화)
- **cu_sessions**: 학습 세션 추적
- **cu_problems**: 생성된 문제 저장
- **cu_attempts**: 학생 답안 기록
- **cu_progress**: 전체 진행 상황 및 통계
- **cu_events**: 이벤트 로그
- **cu_grade_sync**: Moodle 성적 동기화

### 주요 뷰

- **v_user_performance**: 사용자별 성과 요약
- **v_session_summary**: 세션별 통계
- **v_problem_difficulty**: 문제 난이도 분석

## API 엔드포인트

### GET /php/get-session.php
세션 초기화 및 사용자 정보 조회

**Parameters:**
- `cmid`: Course Module ID

**Response:**
```json
{
  "success": true,
  "sessionId": 123,
  "userId": 456,
  "user": { "username": "student1", "fullname": "홍길동" },
  "course": { "id": 1, "fullname": "수학 기초" }
}
```

### POST /php/save-progress.php
문제 답안 저장

**Request Body:**
```json
{
  "problemData": {
    "problemNumber": 1,
    "setA": [1, 2, 3],
    "setB": [3, 4, 5],
    "union": [1, 2, 3, 4, 5],
    "colorA": "#FF6B6B",
    "colorB": "#4ECDC4",
    "colorUnion": "#A27CB7",
    "correctAnswer": 5
  },
  "answer": {
    "userAnswer": 5,
    "isCorrect": true,
    "timeSpent": 15
  }
}
```

### POST /php/save-final-results.php
최종 결과 저장 및 성적 동기화

**Request Body:**
```json
{
  "totalProblems": 10,
  "completedProblems": 10,
  "score": 95,
  "answers": [...]
}
```

## 커스터마이징

### 색상 팔레트 변경

`js/config.js`에서 색상 배열 수정:

```javascript
colors: {
    primary: [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        // 원하는 색상 추가...
    ]
}
```

### 문제 난이도 조정

`js/config.js`에서 설정 변경:

```javascript
problems: {
    totalProblems: 10,        // 문제 개수
    elementRange: {
        min: 2,               // 집합 최소 크기
        max: 8                // 집합 최대 크기
    },
    valueRange: {
        min: 1,               // 원소 최소값
        max: 20               // 원소 최대값
    }
}
```

### 점수 시스템 수정

`php/config.php`에서 점수 설정 변경:

```php
define('POINTS_CORRECT', 10);        // 정답 점수
define('POINTS_INCORRECT', -2);      // 오답 페널티
define('TIME_BONUS_ENABLED', true);  // 시간 보너스 활성화
define('TIME_BONUS_MULTIPLIER', 0.1); // 보너스 배수
```

## 문제 해결

### 데이터베이스 연결 오류
```
Error: Database connection failed
```
**해결:** `php/config.php`에서 데이터베이스 설정 확인

### Moodle 세션 오류
```
Error: User not logged in
```
**해결:** Moodle에 로그인했는지 확인, 세션 쿠키 설정 확인

### 성적 동기화 실패
```
Grade sync failed
```
**해결:** Moodle 성적 항목이 올바르게 생성되었는지 확인

## 성능 최적화

### 브라우저 캐싱
```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 데이터베이스 인덱스
스키마에 이미 포함된 인덱스:
- `cu_sessions`: user_id, is_completed
- `cu_attempts`: problem_id, user_id, is_correct
- `cu_events`: user_id, event_type

## 보안 고려사항

- SQL Injection 방지: PDO prepared statements 사용
- XSS 방지: 모든 출력 데이터 이스케이프
- CSRF 보호: 토큰 기반 검증 (선택적)
- 세션 보안: 안전한 세션 관리
- 입력 검증: 모든 사용자 입력 검증

## 라이선스

교육 목적으로 개발된 오픈 소스 프로젝트입니다.

## 지원

문제 발생 시:
1. 로그 파일 확인: `logs/php-errors.log`
2. 브라우저 콘솔 확인
3. Moodle 디버그 모드 활성화

## 버전 정보

- **Version**: 1.0.0
- **Release Date**: 2025-11-18
- **Compatibility**: Moodle 3.7, PHP 7.1.9, MySQL 5.7

## 업데이트 로그

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 색상 혼합 애니메이션 구현
- Moodle 3.7 통합
- MySQL 데이터베이스 스키마
- 가상 스마트폰 UI
- 자동 문제 생성 시스템
