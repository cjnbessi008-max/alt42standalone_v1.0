# Heavy Term - 수학 항 중력 학습 앱

**Heavy Term**은 Moodle LMS와 연동하여 수학 문제를 가상 스마트폰 화면에 표시하고, 항이 커질수록 강한 중력 효과를 적용하는 인터랙티브 학습 애플리케이션입니다.

## 주요 기능

### 🎯 핵심 기능
- **LMS 연동**: Moodle 3.7과 완벽히 통합되어 문제 정보를 자동으로 가져옵니다
- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰과 같은 인터페이스 제공
- **중력 물리 엔진**: 항이 클수록 강한 중력을 받는 "Heavy Term" 효과
- **실시간 상호작용**: 드래그 앤 드롭으로 항을 이동하고 물리 법칙을 체험
- **충돌 감지**: 항들 간의 충돌과 반발력 시뮬레이션

### 📱 Heavy Term 효과
- **크기별 중력**: 항의 크기(1-10)에 따라 중력 강도가 증가
- **질량 시뮬레이션**: 큰 항일수록 더 무겁고 다른 항들을 끌어당김
- **뉴턴 역학**: 실제 물리 법칙(F = G × m₁ × m₂ / r²)을 기반으로 구현
- **시각적 피드백**: 크기에 따른 색상, 폰트 크기, 애니메이션 효과

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5**: Canvas API를 활용한 물리 시뮬레이션
- **CSS3**: 반응형 디자인과 애니메이션
- **Vanilla JavaScript**: ES6+ 기반 모듈화된 코드

### 아키텍처
- **RESTful API**: JSON 기반 API 엔드포인트
- **MVC 패턴**: 관심사의 분리와 유지보수성
- **실시간 물리 엔진**: RequestAnimationFrame 기반 60 FPS

## 설치 방법

### 1. 필수 요구사항
```bash
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 (선택사항)
- 웹 서버 (Apache/Nginx)
```

### 2. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스와 사용자 생성
CREATE DATABASE heavy_term CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'heavy_term_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON heavy_term.* TO 'heavy_term_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 생성
mysql -u heavy_term_user -p heavy_term < database/schema.sql
```

### 3. 애플리케이션 설정
```bash
# 설정 파일 복사
cp config/config.sample.php config/config.php

# config.php 편집하여 데이터베이스 정보 입력
nano config/config.php
```

### 4. 파일 권한 설정
```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs

# 파일 권한 설정
chmod 644 *.php
chmod 755 api/
```

### 5. 웹 서버 설정

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteBase /heavy-term/

# API 라우팅
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/api.php [L,QSA]
```

#### Nginx
```nginx
location /heavy-term/ {
    try_files $uri $uri/ /heavy-term/index.html;
}

location /heavy-term/api/ {
    rewrite ^/heavy-term/api/(.*)$ /heavy-term/api/api.php last;
}
```

## 사용 방법

### 1. 기본 사용
1. 웹 브라우저에서 `http://your-domain/heavy-term/` 접속
2. 좌측 패널에서 "데모 문제 로드" 클릭
3. 우측 가상 스마트폰 화면에서 항들을 드래그하여 중력 효과 체험

### 2. Moodle 연동
```php
// Moodle에서 사용하는 경우
require_once('path/to/heavy-term/moodle-integration/moodle_connector.php');

// Connector 초기화
$config = new stdClass();
$config->heavy_term_db_host = 'localhost';
$config->heavy_term_db_name = 'heavy_term';
$config->heavy_term_db_user = 'heavy_term_user';
$config->heavy_term_db_password = 'your_password';

$connector = new HeavyTermMoodleConnector($DB, $config);

// 문제 동기화
$problem_id = $connector->sync_question_to_heavy_term(
    $question_id,  // Moodle question ID
    $course_id,    // Moodle course ID
    $quiz_id       // Moodle quiz ID (optional)
);

// 세션 생성
$session_id = $connector->create_user_session(
    $user_id,      // Moodle user ID
    $problem_id,   // Heavy Term problem ID
    'smartphone'   // Device type
);
```

### 3. API 사용

#### 문제 조회
```javascript
// GET /api/problems/{id}
fetch('/heavy-term/api/api.php/problems/1')
    .then(response => response.json())
    .then(data => console.log(data));
```

#### 세션 생성
```javascript
// POST /api/sessions
fetch('/heavy-term/api/api.php/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        moodle_user_id: 123,
        problem_id: 1,
        device_type: 'smartphone'
    })
})
.then(response => response.json())
.then(data => console.log('Session ID:', data.session_id));
```

#### 상호작용 기록
```javascript
// POST /api/interactions
fetch('/heavy-term/api/api.php/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        session_id: 1,
        term_id: 5,
        interaction_type: 'drag',
        position_x: 150,
        position_y: 200
    })
});
```

## 물리 엔진 설정

