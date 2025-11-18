# AI 개인화 학습 시스템 - 사고 패턴 기반 분수 학습

Moodle LMS와 연동 가능한 독립형 웹앱으로, 학생의 사고 패턴을 분석하여 개인화된 풀이 전략을 제공하는 AI 교육 시스템입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [라이선스](#라이선스)

## ✨ 주요 기능

### 1. 사고 패턴 분석 (Learning Pattern Analysis)

학생의 학습 행동을 분석하여 3가지 사고 패턴으로 분류합니다:

- **시각형 (Visual)**: 그림, 도표, 시각적 표현을 선호
- **분석형 (Analytical)**: 단계별 논리적 풀이를 선호
- **실험형 (Experimental)**: 직접 조작하며 배우는 것을 선호

### 2. 개인화된 문제 추천

- 학생의 주요 학습 패턴에 맞는 문제 70% 제공
- 다양성을 위한 다른 패턴 문제 30% 제공
- 정답률에 따른 난이도 자동 조정

### 3. 맞춤형 힌트 제공

각 학습 패턴에 맞는 힌트:
- 시각형 → 그림/도표 힌트
- 분석형 → 단계별 풀이 힌트
- 실험형 → 인터랙티브 조작 힌트

### 4. 실시간 학습 패턴 업데이트

문제를 풀 때마다:
- 도구 사용 패턴 추적
- 힌트 요청 유형 분석
- 학습 패턴 자동 재분석

### 5. 학습 대시보드

- 학습 패턴 시각화
- 정답률, 평균 시간 등 통계
- 최근 시도 기록

## 🛠 기술 스택

### 백엔드
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **PDO**: 데이터베이스 연결

### 프론트엔드
- **HTML5**: 마크업
- **CSS3**: 스타일링
- **Bootstrap 4**: UI 프레임워크
- **jQuery**: JavaScript 라이브러리
- **Font Awesome**: 아이콘

### 아키텍처
- **RESTful API**: 백엔드-프론트엔드 통신
- **MVC 패턴**: 코드 구조화
- **서비스 레이어**: 비즈니스 로직 분리

## 📥 설치 방법

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 웹 서버 (또는 Nginx)
- Composer (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE ai_education_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항)
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ai_education_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
USE ai_education_lms;
SOURCE /path/to/database/schema.sql;
```

### 3. 프로젝트 설치

```bash
# 프로젝트 클론
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# Apache 문서 루트 설정 (예: /var/www/html)
sudo cp -r . /var/www/html/lms

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/lms
sudo chmod -R 755 /var/www/html/lms
```

### 4. 데이터베이스 연결 설정

`api/config/database.php` 파일을 수정하세요:

```php
private $host = "localhost";
private $db_name = "ai_education_lms";
private $username = "root";  // 또는 생성한 사용자
private $password = "";       // 비밀번호 입력
```

### 5. Apache 설정 (선택사항)

`.htaccess` 파일을 생성하여 URL 리라이팅 설정:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/endpoints/$1 [L,QSA]
```

### 6. 서버 시작

```bash
# Apache 재시작
sudo systemctl restart apache2

# 또는 PHP 내장 서버 사용 (개발용)
cd public
php -S localhost:8000
```

## 🚀 사용 방법

### 1. 웹 브라우저로 접속

```
http://localhost/lms/public/
```

### 2. 학생 선택

- 메인 페이지에서 등록된 학생 중 한 명을 선택합니다.
- 기본적으로 5명의 샘플 학생이 생성되어 있습니다.

### 3. 대시보드 확인

- 학생의 학습 패턴 (시각형, 분석형, 실험형)
- 학습 통계 (풀어본 문제, 정답률, 평균 시간)

### 4. 문제 풀기

1. "추천 문제 풀기" 버튼 클릭
2. 개인화된 문제가 표시됨
3. 필요시 힌트 요청 (시각적/분석적/실험적)
4. 답 입력 및 제출
5. 피드백 확인

### 5. 패턴 변화 관찰

- 문제를 풀수록 학습 패턴이 업데이트됩니다.
- 대시보드에서 변화를 확인할 수 있습니다.

## 📚 API 문서

### Students API

#### GET /api/endpoints/students.php
모든 학생 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "count": 5
  }
}
```

#### GET /api/endpoints/students.php/{id}
특정 학생 조회

#### GET /api/endpoints/students.php/{id}/pattern
학생의 학습 패턴 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "pattern": {
      "visual_score": 45.5,
      "analytical_score": 30.2,
      "experimental_score": 24.3,
      "dominant_pattern": "visual",
      "confidence_level": 75.5
    }
  }
}
```

#### GET /api/endpoints/students.php/{id}/progress
학생의 학습 진행 상황 조회

### Problems API

#### GET /api/endpoints/problems.php
문제 목록 조회

