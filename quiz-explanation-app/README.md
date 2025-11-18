# Quiz Explanation App

## 개요

Moodle 3.7 LMS와 연동되는 독립형 퀴즈 웹 애플리케이션입니다. 학생들이 정답을 선택할 때 **왜 그 답이 맞는지 설명**하도록 하여 더 깊은 이해를 촉진합니다.

## 주요 기능

### 학생용 기능
- ✅ 퀴즈 응시 (객관식 문제)
- 📝 각 답변에 대한 설명 작성 (필수)
- 🤖 자동 평가 (키워드 기반)
- 📊 상세한 결과 확인
- 💬 교사 피드백 수신

### 교사용 기능
- ➕ 퀴즈 및 문제 생성
- 🔑 평가 키워드 설정
- 📋 학생 답변 검토
- ✏️ 수동 점수 조정 및 피드백 제공
- 🔄 Moodle 성적 동기화

### 기술적 특징
- 🎯 설명 평가 자동화 (키워드 매칭)
- 🔗 Moodle REST API 연동
- 📱 반응형 UI (Bootstrap 4)
- 🔒 CSRF 보호
- 📈 실시간 통계

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML, CSS, JavaScript (jQuery)
- **Framework**: Bootstrap 4
- **LMS Integration**: Moodle 3.7 REST API

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항 - Moodle 연동 시)

## 설치 방법

### 1. 파일 업로드

웹 서버의 document root에 모든 파일을 업로드합니다.

```bash
# 예시: Apache의 경우
cp -r quiz-explanation-app /var/www/html/
```

### 2. 데이터베이스 설정

MySQL에 데이터베이스를 생성하고 스키마를 import합니다.

```bash
mysql -u root -p < sql/schema.sql
```

또는 MySQL 클라이언트에서:

```sql
mysql -u root -p
source /path/to/quiz-explanation-app/sql/schema.sql;
```

### 3. 데이터베이스 연결 설정

`config/database.php` 파일을 수정하여 데이터베이스 연결 정보를 입력합니다.

```php
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'quiz_explanation_app',
    'username' => 'your_db_username',
    'password' => 'your_db_password',
    // ...
];
```

### 4. Moodle 연동 설정 (선택사항)

Moodle과 연동하려면 다음 단계를 따르세요:

#### 4.1 Moodle에서 Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. 다음 단계를 따라 설정:
   - 웹 서비스 활성화
   - REST 프로토콜 활성화
   - 웹 서비스 사용자 생성 (또는 기존 사용자 사용)
   - 토큰 생성

#### 4.2 앱 설정 파일 수정

`config/moodle.php` 파일을 수정합니다:

```php
return [
    'url' => 'http://your-moodle-site.com',
    'token' => 'your_web_service_token',
    // ...
];
```

### 5. 파일 권한 설정

웹 서버가 필요한 파일에 접근할 수 있도록 권한을 설정합니다.

```bash
chmod -R 755 quiz-explanation-app
chown -R www-data:www-data quiz-explanation-app  # Apache의 경우
```

### 6. 웹 서버 설정

#### Apache (.htaccess)

루트 디렉토리에 `.htaccess` 파일을 생성합니다:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /quiz-explanation-app/

    # Redirect to HTTPS (선택사항)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Protect config files
    <Files "*.php">
        <IfModule mod_authz_core.c>
            Require all denied
        </IfModule>
    </Files>
