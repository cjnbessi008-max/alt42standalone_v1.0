# Symmetry Shine - 함수 대칭성 시각화 웹앱

Moodle LMS와 연동하여 함수의 대칭성을 빛선 효과로 강조하는 교육용 웹 애플리케이션입니다.

## 주요 기능

### 🎯 핵심 기능
- **Moodle LMS 연동**: MySQL 5.7, PHP 7.1.9, Moodle 3.7과 완벽 통합
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 시뮬레이션
- **함수 그래프 시각화**: Canvas 기반 실시간 함수 플로팅
- **대칭축 강조**: 빛선 효과(Symmetry Shine)로 대칭축 시각화
- **실시간 피드백**: 즉각적인 정답/오답 피드백
- **학습 데이터 추적**: MySQL 데이터베이스에 모든 시도 기록 저장

### ✨ Symmetry Shine 효과
- 대칭축에서 방사형으로 퍼지는 애니메이션 광선
- 중심 광채 효과로 대칭축 강조
- 부드러운 색상 그라디언트 (핑크-보라)
- 실시간 애니메이션으로 학습 몰입도 향상

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 그라디언트, 애니메이션, Flexbox
- **JavaScript (ES6+)**: 클래스 기반 OOP, Canvas API
- **Canvas API**: 함수 그래프 및 빛선 효과 렌더링

### 백엔드
- **PHP 7.1.9**: RESTful API 서버
- **MySQL 5.7**: 관계형 데이터베이스
- **Moodle 3.7**: LMS 연동 (Web Services API)
- **PDO**: 안전한 데이터베이스 연결

## 프로젝트 구조

```
symmetry-shine/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 HTML (가상 스마트폰 화면 포함)
│   ├── styles.css         # 스타일시트
│   └── app.js             # JavaScript 애플리케이션 로직
│
├── api/                   # PHP 백엔드 API
│   ├── config.php         # 데이터베이스 및 Moodle 설정
│   ├── get_problem.php    # 문제 정보 조회
│   └── submit_answer.php  # 답안 제출 처리
│
├── database/              # 데이터베이스 스키마
│   └── schema.sql         # MySQL 테이블 정의 및 샘플 데이터
│
└── README.md              # 프로젝트 문서
```

## 설치 및 실행

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항, 없어도 데모 모드로 동작)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source database/schema.sql
```

### 3. 설정 파일 수정

`api/config.php` 파일을 열어 데이터베이스 정보를 입력하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 연동 (선택사항)
define('MOODLE_URL', 'http://your-moodle-url');
define('MOODLE_TOKEN', 'your_webservice_token');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /symmetry-shine/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1.php [L]
</IfModule>
```

#### Nginx
```nginx
location /symmetry-shine/ {
    try_files $uri $uri/ /symmetry-shine/public/index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

### 5. 실행

웹 브라우저에서 다음 URL로 접속:
```
http://localhost/symmetry-shine/public/index.html
```

## 사용 방법

### 학생 사용자

1. **문제 확인**: 우측 하단 가상 스마트폰 화면에 문제가 표시됩니다
2. **함수 관찰**: Canvas에 그려진 함수 그래프를 분석합니다
3. **대칭축 찾기**:
   - "대칭축 표시" 버튼: 대칭축을 확인 (학습용)
   - "빛선 효과" 버튼: Symmetry Shine 애니메이션 활성화
4. **답안 제출**: 대칭축 값을 입력하고 "제출" 버튼 클릭
5. **피드백 확인**: 정답/오답 피드백을 즉시 확인
6. **다음 문제**: "다음 문제" 버튼으로 새로운 문제 불러오기

### 교사 사용자 (Moodle 연동)

Moodle 관리자 패널에서:
- 문제 추가/수정 (직접 데이터베이스 또는 향후 관리 UI)
- 학생 성적 조회 (`user_performance` View)
- 문제별 통계 확인 (`problem_accuracy` View)

## 데이터베이스 스키마

### 주요 테이블

#### `symmetry_problems`
문제 정보 저장
- `id`: 문제 ID
- `title`: 문제 제목
- `function_expression`: JavaScript 평가 가능한 함수 표현식
- `symmetry_axis`: 정답 대칭축 값
- `problem_type`: quadratic, cubic, absolute, trigonometric, custom
- `difficulty_level`: 1-5 난이도

#### `user_answers`
사용자 답안 기록
- `user_id`: Moodle 사용자 ID
- `problem_id`: 문제 ID
- `answer`: 제출한 답안
- `is_correct`: 정답 여부

#### `problem_statistics`
문제별 통계 (자동 업데이트)
- `total_attempts`: 총 시도 횟수
- `correct_attempts`: 정답 횟수
- 정답률 자동 계산

## API 엔드포인트

### GET `/api/get_problem.php`
새로운 문제 가져오기

**쿼리 파라미터:**
- `user_id`: 사용자 ID (선택)
- `course_id`: 코스 ID (선택)
- `difficulty`: 난이도 1-5 (선택)
- `type`: 문제 유형 (선택)

**응답:**
```json
{
  "success": true,
  "id": 1,
  "title": "이차함수의 대칭성 1",
  "description": "f(x) = x² - 4x + 3의 대칭축을 찾으세요",
  "function": "x*x - 4*x + 3",
  "symmetryAxis": 2.0,
  "type": "quadratic",
  "difficulty": 1
}
```

### POST `/api/submit_answer.php`
답안 제출

**요청 Body:**
```json
{
  "problem_id": 1,
  "user_id": 123,
  "course_id": 456,
  "answer": "2.0",
  "is_correct": true
}
```

**응답:**
```json
{
  "success": true,
  "answer_id": 789,
  "is_correct": true,
  "message": "정답입니다!",
  "timestamp": "2024-01-15 14:30:00"
}
```

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자 패널:
1. `사이트 관리 > 플러그인 > 웹 서비스 > 관리`
2. "웹 서비스 활성화" 체크
3. REST 프로토콜 활성화

### 2. 토큰 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리`
2. 새 토큰 생성
3. `api/config.php`에 토큰 입력