**Query Parameters:**
- `difficulty`: 난이도 (1-5)
- `problem_type`: 문제 유형 (addition, subtraction 등)
- `pattern`: 추천 패턴 (visual, analytical, experimental)

#### GET /api/endpoints/problems.php/{id}
특정 문제 조회

#### POST /api/endpoints/problems.php/{id}/submit
답안 제출

**Request Body:**
```json
{
  "student_id": 1,
  "answer_numerator": 3,
  "answer_denominator": 4,
  "time_spent_seconds": 45,
  "hint_requested": true,
  "hint_type_used": "visual",
  "visual_tool_clicks": 5,
  "step_by_step_views": 0,
  "interactive_manipulations": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "updated_pattern": {...}
  },
  "message": "Correct answer!"
}
```

### Recommendations API

#### GET /api/endpoints/recommendations.php/{student_id}/next
다음 추천 문제 조회

#### POST /api/endpoints/recommendations.php/{student_id}/generate
새 추천 문제 생성

**Request Body:**
```json
{
  "count": 10
}
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── api/
│   ├── config/
│   │   ├── database.php        # DB 연결 설정
│   │   └── config.php          # 앱 설정
│   ├── models/
│   │   ├── Student.php         # 학생 모델
│   │   ├── FractionProblem.php # 문제 모델
│   │   └── StudentAttempt.php  # 시도 모델
│   ├── services/
│   │   ├── LearningPatternAnalyzer.php  # 패턴 분석기
│   │   └── RecommendationEngine.php     # 추천 엔진
│   └── endpoints/
│       ├── students.php        # 학생 API
│       ├── problems.php        # 문제 API
│       └── recommendations.php # 추천 API
├── public/
│   ├── index.html             # 메인 페이지
│   ├── css/
│   │   └── style.css          # 스타일시트
│   └── js/
│       └── app.js             # 프론트엔드 로직
└── README.md                  # 이 파일
```

## 🔬 학습 패턴 분석 알고리즘

### 1. 행동 데이터 수집

각 문제 시도 시 다음 데이터를 수집합니다:
- 시각 도구 클릭 횟수 (visual_tool_clicks)
- 단계별 풀이 조회 횟수 (step_by_step_views)
- 인터랙티브 조작 횟수 (interactive_manipulations)
- 요청한 힌트 유형 (hint_type_used)
- 문제 풀이 시간 (time_spent_seconds)

### 2. 패턴 점수 계산

```
visual_score = (visual_clicks × 1.5 + visual_hints × 2) / total_interactions × 100
analytical_score = (analytical_views × 1.3 + analytical_hints × 2) / total_interactions × 100
experimental_score = (experimental_manips × 1.2 + experimental_hints × 2) / total_interactions × 100
```

### 3. 주요 패턴 결정

- 최고 점수의 패턴이 15% 이상 차이나면 해당 패턴을 주요 패턴으로 설정
- 그렇지 않으면 "균형형 (balanced)"으로 분류

### 4. 신뢰도 계산

```
confidence = (시도 횟수 기반 신뢰도 + 패턴 명확도) / 2
```

## 🎯 개인화 추천 전략

### 1. 문제 선택

- **70%**: 학생의 주요 패턴에 맞는 문제
- **30%**: 다른 패턴의 문제 (학습 다양성)

### 2. 난이도 조정

- 정답률 85% 이상 → 난이도 상향
- 정답률 50% 미만 → 난이도 하향
- 정답률 50-85% → 현재 난이도 유지

### 3. 힌트 제공

학생의 주요 패턴에 맞는 힌트를 우선 제공:
- 시각형 → 그림/도표
- 분석형 → 단계별 풀이
- 실험형 → 조작 도구

## 🔌 Moodle LMS 연동 (향후 개발)

현재는 독립형 웹앱이지만, 향후 Moodle 3.7과 연동할 수 있도록 설계되었습니다:

### SSO 연동 준비
- `students` 테이블에 `moodle_user_id` 필드 준비
- 세션 관리 인터페이스

### LTI (Learning Tools Interoperability) 통합 계획
- Moodle 외부 도구로 통합
- 성적 동기화

## 🧪 테스트

### 샘플 데이터

데이터베이스 스키마에는 다음이 포함되어 있습니다:
- 3명의 샘플 교사
- 5명의 샘플 학생
- 10개의 샘플 분수 문제

### 테스트 시나리오

1. **패턴 분석 테스트**
   - 학생 선택 후 여러 문제 풀기
   - 특정 유형의 힌트만 사용
   - 패턴 점수 변화 확인

2. **추천 엔진 테스트**
   - 초기 추천 문제 확인 (균형형)
   - 패턴 형성 후 추천 변화 확인

3. **난이도 조정 테스트**
   - 연속으로 정답 → 난이도 상승 확인
   - 연속으로 오답 → 난이도 하락 확인

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템의 일부입니다.

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 📞 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**개발**: AI 교육 시스템 팀
**버전**: 1.0.0
**최종 업데이트**: 2024년
