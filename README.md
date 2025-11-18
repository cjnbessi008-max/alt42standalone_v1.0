# 🎨 Solution Paint

부등식의 해를 색감으로 시각화하는 교육용 웹 애플리케이션

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-green.svg)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [Moodle 연동](#moodle-연동)
- [프로젝트 구조](#프로젝트-구조)
- [라이선스](#라이선스)

## 개요

**Solution Paint**는 학생들이 부등식의 해를 수직선 위에 직접 그려가며 학습할 수 있는 인터랙티브 교육 도구입니다. 터치 기반 인터페이스로 직관적인 학습 경험을 제공하며, Moodle LMS와 연동하여 학습 관리를 지원합니다.

### 특징

- ✏️ **직관적인 터치 인터페이스**: 스마트폰/태블릿에서 손가락으로 자유롭게 그리기
- 📱 **스마트폰 UI**: 우측 하단 가상 스마트폰 화면에 앱 형태로 표시
- 🎯 **실시간 피드백**: 즉각적인 정답 확인 및 점수 제공
- 📊 **학습 분석**: 학생별 시도 횟수, 소요 시간, 정답률 추적
- 🔗 **Moodle 연동**: LMS와 연동하여 문제 불러오기 및 성적 동기화

## 주요 기능

### 1. 부등식 문제 풀이
- 일차 부등식 (x > 3, 2x + 1 ≤ 7 등)
- 복합 부등식 (-2 < x ≤ 5)
- 난이도별 문제 제공 (쉬움, 보통, 어려움)

### 2. 인터랙티브 캔버스
- 🖌️ **칠하기 모드**: 부등식의 해를 수직선에 표시
- 🧹 **지우기 모드**: 잘못 칠한 부분 수정
- 🗑️ **초기화**: 전체 다시 그리기

### 3. 자동 채점 시스템
- 정답 여부 자동 판정
- 부분 점수 계산
- 상세 피드백 제공
- 정답 해설 표시

### 4. 학습 데이터 수집
- 학생별 답안 기록
- 학습 행동 패턴 분석
- 소요 시간 측정
- 시도 횟수 추적

## 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **PDO**: 데이터베이스 접근

### Frontend
- **HTML5 Canvas**: 드로잉 기능
- **CSS3**: 반응형 디자인
- **Vanilla JavaScript**: ES6+ 문법

### Integration
- **Moodle**: 3.7
- **REST API**: Moodle 웹서비스 연동

## 설치 방법

### 사전 요구사항

- PHP 7.1 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- (선택) Moodle 3.7 설치 및 REST API 활성화

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 테이블 생성
mysql -u root -p < database/schema.sql
```

### 3. 설정 파일 수정

`api/db_config.php` 파일을 열어 데이터베이스 설정을 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'solution_paint');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 연동 시
define('MOODLE_ENABLED', true);
define('MOODLE_URL', 'http://your-moodle-url');
define('MOODLE_TOKEN', 'your_moodle_api_token');
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName solution-paint.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name solution-paint.local;
    root /path/to/alt42standalone_v1.0;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### 6. 실행

브라우저에서 `http://localhost` 또는 설정한 도메인으로 접속하세요.

## 사용 방법

### 학생 사용법

1. **문제 확인**: 우측 스마트폰 화면에 부등식 문제가 표시됩니다
2. **도구 선택**: 칠하기/지우기/초기화 버튼 중 선택
3. **해 표시**: 수직선 위에 부등식의 해를 터치/드래그로 칠합니다
4. **제출**: "제출하기" 버튼을 눌러 답을 확인합니다
5. **결과 확인**: 점수와 피드백을 확인하고 다음 문제로 진행합니다

### 교사 사용법

1. **문제 추가**: 데이터베이스에 새로운 문제를 추가할 수 있습니다

```sql
INSERT INTO inequality_problems
    (problem_text, inequality_type, coefficient_a, coefficient_b, constant_c,
     operator, solution_start, solution_end, include_start, include_end, difficulty)
VALUES
    ('3x - 2 > 7', 'linear', 3, -2, 7, '>', 3, NULL, FALSE, FALSE, 'medium');
```

2. **학습 결과 조회**: 학생별 학습 데이터 확인

```sql
SELECT s.student_name, COUNT(*) as attempts,
       AVG(s.score) as avg_score, AVG(s.time_spent) as avg_time
FROM student_answers s
GROUP BY s.student_id, s.student_name;
```

## API 문서

### 1. 문제 가져오기

**Endpoint**: `GET /api/get_problem.php`

**Parameters**:
- `id` (optional): 특정 문제 ID
- `difficulty` (optional): 난이도 (easy, medium, hard)
- `moodle_id` (optional): Moodle 문제 ID

**Response**:
```json
{
    "success": true,
    "source": "local",
    "problem": {
        "id": 1,
        "text": "x > 3",
        "type": "linear",
        "difficulty": "easy",
        "coefficients": {"a": 1, "b": 0, "c": 3},
        "operator": ">",
        "solution": {
            "start": 3,
            "end": null,
            "includeStart": false,
            "includeEnd": false
        },
        "displayRange": {"min": -7, "max": 13}
    }
}
```

### 2. 답안 제출

**Endpoint**: `POST /api/submit_answer.php`

**Request Body**:
```json
{
    "problem_id": 1,
    "student_id": "student_123",
    "student_name": "홍길동",
    "painted_data": {
        "regions": [...],
        "analysis": {"start": 3.2, "end": 10.5}
    },
    "answer_start": 3.2,
    "answer_end": 10.5,
    "time_spent": 45
}
```

**Response**:
```json
{
    "success": true,
    "answer_id": 123,
    "grading": {
        "is_correct": true,
        "score": 100,
        "feedback": "정답입니다!",
        "details": {
            "start_correct": true,
            "end_correct": null,
            "inclusion_correct": true
        }
    },
    "attempt_number": 1,
    "correct_solution": {
        "start": 3,
        "end": null,
        "includeStart": false,
        "includeEnd": false
    }
}
```

## Moodle 연동

### 1. Moodle REST API 활성화

1. Moodle 관리자 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. 다음 단계 완료:
   - 웹 서비스 활성화
   - REST 프로토콜 활성화
   - 서비스 생성 및 함수 추가
   - 토큰 생성

### 2. 필요한 웹 서비스 함수

- `core_question_get_question_data`
- `mod_quiz_save_attempt`
- `core_user_get_users_by_field`

### 3. 토큰 설정

`api/db_config.php`에 Moodle 토큰 입력:

```php
define('MOODLE_ENABLED', true);
define('MOODLE_TOKEN', 'your_token_here');
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── api/
│   ├── db_config.php          # 데이터베이스 설정
│   ├── get_problem.php        # 문제 조회 API
│   └── submit_answer.php      # 답안 제출 API
├── database/
│   └── schema.sql             # 데이터베이스 스키마
├── js/
│   └── solution_paint.js      # 메인 애플리케이션 로직
├── css/
│   └── smartphone.css         # 스타일시트
├── assets/                     # 이미지, 아이콘
├── index.php                   # 메인 페이지
└── README.md                   # 프로젝트 문서
```

## 데이터베이스 스키마

### inequality_problems
부등식 문제 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 문제 ID (PK) |
| problem_text | VARCHAR(500) | 문제 텍스트 |
| coefficient_a | DECIMAL(10,2) | 계수 a |
| coefficient_b | DECIMAL(10,2) | 계수 b |
| constant_c | DECIMAL(10,2) | 상수 c |
| operator | ENUM | 부등호 (>, <, >=, <=) |
| solution_start | DECIMAL(10,2) | 해의 시작점 |
| solution_end | DECIMAL(10,2) | 해의 끝점 |

### student_answers
학생 답안 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 답안 ID (PK) |
| problem_id | INT | 문제 ID (FK) |
| student_id | VARCHAR(100) | 학생 ID |
| painted_data | TEXT | 칠한 영역 JSON |
| is_correct | BOOLEAN | 정답 여부 |
| score | DECIMAL(5,2) | 점수 |
| time_spent | INT | 소요 시간(초) |

## 개발 로드맵

### Phase 1 (현재)
- [x] 일차 부등식 지원
- [x] 기본 터치 인터페이스
- [x] 자동 채점 시스템
- [x] Moodle REST API 연동

### Phase 2 (계획)
- [ ] 이차 부등식 지원
- [ ] 연립 부등식 지원
- [ ] 실시간 힌트 시스템
- [ ] 학습 분석 대시보드
- [ ] 다국어 지원

### Phase 3 (계획)
- [ ] AI 기반 문제 생성
- [ ] 개인화 학습 경로
- [ ] 게이미피케이션 요소
- [ ] 협업 학습 기능

## 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed: SQLSTATE[HY000] [2002] Connection refused
```

**해결**: `api/db_config.php`에서 데이터베이스 설정 확인

### 캔버스가 표시되지 않음

- 브라우저 콘솔에서 JavaScript 오류 확인
- 브라우저가 HTML5 Canvas를 지원하는지 확인

### Moodle 연동 실패

- Moodle REST API가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- 필요한 웹 서비스 함수가 활성화되어 있는지 확인

## 기여하기

이슈 보고, 기능 제안, 풀 리퀘스트를 환영합니다!

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 연락처

- 프로젝트 관리자: [Your Name]
- 이메일: [Your Email]
- 이슈 트래커: [GitHub Issues]

---

Made with ❤️ for better math education
