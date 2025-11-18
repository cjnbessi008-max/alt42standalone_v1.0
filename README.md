# ALT42 Flip Moment Visual Effects

웹앱, LMS와 연동해서 문제 정보를 받아서 동작하는 시스템입니다. 우측 하단 가상 스마트폰 화면에 표시되는 앱으로, 방향이 뒤집히는 순간 시각효과가 반전되는 **Flip Moment** 기능을 제공합니다.

## 🎯 주요 기능

### 1. **Flip Moment 시각 효과**
- 디바이스 방향 전환 감지 (Portrait ↔ Landscape)
- 방향이 바뀌는 순간 다양한 시각 효과 적용:
  - 색상 반전 (Color Inversion)
  - 회전 애니메이션
  - 스케일 변화
  - 필터 효과 (밝기, 대비, 채도, 색조 회전)

### 2. **가상 스마트폰 디스플레이**
- 우측 하단에 실시간 모바일 화면 시뮬레이션
- 실제 스마트폰과 유사한 UI (노치, 상태바, 홈 인디케이터)
- 크기 조절 가능 (small, medium, large)
- 위치 변경 가능 (4개 코너)

### 3. **Moodle LMS 연동**
- Moodle 3.7 데이터베이스에서 문제 정보 가져오기
- 다양한 문제 유형 지원:
  - 객관식 (Multiple Choice)
  - O/X 문제 (True/False)
  - 단답형 (Short Answer)
- 실시간 문제 로딩 및 표시

## 🛠 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Framer Motion** - 애니메이션
- **Vite** - 빌드 도구
- **Custom Hooks** - 재사용 가능한 로직

### Backend
- **PHP 7.1.9** - Moodle 호환성
- **MySQL 5.7** - 데이터베이스
- **Moodle 3.7** - LMS 연동
- **RESTful API** - 데이터 통신

## 📦 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   └── VirtualSmartphone.tsx
│   │   ├── hooks/            # Custom Hooks
│   │   │   ├── useFlipDetection.ts
│   │   │   └── useVisualEffects.ts
│   │   ├── styles/           # CSS 스타일
│   │   │   ├── App.css
│   │   │   ├── index.css
│   │   │   └── VirtualSmartphone.css
│   │   ├── App.tsx           # 메인 앱
│   │   └── main.tsx          # 엔트리 포인트
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # PHP 백엔드
│   ├── api/
│   │   ├── config.php        # DB 설정
│   │   ├── questions.php     # Questions API
│   │   ├── .htaccess         # Apache 설정
│   │   └── .env.example      # 환경 변수 예제
│   └── moodle/               # Moodle 연동
│
└── README.md
```

## 🚀 설치 및 실행

### 1. 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 2. 백엔드 설정

#### 환경 변수 설정
```bash
cd backend/api
cp .env.example .env
# .env 파일을 편집하여 DB 정보 입력
```

#### Apache 설정
```bash
# Apache에서 mod_rewrite 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2

# backend/api 디렉토리를 웹 서버 루트에 링크
sudo ln -s /path/to/alt42standalone_v1.0/backend/api /var/www/html/api
```

#### MySQL 데이터베이스
```sql
-- Moodle 데이터베이스 사용
-- 또는 데모 모드로 실행 (자동으로 샘플 데이터 제공)
```

### 3. Moodle 연동 (선택사항)

Moodle이 설치되어 있는 경우:
1. `.env` 파일에 Moodle DB 정보 입력
2. `MOODLE_PREFIX` 설정 (기본값: `mdl_`)
3. API가 자동으로 Moodle 문제 테이블에서 데이터 가져옴

Moodle이 없는 경우:
- 데모 모드로 자동 실행
- 샘플 문제가 자동으로 제공됨

## 📱 사용 방법

### 기본 사용
1. 애플리케이션 실행
2. 우측 하단에 가상 스마트폰 화면 표시 확인
3. 브라우저 창 크기를 조절하여 방향 전환
4. **Flip Moment** 효과 확인!

### Flip Moment 테스트
- **데스크톱**: 브라우저 창을 세로/가로로 리사이즈
- **모바일**: 디바이스를 실제로 회전
- **개발자 도구**: Chrome DevTools의 Device Toolbar 사용

### 문제 불러오기
- Question ID 입력란에 숫자 입력
- "Random" 버튼으로 랜덤 문제 로드
- Moodle DB 또는 데모 데이터에서 자동으로 가져옴

## 🎨 커스터마이징

### 가상 스마트폰 설정
```tsx
<VirtualSmartphone
  moodleApiUrl="/api/moodle/questions"
  questionId={1}
  position="bottom-right"  // bottom-left, top-right, top-left
  size="medium"            // small, medium, large
/>
```

### Flip 효과 옵션
```tsx
const { filterStyle, transformStyle } = useVisualEffects(
  flipDirection,
  orientation,
  isFlipping,
  {
    enableColorInversion: true,
    enableRotation: true,
    enableScaling: true,
    enableFilterEffects: true,
    transitionDuration: 600,
  }
);
```

## 🔧 API 엔드포인트

### 단일 문제 조회
```
GET /api/moodle/questions/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "다음 중 분수 3/4를 소수로 나타내면?",
    "type": "multiple_choice",
    "options": ["0.25", "0.5", "0.75", "1.0"],
    "correctAnswer": "0.75",
    "points": 1.0,
    "category": "Mathematics - Fractions"
  }
}
```

### 문제 목록 조회
```
GET /api/moodle/questions?limit=10&offset=0
```

## 🎯 주요 컴포넌트 설명

### useFlipDetection Hook
디바이스 방향 변화를 감지하고 Flip 이벤트를 추적합니다.

**반환값:**
- `orientation`: 현재 방향 (portrait/landscape)
- `flipDirection`: 회전 방향 (clockwise/counterclockwise/none)
- `isFlipping`: 현재 flip 중인지 여부
- `flipCount`: 총 flip 횟수

### useVisualEffects Hook
Flip Moment 시 적용할 시각 효과를 생성합니다.

**기능:**
- 색상 반전 (invert filter)
- 회전 애니메이션 (rotate transform)
- 스케일 변화 (scale transform)
- 필터 효과 (brightness, contrast, hue-rotate, saturate)

### VirtualSmartphone Component
우측 하단에 표시되는 가상 스마트폰 화면입니다.

**주요 기능:**
- 실제 스마트폰 UI 시뮬레이션
- Moodle 문제 표시
- Flip Moment 효과 적용
- 반응형 디자인

## 🐛 문제 해결

### API 연결 실패
- `.env` 파일의 DB 정보 확인
- Apache mod_rewrite 활성화 확인
- CORS 설정 확인

### Flip 효과가 작동하지 않음
- 브라우저의 방향 전환 지원 확인
- DevTools에서 디바이스 에뮬레이션 사용
- 콘솔에서 에러 메시지 확인

### 문제가 로드되지 않음
- API 엔드포인트 확인 (`/api/moodle/questions`)
- 네트워크 탭에서 요청/응답 확인
- 데모 모드로 자동 전환되는지 확인

## 📄 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

**Made with ❤️ for ALT42 Education System**
