# Alt42 - LMS 연동 한숨 감지 및 휴식 제안 시스템

학생의 학습 중 깊은 한숨을 감지하여 적절한 휴식을 제안하고, LMS와 연동하여 학습 상태를 공유하는 시스템입니다.

## 🎯 주요 기능

### 1. 깊은 한숨 감지 (Sigh Detection)
- 실시간 오디오 스트림 분석
- 주파수 스펙트럼 분석을 통한 한숨 패턴 인식
- 한숨 강도 분류 (Light / Moderate / Deep)
- 스트레스 레벨 자동 계산

### 2. 지능형 휴식 제안 (Break Suggestion)
- 스트레스 레벨 기반 맞춤형 휴식 추천
- 다양한 휴식 활동 제공 (심호흡, 스트레칭, 산책, 명상 등)
- 학습 시간 및 한숨 빈도 고려
- 한국어/영어 이중 언어 지원

### 3. LMS 연동 (LMS Integration)
- Canvas, Moodle, KAIST LMS 지원
- 학습 세션 정보 실시간 공유
- LMS를 통한 휴식 제안 알림
- 학습 분석 데이터 동기화

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React 18+)                    │
│  - 한숨 감지 인터페이스                                │
│  - 휴식 제안 모달                                      │
│  - 실시간 스트레스 레벨 표시                           │
└──────────────────┬──────────────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼──────────────────────────────────┐
│         Backend API (Python FastAPI)                 │
│  ┌─────────────────────────────────────────────┐    │
│  │  Sigh Detection Service                     │    │
│  │  - 오디오 신호 분석                           │    │
│  │  - 한숨 패턴 인식                             │    │
│  │  - 스트레스 레벨 계산                         │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Break Suggestion Service                   │    │
│  │  - 휴식 활동 추천                             │    │
│  │  - 맞춤형 제안 생성                           │    │
│  │  - 제안 이력 관리                             │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  LMS Integration Service                    │    │
│  │  - Canvas / Moodle / KAIST 연동              │    │
│  │  - 세션 관리                                  │    │
│  │  - 알림 전송                                  │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 📦 설치 및 실행

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- npm 또는 yarn

### 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
cd api
python main.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

API 문서: `http://localhost:8000/docs` (Swagger UI)

### 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

앱이 `http://localhost:3000`에서 실행됩니다.

## 🔧 환경 변수 설정

### 백엔드 (.env)
```env
# API 설정
API_HOST=0.0.0.0
API_PORT=8000

# LMS 설정 (선택사항)
CANVAS_API_URL=https://your-canvas-instance.com
CANVAS_API_TOKEN=your_token_here

MOODLE_API_URL=https://your-moodle-instance.com
MOODLE_API_TOKEN=your_token_here

KAIST_LMS_URL=https://your-kaist-lms.com
KAIST_API_TOKEN=your_token_here
```

### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

## 📖 API 사용 예시

### 1. 한숨 감지

```bash
curl -X POST "http://localhost:8000/api/sigh/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_001",
    "audio_samples": [0.1, 0.2, 0.3, ...],
    "sample_rate": 16000
  }'
```

응답:
```json
{
  "detected": true,
  "intensity": "moderate",
  "confidence": 0.85,
  "timestamp": "2025-11-18T10:30:00",
  "should_suggest_break": true,
  "stress_level": 0.7
}
```

### 2. 휴식 제안 받기

```bash
curl -X POST "http://localhost:8000/api/break/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_001",
    "stress_level": 0.7,
    "learning_duration_minutes": 90,
    "sigh_count": 3
  }'
```

응답:
```json
{
  "student_id": "student_001",
  "stress_level": 0.7,
  "reason": "You've shown signs of stress (3 deep sighs detected). Let's take a break!",
  "reason_ko": "스트레스 징후가 감지되었습니다 (3회의 깊은 한숨). 휴식을 취하세요!",
  "recommended_activities": [
    {
      "activity_id": "deep_breathing",
      "name": "Deep Breathing Exercise",
      "name_ko": "심호흡 운동",
      "duration_minutes": 5,
      "break_type": "short_break"
    }
  ],
  "timestamp": "2025-11-18T10:30:00"
}
```

### 3. LMS 등록

```bash
curl -X POST "http://localhost:8000/api/lms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_canvas",
    "lms_type": "canvas",
    "base_url": "https://canvas.example.com",
    "api_token": "your_token"
  }'
```

## 🎨 프론트엔드 컴포넌트 사용

### BreakSuggestionModal 사용 예시

```tsx
import React, { useState } from 'react';
import BreakSuggestionModal from './components/BreakSuggestion/BreakSuggestionModal';
import { useSighDetection } from './hooks/useSighDetection';

function LearningApp() {
  const [showModal, setShowModal] = useState(false);

  const {
    isDetecting,
    stressLevel,
    suggestion,
    startDetection,
    stopDetection
  } = useSighDetection({
    studentId: 'student_001',
    enabled: true,
    onBreakSuggested: (suggestion) => {
      setShowModal(true);
    }
  });

  const handleAcceptBreak = (activityId: string) => {
    console.log('Taking break:', activityId);
    // 휴식 시작 로직
  };

  return (
    <div>
      <h1>학습 중...</h1>
      <p>스트레스 레벨: {(stressLevel * 100).toFixed(0)}%</p>

      <BreakSuggestionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={handleAcceptBreak}
        suggestion={suggestion}
        language="ko"
      />
    </div>
  );
}
```

## 🧪 테스트

### 백엔드 테스트 실행

```bash
cd backend
pytest tests/ -v --cov
```

### 주요 테스트 항목
- ✅ 한숨 감지 알고리즘 정확도
- ✅ 스트레스 레벨 계산
- ✅ 휴식 제안 로직
- ✅ LMS 연동 기능
- ✅ API 엔드포인트

## 📊 지원하는 휴식 활동

| 활동 | 유형 | 시간 | 난이도 |
|------|------|------|--------|
| 심호흡 운동 | SHORT_BREAK | 5분 | Easy |
| 눈 휴식 (20-20-20) | SHORT_BREAK | 5분 | Easy |
| 수분 보충 | SHORT_BREAK | 5분 | Easy |
| 전신 스트레칭 | EXERCISE | 10분 | Easy |
| 짧은 산책 | MEDIUM_BREAK | 10분 | Easy |
| 마음챙김 명상 | MINDFULNESS | 10분 | Medium |
| 파워 낮잠 | LONG_BREAK | 20분 | Medium |
| 가벼운 운동 | EXERCISE | 15분 | Medium |
| 취미 시간 | LONG_BREAK | 15분 | Easy |
| 점진적 근육 이완 | MINDFULNESS | 15분 | Medium |

## 🔐 보안 고려사항

1. **마이크 권한**: 사용자의 명시적 동의 필요
2. **오디오 데이터**: 서버 전송 후 즉시 삭제
3. **API 토큰**: 환경 변수로 관리
4. **HTTPS**: 프로덕션 환경에서 필수

## 🚀 향후 계획

- [ ] Blackboard LMS 지원 추가
- [ ] 머신러닝 모델을 통한 한숨 감지 정확도 향상
- [ ] 학습 패턴 분석 대시보드
- [ ] 교사용 관리 인터페이스
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 확대

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Alt42 - 건강한 학습을 위한 지능형 휴식 도우미** 💙
