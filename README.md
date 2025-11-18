# Focus Light - 도형 학습 웹앱

도형의 핵심 조건을 밝게 강조하여 학습 효과를 높이는 독립형 웹 애플리케이션입니다.

## 주요 기능

- **가상 스마트폰 화면**: 우측 하단에 고정된 가상 스마트폰에서 앱 실행
- **도형 렌더링**: SVG 기반 고품질 도형 표시
- **Focus Light**: 핵심 조건(각도, 변, 반지름 등)을 밝게 강조
- **다양한 애니메이션**: Glow, Pulse, Flash, Static 효과
- **강도 조절**: 5단계 강도 조절 가능
- **Moodle 연동 대비**: API 기반 설계로 향후 LMS 연동 용이

## 기술 스택

### Backend
- PHP 7.1.9
- MySQL 5.7
- RESTful API

### Frontend
- HTML5 / CSS3
- Vanilla JavaScript (ES6+)
- SVG Graphics

### 특징
- 독립 실행형 (Standalone)
- 반응형 디자인
- 크로스 브라우저 지원

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 2. PHP 설정

`api/config.php` 파일에서 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'focus_light_app');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName focus-light.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /path/to/alt42standalone_v1.0/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name focus-light.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /path/to/alt42standalone_v1.0/api;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 4. 실행

브라우저에서 `http://localhost` 또는 설정한 도메인으로 접속합니다.

## 프로젝트 구조

```
alt42standalone_v1.0/
├── api/                    # Backend API
│   ├── config.php         # 데이터베이스 설정
│   ├── problems.php       # 문제 API
│   ├── shapes.php         # 도형 API
│   └── focus-elements.php # Focus Light 요소 API
├── database/              # 데이터베이스
│   └── schema.sql        # MySQL 스키마
├── public/               # Frontend
│   ├── index.html       # 메인 페이지
│   ├── css/
│   │   ├── main.css           # 메인 스타일
│   │   ├── smartphone.css     # 가상 스마트폰 스타일
│   │   └── focus-light.css    # Focus Light 효과
│   └── js/
│       ├── app.js             # 메인 앱 로직
│       ├── shape-renderer.js  # 도형 렌더러
│       └── focus-light.js     # Focus Light 모듈
├── docs/                 # 문서
└── README.md            # 이 파일
```

## API 문서

### 문제 API

#### 문제 목록 조회
```
GET /api/problems.php
Query Parameters:
  - subject: 과목 (예: geometry)
  - grade: 학년 (예: 3학년)
  - difficulty: 난이도 (easy, medium, hard)
```

#### 특정 문제 조회
```
GET /api/problems.php?id={problem_id}
```

#### 새 문제 생성
```
POST /api/problems.php
Body: {
  "title": "문제 제목",
  "description": "문제 설명",
  "subject": "geometry",
  "grade_level": "3학년",
  "difficulty": "medium"
}
```

### 도형 API

#### 도형 조회
```
GET /api/shapes.php?problem_id={problem_id}
```

#### 도형 생성
```
POST /api/shapes.php
Body: {
  "problem_id": 1,
  "shape_type": "triangle",
  "svg_data": "M 50,200 L 200,200 L 200,50 Z",
  "properties": {
    "width": 150,
    "height": 150
  }
}
```

### Focus Elements API

#### Focus 요소 조회
```
GET /api/focus-elements.php?shape_id={shape_id}
```

#### Focus 요소 생성
```
POST /api/focus-elements.php
Body: {
  "shape_id": 1,
  "element_type": "side",
  "element_selector": ".hypotenuse",
  "label": "빗변",
  "highlight_color": "#FFD700",
  "glow_intensity": 4,
  "animation_type": "glow"
}
```

## 사용 방법

### 1. 문제 선택
좌측 패널에서 학습할 문제를 클릭합니다.

### 2. Focus Light 설정
- **강도 조절**: 슬라이더로 1-5단계 조절
- **애니메이션 선택**: Glow, Pulse, Flash, Static 중 선택
- **ON/OFF**: 버튼으로 Focus Light 활성화/비활성화

### 3. 도형 확인
우측 하단 가상 스마트폰 화면에서 강조된 도형을 확인합니다.

### 4. 상호작용
- 강조된 요소에 마우스를 올리면 확대 효과
- 라벨을 통해 각 요소의 의미 확인

## Focus Light 애니메이션

### Glow (부드러운 빛)
부드럽게 빛나는 효과로 지속적인 주목을 유도합니다.

### Pulse (맥박)
맥박처럼 커졌다 작아지는 효과로 리듬감 있게 강조합니다.

### Flash (깜빡임)
깜빡이는 효과로 즉각적인 주의를 끕니다.

### Static (정적)
움직임 없이 일정하게 강조된 상태를 유지합니다.

## 커스터마이징

### 새 도형 타입 추가

1. `database/schema.sql`에 샘플 데이터 추가
2. `public/js/shape-renderer.js`에 렌더링 함수 추가
3. `public/css/focus-light.css`에 스타일 정의

### 새 애니메이션 추가

1. `public/css/focus-light.css`에 keyframe 추가
2. `public/js/focus-light.js`의 `getAnimationClass()` 메서드 업데이트

## Moodle 연동 (향후 계획)

현재는 독립 실행형이지만, 다음과 같은 방법으로 Moodle과 연동할 수 있습니다:

### 방법 1: iframe 임베딩
```html
<iframe src="https://your-server/focus-light/" width="100%" height="800px"></iframe>
```

### 방법 2: LTI (Learning Tools Interoperability)
- LTI 프로바이더 구현 필요
- Moodle External Tool 활동으로 추가

### 방법 3: API 연동
- Moodle에서 문제 데이터를 API로 전송
- Focus Light 앱에서 실시간 렌더링

## 트러블슈팅

### 문제가 표시되지 않음
- 데이터베이스 연결 확인: `api/config.php`
- MySQL 서비스 실행 확인
- 브라우저 콘솔에서 에러 확인

### 도형이 렌더링되지 않음
- SVG 경로 데이터 확인
- 브라우저 개발자 도구에서 SVG 요소 검사

### Focus Light가 작동하지 않음
- CSS 파일 로드 확인
- JavaScript 에러 확인
- 클래스명과 선택자 일치 여부 확인

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해 주세요.

## 연락처

문의사항이 있으시면 프로젝트 관리자에게 연락해 주세요.

## 버전 히스토리

### v1.0.0 (2025-11-18)
- 초기 릴리스
- Focus Light 기능 구현
- 가상 스마트폰 UI
- 삼각형, 사각형, 원 지원
- 4가지 애니메이션 효과
