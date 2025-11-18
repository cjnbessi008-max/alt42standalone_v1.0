# Truth Temperature - 프로젝트 개요

## 🎯 프로젝트 목적

Truth Temperature는 수학 교육을 위한 혁신적인 웹 애플리케이션으로, 부등식의 참/거짓을 온도로 시각화하여 학생들이 직관적으로 수학 개념을 이해할 수 있도록 돕습니다.

---

## 💡 핵심 아이디어

### 온도 메타포

- **참(True)인 부등식** → 따뜻한 온도 (30°C ~ 50°C) 🔥
- **거짓(False)인 부등식** → 차가운 온도 (-20°C ~ 10°C) ❄️

이 직관적인 시각화를 통해 학생들은:
1. 부등식의 성립 여부를 즉시 파악
2. 수학적 개념을 감각적으로 체험
3. 반복 학습을 통한 개념 정착

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Moodle LMS (선택)                  │
│         ┌─────────────────────────────┐             │
│         │  Truth Temperature Plugin   │             │
│         └────────────┬────────────────┘             │
└──────────────────────┼──────────────────────────────┘
                       │ Web Service API
                       ▼
┌─────────────────────────────────────────────────────┐
│              Truth Temperature 웹앱                  │
│  ┌────────────────┐         ┌──────────────────┐   │
│  │   Frontend     │         │    Backend       │   │
│  │  (HTML/CSS/JS) │◄────────┤   (PHP 7.1.9)    │   │
│  │                │  REST   │                  │   │
│  │  • 문제 표시   │  API    │  • 부등식 평가   │   │
│  │  • 가상 스마트폰│        │  • 온도 계산     │   │
│  │  • 온도 시각화 │         │  • 세션 관리     │   │
│  └────────────────┘         └──────────┬───────┘   │
└─────────────────────────────────────────┼───────────┘
                                          │
                                          ▼
                            ┌──────────────────────┐
                            │   MySQL 5.7          │
                            │                      │
                            │  • problems          │
                            │  • user_sessions     │
                            │  • user_responses    │
                            │  • temperature_logs  │
                            └──────────────────────┘
```

---

## 📦 주요 컴포넌트

### 1. Backend (PHP)

#### `backend/config/database.php`
- PDO를 사용한 MySQL 연결 관리
- Singleton 패턴으로 연결 재사용

#### `backend/api/api.php`
REST API 엔드포인트:
- `GET /api/problems` - 문제 목록 조회
- `POST /api/problems` - 문제 생성
- `POST /api/session` - 세션 생성
- `GET /api/session` - 세션 조회
- `POST /api/submit` - 답변 제출
- `GET /api/temperature` - 현재 온도 조회

#### `backend/models/`
데이터 모델:
- **Problem.php**: 문제 CRUD 작업
- **Session.php**: 사용자 세션 관리
- **Response.php**: 사용자 응답 저장 및 통계

#### `backend/utils/InequalityEvaluator.php`
부등식 평가 엔진:
- 수식 파싱 및 검증
- 안전한 수식 평가 (SQL Injection 방지)
- 연산자 지원: `<`, `<=`, `>`, `>=`, `=`, `!=`

### 2. Frontend (HTML/CSS/JavaScript)

#### `frontend/index.html`
메인 페이지:
- 문제 표시 영역
- 답변 버튼 (참/거짓)
- 결과 메시지
- 가상 스마트폰 UI

#### `frontend/css/smartphone.css`
스타일시트:
- 반응형 디자인
- 가상 스마트폰 프레임
- 온도계 애니메이션
- 온도별 색상 변화

#### `frontend/js/smartphone.js`
JavaScript 로직:
- 세션 관리
- API 통신
- 온도 시각화
- 문제 순환

### 3. Moodle Plugin

#### `moodle-plugin/version.php`
플러그인 메타데이터

#### `moodle-plugin/lib.php`
Moodle 인터페이스 함수:
- `truthtemp_add_instance()`
- `truthtemp_update_instance()`
- `truthtemp_delete_instance()`
- `truthtemp_evaluate_inequality()`

#### `moodle-plugin/view.php`
Moodle 내 문제 표시 페이지

### 4. Database (MySQL)

#### 테이블 구조

**problems**
```sql
- id (PK)
- moodle_question_id
- question_text
- inequality_expression
- left_side
- right_side
- operator
- correct_answer (BOOLEAN)
- difficulty_level (ENUM)
- category
```

**user_sessions**
```sql
- id (PK)
- moodle_user_id
- username
- session_token
- is_active
- start_time
- last_activity
```

**user_responses**
```sql
- id (PK)
- session_id (FK)
- problem_id (FK)
- user_answer (BOOLEAN)
- is_correct (BOOLEAN)
- temperature_displayed
- response_time_ms
- submitted_at
```

**temperature_logs**
```sql
- id (PK)
- session_id (FK)
- problem_id (FK)
- temperature_value
- temperature_type (ENUM: cold, cool, warm, hot)
- is_truth (BOOLEAN)
- logged_at
```

---

## 🔄 데이터 흐름

### 문제 풀이 프로세스

```
1. 사용자 접속
   └─> 세션 생성 (POST /api/session)
       └─> session_id 반환

