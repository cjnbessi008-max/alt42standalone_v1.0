# 진정 메시지 기능 구현 가이드
# Calming Message Feature Implementation Guide

## 개요 (Overview)

이 기능은 LMS와 연동하여 학생이 어려운 문제(난이도 4-5)에 진입할 때 자동으로 진정 메시지를 재생합니다.

This feature integrates with the LMS to automatically play calming messages when students enter difficult problems (difficulty level 4-5).

---

## 🏗️ 프로젝트 구조 (Project Structure)

```
alt42standalone_v1.0/
├── backend/                    # Node.js/Express 백엔드
│   ├── src/
│   │   ├── routes/            # API 라우트
│   │   │   └── calmingMessage.routes.ts
│   │   ├── config/            # 설정 파일
│   │   │   └── database.ts
│   │   └── server.ts          # 서버 진입점
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React/TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── CalmingMessage/
│   │   │       ├── CalmingMessageOverlay.tsx
│   │   │       ├── BreathingAnimation.tsx
│   │   │       ├── ProblemWithCalmingMessage.tsx
│   │   │       ├── *.css
│   │   │       └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCalmingMessage.ts
│   │   │   └── useAudioPlayer.ts
│   │   └── types/
│   │       └── calmingMessage.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── database/                   # 데이터베이스 마이그레이션
│   └── migrations/
│       └── 001_create_calming_message_tables.sql
│
├── public/                     # 정적 파일
│   └── audio/
│       └── calming_messages/
│           ├── README.md
│           ├── difficulty_4_placeholder.txt
│           └── difficulty_5_placeholder.txt
│
├── docker-compose.yml         # Docker 구성
└── CALMING_MESSAGE_IMPLEMENTATION.md (이 파일)
```

---

## 📋 사전 요구사항 (Prerequisites)

- **Node.js** 20.x 이상
- **PostgreSQL** 14.x 이상
- **Redis** 7.x (선택사항, 캐싱용)
- **Docker & Docker Compose** (선택사항, 컨테이너 실행용)

---

## 🚀 빠른 시작 (Quick Start)

### 1. Docker를 사용한 실행 (Using Docker)

```bash
# 1. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 데이터베이스 마이그레이션 실행
docker-compose exec postgres psql -U postgres -d education_system -f /docker-entrypoint-initdb.d/001_create_calming_message_tables.sql

# 4. 서비스 확인
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# Database: localhost:5432
```

### 2. 로컬 개발 환경 (Local Development)

#### 백엔드 (Backend)

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 데이터베이스 마이그레이션
psql -U postgres -d education_system -f ../database/migrations/001_create_calming_message_tables.sql

# 개발 서버 실행
npm run dev

# 서버가 http://localhost:3001 에서 실행됩니다
```

#### 프론트엔드 (Frontend)

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev

# 앱이 http://localhost:3000 에서 실행됩니다
```

---

## 💾 데이터베이스 설정 (Database Setup)

### 1. PostgreSQL 데이터베이스 생성

```sql
CREATE DATABASE education_system;
```

### 2. 마이그레이션 실행

```bash
psql -U postgres -d education_system -f database/migrations/001_create_calming_message_tables.sql
```

### 3. 생성되는 테이블

- **module_calming_config**: 모듈별 진정 메시지 설정
- **calming_message_interactions**: 진정 메시지 표시 이력 (분석용)
- **problem_metadata**: 문제 난이도 및 메타데이터

---

## 🎵 오디오 파일 준비 (Audio File Setup)

### 방법 1: TTS 서비스 사용

#### Google Cloud Text-to-Speech 사용 예시:

