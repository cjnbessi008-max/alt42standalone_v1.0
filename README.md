# Condition Verification System (조건 검증 시스템)

## 📋 프로젝트 소개

학생들이 문제를 읽을 때 **중요한 조건을 제대로 읽었는지 확인**하는 교육용 웹 애플리케이션입니다.
학생들이 문제를 대충 읽고 답을 쓰는 것을 방지하고, 조건을 꼼꼼히 확인하도록 유도합니다.

## ✨ 주요 기능

### 👨‍🎓 학생 기능
- **조건 확인 시스템**: 문제의 중요 조건을 체크박스로 확인해야 답안 제출 가능
- **읽기 시간 추적**: 문제를 읽은 시간을 실시간으로 측정하고 최소 시간 요구
- **시각적 피드백**: 조건 확인 진행률을 프로그레스 바로 표시
- **인터랙티브 UI**: 조건 확인 시 시각적 효과와 애니메이션

### 👨‍🏫 교사 기능
- **문제 관리**: 문제 생성, 수정, 삭제
- **조건 설정**: 각 문제별로 중요 조건 추가 및 하이라이트 색상 설정
- **난이도 설정**: 쉬움/보통/어려움 레벨 설정
- **시간 제한**: 최소 읽기 시간 설정
- **분석 대시보드**: 학생별 읽기 시간, 조건 준수율, 제출 현황 확인

### 📊 분석 기능
- 학생별 읽기 시간 통계
- 조건별 준수율 측정
- 제출 시도 횟수 추적
- 읽기 행동 패턴 분석 (스크롤, 마우스 이동, 포커스 이탈)

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Architecture**: RESTful API

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── config/
│   └── database.php            # DB 연결 및 설정
├── api/
│   ├── problems.php            # 문제 CRUD API
│   └── student_progress.php    # 학생 진행 상황 API
├── admin/
│   ├── index.php               # 교사 관리 페이지
│   └── analytics.php           # 분석 대시보드
├── student/
│   └── problem_view.php        # 학생 문제 풀이 페이지
├── assets/
│   ├── css/
│   │   ├── student.css         # 학생 페이지 스타일
│   │   └── admin.css           # 관리자 페이지 스타일
│   └── js/
│       ├── student.js          # 학생 페이지 로직
│       └── admin.js            # 관리자 페이지 로직
└── index.php                   # 메인 랜딩 페이지
```

## 🚀 설치 및 실행 방법

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- phpMyAdmin (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE condition_verification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 데이터베이스 선택
USE condition_verification;

# 스키마 임포트
SOURCE /path/to/database/schema.sql;
```

또는 phpMyAdmin을 사용하여:
1. `condition_verification` 데이터베이스 생성
2. `database/schema.sql` 파일 임포트

### 3. 설정 파일 수정

`config/database.php` 파일에서 데이터베이스 접속 정보 수정:

```php
define('DB_HOST', 'localhost');     // DB 호스트
define('DB_PORT', '3306');          // DB 포트
define('DB_NAME', 'condition_verification');  // DB 이름
define('DB_USER', 'root');          // DB 사용자명
define('DB_PASS', '');              // DB 비밀번호
```

### 4. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName condition-verification.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name condition-verification.local;
    root /path/to/alt42standalone_v1.0;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. 접속

브라우저에서 다음 주소로 접속:

- **메인 페이지**: `http://localhost/`
- **교사 페이지**: `http://localhost/admin/index.php?teacher_id=1`
- **학생 페이지**: `http://localhost/student/problem_view.php?problem_id=1&student_id=1`

## 👥 기본 계정

데이터베이스 스키마에 포함된 테스트 계정:

### 교사 계정
- **Username**: teacher1
- **Password**: password
- **Name**: Kim Teacher

### 학생 계정
- **Student 1**: student1 / password (Lee Student, 3학년)
- **Student 2**: student2 / password (Park Student, 3학년)
- **Student 3**: student3 / password (Choi Student, 4학년)

## 📖 사용 가이드

### 교사 - 문제 만들기

1. 교사 관리 페이지 접속
2. "새 문제 만들기" 버튼 클릭
3. 문제 정보 입력:
   - 제목
   - 설명
   - 문제 내용
   - 과목, 난이도, 학년
   - 최소 읽기 시간 설정
