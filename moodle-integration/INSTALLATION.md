# Installation Guide: Reasoning Path Grading System for Moodle 3.7

## 목차 (Table of Contents)
1. [시스템 요구사항](#시스템-요구사항)
2. [Moodle 플러그인 설치](#moodle-플러그인-설치)
3. [분석 엔진 설치](#분석-엔진-설치)
4. [설정 및 구성](#설정-및-구성)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### Moodle 환경
- **Moodle**: 3.7 (이상)
- **PHP**: 7.1.9 (이상, 권장 7.4)
- **MySQL**: 5.7 (이상) 또는 MariaDB 10.2+
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP Extensions**: curl, json, mbstring, mysqli

### 분석 엔진 환경
- **Python**: 3.11+
- **Docker**: 20.10+ (선택사항, 권장)
- **메모리**: 최소 2GB RAM
- **네트워크**: 인터넷 연결 (Claude API 접근)

### 외부 서비스
- **Anthropic Claude API**: API 키 필요
- 가입: https://console.anthropic.com/

---

## Moodle 플러그인 설치

### 1단계: 파일 복사

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/moodle

# 플러그인 디렉토리 생성
mkdir -p question/type/reasoningpath

# 플러그인 파일 복사
cp -r /path/to/moodle-integration/plugin/question/type/reasoningpath/* \
   question/type/reasoningpath/

# 권한 설정
chown -R www-data:www-data question/type/reasoningpath
chmod -R 755 question/type/reasoningpath
```

### 2단계: Moodle 업그레이드

1. 웹 브라우저로 Moodle 사이트 접속
2. 관리자로 로그인
3. Moodle이 자동으로 새 플러그인 감지 및 설치 프로세스 시작
4. 또는 수동으로: **사이트 관리 > 알림** 접속
5. "Upgrade database now" 클릭
6. 설치 진행 과정 확인

### 3단계: 플러그인 설정

**사이트 관리 > 플러그인 > 문제 유형 > Reasoning Path** 에서:

- **Analysis API Endpoint**: `http://localhost:8000/api/analyze-reasoning`
  (분석 엔진 주소에 맞게 수정)
- **API Authentication Key**: 분석 엔진의 API 키 입력
- **API Timeout**: `30` (초)

**저장** 클릭

---

## 분석 엔진 설치

### 방법 1: Docker 사용 (권장)

```bash
# 분석 엔진 디렉토리로 이동
cd /path/to/moodle-integration/analysis-engine

# 환경 변수 설정
cp .env.example .env
nano .env  # 편집기로 열어서 설정

# 필수 설정:
# ANTHROPIC_API_KEY=your-claude-api-key-here
# ANALYSIS_API_KEY=your-secure-api-key-here

# Docker 네트워크 생성
docker network create moodle-network

# Docker 컨테이너 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
curl http://localhost:8000/health
```

### 방법 2: 직접 설치

```bash
# Python 3.11+ 설치 확인
python3 --version

# 가상 환경 생성
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
nano .env  # API 키 설정

# 애플리케이션 실행
uvicorn main:app --host 0.0.0.0 --port 8000

# 또는 백그라운드 실행
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > analyzer.log 2>&1 &
```

### Systemd 서비스 등록 (프로덕션)

```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/reasoning-analyzer.service
```

```ini
[Unit]
Description=Reasoning Path Analysis Engine
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/analysis-engine
Environment="PATH=/path/to/analysis-engine/venv/bin"
EnvironmentFile=/path/to/analysis-engine/.env
ExecStart=/path/to/analysis-engine/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable reasoning-analyzer
sudo systemctl start reasoning-analyzer

# 상태 확인
sudo systemctl status reasoning-analyzer
```

---

## 설정 및 구성

### Claude API 키 발급

1. https://console.anthropic.com/ 접속
2. 계정 생성 또는 로그인
3. **API Keys** 메뉴에서 새 API 키 생성
4. 생성된 키를 `.env` 파일의 `ANTHROPIC_API_KEY`에 설정

### Moodle과 분석 엔진 연결 확인

```bash
# Moodle 서버에서 테스트
curl -X POST http://localhost:8000/api/analyze-reasoning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "attempt_id": 1,
    "question_text": "Solve: 2x + 5 = 13",
    "steps": [
      {"type": "calculation", "content": "2x + 5 - 5 = 13 - 5"},
      {"type": "calculation", "content": "2x = 8"},
      {"type": "calculation", "content": "x = 4"}
    ],
    "min_steps_required": 3
  }'
```

응답 예시:
```json
{
  "completeness_score": 85.0,
  "logical_coherence_score": 90.0,
  "method_appropriateness_score": 95.0,
  "clarity_score": 80.0,
  "final_grade": 87.5,
  "feedback": "..."
}
```

### 방화벽 설정

Moodle 서버에서 분석 엔진으로의 접근 허용:

```bash
# UFW (Ubuntu)
sudo ufw allow from moodle_server_ip to any port 8000

# iptables
sudo iptables -A INPUT -p tcp -s moodle_server_ip --dport 8000 -j ACCEPT
```

### Nginx 리버스 프록시 (선택사항)

```nginx
server {
    listen 80;
    server_name analyzer.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## 테스트

### 1. 문제 생성 테스트

1. Moodle에 교사로 로그인
2. 문제은행으로 이동
3. **새 문제 만들기 > Reasoning Path** 선택
4. 문제 설정:
   - **문제 이름**: "방정식 풀이"
   - **문제 내용**: "다음 방정식을 풀이하시오: 2x + 5 = 13"
   - **최소 필요 단계 수**: 3
   - **예상 해결 단계** (JSON):
     ```json
     [
       {"description": "양변에서 5를 뺍니다"},
       {"description": "2x = 8을 얻습니다"},
       {"description": "양변을 2로 나눕니다"},
       {"description": "x = 4를 얻습니다"}
     ]
     ```
5. **저장** 클릭

### 2. 학생 응답 테스트

1. 학생 계정으로 로그인 (또는 학생 계정 생성)
2. 퀴즈에 문제 추가
3. 퀴즈 시도
4. 추론 단계 입력:
   - **단계 1**: "양변에서 5를 빼면: 2x = 8"
   - **단계 2**: "양변을 2로 나누면: x = 4"
   - **단계 3**: "따라서 x = 4입니다"
5. 제출

### 3. 채점 확인

1. 교사 계정으로 돌아가기
2. 퀴즈 결과 확인
3. 학생 응답의 채점 결과 및 피드백 확인
4. 각 기준별 점수 확인:
   - 완성도
   - 논리적 일관성
   - 방법의 적절성
   - 명확성

### 4. 로그 확인

```bash
# Moodle 로그
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log

# 분석 엔진 로그
docker-compose logs -f analyzer
# 또는
tail -f analyzer.log
```

---

## 문제 해결

### 문제 1: 플러그인이 Moodle에서 인식되지 않음

**증상**: 플러그인 목록에 Reasoning Path가 나타나지 않음

**해결**:
```bash
# 파일 권한 확인
ls -la question/type/reasoningpath/version.php

# 올바른 권한 설정
chown -R www-data:www-data question/type/reasoningpath
chmod -R 755 question/type/reasoningpath

# Moodle 캐시 삭제
php admin/cli/purge_caches.php
```

### 문제 2: AI 분석 API 연결 실패

**증상**: "AI analysis API call failed" 오류

**해결**:
```bash
# 1. 분석 엔진 실행 확인
curl http://localhost:8000/health

# 2. 방화벽 확인
sudo ufw status
sudo iptables -L

# 3. 네트워크 연결 테스트
telnet localhost 8000

# 4. API 키 확인
grep ANALYSIS_API_KEY .env
```

### 문제 3: Claude API 오류

**증상**: "Anthropic API error" 또는 500 에러

**해결**:
```bash
# 1. API 키 유효성 확인
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "test"}]
  }'

# 2. API 사용량 확인
# https://console.anthropic.com/ 에서 확인

# 3. 환경 변수 재로드
docker-compose restart
# 또는
sudo systemctl restart reasoning-analyzer
```

### 문제 4: 데이터베이스 오류

**증상**: "Table doesn't exist" 오류

**해결**:
```sql
-- MySQL/MariaDB에 접속
mysql -u moodle_user -p moodle_db

-- 테이블 존재 확인
SHOW TABLES LIKE 'mdl_qtype_reasoningpath%';

-- 테이블이 없으면 수동 생성
-- (install.xml 기반으로 SQL 실행)
```

또는 Moodle CLI:
```bash
php admin/cli/uninstall_plugins.php --plugins=qtype_reasoningpath --run
php admin/cli/upgrade.php
```

### 문제 5: JavaScript 로드 안 됨

**증상**: 단계 추가 버튼이 작동하지 않음

**해결**:
```bash
# AMD 모듈 재빌드
php admin/cli/purge_caches.php

# JavaScript 압축 비활성화 (개발 중)
# 사이트 관리 > 개발 > 캐싱 > JavaScript 캐싱 비활성화
```

### 문제 6: 성능 저하

**증상**: AI 분석이 너무 오래 걸림

**해결**:
```bash
# 1. 캐시 활성화 확인
# 동일한 추론 패턴은 캐시에서 재사용

# 2. Claude API 응답 시간 모니터링
tail -f analyzer.log | grep "Claude API"

# 3. 타임아웃 증가
# Moodle 설정에서 API Timeout 60초로 증가

# 4. 비동기 처리 설정
# Moodle 작업 큐 사용 (향후 업데이트)
```

---

## 백업 및 유지보수

### 데이터베이스 백업

```bash
# 추론 경로 데이터만 백업
mysqldump -u root -p moodle_db \
  mdl_qtype_reasoningpath \
  mdl_qtype_reasoningpath_steps \
  mdl_qtype_reasoningpath_analysis \
  mdl_qtype_reasoningpath_cache \
  > reasoning_path_backup_$(date +%Y%m%d).sql
```

### 정기 캐시 정리

```bash
# 오래된 캐시 삭제 (30일 이상)
mysql -u root -p moodle_db -e "
DELETE FROM mdl_qtype_reasoningpath_cache
WHERE timeexpires < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));"
```

### 로그 로테이션

```bash
# /etc/logrotate.d/reasoning-analyzer
/path/to/analyzer.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## 추가 자료

- **Moodle 플러그인 개발 가이드**: https://docs.moodle.org/dev/
- **Claude API 문서**: https://docs.anthropic.com/
- **FastAPI 문서**: https://fastapi.tiangolo.com/

## 지원

문제가 지속되면:
1. 로그 파일 확인
2. GitHub Issues에 문의
3. KAIST Touch Math Academy 기술 지원팀 연락

**설치 완료!** 🎉

이제 Moodle에서 추론 경로 기반 채점을 사용할 수 있습니다.
