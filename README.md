# Pattern Loop Animation System

주기함수의 반복이 패턴 애니메이션으로 보이는 Moodle 연동 학습 시스템

## 개요

Pattern Loop는 Moodle LMS와 연동하여 수학 문제(특히 주기함수 관련 문제)에 시각적 애니메이션을 제공하는 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에 애니메이션이 표시되어 학습자가 주기함수의 동작을 직관적으로 이해할 수 있습니다.

## 주요 기능

### 1. 주기함수 애니메이션
- **지원 함수**: Sine, Cosine, Tangent, Square Wave, Sawtooth, Triangle Wave
- **실시간 애니메이션**: Canvas API를 활용한 부드러운 60 FPS 애니메이션
- **다중 패턴**: 최대 5개의 주기함수를 동시에 시각화
- **리사주 곡선**: 2개의 패턴 선택 시 자동으로 리사주 패턴 생성

### 2. Moodle 연동
- Moodle 3.7+ 호환
- 퀴즈 및 문제 정보 자동 동기화
- 문제 유형별 맞춤형 패턴 자동 설정
- MySQL 5.7 직접 연결 또는 REST API 지원

### 3. 가상 스마트폰 화면
- 우측 하단 고정 위치 표시
- 360x640 해상도 (스마트폰 표준)
- 실제 스마트폰 형태의 UI
- 반응형 디자인 지원

### 4. 인터랙티브 컨트롤
- 재생/일시정지/리셋 기능
- 그리드 표시 토글
- 패턴 선택 및 조합
- 실시간 상태 표시

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: Canvas API
- **LMS**: Moodle 3.7

## 설치 방법

### 1. 시스템 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 이상 (연동 시)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 임포트
mysql -u root -p < database/schema.sql
```

### 3. 설정 파일 수정

`app/config/config.php` 파일을 열어 데이터베이스 및 Moodle 연동 정보를 수정합니다:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'pattern_loop_db');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 연동 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 4. 웹 서버 설정

#### Apache
```apache
<VirtualHost *:80>
    DocumentRoot "/path/to/alt42standalone_v1.0/public"
    ServerName pattern-loop.local

    <Directory "/path/to/alt42standalone_v1.0/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name pattern-loop.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.php;

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

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 쓰기 권한 부여
chmod -R 755 /path/to/alt42standalone_v1.0
chown -R www-data:www-data /path/to/alt42standalone_v1.0
```

## 사용 방법

### 1. 기본 사용

1. 웹 브라우저에서 `http://your-domain/` 접속
2. 좌측 패널에서 원하는 패턴 선택 (클릭하여 활성화/비활성화)
3. "재생" 버튼 클릭
4. 우측 하단 가상 스마트폰 화면에서 애니메이션 확인

### 2. Moodle 연동

1. 좌측 패널 하단의 "Moodle 연동" 섹션에서 퀴즈 ID 입력
2. "동기화" 버튼 클릭
3. 동기화된 문제에 자동으로 패턴이 연결됨

### 3. 프로그래밍 방식 사용

#### 패턴 추가
```javascript
const engine = new PatternLoopEngine('canvasId', {
    width: 360,
    height: 640,
    fps: 60,
    showGrid: true
});

engine.addPattern({
    name: 'Custom Sine',
    function_type: 'sine',
    amplitude: 1.5,
    frequency: 2.0,
    phase: 0,
    color: '#ff6b6b',
    animation_speed: 1.0
});

engine.play();
```

#### API 호출
```javascript
// 패턴 목록 가져오기
fetch('/api.php?action=get_patterns')
    .then(response => response.json())
    .then(data => console.log(data));

// 퀴즈 동기화
fetch('/api.php?action=sync_quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: 123 })
})
    .then(response => response.json())
    .then(data => console.log(data));
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── app/
│   ├── config/
│   │   └── config.php              # 설정 파일
│   ├── models/
│   │   ├── MoodleIntegration.php   # Moodle 연동 모델
│   │   └── PatternLoop.php         # 패턴 관리 모델
│   ├── controllers/
│   │   └── ApiController.php       # API 컨트롤러
│   └── views/                       # 뷰 템플릿 (필요시 추가)
├── public/
│   ├── index.php                   # 메인 페이지
│   ├── api.php                     # API 엔드포인트
│   ├── js/
│   │   ├── pattern-loop.js         # 애니메이션 엔진
│   │   └── app.js                  # 앱 로직
│   └── css/
│       └── smartphone.css          # 스타일시트
├── database/
│   └── schema.sql                  # 데이터베이스 스키마
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## API 엔드포인트

### GET `/api.php?action=get_patterns`
모든 활성 패턴 목록 조회

### GET `/api.php?action=get_question&id={id}`
특정 문제 정보 조회

### POST `/api.php?action=sync_quiz`
Moodle 퀴즈 동기화
```json
{
    "quiz_id": 123
}
```

### GET `/api.php?action=get_question_patterns&question_id={id}`
문제에 연결된 패턴 목록 조회

### POST `/api.php?action=create_pattern`
새 패턴 생성
```json
{
    "name": "Custom Pattern",
    "function_type": "sine",
    "amplitude": 1.0,
    "frequency": 1.0,
    "phase": 0.0,
    "color": "#3498db",
    "animation_speed": 1.0
}
```

## 패턴 함수 타입

| 타입 | 설명 | 수식 |
|------|------|------|
| `sine` | 사인파 | y = A·sin(ωt + φ) |
| `cosine` | 코사인파 | y = A·cos(ωt + φ) |
| `tangent` | 탄젠트 | y = A·tan(ωt + φ) |
| `square` | 구형파 | y = A·sgn(sin(ωt + φ)) |
| `sawtooth` | 톱니파 | y = A·(2(t/T - ⌊t/T + ½⌋)) |
| `triangle` | 삼각파 | y = A·\|2(t/T - ⌊t/T + ½⌋)\| - 1 |

## 데이터베이스 스키마

### `moodle_questions`
Moodle에서 가져온 문제 정보

### `pattern_loops`
주기함수 패턴 정의

### `question_pattern_mapping`
문제와 패턴 연결

### `user_progress`
사용자 학습 진행 상황

## 라이센스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 지원

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.
