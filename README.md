# Root Glow - 근 찾기 학습 시스템

**LMS 연동 수학 학습 웹 애플리케이션**

Root Glow는 Moodle LMS와 연동하여 수학 함수의 근을 시각적으로 찾고 학습할 수 있는 웹 애플리케이션입니다. 근을 찾을 때 해당 위치가 은은하게 빛나는 "Root Glow" 효과를 제공하여 학습 경험을 향상시킵니다.

## 주요 기능

### 🎯 핵심 기능
- **Root Glow 효과**: 근 위치에서 은은하게 빛나는 시각적 효과
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 화면 시뮬레이션
- **실시간 그래프 렌더링**: Canvas 기반 고성능 그래프 렌더링
- **다중 근 찾기 알고리즘**: Newton-Raphson법과 이분법 하이브리드 방식

### 📚 LMS 연동
- Moodle 3.7 LMS 연동 지원
- 문제 정보 자동 로드
- 답안 제출 및 평가
- 학습 진행 상황 추적

### 🎨 시각화 기능
- 조정 가능한 Glow 강도 (1-10단계)
- 커스텀 Glow 색상 설정
- 실시간 애니메이션
- 반응형 디자인 (데스크톱, 태블릿, 모바일)

## 기술 스택

### Frontend
- HTML5 / CSS3 / JavaScript (ES6+)
- Canvas API
- 반응형 디자인

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

## 설치 방법

### 1. 시스템 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- (선택) Moodle 3.7 LMS

### 2. 프로젝트 복제
```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 3. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 로드
mysql -u root -p < database/schema.sql
```

### 4. 설정 파일 구성
```bash
# 환경 설정 파일 생성
cp config/.env.example config/.env

# .env 파일 편집
nano config/.env
```

`.env` 파일에서 다음 항목 수정:
```env
DB_HOST=localhost
DB_NAME=root_glow_db
DB_USER=root
DB_PASS=your_password

MOODLE_ENABLED=true  # Moodle 사용 시
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_token
```

### 5. 웹 서버 설정

#### Apache
DocumentRoot를 프로젝트 디렉토리로 설정:
```apache
<VirtualHost *:80>
    DocumentRoot "/path/to/alt42standalone_v1.0"
    ServerName rootglow.local

    <Directory "/path/to/alt42standalone_v1.0">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name rootglow.local;
    root /path/to/alt42standalone_v1.0;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 6. 권한 설정
```bash
chmod -R 755 src/
chmod -R 755 config/
mkdir logs
chmod -R 777 logs/
```

## 사용 방법

### 기본 사용
1. 웹 브라우저에서 `http://localhost/` 또는 설정한 URL 접속
2. 함수 입력란에 수식 입력 (예: `x^2 - 4`)
3. "근 찾기" 버튼 클릭 또는 `Ctrl+Enter`
4. 그래프와 Root Glow 효과 확인
5. 우측 하단 가상 스마트폰 화면에서 결과 확인

### 지원하는 함수 형식
```javascript
// 기본 연산
x^2 - 4           // 거듭제곱
2*x + 3           // 곱셈
x / 2             // 나눗셈

// 다항식
x^3 - 6*x^2 + 11*x - 6

// 삼각함수
sin(x)
cos(x)
tan(x)

// 기타 함수
sqrt(x)           // 제곱근
abs(x)            // 절댓값
log(x)            // 로그
exp(x)            // 지수
```

### 키보드 단축키
- `Ctrl + Enter`: 근 찾기 실행
- `Ctrl + S`: 답안 제출 (LMS 연동 시)
- `Ctrl + R`: 새 문제 로드

### Glow 효과 설정
- **Glow 강도**: 슬라이더로 1-10 단계 조정
- **Glow 색상**: 컬러 피커로 원하는 색상 선택
- **Glow 활성화/비활성화**: 체크박스로 온/오프

## 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 페이지
├── config/                 # 설정 파일
│   ├── config.php
│   └── .env.example
├── src/
│   ├── css/               # 스타일시트
│   │   ├── style.css
│   │   ├── smartphone.css
│   │   └── glow-effects.css
│   ├── js/                # JavaScript
│   │   ├── app.js
│   │   ├── math-utils.js
│   │   ├── root-finder.js
│   │   ├── graph-renderer.js
│   │   ├── glow-effects.js
│   │   ├── smartphone-display.js
│   │   └── moodle-integration.js
│   └── php/               # PHP 백엔드
│       ├── api.php
│       ├── database.php
│       └── moodle-connector.php
├── database/              # 데이터베이스
│   └── schema.sql
├── logs/                  # 로그 파일
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## API 엔드포인트

### `POST /src/php/api.php`

#### 초기화
```javascript
{
  "action": "init"
}
```

#### 문제 가져오기
```javascript
{
  "action": "getProblem",
  "problemId": "PROB001"  // 선택적
}
```

#### 답안 제출
```javascript
{
  "action": "submitAnswer",
  "problemId": "PROB001",
  "roots": [
    {"x": -2, "y": 0},
    {"x": 2, "y": 0}
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Moodle 연동 설정

### 1. Moodle Web Service 활성화
1. Moodle 관리자로 로그인
2. `사이트 관리 > 플러그인 > 웹 서비스 > 개요`
3. "웹 서비스 활성화" 체크

### 2. 외부 서비스 생성
1. `사이트 관리 > 서버 > 웹 서비스 > 외부 서비스`
2. 새 서비스 생성: "Root Glow Service"
3. 필요한 함수 추가

### 3. 토큰 생성
1. `사이트 관리 > 서버 > 웹 서비스 > 토큰 관리`
2. 새 토큰 생성
3. 생성된 토큰을 `.env` 파일에 입력

## 개발 정보

### 근 찾기 알고리즘

#### 1. 이분법 (Bisection Method)
- 구간 내 부호 변화 감지
- 안정적이고 확실한 수렴
- 초기 근 위치 파악에 사용

#### 2. Newton-Raphson 방법
- 빠른 수렴 속도
- 미분 가능한 함수에 효과적
- 정밀한 근 계산에 사용

#### 3. 하이브리드 접근
- 이분법으로 초기 근 탐색
- Newton 법으로 정밀도 향상
- 중복 근 제거 및 검증

### Root Glow 효과 구현

CSS 애니메이션과 Canvas를 활용한 다층 Glow:
```javascript
// 펄스 애니메이션
const pulse = Math.sin(time * 2) * 0.3 + 0.7;

// 다층 Glow 레이어
for (let i = layers; i > 0; i--) {
    const radius = baseRadius + i * intensity * pulse;
    const alpha = baseAlpha / i;
    // 그리기...
}
```

## 문제 해결

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u root -p -h localhost
```

### PHP 오류
```bash
# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log
# 또는
tail -f logs/php-error.log
```

### Moodle 연결 오류
1. Moodle URL과 토큰 확인
2. Web Service 활성화 상태 확인
3. 방화벽 설정 확인

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

기여를 환영합니다! Pull Request를 제출하거나 이슈를 등록해주세요.

## 연락처

문의사항이 있으시면 이슈를 등록해주세요.

---

**Root Glow** - 수학 학습을 더 빛나게 ✨
