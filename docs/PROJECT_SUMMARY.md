# 프로젝트 요약

## Moodle Self-Grading Math System

### 프로젝트 개요

Moodle 3.7 LMS와 LTI 1.1 프로토콜로 연동하여, 학생들이 수학 문제를 풀고 **검산 근거를 스스로 작성**하도록 하는 독립형 웹 애플리케이션입니다. AI(Claude API)를 활용하여 학생의 자기평가 품질을 분석하고 즉각적인 피드백을 제공합니다.

### 핵심 가치 제안

1. **비판적 사고 증진**: 학생들이 답을 찾는 것을 넘어, 답이 맞는지 스스로 검증하는 과정을 학습
2. **즉각적 피드백**: AI 기반 실시간 분석으로 학습 사이클 단축
3. **완전 자동화**: 교사의 채점 부담 감소, Moodle 성적부 자동 연동
4. **표준 준수**: LTI 1.1 표준 프로토콜 사용으로 타 LMS 확장 가능

---

## 기술 아키텍처

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                     Moodle LMS 3.7                       │
│                  (LTI 1.1 Consumer)                      │
└────────────────────┬────────────────────────────────────┘
                     │ LTI Launch (OAuth 1.0)
                     ↓
┌─────────────────────────────────────────────────────────┐
│           Self-Grading Web App (PHP 7.1.9)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Public Layer (index.php, .htaccess)            │   │
│  └─────────────────────┬───────────────────────────┘   │
│                        ↓                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Controllers                                     │   │
│  │  - LTI Launch                                    │   │
│  │  - Problem Management                            │   │
│  │  - Submission Processing                         │   │
│  └─────────────────────┬───────────────────────────┘   │
│                        ↓                                 │
│  ┌──────────────┬──────────────┬──────────────────┐   │
│  │   Models     │     Libs     │      Views       │   │
│  │  - Problem   │  - Database  │  - Teacher UI    │   │
│  │  - Submission│  - LTIHandler│  - Student UI    │   │
│  │              │  - AIVerifier│  - Submission    │   │
│  └──────┬───────┴──────┬───────┴──────────────────┘   │
│         │              │                                │
└─────────┼──────────────┼────────────────────────────────┘
          ↓              ↓
    ┌──────────┐   ┌────────────────┐
    │  MySQL   │   │   Claude API   │
    │   5.7    │   │  (Anthropic)   │
    └──────────┘   └────────────────┘
```

### 기술 스택

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| **Backend** | PHP | 7.1.9 | 서버 사이드 로직 |
| **Database** | MySQL | 5.7 | 데이터 영속화 |
| **Frontend** | Bootstrap | 4.6.2 | 반응형 UI |
| **Frontend** | jQuery | 3.6.0 | DOM 조작 |
| **Math Rendering** | MathJax | 3.x | 수식 표시 |
| **LTI** | IMS LTI | 1.1 | Moodle 연동 |
| **AI** | Claude API | Sonnet 3 | 자기평가 분석 |

---

## 핵심 기능

### 1. LTI 통합 (`src/lib/LTIHandler.php`)

**기능:**
- OAuth 1.0 서명 검증
- 사용자 인증 및 역할 매핑
- 세션 관리
- 성적 전송 (LTI Outcome Service)

**흐름:**
```
Moodle → LTI Launch Request (POST with OAuth signature)
  ↓
OAuth Signature Validation
  ↓
User Creation/Update in Local DB
  ↓
Session Creation
  ↓
Redirect to Dashboard (Teacher or Student)
```

**보안:**
- HMAC-SHA1 서명 검증
- Timestamp 및 Nonce 검증
- Consumer Key/Secret 관리

### 2. AI 기반 자기평가 검증 (`src/lib/AIVerifier.php`)

**분석 지표:**
1. **논리성 (Logic Score)**: 검증 방법이 수학적으로 타당한가?
2. **완전성 (Completeness Score)**: 모든 검증 단계를 포함했는가?
3. **명확성 (Clarity Score)**: 설명이 명확하고 이해하기 쉬운가?

**프롬프트 전략:**
```
Role: Expert mathematics education evaluator
Context: Problem, Correct Answer, Student Answer, Verification Text
Task: Evaluate verification quality
Output: JSON with scores and feedback
```

**평가 결과:**
```json
{
  "logic_score": 85,
  "completeness_score": 90,
  "clarity_score": 80,
  "ai_score": 85,
  "feedback": "Your verification method is sound...",
  "suggestions": "Consider adding..."
}
```

### 3. 채점 알고리즘

**최종 점수 계산:**
```
Final Score = (Answer Correctness × 0.7) + (Verification Quality × 0.3)

