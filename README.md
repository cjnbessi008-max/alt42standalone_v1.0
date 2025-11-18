# Operation Trail - 계산 과정 시각화 웹앱

Moodle LMS와 연동되는 수학 문제 풀이 시각화 애플리케이션입니다. 계산 과정이 불꽃처럼 연결되는 아름다운 애니메이션으로 학습을 돕습니다.

## 🎯 주요 기능

### ✨ Operation Trail (계산 과정 시각화)
- **단계별 계산 과정 표시**: 수식의 각 계산 단계를 시각적으로 표현
- **불꽃 효과 애니메이션**: 각 단계 전환 시 화려한 파티클 효과
- **연결선 애니메이션**: 계산 단계 간 관계를 선으로 연결
- **모바일 시뮬레이터**: 우측 하단 가상 스마트폰 화면에 표시

### 🔗 Moodle 연동
- Moodle 3.7 Web Services API 지원
- 실시간 문제 데이터 동기화
- 답안 제출 및 자동 채점
- 오프라인 모드 지원 (샘플 데이터 사용)

### 📊 학습 관리
- 학생 진도 추적
- 문제별 통계 (정답률, 평균 시간)
- 사용자별 학습 기록

## 🛠 기술 스택

### Frontend
- **HTML5** + **CSS3**: 반응형 UI
- **JavaScript (ES6+)**: 모듈식 구조
- **Canvas API**: 고성능 시각화

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 연동

## 📦 설치 방법

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 (Moodle DB 사용 시 생략)
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 import
mysql -u root -p moodle < database/schema.sql
```

### 3. 설정 파일 수정

`api/config.php` 파일에서 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 연동 시
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

### 4. 웹 서버 설정

#### Apache
```apache
<VirtualHost *:80>
    ServerName operation-trail.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name operation-trail.local;
    root /path/to/alt42standalone_v1.0;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 웹 브라우저로 접속

```
http://localhost/alt42standalone_v1.0
```

## 🎮 사용 방법

### 1. 문제 불러오기
- **"문제 불러오기"** 버튼 클릭
- Moodle에서 문제를 가져오거나 샘플 문제 로드
- 단축키: `Ctrl + L` (Mac: `Cmd + L`)

### 2. Operation Trail 보기
- **"계산 과정 보기"** 버튼 클릭
- 우측 모바일 화면에서 단계별 애니메이션 확인
- 단축키: `Ctrl + Enter` (Mac: `Cmd + Enter`)

### 3. 초기화
- **"초기화"** 버튼 클릭
- 모든 상태를 리셋하고 새로 시작
- 단축키: `Ctrl + R` (Mac: `Cmd + R`)

## 📱 모바일 시뮬레이터

우측 하단의 가상 스마트폰 화면에서 다음을 확인할 수 있습니다:

- ✅ 계산 단계별 표시
- ✅ 불꽃 파티클 효과
- ✅ 연결선 애니메이션
- ✅ 최종 답 강조 표시

## 🔧 Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. **Enable web services** 체크
3. **Protocols** → **REST protocol** 활성화

### 2. 외부 서비스 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. **추가** 클릭
3. 다음 함수들을 추가:
   - `core_webservice_get_site_info`
   - `mod_quiz_get_attempt_data`
   - `mod_quiz_process_attempt`

### 3. 토큰 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
2. 사용자 선택 후 토큰 생성
3. 생성된 토큰을 `api/config.php`에 입력

## 🗂 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html                  # 메인 HTML
├── assets/
│   ├── css/
│   │   ├── style.css          # 기본 스타일
│   │   └── operation-trail.css # Operation Trail 스타일
│   └── js/
│       ├── config.js          # 설정
│       ├── moodle-connector.js # Moodle 연동
│       ├── operation-trail.js  # 시각화 엔진
│       └── app.js             # 메인 앱 로직
├── api/
│   ├── config.php             # PHP 설정
│   ├── database.php           # DB 연결
│   └── moodle-connector.php   # Moodle API
├── database/
│   └── schema.sql             # DB 스키마
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🎨 커스터마이징

### 애니메이션 속도 조정

`assets/js/config.js`:

```javascript
operationTrail: {
    animationSpeed: 1000,    // 전체 속도 (ms)
    sparkCount: 20,          // 불꽃 개수
    sparkDuration: 1000,     // 불꽃 지속 시간
}
```

### 색상 테마 변경

`assets/css/style.css`:

```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **operation_trail_problems**: 문제 데이터
- **operation_trail_submissions**: 답안 제출 기록
- **operation_trail_progress**: 학습 진도

### 샘플 데이터

8개의 샘플 문제가 자동으로 생성됩니다:
- 난이도: Easy, Medium, Hard
- 연산 종류: 사칙연산, 괄호 계산, 다단계 계산

## 🐛 문제 해결

### Moodle 연결 실패
- Web Services가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- 방화벽/CORS 설정 확인

### 데이터베이스 연결 오류
- MySQL 서비스가 실행 중인지 확인
- `api/config.php`의 연결 정보 확인
- 데이터베이스 사용자 권한 확인

### 애니메이션이 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API 지원 브라우저 사용
- `CONFIG.debug = true`로 설정하여 로그 확인

## 🚀 향후 계획

- [ ] 더 다양한 문제 유형 지원
- [ ] 실시간 협업 학습 기능
- [ ] 모바일 네이티브 앱 개발
- [ ] AI 기반 문제 추천
- [ ] 게임화 요소 추가

## 📄 라이선스

MIT License

## 👥 기여

Pull Request와 Issue는 언제나 환영합니다!

## 📞 문의

문제가 있거나 제안사항이 있으시면 Issue를 등록해주세요.

---

**Made with ❤️ for Better Math Education**
