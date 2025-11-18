# Calm Mode Integration System
# 안정 모드 통합 시스템

> Moodle LMS와 연동하여 뇌 과열을 감지하고 푸른색 안정 모드로 자동 전환하는 교육 시스템

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![MySQL](https://img.shields.io/badge/MySQL-5.7-blue)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple)
![Moodle](https://img.shields.io/badge/Moodle-3.7-orange)
![React](https://img.shields.io/badge/React-18.2-blue)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [설정](#설정)
- [문제 해결](#문제-해결)
- [기여](#기여)
- [라이선스](#라이선스)

## 🎯 개요

Calm Mode Integration System은 Moodle LMS와 연동하여 학생들의 학습 활동 패턴을 실시간으로 분석하고, 인지 부하가 높아질 때 자동으로 푸른색 안정 모드로 전환하여 학습 효율을 최적화하는 시스템입니다.

### 핵심 개념

- **뇌 과열 감지**: 학습 활동 패턴 분석을 통한 인지 부하 추정
- **자동 전환**: 임계값 초과 시 자동으로 안정 모드 활성화
- **푸른색 UI**: 차분한 블루 컬러 팔레트로 스트레스 감소
- **Moodle 통합**: 기존 Moodle LMS와 완벽하게 통합

## ✨ 주요 기능

### 1. 🧠 뇌 과열 감지

- **실시간 모니터링**: 학습 활동을 실시간으로 추적
- **다중 메트릭 분석**:
  - 세션 지속 시간 (기본: 45분 임계값)
  - 활동 빈도 (기본: 30회/10분 임계값)
  - 오답률 (기본: 50% 임계값)
  - 응답 시간 (기본: 15초 임계값)
- **인지 부하 계산**: 가중 평균을 통한 정확한 부하 추정

### 2. 🔵 푸른색 안정 모드

- **자동 활성화**: 과열 감지 시 자동 전환
- **수동 제어**: 사용자가 직접 활성화/비활성화 가능
- **부드러운 전환**: 1.5초 애니메이션으로 자연스러운 변화
- **전체 UI 변경**:
  - 배경색: 푸른색 그라데이션
  - 텍스트: 차분한 네이비 톤
  - 버튼: 부드러운 블루 컬러
  - 카드: 흰색 배경 + 푸른색 테두리

### 3. 📚 Moodle LMS 통합

- **MySQL 5.7 연결**: Moodle 데이터베이스 직접 연동
- **Web Services API**: Moodle API를 통한 데이터 조회
- **활동 로그 동기화**: 30초마다 자동 동기화
- **메타데이터 저장**: 사용자별 안정 모드 설정 저장

### 4. 🔄 실시간 통신

- **WebSocket 연결**: 저지연 실시간 통신
- **자동 재연결**: 연결 끊김 시 자동 복구
- **이벤트 기반**: 효율적인 상태 관리

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Calm Mode UI │  │ Brain Widget │  │ WebSocket    │      │
│  │   Provider   │  │              │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ WebSocket        │ REST API         │ WebSocket
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│              Backend (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Calm Mode Integration Service               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │   Moodle     │  │    Brain     │  │ WebSocket │ │   │
│  │  │  Connector   │  │   Monitor    │  │  Handler  │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │   │
│  └─────────┼──────────────────┼─────────────────┼───────┘   │
└────────────┼──────────────────┼─────────────────┼───────────┘
             │                  │                 │
             │ MySQL            │ Events          │
             │                  │                 │
┌────────────▼──────────────────▼─────────────────▼───────────┐
│                     Data Layer                               │
│  ┌──────────────┐           ┌──────────────┐               │
│  │  MySQL 5.7   │           │   Moodle     │               │
│  │  (Moodle DB) │◄──────────┤  3.7 + PHP   │               │
│  └──────────────┘           └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

1. **활동 감지**: 학생이 Moodle에서 학습 활동 수행
2. **로그 동기화**: 백엔드가 Moodle DB에서 활동 로그 조회
3. **활동 분석**: Brain Monitor가 활동 패턴 분석 및 인지 부하 계산
4. **과열 감지**: 인지 부하가 임계값(75%) 초과
5. **모드 전환**: 자동으로 안정 모드 활성화 신호 전송
6. **UI 변경**: 프론트엔드가 푸른색 UI로 전환
7. **상태 저장**: Moodle DB에 안정 모드 상태 저장

## 🛠️ 기술 스택

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 4.18
- **Database**: MySQL 5.7 (Moodle)
- **WebSocket**: ws 8.14
- **HTTP Client**: Axios 1.6
- **Environment**: dotenv 16.3

### Frontend

- **Framework**: React 18.2
- **State Management**: Context API
- **Styling**: CSS3 with CSS Variables
- **WebSocket**: Native WebSocket API

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend)
- **LMS**: Moodle 3.7 with PHP 7.1.9

## 🚀 설치 방법

### 사전 요구사항

- Node.js 16.0 이상
- Docker & Docker Compose
- MySQL 5.7
- Moodle 3.7 (PHP 7.1.9)

### 1. Docker Compose로 설치 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 Moodle 설정 입력

# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스가 시작되면:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Moodle: http://localhost:8080
- MySQL: localhost:3306

### 2. 수동 설치

#### Backend 설치

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp ../.env.example .env
# .env 파일 편집

# 개발 모드 실행
npm run dev

# 프로덕션 모드 실행
npm start
```

#### Frontend 설치

```bash
cd frontend

# 의존성 설치
npm install

# 개발 모드 실행
npm start

# 프로덕션 빌드
npm run build
```

## 📖 사용 방법

### 1. 초기 설정

#### Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 플러그인 → 웹 서비스 → 웹 서비스 관리**
3. "웹 서비스 활성화" 체크
4. REST 프로토콜 활성화
5. 웹 서비스 토큰 생성:
   - **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
   - "토큰 추가" 클릭
   - 사용자 선택 및 토큰 생성
   - 생성된 토큰을 `.env` 파일의 `MOODLE_WS_TOKEN`에 설정

### 2. 사용자 연결

#### React 앱에서 사용

```jsx
import React, { useEffect } from 'react';
import { CalmModeProvider } from './components/CalmModeProvider';
import { CalmModeBanner } from './components/CalmModeBanner';
import { CalmModeToggle } from './components/CalmModeToggle';
import { BrainStatusWidget } from './components/BrainStatusWidget';
import { useBrainMonitor } from './hooks/useBrainMonitor';
import wsService from './services/websocket-service';
import './styles/calm-mode.css';

function App() {
  const userId = 123; // Moodle 사용자 ID

  useEffect(() => {
    // WebSocket 연결
    wsService.connect('ws://localhost:3000', userId);
    wsService.startKeepAlive();

    return () => {
      wsService.stopKeepAlive();
      wsService.disconnect();
    };
  }, [userId]);

  return (
    <CalmModeProvider>
      <div className="app">
        <header>
          <h1>학습 시스템</h1>
          <CalmModeToggle />
        </header>

        <CalmModeBanner />

        <aside>
          <BrainStatusWidget />
        </aside>

        <main>
          {/* 학습 콘텐츠 */}
        </main>
      </div>
    </CalmModeProvider>
  );
}

export default App;
```

### 3. 활동 기록

```jsx
import { useBrainMonitor } from './hooks/useBrainMonitor';

function QuizComponent() {
  const { recordActivity } = useBrainMonitor();

  const handleAnswerSubmit = (answer, isCorrect, responseTime) => {
    recordActivity({
      type: 'quiz_attempt',
      courseId: 101,
      activityId: 456,
      isError: !isCorrect,
      responseTime: responseTime
    });
  };

  return (
    // Quiz UI
  );
}
```

## 🔌 API 문서

### REST API

#### GET /health

헬스 체크

**응답:**

```json
{
  "status": "healthy",
  "moodle": {
    "mysql": true,
    "moodle": true,
    "siteInfo": {
      "sitename": "My Moodle Site",
      "release": "3.7",
      "version": "2019052000"
    }
  },
  "brainMonitor": {
    "active": true,
    "activeSessions": 5
  },
  "activitySync": {
    "active": true,
    "connectedUsers": 5
  }
}
```

#### GET /api/users/:userId/status

사용자 상태 조회

**응답:**

```json
{
  "user": {
    "id": 123,
    "username": "student1",
    "firstname": "Hong",
    "lastname": "Gildong",
    "email": "student1@example.com",
    "lastaccess": 1699999999
  },
  "brainState": {
    "userId": 123,
    "overheated": true,
    "calmModeActive": true,
    "cognitiveLoad": 0.82,
    "metrics": {
      "sessionDuration": 2850,
      "activityFrequency": 35,
      "errorRate": 0.52,
      "avgResponseTime": 16.5
    }
  },
  "courses": [
    {
      "id": 101,
      "fullname": "수학 기초",
      "shortname": "MATH101"
    }
  ]
}
```

#### POST /api/users/:userId/calm-mode

안정 모드 토글

**요청:**

```json
{
  "enabled": true
}
```

**응답:**

```json
{
  "success": true,
  "enabled": true
}
```

#### POST /api/users/:userId/activities

활동 기록

**요청:**

```json
{
  "type": "quiz_attempt",
  "courseId": 101,
  "activityId": 456,
  "isError": false,
  "responseTime": 12.5
}
```

**응답:**

```json
{
  "success": true,
  "brainState": {
    "overheated": false,
    "cognitiveLoad": 0.65,
    "calmModeActive": false
  }
}
```

### WebSocket API

#### 연결

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

#### 인증

```json
{
  "type": "auth",
  "userId": 123
}
```

#### 활동 기록

```json
{
  "type": "activity",
  "userId": 123,
  "activity": {
    "type": "quiz_attempt",
    "courseId": 101,
    "activityId": 456,
    "isError": false,
    "responseTime": 12.5
  }
}
```

#### 안정 모드 토글

```json
{
  "type": "toggle_calm_mode",
  "userId": 123,
  "enabled": true
}
```

#### 서버 → 클라이언트 이벤트

##### brain_status_update

```json
{
  "type": "brain_status_update",
  "status": {
    "overheated": true,
    "cognitiveLoad": 0.82,
    "calmModeActive": true,
    "metrics": { ... }
  }
}
```

##### calm_mode_activate

```json
{
  "type": "calm_mode_activate",
  "reason": "auto",
  "cognitiveLoad": 0.82,
  "metrics": { ... }
}
```

## ⚙️ 설정

### 환경 변수

`.env` 파일에서 다음 설정을 조정할 수 있습니다:

#### 뇌 과열 임계값

```env
BRAIN_SESSION_DURATION=2700    # 45분 (초)
BRAIN_ACTIVITY_FREQUENCY=30    # 30회/10분
BRAIN_ERROR_RATE=0.5           # 50% 오답률
BRAIN_RESPONSE_TIME=15         # 15초
BRAIN_COGNITIVE_LOAD=0.75      # 75% 인지 부하
```

#### 모니터링 간격

```env
BRAIN_CHECK_INTERVAL=60000     # 1분 (밀리초)
SYNC_INTERVAL=30000            # 30초 (밀리초)
```

### CSS 커스터마이징

`frontend/src/styles/calm-mode.css`에서 안정 모드 컬러를 변경할 수 있습니다:

```css
:root {
  --calm-bg-primary: #e3f2fd;
  --calm-bg-secondary: #bbdefb;
  --calm-text-primary: #1e3a5f;
  --calm-accent: #64b5f6;
  /* ... */
}
```

## 🐛 문제 해결

### Moodle 연결 실패

```
✗ MySQL 연결 실패: Access denied for user
```

**해결책:**
1. `.env` 파일의 Moodle DB 자격 증명 확인
2. MySQL 사용자 권한 확인
3. Moodle 데이터베이스 접근 가능 여부 확인

### WebSocket 연결 끊김

```
✗ WebSocket 연결 종료
```

**해결책:**
- 자동 재연결 기능이 활성화되어 있습니다
- 네트워크 상태 확인
- 백엔드 서버 상태 확인 (`/health` 엔드포인트)

### 안정 모드가 활성화되지 않음

**확인사항:**
1. WebSocket 연결 상태
2. 활동이 제대로 기록되고 있는지
3. 인지 부하 임계값 설정 확인
4. 브라우저 콘솔에서 에러 확인

## 📊 성능 최적화

- **WebSocket Keep-Alive**: 30초마다 ping/pong
- **활동 로그 동기화**: 30초 간격으로 배치 처리
- **메모리 관리**: 오래된 활동 데이터 자동 정리 (30분)
- **CSS 전환**: GPU 가속 애니메이션 사용

## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

## 🤝 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 제작

KAIST Touch Math Academy - AI Education System Pipeline

## 📞 문의

문제가 있거나 질문이 있으시면 Issue를 생성해주세요.
