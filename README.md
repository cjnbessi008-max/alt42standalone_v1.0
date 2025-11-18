# 인지 능력 회복력 측정 시스템 (Cognitive Recovery Tracking System)

Moodle LMS와 연동하여 휴식 전후 사고력(인지 능력) 회복력을 측정하는 웹 애플리케이션입니다.

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (Web Services 활성화 필요)
- **웹 서버**: Apache 또는 Nginx

## 🚀 주요 기능

### 1. Moodle LMS 연동
- Moodle 사용자 및 코스 정보 동기화
- Moodle Web Services API를 통한 실시간 데이터 연동
- 평가 결과를 Moodle 성적부로 전송 (선택사항)

### 2. 인지 능력 평가
- **평가 유형**:
  - 기본 인지 평가
  - 반응 속도 테스트
  - 작업 기억 평가
  - 주의력 테스트
- 다양한 문제 유형 지원 (선택형, O/X, 수치형 등)
- 반응 시간 및 정확도 측정

### 3. 휴식 세션 관리
- 휴식 전 평가 (Pre-rest Assessment)
- 휴식 기간 추적 (기본 15분, 조정 가능)
- 휴식 후 평가 (Post-rest Assessment)

### 4. 회복력 분석
- **측정 지표**:
  - 점수 회복률 (Score Recovery Rate)
  - 정확도 회복률 (Accuracy Recovery Rate)
  - 반응 시간 개선도 (Reaction Time Improvement)
  - 종합 회복 점수 (Overall Recovery Score)
  - 일관성 점수 (Consistency Score)
  - 피로도 지표 (Fatigue Indicator)

- **회복 등급**:
  - 우수 (Excellent): 20% 이상 개선
  - 양호 (Good): 10-20% 개선
  - 보통 (Moderate): 0-10% 개선
  - 미흡 (Poor): -10-0% 개선
  - 저하 (Declined): -10% 이하

## 📦 설치 방법

### 1. 파일 다운로드 및 압축 해제
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 설정
```bash
cp config/.env.example config/.env
nano config/.env
```

**.env 파일 설정**:
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=cognitive_recovery
DB_USER=your_username
DB_PASS=your_password

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token_here

# Application Environment
APP_ENV=production
APP_DEBUG=false

# Security
JWT_SECRET=your_random_secret_key_here
```

### 3. 데이터베이스 설치
```bash
php install.php
```

### 4. 웹 서버 설정

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ /index.php [QSA,L]
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alt42standalone_v1.0/public;
    index index.php dashboard.html;

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
chmod -R 755 public/
chmod -R 777 logs/
chmod -R 777 storage/
```

## 🔧 Moodle 설정

### 1. Web Services 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. "웹 서비스 활성화" 체크
4. 저장

### 2. Web Service 토큰 생성
1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. 새 서비스 생성 또는 "Moodle mobile web service" 사용
3. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
4. 사용자에 대한 토큰 생성
5. 토큰을 복사하여 `.env` 파일의 `MOODLE_TOKEN`에 붙여넣기

### 3. 필요한 Web Service 함수
다음 함수들이 활성화되어 있는지 확인:
- `core_user_get_users_by_field`
- `core_user_get_users`
- `core_course_get_courses`
- `core_enrol_get_enrolled_users`
- `core_enrol_get_users_courses`
- `core_webservice_get_site_info`

## 📖 사용 방법

### 대시보드 접속
```
http://your-domain.com/dashboard.html
```

### API 엔드포인트

#### 시스템 상태 확인
```bash
GET /api/status
```

#### Moodle 연결 테스트
```bash
GET /api/moodle/test
```

#### Moodle 데이터 동기화
```bash
# 사용자 동기화
POST /api/moodle/sync/users

# 코스 동기화
POST /api/moodle/sync/courses
```

#### 평가 생성
```bash
POST /api/assessments/create
Content-Type: application/json

{
  "user_id": 1,
  "type_id": 1,
  "timing": "pre_rest",
  "session_id": null,
  "course_id": null
}
```

#### 평가 시작
```bash
POST /api/assessments/{id}/start
Content-Type: application/json

{
  "type_id": 1,
  "question_count": 20
}
```

#### 응답 제출
```bash
POST /api/assessments/{id}/respond
Content-Type: application/json

{
  "question_id": 1,
  "answer": "A",
  "reaction_time": 1234
}
```

#### 평가 완료
```bash
POST /api/assessments/{id}/complete
```

#### 휴식 세션 생성
```bash
POST /api/rest-sessions/create
Content-Type: application/json

{
  "user_id": 1,
  "duration": 900,
  "course_id": null
}
```

#### 회복 메트릭 계산
```bash
POST /api/recovery-metrics/calculate
Content-Type: application/json

{
  "session_id": 1
}
```

#### 사용자 회복 기록 조회
```bash
GET /api/users/{userId}/recovery-history
```

## 📊 데이터베이스 구조

### 주요 테이블
- `users`: 사용자 정보 (Moodle과 동기화)
- `courses`: 코스 정보 (Moodle과 동기화)
- `assessment_types`: 평가 유형
- `cognitive_assessments`: 인지 평가 기록
- `rest_sessions`: 휴식 세션
- `recovery_metrics`: 회복력 측정 지표
- `assessment_questions`: 평가 문제 은행
- `assessment_responses`: 사용자 응답

## 🎯 평가 프로세스

### 1. 전체 플로우
```
1. 사용자 선택
2. 휴식 세션 생성
3. 휴식 전 평가 (Pre-rest)
   ├─ 문제 제시
   ├─ 응답 수집
   └─ 점수 계산
4. 휴식 기간 (15분)
5. 휴식 후 평가 (Post-rest)
   ├─ 문제 제시
   ├─ 응답 수집
   └─ 점수 계산
6. 회복력 분석
   ├─ 점수 비교
   ├─ 회복률 계산
   └─ 등급 판정
7. 결과 표시 및 저장
```

### 2. 코드 예제

```php
<?php
// Moodle 연결 테스트
$moodle = new MoodleClient();
$connected = $moodle->testConnection();

// 사용자 동기화
$db = Database::getInstance()->getConnection();
$count = $moodle->syncUsers($db);

// 평가 생성 및 실행
$assessment = new CognitiveAssessment();
$assessmentId = $assessment->createAssessment(1, 1, 'pre_rest', null, null);
$assessment->startAssessment($assessmentId);
$questions = $assessment->getQuestions(1, 20);

// 응답 기록
foreach ($questions as $question) {
    $assessment->recordResponse($assessmentId, $question['id'], $answer, $reactionTime);
}

// 평가 완료
$results = $assessment->completeAssessment($assessmentId);

// 회복 메트릭 계산
$metrics = new RecoveryMetrics();
$recovery = $metrics->calculateRecovery($sessionId);
?>
```

## 🔒 보안

- SQL Injection 방지 (PDO Prepared Statements)
- XSS 방지 (입력 검증 및 이스케이핑)
- CORS 설정 (프로덕션에서는 특정 도메인만 허용)
- JWT 토큰 기반 인증 (선택사항)
- 환경 변수를 통한 민감 정보 관리

## 📝 라이센스

MIT License

## 👥 지원

문제가 발생하거나 문의사항이 있으시면 이슈를 등록해주세요.

## 🔄 업데이트 로그

### v1.0.0 (2025-11-18)
- 초기 릴리즈
- Moodle 3.7 연동
- 기본 인지 평가 기능
- 회복력 측정 및 분석
- 대시보드 UI
