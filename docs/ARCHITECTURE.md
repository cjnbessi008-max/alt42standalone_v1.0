# System Architecture
# 시스템 아키텍처

## 전체 시스템 구조

```
┌────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3001)                  │   │
│  │                                                          │   │
│  │  Components:                                             │   │
│  │  • CalmModeProvider (Context)                           │   │
│  │  • CalmModeBanner (Notification)                        │   │
│  │  • CalmModeToggle (Control)                             │   │
│  │  • BrainStatusWidget (Monitoring)                       │   │
│  │                                                          │   │
│  │  Services:                                               │   │
│  │  • WebSocketService (Real-time Communication)           │   │
│  │                                                          │   │
│  │  Hooks:                                                  │   │
│  │  • useBrainMonitor (Activity Recording)                 │   │
│  │  • useCalmMode (State Management)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────┬────────────────────────────────────────────┘
                    │
                    │ WebSocket (ws://localhost:3000)
                    │ REST API (http://localhost:3000/api)
                    │
┌───────────────────▼────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Node.js Backend (Port 3000)                   │   │
│  │                                                          │   │
│  │  Main Server (server.js):                               │   │
│  │  • Express HTTP Server                                  │   │
│  │  • WebSocket Server                                     │   │
│  │  • REST API Endpoints                                   │   │
│  │                                                          │   │
│  │  Calm Mode Service:                                      │   │
│  │  • Service Orchestration                                │   │
│  │  • Event Handling                                       │   │
│  │  • Session Management                                   │   │
│  │                                                          │   │
│  │  WebSocket Handler:                                      │   │
│  │  • Connection Management                                │   │
│  │  • Message Routing                                      │   │
│  │  • Real-time Updates                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────┬────────────────────────────────────────────┘
                    │
                    │
┌───────────────────▼────────────────────────────────────────────┐
│                      Business Logic Layer                       │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │  Moodle Connector    │         │   Brain Monitor      │    │
│  │                      │         │                      │    │
│  │  • MySQL Pool        │         │  • Activity Tracking │    │
│  │  • User Info Query   │         │  • Cognitive Load    │    │
│  │  • Activity Log      │         │  • Overheating       │    │
│  │  • Course Query      │         │  • Metrics Analysis  │    │
│  │  • Metadata CRUD     │         │  • Event Emitter     │    │
│  │  • Web Services API  │         │                      │    │
│  └──────────┬───────────┘         └──────────┬───────────┘    │
└─────────────┼──────────────────────────────────┼──────────────┘
              │                                  │
              │                                  │
┌─────────────▼──────────────────────────────────▼──────────────┐
│                        Data Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MySQL 5.7 (Port 3306)                       │   │
│  │                                                          │   │
│  │  Moodle Tables:                                          │   │
│  │  • mdl_user                    (사용자 정보)            │   │
│  │  • mdl_course                  (코스 정보)              │   │
│  │  • mdl_enrol                   (등록 정보)              │   │
│  │  • mdl_user_enrolments         (사용자 등록)            │   │
│  │  • mdl_logstore_standard_log   (활동 로그)              │   │
│  │  • mdl_user_info_field         (커스텀 필드 정의)       │   │
│  │  • mdl_user_info_data          (커스텀 필드 데이터)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Moodle 3.7 + PHP 7.1.9 (Port 8080)             │   │
│  │                                                          │   │
│  │  • Web Services API (REST)                              │   │
│  │  • LTI Support (Future)                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 모듈별 상세 설계

### 1. Frontend Architecture

#### Component Hierarchy

```
App
├── CalmModeProvider (Context Provider)
│   ├── CalmModeBanner
│   ├── Header
│   │   └── CalmModeToggle
│   ├── Sidebar
│   │   └── BrainStatusWidget
│   └── Main Content
│       └── Learning Components
│           └── useBrainMonitor()
```

#### State Management

```javascript
CalmModeContext {
  isCalmMode: boolean
  showBanner: boolean
  brainStatus: {
    overheated: boolean
    cognitiveLoad: number (0.0 ~ 1.0)
    metrics: {
      sessionDuration: number (seconds)
      activityFrequency: number (count/10min)
      errorRate: number (0.0 ~ 1.0)
      avgResponseTime: number (seconds)
    }
  }
  activateCalmMode(reason)
  deactivateCalmMode()
  toggleCalmMode()
  updateBrainStatus(status)
}
```

#### CSS Architecture

```
styles/
├── calm-mode.css
│   ├── CSS Variables (:root)
│   ├── Base Styles (body.calm-mode)
│   ├── Component Styles
│   │   ├── Containers
│   │   ├── Buttons
│   │   ├── Forms
│   │   ├── Cards
│   │   └── Navigation
│   ├── Animations
│   ├── Media Queries
│   └── Accessibility
```

### 2. Backend Architecture

#### Server Structure

```
src/
├── server.js                    # Main entry point
├── moodle/
│   └── moodle-connector.js     # Moodle integration
├── brain-monitor/
│   └── brain-monitor.js        # Brain monitoring logic
├── integration/
│   ├── calm-mode-service.js    # Service orchestration
│   └── websocket-handler.js    # WebSocket handling
└── config/
    └── (configuration files)
