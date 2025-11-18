# ALT42 - AI Learning Tool with Power Charge Animation

독립형 웹 애플리케이션으로 Moodle LMS와 연동하여 문제를 표시하고, 우측 하단 가상 스마트폰 화면에서 숫자 증가 시 에너지 충전 애니메이션을 보여줍니다.

## 주요 기능

### ⚡ Power Charge Animation
- 정답 시 점수 증가와 함께 에너지 충전 애니메이션 실행
- 파티클 효과와 화면 플래시 효과
- 사운드 효과 (Web Audio API)
- Canvas 기반 실시간 애니메이션

### 📱 가상 스마트폰 UI
- 우측 하단에 고정된 스마트폰 화면
- 실시간 점수, 레벨, 연속 정답 표시
- 최근 활동 로그
- 파워 바 (진행도 표시)

### 🔗 Moodle LMS 연동
- Moodle 3.7 호환
- 문제 은행에서 자동으로 문제 가져오기
- 사용자 인증 및 세션 관리
- 점수 동기화

### 🎮 게임화 요소
- 레벨 시스템
- 연속 정답 카운트 (Streak)
- 레벨업 알림
- 활동 기록

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (선택사항)
- **웹서버**: Apache 2.4+ 또는 Nginx
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 방법

### 1. 파일 배포

```bash
# 웹 서버 디렉토리에 파일 복사
cd /var/www/html
git clone <repository-url> alt42

# 또는 파일 직접 복사
cp -r alt42standalone_v1.0 /var/www/html/alt42
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < config/database.sql

# 또는 MySQL 내에서:
source /path/to/alt42/config/database.sql;
```

### 3. 설정 파일 구성

```bash
# 설정 파일 복사
cp config/config.example.php config/config.php

# 설정 파일 편집
nano config/config.php
```

**config.php 수정 항목:**

```php
$config = [
    // 로컬 데이터베이스
    'db_host' => 'localhost',
    'db_name' => 'alt42_app',
    'db_user' => 'your_db_user',        // 수정 필요
    'db_pass' => 'your_db_password',    // 수정 필요

    // Moodle 데이터베이스
    'moodle_db_host' => 'localhost',
    'moodle_db_name' => 'moodle',
    'moodle_db_user' => 'moodle_user',  // 수정 필요
    'moodle_db_pass' => 'moodle_pass',  // 수정 필요
];

// Moodle 설치 경로
define('MOODLE_PATH', '/var/www/html/moodle');  // 수정 필요
```

### 4. 권한 설정

```bash
# Apache 사용자에게 권한 부여
chown -R www-data:www-data /var/www/html/alt42

# 로그 디렉토리 생성
mkdir logs
chmod 755 logs
```

### 5. 웹 서버 설정

**Apache (.htaccess):**

`.htaccess` 파일이 이미 포함되어 있습니다.

**Nginx:**

```nginx
location /alt42 {
    try_files $uri $uri/ /alt42/index.html;

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## 사용 방법

### 기본 사용

1. 브라우저에서 `http://your-domain/alt42` 접속
2. Moodle 계정으로 로그인 (또는 데모 모드로 자동 진입)
3. 표시되는 문제를 풀기
4. 정답 제출 시 우측 하단 스마트폰에서 Power Charge 애니메이션 확인

### Power Charge 애니메이션

**트리거 조건:**
- 정답을 맞췄을 때
- 점수가 증가할 때
- 획득 포인트에 비례하여 애니메이션 강도 조절

**애니메이션 효과:**
- ⚡ 파티클 폭발 효과
- 📊 파워 바 증가
- 🔊 사운드 효과
- ✨ 화면 플래시

### 레벨 시스템

- **레벨업 조건**: 현재 레벨 × 100 점수 달성
  - 레벨 1 → 2: 100점
  - 레벨 2 → 3: 200점
  - 레벨 3 → 4: 300점

### 연속 정답 (Streak)

- 정답을 연속으로 맞추면 Streak 증가
- 오답 시 Streak 초기화
- 높은 Streak 유지 시 보너스 효과 (향후 추가 예정)

