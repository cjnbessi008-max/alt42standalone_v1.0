# 🌳 Inequality Tree - 부등식 트리 시각화 웹앱

부등식 풀이 과정을 나무(트리) 구조로 시각화하는 모바일 친화적인 독립형 웹 애플리케이션입니다.

## 📋 프로젝트 개요

- **목적**: Moodle LMS와 연동하여 부등식 문제를 시각적으로 학습
- **대상**: 중학교/고등학교 수학 학습자
- **환경**: MySQL 5.7, PHP 7.1.9, Moodle 3.7 호환
- **디바이스**: 모바일 스마트폰 화면 최적화 (우측 하단 배치)

## ✨ 주요 기능

### 1. 부등식 트리 시각화
- D3.js를 사용한 인터랙티브 트리 렌더링
- 풀이 단계별 노드 표시
- 클릭하여 각 단계의 설명 확인
- 확대/축소, 전체 펼치기/접기 기능

### 2. 문제 풀이
- 부등식 문제 표시 (MathJax 수식 렌더링)
- 답안 입력 및 실시간 검증
- 정답/오답 피드백
- 힌트 시스템

### 3. 학습 추적
- 시도 횟수 기록
- 정답률 통계
- 평균 소요 시간
- Moodle 사용자별 진행상황 저장

### 4. Moodle LMS 연동
- Moodle 문제 데이터베이스 연동
- 사용자 인증 및 세션 관리
- 학습 데이터 Moodle에 저장

## 🗂 프로젝트 구조

```
inequality-tree/
├── index.html              # 메인 페이지
├── css/
│   └── style.css          # 모바일 최적화 스타일
├── js/
│   ├── inequality-parser.js   # 부등식 파싱 엔진
│   ├── tree-builder.js        # 트리 구조 생성기
│   ├── tree-visualizer.js     # D3.js 시각화
│   └── app.js                 # 메인 애플리케이션 로직
├── api/
│   ├── config.php             # 데이터베이스 설정
│   ├── get-problems.php       # 문제 조회 API
│   ├── save-progress.php      # 진행상황 저장 API
│   └── session.php            # 세션 관리 API
├── sql/
│   └── schema.sql             # 데이터베이스 스키마
└── README.md
```

## 🚀 설치 및 실행

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (선택적)

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE inequality_tree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
# 스키마 적용
mysql -u root -p inequality_tree_db < sql/schema.sql
```

### 3. PHP 설정

`api/config.php` 파일을 편집하여 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'inequality_tree_db');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

#### Apache
```apache
<VirtualHost *:80>
    DocumentRoot "/path/to/inequality-tree"
    <Directory "/path/to/inequality-tree">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    root /path/to/inequality-tree;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 실행

웹 브라우저에서 접속:
```
http://localhost/inequality-tree/
```

Moodle 연동 시 URL 파라미터 전달:
```
http://localhost/inequality-tree/?user_id=123&question_id=456
```

## 📱 모바일 화면 시뮬레이션

우측 하단에 가상 스마트폰 화면으로 표시되도록 최적화되어 있습니다.

- 화면 크기: 최대 400px × 800px
- 반응형 디자인 지원
- 터치 인터랙션 최적화

## 🔌 API 엔드포인트

### 문제 조회
```http
GET /api/get-problems.php?id=1
GET /api/get-problems.php?moodle_id=123
GET /api/get-problems.php?difficulty=medium&limit=10
```

### 진행상황 저장
```http
POST /api/save-progress.php
Content-Type: application/json

{
  "moodle_user_id": 1,
  "problem_id": 1,
  "user_answer": "x < 1",
  "time_spent_seconds": 45
}
```

### 세션 관리
```http
POST /api/session.php
{
  "moodle_user_id": 1,
  "device_info": "Mozilla/5.0..."
}
```

## 🎨 사용자 인터페이스

### 화면 구성
1. **헤더**: 앱 타이틀 및 난이도 표시
2. **문제 영역**: 부등식 표시 (MathJax 렌더링)
3. **트리 영역**: D3.js 인터랙티브 트리
4. **답안 입력**: 텍스트 입력 및 제출 버튼
5. **힌트**: 접이식 힌트 섹션
6. **통계**: 정답률 및 소요 시간 표시

