# 🌳 Metaphor Log - 로그 시각화 학습 앱

로그(Logarithm)의 개념을 시각적 비유(Metaphor)로 표현하여 학습을 돕는 독립형 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📱 가상 스마트폰 인터페이스
- 우측 하단에 실제 스마트폰처럼 보이는 프레임
- 모바일 앱과 동일한 사용자 경험
- 반응형 디자인 지원

### 🎨 4가지 시각화 비유 (Metaphor)

1. **🌳 나무 (Tree Growth)**
   - 나무가 밑수만큼 배수로 성장하는 과정 표현
   - 예: log₂8 = 3 → 2배씩 3번 성장하면 8배

2. **🪜 계단 (Stairs)**
   - 계단을 올라가며 값이 증가하는 과정
   - 각 계단마다 밑수를 곱함

3. **🔍 확대 (Magnification)**
   - 확대경으로 물체를 밑수만큼 확대
   - 시각적으로 크기 변화를 직관적으로 표현

4. **🧱 블록 (Building Blocks)**
   - 블록을 층층이 쌓으며 지수 증가 표현
   - 각 층의 블록 개수가 지수적으로 증가

### 🔗 Moodle LMS 연동
- Moodle 3.7 호환
- 문제 정보 자동 가져오기
- 학습 진도 자동 저장
- 학생 답변 추적

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Canvas API**: 2D 시각화
- **Responsive Design**: 모바일/태블릿/데스크톱 지원

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹서버
- 모던 웹브라우저 (Chrome, Firefox, Safari, Edge)

## 🚀 설치 방법

### 1. 파일 복사

```bash
# 웹서버 디렉토리로 복사
cp -r metaphor-log-app /var/www/html/
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 테이블 생성
mysql -u root -p < database/schema.sql
```

### 3. PHP 설정

`api/config.php` 파일을 편집하여 데이터베이스 정보 입력:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'metaphor_log');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹서버 설정

#### Apache

`.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /metaphor-log-app/

    # Allow CORS
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

#### Nginx

```nginx
location /metaphor-log-app/ {
    add_header Access-Control-Allow-Origin *;
    try_files $uri $uri/ /index.html;
}
```

### 5. 권한 설정

```bash
chmod 755 metaphor-log-app/
chmod 644 metaphor-log-app/public/*
chmod 755 metaphor-log-app/api/
```

## 🎯 사용 방법

### 독립형 모드

브라우저에서 직접 접속:
```
http://localhost/metaphor-log-app/public/
```

### Moodle 연동 모드

1. Moodle 관리자 페널에서 **웹 서비스 활성화**
2. **토큰 생성** 및 `api/config.php`에 입력
3. Moodle 활동에 다음 HTML 삽입:

```html
<iframe
    src="http://your-domain/metaphor-log-app/public/?questionid=123&userid=456"
    width="100%"
    height="750"
    frameborder="0"
    style="max-width: 400px; margin: 0 auto; display: block;">
</iframe>
```

## 📊 API 엔드포인트

### GET /api/get-problem.php

문제 가져오기

**Parameters:**
- `id` (optional): 특정 문제 ID
- `difficulty` (optional): easy, medium, hard
- `moodle_question_id` (optional): Moodle 문제 ID

**Response:**
```json
{
    "success": true,
    "problem": {
        "id": 1,
        "base": 2,
        "result": 8,
        "answer": 3,
        "difficulty": "easy",
        "metaphorType": "tree",
        "question": "log_2(8) = ?",
        "description": "2를 몇 번 곱하면 8이 될까요?"
    }
}
```

### POST /api/save-progress.php

학습 진도 저장

**Request Body:**
```json
{
    "moodle_user_id": 1,
    "problem_id": 1,
    "submitted_answer": 3,
    "time_spent": 45,
    "metaphor_interactions": {
        "metaphor_type": "tree",
        "time_spent": 45
    }
}
```

**Response:**
```json
{
    "success": true,
    "progress_id": 1,
    "is_correct": true,
    "correct_answer": 3,
    "feedback": "정답입니다! 로그의 개념을 잘 이해하셨네요."
}
```

## 🗃️ 데이터베이스 스키마

### log_problems
문제 정보 저장

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| base | DECIMAL(10,4) | 로그의 밑 |
| result | DECIMAL(10,4) | 로그의 진수 |
| answer | DECIMAL(10,4) | 정답 |
| difficulty | ENUM | easy, medium, hard |
| metaphor_type | ENUM | tree, stairs, magnify, blocks |

### student_progress
학생 진도 추적

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_user_id | INT | Moodle 사용자 ID |
| problem_id | INT | 문제 ID |
| attempt_count | INT | 시도 횟수 |
| is_correct | BOOLEAN | 정답 여부 |
| time_spent | INT | 소요 시간(초) |

### metaphor_preferences
학생별 선호 비유 추적

| 컬럼 | 타입 | 설명 |
|------|------|------|
| moodle_user_id | INT | Moodle 사용자 ID |
| metaphor_type | ENUM | 비유 타입 |
| success_rate | DECIMAL(5,2) | 성공률 |
| usage_count | INT | 사용 횟수 |

## 🎨 커스터마이징

### 새로운 비유 추가

`public/js/metaphor-log.js`에 새로운 그리기 함수 추가:

```javascript
function drawYourMetaphor() {
    const { base, result, answer } = currentProblem;
    // 여기에 Canvas 그리기 로직 추가
}
```

### 스타일 변경

`public/css/metaphor-log.css`에서 색상 및 레이아웃 수정:

```css
.app-header {
    background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결 방법:**
1. `api/config.php`의 DB 정보 확인
2. MySQL 서비스 실행 확인
3. 사용자 권한 확인

### CORS 오류

```
Access-Control-Allow-Origin error
```

**해결 방법:**
1. `api/config.php`의 CORS 헤더 확인
2. 웹서버 설정에서 CORS 활성화
3. 브라우저 캐시 삭제

### Canvas가 표시되지 않음

**해결 방법:**
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. Canvas API 지원 브라우저 사용
3. `metaphor-log.js` 로드 확인

## 📚 교육적 가치

### 로그의 직관적 이해
- 추상적인 로그 개념을 구체적인 시각으로 표현
- "밑수를 몇 번 곱해야 하는가"라는 본질 전달

### 다양한 학습 스타일 지원
- 4가지 다른 비유로 다양한 학습자 지원
- 각 학생에게 맞는 최적의 비유 자동 추천

### 즉각적인 피드백
- 실시간 시각화로 즉각적인 이해 확인
- 틀렸을 때 다시 시각화를 통해 학습

## 🔐 보안 고려사항

- SQL Injection 방지: PDO Prepared Statements 사용
- XSS 방지: 입력값 검증 및 이스케이프
- CSRF 방지: 토큰 기반 인증 (Moodle 연동 시)
- 세션 보안: HTTPS 사용 권장

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능

## 👥 기여

버그 리포트 및 기능 제안을 환영합니다!

## 📞 지원

문제가 있으시면 이슈를 등록해주세요.

---

**제작**: Metaphor Log Development Team
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