## Moodle 연동 설정

### Moodle 문제 은행 설정

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 문제 > 문제 은행 > 카테고리**로 이동
3. "fraction" 또는 "math" 이름의 카테고리 생성
4. 단답형(shortanswer) 문제 추가

### 문제 형식

```
질문: 1/2 + 1/4 = ?
답변: 3/4
배점: 1.0 (10점으로 환산)
```

### 세션 공유 (선택사항)

Moodle과 세션을 공유하려면:

1. 같은 도메인에 설치
2. `php.ini`에서 `session.cookie_domain` 설정
3. 두 애플리케이션 모두 같은 설정 사용

## 개발 모드

개발 중에는 Moodle 없이 테스트 가능:

```php
// config/config.php
define('DEV_MODE', true);
```

**개발 모드 기능:**
- Mock 데이터 사용
- 에러 메시지 표시
- 콘솔 로깅
- 자동 문제 생성

## 문제 해결

### 데이터베이스 연결 실패

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 사용자 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON alt42_app.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
```

### Moodle 연동 안 됨

1. `config/config.php`에서 `MOODLE_PATH` 확인
2. Moodle 데이터베이스 접속 정보 확인
3. 개발 모드로 전환하여 독립 실행 테스트

### 애니메이션이 보이지 않음

1. 브라우저 콘솔 확인 (F12)
2. JavaScript 오류 확인
3. Canvas 지원 브라우저인지 확인

### 권한 오류

```bash
# 로그 디렉토리 권한
sudo chmod 755 logs

# PHP 파일 권한
sudo chmod 644 *.php
sudo chmod 755 api/*.php
```

## 파일 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 페이지
├── css/
│   ├── main.css           # 메인 스타일
│   └── smartphone.css     # 스마트폰 UI 스타일
├── js/
│   ├── app.js             # 메인 애플리케이션 로직
│   ├── powerCharge.js     # 애니메이션 시스템
│   └── moodleAPI.js       # Moodle API 클라이언트
├── api/
│   └── moodle-bridge.php  # PHP API 브리지
├── config/
│   ├── config.php         # 설정 파일
│   ├── config.example.php # 설정 예제
│   └── database.sql       # 데이터베이스 스키마
├── assets/
│   └── images/            # 이미지 파일
├── logs/                  # 로그 파일 (자동 생성)
└── README.md             # 이 파일
```

## API 엔드포인트

### POST /api/moodle-bridge.php

**액션 목록:**

- `init` - 세션 초기화
- `getUserInfo` - 사용자 정보 조회
- `getNextProblem` - 다음 문제 가져오기
- `submitAnswer` - 답안 제출
- `getScoreHistory` - 점수 기록 조회
- `updateProgress` - 진행도 업데이트

**요청 예시:**

```javascript
const formData = new FormData();
formData.append('action', 'getNextProblem');
formData.append('userId', 'user123');

fetch('./api/moodle-bridge.php', {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

## 커스터마이징

### 애니메이션 설정

`js/powerCharge.js`에서 수정:

```javascript
// 파티클 개수
this.particleCount = 30;  // 기본값

// 애니메이션 지속 시간
const duration = 600;  // 밀리초
```

### 점수 계산

`api/moodle-bridge.php`에서 수정:

```php
private function calculatePoints($problemId) {
    // 커스텀 점수 계산 로직
    return 10;
}
```

### 색상 테마

`css/main.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #2196F3;
    --secondary-color: #FF9800;
    /* ... */
}
```

## 보안 고려사항

1. **프로덕션 환경:**
   - `DEV_MODE`를 `false`로 설정
   - 에러 표시 비활성화
   - HTTPS 사용

2. **데이터베이스:**
   - 강력한 비밀번호 사용
   - 최소 권한 원칙 적용
   - 정기적 백업

3. **세션:**
   - `httponly` 쿠키 사용
   - 세션 타임아웃 설정
   - CSRF 토큰 (향후 추가 예정)

## 라이선스

MIT License

## 기여

버그 리포트 및 기능 제안은 이슈로 등록해 주세요.

## 지원

문의사항: support@example.com

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
