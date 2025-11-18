# Reverse Bloom - 부정적분 학습 시스템

Moodle LMS와 연동하여 작동하는 혁신적인 교육 시스템으로, **Reverse Bloom Taxonomy**를 적용한 학습 앱입니다.

## 🎯 핵심 개념

**Reverse Bloom**은 부정적분(antiderivative)의 개념을 교육에 적용한 것입니다:
- 미분이 복잡한 함수를 더 단순하게 만든다면
- **부정적분은 원래 함수로 되돌아가는 과정**입니다
- 마찬가지로 Reverse Bloom은 **복잡한 문제에서 시작하여 기초 개념으로 분해**합니다

### Bloom's Taxonomy 레벨 (역순 적용)

```
Level 6: Create (창조)    ← 복잡한 종합 문제 (시작점)
Level 5: Evaluate (평가)  ← 판단 및 분석
Level 4: Analyze (분석)   ← 구성요소 파악
Level 3: Apply (적용)     ← 개념 적용
Level 2: Understand (이해) ← 개념 이해
Level 1: Remember (기억)  ← 기본 사실 (가장 단순)
```

## 🎨 UI 특징

- **우측 하단 스마트폰 UI**: 가상 스마트폰 화면에 앱이 표시됩니다
- **최소화 기능**: 필요할 때만 펼쳐서 사용 가능
- **반응형 디자인**: 모바일/태블릿/데스크톱 환경 모두 지원
- **직관적인 네비게이션**: 더 쉽게/어렵게 버튼으로 레벨 조절

## 📋 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Architecture**: MVC 패턴

## 🚀 설치 방법

### 1. 환경 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 설치 및 실행 중
- Apache/Nginx 웹 서버

### 2. 프로젝트 설치

```bash
# 저장소 클론
git clone <repository-url> alt42standalone_v1.0
cd alt42standalone_v1.0

# 환경 설정 파일 생성
cp .env.example .env

# .env 파일 편집 (Moodle 데이터베이스 정보 입력)
nano .env
```

### 3. 환경 설정 (.env)

```env
# Moodle Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=your_moodle_user
DB_PASS=your_moodle_password
DB_PREFIX=mdl_

# Application Settings
APP_DEBUG=false
APP_TIMEZONE=Asia/Seoul

# Reverse Bloom Settings
BLOOM_LEVELS=6
BLOOM_START_LEVEL=6
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
# public 폴더를 DocumentRoot로 설정
<VirtualHost *:80>
    DocumentRoot "/path/to/alt42standalone_v1.0/public"
    ServerName reversebloom.local

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
    server_name reversebloom.local;
    root /path/to/alt42standalone_v1.0/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. 권한 설정

```bash
# 웹 서버에 읽기 권한 부여
chmod -R 755 alt42standalone_v1.0
chown -R www-data:www-data alt42standalone_v1.0
```

## 📚 Moodle 연동

### Moodle 데이터베이스 구조

이 앱은 다음 Moodle 테이블을 사용합니다:

- `mdl_question`: 문제 정보
- `mdl_question_categories`: 문제 카테고리
- `mdl_question_answers`: 객관식 답변

### 필요한 권한

Moodle 데이터베이스에 **읽기 전용** 권한이 필요합니다:

```sql
GRANT SELECT ON moodle.mdl_question TO 'reversebloom_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'reversebloom_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_answers TO 'reversebloom_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🎮 사용 방법

### 기본 사용

1. `index.php`를 브라우저에서 엽니다
2. 우측 하단에 스마트폰 UI가 나타납니다
3. 자동으로 Moodle에서 랜덤 문제를 가져옵니다
4. 문제를 풀어봅니다

### 네비게이션

- **⬇️ 더 쉽게**: 현재 레벨에서 더 기초적인 개념으로 이동
- **⬆️ 더 어렵게**: 더 복잡한 수준의 문제로 이동
- **➡️ 다음 문제**: 새로운 문제 로드

### 자동 진행

