# Answer Reason Tracker

학생들이 퀴즈 오답에 대한 이유를 작성하고, 교사가 이를 분석하여 더 효과적인 학습을 지원하는 웹 애플리케이션입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [Moodle 연동 설정](#moodle-연동-설정)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)

## 🎯 주요 기능

### 학생용 기능
- 퀴즈 결과 및 오답 확인
- 정답 해설 열람
- 오답 이유 작성 (5가지 카테고리)
  - 개념 이해 부족
  - 계산 실수
  - 부주의한 실수
  - 문제 오독
  - 기타
- 제출 내역 관리

### 교사용 기능
- 학생별 오답 이유 확인
- 카테고리별 통계 분석
- 학생별 학습 패턴 분석
- 제출률 및 참여도 모니터링
- 데이터 기반 인사이트 제공

### 시스템 기능
- Moodle LMS 연동 (Web Services API)
- RESTful API 제공
- 실시간 데이터 동기화
- 반응형 웹 디자인

## 💻 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 웹 서버 (mod_rewrite 활성화)
- **Moodle**: 3.7 이상 (선택사항)

### 권장 사양
- PHP 7.4+
- MySQL 8.0+
- 최소 512MB RAM
- 100MB 디스크 공간

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|pdo_mysql|curl|json|mbstring'
```

필요한 확장:
- `pdo`
- `pdo_mysql`
- `curl`
- `json`
- `mbstring`

## 🚀 설치 방법

### 1. 프로젝트 다운로드

```bash
git clone <repository-url>
cd answer-reason-app
```

### 2. 데이터베이스 설정

MySQL에 접속하여 데이터베이스를 생성하고 스키마를 임포트합니다:

```bash
mysql -u root -p
```

```sql
-- MySQL 콘솔에서 실행
CREATE DATABASE answer_reason_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'answer_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON answer_reason_db.* TO 'answer_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

스키마 임포트:

```bash
mysql -u answer_user -p answer_reason_db < database/schema.sql
```

### 3. 설정 파일 생성

```bash
cp config/config.example.php config/config.php
```

`config/config.php` 파일을 열어 설정을 수정합니다:

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'answer_reason_db',
        'username' => 'answer_user',
        'password' => 'your_password_here',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    'moodle' => [
        'url' => 'https://your-moodle-site.com',
        'token' => 'your_moodle_token',
        'service' => 'moodle_mobile_app',
        'sync_enabled' => false,
    ],

    // ... 기타 설정
];
```

### 4. 권한 설정

```bash
chmod -R 755 answer-reason-app
chmod -R 777 logs  # 로그 디렉토리 (생성 필요 시)
```

### 5. 웹 서버 설정

#### Apache (.htaccess 사용)

프로젝트에 이미 `.htaccess` 파일이 포함되어 있습니다. `mod_rewrite`가 활성화되어 있는지 확인하세요:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

VirtualHost 설정 예시:

```apache
<VirtualHost *:80>
    ServerName answer-reason.local
    DocumentRoot /var/www/answer-reason-app

    <Directory /var/www/answer-reason-app>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/answer-reason-error.log
    CustomLog ${APACHE_LOG_DIR}/answer-reason-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name answer-reason.local;
    root /var/www/answer-reason-app;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?route=$uri&$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 6. 설치 확인

브라우저에서 접속:

```
http://your-domain/
```

설치가 정상적으로 완료되면 랜딩 페이지가 표시됩니다.

## 🔗 Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자 페이지에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
2. 다음 항목들을 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

### 2. 웹 서비스 사용자 생성

1. **사이트 관리 > 사용자 > 계정 > 새 사용자 추가**
2. 사용자 생성 (예: `webservice_user`)

### 3. 역할 및 권한 설정

1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. 새 역할 생성: `웹 서비스 역할`
3. 다음 권한 부여:
   - `webservice/rest:use`
   - `mod/quiz:view`
   - `mod/quiz:viewreports`
   - `moodle/user:viewalldetails`

