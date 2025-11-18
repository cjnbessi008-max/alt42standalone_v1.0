# Inclusion Gate - 포함 게이트 학습 앱

Moodle LMS와 연동되는 인터랙티브 수학 학습 웹앱입니다. 집합의 포함 관계를 게이트 애니메이션으로 시각화하여 학습합니다.

## 🎯 주요 기능

- **게이트 애니메이션**: 포함/포함X를 문이 열리고 닫히는 효과로 시각화
- **가상 스마트폰 화면**: 우측 하단에 실제 스마트폰처럼 표시되는 UI
- **Moodle LMS 연동**: Moodle 3.7에서 문제 정보를 받아와서 동작
- **실시간 피드백**: 정답/오답에 따른 즉각적인 시각적 피드백
- **진행 상황 추적**: 점수, 문제 진행도 실시간 표시

## 🛠 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 애니메이션, Flexbox, 그라데이션
- **JavaScript (ES6+)**: 클래스 기반 아키텍처

### Backend
- **PHP 7.1.9**: Moodle 연동 API
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 플랫폼

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── index.html              # 메인 HTML 페이지
│   ├── css/
│   │   └── style.css           # 스타일시트
│   ├── js/
│   │   ├── app.js              # 메인 애플리케이션 로직
│   │   └── gate-animation.js   # 게이트 애니메이션 컨트롤러
│   ├── api/
│   │   ├── check-connection.php    # Moodle 연결 확인
│   │   ├── get-question.php        # 문제 가져오기
│   │   └── submit-answer.php       # 답안 제출
│   ├── config/
│   │   └── database.php        # 데이터베이스 설정
│   └── assets/
│       └── images/             # 이미지 리소스
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🚀 설치 및 설정

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 이상
- 웹 서버 (Apache/Nginx)

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 (Moodle DB 사용 또는 새로 생성)
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
mysql -u moodle_user -p moodle < database/schema.sql
```

### 3. 설정 파일 수정

`src/config/database.php` 파일을 열어 데이터베이스 정보를 수정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alt42standalone_v1.0/src;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. 파일 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chmod -R 755 src/
chmod -R 644 src/config/database.php
```

## 💻 사용 방법

### 1. 웹 브라우저에서 접속

```
http://your-domain.com/
```

### 2. 문제 풀이
1. 문제가 화면에 표시됩니다
2. "포함" 또는 "포함 X" 버튼을 클릭합니다
3. 게이트 애니메이션이 재생됩니다
   - 정답: 해당 게이트가 열립니다
   - 오답: 해당 게이트가 흔들립니다
4. 피드백과 설명을 확인합니다
5. "다음 문제" 버튼을 클릭하여 계속 진행합니다

### 3. 개발 모드
Moodle 연결이 안 되는 경우, 자동으로 샘플 데이터로 동작합니다.

## 🎨 UI 컴포넌트

### 게이트 애니메이션
- **포함 게이트** (초록색): 원소가 집합에 포함될 때 열림
- **포함 X 게이트** (빨간색): 원소가 집합에 포함되지 않을 때 열림
- **3D 회전 효과**: perspective를 활용한 입체적 문 열림
- **바운스/흔들림 효과**: 정답/오답 시각적 피드백

### 스마트폰 UI
- **디바이스 프레임**: 실제 스마트폰과 유사한 베젤과 홈 버튼
- **반응형 화면**: 내부 콘텐츠가 스크롤 가능
- **우측 하단 고정**: 화면 크기에 관계없이 일정한 위치 유지

## 🔧 API 엔드포인트

### 1. 연결 확인
```
GET /api/check-connection.php
```
**응답**:
```json
{
  "success": true,
  "message": "Moodle 연결 성공",
  "moodleVersion": "2019052000",
  "timestamp": 1637123456
}
```

