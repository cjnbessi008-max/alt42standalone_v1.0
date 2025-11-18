# 🎯 Trap Detection LMS (함정 탐지 학습 시스템)

**Moodle LMS 연동 독립형 웹앱**

학생들이 문제를 풀 때 자주 빠지는 "함정"을 자동으로 탐지하고, 개인화된 학습 피드백을 제공하는 지능형 학습 관리 시스템입니다.

## ✨ 주요 기능

### 🔍 자동 함정 탐지
- 학생 답안 패턴 분석을 통한 자동 함정 탐지
- 개념적, 절차적, 계산, 독해, 실수 등 5가지 함정 유형 분류
- 함정 심각도 자동 분류 (낮음, 중간, 높음, 치명적)

### 📊 학생 맞춤 피드백
- 실시간 함정 감지 및 즉각적인 피드백
- 개인화된 학습 추천
- 집중 학습 영역 제시
- 해결 방법 및 힌트 제공

### 👨‍🏫 교사 대시보드
- 전체 학생 함정 통계
- 가장 흔한 함정 목록
- 최근 함정 발생 이력
- 도움 요청 관리

### 🔗 Moodle LTI 연동
- LTI 1.1 표준 지원
- Moodle 3.7 완벽 연동
- 자동 사용자 동기화
- Single Sign-On (SSO)

## 🛠 기술 스택

- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Integration**: LTI 1.1 (Moodle)
- **Architecture**: MVC Pattern

## 📦 시스템 구성

```
trap-detection-lms/
├── config/                 # 설정 파일
│   ├── app.php
│   └── database.php
├── database/              # 데이터베이스 스키마
│   └── schema.sql
├── src/                   # PHP 소스 코드
│   ├── models/           # 데이터 모델
│   │   ├── Database.php
│   │   ├── Question.php
│   │   ├── Trap.php
│   │   ├── StudentAttempt.php
│   │   └── TrapIncident.php
│   └── services/         # 비즈니스 로직
│       └── TrapDetectionService.php
├── public/               # 웹 루트
│   ├── index.php        # 메인 페이지
│   ├── css/             # 스타일시트
│   ├── js/              # JavaScript
│   └── api/             # REST API 엔드포인트
├── moodle-integration/  # Moodle LTI 연동
│   └── lti/
│       ├── launch.php
│       └── lti-validator.php
└── docs/                # 문서
    └── INSTALLATION.md
```

## 🚀 빠른 시작

### 1. 설치

```bash
# 프로젝트 복사
cd /var/www/html
git clone <repository-url> trap-detection-lms

# 데이터베이스 생성
mysql -u root -p < trap-detection-lms/database/schema.sql

# 권한 설정
chmod -R 755 trap-detection-lms/public
```

### 2. 설정

`config/database.php` 파일을 수정하여 데이터베이스 정보를 입력하세요:

```php
return [
    'host' => 'localhost',
    'database' => 'trap_detection_lms',
    'username' => 'root',
    'password' => 'your_password',
];
```

### 3. 웹 브라우저로 접속

```
http://your-domain.com/trap-detection-lms/public/
```

자세한 설치 가이드는 [INSTALLATION.md](docs/INSTALLATION.md)를 참조하세요.

## 📖 사용 방법

### 학생 모드

1. **문제 풀기**: 화면에 표시된 문제의 답을 선택
2. **답안 제출**: 선택한 답을 제출
3. **함정 확인**: 틀린 경우 어떤 함정에 빠졌는지 확인
4. **피드백 받기**: 맞춤형 설명과 힌트 제공
5. **다시 도전**: 함정을 이해하고 다시 시도

### 교사 모드

1. **대시보드**: 전체 통계 및 트렌드 확인
2. **함정 분석**: 가장 흔한 함정 목록 검토
3. **학생 모니터링**: 최근 함정 발생 이력 확인
4. **도움 요청 처리**: 학생의 도움 요청에 응답

