# LMS Integration & Problem Flow Diagrams

> AI 교육 시스템 파이프라인의 LMS 연동 및 문제 흐름 정리

## 목차
1. [전체 시스템 아키텍처](#1-전체-시스템-아키텍처)
2. [AI 파이프라인 흐름](#2-ai-파이프라인-흐름)
3. [교사 모듈 생성 워크플로우](#3-교사-모듈-생성-워크플로우)
4. [학생 학습 흐름](#4-학생-학습-흐름)
5. [데이터 흐름도](#5-데이터-흐름도)
6. [LMS 연동 아키텍처](#6-lms-연동-아키텍처)
7. [문제 생성 및 평가 프로세스](#7-문제-생성-및-평가-프로세스)

---

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "클라이언트 계층"
        TeacherUI[교사 UI<br/>React]
        StudentUI[학생 UI<br/>React]
        AdminUI[관리자 대시보드<br/>React]
    end

    subgraph "API 게이트웨이"
        Gateway[API Gateway<br/>Node.js/Express]
        Auth[인증/인가<br/>JWT]
        RateLimit[Rate Limiter]
    end

    subgraph "AI 파이프라인 오케스트레이터"
        Orchestrator[파이프라인 관리자<br/>Python/FastAPI]

        subgraph "파이프라인 단계"
            WorldModel[세계관 재구성]
            RuleEngine[룰 생성 엔진]
            DataMgr[데이터 관리자]
            InputStrategy[입력 전략 설계]
            UIGen[UI 자동 생성]
            Deployer[배포 서비스]
        end
    end

    subgraph "외부 서비스"
        Claude[Claude API<br/>Anthropic]
        LMS[외부 LMS<br/>Canvas/Moodle]
    end

    subgraph "데이터 계층"
        PostgreSQL[(PostgreSQL<br/>메인 DB)]
        Redis[(Redis<br/>캐시/세션)]
        S3[(S3/MinIO<br/>파일 스토리지)]
    end

    subgraph "LMS 통합"
        LTI[LTI 어댑터]
        GradeSync[성적 동기화]
        RosterSync[학생 명부 동기화]
    end

    TeacherUI --> Gateway
    StudentUI --> Gateway
    AdminUI --> Gateway

    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> Orchestrator

    Orchestrator --> WorldModel
    WorldModel --> RuleEngine
    RuleEngine --> DataMgr
    DataMgr --> InputStrategy
    InputStrategy --> UIGen
    UIGen --> Deployer

    Orchestrator <--> Claude
    Orchestrator --> PostgreSQL
    Orchestrator --> Redis
    Deployer --> S3

    Gateway <--> LTI
    LTI <--> LMS
    GradeSync --> LMS
    RosterSync <--> LMS

    PostgreSQL --> GradeSync
    PostgreSQL --> RosterSync

    classDef frontend fill:#e1f5ff,stroke:#01579b
    classDef backend fill:#fff3e0,stroke:#e65100
    classDef ai fill:#f3e5f5,stroke:#4a148c
    classDef data fill:#e8f5e9,stroke:#1b5e20
    classDef external fill:#fce4ec,stroke:#880e4f

    class TeacherUI,StudentUI,AdminUI frontend
    class Gateway,Auth,RateLimit,Orchestrator backend
    class WorldModel,RuleEngine,DataMgr,InputStrategy,UIGen,Deployer ai
    class PostgreSQL,Redis,S3 data
    class Claude,LMS,LTI,GradeSync,RosterSync external
```

---

## 2. AI 파이프라인 흐름

```mermaid
flowchart TD
    Start([교사 요청 입력]) --> ParseRequest[자연어 요청 파싱<br/>NLP 처리]

    ParseRequest --> WorldModel[Phase 1: 세계관 재구성]

    subgraph "Phase 1: 세계관 재구성"
        WM1[개념 추출<br/>Concept Extraction]
        WM2[관계 매핑<br/>Relationship Mapping]
        WM3[연산 정의<br/>Operation Definition]
        WM4[개념 그래프 생성<br/>Concept Graph]

        WM1 --> WM2 --> WM3 --> WM4
    end

    WorldModel --> RuleGen[Phase 2: 룰 생성]

    subgraph "Phase 2: 룰 생성 엔진"
        RG1{복잡도 분석}
        RG2A[단순 룰 → 코드 생성<br/>Python/JavaScript]
        RG2B[복잡 룰 → 온톨로지 변환<br/>OWL/RDF]
        RG3[검증 룰 생성]

        RG1 -->|단순| RG2A
        RG1 -->|복잡| RG2B
        RG2A --> RG3
        RG2B --> RG3
    end

    RuleGen --> DataMgmt[Phase 3: 데이터 관리]

    subgraph "Phase 3: 데이터 관리"
        DM1{기존 데이터 확인}
        DM2A[데이터 있음<br/>스키마 매핑]
        DM2B[데이터 없음<br/>Pseudo 데이터 생성]
        DM3[DB 스키마 설계<br/>3NF 정규화]
        DM4[마이그레이션 실행<br/>인덱스 생성]

        DM1 -->|존재| DM2A
        DM1 -->|부재| DM2B
        DM2A --> DM3
        DM2B --> DM3
        DM3 --> DM4
    end

    DataMgmt --> InputStrategy[Phase 4: 입력 전략]

    subgraph "Phase 4: 입력 전략 설계"
        IS1[입력 방법 결정]
        IS2[폼 입력 vs 행동 추적 vs 대화형]
        IS3[검증 전략 수립]
        IS4[데이터 흐름 매핑]

        IS1 --> IS2 --> IS3 --> IS4
    end

    InputStrategy --> UIGeneration[Phase 5: UI 생성]

    subgraph "Phase 5: UI 자동 생성"
        UI1{기존 UI 재사용 가능?}
        UI2A[기존 컴포넌트 재사용]
        UI2B[새 컴포넌트 생성]
        UI3[UX 여정 분석]
        UI4[React 컴포넌트 생성<br/>접근성 적용]
        UI5[스타일링 & 반응형]

        UI1 -->|가능| UI2A
        UI1 -->|불가능| UI2B
        UI2A --> UI3
        UI2B --> UI3
        UI3 --> UI4 --> UI5
    end

    UIGeneration --> Deploy[Phase 6: 배포]

    subgraph "Phase 6: 시스템 완성"
        DP1[API 엔드포인트 생성]
        DP2[통합 테스트 생성]
        DP3[Docker 컨테이너화]
        DP4[문서 자동 생성]
        DP5[배포 실행]

        DP1 --> DP2 --> DP3 --> DP4 --> DP5
    end

    Deploy --> Review{교사 검토}
    Review -->|수정 필요| Refine[피드백 반영<br/>재생성]
    Review -->|승인| Complete([모듈 활성화<br/>학생 접근 가능])

    Refine --> WorldModel

    style Start fill:#4caf50,stroke:#2e7d32,color:#fff
    style Complete fill:#2196f3,stroke:#0d47a1,color:#fff
    style Review fill:#ff9800,stroke:#e65100
```

---

## 3. 교사 모듈 생성 워크플로우

```mermaid
sequenceDiagram
    actor Teacher as 교사
    participant UI as 교사 UI
    participant API as API Gateway
    participant Orchestrator as AI 파이프라인
    participant Claude as Claude API
    participant DB as PostgreSQL
    participant Deploy as 배포 서비스

    Teacher->>UI: 1. 새 모듈 요청 작성<br/>(자연어 설명)
    UI->>API: 2. POST /api/modules/create
    API->>Orchestrator: 3. 파이프라인 시작

    Note over Orchestrator: Phase 1: 세계관 재구성
    Orchestrator->>Claude: 4. 개념 추출 요청
    Claude-->>Orchestrator: 5. 개념 그래프 반환
    Orchestrator->>UI: 6. 진행 상황 업데이트 (15%)

    Orchestrator->>Claude: 7. AI 이해도 확인 요청
    Claude-->>Orchestrator: 8. 명확화 질문 생성
    Orchestrator->>UI: 9. 명확화 질문 전달
    UI->>Teacher: 10. 질문 표시
    Teacher->>UI: 11. 답변 제공
    UI->>Orchestrator: 12. 답변 전달

    Note over Orchestrator: Phase 2: 룰 생성
    Orchestrator->>Claude: 13. 룰 생성 요청
    Claude-->>Orchestrator: 14. 비즈니스 룰 코드
    Orchestrator->>UI: 15. 진행 상황 (35%)

    Note over Orchestrator: Phase 3: 데이터 관리
    Orchestrator->>DB: 16. 기존 데이터 확인
    DB-->>Orchestrator: 17. 데이터 상태
    Orchestrator->>Claude: 18. 스키마 설계 요청
    Claude-->>Orchestrator: 19. DB 스키마
    Orchestrator->>DB: 20. 마이그레이션 실행
    Orchestrator->>UI: 21. 진행 상황 (55%)

    Note over Orchestrator: Phase 4: 입력 전략
    Orchestrator->>Claude: 22. 입력 전략 요청
    Claude-->>Orchestrator: 23. 입력 방법 정의
    Orchestrator->>UI: 24. 진행 상황 (70%)

    Note over Orchestrator: Phase 5: UI 생성
    Orchestrator->>Claude: 25. UI 컴포넌트 요청
    Claude-->>Orchestrator: 26. React 컴포넌트 코드
    Orchestrator->>UI: 27. 진행 상황 (85%)

    Note over Orchestrator: Phase 6: 배포
    Orchestrator->>Deploy: 28. 배포 패키지 생성
    Deploy-->>Orchestrator: 29. 배포 완료
    Orchestrator->>DB: 30. 모듈 상태 업데이트
    Orchestrator->>UI: 31. 생성 완료 (100%)

    UI->>Teacher: 32. 미리보기 제공
    Teacher->>UI: 33. 테스트 & 검토

    alt 수정 필요
        Teacher->>UI: 34a. 수정 요청
        UI->>Orchestrator: 35a. 재생성 요청
        Note over Orchestrator: 일부 단계 재실행
    else 승인
        Teacher->>UI: 34b. 승인 & 배포
        UI->>API: 35b. PATCH /api/modules/{id}/activate
        API->>DB: 36b. 모듈 활성화
        DB-->>UI: 37b. 성공
        UI->>Teacher: 38b. 학생 접근 가능 안내
    end
```

---

## 4. 학생 학습 흐름

```mermaid
stateDiagram-v2
    [*] --> Login: 학생 로그인

    Login --> Dashboard: 인증 성공
    Dashboard --> SelectModule: 모듈 선택

    SelectModule --> LoadModule: 모듈 로드
    LoadModule --> CheckProgress: 진행 상황 확인

    CheckProgress --> ResumeProgress: 기존 진행 있음
    CheckProgress --> StartNew: 처음 시작

    ResumeProgress --> PresentProblem
    StartNew --> ShowIntro: 모듈 소개
    ShowIntro --> PresentProblem: 학습 시작

    state PresentProblem {
        [*] --> DisplayProblem: 문제 표시
        DisplayProblem --> WaitInput: 입력 대기

        WaitInput --> ValidateInput: 답안 제출
        ValidateInput --> CheckAnswer: 검증

        CheckAnswer --> Correct: 정답
        CheckAnswer --> Incorrect: 오답

        Correct --> ProvideFeedback: 칭찬 & 설명
        Incorrect --> ProvideHint: 힌트 제공

        ProvideHint --> RetryCount: 재시도 횟수 확인
        RetryCount --> WaitInput: 재시도 가능
        RetryCount --> ShowSolution: 최대 시도 초과

        ShowSolution --> ProvideFeedback
        ProvideFeedback --> [*]
    }

    PresentProblem --> UpdateProgress: 진행 상황 저장
    UpdateProgress --> CheckCompletion: 완료 여부 확인

    CheckCompletion --> NextProblem: 더 있음
    CheckCompletion --> AssessmentCheck: 단원 완료

    NextProblem --> PresentProblem

    AssessmentCheck --> FinalAssessment: 평가 필요
    AssessmentCheck --> ModuleComplete: 평가 불필요

    FinalAssessment --> PresentProblem: 평가 문제
    FinalAssessment --> ModuleComplete: 평가 완료

    ModuleComplete --> RewardScreen: 성과 표시
    RewardScreen --> Dashboard: 대시보드 복귀

    state "데이터 추적" as Tracking {
        TrackTime: 소요 시간 기록
        TrackAttempts: 시도 횟수 기록
        TrackBehavior: 행동 패턴 분석
        TrackMastery: 숙달도 평가
    }

    PresentProblem --> Tracking: 병렬 추적
    UpdateProgress --> Tracking

    Dashboard --> [*]: 로그아웃
```

---

## 5. 데이터 흐름도

```mermaid
graph LR
    subgraph "입력"
        TR[교사 요청<br/>자연어]
        SA[학생 답안]
        BD[행동 데이터]
    end

    subgraph "처리"
        NLP[NLP 엔진<br/>Claude API]
        RuleProc[룰 프로세서]
        DataVal[데이터 검증]
        Analytics[분석 엔진]
    end

    subgraph "저장소"
        ModuleDB[(모듈 메타데이터<br/>PostgreSQL)]
        ContentDB[(학습 콘텐츠<br/>PostgreSQL)]
        ProgressDB[(학생 진행 상황<br/>PostgreSQL)]
        Cache[(세션 캐시<br/>Redis)]
        Files[(생성 파일<br/>S3)]
    end

    subgraph "출력"
        GenCode[생성된 코드<br/>Python/JS/React]
        GenUI[UI 컴포넌트]
        Report[학습 리포트]
        Grade[성적 데이터]
    end

    subgraph "외부 연동"
        LMS[LMS<br/>Canvas/Moodle]
        SSO[SSO<br/>인증]
    end

    TR --> NLP
    NLP --> ModuleDB
    NLP --> GenCode
    GenCode --> Files

    SA --> DataVal
    DataVal --> RuleProc
    RuleProc --> ProgressDB

    BD --> Analytics
    Analytics --> ProgressDB

    ModuleDB --> GenUI
    ContentDB --> GenUI

    ProgressDB --> Report
    ProgressDB --> Grade

    Cache <--> NLP
    Cache <--> RuleProc

    ModuleDB <--> LMS
    Grade --> LMS
    SSO <--> LMS

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef process fill:#fff3e0,stroke:#ef6c00
    classDef storage fill:#e8f5e9,stroke:#2e7d32
    classDef output fill:#f3e5f5,stroke:#6a1b9a
    classDef external fill:#fce4ec,stroke:#c2185b

    class TR,SA,BD input
    class NLP,RuleProc,DataVal,Analytics process
    class ModuleDB,ContentDB,ProgressDB,Cache,Files storage
    class GenCode,GenUI,Report,Grade output
    class LMS,SSO external
```

---

## 6. LMS 연동 아키텍처

```mermaid
graph TB
    subgraph "AI 교육 시스템"
        WebApp[웹 애플리케이션<br/>React]
        APIServer[API 서버<br/>FastAPI]
        AuthService[인증 서비스]
        GradeService[성적 서비스]
        ContentService[콘텐츠 서비스]

        WebApp --> APIServer
        APIServer --> AuthService
        APIServer --> GradeService
        APIServer --> ContentService
    end

    subgraph "LTI 통합 계층"
        LTIProvider[LTI Provider<br/>v1.3]
        LTIConsumer[LTI Consumer]
        DeepLinking[Deep Linking]
        AGS[Assignment & Grade<br/>Services]
        NRPS[Names & Role<br/>Provisioning]

        LTIProvider --> DeepLinking
        LTIProvider --> AGS
        LTIProvider --> NRPS
    end

    subgraph "외부 LMS"
        Canvas[Canvas LMS]
        Moodle[Moodle]
        Blackboard[Blackboard]
        CustomLMS[기타 LMS]

        LMSAuth[LMS 인증]
        LMSGrade[LMS 성적부]
        LMSRoster[LMS 학생 명부]
    end

    AuthService <--> LTIProvider
    GradeService <--> LTIProvider
    ContentService <--> LTIProvider

    LTIProvider <--> LTIConsumer

    LTIConsumer <--> Canvas
    LTIConsumer <--> Moodle
    LTIConsumer <--> Blackboard
    LTIConsumer <--> CustomLMS

    Canvas --> LMSAuth
    Canvas --> LMSGrade
    Canvas --> LMSRoster

    Moodle --> LMSAuth
    Moodle --> LMSGrade
    Moodle --> LMSRoster

    AGS <--> LMSGrade
    NRPS <--> LMSRoster
    DeepLinking --> Canvas
    DeepLinking --> Moodle

    style LTIProvider fill:#ffeb3b,stroke:#f57f17
    style LTIConsumer fill:#ffeb3b,stroke:#f57f17
```

### LMS 연동 시나리스

```mermaid
sequenceDiagram
    participant LMS as 외부 LMS<br/>(Canvas/Moodle)
    participant LTI as LTI 어댑터
    participant Auth as 인증 서비스
    participant App as AI 교육 시스템
    participant Grade as 성적 서비스
    participant DB as 데이터베이스

    Note over LMS,DB: 시나리오 1: 학생이 LMS에서 모듈 접근

    LMS->>LTI: 1. LTI Launch Request<br/>(OAuth 서명 포함)
    LTI->>Auth: 2. 서명 검증 요청
    Auth-->>LTI: 3. 검증 성공
    LTI->>App: 4. 사용자 컨텍스트 전달<br/>(user_id, course_id, role)

    App->>DB: 5. 학생 정보 조회/생성
    DB-->>App: 6. 학생 데이터
    App->>LMS: 7. 학생 명부 동기화 요청 (NRPS)
    LMS-->>App: 8. 학생 목록 반환

    App-->>LMS: 9. 모듈 UI 렌더링 (iframe)

    Note over LMS,DB: 시나리오 2: 학생 학습 완료 후 성적 전송

    App->>Grade: 10. 학습 완료 이벤트
    Grade->>DB: 11. 성적 저장
    Grade->>LTI: 12. LMS 성적 전송 요청
    LTI->>LMS: 13. AGS API 호출<br/>POST /scores
    LMS-->>LTI: 14. 성적 저장 확인
    LTI-->>Grade: 15. 전송 성공

    Note over LMS,DB: 시나리오 3: 교사가 LMS에서 모듈 추가

    LMS->>LTI: 16. Deep Linking Request
    LTI->>App: 17. 모듈 선택 UI 표시
    App-->>LMS: 18. 사용 가능 모듈 목록
    LMS->>App: 19. 모듈 선택
    App->>LTI: 20. Deep Linking Response
    LTI->>LMS: 21. 모듈 링크 생성
    LMS-->>LMS: 22. 코스에 모듈 추가
```

---

## 7. 문제 생성 및 평가 프로세스

```mermaid
flowchart TD
    Start([학생이 문제 요청]) --> CheckType{문제 유형 확인}

    CheckType -->|신규 생성| GenNew[동적 문제 생성]
    CheckType -->|기존 풀| LoadExist[문제 은행에서 로드]

    subgraph "동적 문제 생성"
        GenNew --> CheckRules[모듈 룰 확인]
        CheckRules --> DiffAdapt{난이도 조정 필요?}

        DiffAdapt -->|Yes| AnalyzeHistory[학생 이력 분석]
        DiffAdapt -->|No| SetDiff[기본 난이도]

        AnalyzeHistory --> CalcMastery[숙달도 계산]
        CalcMastery --> AdjustDiff[난이도 조정]

        SetDiff --> GenParams[문제 파라미터 생성]
        AdjustDiff --> GenParams

        GenParams --> GenProblem[문제 생성<br/>룰 엔진 실행]
        GenProblem --> GenSolution[정답 계산]
        GenSolution --> SaveProblem[문제 저장]
    end

    LoadExist --> RetrieveProblem[문제 데이터 조회]
    SaveProblem --> Display
    RetrieveProblem --> Display[문제 표시]

    Display --> WaitAnswer[답안 입력 대기]
    WaitAnswer --> Submit[답안 제출]

    Submit --> StartTimer[타이머 시작]
    StartTimer --> Validate{입력 검증}

    Validate -->|Invalid| ShowError[에러 메시지]
    ShowError --> WaitAnswer

    Validate -->|Valid| ExecuteRules[평가 룰 실행]

    subgraph "답안 평가"
        ExecuteRules --> CompareAnswer{정답 비교}

        CompareAnswer -->|정확히 일치| FullCredit[100% 점수]
        CompareAnswer -->|부분 정답| PartialCredit{부분 점수 가능?}
        CompareAnswer -->|오답| NoCredit[0% 점수]

        PartialCredit -->|Yes| CalcPartial[부분 점수 계산]
        PartialCredit -->|No| NoCredit

        FullCredit --> GenFeedback[피드백 생성]
        CalcPartial --> GenFeedback
        NoCredit --> GenFeedback
    end

    GenFeedback --> RecordAttempt[시도 기록]
    RecordAttempt --> UpdateStats[통계 업데이트]

    UpdateStats --> CheckRetry{재시도 가능?}

    CheckRetry -->|Yes| RetryOption[재시도 옵션 제공]
    CheckRetry -->|No| ShowSolution[정답 해설 표시]

    RetryOption --> UserChoice{학생 선택}
    UserChoice -->|재시도| WaitAnswer
    UserChoice -->|다음 문제| NextProb

    ShowSolution --> NextProb[다음 문제로]

    NextProb --> UpdateProgress[진행률 업데이트]
    UpdateProgress --> SyncLMS{LMS 연동?}

    SyncLMS -->|Yes| SendGrade[성적 전송<br/>AGS API]
    SyncLMS -->|No| End

    SendGrade --> End([완료])

    style Start fill:#4caf50,stroke:#2e7d32,color:#fff
    style End fill:#2196f3,stroke:#0d47a1,color:#fff
    style CompareAnswer fill:#ff9800,stroke:#e65100
    style DiffAdapt fill:#9c27b0,stroke:#4a148c
```

### 평가 룰 복잡도 분석

```mermaid
graph TD
    RuleInput[평가 룰] --> Analyze[복잡도 분석]

    Analyze --> CountCond[조건 개수 카운트]
    Analyze --> CountDepth[중첩 깊이 측정]
    Analyze --> CountEntity[엔티티 개수]
    Analyze --> CheckCycle[순환 참조 확인]

    CountCond --> Threshold{임계값 초과?}
    CountDepth --> Threshold
    CountEntity --> Threshold
    CheckCycle --> Threshold

    Threshold -->|단순<br/>조건≤5<br/>깊이≤3<br/>엔티티≤4<br/>순환X| SimpleRule[단순 룰 처리]
    Threshold -->|복잡<br/>조건>5 OR<br/>깊이>3 OR<br/>엔티티>4 OR<br/>순환O| ComplexRule[복잡 룰 처리]

    SimpleRule --> CodeGen[코드 생성<br/>Python/JavaScript]
    ComplexRule --> OntologyConv[온톨로지 변환<br/>OWL/RDF]

    CodeGen --> DirectExec[직접 실행]
    OntologyConv --> Reasoner[시맨틱 추론기<br/>HermiT/Pellet]

    DirectExec --> Result[평가 결과]
    Reasoner --> Result

    style Threshold fill:#ff9800,stroke:#e65100
    style SimpleRule fill:#4caf50,stroke:#2e7d32
    style ComplexRule fill:#f44336,stroke:#b71c1c
```

---

## 구현 우선순위

### Phase 1 (MVP) - 필수 기능
1. ✅ 교사 모듈 요청 처리
2. ✅ AI 파이프라인 (세계관 → 룰 → 데이터 → UI)
3. ✅ 학생 학습 기본 흐름
4. ✅ 단순 룰 엔진
5. ✅ 기본 UI 생성 (폼 중심)

### Phase 2 - LMS 통합
1. 🔄 LTI 1.3 Provider 구현
2. 🔄 Canvas/Moodle 연동
3. 🔄 성적 동기화 (AGS)
4. 🔄 학생 명부 동기화 (NRPS)

### Phase 3 - 고급 기능
1. ⏳ 복잡 룰 → 온톨로지 변환
2. ⏳ 적응형 난이도 조정
3. ⏳ 대화형 UI
4. ⏳ 멀티 LMS 지원 확장

---

## 기술 스택 요약

| 계층 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Material-UI |
| API Gateway | Node.js, Express/Fastify |
| AI Pipeline | Python 3.11+, FastAPI, Claude API |
| Database | PostgreSQL 15+, Redis 7+ |
| LMS Integration | LTI 1.3, OAuth 2.0 |
| Deployment | Docker, Kubernetes (Future) |
| Monitoring | Prometheus, Grafana, ELK |

---

## 문서 버전

- **버전**: 1.0.0
- **작성일**: 2025-11-18
- **작성자**: AI Agent (Claude)
- **PRD 참조**: `tasks/0001-prd-ai-education-pipeline.md`