### 2. 문제 가져오기
```
GET /api/get-question.php
GET /api/get-question.php?id=123
```
**응답**:
```json
{
  "success": true,
  "question": {
    "id": 123,
    "text": "3은 {1, 2, 3, 4, 5} 집합에 포함됩니까?",
    "correctAnswer": true,
    "explanation": "3은 주어진 집합의 원소입니다."
  },
  "timestamp": 1637123456
}
```

### 3. 답안 제출
```
POST /api/submit-answer.php
Content-Type: application/json

{
  "questionId": 123,
  "isCorrect": true,
  "score": 10
}
```
**응답**:
```json
{
  "success": true,
  "message": "답안이 저장되었습니다",
  "attemptId": 456,
  "isCorrect": true,
  "score": 10,
  "timestamp": 1637123456
}
```

## 🗃 데이터베이스 스키마

### inclusion_gate_attempts
학생의 문제 풀이 시도 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| user_id | INT | 사용자 ID |
| question_id | INT | 문제 ID |
| is_correct | TINYINT | 정답 여부 (0/1) |
| score | INT | 점수 |
| attempt_time | DATETIME | 시도 시간 |

### inclusion_gate_stats
사용자별 통계

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| user_id | INT | 사용자 ID (UNIQUE) |
| total_attempts | INT | 총 시도 횟수 |
| correct_attempts | INT | 정답 횟수 |
| total_score | INT | 총 점수 |
| last_activity | DATETIME | 마지막 활동 시간 |

### inclusion_gate_questions
커스텀 문제 (Moodle 외 추가 문제)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| question_text | TEXT | 문제 텍스트 |
| correct_answer | TINYINT | 정답 (0: 포함X, 1: 포함) |
| explanation | TEXT | 해설 |
| difficulty | INT | 난이도 (1-5) |
| category | VARCHAR | 카테고리 |
| is_active | TINYINT | 활성화 여부 |

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: HTML 태그 제거 (`strip_tags`)
3. **CORS 설정**: 필요한 경우 특정 도메인만 허용하도록 수정
4. **세션 관리**: Moodle 세션과 통합 권장
5. **입력 검증**: 모든 사용자 입력 검증

## 📊 모니터링 및 로그

### 에러 로그
PHP 에러는 서버의 에러 로그에 기록됩니다:
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx + PHP-FPM
tail -f /var/log/php7.1-fpm.log
```

### 사용자 통계 조회
```sql
-- 전체 사용자 성과
SELECT * FROM inclusion_gate_user_performance;

-- 특정 사용자 상세
SELECT * FROM inclusion_gate_attempts WHERE user_id = 1 ORDER BY attempt_time DESC;
```

## 🎯 커스터마이징

### 1. 게이트 색상 변경
`src/css/style.css`:
```css
.left-gate .gate-button {
    background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### 2. 애니메이션 속도 조절
`src/js/gate-animation.js`:
```javascript
this.animationDuration = 1000; // 밀리초 (기본값: 800)
```

### 3. 스마트폰 크기 조절
`src/css/style.css`:
```css
.smartphone {
    width: 400px;  /* 기본값: 380px */
    height: 800px; /* 기본값: 720px */
}
```

## 🐛 문제 해결

### 1. "연결 확인 중..." 계속 표시
- 데이터베이스 설정 확인 (`src/config/database.php`)
- MySQL 서비스 실행 상태 확인
- PHP PDO 확장 설치 확인

### 2. 게이트 애니메이션이 작동하지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- CSS가 제대로 로드되었는지 확인

### 3. Moodle 문제를 가져올 수 없음
- Moodle 데이터베이스 테이블 구조 확인
- `mdl_question` 테이블에 `qtype='truefalse'` 문제가 있는지 확인

## 📱 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (부분 지원, 애니메이션 제한)

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈 트래커를 이용해 주세요.

## 📧 연락처

프로젝트 관련 문의: [담당자 이메일]

---

**개발 정보**
- 개발 시작: 2025-11-18
- 버전: 1.0.0
- 최종 업데이트: 2025-11-18
