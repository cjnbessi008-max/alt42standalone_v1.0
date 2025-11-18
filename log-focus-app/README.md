# Log Focus - Automatic Keyword Highlighting System

독립형 웹앱으로 Moodle 3.7과 연동하여 학생 활동 로그를 수집하고, 우측 하단 가상 스마트폰 화면에서 핵심 키워드를 자동으로 하이라이트하는 시스템입니다.

## 🎯 주요 기능

- **Moodle 3.7 연동**: Web Service API를 통한 실시간 데이터 동기화
- **가상 스마트폰 UI**: 우측 하단에 고정된 모바일 화면 시뮬레이션
- **자동 키워드 하이라이트**: 로그의 핵심 키워드를 자동으로 색상 강조
- **실시간 필터링**: 사용자, 활동 유형, 날짜별 로그 필터링
- **자동 새로고침**: 주기적인 로그 업데이트
- **통계 대시보드**: 실시간 로그 통계 표시

## 📋 시스템 요구사항

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **웹 서버**: Apache 또는 Nginx
- **브라우저**: Chrome, Firefox, Safari (최신 버전)

## 🚀 설치 방법

### 1. 파일 복사

```bash
# 웹 서버 루트 디렉토리에 복사
cp -r log-focus-app /var/www/html/
cd /var/www/html/log-focus-app
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 및 테이블 생성
mysql -u root -p < database/schema.sql
```

### 3. 데이터베이스 연결 설정

`config/database.php` 파일을 편집하여 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'log_focus_app');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. Moodle Web Service 설정

#### 4-1. Moodle에서 Web Service 활성화

1. Moodle 관리자로 로그인
2. `사이트 관리 > 고급 기능` 으로 이동
3. "웹 서비스 활성화" 체크
4. 저장

#### 4-2. Web Service 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스` 로 이동
2. "서비스 추가" 클릭
3. 다음 기능들을 추가:
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_quizzes_by_courses`
   - `core_user_get_users_by_field`
   - `mod_assign_get_submissions`

#### 4-3. 토큰 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리` 로 이동
2. 토큰 생성
3. 생성된 토큰을 복사

#### 4-4. 설정 파일 수정

`config/moodle.php` 파일을 편집:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token_here');
```

### 5. 권한 설정

```bash
# 디렉토리 권한 설정
chmod -R 755 /var/www/html/log-focus-app
chown -R www-data:www-data /var/www/html/log-focus-app
```

### 6. 웹 브라우저에서 접속

```
http://localhost/log-focus-app/public/
```

## 💡 사용 방법

### 1. Moodle에서 로그 가져오기

1. **Quiz ID** 입력 (Moodle에서 퀴즈 ID 확인)
2. **User ID** 입력 (선택사항, 비워두면 모든 사용자)
3. "Sync from Moodle" 버튼 클릭

### 2. 로그 필터링

- **User ID**: 특정 사용자의 로그만 표시
- **Activity Type**: 활동 유형별 필터링 (Quiz, Assignment 등)
- **날짜 범위**: 특정 기간의 로그만 표시

### 3. 자동 새로고침

- "Auto-Refresh" 버튼 클릭
- 5초마다 자동으로 새 로그를 가져옴
- 다시 클릭하면 중지

## 🎨 키워드 하이라이트 카테고리

로그에서 자동으로 다음 키워드들이 하이라이트됩니다:

| 카테고리 | 키워드 예시 | 색상 |
|---------|-----------|------|
| **ERROR** | ERROR, FAIL, EXCEPTION | 빨강 (#ff4444) |
| **WARNING** | WARNING, ALERT, TIMEOUT | 주황 (#ff9800) |
| **SUCCESS** | SUCCESS, PASS, CORRECT | 초록 (#4caf50) |
| **ACTION** | SUBMIT, ATTEMPT, ANSWER | 파랑 (#2196f3) |
| **PROBLEM** | QUESTION, QUIZ, GRADE | 보라 (#9c27b0) |
| **NEGATIVE** | INCORRECT, WRONG, INVALID | 진한주황 (#ff5722) |
| **TIME** | DEADLINE, END, TIMEOUT | 청록 (#009688) |

## 📁 프로젝트 구조

```
log-focus-app/
├── config/
│   ├── database.php       # 데이터베이스 연결 설정
│   └── moodle.php         # Moodle API 설정
├── api/
│   ├── moodle_connector.php  # Moodle API 연동
│   └── log_api.php           # REST API 엔드포인트
├── public/
│   ├── index.php          # 메인 페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   └── js/
│       └── log-focus.js   # 키워드 하이라이트 로직
├── database/
│   └── schema.sql         # 데이터베이스 스키마
└── README.md
```

## 🔧 커스터마이징

### 키워드 추가/수정

데이터베이스에서 직접 키워드를 관리할 수 있습니다:

```sql
-- 새 키워드 추가
INSERT INTO highlight_keywords (keyword, category, color, priority)
VALUES ('COMPLETED', 'success', '#4caf50', 8);

-- 키워드 수정
UPDATE highlight_keywords
SET color = '#ff0000', priority = 10
WHERE keyword = 'ERROR';

-- 키워드 비활성화
UPDATE highlight_keywords
SET is_active = 0
WHERE keyword = 'VIEW';
```

### 자동 새로고침 간격 변경

`public/js/log-focus.js` 파일에서:

```javascript
// 5초 -> 10초로 변경
this.refreshInterval = setInterval(() => {
    this.loadLogs();
}, 10000); // 5000 -> 10000
```

## 🐛 문제 해결

### Moodle 연동 실패

1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 필요한 Web Service 함수가 활성화되어 있는지 확인

### 로그가 표시되지 않음

1. 데이터베이스 연결 확인
2. 브라우저 개발자 도구(F12)에서 콘솔 에러 확인
3. PHP 에러 로그 확인: `/var/log/apache2/error.log`

### 키워드 하이라이트 안됨

1. `highlight_keywords` 테이블에 데이터가 있는지 확인
2. 키워드의 `is_active` 값이 1인지 확인

## 📊 데이터베이스 테이블

### activity_logs
학생 활동 로그 저장

### highlight_keywords
키워드 하이라이트 설정

### sync_status
Moodle 동기화 상태 추적

### user_preferences
사용자별 설정 저장

## 🔒 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 로그 표시 시 HTML escape
3. **토큰 보안**: Moodle 토큰을 환경 변수로 관리 권장
4. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 사용

## 📝 라이선스

MIT License

## 👤 개발자

Log Focus Development Team

## 📞 지원

문제가 발생하면 GitHub Issues를 통해 문의해주세요.
