# 불안정한 개념 감지 시스템

정답을 맞췄더라도 불안정하게 이해한 개념을 자동으로 감지하는 독립형 웹 애플리케이션

## 📋 개요

학생이 문제를 맞췄더라도 다음과 같은 지표를 통해 개념 이해의 불안정성을 감지합니다:

- ⏱️ **과도한 소요 시간**: 정답을 맞췄지만 평균보다 2배 이상 시간이 걸린 경우
- 🔄 **여러 번의 시도**: 여러 번 시도 후 정답을 맞춘 경우
- 📉 **퇴행 패턴**: 이전에 맞췄던 문제를 나중에 틀리는 경우
- ⚡ **시간 불일치**: 같은 유형의 문제를 푸는데 걸리는 시간이 일관되지 않은 경우
- 😰 **낮은 자신감**: 정답을 맞췄지만 자신감이 낮은 경우

## 🎯 주요 기능

### 교사용 대시보드
- 전체 학생 현황 모니터링
- 불안정한 개념을 가진 학생 실시간 알림
- 개념별 어려움 분석
- 학생별 상세 리포트

### 학생용 대시보드
- 개인별 학습 현황 확인
- 복습이 필요한 개념 추천
- 개념별 이해도 시각화
- 맞춤형 학습 방법 제안

### 자동 분석 시스템
- 실시간 안정성 점수 계산 (0-100점)
- 다차원 지표 기반 분석
- 권장 조치 자동 제안

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML/CSS + Vanilla JavaScript
- **Architecture**: REST API

## 📦 설치 방법

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- PDO MySQL 확장 모듈

### 2. 설치 단계

#### 2.1 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2.2 환경 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 정보 입력:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=unstable_concept_detector
DB_USER=root
DB_PASS=your_password
```

#### 2.3 데이터베이스 설치

```bash
php src/database/install.php
```

성공 시 다음과 같은 메시지가 표시됩니다:
```
✓ Connected to MySQL server
✓ Database created or already exists
✓ Schema installed successfully
Installation completed successfully!
```

#### 2.4 웹 서버 설정

**Apache의 경우** (`httpd.conf` 또는 가상 호스트 설정):

```apache
<VirtualHost *:80>
    ServerName unstable-concept-detector.local
    DocumentRoot /path/to/alt42standalone_v1.0/src

    <Directory /path/to/alt42standalone_v1.0/src>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Nginx의 경우** (`nginx.conf`):

```nginx
server {
    listen 80;
    server_name unstable-concept-detector.local;
    root /path/to/alt42standalone_v1.0/src;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

#### 2.5 웹 서버 재시작

```bash
# Apache
sudo systemctl restart apache2

# Nginx
sudo systemctl restart nginx
```

### 3. 접속

브라우저에서 접속:

- **교사 대시보드**: `http://localhost/frontend/views/teacher-dashboard.html`
- **학생 대시보드**: `http://localhost/frontend/views/student-dashboard.html`

### 4. 테스트 계정

설치 시 다음 샘플 데이터가 자동으로 생성됩니다:

**교사 계정**:
- 이메일: `teacher@example.com`
- 비밀번호: `password`

**샘플 학생**:
- 홍길동 (3학년)
- 김영희 (3학년)
- 이철수 (4학년)

**샘플 개념**:
- 분수의 기본 개념
- 분수의 덧셈
- 분수의 뺄셈
- 곱셈 구구단 등

## 📚 사용 방법

### 1. 학생 응답 기록하기

API를 통해 학생 응답을 기록하면 자동으로 안정성 분석이 수행됩니다:

```javascript
// POST /backend/api.php/responses
{
    "student_id": 1,
    "problem_id": 2,
    "answer": "3/4",
    "is_correct": true,
    "time_spent_seconds": 180,  // 3분 소요
    "attempt_number": 1,
    "confidence_level": 2        // 1-5 점 (낮음)
}
```

### 2. 안정성 점수 확인

```javascript
// GET /backend/api.php/stability?student_id=1
{
    "unstable_concepts": [
        {
            "concept_name": "분수의 덧셈",
            "stability_score": 45.5,
            "accuracy_rate": 80.0,
            "recommended_action": "guided_practice"
        }
    ]
}
```

### 3. 대시보드 사용

#### 교사 대시보드
1. 전체 통계 확인
2. 최근 경고 알림 확인
3. 주의가 필요한 학생 확인
4. 학생 상세 정보 클릭하여 개별 분석

#### 학생 대시보드
1. 학생 선택
2. 복습이 필요한 개념 확인
3. 개념별 이해도 확인
4. 권장 학습 방법 확인

## 🧮 안정성 점수 계산 방법

시스템은 다음 지표를 종합하여 0-100점 안정성 점수를 계산합니다:

| 지표 | 설명 | 가중치 |
|------|------|--------|
| **정확도** | 정답률 | 30% |
| **시간 일관성** | 문제 풀이 시간의 변동성 | 10점 감점 (높은 변동성) |
| **과도한 소요 시간** | 평균의 2배 이상 시간 소요 | 최대 20점 감점 |
| **다중 시도** | 여러 번 시도 후 정답 | 시도당 5점 감점 |
| **퇴행 패턴** | 이전 정답 → 현재 오답 | 건당 15점 감점 |
| **낮은 자신감** | 자신감 레벨 1-2 | 15점 감점 |

**점수 기준**:
- **60점 이상**: 안정적 이해 ✅
- **40-59점**: 복습 필요 ⚠️
- **40점 미만**: 집중 학습 필요 🔴

## 🔧 API 엔드포인트

### 응답 기록
- `POST /backend/api.php/responses` - 학생 응답 제출

### 안정성 분석
- `GET /backend/api.php/stability?student_id={id}` - 학생의 불안정한 개념
- `GET /backend/api.php/stability?concept_id={id}` - 개념에 어려움을 겪는 학생

### 학생 정보
- `GET /backend/api.php/students` - 전체 학생 목록
- `GET /backend/api.php/students/{id}` - 학생 상세 정보

### 개념 정보
- `GET /backend/api.php/concepts` - 전체 개념 목록
- `GET /backend/api.php/concepts/{id}` - 개념 상세 정보

### 대시보드
- `GET /backend/api.php/dashboard/teacher` - 교사 대시보드 데이터

## 🔍 문제 해결

### 데이터베이스 연결 오류

```
Database Error: SQLSTATE[HY000] [2002] Connection refused
```

**해결 방법**:
1. MySQL 서버가 실행 중인지 확인
2. `.env` 파일의 데이터베이스 정보 확인
3. MySQL 사용자 권한 확인

### API 호출 실패

```
Error loading dashboard data
```

**해결 방법**:
1. 브라우저 개발자 도구 → 네트워크 탭 확인
2. API 경로가 올바른지 확인 (`../backend/api.php`)
3. PHP 오류 로그 확인

### 빈 데이터 표시

**해결 방법**:
1. 데이터베이스 설치 확인: `php src/database/install.php`
2. 샘플 데이터 확인: MySQL에서 `SELECT * FROM students;`

## 📈 향후 개선 계획

- [ ] Moodle LMS 연동 (LTI)
- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 머신러닝 기반 예측 모델
- [ ] 학습 경로 자동 추천
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 교사 인증 시스템
- [ ] 상세 분석 리포트 PDF 내보내기

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 개발자

KAIST Touch Math Academy - AI Education System Pipeline

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
