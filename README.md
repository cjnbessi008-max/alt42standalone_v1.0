# 🧱 Component Lego System

성분을 레고처럼 조립하는 인터랙티브 학습 시스템

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange)
![Moodle](https://img.shields.io/badge/Moodle-3.7-green)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 개요

Component Lego는 Moodle LMS와 연동하여 교육용 문제를 레고 블록처럼 조립 가능한 컴포넌트로 분해하고, 학생들이 드래그 앤 드롭으로 답을 조립할 수 있는 혁신적인 학습 인터페이스입니다.

### 특징

- **🔗 Moodle 3.7 연동**: Web Services API를 통한 실시간 문제 동기화
- **🧩 자동 성분 분해**: 화학식, 분수, 방정식 등을 자동으로 컴포넌트화
- **📱 가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 스타일 인터페이스
- **🎯 드래그 앤 드롭**: 직관적인 마우스/터치 기반 조립
- **💾 자동 저장**: 30초마다 자동 진행 상황 저장
- **📊 학습 분석**: 모든 인터랙션 로깅 및 분석

## 주요 기능

### 1. Moodle LMS 연동
```php
// Moodle Web Services를 통한 문제 가져오기
$moodle = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
$question = $moodle->getQuestion($questionId);
```

### 2. 컴포넌트 분해 엔진
- **화학**: 분자식을 원자와 화학 결합으로 분해
  - 예: H₂O → H(x2) + O(x1) + 결합(x2)
- **수학**: 분수와 방정식을 숫자, 연산자, 변수로 분해
  - 예: 3/4 → 분자(3) + 분수선 + 분모(4)
  - 예: 2x + 5 = 13 → 계수(2) + 변수(x) + 연산자(+) + 상수(5) + 등호 + 결과(13)

### 3. 가상 스마트폰 디스플레이
- 360x640px 모바일 화면 시뮬레이션
- 우측 하단 고정 위치 (position: fixed)
- 최소화/최대화 기능
- 상태바, 앱 헤더, 진행 표시줄 포함

### 4. 드래그 앤 드롭 인터페이스
- 컴포넌트 팔레트에서 조립 영역으로 드래그
- 그리드 기반 스냅 (50px 단위)
- 실시간 연결선(본드) 감지
- 컴포넌트 삭제 및 재배치 가능

## 시스템 요구사항

### 서버
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: mod_rewrite 활성화
- **메모리**: 최소 512MB RAM
- **디스크**: 100MB 이상

### Moodle
- **버전**: 3.7 이상
- **Web Services**: 활성화 필요
- **토큰**: REST 프로토콜 지원

### 클라이언트 (브라우저)
- Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- JavaScript 활성화
- 최소 해상도: 1024x768

## 설치 방법

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정
```bash
# MySQL 데이터베이스 생성 및 스키마 적용
mysql -u root -p < src/config/database.sql

# 또는 MySQL 콘솔에서
mysql -u root -p
source src/config/database.sql
```

### 3. 환경 변수 설정
`.env` 파일 생성 또는 환경 변수 설정:

```bash
export DB_HOST=localhost
export DB_NAME=component_lego
export DB_USER=component_lego_user
export DB_PASS=your_secure_password
export MOODLE_URL=https://your-moodle-site.com
export MOODLE_TOKEN=your_moodle_web_service_token
export APP_DEBUG=false
```

### 4. 파일 권한 설정
```bash
chmod -R 755 public
chmod -R 755 src
```

### 5. Apache 설정 (선택사항)
`public/.htaccess` 파일 확인:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API 요청을 api.php로 라우팅
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^api/v1/(.*)$ api.php/$1 [QSA,L]
</IfModule>
```

### 6. PHP 개발 서버로 실행 (테스트용)
```bash
cd public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

### 7. Moodle Web Services 설정

#### Moodle 관리자 패널에서:
1. **Site administration** → **Server** → **Web services** → **Overview**
2. **Enable web services** 체크
3. **Enable protocols** → REST protocol 활성화
4. **Create a specific user** 또는 기존 사용자 선택
5. **Create a token** → 토큰 생성 및 복사
6. **Add service** → 필요한 함수 권한 부여:
   - `core_webservice_get_site_info`
   - `core_question_get_questions`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_questions`

#### 토큰을 환경 변수에 설정:
```bash
export MOODLE_TOKEN=abc123def456...
```

## 사용 방법

### 기본 사용 흐름

1. **문제 로드**
```javascript
// 문제 ID로 로드
componentLego.loadQuestion(1);

// 또는 Moodle에서 동기화
fetch('/api/v1/moodle/sync/1001', { method: 'POST' });
```

2. **컴포넌트 조립**
   - 컴포넌트 팔레트에서 필요한 블록을 드래그
   - 조립 영역에 드롭하여 배치
   - 자동으로 근처 컴포넌트와 연결 감지

3. **정답 제출**
   - Submit 버튼 클릭
   - 실시간 검증 및 피드백 표시
   - 점수 및 정확도 확인

### 샘플 데이터로 테스트

데이터베이스 스키마에는 샘플 데이터가 포함되어 있습니다:
- **문제 1**: H₂O 분자 조립 (화학)
- **문제 2**: 3/4 분수 조립 (수학)

```javascript
// H2O 문제 로드
componentLego.loadQuestion(1);

// 3/4 분수 문제 로드
componentLego.loadQuestion(2);
```

## API 문서

### 엔드포인트 목록

#### 문제 관리
```http
GET /api/v1/questions/{id}
```
**응답 예시:**
```json
{
  "success": true,
  "question": {
    "question_id": 1,
    "question_text": "물 분자(H₂O)를 조립하세요.",
    "question_type": "chemistry",
    "difficulty_level": 1
  },
  "components": [
    {
      "component_id": 1,
      "component_type": "atom",
      "symbol": "H",
      "display_name": "Hydrogen",
      "color": "#FFFFFF",
      "quantity": 2
    }
  ]
}
```

#### 조립 검증
```http
POST /api/v1/assembly/validate
Content-Type: application/json

{
  "question_id": 1,
  "session_id": "session_12345",
  "assembly": {
    "components": [
      {
        "id": 1,
        "type": "atom",
        "symbol": "H",
        "position": {"x": 50, "y": 100}
      }
    ],
    "connections": []
  }
}
```

**응답 예시:**
```json
{
  "success": true,
  "is_correct": true,
  "message": "정답입니다! 🎉",
  "score": 100
}
```

#### 기타 엔드포인트
- `GET /api/v1/questions/{id}/components` - 컴포넌트 목록만 가져오기
- `POST /api/v1/assembly/save` - 자동 저장 (30초마다)
- `POST /api/v1/interactions/log` - 인터랙션 로깅
- `POST /api/v1/moodle/sync/{id}` - Moodle 문제 동기화
- `GET /api/v1/students/{id}/progress` - 학생 진행 상황

자세한 API 문서는 `docs/api/` 폴더를 참조하세요.

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── api/
│   │   └── MoodleClient.php          # Moodle Web Services 클라이언트
│   ├── config/
│   │   ├── config.php                # 애플리케이션 설정
│   │   ├── Database.php              # 데이터베이스 연결 (Singleton)
│   │   └── database.sql              # MySQL 스키마 및 샘플 데이터
│   ├── controllers/
│   │   └── ApiController.php         # API 엔드포인트 컨트롤러
│   ├── models/
│   │   └── ComponentDecomposer.php   # 컴포넌트 분해 엔진
│   ├── assets/
│   │   ├── css/
│   │   │   └── smartphone.css        # 가상 스마트폰 UI 스타일
│   │   └── js/
│   │       └── component-lego.js     # 드래그 앤 드롭 인터페이스
│   └── views/                         # (향후 추가)
├── public/
│   ├── index.html                     # 메인 페이지
│   ├── api.php                        # API 라우터
│   └── .htaccess                      # Apache 설정
├── docs/
│   ├── COMPONENT_LEGO_SPEC.md        # 시스템 명세서
│   └── api/                           # API 문서 (향후 추가)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # 프로젝트 PRD
└── README.md                          # 이 파일
```

## 데이터베이스 스키마

### 주요 테이블
- `questions` - Moodle에서 가져온 문제
- `components` - 문제별 컴포넌트 (레고 블록)
- `assembly_patterns` - 정답 패턴
- `students` - 학생 정보
- `student_attempts` - 학생 답안 시도
- `student_progress` - 학습 진행 상황
- `interaction_logs` - 인터랙션 로그
- `component_templates` - 컴포넌트 템플릿

스키마 전체 내용은 `src/config/database.sql` 참조

## 개발 가이드

### 새로운 컴포넌트 타입 추가

1. **ComponentDecomposer.php 수정**
```php
private function decomposePhysics($question) {
    // 물리 문제 분해 로직 구현
    return [
        'components' => [...],
        'patterns' => [...],
        'question_type' => 'physics'
    ];
}
```

2. **데이터베이스 템플릿 추가**
```sql
INSERT INTO component_templates (template_name, component_type, subject_area, ...)
VALUES ('force_vector', 'vector', 'physics', ...);
```

3. **CSS 스타일 추가**
```css
.color-force {
    background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
}
```

### 테스트

```bash
# 데이터베이스 연결 테스트
php -r "require 'src/config/Database.php'; echo 'DB OK';"

# Moodle 연결 테스트
php -r "
require 'src/api/MoodleClient.php';
\$m = new MoodleClient();
var_dump(\$m->testConnection());
"

# API 엔드포인트 테스트
curl http://localhost:8000/api/v1/questions/1
```

## 문제 해결

### Moodle 연결 실패
- Moodle URL과 토큰 확인
- Web Services가 활성화되어 있는지 확인
- 방화벽/CORS 설정 확인

### 데이터베이스 연결 오류
- MySQL 서비스 실행 중인지 확인
- 데이터베이스 credentials 확인
- PDO 확장이 설치되어 있는지 확인: `php -m | grep pdo`

### 드래그 앤 드롭 작동 안 함
- JavaScript 콘솔 에러 확인
- 브라우저 호환성 확인
- API 엔드포인트가 응답하는지 확인

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 로드맵

- [ ] 물리 문제 컴포넌트 지원
- [ ] 생물 문제 컴포넌트 지원
- [ ] AI 기반 자동 문제 분해 (LLM 통합)
- [ ] 모바일 네이티브 앱 (React Native)
- [ ] 멀티플레이어 협력 모드
- [ ] 게임화 요소 (배지, 리더보드)

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 문의

프로젝트 관련 문의사항은 이슈를 생성해주세요.

---

**Made with ❤️ for Interactive Education**
