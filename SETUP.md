# Log Heat 설치 및 설정 가이드

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [Moodle 설정](#moodle-설정)
3. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
4. [Docker로 실행](#docker로-실행)
5. [환경 변수 설정](#환경-변수-설정)
6. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 소프트웨어

- **Node.js** 18 이상
- **PostgreSQL** 15 이상
- **Docker & Docker Compose** (Docker 사용 시)
- **Moodle** 3.7 이상 (연동 대상 LMS)

### 시스템 요구사항

- **메모리**: 최소 2GB RAM
- **디스크**: 최소 5GB 여유 공간
- **네트워크**: Moodle 서버 접근 가능

---

## Moodle 설정

Log Heat가 Moodle에서 로그 데이터를 가져오려면 Moodle에서 웹 서비스를 활성화해야 합니다.

### 1. 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 고급 기능** 으로 이동
3. **웹 서비스 활성화** 체크
4. 변경사항 저장

### 2. 외부 서비스 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스** 로 이동
2. **새 서비스 추가** 클릭
3. 서비스 정보 입력:
   - 이름: `Log Heat Service`
   - 약칭: `logheat`
   - 활성화됨: 체크
4. 저장 후 **함수 추가** 클릭

### 3. 필요한 웹 서비스 함수 추가

다음 함수들을 서비스에 추가:

```
core_webservice_get_site_info
core_course_get_courses
core_enrol_get_enrolled_users
```

### 4. 커스텀 로그 조회 플러그인 (필수)

Moodle에는 표준 로그 조회 API가 없으므로, 커스텀 플러그인을 만들어야 합니다.

#### Moodle 플러그인 생성

`local/logheat/` 디렉토리에 다음 파일 생성:

**`externallib.php`**:

```php
<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . "/externallib.php");

class local_logheat_external extends external_api {

    public static function get_logs_parameters() {
        return new external_function_parameters([
            'timefrom' => new external_value(PARAM_INT, 'Start timestamp'),
            'timeto' => new external_value(PARAM_INT, 'End timestamp'),
            'userid' => new external_value(PARAM_INT, 'User ID (0 for all)', VALUE_DEFAULT, 0),
            'courseid' => new external_value(PARAM_INT, 'Course ID (0 for all)', VALUE_DEFAULT, 0)
        ]);
    }

    public static function get_logs($timefrom, $timeto, $userid = 0, $courseid = 0) {
        global $DB;

        $params = [
            'timefrom' => $timefrom,
            'timeto' => $timeto
        ];

        $sql = "SELECT id, userid, courseid, eventname, action, target,
                       objectid, timecreated, ip
                FROM {logstore_standard_log}
                WHERE timecreated >= :timefrom AND timecreated <= :timeto";

        if ($userid > 0) {
            $sql .= " AND userid = :userid";
            $params['userid'] = $userid;
        }

        if ($courseid > 0) {
            $sql .= " AND courseid = :courseid";
            $params['courseid'] = $courseid;
        }

        $sql .= " ORDER BY timecreated DESC LIMIT 10000";

        return array_values($DB->get_records_sql($sql, $params));
    }

    public static function get_logs_returns() {
        return new external_multiple_structure(
            new external_single_structure([
                'id' => new external_value(PARAM_INT, 'Log ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'eventname' => new external_value(PARAM_TEXT, 'Event name'),
                'action' => new external_value(PARAM_TEXT, 'Action'),
                'target' => new external_value(PARAM_TEXT, 'Target'),
                'objectid' => new external_value(PARAM_INT, 'Object ID'),
                'timecreated' => new external_value(PARAM_INT, 'Time created'),
                'ip' => new external_value(PARAM_TEXT, 'IP address')
            ])
        );
    }
}
```

**`db/services.php`**:

```php
<?php
$functions = [
    'local_logheat_get_logs' => [
        'classname'   => 'local_logheat_external',
        'methodname'  => 'get_logs',
        'classpath'   => 'local/logheat/externallib.php',
        'description' => 'Get log records',
        'type'        => 'read',
        'capabilities' => 'moodle/site:config'
    ]
];

$services = [
    'Log Heat Service' => [
        'functions' => ['local_logheat_get_logs'],
        'restrictedusers' => 0,
        'enabled' => 1
    ]
];
```

플러그인 설치 후 Moodle 업그레이드 실행.

### 5. 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리** 로 이동
2. **토큰 추가** 클릭
3. 사용자 선택 (관리자 권한 필요)
4. 서비스: `Log Heat Service` 선택
5. 토큰 생성 후 복사 (나중에 사용)

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. PostgreSQL 데이터베이스 설정

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# PostgreSQL 시작
sudo systemctl start postgresql

# 데이터베이스 생성
sudo -u postgres psql
```

PostgreSQL 콘솔에서:

```sql
CREATE DATABASE logheat_db;
CREATE USER logheat_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE logheat_db TO logheat_user;
\q
```

### 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
nano .env  # 또는 원하는 에디터
```

`.env` 파일 수정:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=logheat_db
DB_USER=logheat_user
DB_PASSWORD=your_password_here

MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_token_here

CORS_ORIGIN=http://localhost:3000
```

### 4. 백엔드 실행

```bash
# 개발 모드 (nodemon으로 자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

서버가 시작되면:
```
🚀 Log Heat Server Started
📍 Port: 5000
🌍 Environment: development
🔗 API: http://localhost:5000/api
❤️  Health: http://localhost:5000/api/health
```

### 5. Moodle 연결 테스트

```bash
curl http://localhost:5000/api/moodle/test
```

성공 응답:
```json
{
  "success": true,
  "data": {
    "sitename": "Your Moodle Site",
    "release": "3.7",
    "fullname": "Admin User"
  }
}
```

### 6. 프론트엔드 설정

새 터미널에서:

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
nano .env
```

`.env` 파일 수정:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPDATE_INTERVAL=60000
REACT_APP_DEFAULT_TIME_WINDOW=1h
```

### 7. 프론트엔드 실행

```bash
npm start
```

브라우저가 자동으로 `http://localhost:3000`을 엽니다.

---

## Docker로 실행

Docker를 사용하면 한 번에 모든 서비스를 시작할 수 있습니다.

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
cd alt42standalone_v1.0
nano .env
```

내용:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_token_here
```

### 2. Docker Compose로 실행

```bash
docker-compose up -d
```

서비스 시작 확인:

```bash
docker-compose ps
```

출력 예시:
```
NAME                 COMMAND                  STATUS              PORTS
logheat-db           "docker-entrypoint.s…"   Up                  0.0.0.0:5432->5432/tcp
logheat-backend      "node src/server.js"     Up                  0.0.0.0:5000->5000/tcp
logheat-frontend     "nginx -g 'daemon of…"   Up                  0.0.0.0:3000->3000/tcp
```

### 3. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### 4. 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. 중지 및 삭제

```bash
# 중지
docker-compose stop

# 중지 및 컨테이너 삭제
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

---

## 환경 변수 설정

### 백엔드 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | `5000` |
| `NODE_ENV` | 환경 (development/production) | `development` |
| `DB_HOST` | PostgreSQL 호스트 | `localhost` |
| `DB_PORT` | PostgreSQL 포트 | `5432` |
| `DB_NAME` | 데이터베이스 이름 | `logheat_db` |
| `DB_USER` | 데이터베이스 사용자 | `postgres` |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | - |
| `MOODLE_URL` | Moodle 사이트 URL | - |
| `MOODLE_TOKEN` | Moodle 웹 서비스 토큰 | - |
| `CORS_ORIGIN` | CORS 허용 오리진 | `http://localhost:3000` |
| `LOG_UPDATE_INTERVAL` | 로그 업데이트 간격 (ms) | `60000` |

### 프론트엔드 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `REACT_APP_API_URL` | 백엔드 API URL | `http://localhost:5000/api` |
| `REACT_APP_UPDATE_INTERVAL` | 자동 갱신 간격 (ms) | `60000` |
| `REACT_APP_DEFAULT_TIME_WINDOW` | 기본 시간 윈도우 | `1h` |

---

## 문제 해결

### 1. 데이터베이스 연결 실패

**증상**: `❌ 데이터베이스 연결 실패`

**해결방법**:
- PostgreSQL이 실행 중인지 확인: `sudo systemctl status postgresql`
- 연결 정보 확인 (호스트, 포트, 사용자명, 비밀번호)
- PostgreSQL이 외부 연결을 허용하는지 확인

### 2. Moodle 연결 실패

**증상**: `Moodle API Error` 또는 연결 타임아웃

**해결방법**:
- Moodle URL이 올바른지 확인
- 토큰이 유효한지 확인
- Moodle 웹 서비스가 활성화되어 있는지 확인
- 방화벽이 Moodle 서버로의 연결을 차단하지 않는지 확인

### 3. CORS 에러

**증상**: 브라우저 콘솔에 `CORS policy` 에러

**해결방법**:
- 백엔드 `.env`의 `CORS_ORIGIN`이 프론트엔드 URL과 일치하는지 확인
- 브라우저 캐시 클리어
- 서버 재시작

### 4. 로그 데이터가 표시되지 않음

**해결방법**:
1. Moodle 플러그인이 올바르게 설치되었는지 확인
2. `/api/moodle/test` 엔드포인트로 Moodle 연결 테스트
3. `/api/sync`로 수동 동기화 시도:
   ```bash
   curl -X POST http://localhost:5000/api/sync \
     -H "Content-Type: application/json" \
     -d '{
       "timefrom": 1699000000,
       "timeto": 1699100000
     }'
   ```
4. 백엔드 로그 확인

### 5. Docker 컨테이너 시작 실패

**해결방법**:
- 포트 충돌 확인 (5000, 3000, 5432가 이미 사용 중인지)
- Docker 로그 확인: `docker-compose logs`
- 컨테이너 재시작: `docker-compose restart`

---

## 추가 설정

### 프로덕션 배포

프로덕션 환경에서는:

1. **환경 변수 보안**: `.env` 파일을 안전하게 관리
2. **HTTPS 사용**: Nginx 또는 리버스 프록시로 SSL/TLS 설정
3. **데이터베이스 백업**: 정기적인 PostgreSQL 백업 설정
4. **모니터링**: Prometheus + Grafana 또는 다른 모니터링 도구 설정
5. **로그 관리**: 로그 로테이션 및 보관 정책 설정

### 성능 최적화

- PostgreSQL 인덱스 최적화
- Redis 캐싱 추가 (선택사항)
- CDN 사용 (프론트엔드 정적 파일)
- 로드 밸런싱 (다중 백엔드 인스턴스)

---

## 도움이 필요하신가요?

이슈가 있으시면 GitHub Issues에 등록해주세요.
