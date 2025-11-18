# 🌊 Calm Growth - Educational Vibration App

독립형 웹앱으로 Moodle LMS와 연동하여 문제 정보를 받아 동작하며, 우측 하단 가상 스마트폰 화면에 표시되는 교육용 앱입니다.

## ✨ 주요 기능

### 1. **Calm Growth 진동 알고리즘**
- **원리**: 로그값이 커질수록 진동이 잠잠해집니다 (calming effect)
- **공식**: `intensity = baseIntensity / (1 + dampingFactor × log(logValue))`
- **효과**: 사용자가 활동할수록 점진적으로 부드러운 피드백 제공

### 2. **Moodle LMS 연동**
- Moodle 3.7 데이터베이스 직접 연동
- 퀴즈 문제 자동 동기화
- 사용자 활동 추적

### 3. **가상 스마트폰 UI**
- 우측 하단 고정 위치
- 실제 스마트폰 디자인 재현
- 반응형 디스플레이
- 접기/펼치기 기능

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 📋 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx
- Moodle 3.7 설치 및 접근 권한

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source sql/schema.sql
```

### 2. PHP 설정 파일 수정

`php/config.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
// Calm Growth 데이터베이스
define('DB_HOST', 'localhost');
define('DB_NAME', 'calm_growth_db');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 데이터베이스 (읽기 전용)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_'); // Moodle 테이블 접두사
```

### 3. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName calm-growth.local
    DocumentRoot /path/to/calm-growth-app

    <Directory /path/to/calm-growth-app>
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
    server_name calm-growth.local;
    root /path/to/calm-growth-app;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 4. 권한 설정

```bash
# 디렉토리 권한 설정
chmod -R 755 calm-growth-app/
chmod -R 775 calm-growth-app/php/
```

### 5. 브라우저에서 접속

```
http://localhost/calm-growth-app/
```

또는

```
http://calm-growth.local/
```

## 📖 사용 방법

### 기본 사용법

1. **문제 불러오기**
   - "📚 Load Problems" 버튼 클릭
   - 데이터베이스에서 문제 목록 로드

2. **Moodle 동기화**
   - "🔄 Sync from Moodle" 버튼 클릭
   - Moodle Quiz ID 입력
   - 자동으로 문제 동기화

3. **문제 클릭**
   - 스마트폰 화면에서 문제 카드 클릭
   - Calm Growth 진동 효과 발생
   - 활동 자동 기록

4. **진동 테스트**
   - "📳 Test Vibration" 버튼으로 즉시 테스트
   - "🌱 Simulate Growth"로 자동 시뮬레이션

### Calm Growth 알고리즘 이해하기

```javascript
// 초기 상태 (logValue = 1.0)
intensity = 100 / (1 + 1.5 × log(1)) = 100%  // 강한 진동

// 활동 5회 후 (logValue = 5.0)
intensity = 100 / (1 + 1.5 × log(5)) ≈ 41%   // 중간 진동

// 활동 20회 후 (logValue = 20.0)
intensity = 100 / (1 + 1.5 × log(20)) ≈ 26%  // 약한 진동

// 활동 100회 후 (logValue = 100.0)
intensity = 100 / (1 + 1.5 × log(100)) ≈ 16% // 매우 약한 진동
```

**효과**: 사용자가 학습할수록 점점 차분하고 안정적인 피드백을 받게 됩니다.

## 🔌 API 엔드포인트

### 1. 문제 조회
```
GET /php/api.php?endpoint=problems
GET /php/api.php?endpoint=problems&id=1
```

### 2. 진동 정보
```
GET /php/api.php?endpoint=vibration&user_id=1&problem_id=1
```

응답 예시:
```json
{
  "success": true,
  "data": {
    "intensity": 65.4,
    "frequency": 142.7,
    "duration": 115.3,
    "log_value": 5.25,
    "enabled": true,
    "message": "Calm Growth: Log value 5.25 → Intensity 65.4% (vibration calming)"
  }
}
```

### 3. 활동 기록
```
POST /php/api.php?endpoint=activity
Content-Type: application/json

{
  "user_id": 1,
  "problem_id": 1,
  "action_type": "view",
  "log_value": 1.0
}
```

### 4. Moodle 동기화
```
GET /php/api.php?endpoint=moodle-quizzes
GET /php/api.php?endpoint=moodle-quizzes&quiz_id=123

POST /php/api.php?endpoint=sync
Content-Type: application/json

{
  "question_id": 1001
}
```

## 📊 데이터베이스 스키마

### problems
- 문제 정보 저장
- Moodle question ID로 동기화

### activity_log
- 사용자 활동 기록
- Calm Growth 계산용 로그값 누적

### vibration_settings
- 사용자별 진동 설정
- base_intensity, damping_factor, min_intensity

## 🎨 커스터마이징

### 진동 파라미터 조정

`js/app.js`에서 초기 설정 변경:

```javascript
this.vibration = new CalmGrowthVibration({
    baseIntensity: 100,    // 기본 진동 강도 (0-100)
    dampingFactor: 1.5,    // 감쇠 계수 (높을수록 빠르게 감소)
    minIntensity: 10,      // 최소 진동 강도
    enabled: true          // 진동 활성화 여부
});
```

### 스마트폰 위치/크기 조정

`css/smartphone.css`에서 수정:

```css
.smartphone-container {
    bottom: 20px;    /* 하단 여백 */
    right: 20px;     /* 우측 여백 */
    width: 320px;    /* 너비 */
    height: 640px;   /* 높이 */
}
```

### 색상 테마 변경

`css/main.css`에서 그라디언트 수정:

```css
body {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.app-title {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🔧 문제 해결

### 1. 데이터베이스 연결 실패
```
Error: Database connection failed
```
**해결**: `php/config.php`에서 DB 정보 확인

### 2. Moodle 연동 실패
```
Error: Failed to fetch quiz questions
```
**해결**:
- Moodle DB 접근 권한 확인
- Moodle 테이블 접두사 확인 (`mdl_` 등)
- Moodle 버전 호환성 확인 (3.7+)

### 3. 진동이 작동하지 않음
- 브라우저가 Vibration API를 지원하는지 확인
- HTTPS 환경에서만 작동 (일부 브라우저)
- 모바일 기기에서 테스트

### 4. CORS 오류
```
Access-Control-Allow-Origin error
```
**해결**: `php/config.php`에 이미 CORS 헤더 설정되어 있음. Apache/Nginx 설정 확인

## 📱 브라우저 호환성

| 브라우저 | 지원 | Vibration API |
|---------|------|---------------|
| Chrome 90+ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ (Android) |
| Safari 14+ | ✅ | ❌ |
| Edge 90+ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ |
| Mobile Safari | ✅ | ❌ |

**Note**: Vibration API는 주로 Android 기기에서 지원됩니다. iOS는 시각적 효과만 표시됩니다.

## 🔐 보안 고려사항

1. **SQL Injection 방지**
   - PDO Prepared Statements 사용
   - 모든 사용자 입력 검증

2. **XSS 방지**
   - HTML 이스케이프 처리
   - Content Security Policy 권장

3. **Moodle DB 접근**
   - 읽기 전용 계정 사용 권장
   - 최소 권한 원칙 적용

4. **HTTPS 사용**
   - 프로덕션 환경에서 필수
   - SSL/TLS 인증서 설정

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

## 📞 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.

---

**Built with 🌊 Calm Growth Algorithm**
