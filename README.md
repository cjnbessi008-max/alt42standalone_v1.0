# 히스토그램 비트 (Histogram Beat)

음악 리듬처럼 반응하는 히스토그램 교육용 웹 애플리케이션입니다.
Moodle LMS와 연동하여 문제 정보를 받아서 동작하며, 우측 하단 가상 스마트폰 화면에 표시됩니다.

## 주요 기능

### 📊 Histogram Beat (히스토그램 비트)
- **음악 리듬 애니메이션**: 히스토그램 막대가 음악의 비트처럼 펄스 애니메이션으로 반응합니다
- **실시간 인터랙션**: 막대를 클릭하여 답을 선택할 수 있습니다
- **비트 주파수 조절 가능**: 1.5 Hz (90 BPM) 기본값, 커스터마이징 가능
- **사인파 기반 애니메이션**: 자연스러운 펄스 효과
- **물결 효과**: 각 막대에 위상차를 주어 물결처럼 흐르는 효과

### 🎯 LMS 연동
- **Moodle 3.7 호환**: 표준 Moodle API 연동
- **실시간 문제 로딩**: URL 파라미터를 통해 세션 정보 전달
- **답안 자동 제출**: 정답/오답 피드백 및 점수 계산
- **학습 데이터 추적**: 문제 풀이 시간, 정답률 등 기록

### 📱 반응형 디자인
- **데스크톱**: 메인 화면 + 우측 하단 가상 스마트폰 화면
- **태블릿/모바일**: 전체 화면 최적화
- **터치 지원**: 모바일 터치 이벤트 완벽 지원

## 기술 스택

### Frontend
- **React 18** - 최신 React 버전
- **TypeScript 5** - 타입 안정성
- **Vite 4** - 빠른 빌드 도구
- **Canvas API** - 고성능 히스토그램 렌더링

### Backend/LMS
- **Moodle 3.7** - Learning Management System
- **PHP 7.1.9** - 서버 사이드 로직
- **MySQL 5.7** - 데이터베이스

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 3. 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 4. 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── frontend/
│   ├── components/
│   │   ├── HistogramBeat.tsx         # 히스토그램 비트 컴포넌트
│   │   └── SmartphoneFrame.tsx       # 스마트폰 프레임
│   ├── hooks/
│   │   └── useResponsive.ts          # 반응형 훅
│   ├── utils/
│   │   └── lmsApi.ts                 # LMS API 연동
│   ├── types/
│   │   ├── histogram.types.ts        # 히스토그램 타입
│   │   └── lms.types.ts              # LMS 타입
│   └── App.tsx                       # 메인 앱
└── main.tsx                          # 진입점
```

## 사용 방법

### 개발/테스트 모드 (Mock 데이터)
개발 서버를 실행하면 자동으로 Mock 데이터를 사용합니다.

### Moodle LMS 연동 모드
Moodle에서 다음과 같은 URL 파라미터와 함께 앱을 실행합니다:

```
https://your-domain.com/histogram-beat/?sesskey=abc123&userid=1&courseid=5&cmid=42
```

**파라미터:**
- `sesskey`: Moodle 세션 키
- `userid`: 학생 ID
- `courseid`: 코스 ID
- `cmid`: Activity Module ID

## 주요 컴포넌트

### HistogramBeat
히스토그램을 렌더링하고 음악 리듬 애니메이션을 제공합니다.

**Props:**
```typescript
interface HistogramBeatProps {
  data: HistogramData[];           // 히스토그램 데이터
  config?: Partial<HistogramConfig>; // 설정 (선택)
  onBarClick?: (index: number, data: HistogramData) => void; // 클릭 핸들러
}
```

**주요 기능:**
- Canvas 기반 고성능 렌더링
- requestAnimationFrame을 사용한 부드러운 애니메이션
- 사인파 기반 비트 계산
- 호버/클릭 인터랙션
- 그라데이션 및 그림자 효과

### SmartphoneFrame
데스크톱에서 우측 하단에 가상 스마트폰 화면을 표시합니다.

**Props:**
```typescript
interface SmartphoneFrameProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  width?: number;   // 기본값: 375px
  height?: number;  // 기본값: 667px
}
```

**특징:**
- iPhone 스타일 프레임 디자인
- 노치(Notch) 및 홈 버튼 영역
- 스크롤 지원
- Fixed 포지셔닝

## 비트 애니메이션 원리

### 1. 비트 위상 계산
```typescript
phase = (elapsed * beatFrequency) % 1  // 0-1 범위
```

### 2. 사인파 기반 스케일
```typescript
sineWave = Math.sin(phase * Math.PI * 2)
scale = baseScale + (sineWave + 1) / 2 * intensity
```

### 3. 물결 효과
각 막대에 `index * 0.1`의 위상차를 주어 순차적으로 펄스합니다.

## LMS 연동

### API 엔드포인트

**문제 불러오기**
```php
POST /mod/histogram_beat/api.php?action=load_problem
{
  "sessionKey": "abc123",
  "activityId": 42,
  "problemIndex": 0
}
```

**답안 제출**
```php
POST /mod/histogram_beat/api.php?action=submit_answer
{
  "sessionKey": "abc123",
  "problemId": 1,
  "answer": "20-30",
  "timeSpent": 45
}
```

### 데이터베이스 스키마 (MySQL 5.7)

```sql
-- 문제 테이블
CREATE TABLE mdl_histogram_beat_problems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  activity_id INT NOT NULL,
  question_text TEXT NOT NULL,
  histogram_data JSON NOT NULL,
  correct_answer VARCHAR(255),
  options JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 학생 응답 테이블
