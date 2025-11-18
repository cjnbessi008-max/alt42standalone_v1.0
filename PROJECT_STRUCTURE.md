# Dancing Line Sorting - 프로젝트 구조

## 📁 디렉토리 구조

```
dancingline/
├── 📄 version.php                  # Moodle 플러그인 버전 정보
├── 📄 index.php                    # 메인 앱 진입점 (학생용)
├── 📄 create_problem.php           # 문제 생성 페이지 (교사용)
├── 📄 get_problem.php              # 문제 조회 API
├── 📄 save_attempt.php             # 시도 저장 API
│
├── 📁 db/                          # 데이터베이스 관련
│   ├── install.xml                 # DB 스키마 정의
│   └── access.php                  # 권한 정의
│
├── 📁 lang/                        # 다국어 지원
│   ├── en/
│   │   └── local_dancingline.php   # 영어 언어팩
│   └── ko/
│       └── local_dancingline.php   # 한국어 언어팩
│
├── 📁 js/                          # JavaScript 파일
│   ├── sorting-algorithms.js       # 정렬 알고리즘 구현
│   └── dancingline.js              # 메인 앱 로직
│
├── 📁 styles/                      # 스타일시트
│   └── styles.css                  # 메인 스타일
│
├── 📁 images/                      # 이미지 파일 (비어있음)
│
├── 📁 tasks/                       # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
│
├── 📄 README.md                    # 프로젝트 설명서
├── 📄 INSTALL.md                   # 설치 가이드
├── 📄 PROJECT_STRUCTURE.md         # 이 파일
└── 📄 .gitignore                   # Git 무시 파일 목록
```

## 🔑 주요 파일 설명

### 진입점 (Entry Points)

#### `index.php`
- **용도**: 학생용 메인 애플리케이션
- **기능**:
  - 스마트폰 UI 렌더링
  - 정렬 알고리즘 선택
  - 수직선 정렬 시각화
  - 통계 표시
- **접근**: `/local/dancingline/index.php`

#### `create_problem.php`
- **용도**: 교사용 문제 생성 인터페이스
- **기능**:
  - 문제 생성 폼
  - 기존 문제 목록
  - 랜덤 숫자 생성
- **접근**: `/local/dancingline/create_problem.php`
- **권한**: `local/dancingline:createproblem`

### API 엔드포인트

#### `get_problem.php`
- **메서드**: POST
- **기능**: 문제 ID로 문제 데이터 조회
- **입력**: `{sesskey, problemid}`
- **출력**: `{id, name, description, numbers, algorithm, difficulty}`

#### `save_attempt.php`
- **메서드**: POST
- **기능**: 학생의 정렬 시도 저장
- **입력**: `{sesskey, userid, data: {comparisons, swaps, timeElapsed, numbers, algorithm}}`
- **출력**: `{success, attemptid, score, message}`

### JavaScript 모듈

#### `js/sorting-algorithms.js`
- **클래스**: `SortingAlgorithms`
- **메서드**:
  - `bubbleSort(arr)` - 버블 정렬
  - `selectionSort(arr)` - 선택 정렬
  - `insertionSort(arr)` - 삽입 정렬
  - `quickSort(arr)` - 퀵 정렬
- **기능**: 정렬 과정을 단계별로 기록

#### `js/dancingline.js`
- **클래스**: `DancingLineApp`
- **메서드**:
  - `generateRandomNumbers()` - 랜덤 숫자 생성
  - `displayNumbers()` - 수직선에 숫자 표시
  - `startSorting()` - 정렬 시작
  - `visualizeStep()` - 단계별 시각화
  - `saveAttempt()` - Moodle에 저장
  - `loadProblemFromMoodle()` - 문제 로드

### 데이터베이스

#### `db/install.xml`
테이블 정의:

**`mdl_local_dancingline_problems`**
- 정렬 문제 저장
- 필드: id, courseid, name, description, numbers(JSON), algorithm, difficulty