### 주요 인터랙션
- **노드 클릭**: 해당 단계의 설명 툴팁 표시
- **전체 펼치기/접기**: 트리 전체 확장/축소
- **줌/팬**: 트리 확대/축소 및 이동
- **Enter 키**: 답안 제출

## 📊 데이터베이스 스키마

### inequality_problems (문제)
- `id`: 문제 고유 ID
- `moodle_question_id`: Moodle 문제 ID (연동용)
- `inequality_expression`: 부등식 표현식
- `difficulty_level`: 난이도 (easy, medium, hard)
- `solution_steps`: 풀이 단계 (JSON)
- `correct_answer`: 정답

### student_progress (진행상황)
- `id`: 진행상황 ID
- `moodle_user_id`: Moodle 사용자 ID
- `problem_id`: 문제 ID
- `attempt_number`: 시도 횟수
- `user_answer`: 학생 답안
- `is_correct`: 정답 여부
- `time_spent_seconds`: 소요 시간

### learning_sessions (세션)
- `id`: 세션 ID
- `moodle_user_id`: Moodle 사용자 ID
- `session_token`: 세션 토큰
- `is_active`: 활성 상태

## 🛠 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 반응형 디자인, 그라디언트, 애니메이션
- **JavaScript (ES6+)**: 객체지향 프로그래밍
- **D3.js v7**: 트리 시각화
- **MathJax 3**: 수식 렌더링

### Backend
- **PHP 7.1.9**: RESTful API
- **MySQL 5.7**: 데이터베이스
- **PDO**: 데이터베이스 연결

### Libraries
- D3.js: https://d3js.org/
- MathJax: https://www.mathjax.org/

## 🔧 커스터마이징

### 새로운 문제 추가

```sql
INSERT INTO inequality_problems
  (inequality_expression, difficulty_level, category, correct_answer, solution_steps)
VALUES
  ('3x - 6 > 9', 'medium', 'linear', 'x > 5',
   '{"steps": [
       {"step": 1, "expression": "3x - 6 > 9", "operation": "시작", "explanation": "주어진 부등식"},
       {"step": 2, "expression": "3x > 15", "operation": "양변에 +6", "explanation": "양변에 6을 더합니다"},
       {"step": 3, "expression": "x > 5", "operation": "양변을 3으로 나눔", "explanation": "양변을 3으로 나눕니다"}
   ]}');
```

### 색상 테마 변경

`css/style.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #4a90e2;    /* 메인 컬러 */
    --secondary-color: #50c878;  /* 성공 컬러 */
    --danger-color: #e74c3c;     /* 오류 컬러 */
}
```

## 🐛 문제 해결

### 문제가 로드되지 않음
- `api/config.php`의 데이터베이스 설정 확인
- `sql/schema.sql`이 정상적으로 실행되었는지 확인
- 브라우저 콘솔에서 API 오류 확인

### MathJax가 렌더링되지 않음
- 인터넷 연결 확인 (CDN 사용)
- 브라우저 콘솔에서 MathJax 로드 오류 확인

### 트리가 표시되지 않음
- D3.js CDN 로드 확인
- 브라우저 콘솔에서 JavaScript 오류 확인
- SVG 컨테이너 크기 확인

## 🌐 Moodle 연동 가이드

### 1. Moodle에 임베드

```html
<iframe
  src="http://your-server/inequality-tree/?user_id={{user_id}}&question_id={{question_id}}"
  width="100%"
  height="850px"
  frameborder="0">
</iframe>
```

### 2. Moodle 데이터베이스 연동

`api/config.php`에서 Moodle DB 설정:

```php
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_pass');
```

### 3. 사용자 인증

URL 파라미터로 `user_id` 전달:
```
?user_id=123
```

## 📄 라이선스

MIT License

## 👥 기여

이슈 및 풀 리퀘스트 환영합니다!

## 📞 문의

KAIST Touch Math Academy

## 🔄 버전 히스토리

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 트리 시각화 기능
- Moodle 연동 준비
- 모바일 최적화