</IfModule>
```

## 사용 방법

### 데모 계정

설치 후 다음 데모 계정으로 로그인할 수 있습니다:

**교사 계정:**
- Username: `teacher1`
- Email: `teacher@example.com`
- Password: (미설정 - 개발 모드)

**학생 계정:**
- Username: `student1`
- Email: `student1@example.com`
- Password: (미설정 - 개발 모드)

### 교사 워크플로우

1. **로그인**: `/login.php`에서 교사 계정으로 로그인
2. **퀴즈 생성**: 교사 대시보드에서 "Manage Quizzes" 클릭
3. **문제 추가**: "Create Question"을 클릭하여 문제 추가
   - 문제 텍스트 입력
   - 선택지 추가 (최소 2개)
   - 정답 선택
   - 모범 설명 작성
   - 평가 키워드 설정 (선택사항)
4. **학생 답변 검토**: "Review Answers"에서 학생 답변 확인 및 피드백 제공

### 학생 워크플로우

1. **로그인**: `/login.php`에서 학생 계정으로 로그인
2. **퀴즈 선택**: 학생 대시보드에서 사용 가능한 퀴즈 보기
3. **퀴즈 응시**:
   - 각 문제에 대해 답 선택
   - **중요**: 왜 그 답이 맞는지 설명 작성 (최소 20자)
   - 모든 문제 완료 후 제출
4. **결과 확인**: 자동 채점 결과 및 교사 피드백 확인

## 데이터베이스 구조

### 주요 테이블

- `users` - 사용자 정보 (Moodle과 동기화)
- `quizzes` - 퀴즈 정보
- `questions` - 문제 정보
- `question_options` - 문제 선택지
- `explanation_keywords` - 설명 평가용 키워드
- `quiz_attempts` - 퀴즈 시도 기록
- `student_answers` - 학생 답변 (정답 + 설명)
- `explanation_evaluations` - 설명 평가 상세
- `moodle_sync_log` - Moodle 동기화 로그

## API 엔드포인트

### `/api/sync_grades.php`
- **메서드**: POST
- **설명**: 퀴즈 성적을 Moodle 성적표에 동기화
- **파라미터**: `attempt_id`

## 설명 평가 시스템

### 키워드 유형

1. **Required (필수)**: 학생 설명에 반드시 포함되어야 하는 키워드
   - 찾으면: 점수 획득
   - 못 찾으면: 점수 없음

2. **Bonus (보너스)**: 선택적 키워드
   - 찾으면: 추가 점수
   - 못 찾아도 감점 없음

3. **Negative (부정)**: 잘못된 개념
   - 찾으면: 점수 감점
   - 못 찾으면: 영향 없음

### 점수 계산

```
총 점수 = 정답 점수 (70%) + 설명 점수 (30%)
```

- 정답 점수: 정답을 선택하면 자동으로 부여
- 설명 점수: 키워드 매칭 기반 자동 평가 (교사가 수동 조정 가능)

## 보안 고려사항

### 프로덕션 배포 시 필수 작업

1. **비밀번호 해싱**:
   ```php
   // login.php에서 비밀번호 검증 시
   if (!password_verify($password, $user['password_hash'])) {
       throw new Exception('Invalid credentials');
   }
   ```

2. **데이터베이스 사용자 권한 제한**:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_explanation_app.* TO 'quiz_user'@'localhost';
   ```

3. **HTTPS 사용**: SSL/TLS 인증서 설치

4. **에러 로깅**:
   ```php
   // php.ini 설정
   display_errors = Off
   log_errors = On
   error_log = /var/log/php/errors.log
   ```

5. **세션 보안**:
   ```php
   // 세션 설정 강화
   ini_set('session.cookie_httponly', 1);
   ini_set('session.cookie_secure', 1);
   ini_set('session.use_strict_mode', 1);
   ```

## 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed. Please check your configuration.
```

**해결책**: `config/database.php`에서 데이터베이스 연결 정보를 확인하세요.

### Moodle API 오류

```
Moodle API error: Invalid token
```

**해결책**:
1. Moodle에서 웹 서비스가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. Moodle URL이 정확한지 확인

### 파일 업로드 오류

**해결책**: 웹 서버 사용자에게 디렉토리 쓰기 권한이 있는지 확인하세요.

## 디렉토리 구조

```
quiz-explanation-app/
├── api/                    # API 엔드포인트
│   └── sync_grades.php
├── assets/                 # 정적 파일
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── config/                 # 설정 파일
│   ├── database.php
│   └── moodle.php
├── includes/               # 공통 파일
│   ├── db.php
│   ├── functions.php
│   └── moodle_api.php
├── sql/                    # 데이터베이스 스키마
│   └── schema.sql
├── student/                # 학생용 페이지
│   ├── index.php
│   ├── take_quiz.php
│   └── view_results.php
├── teacher/                # 교사용 페이지
│   ├── index.php
│   ├── create_question.php
│   └── review_answers.php
├── templates/              # 템플릿
│   ├── header.php
│   └── footer.php
├── index.php               # 메인 페이지
├── login.php               # 로그인 페이지
├── logout.php              # 로그아웃
└── README.md               # 이 파일
```

## 향후 개선 사항

- [ ] AI 기반 설명 평가 (OpenAI API 연동)
- [ ] 다국어 지원
- [ ] 이미지/파일 첨부 기능
- [ ] 통계 대시보드 개선
- [ ] 모바일 앱 개발
- [ ] 실시간 퀴즈 기능
- [ ] 협업 학습 기능

## 라이선스

이 프로젝트는 교육용으로 제작되었습니다.

## 지원

문제가 발생하거나 문의사항이 있으시면 이슈를 등록해주세요.

## 제작 정보

- **버전**: 1.0.0
- **제작일**: 2025-11-18
- **호환성**: PHP 7.1.9, MySQL 5.7, Moodle 3.7
