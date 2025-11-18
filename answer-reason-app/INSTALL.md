# Answer Reason Tracker - 빠른 설치 가이드

이 문서는 Answer Reason Tracker를 빠르게 설치하고 실행하는 방법을 안내합니다.

## 🚀 5분 만에 시작하기

### 1단계: 환경 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# 필요한 PHP 확장 확인
php -m | grep -E 'pdo|pdo_mysql|curl|json|mbstring'
```

### 2단계: 프로젝트 설치

```bash
# 프로젝트 디렉토리로 이동
cd /var/www/html

# 프로젝트 복사 (실제 경로로 변경)
cp -r /path/to/answer-reason-app ./

# 권한 설정
chmod -R 755 answer-reason-app
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 아래 SQL 명령 실행
```

```sql
CREATE DATABASE answer_reason_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'answer_user'@'localhost' IDENTIFIED BY 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON answer_reason_db.* TO 'answer_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 스키마 임포트
mysql -u answer_user -p answer_reason_db < answer-reason-app/database/schema.sql
```

### 4단계: 설정 파일 생성

```bash
cd answer-reason-app
cp config/config.example.php config/config.php
```

`config/config.php` 파일 편집:

```bash
nano config/config.php
```

최소한 다음 설정만 변경하세요:

```php
'database' => [
    'host' => 'localhost',
    'database' => 'answer_reason_db',
    'username' => 'answer_user',
    'password' => 'ChangeThisPassword123!',  // 실제 비밀번호로 변경
],

'moodle' => [
    'url' => 'https://your-moodle-site.com',  // Moodle URL
    'token' => '',  // 나중에 설정 가능
],
```

### 5단계: 웹 서버 설정

#### Apache 사용 시

```bash
# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

#### Nginx 사용 시

`/etc/nginx/sites-available/answer-reason` 파일 생성:

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/answer-reason-app;
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

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/answer-reason /etc/nginx/sites-enabled/

# Nginx 재시작
sudo systemctl restart nginx
```

### 6단계: 설치 확인

브라우저에서 접속:

```
http://localhost/answer-reason-app
```

또는

```
http://your-server-ip/answer-reason-app
```

## ✅ 설치 확인 체크리스트

- [ ] PHP 7.1.9 이상 설치됨
- [ ] MySQL 5.7 이상 설치됨
- [ ] 데이터베이스 생성 완료
- [ ] 스키마 임포트 완료
- [ ] config.php 설정 완료
- [ ] 웹 서버 설정 완료
- [ ] 랜딩 페이지 정상 표시
- [ ] 학생 페이지 접속 가능
- [ ] 교사 대시보드 접속 가능

## 🔧 다음 단계

### Moodle 연동 (선택사항)

Moodle과 연동하려면 다음 단계를 진행하세요:

1. **Moodle Web Services 활성화**
   - 사이트 관리 > 플러그인 > 웹 서비스 > 개요
   - 웹 서비스 활성화
   - REST 프로토콜 활성화

2. **토큰 생성**
   - 사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
   - 토큰 추가
   - 생성된 토큰 복사

3. **설정 파일 업데이트**
   ```php
   'moodle' => [
       'url' => 'https://your-moodle-site.com',
       'token' => 'your_generated_token_here',
       'sync_enabled' => true,
   ],
   ```

4. **연결 테스트**
   ```bash
   curl -X POST http://localhost/answer-reason-app/api/moodle/test-connection
   ```

### 테스트 데이터 추가 (개발/테스트용)

```sql
-- 테스트 학생 추가
INSERT INTO students (username, email, full_name) VALUES
('student1', 'student1@example.com', '김학생'),
('student2', 'student2@example.com', '이학생');

-- 테스트 퀴즈 시도 추가
INSERT INTO quiz_attempts (student_id, quiz_name, question_id, question_text, student_answer, correct_answer, is_correct, score, max_score, explanation_text) VALUES
(1, '수학 중간고사', 1, '1/2 + 1/3 = ?', '2/5', '5/6', 0, 0, 10, '분수의 덧셈은 먼저 분모를 통분해야 합니다. 1/2 = 3/6, 1/3 = 2/6이므로 3/6 + 2/6 = 5/6입니다.'),
(1, '수학 중간고사', 2, '2 × 3 + 4 = ?', '14', '10', 0, 0, 10, '연산 순서에 따라 곱셈을 먼저 계산합니다. 2 × 3 = 6, 6 + 4 = 10입니다.'),
(2, '영어 퀴즈', 1, 'What is the past tense of "go"?', 'goed', 'went', 0, 0, 10, '"go"의 과거형은 불규칙 동사로 "went"입니다.');
```

## 🆘 문제가 발생했나요?

### 빠른 해결 방법

1. **빈 페이지가 표시되는 경우**
   ```bash
   # PHP 오류 로그 확인
   tail -f /var/log/apache2/error.log  # Apache
   tail -f /var/log/nginx/error.log    # Nginx
   ```

2. **데이터베이스 연결 오류**
   ```bash
   # MySQL 서비스 확인
   sudo systemctl status mysql

   # 데이터베이스 접속 테스트
   mysql -u answer_user -p answer_reason_db
   ```

3. **404 오류**
   ```bash
   # mod_rewrite 확인 (Apache)
   apache2ctl -M | grep rewrite

   # .htaccess 파일 존재 확인
   ls -la answer-reason-app/.htaccess
   ```

4. **권한 오류**
   ```bash
   # 올바른 권한 설정
   sudo chown -R www-data:www-data answer-reason-app
   chmod -R 755 answer-reason-app
   ```

### 더 많은 도움이 필요하신가요?

자세한 내용은 `README.md` 파일의 "문제 해결" 섹션을 참조하세요.

## 📚 추가 리소스

- [README.md](README.md) - 전체 문서
- [API 문서](README.md#api-문서) - API 엔드포인트 상세 정보
- [Moodle 연동 가이드](README.md#moodle-연동-설정) - 상세 Moodle 설정

## 🎉 설치 완료!

모든 것이 정상적으로 작동한다면 이제 시스템을 사용할 준비가 완료되었습니다!

- **학생 페이지**: `http://your-domain/student`
- **교사 대시보드**: `http://your-domain/teacher`
- **API**: `http://your-domain/api`

즐거운 학습 되세요! 🚀
