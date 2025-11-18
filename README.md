# Ratio Alive - 비율이 살아있는 수학 학습 앱

**Ratio Alive**는 Moodle LMS와 연동되는 인터랙티브 수학 교육 웹 애플리케이션입니다. 도형의 크기가 변해도 비율은 일정하게 유지된다는 수학적 개념을 시각적 애니메이션으로 학습할 수 있습니다.

## 🎯 주요 기능

- **가상 스마트폰 인터페이스**: 우측 하단에 실제 스마트폰처럼 보이는 화면에 앱이 표시됩니다
- **실시간 비율 애니메이션**: 삼각형, 직사각형, 오각형 등 다양한 도형의 크기가 변화하는 애니메이션
- **인터랙티브 컨트롤**: 비율 조정, 도형 선택, 애니메이션 속도 제어
- **Moodle LMS 연동**: Moodle 3.7과 완벽하게 연동되어 문제 정보를 받아오고 답안을 제출
- **자동 평가 시스템**: 학생의 답안을 키워드 기반으로 자동 평가하고 피드백 제공

## 🛠️ 기술 스택

### 프론트엔드
- HTML5 Canvas (애니메이션)
- CSS3 (반응형 디자인, 그라디언트)
- Vanilla JavaScript (ES6+)

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 HTML 페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   └── js/
│       ├── ratioAlive.js  # 비율 시각화 엔진
│       └── app.js         # 메인 애플리케이션 로직
├── api/                   # 백엔드 API
│   ├── config.php         # 데이터베이스 및 설정
│   ├── moodle_connector.php  # Moodle 연동 클래스
│   └── problem_api.php    # REST API 엔드포인트
├── database/              # 데이터베이스 스크립트
│   └── init.sql          # 초기화 SQL
├── logs/                  # 로그 파일 (자동 생성)
└── README.md             # 프로젝트 문서
```

## 🚀 설치 및 설정

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 설치 및 실행 중

### 2. 프로젝트 다운로드

```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 3. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 (Moodle과 동일한 DB 사용 권장)
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 초기화 스크립트 실행
mysql -u moodle_user -p moodle < database/init.sql
```

### 4. 설정 파일 수정

`api/config.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');

define('MOODLE_ROOT', '/var/www/html/moodle');
define('MOODLE_DATA', '/var/moodledata');
define('MOODLE_PREFIX', 'mdl_');
```

### 5. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName ratio-alive.local
    DocumentRoot /var/www/alt42standalone_v1.0/public

    <Directory /var/www/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/ratio-alive-error.log
    CustomLog ${APACHE_LOG_DIR}/ratio-alive-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name ratio-alive.local;
    root /var/www/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }
}
```

### 6. 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 부여
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs

# 파일 권한 설정
chmod 644 public/*.html
chmod 644 api/*.php
```

## 📖 사용 방법

### 데모 모드

브라우저에서 `http://ratio-alive.local` 또는 설정한 도메인으로 접속하면 데모 모드로 앱을 체험할 수 있습니다.

### Moodle 연동 모드

Moodle 퀴즈나 활동에서 다음과 같은 URL로 연결하세요:

```
http://ratio-alive.local?problemId=123&sessionId=abc123
```

**파라미터 설명:**
- `problemId`: Moodle 문제 ID 또는 ratio_alive_problems 테이블의 ID
- `sessionId`: Moodle 세션 ID (사용자 인증용)

### 기본 조작

1. **도형 선택**: 삼각형, 직사각형, 오각형 중 선택
2. **비율 조정**: 슬라이더로 A와 B 비율 조정 (1:1 ~ 10:10)
3. **애니메이션 제어**:
   - ▶ 재생: 애니메이션 시작
   - ⏸ 일시정지: 애니메이션 멈춤
   - ↻ 리셋: 초기 상태로 되돌림
4. **속도 조절**: 0.5배속 ~ 3배속
5. **답안 작성 및 제출**: 관찰한 내용을 작성하고 제출 버튼 클릭

## 🔗 Moodle 통합 가이드

### 1. Moodle에서 외부 도구 추가

Moodle 관리자 페이지에서:

1. **사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구**로 이동
2. 새 외부 도구 구성 추가
3. 도구 URL: `http://ratio-alive.local`
4. 소비자 키 및 공유 비밀 설정

### 2. 코스에 Ratio Alive 활동 추가

1. 코스 편집 모드 활성화
2. **활동 또는 리소스 추가 > 외부 도구** 선택
3. Ratio Alive 도구 선택
4. 맞춤 파라미터 추가:
   ```
   problemId=1
   ```

### 3. 문제 데이터 추가

`database/init.sql`을 참고하거나 직접 SQL로 문제 추가:

```sql
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, initial_shape, initial_ratio)
VALUES
(123, '비율의 불변성', '비율과 비례', '도형 크기가 변해도 비율은 일정함', '중급', 'triangle', '3:4');
```

## 🎨 커스터마이징

### 색상 변경

`public/css/style.css`에서 CSS 변수를 수정하세요:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #4CAF50;
}
```

### 도형 추가

`public/js/ratioAlive.js`의 `RatioAlive` 클래스에 새로운 도형 그리기 메서드 추가:

```javascript
drawCustomShape(x, y, scale) {
    // 커스텀 도형 그리기 로직
}
```

### 평가 알고리즘 수정

`api/problem_api.php`의 `evaluateAnswer()` 함수를 수정하여 더 정교한 평가 로직 구현 가능.

## 🐛 문제 해결

### 문제: Moodle에서 문제를 불러올 수 없음

**해결:**
1. `api/config.php`에서 Moodle 데이터베이스 설정 확인
2. Moodle 테이블 프리픽스 확인 (`mdl_`이 기본값)
3. 로그 파일 확인: `logs/error.log`

### 문제: 애니메이션이 작동하지 않음

**해결:**
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. Canvas가 지원되는 브라우저인지 확인 (Chrome, Firefox, Safari, Edge 최신 버전)
3. 캐시 삭제 후 새로고침 (Ctrl+Shift+R)

### 문제: 답안 제출 실패

**해결:**
1. 네트워크 탭에서 API 응답 확인
2. `api/config.php`에서 CORS 설정 확인
3. PHP 에러 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`

## 📊 데이터베이스 스키마

### ratio_alive_problems

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_question_id | INT | Moodle 질문 ID |
| title | VARCHAR(255) | 문제 제목 |
| topic | VARCHAR(100) | 주제 |
| description | TEXT | 설명 |
| difficulty | VARCHAR(50) | 난이도 |
| instructions | TEXT | 지시사항 |
| initial_shape | VARCHAR(50) | 초기 도형 |
| initial_ratio | VARCHAR(20) | 초기 비율 |

### ratio_alive_answers

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| problem_id | INT | 문제 ID |
| user_id | INT | 사용자 ID |
| session_id | VARCHAR(100) | 세션 ID |
| answer | TEXT | 답안 |
| current_ratio | VARCHAR(20) | 제출 시 비율 |
| current_shape | VARCHAR(50) | 제출 시 도형 |
| score | DECIMAL(5,2) | 점수 |
| feedback | TEXT | 피드백 |
| submitted_at | TIMESTAMP | 제출 시간 |

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 개발자

- **KAIST Touch Math Academy** - AI Education System Pipeline

## 🙏 감사의 말

- Moodle 커뮤니티
- Canvas API 문서
- 모든 기여자들

## 📞 문의

질문이나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for better math education**