**`mdl_local_dancingline_attempts`**
- 학생 시도 기록
- 필드: id, problemid, userid, comparisons, swaps, timeelapsed, completed, score

#### `db/access.php`
권한 정의:
- `local/dancingline:view` - 앱 접근
- `local/dancingline:createproblem` - 문제 생성
- `local/dancingline:viewreports` - 리포트 조회

### 스타일

#### `styles/styles.css`
주요 클래스:
- `.phone-frame` - 스마트폰 프레임
- `.phone-screen` - 스마트폰 화면
- `.number-item` - 숫자 원 요소
- `.number-item.comparing` - 비교 중 상태
- `.number-item.swapping` - 교환 중 상태
- `.number-item.sorted` - 정렬 완료 상태

## 🎨 UI 컴포넌트

### 스마트폰 화면 (우측 하단)
```
┌─────────────────────┐
│   App Header        │ - 제목, 알고리즘 선택
├─────────────────────┤
│                     │
│   Visualization     │ - 수직선 + 숫자들
│      Area           │
│                     │
├─────────────────────┤
│   Controls          │ - 생성, 시작, 일시정지, 리셋
├─────────────────────┤
│   Speed Control     │ - 속도 슬라이더
├─────────────────────┤
│   Statistics        │ - 비교, 교환, 시간
└─────────────────────┘
```

### 문제 정보 패널 (좌측)
- 문제 설명
- 현재 배열
- 통계 정보

## 🔄 데이터 흐름

### 학생 워크플로우
```
1. index.php 접속
   ↓
2. 숫자 생성 or URL에서 problemid 로드
   ↓
3. get_problem.php (problemid 있는 경우)
   ↓
4. 알고리즘 선택 및 정렬 시작
   ↓
5. JavaScript에서 단계별 시각화
   ↓
6. save_attempt.php로 결과 저장
```

### 교사 워크플로우
```
1. create_problem.php 접속
   ↓
2. 문제 정보 입력
   ↓
3. POST 요청으로 DB에 저장
   ↓
4. 학생에게 URL 공유
   (index.php?problemid=123)
```

## 🔧 확장 포인트

### 새 정렬 알고리즘 추가
1. `js/sorting-algorithms.js`에 메서드 추가
2. `index.php`의 `<select>` 옵션 추가
3. 언어 파일에 번역 추가

### UI 커스터마이징
1. `styles/styles.css` 수정
2. CSS 변수 활용:
   - 색상 그라데이션
   - 애니메이션 속도
   - 레이아웃 크기

### API 확장
1. 새 PHP 파일 생성
2. Moodle 인증 포함
3. JSON 응답 반환

## 📊 성능 고려사항

- **애니메이션**: CSS transitions (GPU 가속)
- **정렬 단계**: 메모리에 사전 계산
- **AJAX 요청**: fetch API 사용
- **캐싱**: Moodle 캐시 시스템 활용

## 🔒 보안 체크포인트

- ✅ `require_login()` - 모든 PHP 파일
- ✅ `confirm_sesskey()` - POST 요청
- ✅ `require_capability()` - 권한 확인
- ✅ Moodle DML API - SQL 인젝션 방지
- ✅ `htmlspecialchars()` - XSS 방지

## 📦 배포 체크리스트

- [ ] version.php 버전 번호 증가
- [ ] 데이터베이스 마이그레이션 테스트
- [ ] 다국어 문자열 완성도 확인
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 반응형 확인
- [ ] 권한 설정 검증
- [ ] 성능 테스트 (큰 배열)
- [ ] 문서 업데이트

## 🚀 다음 개발 단계

1. **Phase 1**: 기본 기능 안정화
2. **Phase 2**: 추가 정렬 알고리즘 (병합, 힙)
3. **Phase 3**: 리포트 및 분석 대시보드
4. **Phase 4**: 게임화 요소 (리더보드, 배지)
5. **Phase 5**: 모바일 앱 버전

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
**개발자**: KAIST Touch Math Academy
