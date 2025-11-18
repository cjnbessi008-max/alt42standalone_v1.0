# Focus Light - 프로젝트 개요

## 프로젝트 소개

Focus Light는 도형 학습에서 핵심 조건(각도, 변, 반지름 등)을 **밝게 빛나게 하여** 학생들의 이해도를 높이는 웹 애플리케이션입니다.

### 핵심 개념

교육 심리학에서 **주의 집중(Attention Focus)**은 학습 효과에 결정적 영향을 미칩니다. Focus Light는 시각적 강조를 통해:

1. **선택적 주의 유도**: 중요한 요소에 시선 집중
2. **인지 부하 감소**: 불필요한 정보 필터링
3. **기억 강화**: 강조된 정보의 장기 기억 전환 촉진
4. **능동적 학습**: 상호작용을 통한 참여도 향상

## 주요 기능

### 1. 가상 스마트폰 화면
- 우측 하단 고정 배치
- 실제 스마트폰 UI/UX 재현
- 최소화/최대화 기능
- 반응형 디자인

### 2. SVG 도형 렌더링
- **삼각형**: 직각삼각형, 이등변삼각형, 정삼각형
- **사각형**: 정사각형, 직사각형, 평행사변형
- **원**: 반지름, 지름, 둘레, 넓이

### 3. Focus Light 효과

#### 애니메이션 타입
- **Glow**: 부드럽게 빛나는 효과 (기본)
- **Pulse**: 맥박처럼 커졌다 작아지는 효과
- **Flash**: 깜빡이는 효과
- **Static**: 정적 강조

#### 강도 레벨 (1-5)
- **Level 1**: 미세한 빛 (subtle hint)
- **Level 2**: 약한 빛
- **Level 3**: 중간 빛 (기본 권장)
- **Level 4**: 강한 빛
- **Level 5**: 매우 강한 빛 (maximum emphasis)