### 4. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. **사용자 정의 서비스 추가**
3. 필요한 함수 추가:
   - `core_user_get_users`
   - `core_user_get_users_by_field`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_attempt_review`
   - `core_webservice_get_site_info`

### 5. 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. **토큰 추가**
3. 생성된 토큰을 복사하여 `config/config.php`의 `moodle.token`에 입력

### 6. 연동 테스트

API를 통해 연결 테스트:

```bash
curl -X POST http://your-domain/api/moodle/test-connection
```

응답 예시:
```json
{
  "success": true,
  "site_name": "Your Moodle Site",
  "moodle_version": "3.7"
}
```

## 📖 사용 방법

### 학생 사용 방법

1. **퀴즈 결과 확인**
   - `/student` 페이지 접속
   - 틀린 문제 목록 확인

2. **오답 이유 작성**
   - 문제의 정답 해설 읽기
   - 카테고리 선택
   - 상세 이유 작성 (최소 10자)
   - 제출하기 버튼 클릭

3. **제출 내역 확인**
   - 제출한 이유는 카드에 표시됩니다
   - 제출 시간 확인 가능

### 교사 사용 방법

1. **대시보드 접속**
   - `/teacher` 페이지 접속

2. **개요 탭**
   - 전체 통계 확인
   - 카테고리별 분포 확인

3. **학생 이유 목록 탭**
   - 카테고리별 필터링
   - 학생별 이유 확인
   - 상세 내용 읽기

4. **분석 탭**
   - 학생별 통계 확인
   - 주요 오답 패턴 파악
   - 제출률 분석

## 🔌 API 문서

### Base URL
```
http://your-domain/api
```

### 엔드포인트

#### 1. 퀴즈 시도 조회

**GET** `/api/attempts`

Query Parameters:
- `student_id` (선택): 학생 ID
- `incorrect_only` (선택): `1` = 오답만, `0` = 전체
- `limit` (선택): 결과 개수 제한 (기본값: 50)
- `offset` (선택): 오프셋 (기본값: 0)

응답:
```json
{
  "success": true,
  "count": 10,
  "attempts": [
    {
      "id": 1,
      "student_id": 1,
      "quiz_name": "중간고사",
      "question_text": "다음 중 옳은 것은?",
      "student_answer": "A",
      "correct_answer": "B",
      "is_correct": 0,
      "explanation_text": "정답은 B입니다...",
      "reason_id": null
    }
  ]
}
```

#### 2. 오답 이유 제출

**POST** `/api/reasons`

Request Body:
```json
{
  "attempt_id": 1,
  "reason_text": "분수의 덧셈에서 분모를 통분하는 것을 깜빡했습니다.",
  "reason_category": "conceptual"
}
```

응답:
```json
{
  "success": true,
  "reason_id": 1,
  "message": "Reason submitted successfully"
}
```

#### 3. 오답 이유 조회

**GET** `/api/reasons`

Query Parameters:
- `attempt_id` (선택): 시도 ID
- `student_id` (선택): 학생 ID
- `category` (선택): 카테고리 필터

#### 4. 분석 데이터 조회

**GET** `/api/analytics/summary`

응답:
```json
{
  "success": true,
  "analytics": [
    {
      "student_id": 1,
      "full_name": "홍길동",
      "total_attempts": 50,
      "reasons_submitted": 30,
      "submission_rate": 60.00,
      "avg_word_count": 85
    }
  ]
}
```

#### 5. Moodle 동기화

**POST** `/api/moodle/sync-attempt`

Request Body:
```json
{
  "attempt_id": 123
}
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결 방법**:
1. MySQL 서비스 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```

2. 데이터베이스 사용자 권한 확인:
   ```sql
   SHOW GRANTS FOR 'answer_user'@'localhost';
   ```

3. `config/config.php`의 데이터베이스 설정 확인

### Moodle API 연결 실패

**증상**: "Moodle API request failed"

**해결 방법**:
1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. 방화벽/네트워크 설정 확인
4. CURL 확장이 설치되어 있는지 확인:
   ```bash
   php -m | grep curl
   ```

### 404 오류

**증상**: 모든 페이지에서 404 오류

**해결 방법**:
1. Apache `mod_rewrite` 활성화 확인:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. `.htaccess` 파일 존재 여부 확인
3. AllowOverride 설정 확인

### 한글 깨짐

**증상**: 한글이 깨져서 표시됨

**해결 방법**:
1. 데이터베이스 문자셋 확인:
   ```sql
   SHOW CREATE DATABASE answer_reason_db;
   ```

2. 테이블 문자셋 확인:
   ```sql
   SHOW CREATE TABLE students;
   ```

3. 필요시 문자셋 변경:
   ```sql
   ALTER DATABASE answer_reason_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## 📝 라이선스

MIT License

## 🤝 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

## 📞 지원

문의사항이 있으시면 이슈를 등록해주세요.
