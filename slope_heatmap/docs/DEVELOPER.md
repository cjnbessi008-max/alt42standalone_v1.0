# Slope Heatmap 개발자 문서

## 아키텍처 개요

### 시스템 구성

```
┌─────────────────────────────────────────────────────────┐
│                    Moodle LMS                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │           mod_slopeheatmap Plugin                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │   lib.php  │  │  view.php  │  │  API      │  │  │
│  │  │  (Core)    │  │  (View)    │  │ (classes) │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Web Application                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  HTML/CSS (UI)    JavaScript Modules             │  │
│  │  ├─ smartphone.css  ├─ api.js (Communication)   │  │
│  │  └─ heatmap.css     ├─ sensor.js (Simulation)   │  │
│  │                     ├─ heatmap.js (Visualization)│  │
│  │                     └─ smartphone.js (Controller)│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 MySQL Database                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables:                                         │  │
│  │  - mdl_slopeheatmap (Activities)                │  │
│  │  - mdl_slopeheatmap_sessions (Sessions)         │  │
│  │  - mdl_slopeheatmap_sensor_data (Raw Data)      │  │
│  │  - mdl_slopeheatmap_aggregated (Heatmap)        │  │
│  │  - mdl_slopeheatmap_problems (Problems)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 디렉토리 구조

```
slope_heatmap/
├── moodle_plugin/
│   └── mod_slopeheatmap/
│       ├── version.php           # 플러그인 버전 정보
│       ├── lib.php                # 핵심 Moodle 함수들
│       ├── view.php               # 메인 뷰 페이지
│       ├── api_endpoint.php       # AJAX API 엔드포인트
│       ├── db/
│       │   ├── install.xml        # 데이터베이스 스키마 (Moodle 형식)
│       │   └── access.php         # 권한 정의
│       ├── lang/
│       │   ├── en/
│       │   │   └── slopeheatmap.php  # 영어 언어 파일
│       │   └── ko/
│       │       └── slopeheatmap.php  # 한국어 언어 파일
│       └── classes/
│           └── api.php            # API 클래스
├── webapp/
│   ├── index.html                 # 메인 HTML
│   ├── css/
│   │   ├── smartphone.css         # 가상 스마트폰 스타일
│   │   └── heatmap.css            # 히트맵 스타일
│   └── js/
│       ├── api.js                 # API 통신
│       ├── sensor.js              # 센서 시뮬레이션
│       ├── heatmap.js             # 히트맵 시각화
│       └── smartphone.js          # 메인 컨트롤러
├── database/
│   └── schema.sql                 # MySQL 스키마 (표준 SQL)
├── docs/
│   ├── INSTALLATION.md            # 설치 가이드
│   └── DEVELOPER.md               # 개발자 문서 (이 파일)
└── README.md                      # 프로젝트 개요
```

## 핵심 컴포넌트

### 1. PHP Backend (Moodle Plugin)

#### lib.php
핵심 Moodle 함수 구현

```php
// 필수 함수들
slopeheatmap_add_instance($data)      // 활동 추가
slopeheatmap_update_instance($data)   // 활동 수정
slopeheatmap_delete_instance($id)     // 활동 삭제
slopeheatmap_supports($feature)       // 기능 지원 여부
slopeheatmap_update_grades()          // 성적 업데이트
```

#### classes/api.php
RESTful API 엔드포인트 로직

```php
namespace mod_slopeheatmap;

