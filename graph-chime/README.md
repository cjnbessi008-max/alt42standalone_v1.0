# Graph Chime 🎵📊

**그래프의 절편을 음악으로 듣는 교육용 웹앱**

Graph Chime은 일차함수의 y절편과 x절편을 음악 음처럼 들을 수 있게 해주는 혁신적인 수학 교육 도구입니다. Moodle LMS와 연동하여 문제 정보를 받아 우측 하단 가상 스마트폰 화면에 표시됩니다.

![Graph Chime](docs/screenshot.png)

## 주요 기능 ✨

### 1. Moodle LMS 연동
- Moodle 3.7과 완벽한 연동
- Web Service API를 통한 문제 정보 자동 동기화
- 학생 응답 자동 제출

### 2. 시각적 그래프 표시
- Canvas를 사용한 고품질 그래프 렌더링
- y절편과 x절편 자동 계산 및 강조 표시
- 실시간 좌표 표시

### 3. 음향 생성 (Graph Chime)
- **y절편**: Sine 파형, C4-A4 음계
- **x절편**: Triangle 파형, C5-A5 음계
- Web Audio API를 사용한 실시간 음향 생성
- 화음 재생 기능 (y절편 + x절편 동시 재생)

### 4. 가상 스마트폰 UI
- 우측 하단에 실제 스마트폰처럼 표시
- 반응형 디자인
- 음향 시각화 효과

## 기술 스택 🛠️

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5** / **CSS3**
- **JavaScript** (ES6+)
- **Canvas API**: 그래프 렌더링
- **Web Audio API**: 음향 생성

## 시스템 요구사항 📋

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (Web Services 활성화 필요)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)

## 설치 가이드 🚀

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE graph_chime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용
mysql -u root -p graph_chime < database/schema.sql
```

### 2. 설정 파일 수정

`config/config.php` 파일을 열어 다음 항목을 수정합니다:

```php
// Database Configuration
define('DB_HOST', 'localhost');        // MySQL 호스트
define('DB_NAME', 'graph_chime');      // 데이터베이스 이름
define('DB_USER', 'your_username');    // MySQL 사용자명
define('DB_PASS', 'your_password');    // MySQL 비밀번호

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_moodle_webservice_token');
```

### 3. Moodle Web Service 설정

1. Moodle 관리자 페이지 접속
2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**로 이동
3. 새 서비스 생성: "Graph Chime Service"
4. 다음 함수들을 서비스에 추가:
   - `core_question_get_questions`
   - `core_user_get_users_by_field`
   - `mod_quiz_save_attempt`
5. 토큰 생성 후 `config.php`에 입력

### 4. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName graph-chime.local
    DocumentRoot /path/to/graph-chime/frontend

    <Directory /path/to/graph-chime/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /path/to/graph-chime/backend
    <Directory /path/to/graph-chime/backend>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name graph-chime.local;
    root /path/to/graph-chime/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /path/to/graph-chime/backend;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
}
```

### 5. 파일 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chmod -R 755 graph-chime
chown -R www-data:www-data graph-chime  # Ubuntu/Debian
# 또는
chown -R apache:apache graph-chime      # CentOS/RHEL
```

## 사용 방법 📖

### 1. 앱 실행

웹 브라우저에서 `http://graph-chime.local` 또는 설정한 URL로 접속합니다.

### 2. 문제 불러오기

1. **Moodle 문제 ID** 입력 (예: 1, 2, 3...)
2. **학생 ID** 입력
3. **"문제 불러오기"** 버튼 클릭

### 3. 음향 듣기

문제가 로드되면:
- **🔊 듣기 (y절편)**: y절편 음만 재생
- **🔊 듣기 (x절편)**: x절편 음만 재생
- **🎵 둘 다 듣기**: y절편과 x절편을 화음으로 동시 재생

### 4. 그래프 확인

우측 하단 가상 스마트폰 화면에서:
- 좌표평면에 그려진 일차함수 그래프
- 빨간색 점: y절편 (0, b)
- 청록색 점: x절편 (a, 0)
- 점선: 절편 가이드 라인

## 프로젝트 구조 📁

