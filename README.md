# Math App - Extrema Tremor Fix

웹앱이 LMS(Moodle)와 연동하여 문제 정보를 받아서 동작하며, 우측 하단 가상 스마트폰 화면에 수학 그래프를 표시하는 애플리케이션입니다.

## 주요 기능

### 🎯 Extrema Tremor 수정

극값점(local maxima/minima)에서 그래프가 떨리는 현상을 해결하기 위한 고급 알고리즘 적용:

1. **적응형 샘플링 (Adaptive Sampling)**
   - 극값 근처에서 더 많은 포인트 계산
   - 수치 안정성 향상

2. **이차 보간 (Quadratic Interpolation)**
   - 정확한 극값 위치 계산
   - 부동소수점 오차 최소화

3. **Catmull-Rom 스플라인**
   - 초부드러운 곡선 렌더링
   - 시각적 떨림 완전 제거

4. **수치 안정성**
   - 다중 검증 기준 사용
   - 1차 및 2차 도함수 분석

### 📱 가상 스마트폰 디스플레이

- 실제 스마트폰과 유사한 UI
- 반응형 디자인
- 상태바, 노치, 홈 인디케이터 등 디테일

### 🔗 Moodle LMS 연동

- Moodle 3.7 데이터베이스 연동
- 실시간 문제 데이터 로드
- 학생 답안 제출 및 평가
- 세션 관리

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: Vanilla JavaScript (ES6+)
- **Graphics**: HTML5 Canvas
- **Styling**: CSS3 (Flexbox, Grid, Animations)

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   └── config.php              # 환경 설정
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── public/
│   ├── index.html              # 메인 HTML
│   ├── api/
│   │   └── problems.php        # API 엔드포인트
│   └── assets/
│       ├── css/
│       │   └── styles.css      # 스타일시트
│       └── js/
├── src/
│   ├── js/
│   │   ├── graphRenderer.js    # 그래프 렌더링 엔진
│   │   └── app.js              # 메인 애플리케이션
│   └── php/
│       ├── database.php        # 데이터베이스 핸들러
│       ├── moodle_integration.php  # Moodle 연동
│       └── problems.php        # API 컨트롤러
└── logs/                       # 로그 파일 (자동 생성)
```

## 설치 가이드

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7
- Apache/Nginx 웹서버
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

### 2. 데이터베이스 설정

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 임포트
mysql -u root -p < database/schema.sql
```

### 3. 설정 파일 수정

`config/config.php` 파일을 열고 데이터베이스 정보를 입력:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_NAME', 'moodle');
define('DB_PORT', 3306);
```

### 4. 웹서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API 라우팅
    RewriteRule ^api/(.*)$ public/api/$1 [L]

    # 정적 파일
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public/index.html [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alt42standalone_v1.0/public;

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

    location /api {
        try_files $uri $uri/ /api/problems.php?$query_string;
    }
}
```

### 5. 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs

# 캐시 디렉토리 (선택사항)
mkdir -p cache
chmod 755 cache
chown www-data:www-data cache
```

## 사용 방법

### 기본 사용

1. 웹 브라우저에서 애플리케이션 열기:
   ```
   http://your-domain.com/
   ```

2. 자동으로 데모 문제가 로드됩니다

3. 좌측 패널에서 컨트롤 및 정보 확인

4. 우측 가상 스마트폰에 그래프 표시

### Moodle 연동 사용

URL 파라미터로 문제 ID 전달:

```
http://your-domain.com/?problem_id=1&session_id=your_session_id
```

### 수동 함수 입력

좌측 패널의 "Manual Function Input" 섹션에서 함수 입력:

- 지원 함수: `sin`, `cos`, `tan`, `sqrt`, `abs`, `pow`, `exp`, `log`
- 상수: `PI`, `E`
- 예제: `sin(x) + 0.5 * cos(2*x)`

### Anti-Tremor 토글

개발/디버깅 목적으로 떨림 방지 기능을 켜고 끌 수 있습니다:

```javascript
// JavaScript 콘솔에서
window.mathApp.graphRenderer.options.enableAntiTremor = false;
window.mathApp.renderGraph(window.mathApp.currentProblem);
```

## API 문서

### GET /api/problems.php

문제 데이터 가져오기

**파라미터:**
- `problem_id` (required): 문제 ID
- `session_id` (optional): 세션 ID

**응답:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "Find Extrema",
    "description": "문제 설명",
    "function": "sin(x) + 0.5 * sin(3*x)",
    "xMin": -6.28,
    "xMax": 6.28,
    "yMin": -2,
    "yMax": 2,
    "hints": ["힌트1", "힌트2"],
    "metadata": {
      "difficulty": "medium",
      "topic": "Calculus"
    }
  }
}
```

