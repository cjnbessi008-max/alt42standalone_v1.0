# Moodle DMN Dropout Detection System

학습 중 DMN(Default Mode Network) 이탈 신호를 감지하는 Moodle LMS 연동 시스템

## 시스템 개요

이 시스템은 학습자가 학습 활동 중 집중력을 잃고 DMN(기본 모드 네트워크)으로 전환되는 신호를 실시간으로 감지합니다.

### 주요 기능

1. **실시간 행동 추적**
   - 마우스/키보드 활동 모니터링
   - 페이지 가시성 추적 (탭 전환 감지)
   - 클릭 패턴 및 스크롤 행동 분석

2. **DMN 이탈 신호 감지**
   - 비활성 시간 초과 (5분 이상)
   - 페이지 이탈 빈도 측정
   - 문제 풀이 시간 패턴 분석
   - 오답률 급증 감지
   - 무작위/반복 클릭 패턴 인식

3. **Moodle LMS 연동**
   - Moodle Web Services API 통합
   - 학생/코스/활동 데이터 동기화
   - 플러그인 방식 설치 지원

4. **교사 알림 시스템**
   - 실시간 이탈 신호 알림
   - 학생별 집중도 대시보드
   - 이탈 패턴 리포트 생성

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Moodle LMS (3.7)                         │
│                    MySQL 5.7 / PHP 7.1.9                     │
└───────────────────┬─────────────────────────────────────────┘
                    │ Web Services API
┌───────────────────▼─────────────────────────────────────────┐
│              DMN Detection API Gateway (Python)              │
│  - Authentication                                            │
│  - Data Collection                                           │
│  - Real-time Analysis                                        │
└───────┬──────────────────────────┬──────────────────────────┘
        │                          │
┌───────▼────────┐      ┌──────────▼─────────────┐
│  Student       │      │   Analysis Engine      │
│  Browser       │      │   - Pattern Detection  │
│  (JS Tracker)  │      │   - Alert Generation   │
└────────────────┘      │   - Statistics         │
                        └────────┬───────────────┘
                                 │
                        ┌────────▼───────────────┐
                        │   MySQL Database       │
                        │   - Behavior Logs      │
                        │   - Dropout Events     │
                        │   - Analytics Data     │
                        └────────────────────────┘
```

## 기술 스택

### 프론트엔드
- **JavaScript (ES6+)**: 학생 행동 추적
- **Vanilla JS**: Moodle 호환성 최대화

### 백엔드
- **Python 3.8+**: 분석 엔진 및 API
- **Flask/FastAPI**: RESTful API
- **MySQL Connector**: 데이터베이스 연동

### 데이터베이스
- **MySQL 5.7**: 행동 데이터 저장
- **InnoDB Engine**: 트랜잭션 지원

### Moodle 통합
- **Moodle Web Services API**: 데이터 동기화
- **PHP 7.1.9**: Moodle 플러그인 (선택적)
- **REST Protocol**: API 통신

## 디렉토리 구조

```
moodle-dmn-detection/
├── README.md                       # 이 파일
├── docs/                           # 문서
│   ├── architecture.md             # 아키텍처 상세 설계
│   ├── installation.md             # 설치 가이드
│   └── api-reference.md            # API 문서
│
├── frontend/                       # 프론트엔드 추적 스크립트
│   ├── tracker.js                  # 행동 추적 메인 스크립트
│   ├── config.js                   # 설정
│   └── utils.js                    # 유틸리티 함수
│
├── backend/                        # 백엔드 분석 엔진
│   ├── api/                        # API 서버
│   │   ├── app.py                  # Flask/FastAPI 앱
│   │   ├── routes/                 # API 엔드포인트
│   │   │   ├── tracking.py         # 추적 데이터 수집
│   │   │   ├── analysis.py         # 분석 결과 조회
│   │   │   └── alerts.py           # 알림 관리
│   │   └── middleware/             # 미들웨어
│   │       ├── auth.py             # 인증
│   │       └── validation.py       # 데이터 검증
│   │
│   ├── engine/                     # DMN 감지 엔진
│   │   ├── detector.py             # 이탈 신호 감지 로직
│   │   ├── analyzer.py             # 행동 패턴 분석
│   │   ├── alert_manager.py        # 알림 생성 및 관리
│   │   └── models/                 # 데이터 모델
│   │       ├── behavior.py         # 행동 데이터 모델
│   │       ├── dropout_event.py    # 이탈 이벤트 모델
│   │       └── student.py          # 학생 데이터 모델
│   │
│   ├── moodle/                     # Moodle 연동
│   │   ├── client.py               # Moodle API 클라이언트
│   │   ├── sync.py                 # 데이터 동기화
│   │   └── config.py               # Moodle 설정
│   │
│   └── utils/                      # 유틸리티
│       ├── db.py                   # 데이터베이스 헬퍼
│       ├── logger.py               # 로깅
│       └── config.py               # 전역 설정
│
├── database/                       # 데이터베이스
│   ├── schema.sql                  # 스키마 정의
│   ├── migrations/                 # 마이그레이션
│   └── seeds/                      # 초기 데이터
│
├── moodle-plugin/                  # Moodle 플러그인 (선택적)
│   ├── version.php                 # 플러그인 버전 정보
│   ├── lib.php                     # 플러그인 라이브러리
│   ├── settings.php                # 관리자 설정
│   └── lang/                       # 다국어 지원
│       ├── en/                     # 영어
│       └── ko/                     # 한국어
│
├── tests/                          # 테스트
│   ├── frontend/                   # 프론트엔드 테스트
│   ├── backend/                    # 백엔드 테스트
│   └── integration/                # 통합 테스트
│
├── config/                         # 설정 파일
│   ├── config.example.yml          # 설정 예제
│   └── moodle.example.yml          # Moodle 설정 예제
│
└── requirements.txt                # Python 의존성
```

## DMN 이탈 신호 감지 알고리즘

### 1. 비활성 감지 (Inactivity Detection)
```
IF (마우스/키보드 무응답 시간 > 5분)
THEN 이탈 신호 Level 1 (경고)

