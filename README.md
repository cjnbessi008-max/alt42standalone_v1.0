# 🧠 Cognitive Pause Visualization System

AI 기반 학습 분석 시스템 - Moodle LMS와 통합된 인지 멈춤 추적 및 시각화 도구

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Moodle](https://img.shields.io/badge/Moodle-3.7+-blue.svg)](https://moodle.org/)
[![PHP](https://img.shields.io/badge/PHP-7.1.9+-purple.svg)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-orange.svg)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

## 📖 개요

**Cognitive Pause Visualization System**은 학습자가 문제를 풀 때 발생하는 "인지 멈춤(Cognitive Pause)"을 실시간으로 감지하고 분석하여, 교육자에게 학습 과정에 대한 깊은 통찰을 제공하는 시스템입니다.

### 🎯 주요 목표

- ✅ **학습 과정 가시화**: 학생이 어디서 멈추고 고민하는지 파악
- ✅ **조기 개입**: 어려움을 겪는 학생을 조기에 식별하여 지원
- ✅ **문제 품질 개선**: 문제 난이도를 객관적으로 평가하고 개선
- ✅ **개인화 학습**: 학생별 학습 패턴을 이해하여 맞춤형 지도

## 🌟 주요 기능

### 1. 실시간 멈춤 추적

```
학습자의 활동 모니터링 → 멈춤 감지 → 유형 분류 → 데이터 저장
```

- **자동 감지**: 키보드, 마우스, 스크롤 활동 모니터링
- **유형 분류**: 사고, 혼란, 산만함, 재독으로 자동 분류
- **비침습적**: 학습자의 학습 흐름을 방해하지 않음

### 2. 다양한 시각화

| 시각화 유형 | 용도 |
|------------|------|
| 🗺️ **히트맵** | 문제별/시간별 멈춤 패턴 |
| 📊 **타임라인** | 개별 학습 과정 추적 |
| 📈 **분포도** | 멈춤 유형 분포 분석 |
| 🎯 **난이도 차트** | 문제별 난이도 비교 |

### 3. 학생 프로필링

```javascript
{
  learningStyle: "Deep Thinker",
  cognitiveLoad: 55.3,
  strugglingQuestions: 3,
  atRisk: false,
  recommendedInterventions: [
    "Allow extended time on assessments"
  ]
}
```

### 4. 선생님 대시보드

- 📊 **Overview**: 전체 통계 및 트렌드
- ⚠️ **At-Risk Students**: 위험 학생 모니터링
- 📝 **Question Analysis**: 문제 난이도 분석
- 👤 **Student Details**: 개별 학생 심층 분석

## 🚀 빠른 시작

### 필수 요구사항

```bash
Moodle: 3.7+
MySQL:  5.7+
PHP:    7.1.9+
```

### 설치 (3단계)

#### 1️⃣ 데이터베이스 설치

```bash
mysql -u root -p moodle < database/schema/cognitive_pause_tracking.sql
```

#### 2️⃣ Moodle 플러그인 설치

```bash
cd /var/www/html/moodle
cp -r /path/to/moodle-plugin/local/cogpause local/
chown -R www-data:www-data local/cogpause
```

Moodle 관리자 페이지에서 플러그인 설치 완료

#### 3️⃣ 설정

**사이트 관리 > 플러그인 > Cognitive Pause Tracking**

```
✓ 멈춤 추적 활성화
  멈춤 기준 시간: 3000ms
  사고 기준: 5000ms
  혼란 기준: 15000ms
```

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── schema/
│       └── cognitive_pause_tracking.sql     # MySQL 스키마
├── moodle-plugin/
│   └── local/
│       └── cogpause/
│           ├── version.php                  # 플러그인 정보
│           ├── lib.php                      # 핵심 라이브러리
│           ├── ajax.php                     # AJAX 엔드포인트
│           ├── lang/                        # 다국어 지원
│           │   ├── en/                      # 영어
│           │   └── ko/                      # 한국어
│           └── amd/
│               └── src/
│                   └── pause_tracker.js     # JavaScript 추적기
├── frontend/
│   └── src/
│       └── components/
│           └── CognitivePause/
│               ├── TeacherDashboard.jsx     # 선생님 대시보드
│               ├── PauseHeatmap.jsx         # 히트맵
│               ├── PauseTimeline.jsx        # 타임라인
│               ├── StudentCognitiveProfile.jsx  # 학생 프로필
│               └── QuestionDifficultyChart.jsx  # 난이도 차트
├── docs/
│   └── COGNITIVE_PAUSE_INTEGRATION_GUIDE.md # 통합 가이드
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md   # PRD 문서
└── README.md                                # 이 파일
```

## 📊 시스템 아키텍처

```
┌─────────────────────┐
│   Moodle LMS        │
│   (PHP 7.1.9)       │
│                     │
│  ┌───────────────┐ │
│  │  Quiz Module  │ │
│  └───────┬───────┘ │
│          │         │
│  ┌───────▼───────┐ │
│  │  CogPause     │ │
│  │  Plugin       │ │
│  │  (JavaScript) │ │
│  └───────┬───────┘ │
└──────────┼─────────┘
           │
           │ AJAX
           │
┌──────────▼─────────┐
│   MySQL 5.7        │
│                    │
│  • pause_events    │
│  • analytics       │
│  • patterns        │
│  • profiles        │
└──────────┬─────────┘
           │
           │ REST API
           │
┌──────────▼─────────┐
│  React Dashboard   │
│  (D3.js Viz)       │
└────────────────────┘
```

## 🔧 기술 스택

### Backend
- **Moodle**: 3.7+ (PHP 7.1.9)
- **Database**: MySQL 5.7
- **API**: RESTful JSON API

### Frontend
- **Framework**: React 18+
- **Visualization**: D3.js 7+
- **State Management**: React Hooks
- **HTTP Client**: Axios

### JavaScript Tracking
- **Module System**: AMD (Moodle standard)
- **Event Handling**: Native DOM Events
- **Storage**: AJAX → MySQL

## 📈 사용 예시

### 학생 관점

```javascript
// 자동으로 실행됨 - 학생은 평소처럼 퀴즈 풀기
// 백그라운드에서 멈춤 추적 진행
```

### 선생님 관점

```javascript
// 대시보드에서 확인
GET /api/cogpause/at-risk-students?courseId=10

// Response:
[
  {
    "userId": 42,
    "avgCognitiveLoad": 78.5,
    "strugglingLearner": true,
    "recommendedInterventions": [
      "Schedule one-on-one meeting",
      "Provide additional resources"
    ]
  }
]
```

## 📖 문서

- 📘 [통합 가이드](docs/COGNITIVE_PAUSE_INTEGRATION_GUIDE.md) - 자세한 설치 및 설정 가이드
- 📗 [API 문서](docs/COGNITIVE_PAUSE_INTEGRATION_GUIDE.md#api-문서) - REST API 레퍼런스
- 📙 [PRD](tasks/0001-prd-ai-education-pipeline.md) - 제품 요구사항 문서

## 🎓 사용 사례

### 1. 조기 개입

```
학생 A가 문제 5에서 30초 이상 멈춤
→ 시스템이 "혼란" 상태로 분류
→ 선생님 대시보드에 알림
→ 선생님이 힌트 제공 또는 개별 지도
```

### 2. 문제 개선

```
문제 7의 평균 멈춤 점수: 82.5 (매우 높음)
→ 대부분의 학생이 혼란 겪음
→ 문제 문구가 불명확하다고 판단
→ 문제 수정 또는 힌트 추가
```

### 3. 학습 스타일 파악

```
학생 B: Deep Thinker
- 평균 멈춤 시간: 8.2초
- 멈춤 횟수: 적음
- 정확도: 높음
→ 충분한 시간을 주면 우수한 성과
→ 시험 시간 연장 추천
```

## 🧪 테스트

```bash
# 데이터베이스 연결 테스트
mysql -u root -p moodle -e "SELECT COUNT(*) FROM cognitive_pause_events;"

# 플러그인 활성화 확인
php admin/cli/cfg.php --name=enable_tracking --component=local_cogpause

# JavaScript 추적기 테스트
# 브라우저 콘솔에서:
console.log(window.cogPauseTracker);
```

## 🐛 트러블슈팅

### 문제: 추적이 작동하지 않음

```bash
# 1. 플러그인 활성화 확인
SELECT * FROM mdl_config_plugins
WHERE plugin='local_cogpause' AND name='enable_tracking';

# 2. JavaScript 로드 확인 (브라우저 콘솔)
console.log(window.cogPauseTracker);

# 3. AMD 모듈 재빌드
php admin/cli/grunt.php amd
```

더 자세한 내용은 [통합 가이드](docs/COGNITIVE_PAUSE_INTEGRATION_GUIDE.md#트러블슈팅)를 참조하세요.

## 📊 성능

- **추적 오버헤드**: < 0.1% CPU
- **네트워크**: 10초마다 배치 전송 (~1KB)
- **데이터베이스**: 학생당/퀴즈당 ~50 레코드
- **대시보드 로딩**: < 2초 (100명 학생 기준)

## 🔒 보안 및 프라이버시

- ✅ **GDPR 준수**: 학생 동의 및 데이터 삭제 지원
- ✅ **권한 기반 접근**: Moodle 권한 시스템 통합
- ✅ **데이터 암호화**: HTTPS 필수, DB 암호화 권장
- ✅ **익명화 옵션**: 연구 목적 데이터 익명화 지원

## 🤝 기여

기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 팀

- **Project Lead**: AI Education System Team
- **Contributors**: [Contributors List](https://github.com/your-repo/contributors)

## 📞 지원

- 📧 **Email**: support@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 📚 **Documentation**: [Full Docs](docs/)

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들을 사용합니다:

- [Moodle](https://moodle.org/) - Open-source learning platform
- [React](https://reactjs.org/) - JavaScript library
- [D3.js](https://d3js.org/) - Data visualization library
- [MySQL](https://www.mysql.com/) - Database system

## 📅 로드맵

- [x] **v1.0** - 기본 멈춤 추적 및 시각화
- [ ] **v1.1** - 실시간 알림 및 개입 시스템
- [ ] **v1.2** - AI 기반 멈춤 패턴 분석
- [ ] **v2.0** - 다른 LMS 플랫폼 지원 (Canvas, Blackboard)
- [ ] **v2.1** - 모바일 앱 지원

---

**Made with ❤️ by AI Education System Team**

**Version**: 1.0.0 | **Last Updated**: 2024-11-18
