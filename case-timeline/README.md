# Case Timeline - Virtual Smartphone App

의료 케이스나 시나리오를 타임라인 형태로 시각화하는 가상 스마트폰 앱입니다. Moodle 3.7 LMS와 연동되어 학습자들이 케이스를 단계별로 학습할 수 있습니다.

## 주요 기능

### 1. 가상 스마트폰 UI
- 우측 하단에 배치되는 실감나는 스마트폰 프레임
- 상태바, 배터리, 시그널 표시
- 반응형 디자인

### 2. 타임라인 시각화
- 케이스 이벤트를 타임라인 형태로 순차적 표시
- 각 이벤트의 완료 상태 추적
- 시각적 진행 표시기

### 3. 인터랙티브 학습
- 질문-응답 형식의 인터랙티브 이벤트
- 실시간 피드백 제공
- 점수 계산 및 추적

### 4. 이벤트 타입
- **Symptom** (증상): 환자의 증상 정보
- **Diagnosis** (진단): 진단 과정 및 결과
- **Treatment** (치료): 치료 방법 및 절차
- **Outcome** (결과): 치료 결과
- **Question** (질문): 학습자에게 질문
- **Information** (정보): 일반 정보 제공

### 5. Moodle 연동
- Moodle 3.7 활동 모듈로 통합
- 사용자 인증 연동
- 성적 관리 시스템 연동

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **아키텍처**: RESTful API

### 프론트엔드
- **HTML5/CSS3**
- **JavaScript** (Vanilla JS, ES6+)
- **반응형 디자인**

### LMS
- **Moodle**: 3.7

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE case_timeline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'ct_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON case_timeline.* TO 'ct_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
USE case_timeline;
SOURCE /path/to/case-timeline/database/schema.sql;
```

### 2. 백엔드 설정

```bash
# 백엔드 파일을 웹 서버 디렉토리로 복사
cp -r case-timeline/backend /var/www/html/case-timeline/backend

# 데이터베이스 설정 파일 수정
nano /var/www/html/case-timeline/backend/config/database.php
```

`database.php` 파일에서 다음 항목을 수정:
```php
private $host = "localhost";
private $db_name = "case_timeline";
private $username = "ct_user";
private $password = "your_password";
```

### 3. 프론트엔드 설정

```bash
# 프론트엔드 파일을 웹 서버 디렉토리로 복사
cp -r case-timeline/frontend /var/www/html/case-timeline/frontend

# API 엔드포인트 설정 파일 수정
nano /var/www/html/case-timeline/frontend/js/config.js
```

`config.js` 파일에서 API URL 수정:
```javascript
API_BASE_URL: 'http://your-domain.com/case-timeline/backend/api'
```

### 4. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성
mkdir -p mod/casetimeline

# 플러그인 파일 복사
cp -r /path/to/case-timeline/moodle-plugin/* mod/casetimeline/

# 권한 설정
chown -R www-data:www-data mod/casetimeline
chmod -R 755 mod/casetimeline
```

Moodle 관리자 페이지에서:
1. `Site administration` → `Notifications` 접속
2. 플러그인 설치 완료

### 5. 웹 서버 설정 (Apache)

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    <Directory /var/www/html/case-timeline>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

Apache 재시작:
```bash
sudo systemctl restart apache2
```

## 사용 방법

### 1. 케이스 생성

데이터베이스에 직접 케이스를 추가하거나, 제공된 샘플 데이터를 사용할 수 있습니다.

```sql
-- 새 케이스 추가 예시
INSERT INTO ct_cases (moodle_course_id, title, description, category, difficulty_level, total_duration, status, created_by)
VALUES (1, '급성 충수염 케이스', '25세 남성 환자의 급성 충수염 진단 및 치료 과정', 'Emergency Medicine', 'intermediate', 45, 'published', 1);

-- 케이스 ID 확인
SET @case_id = LAST_INSERT_ID();

-- 타임라인 이벤트 추가
INSERT INTO ct_events (case_id, event_order, event_time, title, content, event_type, is_interactive, requires_response, points)
VALUES
(@case_id, 1, 'Day 1, 08:00', '환자 도착', '25세 남성 환자가 6시간 전부터 시작된 복통을 호소하며 응급실에 내원했습니다.', 'symptom', FALSE, FALSE, 0),
(@case_id, 2, 'Day 1, 08:15', '초기 평가', '활력징후: BP 130/85, HR 95, 체온 38.2°C, RR 18. 환자는 불편해 보이며 복부를 보호하고 있습니다.', 'symptom', FALSE, FALSE, 0);
```

### 2. Moodle에서 활동 추가

1. Moodle 코스에 로그인
2. `Turn editing on` 클릭
3. `Add an activity or resource` 선택
4. `Case Timeline` 선택
5. 다음 정보 입력:
   - **Name**: 활동 이름
   - **Description**: 활동 설명
   - **Case ID**: 표시할 케이스 ID
   - **Grade**: 최대 점수 (선택사항)
6. `Save and display` 클릭

### 3. 학습자 경험