### POST /api/problems.php?action=submit_answer

답안 제출

**요청 본문:**
```json
{
  "problem_id": 1,
  "session_id": "session_123",
  "answer": {
    "extrema": [
      {"x": 1.5, "y": 1.2, "type": "maximum"}
    ]
  }
}
```

**응답:**
```json
{
  "success": true,
  "problem": {
    "submitted": true,
    "correct": true,
    "feedback": "Excellent! 정답입니다."
  }
}
```

## Extrema Tremor 수정 상세

### 문제 원인

극값점에서 그래프가 떨리는 현상의 주요 원인:

1. **수치 미분 오차**: 유한차분법의 부동소수점 오차
2. **샘플링 부족**: 극값 근처 데이터 포인트 부족
3. **렌더링 보간**: 선형 보간의 한계
4. **계산 불안정성**: 기울기가 0에 가까울 때 발생

### 해결 방법

#### 1. 적응형 샘플링 (src/js/graphRenderer.js:104)

```javascript
calculateAdaptivePoints() {
    // 극값 근처에서 샘플링 밀도 증가
    const adaptiveFactor = 1 / (1 + 10 * Math.abs(derivative));
    const step = baseStep * (0.2 + 0.8 * (1 - adaptiveFactor));
}
```

#### 2. 이차 보간 (src/js/graphRenderer.js:202)

```javascript
smoothExtremaPositions() {
    // 3개 점으로 2차 함수 피팅하여 정확한 극값 계산
    const xExtrema = -B / (2 * A);
    const yExtrema = this.functionExpression(xExtrema);
}
```

#### 3. Catmull-Rom 스플라인 (src/js/graphRenderer.js:358)

```javascript
drawSmoothCurve() {
    // 베지어 곡선으로 부드러운 렌더링
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp2.x, cp2.y);
}
```

## 문제 해결

### 그래프가 표시되지 않음

1. 브라우저 콘솔 확인
2. Canvas 지원 여부 확인
3. JavaScript 오류 확인

### 데이터베이스 연결 오류

1. `config/config.php` 설정 확인
2. MySQL 서비스 실행 상태 확인
3. 사용자 권한 확인

### Moodle 연동 문제

1. Moodle 데이터베이스 접근 권한 확인
2. 테이블 프리픽스 확인 (`mdl_` 기본값)
3. `src/php/moodle_integration.php` 로그 확인

## 개발자 가이드

### 새 문제 추가

```sql
INSERT INTO math_problems
(title, description, function_expression, x_min, x_max, y_min, y_max, difficulty, topic)
VALUES
('새 문제', '설명', 'cos(x)*x', -5, 5, -5, 5, 'medium', 'Calculus');
```

### 커스텀 함수 파서 확장

`src/js/graphRenderer.js:62`의 `parseFunction` 메서드 수정:

```javascript
const math = {
    sin: Math.sin,
    cos: Math.cos,
    // 새 함수 추가
    myFunction: (x) => { /* 구현 */ }
};
```

### 렌더링 옵션 조정

```javascript
new GraphRenderer('mathCanvas', {
    samplingRate: 500,          // 더 많은 샘플 포인트
    smoothingFactor: 0.5,       // 더 강한 스무딩
    enableAntiTremor: true,     // 떨림 방지 활성화
    derivativeThreshold: 0.0001 // 더 민감한 극값 감지
});
```

## 성능 최적화

- 샘플링 레이트 조정: 복잡한 함수는 높게, 단순한 함수는 낮게
- 캐싱 활용: 자주 사용하는 문제는 캐싱
- 데이터베이스 인덱스: 쿼리 성능 향상

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해 주세요.

## 지원

문의사항이 있으시면 개발팀에 연락해 주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