```

#### Class Diagram

```
┌───────────────────────────┐
│    CalmModeService        │
│  (EventEmitter)           │
├───────────────────────────┤
│ - moodle                  │
│ - brainMonitor            │
│ - userConnections         │
│ - syncTimer               │
├───────────────────────────┤
│ + initialize()            │
│ + startUserSession()      │
│ + endUserSession()        │
│ + recordActivity()        │
│ + handleOverheating()     │
│ + handleCooling()         │
│ + toggleCalmMode()        │
│ + syncMoodleActivities()  │
│ + getUserStatus()         │
│ + healthCheck()           │
│ + shutdown()              │
└───────────┬───────────────┘
            │ uses
            ├──────────────────────────┐
            │                          │
┌───────────▼───────────┐  ┌───────────▼────────────┐
│  MoodleConnector      │  │   BrainMonitor         │
│                       │  │   (EventEmitter)       │
├───────────────────────┤  ├────────────────────────┤
│ - pool                │  │ - userStates           │
│ - config              │  │ - monitoringInterval   │
├───────────────────────┤  ├────────────────────────┤
│ + initializePool()    │  │ + start()              │
│ + getUserInfo()       │  │ + stop()               │
│ + getUserCourses()    │  │ + recordActivity()     │
│ + getUserActivityLog()│  │ + checkUserState()     │
│ + getUserLearningTime│  │ + calculateCognitive   │
│ + setUserMetadata()   │  │   Load()               │
│ + getUserMetadata()   │  │ + getMetrics()         │
│ + callMoodleAPI()     │  │ + getUserState()       │
│ + healthCheck()       │  │ + setCalmMode()        │
│ + close()             │  │ + endSession()         │
└───────────────────────┘  └────────────────────────┘

┌──────────────────────────┐
│  WebSocketHandler        │
├──────────────────────────┤
│ - wss                    │
│ - calmModeService        │
├──────────────────────────┤
│ + setupWebSocketServer() │
│ + handleMessage()        │
│ + handleAuth()           │
│ + handleActivity()       │
│ + handleToggleCalmMode() │
│ + handleGetStatus()      │
│ + close()                │
└──────────────────────────┘
```

### 3. Data Flow

#### 활동 기록 플로우

```
Student Action (Moodle)
      │
      ▼
Moodle DB (mdl_logstore_standard_log)
      │
      │ (Sync every 30s)
      ▼
Activity Sync Service
      │
      ▼
Brain Monitor.recordActivity()
      │
      ├─► Store in userStates.activities[]
      ├─► Calculate cognitive load
      │
      ▼
Check threshold (75%)
      │
      ├─ NO ──► Continue monitoring
      │
      └─ YES ─► Emit 'overheating' event
                      │
                      ▼
              CalmModeService.handleOverheating()
                      │
                      ├─► Save to Moodle DB (metadata)
                      ├─► Activate calm mode
                      │
                      ▼
              Send WebSocket message
                      │
                      ▼
              Frontend receives 'calm_mode_activate'
                      │
                      ▼
              CalmModeProvider.activateCalmMode()
                      │
                      ▼
              body.classList.add('calm-mode')
                      │
                      ▼
              UI transforms to blue theme
```

#### 사용자 연결 플로우

```
Frontend loads
      │
      ▼
wsService.connect(url, userId)
      │
      ▼
WebSocket connection established
      │
      ▼
Send 'auth' message { userId }
      │
      ▼
Backend: WebSocketHandler.handleAuth()
      │
      ▼
CalmModeService.startUserSession()
      │
      ├─► Query Moodle DB (user info)
      ├─► Load calm mode preference
      │
      ▼
Send 'session_started' message
      │
      ▼
Frontend: wsService.emit('session_started')
      │
      ▼
UI initializes with user data
```

### 4. Database Schema

#### Moodle Core Tables (Read-Only)

```sql
-- 사용자 정보
mdl_user
├─ id (PRIMARY KEY)
├─ username
├─ firstname
├─ lastname
├─ email
├─ suspended
├─ deleted
├─ timecreated
└─ lastaccess

-- 코스 정보
mdl_course
├─ id (PRIMARY KEY)
├─ fullname
├─ shortname
├─ category
├─ visible
└─ sortorder