예시:
- 답 맞음 = 10점 × 0.7 = 7점
- 검산 품질 85% = 10점 × 0.3 × 0.85 = 2.55점
- 최종 = 7 + 2.55 = 9.55점
```

**가중치 조정 가능** (`config.php`):
```php
define('ANSWER_WEIGHT', 0.7);      // 답안: 70%
define('VERIFICATION_WEIGHT', 0.3); // 검산: 30%
```

---

## 데이터베이스 스키마

### 주요 테이블

#### 1. `problems` - 문제
```sql
- id, title, description
- problem_statement (TEXT)
- correct_answer (TEXT)
- problem_type (ENUM)
- difficulty_level (1-5)
- points (DECIMAL)
- requires_verification (BOOLEAN)
```

#### 2. `student_submissions` - 제출물
```sql
- id, problem_id, student_id
- student_answer (TEXT)
- work_shown (TEXT)
- self_verification (TEXT) ← 핵심!
- is_correct (BOOLEAN)
- score, max_score
- ai_feedback (JSON)
- status (ENUM)
```

#### 3. `problem_verifications` - AI 분석 결과
```sql
- id, submission_id
- verification_text (TEXT)
- ai_score, logic_score, completeness_score, clarity_score
- ai_feedback, ai_suggestions
- processing_time_ms
```

#### 4. `lti_sessions` - LTI 세션
```sql
- id, session_id
- consumer_id, user_id
- lis_result_sourcedid (성적 전송용)
- lis_outcome_service_url
```

---

## 사용자 워크플로우

### 교사 워크플로우

```
1. Moodle에서 LTI 도구 클릭
   ↓
2. 교사 대시보드
   - 통계 확인 (제출 수, 정답률)
   - 문제 목록
   ↓
3. 새 문제 생성
   - 문제 지문, 정답 입력
   - 난이도, 배점 설정
   - 자기평가 필수 여부 설정
   ↓
4. 학생 제출물 확인
   - 답안, 풀이, 자기평가 열람
   - AI 분석 결과 확인
   - 추가 피드백 작성 (선택)
```

### 학생 워크플로우

```
1. Moodle에서 LTI 도구 클릭
   ↓
2. 학생 대시보드
   - 사용 가능한 문제 목록
   - 제출 이력
   ↓
3. 문제 선택
   ↓
4. 답안 작성
   - 최종 답
   - 풀이 과정
   ↓
5. 자기평가 작성 ← 핵심!
   "어떻게 확인했는지" 상세 설명
   예: "답을 원래 식에 대입하여 검증함"
   ↓
6. 제출
   ↓
7. 즉시 결과 확인
   - 답안 정확성
   - AI 분석 (논리성, 완전성, 명확성)
   - 최종 점수
   - 개선 제안
   ↓
