# 3D Area Space 🎓

넓이를 3D로 감각화하는 학습 웹앱 - KAIST Touch Math Academy

## 📱 주요 기능

- **3D 넓이 시각화**: Three.js를 활용한 인터랙티브 3D 도형 표현
- **Moodle LMS 연동**: MySQL 데이터베이스에서 문제 정보 자동 로드
- **가상 스마트폰 화면**: 우측 하단에 실제 스마트폰 UI 시뮬레이터
- **다양한 도형 지원**: 직사각형, 정사각형, 원, 삼각형
- **인터랙티브 조작**: 마우스로 3D 모델 회전, 확대/축소

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Three.js** + React Three Fiber (3D 시각화)
- **Tailwind CSS** (반응형 UI)
- **Vite** (빌드 도구)
- **Axios** (API 통신)

### Backend
- **Node.js** + Express
- **MySQL 5.7** (Moodle 데이터베이스)
- RESTful API

### LMS
- **Moodle 3.7**
- **PHP 7.1.9**

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── AreaVisualization3D.tsx   # 3D 시각화
│   │   ├── PhoneFrame.tsx            # 스마트폰 프레임
│   │   ├── ProblemSelector.tsx       # 문제 선택
│   │   └── AnswerPanel.tsx           # 답변 입력
│   ├── api/
│   │   └── moodleApi.ts      # Moodle API 통신
│   ├── App.tsx               # 메인 앱
│   ├── main.tsx              # 앱 엔트리
│   └── index.css             # 글로벌 스타일
├── server/
│   ├── index.js              # Express 서버
│   └── .env.example          # 환경변수 예시
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cd server
cp .env.example .env
```

`.env` 파일 수정:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=moodle
DB_PASSWORD=your_password
DB_NAME=moodle
PORT=3001
```

### 3. 서버 실행

**백엔드 서버** (터미널 1):
```bash
npm run server
```

**프론트엔드 개발 서버** (터미널 2):
```bash
npm run dev
```

### 4. 브라우저 접속

```
http://localhost:3000
```

## 📊 Moodle 데이터베이스 연동

### 필요한 테이블 구조

```sql
-- 문제 테이블 (Moodle 기본 구조)
mdl_question
├── id
├── name (문제 제목)
├── questiontext (문제 설명)
└── qtype (문제 유형)

mdl_question_categories
├── id
└── name (카테고리명)
```

### 목업 데이터 모드

Moodle DB에 연결할 수 없는 경우, 서버가 자동으로 목업 데이터를 제공합니다:
- 직사각형 넓이 (5×3 = 15cm²)
- 정사각형 넓이 (4×4 = 16cm²)
- 원의 넓이 (r=3, π×9 ≈ 28.27cm²)

## 🎮 사용 방법

1. **문제 선택**: 좌측 패널에서 학습할 문제 선택
2. **3D 탐색**:
   - 🖱️ 드래그: 도형 회전
   - 🔍 마우스 휠: 확대/축소
   - 📏 치수 확인: 3D 모델에 표시된 길이 확인
3. **답변 제출**: 우측 스마트폰 화면 하단에서 넓이 입력
4. **즉시 피드백**: 정답 여부 확인

## 🎨 3D 시각화 특징

- **직사각형**: 가로×세로 표시
- **정사각형**: 한 변의 길이 표시
- **원**: 반지름 표시 (노란색 선)
- **삼각형**: 밑변×높이 표시
- **자동 회전**: 부드러운 애니메이션
- **그리드 바닥**: 공간감 제공
- **조명 효과**: 입체감 강조

## 🔧 개발 모드

```bash
# 프론트엔드만 실행
npm run dev

# 백엔드만 실행
npm run server

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 📝 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/problems` | 문제 목록 조회 |
| GET | `/api/problems/:id` | 특정 문제 조회 |
| POST | `/api/submit` | 답안 제출 |

## 🌐 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 서버 배포

```bash
# PM2로 백엔드 서버 실행
pm2 start server/index.js --name 3d-area-api
```

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 교육용 소프트웨어입니다.

## 👨‍💻 개발자

KAIST Touch Math Academy Development Team

## 🐛 문제 해결

### MySQL 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u moodle -p
```

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### 의존성 문제
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📚 참고 자료

- [Three.js 문서](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Moodle API](https://docs.moodle.org/dev/Web_services)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Made with ❤️ for better math education**