```
graph-chime/
├── backend/              # PHP 백엔드
│   ├── Database.php      # 데이터베이스 연결
│   ├── MoodleAPI.php     # Moodle API 연동
│   ├── GraphProblem.php  # 문제 모델
│   └── api.php           # REST API 엔드포인트
├── frontend/             # 프론트엔드
│   ├── index.html        # 메인 HTML
│   ├── css/
│   │   ├── style.css     # 메인 스타일
│   │   └── smartphone.css # 스마트폰 UI 스타일
│   ├── js/
│   │   ├── audio.js      # 음향 엔진 (Web Audio API)
│   │   ├── graph.js      # 그래프 렌더러 (Canvas)
│   │   └── app.js        # 메인 앱 로직
│   └── assets/           # 이미지 등
├── database/
│   └── schema.sql        # 데이터베이스 스키마
├── config/
│   └── config.php        # 설정 파일
├── docs/                 # 문서
└── README.md             # 이 파일
```

## API 엔드포인트 📡

### GET /api/problem
문제 정보 조회

**Parameters:**
- `moodle_question_id` (required): Moodle 문제 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_question_id": 123,
    "equation": "y = 2x + 3",
    "slope": 2.0,
    "y_intercept": 3.0,
    "x_intercept": -1.5,
    "title": "일차함수 그래프",
    "description": "..."
  }
}
```

### POST /api/submit
학생 응답 제출

**Body:**
```json
{
  "problem_id": 1,
  "student_id": 123,
  "session_id": "session_xxx",
  "response_data": {...},
  "is_correct": true,
  "score": 100
}
```

### POST /api/log
세션 로그 기록

**Body:**
```json
{
  "session_id": "session_xxx",
  "student_id": 123,
  "action_type": "play_sound",
  "action_data": {...}
}
```

## 음계 매핑 🎼

### y절편 (Sine 파형)
| 범위 | 음계 | 주파수 (Hz) |
|------|------|-------------|
| -5 ~ -4 | C4 | 261.63 |
| -4 ~ -3 | C#4 | 277.18 |
| -3 ~ -2 | D4 | 293.66 |
| -2 ~ -1 | D#4 | 311.13 |
| -1 ~ 0 | E4 | 329.63 |
| 0 ~ 1 | F4 | 349.23 |
| 1 ~ 2 | F#4 | 369.99 |
| 2 ~ 3 | G4 | 392.00 |
| 3 ~ 4 | G#4 | 415.30 |
| 4 ~ 5 | A4 | 440.00 |

### x절편 (Triangle 파형)
| 범위 | 음계 | 주파수 (Hz) |
|------|------|-------------|
| -5 ~ -4 | C5 | 523.25 |
| -4 ~ -3 | C#5 | 554.37 |
| -3 ~ -2 | D5 | 587.33 |
| ... | ... | ... |
| 4 ~ 5 | A5 | 880.00 |

## 문제 해결 🔧

### 음향이 재생되지 않을 때
- 브라우저가 Web Audio API를 지원하는지 확인
- 브라우저 자동재생 정책으로 인해 첫 클릭이 필요할 수 있음
- 개발자 도구 콘솔에서 오류 확인

### Moodle 연동이 안 될 때
- Moodle Web Services가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- CORS 설정 확인 (개발 환경)

### 그래프가 표시되지 않을 때
- Canvas API 지원 브라우저 사용
- 개발자 도구에서 JavaScript 오류 확인

## 개발 로드맵 🗺️

- [x] 기본 일차함수 그래프 표시
- [x] y절편, x절편 음향 생성
- [x] Moodle LMS 연동
- [x] 가상 스마트폰 UI
- [ ] 이차함수 지원
- [ ] 음향 커스터마이징 기능
- [ ] 다국어 지원 (영어)
- [ ] 터치 인터랙션 (모바일)
- [ ] 학습 분석 대시보드

## 라이선스 📄

MIT License

## 기여하기 🤝

이슈 및 풀 리퀘스트를 환영합니다!

## 연락처 📧

프로젝트 관련 문의: [이메일 주소]

---

**Graph Chime** - 수학을 음악으로 느껴보세요! 🎵📐
