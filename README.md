# 🎓 LMS 음성 칭찬 시스템 (LMS Voice Praise System)

LMS와 연동하여 학생들의 학습 진행 상황을 실시간으로 모니터링하고, 적절한 순간에 따뜻한 음성 칭찬을 자동으로 제공하는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🗣️ 자동 음성 칭찬
- **실시간 진행 상황 모니터링**: 학생의 문제 풀이 과정을 실시간으로 추적
- **지능형 칭찬 트리거**: 8가지 규칙 기반으로 적절한 순간에 자동 칭찬
- **자연스러운 한국어 TTS**: Web Speech API를 통한 따뜻한 음성 칭찬
- **다양한 칭찬 메시지**: 상황별 60+ 개의 맞춤형 칭찬 메시지

### 📊 칭찬 트리거 규칙

1. **첫 성공** (`first_success`): 첫 번째 정답 시
2. **연속 정답** (`consecutive_correct`): 3개 이상 연속 정답
3. **연속 기록** (`streak_achievement`): 5개 이상 연속 정답
4. **실력 향상** (`improvement`): 70% 이상 정확도 달성
5. **끈기** (`persistence`): 여러 시도 끝에 정답
6. **어려운 문제** (`difficult_problem`): 난이도 4-5 문제 해결
7. **이정표** (`milestone`): 10개 단위 정답 달성
8. **빠른 학습** (`fast_learner`): 80% 이상 정확도 유지

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ App.tsx      │→ │ useVoicePraise│→ │ VoicePraise     │  │
│  │              │  │ Hook          │  │ Player          │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Socket.IO + HTTP
┌────────────────────────▼────────────────────────────────────┐
│                   Node.js Backend                           │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Express API  │→ │ PraiseService │→ │ Praise Rules    │  │
│  │              │  │               │  │ & Messages      │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 16+
- npm 또는 yarn

### 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. 서버 및 클라이언트 의존성 설치
npm run install-all

# 3. 환경 변수 설정
cp .env.example .env
```

### 환경 변수 설정 (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# TTS Configuration
TTS_PROVIDER=web-speech-api
PRAISE_ENABLED=true
PRAISE_VOICE_LANG=ko-KR
PRAISE_VOICE_RATE=0.9
PRAISE_VOICE_PITCH=1.1
```

### 실행

#### 개발 모드

```bash
# 터미널 1: 백엔드 서버 실행
npm run dev

# 터미널 2: 프론트엔드 개발 서버 실행
npm run client
```

- 백엔드: http://localhost:5000
- 프론트엔드: http://localhost:3000

#### 프로덕션 빌드

```bash
# 프론트엔드 빌드
npm run build

# 서버 시작
npm start
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── server/                      # 백엔드 (Node.js + Express)
│   ├── index.js                 # 서버 진입점
│   ├── services/
│   │   └── PraiseService.js     # 칭찬 평가 로직
│   ├── routes/
│   │   ├── praise.js            # 칭찬 관련 API
│   │   └── progress.js          # 진행 상황 API
│   ├── config/
│   │   └── praiseRules.js       # 칭찬 규칙 정의
│   └── data/
│       └── praiseMessages.js    # 칭찬 메시지 데이터
│
├── client/                      # 프론트엔드 (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoicePraisePlayer.tsx    # 음성 칭찬 UI
│   │   │   └── VoicePraisePlayer.css
│   │   ├── hooks/
│   │   │   └── useVoicePraise.ts        # 칭찬 통합 훅
│   │   ├── services/
│   │   │   └── VoicePraiseService.ts    # TTS 서비스
│   │   ├── App.tsx              # 메인 앱
│   │   └── index.tsx
│   └── package.json
│
├── package.json                 # 루트 패키지 설정
└── README.md                    # 문서
```

## 🔌 API 사용법

### REST API

#### 1. 진행 상황 제출

```http
POST /api/progress/submit
Content-Type: application/json

{
  "studentId": "student-001",
  "moduleId": "fraction-basics",
  "progressData": {
    "isCorrect": true,
    "difficulty": 3,
    "problemId": "problem-1",
    "answer": "3/4"
  }
}
```

**응답:**
```json
{
  "success": true,
  "progressRecorded": true,
  "praiseTriggered": true,
  "praiseEvent": {
    "id": "uuid",
    "message": "와! 어려운 문제를 풀었어요! 정말 대단해요!",
    "voiceConfig": {
      "lang": "ko-KR",
      "rate": 0.9,
      "pitch": 1.1,
      "volume": 1.0
    }
  },
  "currentStats": {
    "totalAttempts": 5,
    "correctAnswers": 4,
    "consecutiveCorrect": 2,
    "accuracy": "80.0"
  }
}
```

#### 2. 진행 상황 조회

```http
GET /api/progress/:studentId/:moduleId
```

#### 3. 칭찬 히스토리 조회

```http
GET /api/praise/history/:studentId/:moduleId
```

#### 4. 칭찬 메시지 목록

```http
GET /api/praise/messages
```

### Socket.IO 이벤트

#### 클라이언트 → 서버

