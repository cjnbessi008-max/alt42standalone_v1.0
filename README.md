# Similarity Detector (닮음 힌트 자동 추출 시스템)

LMS(Moodle 3.7)와 연동하여 수학 문제에서 닮음 힌트를 자동으로 추출하고, 가상 스마트폰 화면에 표시하는 웹 애플리케이션입니다.

## 📋 개요

- **목적**: 수학 문제에서 도형의 닮음 관련 힌트를 자동으로 분석하고 제공
- **대상**: 중학교 기하학 문제 (특히 닮음, 비율, 합동 관련)
- **연동**: Moodle 3.7 LMS
- **인터페이스**: 가상 스마트폰 화면 (우측 하단)

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5/CSS3**
- **Vanilla JavaScript**
- **Responsive Design**

### Database
- **MySQL 5.7**
- **InnoDB Engine**
- **JSON Support**

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   ├── database.php          # 데이터베이스 설정
│   └── moodle.php            # Moodle 연동 설정
├── src/
│   ├── api/
│   │   └── index.php         # REST API 엔드포인트
│   ├── database/
│   │   ├── schema.sql        # 데이터베이스 스키마
│   │   └── seed.sql          # 샘플 데이터
│   ├── detector/
│   │   └── SimilarityDetector.php  # 닮음 검출 알고리즘
│   ├── moodle/
│   │   └── MoodleConnector.php     # Moodle 연동 모듈
│   └── mobile/
│       ├── index.html        # 모바일 UI
│       ├── styles.css        # 스타일시트
│       └── app.js            # JavaScript 로직
├── docs/
│   └── API.md               # API 문서
├── tests/
│   └── test_detector.php    # 테스트 코드
├── .htaccess                # Apache 설정
├── .env.example             # 환경 변수 예제
└── README.md                # 프로젝트 문서
```

## 🚀 설치 및 설정

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 이상 (mod_rewrite 필요)
- Moodle 3.7 설치 및 실행 중

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE similarity_detector CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'similarity_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON similarity_detector.* TO 'similarity_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 생성
mysql -u similarity_user -p similarity_detector < src/database/schema.sql

# 샘플 데이터 입력 (선택사항)
mysql -u similarity_user -p similarity_detector < src/database/seed.sql
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

`.env` 파일 예시:
```ini
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=similarity_detector
DB_USER=similarity_user
DB_PASS=your_password

# Moodle Database Configuration
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle
MOODLE_DB_PASS=moodle_password
MOODLE_DB_PREFIX=mdl_

# Moodle Web Service
MOODLE_URL=http://localhost/moodle
MOODLE_WS_TOKEN=your_webservice_token
```

### 4. Apache 설정

Apache의 `mod_rewrite`가 활성화되어 있는지 확인:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 5. 실행

웹 브라우저에서 다음 URL로 접속:

```
http://localhost/mobile
```

## 📱 사용 방법

### 1. 모바일 앱 접속

가상 스마트폰 화면이 우측 하단에 표시됩니다.

### 2. 문제 불러오기

URL 파라미터로 문제 ID를 전달:
```
http://localhost/mobile?problem_id=1001
```

### 3. 힌트 자동 탐지

"힌트 찾기" 버튼을 클릭하면 자동으로 닮음 힌트를 탐지합니다.

### 4. 힌트 확인

탐지된 힌트가 카드 형태로 표시되며, 각 힌트는:
- **유형**: 비율, 각도, 비례, 변환, 도형
- **신뢰도**: 0-100% 점수
- **설명**: 한국어로 된 자세한 힌트

## 🔍 주요 기능

### 1. 닮음 자동 탐지

문제 텍스트에서 다음을 자동으로 추출:
- 삼각형, 사각형, 원 등의 도형
- 변의 길이 정보
- 비율 정보
- 각도 정보

### 2. 힌트 생성

탐지된 도형 정보를 바탕으로:
- **비율 힌트**: 대응하는 변의 길이 비
- **각도 힌트**: 직각삼각형 판단, 피타고라스 정리
- **비례 힌트**: 대응하는 변의 비가 같은지 확인
- **변환 힌트**: 확대, 축소, 회전 등의 변환 가능성
- **도형 힌트**: 특정 도형의 닮음 특성 (예: 모든 원은 닮음)

### 3. 신뢰도 평가

각 힌트에 대해 신뢰도 점수 (0-1) 계산:
- 간단한 비율 (1:2, 2:3 등): 높은 신뢰도
- 복잡한 비율: 중간 신뢰도
- 직각삼각형 검증: 피타고라스 정리 기반

### 4. Moodle 연동

- Moodle 데이터베이스에서 문제 정보 읽기
- 문제 검색 기능
- 카테고리별 문제 조회
- 사용자 정보 조회

## 🔌 API 엔드포인트

### Health Check
```http
GET /api/health
```

### 문제 조회
```http
GET /api/problems/{problem_id}
GET /api/problems?type=multichoice&limit=20
```

### 힌트 조회
```http
GET /api/hints/{problem_id}
```

### 힌트 탐지
```http
POST /api/detect
Content-Type: application/json

{
  "problem_id": 1001
}
```

### 문제 검색
```http
GET /api/search?q=삼각형&limit=50
```

자세한 API 문서는 [docs/API.md](docs/API.md)를 참조하세요.

## 🧪 테스트

```bash
# 탐지 알고리즘 테스트
php tests/test_detector.php
```

## 📊 지원하는 문제 유형

### 1. 삼각형 닮음
```
두 삼각형 ABC와 DEF에서 AB=6cm, BC=8cm, AC=10cm이고,
DE=3cm, EF=4cm, DF=5cm일 때, 두 삼각형이 닮았는지 판단하시오.
```

### 2. 사각형 닮음
```
직사각형 ABCD와 직사각형 EFGH에서 AB:EF = BC:FG = 2:3일 때,
두 직사각형의 닮음비를 구하시오.
```

### 3. 원의 닮음
```
반지름이 각각 4cm, 6cm인 두 원이 있다.
이 두 원이 닮았는지 판단하고, 닮음비를 구하시오.
```

### 4. 비율 문제
```
삼각형 ABC에서 DE∥BC이고, AD:DB = 2:3일 때,
AE:EC의 비를 구하시오.
```

## 🎨 UI 특징

### 가상 스마트폰
- **위치**: 우측 하단 고정
- **크기**: 375 x 667px (iPhone 8 기준)
- **디자인**: 현대적인 모바일 UI
- **반응형**: 모바일 및 데스크톱 지원

### 색상 테마
- **Primary**: #4A90E2 (파란색)
- **Secondary**: #50C878 (초록색)
- **Accent**: #FF6B6B (빨간색)
- **Background**: #F5F7FA (연한 회색)

### 힌트 카드
- 유형별 색상 구분
- 애니메이션 효과
- 신뢰도 시각화
- 읽기 쉬운 레이아웃

## 🔐 보안

- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (Output Encoding)
- CORS 설정
- 민감한 파일 접근 차단
- 환경 변수 관리

## 🐛 문제 해결

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -h localhost -u similarity_user -p
```

### Moodle 연동 실패
- Moodle 데이터베이스 설정 확인
- 테이블 prefix 확인 (기본값: mdl_)
- 데이터베이스 권한 확인

### Apache Rewrite 오류
```bash
# mod_rewrite 활성화
sudo a2enmod rewrite

# .htaccess 허용 확인 (httpd.conf 또는 sites-available/*.conf)
AllowOverride All
```

## 📝 라이센스

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 👥 기여

문제 제보 및 기여는 환영합니다!

## 📞 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.

---

**KAIST Touch Math Academy** - AI Education System Pipeline