### 중력 파라미터
```javascript
// 기본 중력 강도 (픽셀/초²)
gravity_strength: 9.8

// 크기별 중력 배수 (클수록 Heavy Term 효과 강함)
gravity_multiplier: 2.0

// 충돌 감쇠 (0-1, 작을수록 에너지 손실 큼)
bounce_damping: 0.7

// 마찰 계수 (0-1, 작을수록 마찰 큼)
friction_coefficient: 0.98

// 최대 속도 (픽셀/초)
max_velocity: 500
```

### 실시간 조정
좌측 패널의 "중력 설정"에서 실시간으로 물리 파라미터를 조정할 수 있습니다.

## 프로젝트 구조

```
heavy-term/
├── index.html              # 메인 HTML 파일
├── README.md               # 프로젝트 문서
│
├── api/
│   └── api.php            # RESTful API 엔드포인트
│
├── assets/
│   ├── css/
│   │   └── styles.css     # 스타일시트
│   └── js/
│       ├── config.js      # 설정 파일
│       ├── physics.js     # 물리 엔진
│       ├── term.js        # Term 클래스
│       ├── api.js         # API 클라이언트
│       └── app.js         # 메인 애플리케이션
│
├── config/
│   ├── config.php         # PHP 설정 (gitignore)
│   └── config.sample.php  # 설정 샘플
│
├── database/
│   └── schema.sql         # 데이터베이스 스키마
│
├── lib/
│   └── db.php             # 데이터베이스 연결 라이브러리
│
├── moodle-integration/
│   └── moodle_connector.php  # Moodle 연동 클래스
│
└── logs/                  # 로그 디렉토리 (gitignore)
```

## API 엔드포인트

### 문제 (Problems)
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/{id}` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성

### 세션 (Sessions)
- `GET /api/sessions/{id}` - 세션 조회
- `POST /api/sessions` - 세션 생성
- `PUT /api/sessions/{id}` - 세션 종료

### 상호작용 (Interactions)
- `POST /api/interactions` - 상호작용 기록

### 설정 (Settings)
- `GET /api/settings` - 물리 설정 조회

### 동기화 (Sync)
- `POST /api/sync` - Moodle 문제 동기화

## 데이터베이스 스키마

### 주요 테이블
- `heavy_term_problems`: 문제 정보
- `heavy_term_terms`: 수학 항 정보
- `heavy_term_user_sessions`: 사용자 세션
- `heavy_term_interactions`: 상호작용 로그
- `heavy_term_answers`: 제출된 답안
- `heavy_term_settings`: 물리 설정

자세한 스키마는 `database/schema.sql` 참조

## 개발 가이드

### 새로운 항 유형 추가
```javascript
// term.js의 calculateTermSize() 수정
static calculateTermSize(text) {
    let size = 1;

    // 새로운 패턴 추가
    if (text.includes('새로운패턴')) {
        size += 3;
    }

    return Math.min(10, Math.max(1, size));
}
```

### 물리 효과 커스터마이징
```javascript
// physics.js의 applyDownwardGravity() 수정
applyDownwardGravity(term, deltaTime) {
    const baseGravity = this.gravity;

    // 커스텀 중력 계산
    const customMultiplier = Math.pow(term.size, 1.5);
    const effectiveGravity = baseGravity * customMultiplier;

    term.vy += effectiveGravity * deltaTime;
}
```

## 문제 해결

### 문제: 데이터베이스 연결 실패
```bash
# config.php의 데이터베이스 정보 확인
# MySQL 서비스 상태 확인
systemctl status mysql

# 권한 확인
SHOW GRANTS FOR 'heavy_term_user'@'localhost';
```

### 문제: 물리 효과가 작동하지 않음
```javascript
// 브라우저 콘솔에서 확인
console.log(window.heavyTermApp.physicsEngine.running);

// 물리 엔진 재시작
window.heavyTermApp.physicsEngine.start();
```

### 문제: Moodle 연동 오류
```php
// Moodle 경로 확인
define('MOODLE_ROOT_PATH', '/correct/path/to/moodle');

// Moodle DB 접근 권한 확인
```

## 성능 최적화

### 권장 사항
- **항 개수**: 화면당 10-15개 이하 권장
- **물리 업데이트**: 60 FPS 유지 목표
- **충돌 감지**: 항이 20개 이상일 경우 공간 분할 알고리즘 고려
- **캐싱**: API 응답에 대한 브라우저 캐싱 활용

## 브라우저 호환성

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ⚠️ IE11 (제한적 지원)

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 연락처

프로젝트 관련 문의: [contact information]

## 변경 이력

### v1.0.0 (2024)
- 초기 릴리스
- Moodle 3.7 연동
- Heavy Term 물리 엔진 구현
- 가상 스마트폰 UI
- RESTful API
- 실시간 상호작용 추적

## 향후 계획

- [ ] 다중 사용자 동시 접속 지원
- [ ] 문제 해결 자동 검증
- [ ] 증강현실(AR) 모드
- [ ] 모바일 네이티브 앱
- [ ] 게임화 요소 추가
- [ ] 학습 분석 대시보드
- [ ] 다국어 지원 (영어, 일본어)

---

**Heavy Term** - 수학을 중력으로 체험하다 🚀
