# 🚀 Slope Sense 빠른 설치 가이드

## 1️⃣ 빠른 시작 (5분)

### Step 1: 파일 다운로드
```bash
# 프로젝트 클론 또는 압축 해제
cd /var/www/html
# slope-sense 폴더가 생성됨
```

### Step 2: 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 다음 명령어 실행
```

```sql
CREATE DATABASE slope_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'slope_user'@'localhost' IDENTIFIED BY 'SlopePass123!';
GRANT ALL PRIVILEGES ON slope_sense.* TO 'slope_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 스키마 적용
mysql -u slope_user -p slope_sense < slope-sense/sql/schema.sql
# 비밀번호 입력: SlopePass123!
```

### Step 3: 설정 파일 수정
```bash
nano slope-sense/config/config.php
```

다음 부분만 수정:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'slope_sense');
define('DB_USER', 'slope_user');
define('DB_PASS', 'SlopePass123!');  // ⬅️ 위에서 설정한 비밀번호

define('MOODLE_DIR', '/var/www/html/moodle');  // ⬅️ Moodle 경로
define('MOODLE_URL', 'http://localhost/moodle');  // ⬅️ Moodle URL
```

### Step 4: 권한 설정
```bash
# logs 디렉토리 생성 및 권한 설정
mkdir -p slope-sense/logs
chmod 755 slope-sense
chmod 777 slope-sense/logs
```

### Step 5: 테스트
브라우저에서 접속:
```
http://localhost/slope-sense/index.html?user_id=1&course_id=1&activity_id=1
```

✅ 스마트폰 화면이 우측 하단에 나타나고 애니메이션이 작동하면 성공!

---

## 2️⃣ Moodle 통합 (추가 10분)

### Step 1: 플러그인 복사
```bash
cp -r slope-sense/moodle /var/www/html/moodle/mod/slopesense
chown -R www-data:www-data /var/www/html/moodle/mod/slopesense
```

### Step 2: Moodle 플러그인 설치
1. Moodle 관리자로 로그인
2. `Site administration` → `Notifications` 클릭
3. "Upgrade Moodle database now" 버튼 클릭
4. Slope Sense 플러그인이 설치되는지 확인

### Step 3: Moodle 활동 추가
1. 원하는 코스로 이동
2. "Turn editing on" 클릭
3. "Add an activity or resource" 클릭
4. "Slope Sense" 선택
5. 활동 설정:
   - Name: "기울기 학습"
   - Description: "기울기를 애니메이션으로 배워보세요!"
6. "Save and display" 클릭

✅ 학생들이 활동을 클릭하면 Slope Sense 앱이 실행됩니다!

---

## 3️⃣ 문제 해결

### ❌ 데이터베이스 연결 오류
```bash
# PHP PDO MySQL 확장 확인
php -m | grep pdo_mysql

# 없으면 설치
sudo apt-get install php7.1-mysql
sudo service apache2 restart
```

### ❌ "Permission denied" 오류
```bash
# Apache 사용자 확인
ps aux | grep apache

# 소유권 변경
sudo chown -R www-data:www-data slope-sense/
sudo chmod -R 755 slope-sense/
sudo chmod -R 777 slope-sense/logs/
```

### ❌ 애니메이션이 안 보임
1. 브라우저 콘솔 열기 (F12)
2. JavaScript 오류 확인
3. 최신 브라우저 사용 (Chrome, Firefox, Safari, Edge)
4. 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

### ❌ Moodle 통합이 안 됨
```bash
# config.php에서 MOODLE_DIR 확인
cat slope-sense/config/config.php | grep MOODLE_DIR

# Moodle config.php 존재 확인
ls -la /var/www/html/moodle/config.php

# 경로가 다르면 수정
nano slope-sense/config/config.php
```

---

## 4️⃣ 고급 설정

### HTTPS 설정 (Apache)
```apache
<VirtualHost *:443>
    ServerName slope-sense.yourdomain.com
    DocumentRoot /var/www/html/slope-sense

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    <Directory /var/www/html/slope-sense>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 성능 최적화
```bash
# PHP OpCache 활성화
sudo nano /etc/php/7.1/apache2/php.ini
```

추가:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

```bash
sudo service apache2 restart
```

### 로그 로테이션
```bash
# 로그 로테이션 설정
sudo nano /etc/logrotate.d/slope-sense
```

내용:
```
/var/www/html/slope-sense/logs/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    notifempty
    missingok
}
```

---

## 5️⃣ 검증 체크리스트

설치가 완료되었는지 확인:

- [ ] MySQL 데이터베이스 생성 완료
- [ ] 테이블 3개 생성 확인 (slope_problems, slope_sessions, slope_user_attempts)
- [ ] config.php 설정 완료
- [ ] 웹 브라우저에서 index.html 접근 가능
- [ ] 우측 하단에 스마트폰 UI 표시
- [ ] 애니메이션 정상 작동
- [ ] 문제 제출 및 피드백 작동
- [ ] (선택) Moodle 플러그인 설치 완료
- [ ] (선택) Moodle 활동 생성 및 접근 가능

---

## 6️⃣ 개발 모드 활성화

디버깅을 위해 개발 모드 활성화:

```bash
nano slope-sense/config/config.php
```

변경:
```php
define('DEBUG_MODE', true);  // false → true
```

이제 `logs/error.log`에 상세한 디버그 정보가 기록됩니다.

---

## 📞 추가 도움이 필요하신가요?

- 📖 전체 문서: `README.md` 참조
- 🐛 버그 리포트: GitHub Issues
- 💬 질문: Moodle Forum

---

**설치 완료! 🎉 즐거운 학습 되세요!**
