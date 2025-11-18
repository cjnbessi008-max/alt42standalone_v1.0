# 🧱 Factor Lego - 인수분해 레고 앱

인수분해 과정을 레고 조립처럼 시각화하여 학습하는 교육용 웹 애플리케이션입니다.

## 📱 주요 기능

- **레고 스타일 시각화**: 인수분해 과정을 레고 블록 조립처럼 직관적으로 표현
- **드래그 앤 드롭**: 손쉬운 드래그 앤 드롭 인터페이스로 인수 조립
- **가상 스마트폰 UI**: 우측 하단에 고정된 스마트폰 형태의 인터페이스
- **Moodle 연동**: Moodle 3.7 LMS와 완벽하게 연동
- **실시간 피드백**: 즉각적인 정답/오답 피드백
- **힌트 시스템**: 단계별 힌트 제공
- **진행 상황 추적**: 학습 진행도 시각화

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5**: 구조화된 마크업
- **CSS3**: 반응형 디자인, 애니메이션
- **JavaScript (ES6+)**: 객체지향 프로그래밍

## 📦 설치 방법

### 1. 사전 요구사항

```bash
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7
- 웹 서버 (Apache/Nginx)
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE factor_lego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'factor_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON factor_lego.* TO 'factor_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u factor_user -p factor_lego < database/schema.sql
```

### 3. 설정 파일 수정

`moodle-integration/config.php` 파일을 열고 데이터베이스 정보를 수정합니다:

```php
// Moodle 데이터베이스 연결 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'your_moodle_password');

// Factor Lego 데이터베이스 연결 설정
define('FACTOR_DB_HOST', 'localhost');
define('FACTOR_DB_NAME', 'factor_lego');
define('FACTOR_DB_USER', 'factor_user');
define('FACTOR_DB_PASS', 'your_factor_password');
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName factor-lego.local
    DocumentRoot /path/to/factor-lego

    <Directory /path/to/factor-lego>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name factor-lego.local;
    root /path/to/factor-lego;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. Moodle 연동 설정

#### 방법 1: External Tool (LTI)

1. Moodle 관리자 페이지 접속
2. Site administration → Plugins → Activity modules → External tool
3. 새 External tool 추가
4. Tool URL: `https://your-domain.com/factor-lego/views/index.html`

#### 방법 2: iframe 삽입

Moodle 페이지나 퀴즈에 다음 코드를 추가:

```html
<iframe
    src="https://your-domain.com/factor-lego/views/index.html?problem_id=1&student_id={student_id}"
    width="100%"
    height="800px"
    frameborder="0"
    allow="fullscreen">
</iframe>
```

## 🚀 사용 방법

### 학생용

1. Moodle에서 Factor Lego 활동에 접근
2. 우측 하단에 가상 스마트폰 화면이 표시됨
3. 문제를 확인하고 레고 팔레트에서 조각을 드래그
4. 드롭 영역에 조각을 놓아 인수분해 완성
5. "제출" 버튼을 클릭하여 답안 제출
6. 즉각적인 피드백 확인

### 교사용

1. Moodle에서 문제 생성
2. Factor Lego 활동과 연결
3. 학생들의 진행 상황 모니터링
4. 성적 및 분석 데이터 확인

## 📊 API 엔드포인트

### 문제 가져오기

```http
GET /api/problem_api.php?problem_id={id}
```

**응답 예시:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "expression": "x^2 + 5x + 6",
    "difficulty_level": "easy",
    "correct_factors": {
      "factors": ["(x + 2)", "(x + 3)"],
      "steps": ["..."]
    },
    "hints": ["힌트 1", "힌트 2"]
  }
}
```

### 답안 제출

```http
POST /api/problem_api.php
Content-Type: application/json

{
  "student_id": 1,
  "problem_id": 1,
  "answer": ["(", "x", "+", "2", ")", "(", "x", "+", "3", ")"],
  "time_spent": 120,
  "interactions_count": 15
}
```

**응답 예시:**
```json
{
  "success": true,
  "is_correct": true,
  "score": 100.00,
  "feedback": {
    "message": "정답입니다!",
    "type": "success"
  }
}
```

## 🎨 커스터마이징

### 색상 테마 변경

`assets/css/smartphone.css` 파일에서 색상을 수정:

```css
/* 메인 그라디언트 색상 */
.smartphone-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 레고 조각 스타일 변경

`assets/css/lego-styles.css` 파일에서 레고 조각 스타일 수정:

```css
.lego-piece.variable {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}
```

## 🔧 개발 가이드

### 디렉토리 구조

```
factor-lego/
├── api/                    # API 엔드포인트
│   └── problem_api.php
├── assets/                 # 정적 자원
│   ├── css/
│   │   ├── smartphone.css  # 스마트폰 UI 스타일
│   │   └── lego-styles.css # 레고 조각 스타일
│   ├── js/
│   │   ├── lego-engine.js  # 인수분해 엔진
│   │   ├── drag-drop.js    # 드래그 앤 드롭 핸들러
│   │   └── main.js         # 메인 애플리케이션
│   └── images/             # 이미지 리소스
├── database/               # 데이터베이스
│   └── schema.sql          # DB 스키마
├── moodle-integration/     # Moodle 연동
│   ├── config.php
│   └── moodle_connector.php
├── views/                  # 뷰 파일
│   └── index.html
└── README.md
```

### 새로운 문제 타입 추가

1. `database/schema.sql`에 문제 추가:

```sql
INSERT INTO factor_problems (moodle_question_id, expression, difficulty_level, problem_type, correct_factors, hints)
VALUES (1004, '새로운 문제', 'medium', 'trinomial', '{"factors": [...]}', '["힌트"]');
```

2. 레고 엔진에서 파싱 로직 수정 (필요시)

### 새로운 레고 조각 타입 추가

`assets/js/lego-engine.js`의 `legoTypes` 객체에 추가:

```javascript
this.legoTypes = {
    // 기존 타입...
    newtype: { color: '#color', label: '라벨' }
};
```

## 🧪 테스트

### 수동 테스트

1. 브라우저에서 `views/index.html?problem_id=1&student_id=1` 접속
2. 레고 조각 드래그 앤 드롭 테스트
3. 정답/오답 시나리오 테스트
4. 힌트 기능 테스트

### 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🐛 문제 해결

### 문제: 레고 조각이 드래그되지 않음

**해결:** 브라우저 콘솔에서 JavaScript 오류 확인. `draggable="true"` 속성 확인.

### 문제: API 연결 실패

**해결:**
1. `config.php`의 데이터베이스 설정 확인
2. CORS 설정 확인
3. PHP 오류 로그 확인

### 문제: Moodle에서 접근 불가

**해결:**
1. Moodle External Tool 설정 확인
2. URL이 올바른지 확인
3. iframe allow 속성 확인

## 📄 라이선스

MIT License

## 👥 기여자

- KAIST Touch Math Academy Team

## 📞 지원

문의사항이나 버그 리포트는 이슈 트래커에 등록해주세요.

## 🔄 업데이트 로그

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 인수분해 기능
- Moodle 3.7 연동
- 레고 스타일 UI
- 드래그 앤 드롭 기능
- 진행 상황 추적

## 🎯 향후 계획

- [ ] 음성 피드백 추가
- [ ] 다양한 문제 타입 지원 (삼차식, 사차식 등)
- [ ] 멀티플레이어 모드
- [ ] 리더보드 기능
- [ ] 모바일 네이티브 앱 개발
- [ ] AI 기반 맞춤형 힌트 시스템
