# Next Term Vision - 다음 항 예측하기

수열의 다음 항을 애니메이션으로 학습하는 교육용 웹 애플리케이션

## 📱 프로젝트 개요

Next Term Vision은 Moodle LMS와 연동하여 학생들이 수열 패턴을 시각적으로 학습할 수 있는 인터랙티브 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면을 시뮬레이션하여 실제 모바일 앱과 같은 경험을 제공합니다.

### ✨ 주요 기능

- **다양한 수열 유형**: 산술 수열, 기하 수열, 피보나치 수열, 패턴 수열
- **애니메이션 효과**: Slide, Fade, Bounce, Grow 4가지 애니메이션
- **스마트폰 시뮬레이터**: 실제 모바일 앱과 유사한 UI/UX
- **적응형 난이도**: 학생의 정답률에 따라 자동 레벨 조정
- **실시간 피드백**: 즉각적인 정답/오답 피드백과 힌트 제공
- **진행 상황 추적**: 학생별 통계 및 성취도 관리
- **Moodle 연동**: Moodle 3.7+ Activity Module로 완벽 통합

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7+

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 그리드, 플렉스박스, 애니메이션
- **JavaScript**: ES6+, Vanilla JS (프레임워크 없음)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── database/
│   │   └── schema.sql                 # MySQL 데이터베이스 스키마
│   └── php/
│       ├── api/
│       │   ├── config.php             # DB 설정 및 공통 함수
│       │   ├── get_problem.php        # 문제 조회 API
│       │   └── submit_answer.php      # 답안 제출 API
│       └── moodle_plugin/
│           └── mod/
│               └── nextterm/          # Moodle Activity Module
│                   ├── version.php
│                   ├── lib.php
│                   ├── view.php
│                   └── lang/
│                       ├── en/
│                       └── ko/
├── frontend/
│   ├── index.html                     # 메인 HTML
│   ├── css/
│   │   └── styles.css                 # 전체 스타일시트
│   └── js/
│       ├── app.js                     # 메인 앱 로직
│       ├── smartphone-simulator.js    # 스마트폰 시뮬레이터
│       └── next-term-animation.js     # 애니메이션 컴포넌트
├── docs/
│   └── setup.md                       # 설치 및 설정 가이드
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 스키마 실행
mysql -u root -p moodle < backend/database/schema.sql
```

### 2. PHP API 설정

`backend/php/api/config.php` 파일을 열어 데이터베이스 연결 정보를 수정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Moodle 플러그인 설치

```bash
# Moodle 플러그인 디렉토리로 복사
cp -r backend/php/moodle_plugin/mod/nextterm /path/to/moodle/mod/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

### 4. 웹 서버 설정

프론트엔드 파일을 웹 서버 문서 루트에 배치:

```bash
# Apache 예시
cp -r frontend/* /var/www/html/nextterm/

# 또는 PHP 내장 서버로 테스트
cd frontend
php -S localhost:8000
```

### 5. API 엔드포인트 설정

`frontend/js/app.js` 파일에서 API 경로를 수정:

```javascript
this.API_BASE = 'http://your-domain.com/backend/php/api';
```

## 📖 사용 방법

### 독립 실행형 (Standalone)

1. 웹 브라우저에서 `http://localhost:8000/index.html` 접속
2. 학생 ID 입력
3. "새 문제" 버튼 클릭
4. 수열을 보고 다음 항 입력
5. "제출" 버튼으로 답안 제출

### Moodle 통합

1. Moodle 코스에 접속
2. "활동 추가" > "Next Term Vision" 선택
3. 활동 이름 및 설정 입력
4. 학생은 코스 페이지에서 바로 활동 시작

## 🎨 애니메이션 유형

| 유형 | 설명 | 효과 |
|------|------|------|
| **slide** | 좌에서 우로 슬라이드 | 순차적 등장 |
| **fade** | 페이드 인 + 스케일 | 부드러운 나타남 |
| **bounce** | 바운스 효과 | 튀어오르는 느낌 |
| **grow** | 회전 + 성장 | 역동적인 확대 |

## 🔧 데이터베이스 구조

### 주요 테이블

#### `nextterm_problems`
- 수열 문제 정보 저장
- 문제 유형, 난이도, 정답, 힌트 포함

#### `nextterm_responses`
- 학생 응답 기록
- 정답 여부, 시도 횟수, 소요 시간 추적

#### `nextterm_progress`
- 학생별 진행 상황
- 총 문제 수, 정답률, 현재 레벨 관리

자세한 스키마는 `backend/database/schema.sql` 참조

## 🎯 적응형 난이도 시스템

- **레벨업 조건**: 정확도 80% 이상, 최소 5문제 이상
- **레벨다운 조건**: 정확도 40% 미만, 최소 5문제 이상
- **난이도 범위**: 1 (쉬움) ~ 5 (어려움)

## 🌐 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 반응형 디자인

- 데스크톱: 1024px 이상
- 태블릿: 768px - 1023px
- 모바일: 767px 이하

## 🔒 보안 고려사항

- SQL Injection 방지: PDO Prepared Statements 사용
- XSS 방지: 모든 입력값 sanitize 처리
- CORS 설정: 허용된 도메인만 API 접근 가능

## 🧪 테스트

### 데모 모드

API 서버가 없어도 프론트엔드만으로 테스트 가능:

```javascript
// app.js에서 자동으로 데모 모드 전환
// 샘플 문제로 기능 테스트 가능
```

### 샘플 데이터

데이터베이스 스키마 파일에 13개의 샘플 문제 포함

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 교육 목적으로 개발되었습니다.

## 👥 기여자

- **개발**: AI Education System Pipeline Team
- **디자인**: UX/UI Design Team
- **교육 설계**: KAIST Touch Math Academy

## 📞 문의

문제나 제안사항이 있으시면 이슈를 등록해주세요.

## 🔄 업데이트 내역

### v1.0.0 (2025-01-18)
- 초기 릴리스
- 4가지 수열 유형 지원
- 스마트폰 시뮬레이터 구현
- Moodle 3.7+ 플러그인 완성
- 적응형 난이도 시스템
- 다국어 지원 (한국어, 영어)

## 🎓 교육적 가치

Next Term Vision은 다음과 같은 교육 목표를 달성합니다:

1. **패턴 인식 능력**: 수열의 규칙을 찾아내는 능력 향상
2. **논리적 사고**: 규칙을 기반으로 다음 항을 추론
3. **시각적 학습**: 애니메이션을 통한 직관적 이해
4. **자기주도 학습**: 즉각적인 피드백으로 스스로 학습
5. **성취감**: 레벨업 시스템으로 동기부여

---

Made with ❤️ by KAIST Touch Math Academy
