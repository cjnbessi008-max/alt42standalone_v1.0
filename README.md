# Deviation Breeze 🌬️

**편차가 바람처럼 퍼져나가는 학습 분석 시스템**

Deviation Breeze는 Moodle LMS와 연동하여 학생들의 학습 편차를 실시간으로 분석하고 시각화하는 웹 애플리케이션입니다.

## 주요 기능

### 📊 실시간 편차 시각화
- D3.js 기반 "바람 효과" 시각화
- 학생별 학습 수준을 직관적으로 표현
- 인터랙티브 대시보드

### 📱 가상 스마트폰 시뮬레이터
- 우측 하단 고정 모바일 화면
- 실시간 문제 표시
- 즉각적인 피드백 제공

### 🔗 Moodle LMS 완벽 연동
- Web Services API 통합
- 퀴즈/문제 자동 동기화
- 학생 성적 실시간 분석

### 📈 고급 학습 분석
- 표준편차 기반 편차 계산
- 학습 그룹 자동 클러스터링
- 맞춤형 문제 추천 (Adaptive Learning)

## 기술 스택

- **Backend**: PHP 7.1.9, Slim Framework 3.x
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: D3.js, GSAP
- **LMS**: Moodle 3.7 Web Services API

## 시스템 요구사항

- PHP >= 7.1.9
- MySQL >= 5.7
- Composer
- Apache 2.4+ 또는 Nginx
- Moodle 3.7+ (Web Services 활성화)

## 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/deviation-breeze.git
cd deviation-breeze
```

### 2. 의존성 설치
```bash
composer install
```

### 3. 환경 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 Moodle 설정 입력
```

### 4. 데이터베이스 설정
```bash
mysql -u root -p < database/schema.sql
```

### 5. 개발 서버 실행
```bash
composer start
# 또는
php -S localhost:8080 -t backend/public
```

브라우저에서 `http://localhost:8080` 접속

## Docker로 실행 (권장)

```bash
cd docker
docker-compose up -d
```

서비스 접속:
- 애플리케이션: http://localhost:8080
- phpMyAdmin: http://localhost:8081

## Moodle 연동 설정

상세한 Moodle 연동 가이드는 [docs/MOODLE_SETUP.md](docs/MOODLE_SETUP.md)를 참조하세요.

### 간단 요약:
1. Moodle 관리자 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스 관리**
3. 새 외부 서비스 생성 및 필요한 함수 추가:
   - `core_course_get_courses`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_feedback_for_grade`
   - `core_user_get_users`
   - `mod_quiz_get_user_attempts`
4. 토큰 생성 및 `.env` 파일에 `MOODLE_WS_TOKEN` 설정

## 프로젝트 구조

```
deviation-breeze/
├── backend/               # PHP 백엔드
│   ├── config/           # 설정 파일
│   ├── src/              # 소스 코드
│   │   ├── Controllers/  # API 컨트롤러
│   │   ├── Models/       # 데이터 모델
│   │   ├── Services/     # 비즈니스 로직
│   │   └── Utils/        # 유틸리티
│   └── public/           # 웹 루트
├── frontend/             # 프론트엔드
│   ├── assets/
│   │   ├── css/         # 스타일시트
│   │   ├── js/          # JavaScript
│   │   └── img/         # 이미지
│   └── index.html       # 메인 페이지
├── database/            # 데이터베이스
│   ├── schema.sql       # 스키마
│   └── migrations/      # 마이그레이션
├── docker/              # Docker 설정
└── docs/                # 문서
```

## API 문서

자세한 API 문서는 [docs/API.md](docs/API.md)를 참조하세요.

### 주요 엔드포인트:
- `GET /api/v1/courses` - 코스 목록
- `GET /api/v1/quizzes/:id` - 퀴즈 정보
- `GET /api/v1/deviation/quiz/:id` - 편차 분석
- `POST /api/v1/smartphone/submit-answer` - 답안 제출

## 개발 가이드

### 코딩 스타일
- PHP: PSR-2 준수
- JavaScript: ES6+ with Prettier
- SQL: lowercase with underscores

### 테스트 실행
```bash
composer test
```

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 지원

- 📧 Email: support@kaist.edu
- 📚 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/deviation-breeze/issues)

## 로드맵

- [x] 기본 아키텍처 설계
- [ ] Moodle API 연동
- [ ] 편차 계산 엔진
- [ ] 시각화 구현
- [ ] 스마트폰 시뮬레이터
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 모바일 앱 (React Native)

## 감사의 글

이 프로젝트는 KAIST Touch Math Academy의 지원으로 개발되었습니다.

---

Made with ❤️ by KAIST Team