class api {
    start_session()      // 세션 시작
    save_sensor_data()   // 센서 데이터 저장
    complete_session()   // 세션 완료
    get_heatmap_data()   // 히트맵 데이터 조회
    get_problems()       // 문제 목록 조회
}
```

### 2. JavaScript Frontend

#### api.js - API 통신 모듈
```javascript
class SlopeHeatmapAPI {
    constructor()
    request(action, data)      // 범용 API 요청
    getProblems()              // 문제 목록
    startSession(problemId)    // 세션 시작
    saveSensorData(sessionId, data)  // 데이터 저장
    completeSession(sessionId, score) // 세션 완료
    getHeatmapData(sessionId)  // 히트맵 조회
}
```

#### sensor.js - 센서 시뮬레이션
```javascript
class SlopeSensor {
    constructor()
    updateAlpha(value)        // Alpha 값 업데이트
    updateBeta(value)         // Beta 값 업데이트
    updateGamma(value)        // Gamma 값 업데이트
    startRecording(sessionId) // 기록 시작
    stopRecording()           // 기록 중지
    isInTargetRange()         // 목표 범위 확인
}
```

#### heatmap.js - 히트맵 시각화
```javascript
class SlopeHeatmap {
    constructor()
    loadData(sessionId)       // 데이터 로드
    updateLive(beta, gamma)   // 실시간 업데이트
    render()                  // 렌더링
    getColor(normalizedValue) // 색상 계산
    getStats()                // 통계 계산
}
```

#### smartphone.js - 메인 컨트롤러
```javascript
class SlopeHeatmapApp {
    constructor()
    loadProblems()            // 문제 로드
    selectProblem(problem)    // 문제 선택
    start()                   // 활동 시작
    stop()                    // 활동 중지
    calculateScore()          // 점수 계산
}
```

## 데이터 흐름

### 1. 세션 시작

```
User clicks "Start"
    ↓
smartphone.js: start()
    ↓
api.js: startSession(problemId)
    ↓
PHP: api_endpoint.php → api::start_session()
    ↓
Database: INSERT INTO mdl_slopeheatmap_sessions
    ↓
Response: session_id, problem details
    ↓
sensor.js: startRecording(sessionId)
```

### 2. 센서 데이터 수집

```
Every 100ms:
sensor.js: recordDataPoint()
    ↓
Batch accumulated (10 points)
    ↓
api.js: saveSensorData(sessionId, batch)
    ↓
PHP: api_endpoint.php → api::save_sensor_data()
    ↓
Database: INSERT INTO mdl_slopeheatmap_sensor_data (bulk)
    ↓
PHP: update_aggregated_data()
    ↓
Database: UPDATE mdl_slopeheatmap_aggregated
```

### 3. 히트맵 시각화

```
Every 500ms (live):
smartphone.js: updateLiveHeatmap()
    ↓
heatmap.js: updateLive(beta, gamma)
    ↓
heatmap.js: render()
    ↓
Canvas: drawHeatmap()

On completion:
api.js: getHeatmapData(sessionId)
    ↓
PHP: api::get_heatmap_data()
    ↓
Database: SELECT FROM mdl_slopeheatmap_aggregated
    ↓
heatmap.js: processData() → render()
```

## API 명세

### Base URL
```
/mod/slopeheatmap/api_endpoint.php
```

### 공통 파라미터
- `action`: API 액션 (필수)
- `sesskey`: Moodle 세션 키 (필수, 보안)

### 엔드포인트

#### 1. Get Problems
```http
POST /mod/slopeheatmap/api_endpoint.php
Content-Type: application/x-www-form-urlencoded

action=get_problems&cmid=1&sesskey=abc123
```

**응답**:
```json
{
  "success": true,
  "problems": [
    {
      "id": 1,
      "key": "balance_basic",
      "title": "기본 균형",
      "description": "10초 동안 기기를 수평으로 유지하세요",
      "difficulty": "easy"
    }
  ]
}
```

#### 2. Start Session
```http
POST /mod/slopeheatmap/api_endpoint.php

action=start_session&cmid=1&problemid=balance_basic&sesskey=abc123
```

**응답**:
```json
{
  "success": true,
  "session_id": 42,
  "problem": {
    "title": "기본 균형",
    "description": "...",
    "target_beta_min": -5.0,
    "target_beta_max": 5.0,
    "target_gamma_min": -5.0,
    "target_gamma_max": 5.0,
    "time_limit": 10,
    "difficulty": "easy"
  }
}
```

#### 3. Save Sensor Data
```http
POST /mod/slopeheatmap/api_endpoint.php