```bash
# gcloud CLI 설치 및 인증 필요
# 난이도 4용 오디오 생성
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  --data '{
    "input": {
      "text": "이 문제는 어렵지만 당신은 할 수 있어요. 깊게 숨을 쉬고 한 단계씩 시도해보세요."
    },
    "voice": {
      "languageCode": "ko-KR",
      "name": "ko-KR-Wavenet-A"
    },
    "audioConfig": {
      "audioEncoding": "MP3"
    }
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" | \
  jq -r '.audioContent' | base64 --decode > public/audio/calming_messages/difficulty_4.mp3

# 난이도 5용 오디오 생성
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  --data '{
    "input": {
      "text": "이것은 도전적이지만, 당신에게는 실력이 있습니다. 신중하게 생각하고 계속 노력하세요."
    },
    "voice": {
      "languageCode": "ko-KR",
      "name": "ko-KR-Wavenet-A"
    },
    "audioConfig": {
      "audioEncoding": "MP3"
    }
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" | \
  jq -r '.audioContent' | base64 --decode > public/audio/calming_messages/difficulty_5.mp3
```

### 방법 2: 전문 녹음

1. 성우를 섭외하여 메시지 녹음
2. 오디오 편집 소프트웨어로 정규화 및 편집
3. MP3 형식으로 내보내기 (128kbps 이상)
4. `public/audio/calming_messages/` 디렉토리에 배치

### 방법 3: 웹 기반 TTS (무료)

다음 웹사이트를 방문하여 오디오 생성:
- https://cloud.google.com/text-to-speech
- https://azure.microsoft.com/services/cognitive-services/text-to-speech/
- https://www.naturalreaders.com/online/

---

## 🔧 API 엔드포인트 (API Endpoints)

### 1. 설정 가져오기 (Get Configuration)

```bash
GET /api/modules/:moduleId/calming-config

# 예시
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/calming-config
```

### 2. 설정 업데이트 (Update Configuration)

```bash
POST /api/modules/:moduleId/calming-config
Content-Type: application/json

{
  "is_enabled": true,
  "difficulty_threshold": 4,
  "message_templates": {
    "4": "이 문제는 어렵지만 당신은 할 수 있어요!",
    "5": "천천히 생각해보세요. 당신을 응원합니다!"
  },
  "audio_enabled": true,
  "text_enabled": true,
  "animation_type": "breathing_circle",
  "timeout_seconds": 10
}
```

### 3. 오디오 파일 제공 (Serve Audio)

```bash
GET /api/modules/:moduleId/audio/calming_message_:level

# 예시
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/audio/calming_message_4 -o test.mp3
```

### 4. 상호작용 로깅 (Log Interaction)

```bash
POST /api/modules/:moduleId/interactions/calming_message
Content-Type: application/json

{
  "student_id": "student-uuid",
  "problem_id": "problem-uuid",
  "difficulty_level": 4,
  "message_type": "combined"
}
```

### 5. 분석 데이터 (Analytics)

```bash
GET /api/modules/:moduleId/analytics/calming_messages

# 예시
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/analytics/calming_messages
```

---

## 🎨 프론트엔드 통합 (Frontend Integration)

### 기본 사용법 (Basic Usage)

```tsx
import { ProblemWithCalmingMessage } from '@/components/CalmingMessage';

function ProblemPage() {
  return (
    <ProblemWithCalmingMessage
      moduleId="your-module-id"
      problemId="your-problem-id"
      studentId="student-id"
    >
      {/* 실제 문제 컴포넌트 */}
      <YourProblemComponent />
    </ProblemWithCalmingMessage>
  );
}
```

### 고급 사용법 (Advanced Usage)

```tsx
import { CalmingMessageOverlay } from '@/components/CalmingMessage';
import { useCalmingMessage } from '@/hooks/useCalmingMessage';

function CustomProblemPage() {
  const { config, problemMetadata, shouldShowCalmingMessage } = useCalmingMessage({
    moduleId: 'your-module-id',
    problemId: 'your-problem-id'
  });

  const [showCalming, setShowCalming] = useState(true);

  return (
    <>
      {shouldShowCalmingMessage && showCalming && config && problemMetadata && (
        <CalmingMessageOverlay
          problemId={problemMetadata.problem_id}
          studentId="student-id"
          moduleId={config.module_id}
          difficultyLevel={problemMetadata.difficulty_level}
          onComplete={() => setShowCalming(false)}
          config={config}
        />
      )}
      <YourProblemComponent />
    </>
  );
}
```