8. 성적이 Moodle로 자동 전송
```

---

## 파일 구조

```
alt42standalone_v1.0/
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql        # 데이터베이스 스키마
│
├── docs/
│   ├── PROJECT_SUMMARY.md                # 이 문서
│   └── USER_GUIDE.md                     # 사용자 가이드
│
├── public/                               # 웹 루트
│   ├── .htaccess                         # Apache 설정
│   └── index.php                         # 라우터
│
├── src/
│   ├── autoload.php                      # 클래스 자동 로드
│   │
│   ├── config/
│   │   └── config.php                    # 설정
│   │
│   ├── lib/                              # 핵심 라이브러리
│   │   ├── Database.php                  # PDO 래퍼
│   │   ├── LTIHandler.php                # LTI 통합
│   │   ├── AIVerifier.php                # Claude API 연동
│   │   └── Logger.php                    # 로깅
│   │
│   ├── models/                           # 데이터 모델
│   │   ├── Problem.php                   # 문제 CRUD
│   │   └── Submission.php                # 제출물 CRUD
│   │
│   ├── controllers/                      # 컨트롤러
│   │   ├── lti_launch.php                # LTI 진입점
│   │   ├── teacher_dashboard.php         # 교사 대시보드
│   │   ├── student_dashboard.php         # 학생 대시보드
│   │   ├── problem_create.php            # 문제 생성
│   │   ├── problem_view.php              # 문제 보기
│   │   ├── submission_submit.php         # 제출 처리 + AI 분석
│   │   └── submission_view.php           # 결과 보기
│   │
│   └── views/                            # 뷰 템플릿
│       ├── layout/
│       │   ├── header.php                # 공통 헤더
│       │   └── footer.php                # 공통 푸터
│       ├── home.php                      # 홈 페이지
│       ├── teacher_dashboard.php         # 교사 대시보드
│       ├── student_dashboard.php         # 학생 대시보드
│       ├── problem_create.php            # 문제 생성 폼
│       ├── problem_view_student.php      # 학생 문제 풀이
│       └── submission_view.php           # 제출 결과 (AI 피드백)
│
├── logs/                                 # 로그 파일
├── uploads/                              # 업로드 파일
│
├── .env.example                          # 환경 변수 예제
├── README.md                             # 프로젝트 README
└── INSTALL.md                            # 설치 가이드
```

---

## 보안 고려사항

### 1. LTI 보안
- **OAuth 1.0 서명**: HMAC-SHA1으로 요청 무결성 검증
- **Timestamp 검증**: Replay attack 방지
- **Nonce 추적**: 중복 요청 차단

### 2. 웹 애플리케이션 보안
- **SQL Injection 방지**: PDO Prepared Statements 사용
- **XSS 방지**: `htmlspecialchars()` 사용
- **CSRF 보호**: 토큰 기반 검증
- **세션 보안**: httponly, secure 플래그

### 3. API 보안
- **API 키 관리**: 환경 변수로 관리
- **Rate Limiting**: API 호출 제한 (추후 구현 가능)
- **HTTPS 필수**: 프로덕션 환경

---

## 성능 최적화

### 현재 구현
- **데이터베이스 인덱스**: 자주 조회되는 컬럼에 인덱스 설정
- **PDO 연결 재사용**: Singleton 패턴
- **프론트엔드 캐싱**: CSS/JS 브라우저 캐싱

### 향후 개선 방안
- **Redis 캐싱**: 자주 조회되는 문제 캐싱
- **비동기 AI 처리**: Queue 시스템 도입
- **CDN**: 정적 리소스 배포
- **Database Read Replica**: 읽기 부하 분산

---

## 확장 가능성

### 단기 (3개월)
- [ ] 문제 유형 확장 (서술형, 선다형)
- [ ] 이미지 업로드 지원
- [ ] 성적 통계 대시보드 강화
- [ ] 모바일 앱 (React Native)

### 중기 (6개월)
- [ ] LTI 1.3 / LTI Advantage 지원
- [ ] 다른 LMS 연동 (Canvas, Blackboard)
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 협업 학습 모드

### 장기 (1년+)
- [ ] 적응형 학습 경로 (AI 추천)
- [ ] 게임화 요소 (배지, 리더보드)
- [ ] 영상 강의 통합
- [ ] 교사 커뮤니티 플랫폼

---

## 프로젝트 메트릭

### 코드 통계
- **총 파일 수**: 29개
- **총 코드 라인**: ~4,200 줄
- **PHP 파일**: 21개
- **SQL 스크립트**: 1개
- **문서**: 4개 (README, INSTALL, USER_GUIDE, PROJECT_SUMMARY)

### 주요 컴포넌트 크기
- `LTIHandler.php`: ~400 줄 (OAuth, 세션, 성적 전송)
- `AIVerifier.php`: ~250 줄 (Claude API, 분석)
- `Database.php`: ~180 줄 (PDO 래퍼)
- 뷰 템플릿: 평균 ~200 줄/파일

---

## 배포 체크리스트

### 프로덕션 배포 전
- [ ] `APP_ENV=production` 설정
- [ ] 데이터베이스 비밀번호 변경
- [ ] LTI Consumer Secret 변경
- [ ] Claude API 키 설정
- [ ] HTTPS 인증서 설치
- [ ] 로그 디렉토리 권한 확인
- [ ] 백업 전략 수립
- [ ] 모니터링 설정 (선택)

### Moodle 설정
- [ ] 외부 도구 등록
- [ ] Consumer Key/Secret 매칭
- [ ] 성적 받아오기 활성화
- [ ] 테스트 코스에서 검증

---

## 문제 해결 가이드

### 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| LTI 인증 실패 | OAuth 서명 불일치 | Key/Secret 확인, 시간 동기화 |
| AI 분석 실패 | API 키 오류 | `config.php`에서 키 확인 |
| 성적 미전송 | Outcome URL 누락 | Moodle 설정 확인 |
| 데이터베이스 연결 실패 | 권한/비밀번호 | MySQL 권한 확인 |

**로그 위치**: `logs/YYYY-MM-DD.log`

---

## 라이선스 및 기여

### 라이선스
이 프로젝트는 교육 목적으로 개발되었습니다.

### 기여 방법
1. 이슈 리포트
2. 기능 제안
3. Pull Request

### 컨택
- 프로젝트: KAIST Touch Math Academy
- 개발: Claude AI Agent
- 날짜: 2025-11-18

---

## 결론

Moodle Self-Grading Math System은 **자기평가**라는 교육적으로 중요한 개념을 기술적으로 구현한 시스템입니다. 학생들이 단순히 답을 찾는 것을 넘어, **왜 그 답이 맞는지 스스로 검증**하는 과정을 통해 비판적 사고력과 메타인지 능력을 키울 수 있습니다.

AI를 활용한 즉각적인 피드백은 학습 사이클을 단축하고, LTI 표준을 통한 Moodle 연동은 교사와 학생 모두에게 편리한 사용자 경험을 제공합니다.

**핵심 차별점:**
- 📝 자기평가에 초점
- 🤖 AI 기반 실시간 피드백
- 🔗 완전한 LMS 통합
- ⚡ 즉각적인 자동 채점

이 시스템은 교육의 미래를 향한 한 걸음입니다. 🚀