- 정답을 맞추면 자동으로 다음 레벨로 올라갑니다
- 최상위 레벨(Level 6)에 도달하면 새 문제가 로드됩니다

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                  # 웹 루트
│   ├── index.php           # 메인 HTML 페이지
│   ├── api.php             # API 엔드포인트
│   ├── css/
│   │   └── smartphone.css  # 스마트폰 UI 스타일
│   ├── js/
│   │   └── reverse-bloom.js # 프론트엔드 로직
│   └── assets/             # 이미지 등
├── src/
│   ├── config/
│   │   └── database.php    # DB 연결 설정
│   ├── models/
│   │   └── Question.php    # 문제 모델
│   ├── controllers/
│   │   └── QuestionController.php # 문제 컨트롤러
│   └── lib/
│       └── ReverseBloom.php # Reverse Bloom 엔진
├── tasks/                   # 개발 문서
│   └── 0001-prd-ai-education-pipeline.md
├── .env.example            # 환경 설정 예제
└── README.md               # 이 파일
```

## 🔌 API 엔드포인트

### GET /api.php

#### 랜덤 문제 가져오기
```
GET /api.php?action=random&category_id=123
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": 456,
    "name": "분수의 덧셈",
    "questiontext": "1/2 + 1/3 = ?",
    "qtype": "multichoice",
    "answers": [...]
  },
  "bloom": {
    "currentStep": {...},
    "allSteps": {...},
    "currentLevel": 6,
    "progress": 16.67,
    "isAtTop": true,
    "isAtBottom": false
  }
}
```

#### 특정 문제 가져오기
```
GET /api.php?action=get&question_id=456
```

#### 카테고리 목록
```
GET /api.php?action=categories
```

#### 문제 검색
```
GET /api.php?action=search&q=분수
```

## 🔧 커스터마이징

### Bloom 레벨 수정

`src/lib/ReverseBloom.php`에서 각 레벨의 질문 생성 로직을 수정할 수 있습니다:

```php
private function generateAnalyzeStep($originalQuestion) {
    // 커스텀 로직 구현
    return "분석 단계 질문...";
}
```

### UI 스타일 변경

`public/css/smartphone.css`에서 색상, 크기, 레이아웃 등을 수정 가능:

```css
.smartphone-container {
    bottom: 20px;    /* 위치 조정 */
    right: 20px;
    width: 380px;    /* 크기 조정 */
    height: 720px;
}
```

## 🧪 테스트

### 데모 데이터 생성 (Moodle 없이 테스트)

```sql
-- demo_data.sql 실행
mysql -u root -p < demo_data.sql
```

### API 테스트

```bash
# 랜덤 문제 테스트
curl "http://localhost/api.php?action=random"

# 카테고리 목록
curl "http://localhost/api.php?action=categories"
```

## 🐛 문제 해결

### 데이터베이스 연결 실패

1. `.env` 파일의 DB 정보가 정확한지 확인
2. MySQL 서버가 실행 중인지 확인
3. 권한이 올바르게 설정되었는지 확인

### 문제가 표시되지 않음

1. Moodle에 문제가 등록되어 있는지 확인
2. 브라우저 개발자 도구에서 네트워크 오류 확인
3. `api.php`에서 직접 API 응답 확인

### UI가 깨져 보임

1. CSS 파일이 올바르게 로드되는지 확인
2. 브라우저 캐시 삭제
3. 최신 브라우저 사용 권장 (Chrome, Firefox, Safari, Edge)

## 📖 교육 이론 배경

### Reverse Bloom Taxonomy

전통적인 Bloom's Taxonomy는 학습자가 기억(Remember)에서 시작하여 점진적으로 창조(Create)로 올라가는 단계를 제시합니다.

**Reverse Bloom**은 이를 반대로 적용:

1. **복잡한 문제로 시작** (Create Level): 학습자의 현재 수준 파악
2. **어려움 감지**: 학습자가 막히면 자동으로 더 쉬운 레벨 제시
3. **기초 개념 확인** (Remember Level): 가장 기본적인 정의와 사실
4. **점진적 상승**: 이해가 되면 다시 복잡한 문제로 복귀

이는 **부정적분(Antiderivative)**의 수학적 개념과 유사합니다:
- 미분 f'(x) → f(x)는 단순화
- 부정적분 ∫f(x)dx → F(x)는 원래 함수로 복원
- Reverse Bloom은 복잡→단순→복잡으로 순환하며 학습

## 🤝 기여하기

이슈 및 PR을 환영합니다!

## 📄 라이선스

MIT License

## 👥 제작

KAIST Touch Math Academy - AI Education System Pipeline

## 📮 연락처

문의사항이 있으시면 이슈를 등록해주세요.

---

**Happy Learning with Reverse Bloom! 📚✨**
