# 설치 가이드 - Thinking Tempo Analysis System

## 시스템 요구사항

### 필수 요구사항
- **Moodle**: 3.4 이상 (테스트: 3.7)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Python**: 3.7 이상
- **웹 브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 권장 사항
- **서버 메모리**: 최소 4GB RAM
- **디스크 공간**: 최소 1GB 여유 공간
- **네트워크**: 안정적인 인터넷 연결

## 설치 단계

### 1. 데이터베이스 스키마 설치

```bash
# MySQL 데이터베이스에 연결
mysql -u root -p moodle

# 스키마 실행
source /path/to/alt42standalone_v1.0/database/schema.sql

# 설치 확인
SHOW TABLES LIKE 'mdl_thinking_tempo%';
```

예상 출력:
```
+------------------------------------------+
| Tables_in_moodle (mdl_thinking_tempo%)  |
+------------------------------------------+
| mdl_thinking_tempo_analysis              |
| mdl_thinking_tempo_config                |
| mdl_thinking_tempo_detected_patterns     |
| mdl_thinking_tempo_events                |
| mdl_thinking_tempo_map_data              |
| mdl_thinking_tempo_patterns              |
| mdl_thinking_tempo_profiles              |
| mdl_thinking_tempo_schema_version        |
| mdl_thinking_tempo_sessions              |
+------------------------------------------+
```

### 2. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/moodle-plugin/local_thinking_tempo \
      local/thinking_tempo

# 권한 설정
chown -R www-data:www-data local/thinking_tempo
chmod -R 755 local/thinking_tempo

# Moodle 업그레이드 실행 (웹 또는 CLI)
# 방법 1: 웹 인터페이스
# - Moodle에 관리자로 로그인
# - Site administration → Notifications
# - "Upgrade Moodle database now" 클릭

# 방법 2: CLI
php admin/cli/upgrade.php
```

### 3. JavaScript 모듈 빌드 (AMD)

Moodle의 AMD (Asynchronous Module Definition) 형식으로 JavaScript를 빌드합니다.

```bash
cd /var/www/html/moodle/local/thinking_tempo

# Grunt 설치 (처음 한 번만)
npm install -g grunt-cli

# 모듈 빌드
grunt amd

# 또는 Moodle의 빌드 도구 사용
cd /var/www/html/moodle
php admin/cli/build_theme.js.php
```

### 4. Python 분석 엔진 설치

```bash
cd /path/to/alt42standalone_v1.0/analysis-engine

# 가상 환경 생성 (권장)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 설정 파일 생성
cat > config.py << EOF
DB_CONFIG = {
    'host': 'localhost',
    'user': 'moodle',
    'password': 'your_password',
    'database': 'moodle'
}
EOF

# 설치 확인
python -c "import tempo_analyzer; print('Success!')"
```

### 5. 시각화 파일 설치

```bash
# 시각화 파일을 Moodle 웹 디렉토리에 복사
cp /path/to/alt42standalone_v1.0/visualization/* \
   /var/www/html/moodle/local/thinking_tempo/visualization/

# 또는 별도 웹 서버에서 호스팅
# Apache/Nginx 설정 예제:

# Nginx 설정 (/etc/nginx/sites-available/tempo-viz)
server {
    listen 8080;
    server_name localhost;

    root /path/to/alt42standalone_v1.0/visualization;
    index dashboard.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 설정

### Moodle 플러그인 설정

1. **플러그인 활성화**
   - Site administration → Plugins → Local plugins → Thinking Tempo Tracker
   - "Enable tracking" 체크

2. **추적 대상 퀴즈 선택**
   - 추적하려는 퀴즈 설정 페이지로 이동
   - "Enable thinking tempo tracking" 옵션 활성화

3. **추적 파라미터 조정** (선택 사항)
   - Site administration → Plugins → Local plugins → Thinking Tempo Tracker → Settings

   설정 가능한 파라미터:
   - `fast_tempo_threshold_ms`: Fast tempo 임계값 (기본: 500ms)
   - `normal_tempo_max_ms`: Normal tempo 최대값 (기본: 3000ms)
   - `deep_thinking_max_ms`: Deep thinking 최대값 (기본: 10000ms)
   - `stuck_threshold_ms`: Stuck 임계값 (기본: 10000ms)
   - `event_sampling_rate`: 이벤트 샘플링 비율 (기본: 1.0 = 100%)
   - `enable_mouse_tracking`: 마우스 추적 활성화 (기본: true)
   - `enable_keyboard_tracking`: 키보드 추적 활성화 (기본: true)

### 데이터베이스 설정 확인

```sql
-- 기본 설정 확인
SELECT * FROM mdl_thinking_tempo_config WHERE quiz_id IS NULL;

-- 특정 퀴즈 설정 확인
SELECT * FROM mdl_thinking_tempo_config WHERE quiz_id = 1;

-- 설정 값 변경 예제
UPDATE mdl_thinking_tempo_config
SET config_value = '1000'
WHERE config_key = 'fast_tempo_threshold_ms' AND quiz_id IS NULL;
```

### Python 분석 엔진 자동 실행 설정

분석 엔진을 자동으로 실행하도록 cron job 설정:

```bash
# crontab 편집
crontab -e

# 5분마다 새로운 세션 분석
*/5 * * * * cd /path/to/analysis-engine && /path/to/venv/bin/python analyze_pending.py >> /var/log/tempo-analysis.log 2>&1

