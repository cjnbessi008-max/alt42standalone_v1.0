# Truth Light - 프로젝트 구조

```
truth-light-app/
│
├── api/                          # 백엔드 API
│   ├── api.php                   # RESTful API 엔드포인트
│   ├── Database.php              # 데이터베이스 연결 클래스
│   ├── MoodleConnector.php       # Moodle 웹 서비스 연동
│   └── test-api.php              # API 테스트 스크립트
│
├── config/                       # 환경 설정
│   └── config.php                # 기본 설정 파일
│   └── config.local.php          # 로컬 설정 (생성 필요, gitignore)
│
├── database/                     # 데이터베이스
│   └── schema.sql                # MySQL 스키마 및 샘플 데이터
│
├── public/                       # 웹 루트 디렉토리
│   ├── index.html                # 메인 HTML
│   ├── .htaccess                 # Apache 설정
│   │
│   ├── css/
│   │   └── style.css             # 스타일시트 (조명 효과, 스마트폰 UI)
│   │
│   ├── js/
│   │   └── app.js                # 프론트엔드 로직 (Truth Light 핵심)
│   │
│   └── assets/                   # 정적 자원 (이미지, 폰트 등)
│
├── logs/                         # 로그 파일 (자동 생성, gitignore)
│   └── app.log
│
├── .gitignore                    # Git 무시 파일
├── README.md                     # 프로젝트 문서
├── QUICKSTART.md                 # 빠른 시작 가이드
├── PROJECT_STRUCTURE.md          # 이 파일
└── install.sh                    # 자동 설치 스크립트

```

## 파일 설명

### 백엔드 (API)

#### `api/api.php`
- **역할**: RESTful API 엔드포인트 제공
- **주요 기능**:
  - `/api/questions` - 문제 목록 조회
  - `/api/session` - 학습 세션 관리
  - `/api/answer` - 답변 제출 및 조명 밝기 계산
  - `/api/progress` - 학습 진도 조회
  - `/api/moodle-test` - Moodle 연결 테스트

#### `api/Database.php`
- **역할**: MySQL 데이터베이스 연결 및 쿼리 실행
- **패턴**: Singleton 패턴
- **특징**: PDO Prepared Statements로 SQL Injection 방지

#### `api/MoodleConnector.php`
- **역할**: Moodle 3.7 웹 서비스와 연동
- **주요 기능**:
  - 사용자 정보 동기화
  - 퀴즈 및 문제 가져오기
  - 학습 결과 Moodle에 전송

#### `api/test-api.php`
- **역할**: API 자동 테스트
- **사용법**: `php test-api.php`

### 데이터베이스

#### `database/schema.sql`
- **테이블**:
  - `users` - 사용자 (Moodle 동기화)
  - `questions` - 문제 은행
  - `learning_sessions` - 학습 세션
  - `answer_attempts` - 답변 기록
  - `user_progress` - 학습 진도
  - `moodle_sync_log` - Moodle 동기화 로그

### 프론트엔드

#### `public/index.html`
- **구조**:
  - 스마트폰 프레임 (우측 하단)
  - Truth Light 조명 영역
  - 문제 표시 영역
  - 답변 버튼 (참/거짓)
  - 학습 정보 패널 (좌측)

#### `public/css/style.css`
- **핵심 기능**:
  - **Truth Light 효과**: 조명 밝기 애니메이션
  - **스마트폰 UI**: iPhone 스타일 프레임
  - **반응형 디자인**: 다양한 화면 크기 지원
  - **CSS 변수**: 색상, 간격 등 커스터마이징 용이

#### `public/js/app.js`
- **핵심 로직**:
  - API 통신 (fetch)
  - Truth Light 조명 제어
  - 학습 세션 관리
  - 실시간 통계 업데이트
  - 키보드 단축키 (T/1 = 참, F/2 = 거짓)

### 설정

#### `config/config.php`
- **기본 설정**: 데이터베이스, Moodle, 조명 설정 등
- **환경 변수**: getenv()로 컨테이너 환경 지원

#### `config/config.local.php` (생성 필요)
- **로컬 오버라이드**: 개발/프로덕션 환경별 설정
- **Git 제외**: 민감한 정보 보호

### 유틸리티

#### `install.sh`
- **자동 설치**: 데이터베이스, 설정, 권한 자동 설정
- **사용법**: `sudo ./install.sh`

## 데이터 흐름

```
사용자 액션
    ↓
index.html (UI)
    ↓
app.js (클라이언트 로직)
    ↓ API 호출 (JSON)
api.php (서버 엔드포인트)
    ↓
Database.php (데이터 접근)
    ↓
MySQL (데이터 저장)
    ↓
api.php (응답 생성)
    ↓
app.js (조명 제어)
    ↓
style.css (시각 효과)
    ↓
사용자에게 표시 (Truth Light 🔆)
```

## Truth Light 핵심 메커니즘

### 1. 답변 제출 (app.js)
```javascript
submitAnswer(true/false)
  → API POST /api/answer
```

### 2. 정답 확인 (api.php)
```php
$isCorrect = ($question['correct_answer'] === $userAnswer);
$lightBrightness = $isCorrect ? 100 : 0;
```

### 3. 조명 업데이트 (app.js)
```javascript
updateLight(isCorrect, brightness)
  → CSS 클래스 변경 (active-true/active-false)
```

### 4. 시각 효과 (style.css)
```css
.light-glow.active-true {
  background: radial-gradient(circle, gold, transparent);
  animation: pulse 2s infinite;
}
```

## 커스터마이징 포인트

### 조명 색상 변경
📁 `public/css/style.css` → CSS 변수 `:root`

### 문제 추가
📁 `database/schema.sql` → INSERT INTO questions

### API 엔드포인트 추가
📁 `api/api.php` → 새 case 추가

### Moodle 함수 추가
📁 `api/MoodleConnector.php` → 새 메서드 추가

## 개발 워크플로우

1. **로컬 개발**
   ```bash
   php -S localhost:8000 -t public/
   ```

2. **API 테스트**
   ```bash
   php api/test-api.php
   ```

3. **데이터베이스 수정**
   ```bash
   mysql -u root -p truth_light_db < database/schema.sql
   ```

4. **로그 확인**
   ```bash
   tail -f logs/app.log
   ```

## 배포 체크리스트

- [ ] `config.local.php` 프로덕션 설정 확인
- [ ] 데이터베이스 백업
- [ ] 로그 디렉토리 권한 확인
- [ ] `.htaccess` 또는 Nginx 설정 확인
- [ ] Moodle 토큰 유효성 확인
- [ ] API 테스트 실행 (`php api/test-api.php`)
- [ ] 브라우저에서 기능 테스트
- [ ] 성능 모니터링 설정

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
