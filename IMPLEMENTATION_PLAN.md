# Scale Sound 기능 구현 계획

## 프로젝트 개요
닮음 배율이 커질수록 음높이가 높아지는 인터랙티브 수학 교육 웹앱

## 기술 스택

### 프론트엔드
- **React 18+** with TypeScript
- **Web Audio API** - Scale Sound 음향 구현
- **CSS Grid/Flexbox** - 스마트폰 시뮬레이터 레이아웃
- **Axios** - API 통신

### 백엔드
- **Node.js 16+** with Express
- **MySQL 5.7** - 데이터 저장
- **mysql2** - MySQL 드라이버
- **cors** - CORS 처리

### Moodle 연동
- **Moodle 3.7 REST API**
- 문제 정보 동기화
- 학습자 진행도 전송

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│  Desktop Browser                                │
│  ┌───────────────┬─────────────────────────┐   │
│  │               │  ┌─────────────────┐    │   │
│  │  Left Panel   │  │  Smartphone     │    │   │
│  │  (Controls)   │  │  Simulator      │    │   │
│  │               │  │  ┌───────────┐  │    │   │
│  │  - 배율 슬라이더 │  │  │ 도형 표시  │  │    │   │
│  │  - 문제 선택    │  │  │ Scale     │  │    │   │
│  │  - 설정        │  │  │ Sound ♪   │  │    │   │
│  │               │  │  └───────────┘  │    │   │
│  │               │  └─────────────────┘    │   │
│  └───────────────┴─────────────────────────┘   │
└─────────────────────────────────────────────────┘
        ↓                           ↓
   [Backend API]              [Web Audio API]
        ↓
   [MySQL DB] ←→ [Moodle LMS]
```

## 핵심 기능

### 1. Scale Sound (음높이 변화)
- 닮음 배율 범위: 0.5x ~ 3.0x
- 음높이 매핑:
  - 0.5x → C4 (261.63 Hz)
  - 1.0x → A4 (440.00 Hz) - 기준음
  - 2.0x → A5 (880.00 Hz)
  - 3.0x → C#6 (1108.73 Hz)
- Web Audio API OscillatorNode 사용

### 2. 스마트폰 시뮬레이터
- 우측 하단 고정 위치
- 반응형 디자인 (375px × 667px - iPhone SE 기준)
- 도형 닮음비 시각화
- 실시간 상호작용

### 3. Moodle 연동
- REST API를 통한 문제 정보 가져오기
- 학습 진행도 저장
- 인증 토큰 관리

## 디렉토리 구조

```
/alt42standalone_v1.0/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── SmartphoneSimulator/
│   │   │   │   ├── SmartphoneSimulator.tsx
│   │   │   │   └── SmartphoneSimulator.css
│   │   │   ├── ScaleControl/
│   │   │   │   ├── ScaleControl.tsx
│   │   │   │   └── ScaleControl.css
│   │   │   └── ShapeDisplay/
│   │   │       ├── ShapeDisplay.tsx
│   │   │       └── ShapeDisplay.css
│   │   ├── services/
│   │   │   ├── audioService.ts        # Web Audio API 래퍼
│   │   │   ├── moodleAPI.ts          # Moodle 연동
│   │   │   └── scaleCalculator.ts    # 배율 계산
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── moodle.js             # Moodle 프록시 API
│   │   │   ├── problems.js           # 문제 CRUD
│   │   │   └── progress.js           # 학습 진행도
│   │   ├── config/
│   │   │   └── database.js           # MySQL 연결
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql                    # 테이블 스키마
│   └── seed.sql                      # 샘플 데이터
│
├── docs/
│   ├── API.md                        # API 문서
│   └── MOODLE_INTEGRATION.md        # Moodle 연동 가이드
│
└── README.md
```

## 데이터베이스 스키마

### problems 테이블
```sql
CREATE TABLE problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_id INT,
    title VARCHAR(255),
    description TEXT,
    original_shape JSON,        -- 원본 도형 좌표
    scale_range_min DECIMAL(3,2) DEFAULT 0.5,
    scale_range_max DECIMAL(3,2) DEFAULT 3.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_progress 테이블
```sql
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    problem_id INT,
    scale_value DECIMAL(3,2),
    completed BOOLEAN DEFAULT FALSE,
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);
```

## API 엔드포인트

### 백엔드 API
- `GET /api/problems` - 문제 목록
- `GET /api/problems/:id` - 문제 상세
- `POST /api/progress` - 진행도 저장
- `GET /api/moodle/sync` - Moodle 동기화

### Moodle REST API (연동)
- `POST /webservice/rest/server.php`
  - `wsfunction=mod_quiz_get_quizzes_by_courses`
  - `wsfunction=core_course_get_contents`

## 구현 단계

1. ✅ 프로젝트 구조 설계
2. ⏳ 프론트엔드 기본 구조 생성
3. ⏳ 백엔드 API 서버 구축
4. ⏳ MySQL 데이터베이스 설정
5. ⏳ 스마트폰 시뮬레이터 UI
6. ⏳ Scale Sound 기능 (Web Audio API)
7. ⏳ Moodle 연동
8. ⏳ 테스트 및 배포

## Scale Sound 음계 매핑 알고리즘

```typescript
// 배율 → 주파수 변환 (로그 스케일)
function scaleToFrequency(scale: number): number {
    const baseFreq = 440; // A4
    const minScale = 0.5;
    const maxScale = 3.0;

    // 로그 스케일로 매핑
    const logScale = Math.log2(scale);
    const logMin = Math.log2(minScale);
    const logMax = Math.log2(maxScale);

    // -12 ~ +12 반음 범위로 변환
    const semitones = ((logScale - logMin) / (logMax - logMin)) * 24 - 12;

    // 주파수 계산
    return baseFreq * Math.pow(2, semitones / 12);
}
```

## 향후 확장 계획
- 다양한 도형 지원 (삼각형, 원, 다각형)
- 애니메이션 효과
- 사운드 테마 선택 (피아노, 신디사이저, 현악기)
- 다국어 지원 (한국어, 영어)
- 모바일 네이티브 앱 (React Native)
