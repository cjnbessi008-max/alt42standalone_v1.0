# Transform Scene - 함수 변환 시각화 학습 시스템

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-orange.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

수학 함수의 변환(이동, 대칭, 확대/축소)을 애니메이션으로 시각화하는 교육용 웹 애플리케이션

[기능 소개](#주요-기능) • [설치 방법](#설치-방법) • [사용 방법](#사용-방법) • [API 문서](#api-문서)

</div>

---

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [문제 해결](#문제-해결)
- [기여 방법](#기여-방법)
- [라이센스](#라이센스)

---

## 🎯 개요

**Transform Scene**은 Moodle LMS와 연동하여 수학 함수의 변환을 시각적으로 보여주는 교육용 웹 애플리케이션입니다. 학생들이 함수 그래프의 이동, 대칭, 확대/축소를 직관적으로 이해할 수 있도록 애니메이션과 인터랙티브한 UI를 제공합니다.

### 특징

- 📱 **모바일 최적화**: 우측 하단 가상 스마트폰 화면에 최적화된 UI
- 🎨 **애니메이션 시각화**: 함수 변환을 부드러운 애니메이션으로 표현
- 🔗 **Moodle 연동**: LMS와 완벽하게 통합되어 학습 데이터 관리
- 📊 **실시간 피드백**: 학생의 답안에 즉각적인 피드백 제공
- 🌐 **다국어 지원**: 한국어/영어 인터페이스

---

## ✨ 주요 기능

### 1. 함수 변환 시각화

- **평행이동 (Translation)**
  - 수평 이동: f(x) → f(x - h)
  - 수직 이동: f(x) → f(x) + k
  - 복합 이동: f(x) → f(x - h) + k

- **대칭이동 (Reflection)**
  - x축 대칭: f(x) → -f(x)
  - y축 대칭: f(x) → f(-x)
  - 원점 대칭: f(x) → -f(-x)

- **확대/축소 (Scaling)**
  - 수직 확대/축소: f(x) → a·f(x)
  - 수평 확대/축소: f(x) → f(b·x)
  - 복합 변환: f(x) → a·f(b·x - h) + k

### 2. 인터랙티브 학습

- 문제별 단계별 힌트 제공
- 애니메이션 재생/일시정지/리플레이
- 원본 함수와 변환된 함수 동시 표시
- 실시간 그래프 업데이트

### 3. Moodle LMS 연동

- 문제 데이터 자동 로드
- 학생 답안 제출 및 저장
- 진행 상황 추적
- 성적 자동 계산

### 4. 학습 분석

- 학생별 정확도 통계
- 문제별 난이도 분석
- 소요 시간 추적
- 학습 패턴 분석

---

## 🛠 기술 스택

### Frontend
- **React 18.2**: UI 프레임워크
- **D3.js 7.8**: 그래프 시각화
- **Framer Motion 10**: 애니메이션
- **Math.js 11**: 수학 계산
- **Axios**: HTTP 클라이언트

### Backend
- **PHP 7.1.9**: 서버 사이드 스크립팅
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 플랫폼

### Development
- **React Scripts**: 빌드 도구
- **ESLint**: 코드 품질 관리
- **npm**: 패키지 관리

---

## 💻 시스템 요구사항

### 서버

- **OS**: Linux (Ubuntu 18.04+ 권장) / Windows Server
- **Web Server**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **Moodle**: 3.7 이상

### PHP 확장 모듈

```bash
php-mysql
php-json
php-mbstring
php-curl
php-xml
```

### 클라이언트

- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES6+ 지원
- **화면 해상도**: 320px × 568px 이상 (모바일 최적화)

---

## 📥 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 설정

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < src/database/schema.sql
```

### 4. 설정 파일 구성

```bash
# Moodle 설정 파일 수정
nano config/moodle_config.php
```

다음 항목을 수정하세요:

```php
define('DB_HOST', 'localhost');           // DB 호스트
define('DB_NAME', 'moodle_db');           // DB 이름
define('DB_USER', 'moodle_user');         // DB 사용자
define('DB_PASS', 'your_password');       // DB 비밀번호
define('MOODLE_API_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_token');  // Moodle 웹서비스 토큰
```

### 5. 환경 변수 설정

`.env` 파일 생성:

```bash
REACT_APP_MOODLE_API_URL=http://localhost/moodle/api
REACT_APP_DEBUG_MODE=false
```

### 6. 빌드 및 실행

```bash
# 개발 모드
npm start

# 프로덕션 빌드
npm run build

# 빌드 파일을 웹 서버에 배포
cp -r build/* /var/www/html/transform-scene/
```

### 7. Apache/Nginx 설정

**Apache (.htaccess)**:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /transform-scene/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /transform-scene/index.html [L]
</IfModule>
```

**Nginx**:

```nginx
location /transform-scene/ {
    try_files $uri $uri/ /transform-scene/index.html;
}
```

---

## 🚀 사용 방법

### 기본 사용

1. **Moodle에서 문제 생성**
   - Moodle 관리자 페이지에서 Transform Scene 문제 추가
   - 원본 함수와 변환 타입 설정

2. **학생이 앱 접속**
   ```
   http://your-domain.com/transform-scene/?problem_id=1&student_id=123
   ```

3. **문제 풀이**
   - "변환 시작" 버튼을 클릭하여 애니메이션 시청
   - 힌트를 참고하여 변환 이해
   - 답안 제출

### URL 파라미터

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `problem_id` | 문제 ID | `1` |
| `student_id` | 학생 ID | `123` |
| `course_id` | 코스 ID (선택) | `5` |

### 예시

```html
<!-- HTML에 임베드 -->
<iframe src="http://your-domain.com/transform-scene/?problem_id=1&student_id=123"
        width="360" height="640" frameborder="0"></iframe>
```

---

## 📚 API 문서

### 1. 문제 데이터 가져오기

**Endpoint**: `GET /api/moodle_integration.php?action=get_problem&id={problem_id}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalFunction": "x^2",
    "targetFunction": "(x-2)^2+3",
    "transformType": "translation_combined",
    "transformParams": {
      "h": 2,
      "k": 3
    },
    "difficulty": "medium",
    "description": "함수를 평행이동시키세요",
    "hints": ["힌트 1", "힌트 2"]
  }
}
```

### 2. 답안 저장

**Endpoint**: `POST /api/moodle_integration.php?action=save_answer`

**요청 본문**:
```json
{
  "studentId": 123,
  "problemId": 1,
  "answer": {
    "function": "(x-2)^2+3"
  },
  "isCorrect": true
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "answerId": 456,
    "message": "답안이 저장되었습니다."
  }
}
```

### 3. 학생 진행 상황

**Endpoint**: `GET /api/moodle_integration.php?action=get_progress&student_id={student_id}`

**응답**:
```json
{
  "success": true,
  "data": {
    "studentId": 123,
    "totalAttempts": 15,
    "correctAnswers": 12,
    "accuracyRate": 80.00
  }
}
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   └── TransformScene/
│   │       ├── TransformScene.jsx    # 메인 컴포넌트
│   │       └── TransformScene.css    # 스타일
│   ├── api/
│   │   └── moodle_integration.php    # Moodle API
│   ├── database/
│   │   └── schema.sql                # DB 스키마
│   ├── utils/                        # 유틸리티 함수
│   ├── index.js                      # 앱 진입점
│   └── index.css                     # 글로벌 스타일
├── public/
│   ├── index.html                    # HTML 템플릿
│   ├── favicon.ico
│   └── manifest.json
├── config/
│   └── moodle_config.php             # Moodle 설정
├── package.json                      # npm 설정
├── README.md                         # 문서
└── .env                              # 환경 변수
```

---

## 👨‍💻 개발 가이드

### 로컬 개발 환경 설정

```bash
# 개발 서버 시작
npm start

# 코드 린팅
npm run lint

# 테스트 실행
npm test
```

### 새로운 변환 타입 추가

1. **데이터베이스에 변환 타입 추가** (`src/database/schema.sql`):
```sql
INSERT INTO transform_types (type_code, type_name_ko, type_name_en, ...)
VALUES ('new_type', '새 변환', 'New Transform', ...);
```

2. **TransformScene 컴포넌트 수정** (`src/components/TransformScene/TransformScene.jsx`):
```javascript
case 'new_type':
  return {
    title: '새 변환',
    description: 'f(x) → ...',
    details: '...'
  };
```

### 코드 스타일 가이드

- **JavaScript**: Airbnb 스타일 가이드
- **PHP**: PSR-12 코딩 표준
- **CSS**: BEM 방법론

---

## 🔧 문제 해결

### 일반적인 문제

#### 1. "Database connection failed" 오류

**원인**: 데이터베이스 연결 실패

**해결**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 설정 파일 확인
nano config/moodle_config.php

# 데이터베이스 권한 확인
mysql -u root -p
SHOW GRANTS FOR 'moodle_user'@'localhost';
```

#### 2. 그래프가 표시되지 않음

**원인**: D3.js 라이브러리 로드 실패

**해결**:
- 브라우저 콘솔에서 에러 확인
- CDN 연결 확인
- 캐시 삭제 후 재시도

#### 3. 애니메이션이 끊김

**원인**: 성능 이슈

**해결**:
- 브라우저 하드웨어 가속 활성화
- 불필요한 탭 닫기
- 함수 복잡도 낮추기

### 로그 확인

```bash
# PHP 에러 로그
tail -f /var/log/apache2/error.log

# MySQL 로그
tail -f /var/log/mysql/error.log

# 브라우저 콘솔
F12 → Console 탭
```

---

## 🤝 기여 방법

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 기여 가이드라인

- 코드 스타일 가이드 준수
- 테스트 코드 작성
- 명확한 커밋 메시지
- 문서 업데이트

---

## 📝 라이센스

이 프로젝트는 MIT 라이센스에 따라 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 👥 개발팀

**KAIST Touch Math Academy**

- 프로젝트 관리자: [Your Name]
- 개발자: [Dev Team]
- 디자이너: [Design Team]

---

## 📞 문의

- **이메일**: support@kaist-touch-math.ac.kr
- **웹사이트**: https://touch-math.kaist.ac.kr
- **GitHub Issues**: https://github.com/your-org/alt42standalone_v1.0/issues

---

<div align="center">

Made with ❤️ by KAIST Touch Math Academy

[⬆ 맨 위로](#transform-scene---함수-변환-시각화-학습-시스템)

</div>