#### 색상 코딩
- **금색 (#FFD700)**: 빗변, 대각선
- **빨강 (#FF6B6B)**: 각도, 꼭짓점
- **청록 (#4ECDC4)**: 변, 길이
- **보라 (#9B59B6)**: 반지름, 중심
- **녹색 (#50C878)**: 넓이, 영역
- **주황 (#F39C12)**: 특수 요소

### 4. 상호작용
- 호버 시 확대 효과
- 클릭 가능한 요소
- 라벨을 통한 정보 제공
- 실시간 설정 변경

## 기술 아키텍처

### 프론트엔드
```
HTML5
  └─ 시맨틱 마크업
  └─ SVG 그래픽

CSS3
  └─ Flexbox/Grid 레이아웃
  └─ CSS Animations
  └─ Custom Properties (변수)
  └─ Media Queries (반응형)

JavaScript (ES6+)
  └─ 모듈 패턴
  └─ Fetch API (비동기)
  └─ DOM Manipulation
  └─ Event Delegation
```

### 백엔드
```
PHP 7.1.9
  └─ PDO (MySQL 연결)
  └─ RESTful API
  └─ JSON 응답
  └─ 에러 핸들링

MySQL 5.7
  └─ InnoDB 엔진
  └─ UTF-8MB4 인코딩
  └─ JSON 데이터 타입
  └─ Foreign Key 제약조건
```

### 데이터 흐름
```
사용자 클릭 (문제 선택)
    ↓
JavaScript Fetch API
    ↓
PHP API (problems.php)
    ↓
MySQL 데이터베이스 조회
    ↓
JSON 응답 (문제 + 도형 + Focus 요소)
    ↓
Shape Renderer (SVG 생성)
    ↓
Focus Light 적용 (CSS 클래스 추가)
    ↓
화면에 강조된 도형 표시
```

## 파일 구조 설명

### API 파일
- **config.php**: 데이터베이스 연결 및 공통 함수
- **problems.php**: 문제 CRUD API
- **shapes.php**: 도형 데이터 API
- **focus-elements.php**: Focus Light 요소 API

### 프론트엔드 파일
- **index.html**: 메인 페이지 구조
- **css/main.css**: 전체 레이아웃 및 컴포넌트 스타일
- **css/smartphone.css**: 가상 스마트폰 UI 스타일
- **css/focus-light.css**: Focus Light 애니메이션 및 효과
- **js/app.js**: 메인 앱 로직, API 통신, 이벤트 처리
- **js/shape-renderer.js**: SVG 도형 렌더링 엔진
- **js/focus-light.js**: Focus Light 효과 적용 모듈

### 데이터베이스
- **schema.sql**: 테이블 스키마 및 샘플 데이터

## 사용 시나리오

### 시나리오 1: 직각삼각형 학습

1. 선생님이 "직각삼각형의 빗변 찾기" 문제 생성
2. 학생이 앱에서 문제 선택
3. 스마트폰 화면에 직각삼각형 표시
4. Focus Light로 다음 요소 강조:
   - **빗변**: 금색 Glow 효과 (강도 4)
   - **직각**: 빨강 Pulse 효과 (강도 3)
5. 학생이 각 요소에 마우스를 올려 라벨 확인
6. 시각적 강조로 빗변의 개념 이해

### 시나리오 2: 원의 둘레 학습

1. 문제: "반지름이 주어진 원의 둘레 구하기"
2. 원 도형 표시
3. Focus Light 적용:
   - **반지름**: 보라색 Glow (강도 4)
   - **중심점**: 보라색 Static (강도 2)
4. 라벨: "반지름 (r) = 100"
5. 학생이 반지름과 둘레의 관계 시각적으로 이해

### 시나리오 3: 정사각형 넓이

1. 문제: "한 변의 길이가 주어진 정사각형의 넓이"
2. 정사각형 표시
3. Focus Light:
   - **한 변**: 청록색 Glow (강도 4)
   - **내부 영역**: 연한 청록색 (opacity 0.2)
4. 학생이 한 변과 넓이의 관계 파악

## 교육적 효과

### 1. 시각적 학습 강화
- 색상 코딩으로 요소 구분
- 움직임으로 주의 유도
- 명확한 라벨링

### 2. 인지 부하 관리
- 한 번에 하나의 개념 집중
- 불필요한 정보 최소화
- 단계적 정보 제공

### 3. 학습 몰입도 향상
- 상호작용 요소
- 즉각적 피드백
- 시각적 보상

### 4. 개별화 학습
- 강도 조절 가능
- 애니메이션 선택
- 자기 주도 학습

## 확장 가능성

### 단기 (3개월)
- [ ] 더 많은 도형 타입 (다각형, 타원)
- [ ] 애니메이션 추가 (rotate, vibrate, wave)
- [ ] 음성 안내 기능
- [ ] 문제 풀이 모드

### 중기 (6개월)
- [ ] Moodle LMS 연동
- [ ] 학습 진도 추적
- [ ] 성취도 분석
- [ ] 모바일 앱 (React Native)

### 장기 (12개월)
- [ ] AI 기반 맞춤 학습
- [ ] 3D 도형 지원
- [ ] VR/AR 통합
- [ ] 다국어 지원 (영어, 일본어, 중국어)

## Moodle 연동 계획

### 방법 1: LTI (Learning Tools Interoperability)
```
Moodle → LTI Provider → Focus Light App
```
- 표준 프로토콜 사용
- SSO 지원
- 성적 자동 동기화

### 방법 2: 외부 도구 활동
```
Moodle External Tool → iframe → Focus Light
```
- 간단한 통합
- 빠른 구현
- 제한된 상호작용

### 방법 3: Moodle 플러그인
```
Moodle Plugin → Direct Integration → Focus Light
```
- 완전한 통합
- 네이티브 경험
- 높은 개발 비용

## 성능 최적화

### 프론트엔드
- CSS 애니메이션 사용 (GPU 가속)
- SVG 최적화 (불필요한 경로 제거)
- 이벤트 위임 (Event Delegation)
- Lazy Loading

### 백엔드
- 쿼리 최적화 (인덱스 활용)
- API 응답 캐싱 (Redis)
- 데이터베이스 연결 풀링
- Gzip 압축

## 보안 고려사항

### 입력 검증
- SQL Injection 방어 (PDO Prepared Statements)
- XSS 방어 (Output Encoding)
- CSRF 토큰 (추가 예정)

### 접근 제어
- 인증 (Authentication) - Moodle 연동 시
- 권한 (Authorization) - 역할 기반
- Rate Limiting - API 남용 방지

### 데이터 보호
- HTTPS 강제 (프로덕션)
- 비밀번호 해싱 (bcrypt)
- 민감 정보 로깅 제외

## 테스트 전략

### 단위 테스트
- PHP API 함수
- JavaScript 모듈
- 데이터베이스 쿼리

### 통합 테스트
- API 엔드포인트
- 데이터 흐름
- 에러 핸들링

### UI 테스트
- 도형 렌더링
- Focus Light 효과
- 반응형 레이아웃

### 브라우저 호환성
- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 성공 지표 (KPI)

### 사용자 참여도
- 일일 활성 사용자 (DAU)
- 평균 세션 시간
- 문제 완료율

### 학습 효과
- 정답률 향상
- 개념 이해도 (사전/사후 테스트)
- 학생 만족도

### 기술 지표
- API 응답 시간 (< 200ms)
- 페이지 로드 시간 (< 2초)
- 에러 발생률 (< 1%)

## 라이선스 및 저작권

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여자

- 초기 개발: Claude (AI Assistant)
- 개념 및 요구사항: KAIST Touch Math Academy

## 참고 자료

### 교육 이론
- Attention Theory (주의 이론)
- Cognitive Load Theory (인지 부하 이론)
- Visual Learning (시각적 학습)

### 기술 문서
- SVG Specification (W3C)
- CSS Animations (MDN)
- PHP PDO (PHP.net)
- MySQL JSON Functions

## 연락처

프로젝트 관련 문의나 협업 제안은 이슈 트래커를 통해 주시기 바랍니다.