---

## 🧪 테스트 (Testing)

### 백엔드 테스트

```bash
cd backend

# API 헬스 체크
curl http://localhost:3001/health

# 설정 가져오기 테스트
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/calming-config

# 오디오 파일 테스트
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/audio/calming_message_4 -I
```

### 프론트엔드 테스트

```bash
cd frontend

# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드 테스트
npm run build
```

---

## 📊 모니터링 및 분석 (Monitoring & Analytics)

### 분석 데이터 확인

```bash
# 모듈별 진정 메시지 통계
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/analytics/calming_messages | jq

# 결과 예시:
# {
#   "stats": [...],
#   "summary": {
#     "total_interactions": 150,
#     "average_helpfulness": 67.5,
#     "most_common_difficulty": 4
#   }
# }
```

### 추적 가능한 지표

- 진정 메시지 표시 횟수
- 평균 시청 시간
- 학생 피드백 (도움이 됨/안 됨)
- 난이도별 통계
- 고유 학생 수

---

## 🔐 보안 고려사항 (Security Considerations)

1. **인증**: 교사 전용 엔드포인트에 JWT 인증 추가 필요
2. **입력 검증**: 모든 API 입력값 검증
3. **SQL 인젝션 방지**: 파라미터화된 쿼리 사용 (이미 구현됨)
4. **CORS**: 프로덕션에서는 특정 도메인만 허용
5. **Rate Limiting**: API 남용 방지를 위한 속도 제한

---

## 🚢 배포 (Deployment)

### Docker를 사용한 배포

```bash
# 1. 프로덕션 빌드
docker-compose -f docker-compose.prod.yml build

# 2. 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 3. 마이그레이션 실행
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d education_system -f /migrations/001_create_calming_message_tables.sql
```

### 환경 변수 체크리스트

- [ ] `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- [ ] `NODE_ENV=production`
- [ ] `REACT_APP_API_URL` (프론트엔드)
- [ ] CORS 허용 도메인 설정
- [ ] 오디오 파일 업로드 완료

---

## 🐛 문제 해결 (Troubleshooting)

### 1. 오디오 파일이 재생되지 않음

```bash
# 파일 존재 확인
ls -la public/audio/calming_messages/

# 파일 권한 확인
chmod 644 public/audio/calming_messages/*.mp3

# API 응답 확인
curl -I http://localhost:3001/api/modules/MODULE_ID/audio/calming_message_4
```

### 2. 데이터베이스 연결 실패

```bash
# PostgreSQL 실행 확인
pg_isready -h localhost -p 5432

# 연결 테스트
psql -U postgres -d education_system -c "SELECT version();"
```

### 3. CORS 오류

`backend/src/server.ts`에서 CORS 설정 확인:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*'
}));
```

### 4. 진정 메시지가 표시되지 않음

- 브라우저 콘솔에서 오류 확인
- 난이도 레벨이 threshold 이상인지 확인
- localStorage에서 throttle 확인: `calming_shown_*` 키 삭제

---

## 📈 향후 개선사항 (Future Enhancements)

1. **개인화**: 학생 선호도에 따른 맞춤 메시지
2. **다국어 지원**: 영어, 일본어, 중국어 등
3. **교사 업로드**: UI를 통한 커스텀 오디오 업로드
4. **아바타 통합**: 로봇 아바타가 메시지 전달
5. **적응형 난이도**: 메시지 후 난이도 조정 제안
6. **A/B 테스트**: 메시지 효과성 실험

---

## 📞 지원 (Support)

문제가 발생하면:

1. 이 문서의 문제 해결 섹션 확인
2. 관련 문서 참고:
   - `ARCHITECTURE_SUMMARY.md`
   - `CALMING_MESSAGE_FEATURE_GUIDE.md`
3. GitHub Issues 생성

---

## 📄 라이선스 (License)

MIT License - KAIST Touch Math Academy

---

**작성일**: 2025-11-18
**버전**: 1.0.0
**상태**: 구현 완료
