# 배포 가이드

Moodle LMS 인지 부하 수치화 시스템을 프로덕션 환경에 배포하는 가이드입니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [Python 서비스 배포](#python-서비스-배포)
3. [Moodle 플러그인 배포](#moodle-플러그인-배포)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [보안 설정](#보안-설정)
6. [모니터링](#모니터링)
7. [백업 및 복구](#백업-및-복구)

---

## 시스템 요구사항

### 최소 요구사항

**Python 서비스**:
- Python 3.11 이상
- RAM: 2GB 이상
- CPU: 2 코어 이상
- 디스크: 10GB 이상

**Moodle 서버**:
- PHP 7.1.9 (Moodle 3.7 호환)
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx
- RAM: 4GB 이상 (Moodle 기본 요구사항)

### 권장 사양

**프로덕션 환경**:
- Python 서비스: 4GB RAM, 4 코어
- Moodle 서버: 8GB RAM, 4 코어
- 데이터베이스: 별도 서버 권장
- 로드 밸런서 (고가용성을 위해)

---

## Python 서비스 배포

### 1. 서버 준비

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python 3.11 설치
sudo apt install python3.11 python3.11-venv python3-pip -y

# 작업 디렉토리 생성
sudo mkdir -p /opt/cognitive_load_service
sudo chown $USER:$USER /opt/cognitive_load_service
cd /opt/cognitive_load_service
```

### 2. 애플리케이션 설치

```bash
# 프로젝트 파일 복사
cp -r cognitive_load_service/* /opt/cognitive_load_service/

# 가상 환경 생성
python3.11 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
# 환경 변수 파일 생성
cat > /opt/cognitive_load_service/.env << EOF
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
DATABASE_URL=mysql://moodle_user:password@localhost/moodle
LOG_LEVEL=INFO
EOF

# 권한 설정 (중요!)
chmod 600 /opt/cognitive_load_service/.env
```

### 4. Systemd 서비스 설정

```bash
# 서비스 파일 생성
sudo cat > /etc/systemd/system/cognitive-load.service << EOF
[Unit]
Description=Cognitive Load Analysis Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/cognitive_load_service
Environment="PATH=/opt/cognitive_load_service/venv/bin"
EnvironmentFile=/opt/cognitive_load_service/.env
ExecStart=/opt/cognitive_load_service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable cognitive-load
sudo systemctl start cognitive-load

# 상태 확인
sudo systemctl status cognitive-load
```

### 5. Nginx 리버스 프록시 설정 (권장)

```bash
# Nginx 설치
sudo apt install nginx -y

# 설정 파일 생성
sudo cat > /etc/nginx/sites-available/cognitive-load << EOF
server {
    listen 80;
    server_name cognitive-load.yourdomain.com;

    # SSL 설정 (Let's Encrypt 사용 권장)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeout 설정
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

# 심볼릭 링크 생성 및 Nginx 재시작
sudo ln -s /etc/nginx/sites-available/cognitive-load /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Moodle 플러그인 배포

### 1. 플러그인 설치

```bash
# Moodle 디렉토리 확인
cd /var/www/html/moodle  # 또는 실제 Moodle 경로

# 플러그인 복사
sudo cp -r moodle_plugin/mod/cognitiveload mod/

# 권한 설정
sudo chown -R www-data:www-data mod/cognitiveload
sudo chmod -R 755 mod/cognitiveload
```

### 2. 데이터베이스 업그레이드

1. Moodle 관리자로 로그인
2. **사이트 관리** → **알림** 으로 이동
3. "Upgrade database now" 버튼 클릭
4. 데이터베이스 테이블이 자동으로 생성됨

### 3. 플러그인 설정

1. **사이트 관리** → **플러그인** → **활동 모듈** → **Cognitive Load Analysis**
2. 다음 설정 입력:
   - **API URL**: `http://cognitive-load.yourdomain.com` (또는 `http://localhost:8000`)
   - **API Key**: (선택사항) 보안을 위해 설정 권장
   - **Cache Duration**: `86400` (24시간)

### 4. 이벤트 옵저버 활성화 확인

```bash
# Moodle CLI로 확인
cd /var/www/html/moodle
sudo -u www-data php admin/cli/scheduled_tasks.php

# 캐시 삭제
sudo -u www-data php admin/cli/purge_caches.php
```

---

## 데이터베이스 설정

### MySQL 최적화

```sql
-- Moodle 데이터베이스 접속
mysql -u root -p

-- 인지 부하 테이블 인덱스 확인
USE moodle;
SHOW INDEX FROM mdl_cogload_cache;
SHOW INDEX FROM mdl_cogload_student_metrics;

-- 필요시 추가 인덱스 생성
CREATE INDEX idx_analyzed_at ON mdl_cogload_cache(analyzed_at);
CREATE INDEX idx_total_score ON mdl_cogload_cache(total_score);
CREATE INDEX idx_quiz_user ON mdl_cogload_student_metrics(quizattemptid, userid);
```

### 데이터베이스 백업

```bash
# 자동 백업 스크립트
cat > /opt/scripts/backup_cognitive_load.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/cognitive_load"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 디렉토리 생성
mkdir -p $BACKUP_DIR

# 관련 테이블만 백업
mysqldump -u root -p moodle \
  mdl_cogload_cache \
  mdl_cogload_student_metrics \
  mdl_cogload_analysis \
  > $BACKUP_DIR/cogload_backup_$TIMESTAMP.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "cogload_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/scripts/backup_cognitive_load.sh

# Cron 설정 (매일 새벽 2시)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup_cognitive_load.sh") | crontab -
```

---

## 보안 설정

### 1. API 키 인증

Python 서비스에 API 키 인증 추가:

```python
# main.py에 추가
from fastapi import Header, HTTPException

API_KEY = os.environ.get("API_KEY", "your-secret-key")

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return x_api_key

# 각 엔드포인트에 추가
@app.post("/api/analyze-problem", dependencies=[Depends(verify_api_key)])
async def analyze_problem(request: ProblemAnalysisRequest):
    # ...
```

### 2. 방화벽 설정

```bash
# UFW 방화벽 설정
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 내부 통신만 허용 (Python 서비스)
sudo ufw allow from 127.0.0.1 to any port 8000
```

### 3. SSL/TLS 설정

```bash
# Let's Encrypt 인증서 발급
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d cognitive-load.yourdomain.com
```

### 4. 레이트 리미팅

Nginx에 레이트 리미팅 추가:

```nginx
# /etc/nginx/nginx.conf의 http 블록에 추가
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 서버 블록의 location에 추가
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://localhost:8000;
    # ...
}
```

---

## 모니터링

### 1. 로그 설정

```bash
# Python 서비스 로그
sudo journalctl -u cognitive-load -f

# 로그 로테이션
sudo cat > /etc/logrotate.d/cognitive-load << EOF
/var/log/cognitive-load/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
}
EOF
```

### 2. Prometheus + Grafana (선택사항)

```bash
# Prometheus exporter 추가
pip install prometheus-fastapi-instrumentator

# main.py에 추가
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(...)
Instrumentator().instrument(app).expose(app)
```

### 3. 헬스 체크

```bash
# 헬스 체크 스크립트
cat > /opt/scripts/health_check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:8000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is down (HTTP $RESPONSE)"
    # 알림 전송 (이메일, Slack 등)
    exit 1
fi
EOF

chmod +x /opt/scripts/health_check.sh

# Cron 설정 (5분마다)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/scripts/health_check.sh") | crontab -
```

---

## 백업 및 복구

### 백업

```bash
# 전체 백업 스크립트
cat > /opt/scripts/full_backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 1. Python 서비스 백업
tar -czf $BACKUP_DIR/service.tar.gz /opt/cognitive_load_service

# 2. Moodle 플러그인 백업
tar -czf $BACKUP_DIR/plugin.tar.gz /var/www/html/moodle/mod/cognitiveload

# 3. 데이터베이스 백업
mysqldump -u root -p moodle \
  mdl_cogload_cache \
  mdl_cogload_student_metrics \
  mdl_cogload_analysis \
  | gzip > $BACKUP_DIR/database.sql.gz

# 4. 환경 변수 백업
cp /opt/cognitive_load_service/.env $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /opt/scripts/full_backup.sh
```

### 복구

```bash
# 서비스 복구
cd /opt/cognitive_load_service
tar -xzf /backup/YYYYMMDD/service.tar.gz -C /

# 플러그인 복구
tar -xzf /backup/YYYYMMDD/plugin.tar.gz -C /var/www/html/moodle/

# 데이터베이스 복구
gunzip < /backup/YYYYMMDD/database.sql.gz | mysql -u root -p moodle

# 서비스 재시작
sudo systemctl restart cognitive-load
sudo -u www-data php /var/www/html/moodle/admin/cli/purge_caches.php
```

---

## 성능 튜닝

### 1. Python 서비스 워커 수 조정

```bash
# CPU 코어 수 확인
nproc

# 권장 워커 수: (2 × CPU 코어 수) + 1
# 예: 4코어 → 9 워커
sudo systemctl edit cognitive-load
# ExecStart에서 --workers 값 조정
```

### 2. 데이터베이스 캐싱

```sql
-- MySQL 설정 최적화
-- /etc/mysql/my.cnf 또는 /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
innodb_buffer_pool_size = 2G
query_cache_size = 128M
query_cache_type = 1
```

### 3. Redis 캐싱 (선택사항)

```bash
# Redis 설치
sudo apt install redis-server -y

# Python에 Redis 추가
pip install redis

# main.py에서 Redis 캐싱 구현
```

---

## 문제 해결

### Python 서비스가 시작되지 않음

```bash
# 로그 확인
sudo journalctl -u cognitive-load -n 50

# 수동 실행으로 에러 확인
cd /opt/cognitive_load_service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Moodle 플러그인 오류

```bash
# 디버그 모드 활성화
# config.php에 추가:
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;

# 캐시 삭제
sudo -u www-data php admin/cli/purge_caches.php

# 플러그인 재설치
sudo rm -rf mod/cognitiveload
# 다시 설치...
```

### API 연결 타임아웃

```bash
# Nginx 타임아웃 증가
# /etc/nginx/sites-available/cognitive-load
proxy_connect_timeout 600s;
proxy_read_timeout 600s;
proxy_send_timeout 600s;

sudo systemctl reload nginx
```

---

## 체크리스트

배포 전 확인사항:

- [ ] Python 3.11+ 설치 확인
- [ ] ANTHROPIC_API_KEY 환경 변수 설정
- [ ] 데이터베이스 백업 완료
- [ ] systemd 서비스 정상 작동
- [ ] Nginx 리버스 프록시 설정
- [ ] SSL 인증서 설치 (프로덕션)
- [ ] 방화벽 규칙 설정
- [ ] Moodle 플러그인 설치 및 활성화
- [ ] 플러그인 설정 완료 (API URL 등)
- [ ] 테스트 문제로 동작 확인
- [ ] 모니터링 및 알림 설정
- [ ] 백업 자동화 설정

---

배포 완료 후 http://your-domain/health 로 접속하여 서비스 상태를 확인하세요.