action=save_sensor_data&sessionid=42&data=[...]&sesskey=abc123
```

**data 파라미터** (JSON array):
```json
[
  {
    "timestamp": 1700000000,
    "alpha": 45.5,
    "beta": 12.3,
    "gamma": -8.7,
    "absolute": 1
  }
]
```

**응답**:
```json
{
  "success": true,
  "saved": 10
}
```

#### 4. Complete Session
```http
POST /mod/slopeheatmap/api_endpoint.php

action=complete_session&sessionid=42&score=85.5&sesskey=abc123
```

**응답**:
```json
{
  "success": true,
  "score": 85.5
}
```

#### 5. Get Heatmap Data
```http
POST /mod/slopeheatmap/api_endpoint.php

action=get_heatmap&sessionid=42&sesskey=abc123
```

**응답**:
```json
{
  "success": true,
  "heatmap": [
    {
      "beta_start": -180,
      "beta_end": -175,
      "gamma_start": -90,
      "gamma_end": -85,
      "count": 15,
      "duration_ms": 1500
    }
  ]
}
```

## 데이터베이스 스키마

### ERD

```
┌─────────────────────┐
│  slopeheatmap       │
│  (Activity)         │
├─────────────────────┤
│ id (PK)             │
│ course              │
│ name                │
│ intro               │
│ grade               │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐      1:N     ┌──────────────────────┐
│ slopeheatmap_       │─────────────▶│ slopeheatmap_        │
│ sessions            │              │ sensor_data          │
├─────────────────────┤              ├──────────────────────┤
│ id (PK)             │              │ id (PK)              │
│ slopeheatmap_id(FK) │              │ session_id (FK)      │
│ user_id             │              │ timestamp            │
│ problem_id          │              │ alpha                │
│ session_start       │              │ beta                 │
│ session_end         │              │ gamma                │
│ completed           │              │ absolute             │
│ score               │              └──────────────────────┘
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│ slopeheatmap_       │
│ aggregated          │
├─────────────────────┤
│ id (PK)             │
│ session_id (FK)     │
│ beta_range_start    │
│ beta_range_end      │
│ gamma_range_start   │
│ gamma_range_end     │
│ count               │
│ duration_ms         │
└─────────────────────┘

┌─────────────────────┐
│ slopeheatmap_       │
│ problems            │
├─────────────────────┤
│ id (PK)             │
│ slopeheatmap_id(FK) │
│ problem_key         │
│ title               │
│ description         │
│ target_beta_min     │
│ target_beta_max     │
│ target_gamma_min    │
│ target_gamma_max    │
│ time_limit          │
│ difficulty          │
└─────────────────────┘
```

## 커스터마이징

### 1. 히트맵 색상 변경

`webapp/js/heatmap.js`:
```javascript
this.colorStops = [
    { stop: 0.0, color: [0, 0, 255, 77] },    // 파랑
    { stop: 0.5, color: [0, 255, 0, 179] },   // 초록
    { stop: 1.0, color: [255, 0, 0, 255] }    // 빨강
];
```

### 2. 그리드 크기 조정

`webapp/js/heatmap.js`:
```javascript
this.gridSize = 5; // 5도 단위 → 원하는 값으로 변경
```

### 3. 데이터 전송 빈도

`webapp/js/sensor.js`:
```javascript
this.batchSize = 10; // 10개씩 전송 → 원하는 값으로 변경

// 기록 간격 (100ms → 원하는 값)
this.recordingInterval = setInterval(() => {
    this.recordDataPoint();
}, 100);
```

### 4. 새로운 문제 추가

SQL:
```sql
INSERT INTO mdl_slopeheatmap_problems
(slopeheatmap_id, problem_key, title, description,
 target_beta_min, target_beta_max, target_gamma_min, target_gamma_max,
 time_limit, difficulty, created_at)