4. 조건 추가:
   - "조건 추가" 버튼으로 중요 조건 입력
   - 하이라이트 색상 선택
   - 필수 여부 체크
5. "저장" 클릭

### 학생 - 문제 풀기

1. 문제 페이지 접속
2. 문제 내용을 주의깊게 읽기
3. 각 조건의 체크박스를 확인하며 읽기
4. 최소 읽기 시간이 충족되고 모든 조건을 확인하면 "답안 제출하기" 버튼 활성화
5. 제출

### 교사 - 분석 확인

1. 문제 카드에서 "📊 분석" 버튼 클릭
2. 다음 정보 확인:
   - 총 학생 수, 평균 읽기 시간
   - 조건별 준수율
   - 학생별 진행 상황

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **teachers**: 교사 정보
- **students**: 학생 정보
- **problems**: 문제 정보
- **conditions**: 문제별 조건 목록
- **student_progress**: 학생의 문제 진행 상황
- **condition_checks**: 학생의 조건 확인 이력
- **student_reading_sessions**: 읽기 세션 상세 추적

자세한 스키마는 `database/schema.sql` 참조

## 🔌 API 문서

### Problems API (`/api/problems.php`)

#### GET - 문제 목록 조회
```
GET /api/problems.php
GET /api/problems.php?id=1&include_conditions=true
```

#### POST - 문제 생성
```json
POST /api/problems.php
{
  "teacher_id": 1,
  "title": "분수의 덧셈",
  "problem_text": "문제 내용...",
  "conditions": [
    {
      "text": "조건 1",
      "is_critical": 1,
      "highlight_color": "#ffeb3b"
    }
  ]
}
```

#### PUT - 문제 수정
```json
PUT /api/problems.php
{
  "id": 1,
  "title": "수정된 제목",
  ...
}
```

#### DELETE - 문제 삭제
```
DELETE /api/problems.php?id=1
```

### Student Progress API (`/api/student_progress.php`)

#### POST - 진행 상황 초기화
```json
POST /api/student_progress.php
{
  "student_id": 1,
  "problem_id": 1
}
```

#### PUT - 조건 체크
```json
PUT /api/student_progress.php
{
  "student_id": 1,
  "problem_id": 1,
  "action": "check_condition",
  "condition_id": 1,
  "time_to_check": 45
}
```

#### PUT - 답안 제출
```json
PUT /api/student_progress.php
{
  "student_id": 1,
  "problem_id": 1,
  "action": "submit"
}
```

## 🎨 커스터마이징

### 색상 테마 변경

`assets/css/student.css` 및 `assets/css/admin.css`에서:

```css
/* 메인 그라디언트 색상 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 조건 하이라이트 기본 색상 */
border-left-color: #ffeb3b;
```

### 최소 읽기 시간 기본값 변경

`config/database.php` 또는 문제 생성 시 설정

## 🔒 보안 고려사항

- 모든 사용자 입력은 `sanitize()` 함수로 처리
- PDO Prepared Statements 사용으로 SQL Injection 방지
- 비밀번호는 bcrypt로 해시
- CSRF 토큰 추가 권장 (프로덕션 환경)
- 프로덕션에서는 적절한 인증/권한 시스템 구현 필요

## 🐛 문제 해결

### 데이터베이스 연결 오류
- `config/database.php`의 접속 정보 확인
- MySQL 서비스 실행 여부 확인
- 사용자 권한 확인

### API 호출 실패
- 브라우저 개발자 도구 콘솔에서 오류 확인
- PHP 에러 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`

### 스타일이 적용되지 않음
- CSS 파일 경로 확인
- 브라우저 캐시 삭제

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👨‍💻 개발자

- Created by: Claude (Anthropic AI)
- Date: 2025-11-18
- Version: 1.0.0

## 🔮 향후 개발 계획

- [ ] Moodle LTI 통합
- [ ] 실시간 협업 기능
- [ ] AI 기반 조건 자동 추출
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 (영어)
- [ ] 음성 읽기 지원
- [ ] 접근성 개선 (WCAG 2.1 AAA)

## 📞 지원

문제가 있거나 기능 제안이 있으시면 이슈를 등록해주세요.