-- 활동 로그
mdl_logstore_standard_log
├─ id (PRIMARY KEY)
├─ eventname
├─ component
├─ action
├─ target
├─ objecttable
├─ objectid
├─ userid (FOREIGN KEY → mdl_user.id)
├─ courseid (FOREIGN KEY → mdl_course.id)
└─ timecreated
```

#### Custom Metadata Tables (Read/Write)

```sql
-- 커스텀 필드 정의
mdl_user_info_field
├─ id (PRIMARY KEY)
├─ shortname (e.g., 'calm_mode_enabled')
├─ name
├─ datatype
├─ categoryid
├─ visible
└─ locked

-- 커스텀 필드 데이터
mdl_user_info_data
├─ id (PRIMARY KEY)
├─ userid (FOREIGN KEY → mdl_user.id)
├─ fieldid (FOREIGN KEY → mdl_user_info_field.id)
└─ data (e.g., 'true', '0.82', '1699999999')

-- Stored Fields:
-- • calm_mode_enabled: 'true' | 'false'
-- • last_overheating: timestamp (string)
-- • cognitive_load: '0.00' ~ '1.00'
-- • last_cooling: timestamp (string)
-- • overheating_duration: milliseconds (string)
```

### 5. Event System

#### Backend Events

```javascript
// BrainMonitor Events
brainMonitor.on('overheating', (data) => {
  // data: { userId, cognitiveLoad, metrics }
});

brainMonitor.on('cooling', (data) => {
  // data: { userId, cognitiveLoad, duration }
});

// CalmModeService Events
calmModeService.on('user_overheating', (data) => {
  // Custom handling
});

calmModeService.on('user_cooling', (data) => {
  // Custom handling
});
```

#### Frontend Events

```javascript
// WebSocket Events
wsService.on('connected', () => {});
wsService.on('disconnected', () => {});
wsService.on('error', (error) => {});

wsService.on('auth_success', (user) => {});
wsService.on('session_started', (data) => {});

wsService.on('brain_status_update', (status) => {});
wsService.on('calm_mode_activate', (data) => {});
wsService.on('calm_mode_deactivate', (data) => {});

wsService.on('activity_recorded', (brainState) => {});
wsService.on('calm_mode_toggled', (enabled) => {});
wsService.on('status', (status) => {});
```

### 6. Security Considerations

#### Backend Security

- **Environment Variables**: 민감한 정보는 `.env`에 저장
- **Connection Pool**: MySQL 연결 풀로 안전한 연결 관리
- **Parameterized Queries**: SQL Injection 방지
- **CORS**: 허용된 오리진만 접근 가능
- **Error Handling**: 상세한 에러 정보 노출 방지

#### Frontend Security

- **WebSocket Origin Check**: 서버에서 오리진 검증
- **XSS Prevention**: React의 기본 XSS 방어
- **HTTPS**: 프로덕션 환경에서 HTTPS 사용
- **Input Validation**: 사용자 입력 검증

### 7. Performance Optimization

#### Backend

- **Connection Pooling**: MySQL 연결 풀 (10 connections)
- **Batch Processing**: 활동 로그 30초마다 배치 조회
- **Memory Management**: 30분 이상 된 활동 데이터 자동 삭제
- **Event-Driven**: 비동기 이벤트 기반 아키텍처
- **WebSocket**: 저지연 실시간 통신

#### Frontend

- **CSS Transitions**: GPU 가속 사용 (transform, opacity)
- **Context API**: 불필요한 리렌더링 방지
- **Lazy Loading**: 필요한 컴포넌트만 로드
- **WebSocket Pooling**: 단일 WebSocket 연결 재사용
- **Local Storage**: 사용자 설정 캐싱

### 8. Scalability

#### Horizontal Scaling

- **Stateless Backend**: 상태는 MySQL과 메모리에만 저장
- **Load Balancer**: Nginx로 여러 백엔드 인스턴스 분산
- **WebSocket Sticky Sessions**: 동일 사용자는 동일 서버로 라우팅
- **Database Replication**: MySQL 읽기 복제본 사용

#### Vertical Scaling

- **Node.js Cluster**: CPU 코어당 프로세스 생성
- **Memory Optimization**: 메모리 사용량 모니터링 및 최적화
- **Database Indexing**: 쿼리 성능 최적화

### 9. Monitoring & Logging

#### Health Checks

- **Endpoint**: `GET /health`
- **Checks**:
  - MySQL 연결
  - Moodle API 연결
  - Brain Monitor 상태
  - Activity Sync 상태

#### Logging

- **Console Logs**: 개발 환경
- **File Logs**: 프로덕션 환경 (향후 추가)
- **Log Levels**: info, warn, error
- **Structured Logging**: JSON 형식 (향후 추가)

### 10. Future Enhancements

- **Redis 캐싱**: 자주 조회하는 데이터 캐싱
- **Message Queue**: RabbitMQ/Kafka로 활동 로그 처리
- **Analytics Dashboard**: 관리자용 대시보드
- **Machine Learning**: 개인화된 임계값 자동 조정
- **Mobile App**: React Native 앱 개발
- **LTI Integration**: 다른 LMS와의 통합