IF (비활성 시간 > 10분)
THEN 이탈 신호 Level 2 (주의)
```

### 2. 페이지 이탈 감지 (Page Visibility)
```
IF (페이지 숨김 상태 시간 > 2분)
THEN 이탈 신호 Level 1

IF (1시간 내 페이지 이탈 횟수 > 5회)
THEN 이탈 신호 Level 2
```

### 3. 응답 패턴 분석 (Response Pattern)
```
IF (문제 풀이 시간 < 평균의 20%)
THEN 무작위 응답 의심 (이탈 신호 Level 1)

IF (문제 풀이 시간 > 평균의 300%)
THEN 집중력 저하 의심 (이탈 신호 Level 1)
```

### 4. 정확도 패턴 (Accuracy Pattern)
```
IF (최근 5문제 오답률 > 80% AND 이전 평균 오답률 < 30%)
THEN 집중력 저하 의심 (이탈 신호 Level 2)
```

### 5. 클릭 패턴 (Click Pattern)
```
IF (1분 내 동일 위치 클릭 > 10회)
THEN 무의미한 반복 행동 (이탈 신호 Level 1)

IF (30초 내 무작위 위치 클릭 > 20회)
THEN 산만한 행동 (이탈 신호 Level 1)
```

## 설치 방법

### 1. 사전 요구사항
- Moodle 3.7 (MySQL 5.7, PHP 7.1.9)
- Python 3.8+
- MySQL 5.7
- Moodle Web Services 활성화

### 2. 데이터베이스 설정
```bash
mysql -u root -p < database/schema.sql
```

### 3. 백엔드 설치
```bash
cd backend
pip install -r ../requirements.txt
cp ../config/config.example.yml ../config/config.yml
# config.yml 편집하여 Moodle 및 DB 정보 입력
python api/app.py
```

### 4. Moodle 설정
1. Moodle 관리자 페이지 접속
2. Site Administration > Plugins > Web services > Manage protocols
3. REST protocol 활성화
4. Web service 토큰 생성

### 5. 프론트엔드 스크립트 삽입
Moodle 테마 또는 활동 페이지에 추적 스크립트 추가:
```html
<script src="frontend/tracker.js"></script>
<script>
  DMNTracker.init({
    apiEndpoint: 'http://your-api-server.com/api',
    studentId: '<?php echo $USER->id; ?>',
    courseId: '<?php echo $COURSE->id; ?>'
  });
</script>
```

## API 엔드포인트

### 추적 데이터 수집
```
POST /api/track
Content-Type: application/json

{
  "student_id": 123,
  "course_id": 456,
  "activity_id": 789,
  "event_type": "mouse_inactive",
  "duration": 300,
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### 이탈 이벤트 조회
```
GET /api/dropout-events?student_id=123&course_id=456
```

### 실시간 알림 구독 (WebSocket)
```
WS /api/alerts/subscribe?teacher_id=999
```

## 사용 예제

### 교사 대시보드에서 확인
```python
# 특정 학생의 집중도 확인
GET /api/students/123/engagement-score

Response:
{
  "student_id": 123,
  "engagement_score": 0.72,  # 0-1 범위
  "dropout_events_today": 3,
  "average_focus_time": "18.5 minutes",
  "last_dropout": "2025-11-18T14:23:00Z"
}
```

### 실시간 알림 수신
```javascript
const ws = new WebSocket('ws://api-server.com/api/alerts/subscribe?teacher_id=999');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log(`학생 ${alert.student_name}의 집중도 저하 감지: ${alert.reason}`);
  // UI에 알림 표시
};
```

## 보안 고려사항

1. **데이터 암호화**: 전송 중 데이터는 HTTPS/WSS 사용
2. **인증**: Moodle 토큰 기반 인증
3. **개인정보 보호**: 학생 식별 정보는 해시 처리 옵션
4. **접근 제어**: 교사는 자신의 수업 학생 데이터만 접근 가능

## 라이선스

MIT License

## 기여

기여를 환영합니다! Pull Request를 제출해주세요.

## 지원

문의사항이 있으시면 이슈를 등록해주세요.