## 🔗 Moodle 연동

### Moodle에 External Tool 추가

1. **사이트 관리** > **플러그인** > **활동 모듈** > **External tool** > **Manage tools**
2. **Configure a tool manually** 클릭
3. 다음 정보 입력:
   - **Tool name**: Trap Detection LMS
   - **Tool URL**: `http://your-domain.com/moodle-integration/lti/launch.php`
   - **Consumer key**: `trap_detection_key`
   - **Shared secret**: `your_secure_secret`

자세한 연동 가이드는 [INSTALLATION.md](docs/INSTALLATION.md#moodle-lti-연동-설정)를 참조하세요.

## 📊 데이터베이스 스키마

주요 테이블:

- **users**: 사용자 정보 (학생, 교사)
- **questions**: 문제 정보
- **question_options**: 문제 선택지
- **traps**: 감지된 함정
- **student_attempts**: 학생 답안 기록
- **trap_incidents**: 함정 발생 이력
- **interventions**: 학습 개입 전략
- **lti_sessions**: LTI 세션 관리

## 🎨 UI 스크린샷

### 학생 화면
- 문제 풀이 인터페이스
- 실시간 피드백
- 개인화된 학습 추천

### 교사 대시보드
- 전체 통계 요약
- 함정 트렌드 분석
- 학생별 상세 리포트

## 🧪 함정 탐지 알고리즘

### 자동 탐지 조건

```
발생률 = (특정 오답을 선택한 학생 수) / (전체 학생 수)

if 발생률 >= 30% AND 최소 시도 횟수 >= 5:
    함정으로 자동 분류
```

### 심각도 분류

- **치명적 (Critical)**: 발생률 ≥ 60%
- **높음 (High)**: 발생률 ≥ 45%
- **중간 (Medium)**: 발생률 ≥ 30%
- **낮음 (Low)**: 발생률 < 30%

## 📡 API 엔드포인트

### Student APIs

```
POST   /api/submit-answer.php          # 답안 제출
GET    /api/get-question.php?id=1      # 문제 조회
GET    /api/student-recommendations.php # 학생 추천
```

### Teacher APIs

```
GET    /api/teacher-dashboard.php      # 교사 대시보드
GET    /api/teacher-dashboard.php?trap_type=conceptual  # 필터링
```

### Request/Response 예시

**답안 제출:**
```json
// Request
POST /api/submit-answer.php
{
  "student_id": 1,
  "question_id": 1,
  "selected_option_id": 3,
  "time_spent": 45
}

// Response
{
  "success": true,
  "data": {
    "is_correct": false,
    "traps_detected": [
      {
        "trap_id": 1,
        "description": "분자와 분모를 구분하지 못함",
        "explanation": "분수의 덧셈은 분모가 같을 때 분자만 더합니다.",
        "hint": "2/3 + 1/3에서 분모 3은 그대로 두고 분자 2와 1만 더하세요."
      }
    ]
  }
}
```

## 🔐 보안

- OAuth 1.0 서명 검증 (LTI)
- SQL Injection 방지 (PDO Prepared Statements)
- XSS 방지 (Input Sanitization)
- CSRF 토큰 (세션 기반)
- 타임스탬프 검증 (Replay Attack 방지)

## 🧩 확장 가능성

### 추가 가능한 기능

- [ ] AI 기반 함정 설명 생성 (Claude API 연동)
- [ ] 학습 경로 추천
- [ ] 게임화 요소 (배지, 레벨)
- [ ] 실시간 알림 (WebSocket)
- [ ] 다국어 지원
- [ ] 모바일 앱 (React Native)
- [ ] LTI 1.3 지원

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 개발자

- **Project**: KAIST Touch Math Academy
- **Developer**: AI Education System Team

## 📞 지원

- **이메일**: support@example.com
- **문서**: [docs/](docs/)
- **이슈**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Made with ❤️ for better education**

© 2025 Trap Detection LMS - All Rights Reserved
