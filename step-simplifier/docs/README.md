# Step Simplifier - 방정식 단계별 풀이 앱

## 개요

Step Simplifier는 Moodle LMS와 연동되어 복잡한 방정식을 단계별로 풀이할 수 있도록 도와주는 교육용 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면으로 표시되며, 학생들이 각 단계를 직접 입력하면서 학습할 수 있습니다.

## 주요 기능

### 1. 단계별 방정식 풀이
- 복잡한 방정식을 여러 단계로 나누어 제시
- 각 단계마다 학생이 직접 답을 입력하고 검증
- 실시간 피드백 제공 (정답/오답)

### 2. Moodle LMS 연동
- Moodle 3.7 Web Services API를 통한 문제 동기화
- 사용자 정보 연동
- 학습 결과를 Moodle 성적표로 전송

### 3. 학습 진행 추적
- 단계별 진행 상황 표시
- 시도 기록 및 소요 시간 측정
- 점수 계산 및 통계 제공

### 4. 모바일 친화적 UI
- 가상 스마트폰 화면 디자인
- 직관적인 인터페이스
- 반응형 디자인 지원

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5/CSS3**
- **JavaScript (ES6+)**
- **Font Awesome**: 아이콘

### API
- RESTful API
- JSON 데이터 형식
- CORS 지원

## 프로젝트 구조

```
step-simplifier/
├── backend/                 # PHP 백엔드
│   ├── api/                # API 엔드포인트
│   │   ├── index.php       # 메인 라우터
│   │   ├── problems.php    # 문제 관련 API
│   │   ├── progress.php    # 진행상황 API
│   │   └── moodle.php      # Moodle 연동 API
│   ├── config/             # 설정 파일
│   │   ├── database.php    # DB 설정
│   │   └── moodle.php      # Moodle 설정
│   ├── models/             # 데이터 모델
│   │   ├── EquationSolver.php  # 방정식 풀이 엔진
│   │   ├── Problem.php         # 문제 모델
│   │   └── UserProgress.php    # 진행상황 모델
│   └── moodle/             # Moodle 클라이언트
│       └── MoodleClient.php
├── frontend/               # 웹 프론트엔드
│   ├── css/
│   │   └── styles.css      # 스타일시트
│   ├── js/
│   │   ├── config.js       # 설정
│   │   ├── api.js          # API 클라이언트
│   │   └── app.js          # 메인 앱 로직
│   └── index.html          # 메인 HTML
├── database/               # 데이터베이스
│   └── schema.sql          # DB 스키마
└── docs/                   # 문서
    ├── README.md           # 이 파일
    ├── INSTALLATION.md     # 설치 가이드
    └── API.md              # API 문서
```

## 설치 방법

자세한 설치 방법은 [INSTALLATION.md](./INSTALLATION.md)를 참조하세요.

### 빠른 시작

1. **데이터베이스 생성**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   DB_HOST=localhost
   DB_NAME=step_simplifier
   DB_USER=root
   DB_PASS=your_password
   MOODLE_URL=http://your-moodle-url
   MOODLE_TOKEN=your_moodle_token
   ```

3. **웹 서버 설정**
   - Apache 또는 Nginx에 프로젝트 디렉토리 설정
   - PHP 7.1.9 이상 필요

4. **브라우저에서 실행**
   ```
   http://localhost/step-simplifier/frontend/index.html
   ```

## API 사용법

### 문제 가져오기
```javascript
GET /api/problems/{id}
```

### 단계 제출
```javascript
POST /api/progress/submit
{
  "user_id": 1,
  "problem_id": 1,
  "step_number": 2,
  "user_answer": "3x = 15",
  "time_spent": 30
}
```

자세한 API 문서는 [API.md](./API.md)를 참조하세요.

## 데이터베이스 스키마

### 주요 테이블

1. **problems** - 방정식 문제
2. **solution_steps** - 단계별 풀이
3. **users** - 사용자 정보
4. **user_progress** - 학습 진행 상황
5. **user_attempts** - 시도 기록
6. **moodle_sync_log** - Moodle 동기화 로그

## 사용 예제

### 1. 학생이 문제 풀이 시작
1. 앱 로드 시 Moodle에서 사용자 정보 가져오기
2. 문제 목록에서 문제 선택 (또는 자동 배정)
3. 첫 번째 단계 표시

### 2. 단계별 풀이
1. 현재 단계의 설명과 힌트 확인
2. 다음 단계를 입력란에 작성
3. "제출" 버튼 클릭
4. 정답이면 다음 단계로, 오답이면 다시 시도

### 3. 완료
1. 모든 단계 완료 시 완료 화면 표시
2. 점수와 통계 확인
3. 결과가 Moodle로 전송됨

## Moodle 연동

### Moodle 설정

1. **Web Services 활성화**
   - 사이트 관리 > 플러그인 > Web Services > 개요
   - "Enable web services" 체크

2. **토큰 생성**
   - 사이트 관리 > Web Services > 토큰 관리
   - 새 토큰 생성

3. **Custom Web Service 생성** (선택사항)
   ```php
   // local/step_simplifier/externallib.php
   class local_step_simplifier_external extends external_api {
       public static function get_question($questionid) {
           // 문제 정보 반환
       }
   }
   ```

## 커스터마이징

### 1. 스타일 변경
`frontend/css/styles.css`에서 CSS 변수 수정:
```css
:root {
    --primary-color: #4A90E2;
    --secondary-color: #50C878;
    /* ... */
}
```

### 2. 방정식 풀이 알고리즘 추가
`backend/models/EquationSolver.php`에서 새로운 방정식 유형 추가

### 3. UI 컴포넌트 추가
`frontend/index.html` 및 `frontend/js/app.js` 수정

## 트러블슈팅

### 데이터베이스 연결 오류
- MySQL 서버가 실행 중인지 확인
- `backend/config/database.php`의 연결 정보 확인

### Moodle API 오류
- Moodle Web Services가 활성화되어 있는지 확인
- 토큰이 유효한지 확인
- CORS 설정 확인

### 프론트엔드가 로드되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- `frontend/js/config.js`의 API_BASE_URL 확인

## 개발 로드맵

### v1.1 (계획 중)
- [ ] 이차방정식 지원
- [ ] 그래프 시각화
- [ ] 음성 입력 지원

### v1.2 (계획 중)
- [ ] 다국어 지원 (영어)
- [ ] 모바일 앱 (React Native)
- [ ] 오프라인 모드

## 라이선스

MIT License

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 문의

문제가 발생하면 이슈를 등록해주세요.

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 방정식 풀이 기능
- Moodle 연동
- 가상 스마트폰 UI
