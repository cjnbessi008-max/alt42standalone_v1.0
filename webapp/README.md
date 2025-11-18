# Alt42 LMS Integration WebApp

Moodle 3.7 LMS와 연동하여 학습 진행 상황을 시각화하는 웹 애플리케이션입니다.

## 주요 기능

### 1. Log 그래프 with Area Color
- Chart.js를 사용한 로그 스케일 그래프
- 그래프 아래 영역을 색상으로 채우는 Area Fill 기능
- 실시간 학습 진행도 시각화
- 애니메이션 효과

### 2. 가상 스마트폰 화면 (우측 하단)
- 우측 하단에 고정된 스마트폰 UI
- 실시간 문제 정보 표시
- 미니 로그 그래프 포함
- 반응형 디자인 지원

### 3. Moodle LMS 연동
- Moodle 3.7 Web Services API 연동
- 퀴즈/문제 정보 가져오기
- 학습 진행 데이터 실시간 업데이트
- 답안 제출 기능

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**:
  - HTML5 / CSS3
  - JavaScript (ES6+)
  - Chart.js 3.9.1

## 파일 구조

```
webapp/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트 (스마트폰 UI 포함)
├── js/
│   ├── app.js             # 메인 애플리케이션 로직
│   ├── log-graph.js       # Log 그래프 with Area Color
│   └── moodle-connector.js # Moodle API 연동
├── api/
│   ├── config.php         # 데이터베이스 설정
│   ├── get_progress.php   # 학습 진행 데이터 API
│   └── get_problem.php    # 문제 정보 API
└── README.md
```

## 설치 방법

### 1. 데이터베이스 설정

`api/config.php` 파일에서 MySQL 연결 정보를 설정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
```

### 2. Moodle Web Service 설정

Moodle 관리자 페이지에서:

1. **관리 → 플러그인 → 웹 서비스 → 개요**로 이동
2. 웹 서비스 활성화
3. REST 프로토콜 활성화
4. 토큰 생성
5. `api/config.php`에 토큰 설정:

```php
define('MOODLE_WS_TOKEN', 'your_webservice_token');
define('MOODLE_URL', 'http://your-moodle-site.com');
```

### 3. 웹 서버 설정

Apache 또는 Nginx 웹 서버에 웹앱 디렉토리를 배포합니다.

**Apache .htaccess 예시:**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
</IfModule>

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

## 사용 방법

### URL 파라미터

웹앱을 실행할 때 다음 파라미터를 전달할 수 있습니다:

```
index.html?userid=1&courseid=2&problemid=10&wstoken=your_token
```

**파라미터 설명:**
- `userid`: 사용자 ID
- `courseid`: 코스 ID
- `problemid`: 문제 ID
- `wstoken`: Moodle Web Service 토큰
- `moodle_url`: Moodle 사이트 URL (선택사항)

### API 엔드포인트

#### 1. 학습 진행 데이터 가져오기

```
GET /api/get_progress.php?userid=1&courseid=2
```

**응답:**
```json
{
  "success": true,
  "data": {
    "progress": [
      {
        "time": 0,
        "score": 75.5,
        "activity": "Quiz 1",
        "timestamp": "2023-11-18 10:30:00"
      }
    ],
    "summary": {
      "total_attempts": 10,
      "completed_count": 8,
      "average_score": 82.3
    }
  }
}
```

#### 2. 문제 정보 가져오기

```
GET /api/get_problem.php?problemid=10
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "분수의 덧셈",
    "description": "1/3 + 1/4의 값을 구하시오.",
    "difficulty": "medium",
    "category": "Fractions"
  }
}
```

## Log 그래프 Area Color 기능

### 주요 설정

`js/log-graph.js` 파일에서 Area Color 설정:

```javascript
{
  backgroundColor: 'rgba(102, 126, 234, 0.3)', // Area Color
  fill: true, // 영역 채우기 활성화
  tension: 0.4 // 곡선 부드럽게
}
```

### 로그 스케일 설정

```javascript
scales: {
  y: {
    type: 'logarithmic', // 로그 스케일 적용
    ticks: {
      callback: function(value) {
        return value.toFixed(0) + '%';
      }
    }
  }
}
```

## 스마트폰 화면 커스터마이징

### CSS 위치 변경

`css/style.css`에서 스마트폰 화면 위치 조정:

```css
.smartphone-display {
    position: fixed;
    bottom: 20px;  /* 하단 여백 */
    right: 20px;   /* 우측 여백 */
}
```

### 크기 조정

```css
.smartphone-frame {
    width: 300px;   /* 너비 */
    height: 600px;  /* 높이 */
}
```

## 데이터베이스 스키마

Moodle 3.7의 기본 테이블을 사용합니다:

- `mdl_quiz`: 퀴즈 정보
- `mdl_quiz_attempts`: 퀴즈 시도 기록
- `mdl_quiz_slots`: 퀴즈 문제 매핑
- `mdl_question`: 문제 정보
- `mdl_logstore_standard_log`: 활동 로그

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: `htmlspecialchars()`, `strip_tags()` 사용
3. **CORS 설정**: 허용된 도메인만 API 접근 가능
4. **인증**: Moodle Web Service 토큰 검증

## 문제 해결

### 그래프가 표시되지 않는 경우

1. Chart.js CDN 로드 확인
2. 브라우저 콘솔에서 JavaScript 오류 확인
3. 데이터 형식이 올바른지 확인

### Moodle API 연결 실패

1. Web Service 활성화 확인
2. 토큰이 유효한지 확인
3. CORS 설정 확인
4. Moodle URL이 올바른지 확인

### 데이터베이스 연결 오류

1. MySQL 서비스 실행 확인
2. 데이터베이스 자격 증명 확인
3. PHP PDO 확장 설치 확인

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다.

## 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [PHP PDO Tutorial](https://www.php.net/manual/en/book.pdo.php)