2. 문제 로드
   └─> 문제 조회 (GET /api/problems)
       └─> 문제 목록 표시

3. 답변 제출
   └─> 답변 전송 (POST /api/submit)
       ├─> 부등식 평가 (InequalityEvaluator)
       ├─> 정답 여부 판단
       ├─> 온도 계산
       │   ├─> 참: rand(30, 50)
       │   └─> 거짓: rand(-20, 10)
       ├─> 데이터베이스 저장
       │   ├─> user_responses
       │   └─> temperature_logs
       └─> 응답 반환
           ├─> is_correct
           ├─> temperature
           └─> temperature_type

4. 온도 표시
   └─> 가상 스마트폰에 온도 시각화
       ├─> 온도계 높이 조절
       ├─> 색상 변경
       └─> 애니메이션 효과
```

---

## 🎨 UI/UX 디자인

### 가상 스마트폰

**위치**: 우측 하단 고정
**크기**: 280px × 550px
**디자인 요소**:
- 현실적인 스마트폰 프레임
- 앱 헤더 (Truth Temperature)
- 온도계 (세로형, 300px)
- 온도 값 표시 (큰 숫자)
- 상태 메시지

### 온도 시각화

#### 온도 범위 및 색상

| 온도 | 타입 | 색상 그라디언트 | 의미 |
|------|------|----------------|------|
| 35-50°C | hot | #ef4444 → #dc2626 | 부등식 참 (매우 확실) |
| 20-34°C | warm | #f59e0b → #d97706 | 부등식 참 |
| 0-19°C | cool | #60a5fa → #3b82f6 | 부등식 거짓 |
| -20--1°C | cold | #3b82f6 → #1e3a8a | 부등식 거짓 (매우 확실) |

#### 애니메이션

- **온도 변화**: 0.8초 cubic-bezier 이징
- **Pulse 효과**: 답변 제출 시 0.5초
- **슬라이드 인**: 페이지 로드 시 0.5초

---

## 🔒 보안 고려사항

### 1. SQL Injection 방지
- PDO Prepared Statements 사용
- 모든 사용자 입력 파라미터 바인딩

### 2. XSS 방지
- 출력 시 HTML 이스케이프
- Content Security Policy 헤더

### 3. 수식 평가 보안
- 정규식으로 허용된 문자만 필터링
- `eval()` 사용 전 엄격한 검증
- 위험한 패턴 차단 (`;`, `{}`, `$`, `` ` ``, `\`)

### 4. 세션 보안
- 랜덤 토큰 생성 (32바이트)
- 세션 타임아웃 (1시간)
- IP 주소 및 User Agent 로깅

### 5. API 보안
- CORS 설정
- Rate Limiting (권장)
- API 토큰 인증 (Moodle 연동 시)

---

## 📊 성능 최적화

### Frontend
- CSS/JS 파일 압축 (Gzip)
- 이미지 최적화
- 브라우저 캐싱 (1개월)

### Backend
- 데이터베이스 인덱싱
- 쿼리 최적화
- PDO Persistent Connections

### Database
- InnoDB 엔진 사용
- 적절한 인덱스 설정
  - `idx_moodle_question`
  - `idx_session_token`
  - `idx_active_sessions`

---

## 🧪 테스트 전략

### 1. 단위 테스트
- **InequalityEvaluator**: 다양한 수식 평가
- **Models**: CRUD 작업 검증
- **API**: 엔드포인트 응답 확인

### 2. 통합 테스트
- Frontend ↔ Backend API 통신
- Database 트랜잭션
- Moodle 플러그인 연동

### 3. 사용자 테스트
- 다양한 브라우저 호환성
- 모바일 반응형 테스트
- 접근성 (WCAG) 검증

---

## 🚀 배포 시나리오

### 시나리오 1: 독립 실행형
```
Apache/Nginx → truth-temperature/frontend/index.html
```
- Moodle 없이 독립 실행
- 샘플 데이터로 테스트
- 데모 및 개념 증명용

### 시나리오 2: Moodle 통합
```
Moodle → mod/truthtemp → Web Service API → truth-temperature
```
- Moodle 코스에 활동 추가
- LMS 사용자 인증
- 학습 진도 추적

### 시나리오 3: 하이브리드
```
Moodle ←─ Web Service API ─→ truth-temperature
  │                               ↑
  └─────────────────────────────┘
         (iframe 임베딩)
