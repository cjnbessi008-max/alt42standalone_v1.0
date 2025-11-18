# Eye Tracking Attention Detection System for Moodle LMS

## 개요 (Overview)

웹캠 기반 눈 깜빡임 및 시선 패턴 분석을 통해 학습자의 집중도를 실시간 모니터링하고, Moodle LMS와 연동하여 교사에게 학습 집중도 리포트를 제공하는 시스템입니다.

## 시스템 요구사항 (System Requirements)

- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **Moodle**: 3.7+
- **웹 브라우저**: Chrome 60+, Firefox 55+, Edge 79+ (WebRTC 지원 필수)

## 주요 기능 (Key Features)

### 1. 눈 추적 및 분석
- 웹캠 기반 실시간 눈 추적
- 눈 깜빡임 빈도 및 패턴 분석
- 시선 고정 및 이탈 감지
- 얼굴 방향 및 거리 모니터링

### 2. 집중 이탈 감지
- **과도한 눈 깜빡임**: 피로 또는 스트레스 신호
- **눈 깜빡임 부족**: 과집중 또는 화면 응시
- **시선 이탈**: 화면 밖을 주시
- **장시간 비활동**: 자리 이탈 감지
- **불규칙한 패턴**: 주의 분산 신호

### 3. Moodle 연동
- Moodle 활동 중 자동 모니터링
- 교사 대시보드에 집중도 데이터 제공
- 학습 세션별 리포트 생성
- 학생별 집중도 통계

### 4. 프라이버시 보호
- 웹캠 영상은 로컬에서만 처리 (서버 전송 없음)
- 익명화된 메트릭만 저장
- 학생 동의 기반 모니터링

## 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   ├── schema.sql              # MySQL 데이터베이스 스키마
│   └── migrations/             # 데이터베이스 마이그레이션
├── backend/
│   ├── api/                    # RESTful API 엔드포인트
│   │   ├── tracking.php        # 눈 추적 데이터 수신
│   │   ├── attention.php       # 집중도 분석
│   │   └── sessions.php        # 세션 관리
│   ├── models/                 # 데이터 모델
│   ├── services/               # 비즈니스 로직
│   └── config/                 # 설정 파일
├── frontend/
│   ├── js/
│   │   ├── eye-tracker.js      # 눈 추적 메인 모듈
│   │   ├── blink-detector.js   # 깜빡임 감지
│   │   ├── attention-analyzer.js # 집중도 분석
│   │   └── moodle-connector.js # Moodle 연동
│   ├── css/                    # 스타일시트
│   └── libs/                   # 외부 라이브러리
├── moodle-plugin/
│   └── blocks/
│       └── attention_monitor/  # Moodle 블록 플러그인
├── docs/
│   ├── installation.md         # 설치 가이드
│   ├── api-reference.md        # API 문서
│   └── algorithms.md           # 알고리즘 설명
└── tests/                      # 테스트 코드

```

## 기술 스택 (Tech Stack)

### Frontend
- **WebGazer.js**: 웹캠 기반 눈 추적
- **TensorFlow.js**: 얼굴 랜드마크 감지 (대안)
- **Chart.js**: 데이터 시각화
- **Vanilla JavaScript**: 가벼운 클라이언트

### Backend
- **PHP 7.1**: Moodle 호환성
- **MySQL 5.7**: 데이터 저장
- **RESTful API**: JSON 기반 통신

### Integration
- **Moodle Block Plugin**: Moodle 3.7 호환
- **Moodle Web Services**: 데이터 연동

## 설치 방법 (Installation)

자세한 설치 가이드는 [docs/installation.md](docs/installation.md)를 참조하세요.

### 빠른 시작

1. **데이터베이스 설정**
```bash
mysql -u root -p < database/schema.sql
```

2. **백엔드 설정**
```bash
cd backend
cp config/config.sample.php config/config.php
# config.php 파일을 환경에 맞게 수정
```

3. **Moodle 플러그인 설치**
```bash
cp -r moodle-plugin/blocks/attention_monitor [MOODLE_DIR]/blocks/
```

4. **Moodle 관리자 페이지에서 플러그인 활성화**

## 사용 방법 (Usage)

### 학생 (Student)
1. Moodle 코스 페이지 접속
2. "집중도 모니터링" 블록에서 웹캠 권한 허용
3. 학습 활동 시작 - 자동으로 눈 추적 시작

### 교사 (Teacher)
1. 코스 대시보드 접속
2. "학생 집중도" 리포트 확인
3. 개별 학생 또는 전체 통계 조회

## 집중 이탈 감지 알고리즘

### 1. 눈 깜빡임 패턴 분석
- **정상 범위**: 분당 15-20회
- **이탈 신호**:
  - 분당 30회 이상 (피로/스트레스)
  - 분당 5회 이하 (과집중/화면 응시)
  - 불규칙한 간격 (주의 분산)

### 2. 시선 고정 분석
- **화면 내 시선**: 집중 중
- **화면 밖 시선**: 5초 이상 시 경고
- **시선 이동 빈도**: 과도한 이동 시 주의 분산 판단

### 3. 얼굴 방향 및 거리
- **정면 응시**: 집중 중
- **고개 돌림**: 5초 이상 시 이탈 신호
- **화면과의 거리**: 급격한 변화 감지

### 4. 종합 집중도 점수
```
Attention Score = (0.3 × Blink Score) + (0.4 × Gaze Score) + (0.3 × Face Score)
```
- **80-100**: 높은 집중도
- **50-79**: 보통 집중도
- **0-49**: 낮은 집중도 (이탈)

## API 엔드포인트

### POST /api/tracking
눈 추적 데이터 전송
```json
{
  "session_id": "abc123",
  "user_id": 42,
  "timestamp": 1234567890,
  "blink_count": 3,
  "gaze_x": 0.5,
  "gaze_y": 0.5,
  "face_direction": "center",
  "confidence": 0.95
}
```

### GET /api/attention/{session_id}
세션별 집중도 조회
```json
{
  "session_id": "abc123",
  "user_id": 42,
  "attention_score": 85,
  "alerts": [
    {
      "timestamp": 1234567890,
      "type": "gaze_away",
      "duration": 8
    }
  ]
}
```

자세한 API 문서는 [docs/api-reference.md](docs/api-reference.md)를 참조하세요.

## 보안 및 프라이버시

- **HTTPS 필수**: 웹캠 액세스를 위해 HTTPS 연결 필요
- **데이터 최소화**: 눈 추적 영상은 저장하지 않음
- **익명화**: 개인 식별 정보 최소화
- **동의 기반**: 학생 명시적 동의 후 모니터링 시작
- **데이터 보존**: 기본 30일 후 자동 삭제

## 라이선스 (License)

MIT License

## 기여 (Contributing)

버그 리포트 및 기능 제안은 GitHub Issues를 이용해주세요.

## 지원 (Support)

기술 지원이 필요하신 경우 [support@example.com](mailto:support@example.com)으로 문의하세요.

## 변경 이력 (Changelog)

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 웹캠 기반 눈 추적 기능
- 집중 이탈 감지 알고리즘
- Moodle 3.7 연동
- 교사 대시보드
