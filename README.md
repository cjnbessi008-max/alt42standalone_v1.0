# Property Flip - 로그 성질 학습 앱 📐

로그 성질을 카드 뒤집기 방식으로 학습하는 인터랙티브 웹앱입니다. Moodle LMS와 연동 가능하며, 우측 하단 가상 스마트폰 화면에 표시됩니다.

## 🎯 주요 기능

- **카드 뒤집기 애니메이션**: 로그 성질을 3D 카드 뒤집기 방식으로 학습
- **스마트폰 시뮬레이터**: 우측 하단에 실제 스마트폰처럼 표시
- **Moodle LMS 연동**: Moodle 3.7+ 웹 서비스 API 지원
- **자동 재생 모드**: 자동으로 카드 넘기기
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 지원

## 🛠 기술 스택

- **Frontend**: React 18+ with TypeScript
- **Styling**: Pure CSS with 3D animations
- **LMS Integration**: Moodle Web Services REST API
- **Build Tool**: Create React App
- **Backend Compatibility**: PHP 7.1.9, MySQL 5.7, Moodle 3.7

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

앱이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

`build` 폴더에 최적화된 빌드가 생성됩니다.

## 🔗 Moodle LMS 연동

### Moodle 웹 서비스 설정

1. **Moodle 관리자 페이지** → **사이트 관리** → **플러그인** → **웹 서비스**
2. **웹 서비스 활성화**
3. **외부 서비스 생성**:
   - 이름: `Property Flip API`
   - 활성화됨: 예
4. **웹 서비스 토큰 생성**:
   - 사용자 선택
   - 서비스: `Property Flip API`
   - 토큰 저장

### 앱에서 LMS 연동

URL 파라미터로 토큰 전달:

```
http://localhost:3000?wstoken=YOUR_MOODLE_TOKEN
```

또는 `src/services/lmsApi.ts`에서 직접 설정:

```typescript
lmsApi.setToken('YOUR_MOODLE_TOKEN');
```

### Moodle 웹 서비스 함수

필요한 Moodle 웹 서비스 함수:

- `mod_quiz_get_quiz_data`: 퀴즈 데이터 가져오기
- `mod_quiz_submit_progress`: 학습 진행 상황 전송
- `core_webservice_get_site_info`: 연결 테스트

## 📱 사용 방법

### 카드 뒤집기

1. 우측 하단 스마트폰 화면 확인
2. 카드 클릭하여 앞면(공식) ↔ 뒷면(설명) 전환
3. 이전/다음 버튼으로 카드 이동
4. 자동 버튼으로 자동 재생 시작/정지

### 로그 성질 종류

- **기초**: 곱셈, 나눗셈, 거듭제곱, 1의 로그, 밑의 로그
- **밑 변환**: 밑 변환 공식
- **지수**: 지수와 로그의 관계
- **심화**: 제곱근의 로그

## 📂 프로젝트 구조

```
property-flip-app/
├── public/
│   └── index.html              # HTML 템플릿
├── src/
│   ├── components/
│   │   ├── PropertyFlipCard.tsx    # 카드 뒤집기 컴포넌트
│   │   ├── LogPropertyViewer.tsx   # 카드 뷰어 (네비게이션 포함)
│   │   └── SmartphoneSimulator.tsx # 스마트폰 시뮬레이터
│   ├── data/
│   │   └── logProperties.ts        # 로그 성질 데이터
│   ├── services/
│   │   └── lmsApi.ts               # Moodle LMS API 서비스
│   ├── styles/
│   │   ├── FlipCard.css            # 카드 애니메이션 스타일
│   │   └── Smartphone.css          # 스마트폰 UI 스타일
│   ├── types/
│   │   └── index.ts                # TypeScript 타입 정의
│   ├── App.tsx                     # 메인 앱 컴포넌트
│   └── index.tsx                   # 앱 엔트리 포인트
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 커스터마이징

### 로그 성질 추가

`src/data/logProperties.ts` 파일에 새로운 성질 추가:

```typescript
{
  id: 'custom-property',
  title: '제목',
  formula: '수식',
  explanation: '설명',
  example: '예제',
  category: 'basic' // 'basic' | 'change-of-base' | 'exponential' | 'advanced'
}
```

### 스타일 변경

- `src/styles/FlipCard.css`: 카드 디자인 및 애니메이션
- `src/styles/Smartphone.css`: 스마트폰 시뮬레이터 디자인

### LMS API 엔드포인트 변경

`src/services/lmsApi.ts`에서 `baseURL` 변경:

```typescript
const lmsApi = new LMSApiService('https://your-moodle-site.com');
```

## 🧪 개발 모드

LMS 없이 테스트하려면 Mock 데이터 사용:

```typescript
const response = await lmsApi.fetchMockProblemData();
```

## 📱 반응형 디자인

- **데스크톱**: 스마트폰 시뮬레이터가 우측 하단에 표시
- **태블릿**: 스마트폰 시뮬레이터가 중앙에 표시
- **모바일**: 전체 화면으로 표시

## 🔧 브라우저 지원

- Chrome (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- Edge (최신 2개 버전)

## 📄 라이선스

MIT License

## 👨‍💻 개발자

Claude AI Assistant

## 🤝 기여

이슈 및 풀 리퀘스트 환영합니다!

---

**Made with ❤️ for better math education**