학습자가 활동에 접속하면:
1. 우측 하단에 가상 스마트폰이 표시됨
2. 타임라인에서 첫 번째 이벤트부터 시작
3. 각 이벤트를 클릭하여 상세 내용 확인
4. 인터랙티브 질문에 답변
5. 피드백 확인 후 다음 이벤트로 진행
6. 모든 이벤트 완료 시 최종 점수 확인

## 프로젝트 구조

```
case-timeline/
├── backend/                    # PHP 백엔드
│   ├── api/                   # REST API 엔드포인트
│   │   ├── get_cases.php     # 케이스 목록 조회
│   │   ├── get_case.php      # 케이스 상세 조회
│   │   └── progress.php      # 진행상황 관리
│   ├── models/                # 데이터 모델
│   │   ├── Case.php          # 케이스 모델
│   │   ├── Event.php         # 이벤트 모델
│   │   └── UserProgress.php  # 진행상황 모델
│   └── config/                # 설정 파일
│       └── database.php      # DB 연결 설정
├── frontend/                  # 프론트엔드
│   ├── app/                  # 메인 앱
│   │   └── index.html        # 메인 HTML
│   ├── css/                  # 스타일시트
│   │   ├── smartphone.css    # 스마트폰 UI
│   │   └── timeline.css      # 타임라인 스타일
│   └── js/                   # JavaScript
│       ├── config.js         # 설정
│       ├── timeline.js       # 타임라인 로직
│       └── app.js            # 앱 로직
├── database/                  # 데이터베이스
│   └── schema.sql            # DB 스키마
├── moodle-plugin/            # Moodle 플러그인
│   ├── version.php           # 플러그인 버전 정보
│   ├── lib.php               # 핵심 함수
│   └── view.php              # 뷰 페이지
└── README.md                 # 이 파일
```

## API 엔드포인트

### GET /api/get_cases.php
코스의 케이스 목록을 조회합니다.

**Parameters:**
- `course_id` (required): Moodle 코스 ID

**Response:**
```json
{
  "cases": [
    {
      "id": 1,
      "title": "케이스 제목",
      "description": "케이스 설명",
      "category": "Emergency Medicine",
      "difficulty_level": "intermediate",
      "total_duration": 45,
      "status": "published"
    }
  ],
  "total": 1
}
```

### GET /api/get_case.php
특정 케이스의 상세 정보와 이벤트를 조회합니다.

**Parameters:**
- `id` (required): 케이스 ID

**Response:**
```json
{
  "id": 1,
  "title": "케이스 제목",
  "description": "케이스 설명",
  "total_points": 25,
  "total_events": 8,
  "events": [
    {
      "id": 1,
      "event_order": 1,
      "event_time": "Day 1, 08:00",
      "title": "이벤트 제목",
      "content": "이벤트 내용",
      "event_type": "symptom",
      "is_interactive": false,
      "requires_response": false,
      "points": 0
    }
  ]
}
```

### GET /api/progress.php
사용자의 진행상황을 조회합니다.

**Parameters:**
- `user_id` (required): 사용자 ID
- `case_id` (required): 케이스 ID

### POST /api/progress.php
인터랙티브 이벤트에 대한 응답을 제출합니다.

**Body:**
```json
{
  "progress_id": 1,
  "event_id": 3,
  "response": "사용자 답변",
  "time_spent": 120
}
```

### PUT /api/progress.php
진행상황을 업데이트합니다.

**Body:**
```json
{
  "progress_id": 1,
  "event_id": 4,
  "status": "in_progress"
}
```

## 커스터마이징

### 스마트폰 UI 커스터마이징

`frontend/css/smartphone.css` 파일에서 다음 항목을 수정할 수 있습니다:
- 스마트폰 크기: `.smartphone-frame` 클래스
- 배경 그라데이션: `body` 태그
- 헤더 색상: `.app-header` 클래스

### 타임라인 스타일 커스터마이징

`frontend/css/timeline.css` 파일에서:
- 이벤트 타입별 색상: `.event-type-badge.*` 클래스
- 타임라인 라인 색상: `.timeline-events::before`
- 이벤트 마커 스타일: `.event-marker`

## 문제 해결

### 데이터베이스 연결 오류
```
Connection error: SQLSTATE[HY000] [1045] Access denied
```
**해결방법**: `backend/config/database.php`에서 데이터베이스 자격 증명을 확인하세요.

### API 호출 실패 (CORS 오류)
```
Access to fetch has been blocked by CORS policy
```
**해결방법**: 백엔드 API 파일들이 이미 CORS 헤더를 포함하고 있습니다. 웹 서버 설정을 확인하세요.

### 스마트폰이 표시되지 않음
**해결방법**:
1. CSS 파일 경로 확인
2. 브라우저 콘솔에서 에러 확인
3. `frontend/js/config.js`의 API URL 확인

## 라이선스

GPL v3 or later

## 지원 및 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해 주세요.

## 업데이트 히스토리

### v1.0 (2025-01-18)
- 초기 릴리스
- 가상 스마트폰 UI
- 타임라인 시각화
- Moodle 3.7 연동
- MySQL 5.7, PHP 7.1.9 지원