```
- Moodle 내 iframe으로 표시
- 양방향 데이터 동기화

---

## 📈 확장 가능성

### 단기 개선안
1. **문제 유형 확장**
   - 분수 부등식
   - 일차방정식
   - 이차방정식

2. **게이미피케이션**
   - 점수 시스템
   - 배지 및 업적
   - 리더보드

3. **개인화**
   - 난이도 자동 조절
   - 학습 패턴 분석
   - 추천 문제 제공

### 장기 로드맵
1. **AI 통합**
   - 자연어 문제 생성
   - 학습 경로 최적화
   - 실시간 피드백

2. **모바일 앱**
   - React Native
   - Flutter
   - 오프라인 모드

3. **다국어 지원**
   - 영어, 한국어, 일본어 등
   - i18n 프레임워크

---

## 🛠️ 개발 도구

### 권장 개발 환경
- **IDE**: VS Code, PhpStorm
- **Version Control**: Git
- **Database Tool**: phpMyAdmin, MySQL Workbench
- **API Testing**: Postman, cURL
- **Browser**: Chrome DevTools

### 코드 스타일
- **PHP**: PSR-12
- **JavaScript**: ES6+, Airbnb Style Guide
- **CSS**: BEM 방법론

---

## 📚 참고 자료

### 기술 문서
- [PHP 7.1 Documentation](https://www.php.net/manual/en/)
- [MySQL 5.7 Reference](https://dev.mysql.com/doc/refman/5.7/en/)
- [Moodle Development](https://docs.moodle.org/dev/)

### 관련 프로젝트
- Moodle Activity Modules
- Khan Academy Math Exercises
- GeoGebra

---

## 👥 기여 가이드라인

### 버그 리포트
1. GitHub Issues에 등록
2. 재현 단계 상세 기술
3. 스크린샷 첨부

### 기능 제안
1. 제안 배경 설명
2. 예상 효과 기술
3. 구현 방안 제시 (선택)

### Pull Request
1. Feature 브랜치 생성
2. 코드 작성 및 테스트
3. PR 생성 및 리뷰 요청

---

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**프로젝트 시작일**: 2025-11-18
**현재 버전**: 1.0.0
**상태**: 프로덕션 준비 완료