VALUES
(1, 'my_custom_problem', '나만의 문제', '설명...',
 10, 20, -5, 5, 15, 'medium', UNIX_TIMESTAMP());
```

## 테스팅

### 단위 테스트 (예시)

```javascript
// test_sensor.js
describe('SlopeSensor', () => {
    let sensor;

    beforeEach(() => {
        sensor = new SlopeSensor();
    });

    test('should initialize with zero values', () => {
        expect(sensor.alpha).toBe(0);
        expect(sensor.beta).toBe(0);
        expect(sensor.gamma).toBe(0);
    });

    test('should update beta value correctly', () => {
        sensor.updateBeta(45.5);
        expect(sensor.beta).toBe(45.5);
    });

    test('should check target range correctly', () => {
        sensor.setTarget(-5, 5, -5, 5);
        sensor.updateBeta(0);
        sensor.updateGamma(0);
        expect(sensor.isInTargetRange()).toBe(true);
    });
});
```

### 통합 테스트

```bash
# Moodle Behat 테스트 (예시)
# behat_slopeheatmap.feature
Feature: Slope Heatmap Activity
  In order to track student tilt patterns
  As a teacher
  I need to create slope heatmap activities

  Scenario: Student completes a slope heatmap session
    Given I log in as "student1"
    And I am on "Course 1" course homepage
    When I follow "Slope Heatmap Test"
    And I click on "Balance Basic" "link"
    And I click on "Start" "button"
    And I wait "3" seconds
    And I click on "Complete" "button"
    Then I should see "Session Complete"
    And I should see a heatmap
```

## 디버깅

### 브라우저 콘솔

```javascript
// 전역 객체 확인
console.log(window.slopeAPI);
console.log(window.slopeSensor);
console.log(window.slopeHeatmap);
console.log(window.slopeApp);

// 상태 확인
console.log('Is recording:', window.slopeSensor.isRecording);
console.log('Current session:', window.slopeApp.currentSession);
console.log('Sensor data count:', window.slopeSensor.sensorData.length);
```

### PHP 디버깅

```php
// api.php에 추가
error_log("Sensor data received: " . print_r($sensordata, true));

// Moodle 디버그 모드 활성화
// config.php에 추가
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;
```

### MySQL 쿼리 로깅

```sql
-- 슬로우 쿼리 로깅 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

## 성능 최적화

### 1. 데이터 집계 최적화

```sql
-- 인덱스 추가 (이미 적용됨)
CREATE INDEX idx_sensor_session_time
ON mdl_slopeheatmap_sensor_data(session_id, timestamp);
```

### 2. JavaScript 번들링 (선택사항)

```bash
# Webpack 사용 예시
npm install --save-dev webpack webpack-cli

# webpack.config.js
module.exports = {
  entry: './webapp/js/smartphone.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/webapp/dist'
  }
};
```

### 3. 캐싱

```php
// lib.php에 캐싱 추가
$cache = cache::make('mod_slopeheatmap', 'problems');
$problems = $cache->get($slopeheatmapid);
if ($problems === false) {
    $problems = $DB->get_records(...);
    $cache->set($slopeheatmapid, $problems);
}
```

## 기여하기

### 코드 스타일

- **PHP**: Moodle 코딩 스타일 가이드 준수
- **JavaScript**: ESLint + Airbnb 스타일 가이드
- **CSS**: BEM 방법론

### Pull Request 프로세스

1. Feature 브랜치 생성
2. 변경사항 커밋
3. 테스트 작성 및 실행
4. PR 생성 및 설명 작성

## 라이선스

GNU GPL v3 or later

## 연락처

프로젝트 관련 문의는 이슈로 등록해주세요.
