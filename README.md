# Alt42 Standalone v1.0 - Value Heat LMS Integration

Moodle LMS와 연동하여 학생의 학습 진행 상황을 실시간으로 시각화하는 웹 애플리케이션입니다.
**Value Heat** 기능을 통해 값의 변화를 색온도로 표현하여 직관적인 피드백을 제공합니다.

## ✨ 주요 기능

### 🎨 Value Heat (색온도 시각화)
- 값의 변화에 따라 **파랑 → 초록 → 노랑 → 주황 → 빨강**으로 색온도 변화
- 최솟값/최댓값 도달 시 특별한 시각적 효과 (발광, 아이콘)
- 부드러운 애니메이션 전환
- 실시간 백분율 및 상태 표시

### 📱 가상 스마트폰 화면
- 우측 하단에 고정된 iPhone 스타일 가상 디바이스 (375×667px)
- 최소화/확대 기능
- 반응형 디자인으로 모바일/태블릿/데스크톱 지원
- 실시간 LMS 연결 상태 표시

### 🔗 Moodle LMS 연동
- Moodle 3.7 REST API 통합
- 실시간 퀴즈 점수 및 진행 상황 폴링
- MySQL 5.7 데이터베이스 지원
- PHP 7.1.9 호환

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS3 (모듈화)
- **HTTP Client**: Axios
- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9 (Moodle 서버)

## 📋 시스템 요구사항

### 개발 환경
- Node.js 16+
- npm 8+ 또는 yarn 1.22+

### Moodle 서버
- Moodle 3.7
- PHP 7.1.9
- MySQL 5.7
- Moodle Web Services 활성화

## 🚀 설치 및 실행

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-username/alt42standalone_v1.0.git
cd alt42standalone_v1.0
npm install
```

### 2. Moodle API 설정

```bash
# 설정 파일 복사
cp src/config/moodle.config.example.ts src/config/moodle.config.ts

# moodle.config.ts 파일을 열고 실제 정보 입력
```

`src/config/moodle.config.ts`:
```typescript
export const moodleConfig: MoodleApiConfig = {
  baseUrl: 'https://your-moodle-site.com',
  token: 'your-web-service-token',
  courseId: '1',
}
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 🔧 Moodle Web Service 설정

### 1. Web Services 활성화

Moodle 관리자 페이지:
```
Site administration > Advanced features
→ "Enable web services" 체크
```

### 2. External Service 생성

```
Site administration > Plugins > Web services > External services
→ Add 클릭
```

필요한 함수:
- `mod_quiz_get_attempt_data`
- `mod_quiz_get_user_attempts`
- `core_completion_get_activities_completion_status`

### 3. 토큰 생성

```
Site administration > Plugins > Web services > Manage tokens
→ 사용자 및 서비스 선택
→ 토큰 생성
```

### 4. 권한 설정

사용자에게 다음 권한 부여:
- `mod/quiz:attempt`
- `mod/quiz:viewreports`
- `moodle/course:viewparticipants`
- `webservice/rest:use`

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── ValueHeat.tsx    # 색온도 시각화 컴포넌트
│   │   ├── ValueHeat.css
│   │   ├── VirtualPhone.tsx # 가상 스마트폰 화면
│   │   ├── VirtualPhone.css
│   │   ├── ControlPanel.tsx # 제어 패널
│   │   └── ControlPanel.css
│   ├── services/            # API 서비스
│   │   └── moodleApi.ts     # Moodle REST API 연동
│   ├── config/              # 설정 파일
│   │   └── moodle.config.example.ts
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css
├── public/                  # 정적 파일
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 사용 방법

### 데모 모드 (Moodle 없이 테스트)

기본적으로 앱은 데모 모드로 실행됩니다. `src/App.tsx`에서 시뮬레이션 데이터를 사용합니다.

### 실제 Moodle 연동

`src/App.tsx`를 수정하여 실제 Moodle API 사용:

```typescript
import { createMoodleApi } from './services/moodleApi'
import { moodleConfig } from './config/moodle.config'

function App() {
  const [problemData, setProblemData] = useState<ProblemData>({...})

  useEffect(() => {
    const moodleApi = createMoodleApi(moodleConfig)

    // 실시간 폴링 시작 (퀴즈 시도 ID: 123)
    const stopPolling = moodleApi.startPolling(123, (data) => {
      setProblemData(data)
    }, 5000) // 5초마다 업데이트

    return () => stopPolling() // 컴포넌트 언마운트 시 폴링 중지
  }, [])

  // ...
}
```

## 🎨 Value Heat 색온도 범위

| 퍼센트 | 색상 | 설명 |
|--------|------|------|
| 0% | 🔵 진한 파랑 | 최솟값 |
| 1-20% | 🔵 파랑 | 매우 낮음 |
| 21-40% | 🟢 청록 | 낮음 |
| 41-60% | 🟡 연두 | 보통 |
| 61-80% | 🟡 노랑 | 높음 |
| 81-90% | 🟠 주황 | 경고 수준 |
| 91-99% | 🔴 진한 주황 | 위험 수준 |
| 100% | 🔴 빨강 | 최댓값 |

## 🔌 API 엔드포인트

### Moodle REST API

**Base URL**: `https://your-moodle-site.com/webservice/rest/server.php`

**공통 파라미터**:
- `wstoken`: Web service 토큰
- `wsfunction`: 함수 이름
- `moodlewsrestformat`: `json`

**주요 함수**:

1. **퀴즈 시도 데이터**
   ```
   wsfunction=mod_quiz_get_attempt_data
   attemptid=123
   ```

2. **학생 진행 상황**
   ```
   wsfunction=core_completion_get_activities_completion_status
   userid=456
   courseid=1
   ```

3. **퀴즈 성적**
   ```
   wsfunction=mod_quiz_get_user_attempts
   quizid=789
   userid=456
   ```

## 🐛 문제 해결

### CORS 오류

Moodle 서버에서 CORS 설정:

`config.php`:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
```

### 토큰 오류

- Moodle에서 토큰이 활성화되어 있는지 확인
- 서비스에 필요한 함수가 추가되었는지 확인
- 사용자 권한 확인

### MySQL 연결 오류

- MySQL 5.7이 실행 중인지 확인
- Moodle 데이터베이스 연결 정보 확인 (`config.php`)

## 📊 성능 최적화

- 폴링 간격 조정 (기본: 5초)
- React.memo로 불필요한 리렌더링 방지
- CSS 애니메이션으로 부드러운 전환
- 컴포넌트 레이지 로딩

## 🔒 보안

- `moodle.config.ts`를 `.gitignore`에 추가
- 환경 변수로 토큰 관리 권장
- HTTPS 사용 필수
- 토큰 주기적 갱신

## 📝 라이선스

MIT License

## 👥 기여

Pull Request와 Issue는 언제나 환영합니다!

## 📧 문의

프로젝트 관련 문의: [이메일 주소]

---

**Developed for KAIST Touch Math Academy**
**Moodle 3.7 | MySQL 5.7 | PHP 7.1.9**