```javascript
// 학생 입장
socket.emit('student-join', {
  studentId: 'student-001',
  moduleId: 'fraction-basics'
});

// 진행 상황 업데이트
socket.emit('progress-update', {
  studentId: 'student-001',
  moduleId: 'fraction-basics',
  progressData: {
    isCorrect: true,
    difficulty: 3
  }
});
```

#### 서버 → 클라이언트

```javascript
// 음성 칭찬 이벤트 수신
socket.on('voice-praise', (praiseEvent) => {
  console.log('칭찬 받음:', praiseEvent.message);
  // TTS로 재생
});
```

## 💻 React 컴포넌트 사용법

### 기본 사용

```typescript
import React from 'react';
import VoicePraisePlayer from './components/VoicePraisePlayer';
import { useVoicePraise } from './hooks/useVoicePraise';

function MyLearningApp() {
  const {
    currentPraise,
    isConnected,
    submitProgress,
    clearPraise
  } = useVoicePraise({
    studentId: 'student-001',
    moduleId: 'my-module',
    serverUrl: 'http://localhost:5000'
  });

  const handleAnswer = async (isCorrect: boolean) => {
    await submitProgress({
      isCorrect,
      difficulty: 3,
      problemId: 'problem-1'
    });
  };

  return (
    <div>
      <h1>학습 앱</h1>
      <button onClick={() => handleAnswer(true)}>정답 제출</button>

      {/* 음성 칭찬 플레이어 */}
      <VoicePraisePlayer
        praiseEvent={currentPraise}
        onComplete={clearPraise}
      />
    </div>
  );
}
```

### 음성 서비스 직접 사용

```typescript
import VoicePraiseService from './services/VoicePraiseService';

// 음성 테스트
VoicePraiseService.testVoice('정말 잘했어요!');

// 음성 재생
await VoicePraiseService.speak({
  id: 'test',
  message: '훌륭해요!',
  voiceConfig: {
    lang: 'ko-KR',
    rate: 0.9,
    pitch: 1.1,
    volume: 1.0
  },
  timestamp: new Date().toISOString(),
  type: 'general'
});

// 음성 중지
VoicePraiseService.stop();

// 활성화/비활성화
VoicePraiseService.setEnabled(false);
```

## 🎨 칭찬 메시지 커스터마이징

`server/data/praiseMessages.js`를 수정하여 칭찬 메시지를 추가하거나 변경할 수 있습니다:

```javascript
module.exports = {
  firstSuccess: [
    '와! 첫 문제를 맞혔어요! 정말 잘했어요!',
    '훌륭해요! 첫 번째 성공이에요!',
    // 더 많은 메시지 추가...
  ],
  consecutive: [
    '우와! 연속 정답이에요! 집중력이 대단해요!',
    // ...
  ]
};
```

## 📝 칭찬 규칙 커스터마이징

`server/config/praiseRules.js`를 수정하여 새로운 규칙을 추가하거나 기존 규칙을 수정할 수 있습니다:

```javascript
module.exports = [
  {
    type: 'custom_rule',
    messageCategory: 'custom',
    condition: (history, progressData) => {
      // 커스텀 조건 로직
      return history.correctAnswers === 10;
    }
  }
];
```

## 🔧 고급 설정

### Google Cloud TTS 사용 (선택사항)

더 자연스러운 음성을 위해 Google Cloud TTS를 사용할 수 있습니다:

```bash
# .env 파일 수정
TTS_PROVIDER=google-tts
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Azure TTS 사용 (선택사항)

```bash
# .env 파일 수정
TTS_PROVIDER=azure-tts
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=your_region
```

## 🧪 테스트

```bash
# API 테스트 (서버가 실행 중일 때)
curl http://localhost:5000/api/health

# 칭찬 메시지 목록 확인
curl http://localhost:5000/api/praise/messages

# 진행 상황 제출 테스트
curl -X POST http://localhost:5000/api/progress/submit \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "test-student",
    "moduleId": "test-module",
    "progressData": {
      "isCorrect": true,
      "difficulty": 3
    }
  }'
```

## 🎯 활용 예시

### 1. 수학 학습 앱
- 분수, 소수, 기하학 문제 풀이
- 단계별 난이도 조정
- 실시간 칭찬 피드백

### 2. 언어 학습 앱
- 어휘 암기 진도 추적
- 발음 연습 칭찬
- 문법 문제 해결 격려

### 3. 코딩 학습 플랫폼
- 알고리즘 문제 해결
- 프로젝트 완성도 추적
- 디버깅 성공 칭찬

## 📈 성능 최적화

- **칭찬 쿨다운**: 30초 간격으로 칭찬 제한 (과도한 칭찬 방지)
- **메모리 관리**: 학생 히스토리 Map 기반 효율적 저장
- **Socket.IO**: 실시간 양방향 통신
- **HTTP 백업**: Socket 실패 시 HTTP API로 폴백

## 🔒 보안 고려사항

- CORS 설정: 허용된 도메인만 접근
- 학생 ID 검증: 실제 환경에서는 인증 시스템 통합 필요
- Rate Limiting: API 호출 제한 (프로덕션에서 추가 권장)

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 📄 라이선스

MIT License

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for better learning experiences**
