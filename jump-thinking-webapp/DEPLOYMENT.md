# 배포 체크리스트

## 프로덕션 배포 전 체크리스트

### 1. 환경 설정

- [ ] `.env` 파일 생성 및 프로덕션 값 설정
- [ ] `APP_DEBUG=false` 설정
- [ ] 강력한 `LTI_CONSUMER_SECRET` 생성
- [ ] 데이터베이스 사용자 권한 최소화
- [ ] HTTPS 인증서 설치

### 2. 데이터베이스

- [ ] 프로덕션 데이터베이스 생성
- [ ] `schema.sql` 실행
- [ ] 인덱스 생성 확인
- [ ] 백업 계획 수립

### 3. 웹 서버

- [ ] Apache/Nginx 설정
- [ ] mod_rewrite 활성화 (Apache)
- [ ] PHP 7.1.9+ 확인
- [ ] 파일 권한 설정 (755/644)
- [ ] 로그 디렉토리 생성

### 4. 보안

- [ ] 디버그 모드 비활성화
- [ ] 에러 표시 비활성화
- [ ] .env 파일 Git 제외
- [ ] SQL injection 방지 확인
- [ ] XSS 방지 확인
- [ ] CSRF 토큰 구현 (향후)

### 5. Moodle 연동

- [ ] Moodle 외부 도구 추가
- [ ] Consumer Key/Secret 설정
- [ ] LTI 론치 테스트
- [ ] 성적 전송 테스트

### 6. 모니터링

- [ ] 에러 로그 경로 설정
- [ ] 로그 로테이션 설정
- [ ] 성능 모니터링 도구 설치
- [ ] 백업 스크립트 설정

### 7. 테스트

- [ ] 학생 문제 풀이 테스트
- [ ] 교사 대시보드 테스트
- [ ] 비약 사고 감지 테스트
- [ ] LTI 론치 테스트
- [ ] 성적 전송 테스트

---

## 빠른 배포 명령어

```bash
# 1. 서버 접속
ssh user@your-server.com

# 2. 파일 업로드
scp -r jump-thinking-webapp user@your-server.com:/var/www/html/

# 3. 권한 설정
sudo chown -R www-data:www-data /var/www/html/jump-thinking-webapp
sudo chmod -R 755 /var/www/html/jump-thinking-webapp

# 4. .env 파일 생성
cd /var/www/html/jump-thinking-webapp
cp .env.example .env
nano .env

# 5. 데이터베이스 설정
mysql -u root -p < database/schema.sql

# 6. Apache 재시작
sudo systemctl restart apache2

# 7. 테스트
curl https://your-domain.com
```

---

## 롤백 계획

문제 발생 시 이전 버전으로 롤백:

```bash
# 데이터베이스 복구
mysql -u root -p jump_thinking_db < backup_20240115.sql

# 파일 복구
cd /var/www/html
mv jump-thinking-webapp jump-thinking-webapp.backup
mv jump-thinking-webapp.old jump-thinking-webapp

# Apache 재시작
sudo systemctl restart apache2
```

---

## 성능 최적화

### 데이터베이스 최적화

```sql
-- 인덱스 최적화
ANALYZE TABLE attempts;
ANALYZE TABLE jump_thinking_events;

-- 쿼리 캐시 (MySQL 5.7)
SET GLOBAL query_cache_size = 67108864;
```

### PHP 최적화

```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### Apache 최적화

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

---

## 백업 스크립트

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/jump-thinking"

# 데이터베이스 백업
mysqldump -u root -p jump_thinking_db > "$BACKUP_DIR/db_$DATE.sql"

# 파일 백업
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/www/html/jump-thinking-webapp

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Cron 설정:
```bash
# 매일 새벽 2시 백업
0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

---

## 모니터링 스크립트

```bash
#!/bin/bash
# health_check.sh

# 웹 서버 상태 확인
curl -f https://your-domain.com > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Web server down!" | mail -s "Alert" admin@your-domain.com
fi

# 데이터베이스 상태 확인
mysql -u root -p -e "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Database down!" | mail -s "Alert" admin@your-domain.com
fi

# 디스크 사용량 확인
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage: $DISK_USAGE%" | mail -s "Alert" admin@your-domain.com
fi
```

---

## 문의

문제 발생 시:
- GitHub Issues: [repository]/issues
- 이메일: support@your-domain.com
