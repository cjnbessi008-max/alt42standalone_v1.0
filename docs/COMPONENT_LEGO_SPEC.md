# Component Lego 시스템 명세서

## 개요
Moodle LMS와 연동하여 문제를 받아 성분을 레고처럼 조립하는 인터랙티브 학습 인터페이스

## 기술 스택
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: JavaScript (ES6), HTML5, CSS3
- **UI Framework**: 모바일 스타일 (가상 스마트폰)

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│           Moodle 3.7 (LMS)                      │
│     - Question Bank                              │
│     - Web Services API                           │
└────────────────┬────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────┐
│      Component Lego Backend (PHP 7.1.9)         │
│  ┌──────────────────────────────────────────┐  │
│  │  Moodle API Client                       │  │
│  │  Component Decomposition Engine          │  │
│  │  Lego Assembly Validator                 │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           MySQL 5.7 Database                    │
│  - Questions                                    │
│  - Components (Lego Blocks)                     │
│  - Student Attempts                             │
│  - Assembly Patterns                            │
└─────────────────────────────────────────────────┘
                 ▲
┌────────────────┴────────────────────────────────┐
│      Frontend (Virtual Smartphone UI)           │
│  ┌──────────────────────────────────────────┐  │
│  │  📱 Mobile-style Display (우측 하단)      │  │
│  │  - Component Palette                     │  │
│  │  - Assembly Canvas                       │  │
│  │  - Drag & Drop Interface                 │  │
│  │  - Visual Feedback                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 핵심 기능

### 1. Moodle 연동 모듈
- **기능**: Moodle Web Services API를 통해 문제 정보 가져오기
- **API 엔드포인트**:
  - `mod_quiz_get_quizzes_by_courses` - 퀴즈 목록
  - `mod_quiz_get_quiz_questions` - 문제 가져오기
  - `core_question_get_questions` - 문제 상세 정보
- **인증**: Moodle token 기반 인증

### 2. Component Decomposition (성분 분해)
- **화학 문제 예시**:
  - 분자식 `H₂O` → 컴포넌트: `H` (x2), `O` (x1)
  - 화학 반응식 분해 → 반응물/생성물 컴포넌트

- **수학 문제 예시**:
  - 분수 `3/4` → 컴포넌트: 분자(3), 분모(4), 분수선
  - 방정식 `2x + 5 = 13` → 컴포넌트: 계수(2), 변수(x), 연산자(+), 상수(5,13), 등호

### 3. Lego Assembly Interface (레고 조립 인터페이스)

#### 3.1 Component Palette (컴포넌트 팔레트)
```javascript
{
  "component_id": "h2o_hydrogen",
  "type": "atom",
  "symbol": "H",
  "display": "수소",
  "color": "#FFFFFF",
  "properties": {
    "atomic_number": 1,
    "valence": 1
  }
}
```

#### 3.2 Assembly Canvas (조립 캔버스)
- 드래그 앤 드롭 영역
- 그리드 기반 배치
- 스냅 기능 (자동 정렬)
- 연결선/본드 표시

#### 3.3 Interaction Flow
```
1. 문제 로드 (Moodle에서)
2. 성분 분해 → 컴포넌트 생성
3. 컴포넌트 팔레트에 표시
4. 학생이 드래그 앤 드롭으로 조립
5. 실시간 유효성 검증
6. 정답 확인 및 피드백
```

### 4. Virtual Smartphone Display (가상 스마트폰 화면)

#### 4.1 UI 레이아웃
```
┌─────────────────────────────────────┐
│  메인 컨텐츠 영역                     │
│                                      │
│                                      │
│                                      │
│                           ┌────────┐ │
│                           │ 📱     │ │
│                           │ Component│
│                           │  Lego  │ │
│                           │        │ │
│                           │ [조립] │ │
│                           │  영역  │ │
│                           │        │ │
│                           └────────┘ │
│  우측 하단 위치 (fixed)                │
└─────────────────────────────────────┘
```

#### 4.2 디자인 사양
- **크기**: 360px × 640px (일반적인 스마트폰 비율)
- **위치**: `position: fixed; bottom: 20px; right: 20px;`
- **스타일**:
  - 둥근 모서리 (border-radius: 20px)
  - 그림자 효과 (box-shadow)
  - 상태바, 홈 버튼 등 모바일 UI 요소

## 데이터베이스 스키마

### components 테이블
```sql
CREATE TABLE components (
    component_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20),
    display_name VARCHAR(100),
    properties JSON,
    visual_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### assembly_patterns 테이블
```sql
CREATE TABLE assembly_patterns (
    pattern_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    pattern_data JSON,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### student_attempts 테이블
```sql
CREATE TABLE student_attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    assembled_pattern JSON,
    is_correct BOOLEAN,
    time_spent INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 엔드포인트

### Backend API
- `GET /api/questions/{id}` - 문제 정보 가져오기
- `GET /api/questions/{id}/components` - 문제의 컴포넌트 목록
- `POST /api/assembly/validate` - 조립 검증
- `POST /api/attempts/submit` - 답안 제출

## 개발 우선순위

### Phase 1: 기본 인프라 (Week 1)
- [x] 프로젝트 구조 생성
- [ ] MySQL 데이터베이스 설정
- [ ] Moodle API 연결 테스트
- [ ] 기본 PHP 라우팅 설정

### Phase 2: 컴포넌트 분해 엔진 (Week 2)
- [ ] 화학식 파서 구현
- [ ] 수학식 파서 구현
- [ ] 컴포넌트 JSON 생성기
- [ ] 유효성 검증 로직

### Phase 3: UI 개발 (Week 3)
- [ ] 가상 스마트폰 프레임 구현
- [ ] 드래그 앤 드롭 라이브러리 통합
- [ ] 컴포넌트 팔레트 UI
- [ ] 조립 캔버스 UI

### Phase 4: 통합 및 테스트 (Week 4)
- [ ] Frontend-Backend 통합
- [ ] Moodle 연동 테스트
- [ ] 사용자 테스트
- [ ] 버그 수정 및 최적화

## 기술적 고려사항

### PHP 7.1.9 호환성
- Moodle 3.7과 호환되는 PHP 버전
- JSON 함수 사용 (json_encode, json_decode)
- cURL을 통한 Moodle API 호출

### MySQL 5.7 기능 활용
- JSON 데이터 타입 지원
- 트랜잭션 처리
- 인덱싱 최적화

### 보안
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 검증 및 이스케이프)
- CSRF 토큰
- Moodle 토큰 안전한 저장

## 확장 가능성

### 향후 지원 가능한 컴포넌트 타입
1. **화학**: 원자, 분자, 이온, 화학 결합
2. **수학**: 숫자, 변수, 연산자, 함수
3. **물리**: 벡터, 힘, 에너지 컴포넌트
4. **생물**: DNA 염기서열, 세포 구조

### AI 통합 (Future)
- 자동 문제 분해 (LLM 활용)
- 학습 패턴 분석
- 개인화된 힌트 제공
