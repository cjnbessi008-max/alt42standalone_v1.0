# 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 필수 요구사항 확인

```bash
php --version  # PHP 7.1.9 이상 필요
mysql --version  # MySQL 5.7 이상 필요
```

### 2단계: 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE stat_digest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'statdigest'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON stat_digest_db.* TO 'statdigest'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3단계: 스키마 적용

```bash
mysql -u statdigest -p stat_digest_db < database/schema.sql
```

### 4단계: 환경 설정

```bash
cp .env.example .env
nano .env
```

다음 내용을 수정:
```ini
DB_HOST=localhost
DB_NAME=stat_digest_db
DB_USER=statdigest
DB_PASS=your_secure_password

MOODLE_URL=http://your-moodle.com
MOODLE_TOKEN=your_token_here
```

### 5단계: 웹 서버 시작

#### PHP 내장 서버 (개발용)

```bash
cd public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

#### Apache (프로덕션)

1. Virtual Host 설정:

```bash
sudo nano /etc/apache2/sites-available/stat-digest.conf
```

```apache
<VirtualHost *:80>
    ServerName stat-digest.local
    DocumentRoot /var/www/alt42standalone_v1.0/public

    <Directory /var/www/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/stat-digest-error.log
    CustomLog ${APACHE_LOG_DIR}/stat-digest-access.log combined
</VirtualHost>
```

2. 사이트 활성화:

```bash
sudo a2ensite stat-digest.conf
sudo a2enmod rewrite
sudo systemctl reload apache2
```

3. hosts 파일 수정 (로컬 테스트):

```bash
sudo nano /etc/hosts
```

추가:
```
127.0.0.1 stat-digest.local
```

## Moodle 설정

### Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. 다음 단계 수행:

   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화
   - ✅ 외부 서비스 생성
   - ✅ 토큰 생성

### 서비스 함수 추가

외부 서비스에 다음 함수들을 추가:

```
- mod_quiz_get_quiz_questions
- mod_quiz_get_user_attempts
- mod_quiz_get_quizzes_by_courses
- core_question_get_questions
```

### 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. 토큰 추가
3. 사용자 선택 (관리자 또는 적절한 권한을 가진 사용자)
4. 서비스 선택
5. 생성된 토큰을 `.env`의 `MOODLE_TOKEN`에 복사

## 테스트

### 1. 데이터베이스 연결 테스트

```bash
curl http://localhost:8000/api.php/test-db
```

예상 출력:
```json
{
    "status": "ok",
    "message": "Database connection successful"
}
```

### 2. Moodle 연결 테스트

퀴즈 동기화 시도:
```bash
curl -X POST http://localhost:8000/api.php/sync/quiz \
  -H "Content-Type: application/json" \
  -d '{"quiz_id": 1}'
```

### 3. UI 접속

브라우저에서 `http://localhost:8000` 또는 `http://stat-digest.local` 접속

## 트러블슈팅

### MySQL 연결 오류

```
SQLSTATE[HY000] [2002] Connection refused
```

**해결책**:
- MySQL 서비스 확인: `sudo systemctl status mysql`
- 포트 확인: `.env`의 `DB_PORT` 확인
- 방화벽 확인

### Moodle API 오류

```
Moodle error: Invalid token
```

**해결책**:
- 토큰이 올바른지 확인
- Moodle에서 웹 서비스가 활성화되었는지 확인
- 서비스에 필요한 함수가 추가되었는지 확인

### Permission Denied

```
Warning: fopen(): failed to open stream: Permission denied
```

**해결책**:
```bash
sudo chown -R www-data:www-data /var/www/alt42standalone_v1.0
sudo chmod -R 755 /var/www/alt42standalone_v1.0
```

### 500 Internal Server Error

**확인사항**:
1. PHP 에러 로그 확인:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

2. PHP 확장 모듈 확인:
   ```bash
   php -m | grep -E 'pdo|json|curl'
   ```

3. 필요한 확장이 없으면 설치:
   ```bash
   sudo apt-get install php7.1-mysql php7.1-curl php7.1-json
   sudo systemctl restart apache2
   ```

## 프로덕션 배포 체크리스트

- [ ] `.env`에서 `APP_DEBUG=false` 설정
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] HTTPS 활성화
- [ ] 방화벽 설정 (포트 80/443만 개방)
- [ ] 정기 백업 설정
- [ ] 에러 로깅 설정
- [ ] 모니터링 도구 설정

## 지원

문제가 있으시면 이슈를 등록해주세요.
