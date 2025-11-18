# LMS 연동 개념 선택 웹앱 구현 계획

## 프로젝트 개요
독립형 웹 애플리케이션으로 문제의 본질 개념을 AI가 추천하고 교사가 선택할 수 있는 시스템

## 기술 스택

### Backend
- **Language**: PHP 7.4
- **Framework**: Slim Framework 4 (RESTful API)
- **Database**: MySQL 5.7
- **ORM**: Eloquent (standalone)
- **Authentication**: JWT

### Frontend
- **Framework**: Vue.js 2.6
- **UI Library**: Bootstrap 4
- **HTTP Client**: Axios
- **Build Tool**: Webpack

### AI/ML
- **NLP**: 텍스트 분석 기반 개념 추출
- **Optional**: OpenAI API 통합 (고급 추천)

### LMS 연동
- **Protocol**: LTI 1.3
- **Target**: Moodle 3.7+
- **API**: REST API

## 데이터베이스 스키마

### 1. concepts (개념 테이블)
```sql
- id (PK)
- parent_id (FK, nullable) - 계층 구조
- name (VARCHAR) - 개념명
- description (TEXT)
- subject (VARCHAR) - 과목 (수학, 과학 등)
- level (INT) - 난이도/학년
- created_at, updated_at
```

### 2. problems (문제 테이블)
```sql
- id (PK)
- title (VARCHAR)
- content (TEXT) - 문제 내용
- difficulty (ENUM: easy, medium, hard)
- subject (VARCHAR)
- created_by (FK -> users)
- created_at, updated_at
```

### 3. problem_concepts (문제-개념 연결 테이블)
```sql
- id (PK)
- problem_id (FK)
- concept_id (FK)
- is_primary (BOOLEAN) - 주 개념 여부
- confidence_score (DECIMAL) - AI 추천 신뢰도 (0-1)
- is_ai_suggested (BOOLEAN)
- confirmed_by_teacher (BOOLEAN)
- created_at
```

### 4. users (사용자 테이블)
```sql
- id (PK)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- role (ENUM: teacher, student, admin)
- moodle_user_id (INT, nullable)
- created_at, updated_at
```

### 5. student_progress (학습 진도 테이블)
```sql
- id (PK)
- student_id (FK -> users)
- problem_id (FK)
- concept_id (FK)
- status (ENUM: not_started, in_progress, completed)
- score (DECIMAL)
- attempts (INT)
- last_attempt_at
- created_at, updated_at
```

### 6. lti_sessions (LTI 세션 테이블)
```sql
- id (PK)
- lti_user_id (VARCHAR)
- lti_context_id (VARCHAR)
- lti_resource_link_id (VARCHAR)
- user_id (FK -> users)
- session_data (JSON)
- created_at, expires_at
```

## API 엔드포인트 설계

### Concepts API
- `GET /api/concepts` - 개념 목록 (계층 구조)
- `GET /api/concepts/{id}` - 개념 상세
- `POST /api/concepts` - 개념 생성 (admin/teacher)
- `PUT /api/concepts/{id}` - 개념 수정
- `DELETE /api/concepts/{id}` - 개념 삭제

### Problems API
- `GET /api/problems` - 문제 목록
- `GET /api/problems/{id}` - 문제 상세
- `POST /api/problems` - 문제 생성
- `PUT /api/problems/{id}` - 문제 수정
- `DELETE /api/problems/{id}` - 문제 삭제

### AI Concept Suggestion API
- `POST /api/problems/analyze` - 문제 텍스트 분석하여 개념 추천
  ```json
  Request: { "content": "두 분수 1/2와 1/3을 더하시오" }
  Response: {
    "suggested_concepts": [
      { "concept_id": 5, "name": "분수의 덧셈", "confidence": 0.95 },
      { "concept_id": 3, "name": "분수", "confidence": 0.88 }
    ]
  }
  ```

### Problem-Concept Mapping API
- `POST /api/problems/{id}/concepts` - 문제에 개념 연결
- `DELETE /api/problems/{id}/concepts/{conceptId}` - 개념 연결 해제
- `PUT /api/problems/{id}/concepts/{conceptId}/confirm` - 교사가 AI 추천 확인

### Moodle LTI API
- `POST /lti/launch` - LTI 런치 엔드포인트
- `GET /lti/config` - LTI 설정 정보
- `POST /lti/grade-passback` - 성적 전송

