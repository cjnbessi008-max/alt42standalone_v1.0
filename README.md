# Focus Tracking Learning Management System (LMS)

## 📖 Overview

독립형 웹 기반 학습 관리 시스템으로, **고난도 콘텐츠에서도 안정적인 집중 상태 유지**를 추적하고 점수화합니다.

## 🎯 Core Features

### 1. 집중도 추적 (Focus Tracking)
- **페이지 포커스 모니터링**: window focus/blur 이벤트 추적
- **마우스 활동 분석**: 클릭 패턴, 이동 경로
- **키보드 활동 감지**: 입력 이벤트 타이밍
- **시간 측정**: 문제별 소요 시간 정밀 추적
- **스크롤 패턴**: 문제 읽기 행동 분석

### 2. 난이도 적응형 점수 시스템
- **5단계 난이도**: Level 1 (기초) ~ Level 5 (고급)
- **안정성 지수**: 고난도에서도 일정한 집중도 유지 측정
- **가중치 알고리즘**: 난이도별 차등 점수 부여
- **정확도 보너스**: 정답률 기반 추가 점수

### 3. 실시간 대시보드
- **학생 뷰**: 실시간 집중도 그래프, 학습 통계
- **교사 뷰**: 학급 전체 분석, 개별 학생 모니터링
- **히스토리**: 세션별 상세 기록

## 🏗️ Architecture

```
/alt42standalone_v1.0
├── /public                 # 웹 루트
│   ├── index.html         # 학생 학습 인터페이스
│   ├── dashboard.html     # 교사 대시보드
│   ├── /css
│   │   ├── bootstrap.min.css
│   │   └── style.css
│   ├── /js
│   │   ├── focus-tracker.js    # 집중도 추적 라이브러리
│   │   ├── scoring.js          # 점수 계산 알고리즘
│   │   └── dashboard.js        # 대시보드 UI
│   └── /api               # PHP REST API
│       ├── config.php
│       ├── db.php
│       ├── sessions.php
│       ├── problems.php
│       └── analytics.php
├── /database
│   └── schema.sql         # MySQL 스키마
├── /config
│   └── config.example.php
└── README.md
```

## 💾 Database Schema

### Core Tables
- `users` - 학생/교사 정보
- `learning_sessions` - 학습 세션
- `problems` - 문제 은행 (난이도별)
- `focus_events` - 집중도 이벤트 로그
- `session_scores` - 세션별 점수 및 통계
- `focus_metrics` - 집중도 메트릭 집계

## 🧮 Scoring Algorithm

```
집중도 점수 = (활동 시간 / 총 시간) × 난이도 계수 × 정확도 보너스

안정성 지수 = 1 / σ(집중도 변동)
  - 고난도에서도 집중도 편차가 작을수록 높은 점수

최종 점수 = (집중도 점수 × 0.6) + (안정성 지수 × 0.2) + (정답률 × 0.2)
```

### 난이도 계수
- Level 1: 1.0x
- Level 2: 1.2x
- Level 3: 1.5x
- Level 4: 1.8x
- Level 5: 2.0x (고난도)

## 💻 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Server**: Apache 2.4+ (mod_rewrite required)
- **Architecture**: RESTful API

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and start
git clone <repository-url>
cd alt42standalone_v1.0
docker-compose up -d

# Access at http://localhost:8000
```

**Default Login:**
- Student: `student1` / `password123`
- Teacher: `teacher1` / `password123`

### Option 2: Manual Installation

📖 **See detailed installation guide**: [INSTALL.md](INSTALL.md)

**Quick steps:**
```bash
# 1. Clone repository
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Setup database
mysql -u root -p < database/schema.sql

# 3. Configure
cp config/config.example.php public/api/config.php
# Edit public/api/config.php with your credentials

# 4. Start web server (point to /public directory)
```

**Access:**
- Student interface: `http://localhost:8000/`
- Teacher dashboard: `http://localhost:8000/dashboard.html`
- Login page: `http://localhost:8000/login.html`

## 📊 API Endpoints

### Sessions
- `POST /api/sessions.php` - 새 학습 세션 시작
- `PUT /api/sessions.php` - 세션 종료
- `GET /api/sessions.php?user_id={id}` - 세션 목록

### Focus Tracking
- `POST /api/focus-events.php` - 집중도 이벤트 기록
- `GET /api/analytics.php?session_id={id}` - 세션 분석

### Problems
- `GET /api/problems.php?difficulty={level}` - 난이도별 문제 가져오기
- `POST /api/problems.php` - 답안 제출 및 채점

## 🎓 Usage Example

### Student Learning Flow
1. 로그인 → 세션 시작
2. 난이도 선택 (1-5)
3. 문제 풀이 (집중도 자동 추적)
4. 답안 제출
5. 실시간 피드백 확인
6. 세션 종료 → 종합 리포트

### Teacher Monitoring
1. 대시보드 접속
2. 실시간 학생 모니터링
3. 집중도 패턴 분석
4. 난이도별 성과 비교
5. 개별 피드백 생성

## 🔒 Security Features
- PDO prepared statements (SQL injection 방지)
- XSS 필터링
- CSRF 토큰
- 세션 관리

## 📈 Future Enhancements
- [ ] Moodle LTI 연동
- [ ] Eye-tracking 하드웨어 지원
- [ ] AI 기반 난이도 추천
- [ ] 모바일 앱
- [ ] 멀티플레이어 학습 모드

## 📝 License
MIT License

## 👥 Contributors
- KAIST Touch Math Academy
- AI Education Pipeline Team
