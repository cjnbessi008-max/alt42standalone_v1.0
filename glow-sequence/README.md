# Glow Sequence - 수열 학습 게임

<div align="center">

![Glow Sequence Logo](https://via.placeholder.com/150?text=✨+Glow+Sequence)

**빛나는 수열 패턴으로 배우는 재미있는 수학 학습 게임**

[![PHP](https://img.shields.io/badge/PHP-7.1.9-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Moodle](https://img.shields.io/badge/Moodle-3.7-F98012?logo=moodle&logoColor=white)](https://moodle.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## 📋 목차

- [개요](#-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 방법](#-설치-방법)
- [사용 방법](#-사용-방법)
- [API 문서](#-api-문서)
- [데이터베이스 스키마](#-데이터베이스-스키마)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 가이드](#-개발-가이드)
- [라이선스](#-라이선스)

---

## 🎯 개요

**Glow Sequence**는 수열 학습을 게임화한 교육용 웹 애플리케이션입니다.
Moodle LMS와 연동하여 문제를 관리하고, 가상 스마트폰 화면에서 빛나는 애니메이션 효과와 함께 수열 패턴을 학습할 수 있습니다.

### 특징

- 🎮 **게임화된 학습**: 재미있는 게임 형식으로 수열을 학습
- 💡 **빛나는 애니메이션**: 수열 패턴을 시각적으로 표현하는 Glow Effect
- 📱 **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 시뮬레이션
- 🔗 **Moodle 연동**: Moodle LMS와 완벽하게 통합
- 📊 **실시간 통계**: 학습 진행 상황과 성적을 실시간으로 추적

---

## ✨ 주요 기능

### 1. 다양한 수열 유형

- ➕ **등차수열**: 일정한 차이로 증가하는 패턴
- ✖️ **등비수열**: 일정한 비율로 증가하는 패턴
- 🌀 **피보나치 수열**: 이전 두 항의 합으로 이루어진 패턴
- 🎲 **사용자 정의 패턴**: 제곱수, 세제곱수 등 다양한 패턴

### 2. 학습 관리 시스템

- 👤 **사용자 관리**: Moodle과 동기화된 사용자 정보
- 📈 **진행 상황 추적**: 실시간 학습 진행도 모니터링
- 🏆 **점수 시스템**: 정확도, 속도, 난이도에 따른 점수 부여
- 💯 **숙련도 측정**: 각 문제별 숙련도 백분율 계산

### 3. 인터랙티브 UI/UX

- ✨ **Glow 애니메이션**: 수열 숫자마다 빛나는 효과
- ⏱️ **타이머**: 제한 시간 내 문제 해결
- 💬 **즉각적인 피드백**: 정답/오답 시 실시간 피드백
- 💡 **힌트 시스템**: 어려울 때 힌트 제공

### 4. Moodle LMS 연동

- 🔄 **사용자 동기화**: Moodle 사용자 자동 동기화
- 📝 **문제 연동**: Moodle 문제 뱅크와 연동 가능
- 📊 **성적 연동**: 학습 결과를 Moodle로 전송 (선택사항)

---

## 🛠 기술 스택

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 연동

### Frontend
- **HTML5/CSS3**: 구조와 스타일
- **JavaScript (ES6)**: 클라이언트 로직
- **Web Animations API**: 부드러운 애니메이션

### 아키텍처
- **RESTful API**: PHP 기반 REST API
- **AJAX**: 비동기 데이터 통신
- **iframe 통신**: 부모-자식 윈도우 간 메시지 전달

---

## 📦 설치 방법

### 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 이상 (선택사항)
- Apache/Nginx 웹 서버

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd glow-sequence
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source db/schema.sql
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
# Glow Sequence Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=glow_sequence_db
DB_USER=root
DB_PASS=your_password

# Moodle Database (선택사항)
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=root
MOODLE_DB_PASS=your_password
MOODLE_DB_PREFIX=mdl_
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /glow-sequence/public/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/glow-sequence/public;

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
chmod -R 755 glow-sequence
chown -R www-data:www-data glow-sequence
```

---

## 🚀 사용 방법

### 1. 애플리케이션 접속

웹 브라우저에서 다음 주소로 접속:

```
http://your-domain.com/glow-sequence/public/
```

### 2. 사용자 로드

1. Moodle 사용자 ID를 입력
2. "사용자 로드" 버튼 클릭
3. 사용자 정보가 동기화됨

### 3. 문제 불러오기

1. 난이도 선택 (선택사항)
2. "문제 불러오기" 버튼 클릭
3. 우측 스마트폰 화면에 문제가 표시됨

### 4. 게임 플레이

1. 빛나는 수열 패턴 관찰
2. 다음에 올 숫자 입력
3. "제출" 버튼 클릭
4. 피드백 확인 및 다음 문제로 이동

---

## 📚 API 문서

### 1. 사용자 동기화

**Endpoint**: `POST /moodle/sync_user.php`

**Request**:
```json
{
  "moodle_user_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "moodle_user_id": 1,
    "username": "홍길동",
    "email": "student@example.com",
    "grade_level": "3"
  }
}
```

### 2. 문제 가져오기

**Endpoint**: `GET /api/get_problems.php`

**Parameters**:
- `student_id` (required): 학생 ID
- `difficulty` (optional): easy, medium, hard
- `type` (optional): arithmetic, geometric, fibonacci, custom
- `limit` (optional): 결과 개수 (기본값: 10)
- `offset` (optional): 페이지네이션 오프셋

**Response**:
```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": 1,
        "sequence_type": "arithmetic",
        "sequence_pattern": "2,4,6,8,?",
        "difficulty_level": "easy",
        "hint_text": "각 숫자는 이전 숫자에 2를 더한 값입니다",
        "max_attempts": 3,
        "time_limit_seconds": 60,
        "glow_color_primary": "#00ffff",
        "glow_color_secondary": "#00aaff",
        "animation_speed": "medium"
      }
    ],
    "pagination": {
      "total": 7,
      "limit": 10,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### 3. 답안 제출

**Endpoint**: `POST /api/submit_answer.php`

**Request**:
```json
{
  "student_id": 1,
  "sequence_id": 1,
  "answer": "10",
  "time_spent": 25,
  "hint_used": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "attempt_id": 1,
    "is_correct": true,
    "score_earned": 120,
    "attempt_number": 1,
    "max_attempts": 3,
    "status": "completed",
    "mastery_level": 100.0,
    "can_retry": false,
    "feedback": "정답입니다! 훌륭해요! 🎉"
  }
}
```

### 4. 진행 상황 조회

**Endpoint**: `GET /api/get_progress.php`

**Parameters**:
- `student_id` (required): 학생 ID

**Response**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "username": "홍길동",
      "total_score": 450,
      "total_attempts": 10
    },
    "summary": {
      "total_sequences": 5,
      "completed": 3,
      "in_progress": 1,
      "failed": 1,
      "avg_mastery": 75.5,
      "total_best_score": 450
    },
    "sequences": [...],
    "recent_attempts": [...],
    "difficulty_stats": {...}
  }
}
```

---

## 🗄 데이터베이스 스키마

### 주요 테이블

#### 1. glow_sequences
수열 문제 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| sequence_type | VARCHAR(50) | 수열 유형 |
| sequence_pattern | VARCHAR(255) | 수열 패턴 |
| difficulty_level | ENUM | 난이도 |
| correct_answer | VARCHAR(100) | 정답 |
| glow_color_primary | VARCHAR(7) | 주 색상 |
| glow_color_secondary | VARCHAR(7) | 보조 색상 |

#### 2. glow_students
학생 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_user_id | INT | Moodle 사용자 ID |
| username | VARCHAR(100) | 사용자 이름 |
| total_score | INT | 총 점수 |

#### 3. glow_attempts
시도 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| student_id | INT | 학생 ID |
| sequence_id | INT | 수열 ID |
| is_correct | BOOLEAN | 정답 여부 |
| score_earned | INT | 획득 점수 |

#### 4. glow_progress
진행 상황

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| student_id | INT | 학생 ID |
| sequence_id | INT | 수열 ID |
| status | ENUM | 상태 |
| mastery_level | DECIMAL | 숙련도 |

자세한 스키마는 `db/schema.sql` 파일을 참조하세요.

---

## 📁 프로젝트 구조

```
glow-sequence/
├── config/
│   └── database.php          # 데이터베이스 설정
├── api/
│   ├── get_problems.php      # 문제 조회 API
│   ├── submit_answer.php     # 답안 제출 API
│   └── get_progress.php      # 진행 상황 조회 API
├── moodle/
│   └── sync_user.php         # Moodle 사용자 동기화
├── db/
│   └── schema.sql            # 데이터베이스 스키마
├── public/
│   ├── index.php             # 메인 페이지
│   ├── app.html              # 가상 스마트폰 앱 화면
│   ├── css/
│   │   └── styles.css        # 스타일시트
│   └── js/
│       ├── game.js           # 게임 로직
│       └── glow-animation.js # 애니메이션 효과
└── README.md
```

---

## 🔧 개발 가이드

### 로컬 개발 환경 설정

1. **XAMPP/WAMP 설치** (Windows) 또는 **LAMP** (Linux)
2. 프로젝트를 `htdocs` 또는 `www` 폴더에 복사
3. MySQL에서 데이터베이스 생성
4. `config/database.php`에서 데이터베이스 연결 정보 수정

### 새로운 수열 유형 추가

1. `db/schema.sql`의 샘플 데이터에 새 수열 추가
2. 필요시 `sequence_type` enum에 새 타입 추가
3. 클라이언트 로직에서 새 유형 처리 추가

### 애니메이션 커스터마이징

`js/glow-animation.js`의 `GlowAnimator` 클래스에서:
- `applyGlow()`: 기본 애니메이션 설정
- `pulsate()`, `wave()`, `sparkle()`: 애니메이션 패턴
- 새로운 패턴 추가 가능

---

## 🧪 테스트

### 수동 테스트

1. 브라우저 개발자 도구 열기 (F12)
2. 콘솔에서 API 응답 확인
3. 네트워크 탭에서 요청/응답 모니터링

### 테스트 데이터

스키마 파일에 7개의 샘플 문제가 포함되어 있습니다:
- 등차수열: 3문제
- 등비수열: 2문제
- 피보나치: 1문제
- 사용자 정의: 1문제

---

## 🤝 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 👥 제작자

**KAIST Touch Math Academy**

- 개발자: AI Agent (Claude)
- 날짜: 2025-11-18
- 버전: 1.0.0

---

## 📞 문의

질문이나 제안사항이 있으시면 다음으로 연락주세요:
- 이메일: support@example.com
- 이슈 트래커: GitHub Issues

---

<div align="center">

**만들어진 곳: ❤️ with KAIST Touch Math Academy**

</div>