# 또는 Moodle scheduled task 사용
# Site administration → Server → Scheduled tasks
# "Analyze thinking tempo sessions" 활성화
```

## 검증

### 설치 확인 체크리스트

- [ ] 데이터베이스 테이블 9개 생성 확인
- [ ] 기본 설정 10개 삽입 확인
- [ ] 기본 패턴 정의 8개 삽입 확인
- [ ] Moodle 플러그인 인식 확인
- [ ] JavaScript 추적기 로드 확인
- [ ] Python 분석 엔진 실행 확인
- [ ] 대시보드 접근 가능 확인

### 테스트 실행

```bash
# 1. 데이터베이스 테스트
mysql -u moodle -p moodle << EOF
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'moodle'
AND table_name LIKE 'mdl_thinking_tempo%';
EOF
# 예상 결과: 9

# 2. 플러그인 테스트
cd /var/www/html/moodle
php admin/cli/plugin_test.php --plugin=local_thinking_tempo

# 3. 분석 엔진 테스트
cd /path/to/analysis-engine
python -m pytest tests/  # 테스트 스위트 실행

# 4. 샘플 세션 생성 및 분석
python test_analysis.py
```

## 문제 해결

### 일반적인 문제

**문제**: JavaScript 추적기가 로드되지 않음
```bash
# 해결 방법:
# 1. 브라우저 콘솔에서 에러 확인
# 2. Moodle 캐시 삭제
php admin/cli/purge_caches.php

# 3. JavaScript 재빌드
grunt amd
```

**문제**: 이벤트가 데이터베이스에 저장되지 않음
```bash
# 해결 방법:
# 1. API 엔드포인트 접근 가능한지 확인
curl -X POST http://your-moodle/local/thinking_tempo/api.php?action=start_session

# 2. PHP 에러 로그 확인
tail -f /var/log/apache2/error.log  # 또는 nginx error.log

# 3. 데이터베이스 권한 확인
SHOW GRANTS FOR 'moodle'@'localhost';
```

**문제**: Python 분석 엔진이 데이터베이스에 연결 실패
```bash
# 해결 방법:
# 1. 데이터베이스 접속 정보 확인
python -c "import pymysql; pymysql.connect(host='localhost', user='moodle', password='password', database='moodle'); print('Connected!')"

# 2. config.py 파일 확인
cat analysis-engine/config.py
```

### 로그 확인

```bash
# Moodle 로그
tail -f /var/www/html/moodle/moodledata/error.log

# PHP 에러 로그
tail -f /var/log/apache2/error.log

# 분석 엔진 로그
tail -f /var/log/tempo-analysis.log

# MySQL 쿼리 로그 (디버깅 시)
# my.cnf에 추가:
# [mysqld]
# general_log = 1
# general_log_file = /var/log/mysql/query.log
```

## 성능 최적화

### 데이터베이스 최적화

```sql
-- 인덱스 확인
SHOW INDEX FROM mdl_thinking_tempo_events;

-- 느린 쿼리 확인
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- 테이블 최적화 (정기적으로 실행)
OPTIMIZE TABLE mdl_thinking_tempo_events;
OPTIMIZE TABLE mdl_thinking_tempo_sessions;
```

### 이벤트 샘플링 조정

많은 사용자가 있는 경우, 이벤트 샘플링을 통해 부하 감소:

```sql
-- 마우스 이벤트 50% 샘플링
UPDATE mdl_thinking_tempo_config
SET config_value = '0.5'
WHERE config_key = 'event_sampling_rate';

-- 마우스 추적 비활성화 (성능 향상)
UPDATE mdl_thinking_tempo_config
SET config_value = 'false'
WHERE config_key = 'enable_mouse_tracking';
```

## 백업 및 유지보수

### 정기 백업

```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/tempo-tracking"

mysqldump -u root -p moodle \
  mdl_thinking_tempo_sessions \
  mdl_thinking_tempo_events \
  mdl_thinking_tempo_analysis \
  mdl_thinking_tempo_map_data \
  mdl_thinking_tempo_profiles \
  mdl_thinking_tempo_detected_patterns \
  > $BACKUP_DIR/tempo_backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "tempo_backup_*.sql" -mtime +7 -delete
```

### 데이터 정리

```sql
-- 90일 이전 이벤트 데이터 아카이브
-- (세션 메타데이터와 분석 결과는 유지)

-- 1. 아카이브 테이블 생성
CREATE TABLE mdl_thinking_tempo_events_archive LIKE mdl_thinking_tempo_events;

-- 2. 이전 데이터 이동
INSERT INTO mdl_thinking_tempo_events_archive
SELECT * FROM mdl_thinking_tempo_events
WHERE session_id IN (
  SELECT id FROM mdl_thinking_tempo_sessions
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
);

-- 3. 원본 데이터 삭제
DELETE FROM mdl_thinking_tempo_events
WHERE session_id IN (
  SELECT id FROM mdl_thinking_tempo_sessions
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
);
```

## 업그레이드

새 버전으로 업그레이드:

```bash
# 1. 백업 먼저!
./backup_tempo_tracking.sh

# 2. 새 파일 다운로드
cd /tmp
git clone https://github.com/your-repo/thinking-tempo.git
cd thinking-tempo

# 3. 플러그인 업데이트
cp -r moodle-plugin/local_thinking_tempo/* \
      /var/www/html/moodle/local/thinking_tempo/

# 4. 데이터베이스 마이그레이션 실행
mysql -u root -p moodle < database/migrations/upgrade_1.0_to_1.1.sql

# 5. Moodle 업그레이드
php /var/www/html/moodle/admin/cli/upgrade.php
```

## 지원 및 문서

- 📚 사용자 가이드: `USER_GUIDE.md`
- 🔧 API 문서: `API_DOCUMENTATION.md`
- 🐛 이슈 리포트: GitHub Issues
- 💬 커뮤니티: Moodle Forums

---

설치 완료 후 `USER_GUIDE.md`를 참조하여 시스템 사용 방법을 확인하세요.