### Student Progress API
- `GET /api/students/{id}/progress` - 학생 진도 조회
- `POST /api/students/{id}/progress` - 진도 기록
- `GET /api/concepts/{id}/mastery` - 개념별 숙련도

## 프로젝트 디렉토리 구조

```
/
├── public/
│   ├── index.php (Entry point)
│   ├── css/
│   ├── js/
│   └── assets/
├── src/
│   ├── routes/
│   │   ├── concepts.php
│   │   ├── problems.php
│   │   ├── ai.php
│   │   └── lti.php
│   ├── controllers/
│   │   ├── ConceptController.php
│   │   ├── ProblemController.php
│   │   ├── AIController.php
│   │   └── LTIController.php
│   ├── models/
│   │   ├── Concept.php
│   │   ├── Problem.php
│   │   ├── ProblemConcept.php
│   │   ├── User.php
│   │   └── StudentProgress.php
│   ├── middleware/
│   │   ├── AuthMiddleware.php
│   │   └── LTIMiddleware.php
│   ├── services/
│   │   ├── AIConceptAnalyzer.php
│   │   ├── LTIService.php
│   │   └── MoodleAPIService.php
│   └── utils/
│       ├── Database.php
│       └── JWTHelper.php
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConceptSelector.vue
│   │   │   ├── ProblemEditor.vue
│   │   │   ├── ConceptTree.vue
│   │   │   └── AIRecommendations.vue
│   │   ├── views/
│   │   │   ├── TeacherDashboard.vue
│   │   │   ├── StudentView.vue
│   │   │   └── ConceptManager.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── webpack.config.js
├── database/
│   ├── schema.sql
│   └── migrations/
├── config/
│   ├── database.php
│   ├── lti.php
│   └── app.php
├── composer.json
└── README.md
```

## 구현 단계

### Phase 1: 기본 인프라 (진행 중)
- [x] 프로젝트 구조 생성
- [ ] MySQL 데이터베이스 스키마 생성
- [ ] Composer 설정 (Slim, Eloquent 등)
- [ ] PHP 라우팅 설정

### Phase 2: 개념 관리 시스템
- [ ] Concept CRUD API
- [ ] 계층적 개념 구조 구현
- [ ] 개념 관리 UI (Vue.js)

### Phase 3: 문제 관리 + AI 추천
- [ ] Problem CRUD API
- [ ] AI 개념 분석 엔진 구현
- [ ] 문제-개념 매핑 API
- [ ] 개념 추천 UI

### Phase 4: Moodle LTI 연동
- [ ] LTI 1.3 인증 구현
- [ ] Moodle 사용자 동기화
- [ ] 성적 전송 (Grade Passback)

### Phase 5: 학생 진도 추적
- [ ] 진도 기록 API
- [ ] 개념 숙련도 계산
- [ ] 대시보드 UI

### Phase 6: 테스트 및 배포
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] Moodle 연동 테스트
- [ ] 문서화

## AI 개념 추천 알고리즘

### 기본 방식 (키워드 매칭)
```php
1. 문제 텍스트에서 수학 용어 추출
2. 용어-개념 매핑 테이블 참조
3. TF-IDF 기반 관련도 계산
4. 신뢰도 점수와 함께 상위 3-5개 개념 반환
```

### 고급 방식 (Optional - OpenAI API)
```php
1. 문제 텍스트를 OpenAI API로 전송
2. 프롬프트: "다음 수학 문제의 핵심 개념 3가지를 추출하세요"
3. JSON 형식으로 개념 목록 수신
4. 데이터베이스의 개념과 매칭
```

## Moodle 연동 시나리오

1. **LTI 도구 등록**
   - Moodle 관리자가 본 앱을 LTI 도구로 등록
   - LTI 키/시크릿 발급

2. **사용자 흐름**
   - 학생이 Moodle 과정에서 활동 클릭
   - LTI 런치 요청 → 본 앱으로 리다이렉트
   - 사용자 자동 로그인 (SSO)
   - 문제 풀이 후 점수 Moodle로 전송

3. **데이터 동기화**
   - Moodle 사용자 정보 → 로컬 users 테이블
   - 학습 진도 → Moodle gradebook

## 보안 고려사항

- JWT 토큰 기반 인증
- LTI 서명 검증
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 검증 및 이스케이핑)
- CORS 설정
- Rate Limiting

## 다음 단계

1. MySQL 데이터베이스 스키마 생성
2. Composer 의존성 설치
3. Slim Framework 라우팅 설정
4. Concept API 구현