CREATE TABLE mdl_histogram_beat_responses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  problem_id INT NOT NULL,
  answer VARCHAR(255) NOT NULL,
  is_correct BOOLEAN,
  time_spent INT,  -- seconds
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES mdl_histogram_beat_problems(id)
);
```

## 커스터마이징

### 비트 설정 변경
```typescript
<HistogramBeat
  data={histogramData}
  config={{
    beatIntensity: 0.3,    // 0-1: 애니메이션 강도
    beatFrequency: 2.0,    // Hz: 초당 비트 수
    width: 600,
    height: 400,
  }}
/>
```

### 색상 커스터마이징
```typescript
const customData: HistogramData[] = [
  { label: '0-10', value: 5, color: '#FF6B6B' },
  { label: '10-20', value: 12, color: '#4ECDC4' },
  // ...
];
```

## 브라우저 지원

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+

## 성능 최적화

- **Canvas API**: DOM 조작 없이 직접 렌더링
- **requestAnimationFrame**: 브라우저 최적화 애니메이션
- **메모이제이션**: React.memo 및 useMemo 활용
- **번들 최적화**: Vite의 코드 스플리팅

## 개발 가이드

### 새로운 애니메이션 효과 추가
1. `HistogramBeat.tsx`의 `calculateBeatScale` 함수 수정
2. 다양한 수학 함수 적용 (삼각파, 사각파 등)

### LMS 엔드포인트 추가
1. `lmsApi.ts`에 새로운 API 함수 추가
2. `lms.types.ts`에 타입 정의
3. PHP 백엔드에 해당 액션 구현

## 문제 해결

### Mock 데이터만 표시되는 경우
- URL 파라미터(`sesskey`, `userid` 등)가 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인
- LMS API 엔드포인트가 올바른지 확인

### 애니메이션이 끊기는 경우
- `beatFrequency`를 낮춰보세요 (예: 1.0)
- `beatIntensity`를 낮춰보세요 (예: 0.15)

### 스마트폰 프레임이 보이지 않는 경우
- 화면 너비가 1024px 이상인지 확인 (데스크톱 전용)
- CSS z-index 충돌 확인

## 라이선스

MIT

## 기여

이슈와 PR을 환영합니다!

## 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
