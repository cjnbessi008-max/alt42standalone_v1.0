# Wave Minus - 집합 차집합 학습 애플리케이션

집합 간 차집합을 파도처럼 밀려나가는 효과로 시각화하여 학습하는 웹 애플리케이션입니다.

## 주요 기능

- ✨ **Wave 애니메이션**: 차집합에서 제거되는 원소들이 파도처럼 순차적으로 밀려나가는 시각 효과
- 📱 **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- 🔗 **Moodle 연동**: Moodle LMS와 연동하여 문제 데이터 수신 및 답안 제출
- 🎮 **인터랙티브**: 애니메이션 실행, 초기화, 새 문제 생성 기능
- 📊 **실시간 시각화**: 집합 A, B 및 차집합 결과를 직관적으로 표시

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 프로젝트 구조

```
wave-minus-app/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트
├── js/
│   ├── waveminus.js       # Wave Minus 애니메이션 엔진
│   └── app.js             # 메인 애플리케이션 로직
├── php/
│   ├── config.php         # 데이터베이스 설정
│   ├── get_problem.php    # Moodle 문제 조회 API
│   └── submit_answer.php  # 답안 제출 API
├── assets/
│   └── images/            # 이미지 리소스
└── README.md              # 문서
```

## 설치 방법

### 1. 파일 배포

웹 서버의 document root에 파일을 복사합니다.

```bash
# Apache 예시
cp -r wave-minus-app /var/www/html/

# Nginx 예시
cp -r wave-minus-app /usr/share/nginx/html/
```

### 2. 데이터베이스 설정

`php/config.php` 파일을 수정하여 Moodle 데이터베이스 연결 정보를 입력합니다.

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
```

### 3. 권한 설정

로그 디렉토리에 쓰기 권한을 부여합니다.

```bash
mkdir -p wave-minus-app/logs
chmod 755 wave-minus-app/logs
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ php/$1.php [L,QSA]
```

#### Nginx

```nginx
location /wave-minus-app/ {
    try_files $uri $uri/ /wave-minus-app/index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

## 사용 방법

### 독립 실행 모드

브라우저에서 `index.html`을 직접 엽니다.

```
http://your-domain.com/wave-minus-app/
```

- **애니메이션 실행**: 차집합 계산 및 Wave 애니메이션 재생
- **초기화**: 현재 문제를 초기 상태로 되돌림
- **새 문제**: 랜덤 문제 생성

### Moodle 연동 모드

Moodle에서 URL 파라미터로 문제 데이터를 전달합니다.

```
http://your-domain.com/wave-minus-app/?problemId=123&userId=456
```

#### URL 파라미터

- `problemId`: Moodle 문제 ID
- `userId`: 학생 사용자 ID
- `setA`: 집합 A 데이터 (JSON, 옵션)
- `setB`: 집합 B 데이터 (JSON, 옵션)

#### 예시

```
http://your-domain.com/wave-minus-app/
  ?problemId=100
  &userId=50
  &setA=[1,2,3,4,5,6]
  &setB=[3,4,5,6,7,8]
```

## API 문서

### GET /php/get_problem.php

Moodle에서 문제 데이터를 조회합니다.

**파라미터**:
- `problemId` (required): 문제 ID
- `userId` (optional): 사용자 ID

**응답**:
```json
{
  "success": true,
  "problem": {
    "id": 123,
    "name": "집합 차집합 문제 1",
    "setA": [1, 2, 3, 4, 5],
    "setB": [3, 4, 5, 6, 7],
    "category": "set_theory",
    "attempted": false
  }
}
```

### POST /php/submit_answer.php

답안을 Moodle에 제출합니다.

**요청 본문**:
```json
{
  "problemId": 123,
  "userId": 50,
  "answer": [1, 2],
  "timestamp": "2025-11-18T10:30:00Z"
}
```

**응답**:
```json
{
  "success": true,
  "attemptId": 456,
  "isCorrect": true,
  "score": 10.0,
  "feedback": "정답입니다! 🎉",
  "correctAnswer": [1, 2]
}
```

## Moodle 통합 가이드

### 1. Moodle 문제 생성

Moodle에서 사용자 정의 문제 유형을 생성합니다.

문제 텍스트에 집합 데이터를 JSON 또는 커스텀 포맷으로 입력:

```
A={1,2,3,4,5,6,7} B={4,5,6,7,8,9,10}
```

또는

```json
{"setA": [1,2,3,4,5,6,7], "setB": [4,5,6,7,8,9,10]}
```

### 2. iframe 임베딩

Moodle 페이지에 Wave Minus 앱을 iframe으로 임베드:

```html
<iframe
  src="http://your-domain.com/wave-minus-app/?problemId=123&userId=50"
  width="400"
  height="700"
  frameborder="0"
></iframe>
```

### 3. 결과 수신

Wave Minus 앱이 `submit_answer.php`를 통해 결과를 전송하면, Moodle의 커스텀 핸들러에서 처리합니다.

## 커스터마이징

### 색상 변경

`css/style.css`에서 그라디언트 색상을 수정:

```css
/* 메인 배경 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 집합 아이템 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 애니메이션 속도 조정

`js/waveminus.js`에서 딜레이 값 수정:

```javascript
// 파도 딜레이 (밀리초)
await this.delay(200 * i);  // 값을 늘리면 느려짐
```

### 집합 크기 조정

`js/waveminus.js`의 `generateRandomProblem` 함수:

```javascript
static generateRandomProblem(minSize = 5, maxSize = 10, maxValue = 20)
```

## 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 문제 해결

### 애니메이션이 작동하지 않음

- 브라우저 콘솔에서 JavaScript 오류 확인
- `js/waveminus.js`와 `js/app.js`가 올바르게 로드되었는지 확인

### Moodle 연동 실패

- `php/config.php`의 데이터베이스 설정 확인
- PHP 오류 로그 확인: `logs/error.log`
- 네트워크 탭에서 API 요청/응답 확인

### 스마트폰 프레임이 보이지 않음

- 화면 해상도가 충분한지 확인 (최소 1024px 권장)
- 모바일 기기에서는 자동으로 전체 화면 모드로 전환됨

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 버전 히스토리

- **v1.0.0** (2025-11-18): 초기 릴리스
  - Wave Minus 애니메이션 구현
  - Moodle 연동 기능
  - 스마트폰 UI 프레임