### 3. 권한 설정

필요한 Capability:
- `webservice/rest:use`
- `moodle/grade:edit`
- `moodle/user:viewdetails`

## 커스터마이징

### 새로운 함수 유형 추가

`database/schema.sql`에서 `problem_type` ENUM 수정:

```sql
ALTER TABLE symmetry_problems
MODIFY problem_type ENUM('quadratic', 'cubic', 'absolute', 'trigonometric', 'custom', 'your_new_type');
```

### 빛선 효과 커스터마이징

`public/app.js`의 `drawShineEffect()` 메서드 수정:

```javascript
// 광선 개수 변경
const rays = 20; // 기본 12

// 색상 변경
gradient.addColorStop(0, 'rgba(your-color-here)');
```

### 난이도 레벨 조정

`database/schema.sql`에서 `difficulty_level` TINYINT 범위 변경 가능

## 문제 해결

### Moodle 연결 실패
- `api/config.php`의 `MOODLE_TOKEN` 확인
- Moodle 웹 서비스 활성화 상태 확인
- 데모 모드로 자동 전환됨 (샘플 문제 사용)

### 데이터베이스 연결 오류
- MySQL 서비스 실행 확인: `systemctl status mysql`
- 데이터베이스 사용자 권한 확인
- `api/config.php`의 DB 정보 확인

### Canvas 렌더링 문제
- 브라우저 콘솔에서 JavaScript 오류 확인
- 브라우저 Canvas 지원 여부 확인 (최신 브라우저 권장)

## 성능 최적화

### 데이터베이스
- 인덱스 자동 생성 (schema.sql)
- View 캐싱 활용
- 트리거로 통계 자동 업데이트

### 프론트엔드
- Canvas 해상도 최적화 (레티나 디스플레이 대응)
- RequestAnimationFrame으로 부드러운 애니메이션
- 불필요한 재렌더링 방지

## 보안 고려사항

- **SQL Injection 방지**: PDO Prepared Statements 사용
- **XSS 방지**: 사용자 입력 검증 및 이스케이프
- **CORS 설정**: 개발 환경용 (프로덕션에서는 특정 도메인으로 제한)
- **입력 검증**: 서버 측에서 모든 입력 검증

## 향후 개발 계획

- [ ] 관리자 대시보드 (문제 생성/수정 UI)
- [ ] 3차 함수, 삼각함수 지원 확장
- [ ] 다중 대칭축 문제
- [ ] 학생 진도 추적 및 리포트
- [ ] 모바일 네이티브 앱 버전
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 접근성(A11y) 개선

## 라이선스

MIT License

## 기여

이슈 및 PR 환영합니다!

## 문의

프로젝트 관련 문의: [your-email@example.com]

---

**Symmetry Shine** - Making Math Beautiful with Light 🌟
