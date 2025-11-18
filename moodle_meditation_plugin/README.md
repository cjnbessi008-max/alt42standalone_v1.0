# Meditation Routine for Moodle 3.7

## 개요 (Overview)

Moodle 퀴즈에서 복잡한 문제를 시작하기 전 5초간의 명상/정신 통일 루틴을 제공하는 플러그인입니다.

A Moodle plugin that provides a 5-second meditation routine before students start complex quiz problems.

## 주요 기능 (Key Features)

- ✅ **자동 감지**: 문제 복잡도 자동 감지 (1-5 단계)
- ✅ **시각적 안내**: 호흡 애니메이션 가이드
- ✅ **맞춤 설정**: 퀴즈별 활성화/비활성화
- ✅ **다국어 지원**: 한국어/영어 메시지
- ✅ **통계 추적**: 명상 완료율 및 분석
- ✅ **반응형 디자인**: 모바일/데스크톱 최적화

## 기술 요구사항 (Requirements)

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari (최신 버전)

## 설치 방법 (Installation)

### 방법 1: 수동 설치

1. 플러그인 폴더를 Moodle의 `local` 디렉토리에 복사:
   ```bash
   cd /path/to/moodle
   cp -r moodle_meditation_plugin/local/meditation_routine local/
   ```

2. Moodle 관리자로 로그인하여 "Site administration > Notifications" 방문

3. "Upgrade database now" 클릭하여 데이터베이스 업그레이드

### 방법 2: ZIP 파일로 설치

1. 플러그인 폴더를 ZIP으로 압축:
   ```bash
   cd moodle_meditation_plugin/local
   zip -r meditation_routine.zip meditation_routine/
   ```

2. Moodle 관리 페이지: "Site administration > Plugins > Install plugins"

3. ZIP 파일 업로드 및 설치

## 사용 방법 (Usage)

### 퀴즈 설정

1. 퀴즈 생성 또는 편집 페이지로 이동

2. "Meditation Routine" 섹션에서 설정:
   - **Enable meditation routine**: 활성화/비활성화
   - **Complexity threshold**: 명상 루틴을 표시할 최소 복잡도 (1-5)
   - **Meditation duration**: 명상 시간 (3-10초)
   - **Animation style**: 애니메이션 스타일 선택

3. 저장

### 문제 복잡도 설정

문제에 복잡도를 설정하는 두 가지 방법:

#### 방법 1: 태그 사용

문제 편집 시 태그 추가:
- `complexity:5` (가장 복잡)
- `complexity:4`
- `complexity:3`
- `complexity:2`
- `complexity:1` (가장 간단)

#### 방법 2: 자동 감지

플러그인이 문제 유형에 따라 자동으로 복잡도 추정:
- **Essay, CodeRunner**: 5 (매우 복잡)
- **Calculated**: 4 (복잡)
- **Numerical, Short answer**: 3 (보통)
- **Multiple choice**: 2 (간단)
- **True/False**: 1 (매우 간단)

### 학생 경험

1. 학생이 복잡한 문제가 있는 퀴즈 시작
2. 자동으로 명상 화면 표시:
   ```
   ┌─────────────────────────────────┐
   │   🧘 정신 통일                    │
   │   Mental Preparation            │
   │                                 │
   │        ◉ (호흡 애니메이션)        │
   │                                 │
   │   깊게 숨을 들이마시세요...        │
   │   Breathe in deeply...          │
   │                                 │
   │          5 초...                 │
   └─────────────────────────────────┘
   ```
3. 5초 카운트다운 진행 (건너뛰기 가능)
4. 자동으로 문제로 이동

## 데이터베이스 구조 (Database Schema)

### local_meditation_sessions

학생들의 명상 세션 기록:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | Primary key |
| userid | BIGINT | 사용자 ID |
| quizid | BIGINT | 퀴즈 ID |
| attemptid | BIGINT | 퀴즈 시도 ID |
| completed | TINYINT | 완료 여부 (0/1) |
| duration | INT | 지속 시간 (초) |
| timecreated | BIGINT | 생성 시간 |

### local_meditation_settings

퀴즈별 명상 설정:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | Primary key |
| quizid | BIGINT | 퀴즈 ID |
| enabled | TINYINT | 활성화 여부 (0/1) |
| complexity_threshold | INT | 복잡도 임계값 (1-5) |
| duration | INT | 지속 시간 (3-10초) |
| animation_style | VARCHAR | 애니메이션 스타일 |

## API / 웹 서비스 (Web Services)

### check_should_show

명상 루틴 표시 여부 확인:

```javascript
M.util.js_call('local_meditation_routine_check_should_show', {
    quizid: 123,
    attemptid: 456,
    userid: 789
});
```

### log_session

명상 세션 로그 기록:

```javascript
M.util.js_call('local_meditation_routine_log_session', {
    userid: 789,
    quizid: 123,
    attemptid: 456,
    duration: 5,
    completed: 1
});
```

## 커스터마이징 (Customization)

### CSS 스타일 변경

`styles.css` 파일을 수정하여 색상, 애니메이션 속도 등을 변경할 수 있습니다:

```css
/* 호흡 애니메이션 색상 변경 */
.breathing-circle {
    background: linear-gradient(135deg,
        rgba(YOUR_COLOR_1) 0%,
        rgba(YOUR_COLOR_2) 100%);
}
```

### 메시지 변경

`lang/en/local_meditation_routine.php` 또는 `lang/ko/` (한국어) 파일에서 메시지를 수정할 수 있습니다.

### 애니메이션 추가

`amd/src/meditation_routine.js`에서 새로운 애니메이션 스타일을 추가할 수 있습니다.

## 통계 및 분석 (Statistics)

관리자와 교사는 다음 통계를 확인할 수 있습니다:

- 총 명상 세션 수
- 완료된 세션 수
- 완료율 (%)
- 학생별 명상 이용 현황
- 명상 후 문제 성공률 상관관계

## 문제 해결 (Troubleshooting)

### 명상 루틴이 표시되지 않음

1. 퀴즈 설정에서 "Enable meditation routine" 활성화 확인
2. 문제 복잡도가 설정된 임계값 이상인지 확인
3. 브라우저 콘솔에서 JavaScript 오류 확인

### 데이터베이스 오류

```bash
# Moodle CLI로 데이터베이스 업그레이드
php admin/cli/upgrade.php
```

### 스타일이 적용되지 않음

브라우저 캐시 삭제 또는 Moodle 캐시 정리:
```bash
php admin/cli/purge_caches.php
```

## 성능 최적화 (Performance)

- 명상 세션 로그는 비동기로 처리
- 복잡도 계산은 캐시됨
- CSS/JS는 필요한 페이지에서만 로드

## 보안 (Security)

- 모든 사용자 입력은 Moodle 표준 검증 사용
- AJAX 호출은 Moodle 세션 토큰으로 보호
- 데이터베이스 쿼리는 prepared statements 사용

## 라이선스 (License)

GNU GPL v3 or later

## 기여 (Contributing)

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 지원 (Support)

- 문서: 이 README 파일
- 이슈 트래킹: GitHub Issues
- 이메일: support@example.com

## 변경 이력 (Changelog)

### Version 1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 명상 루틴 기능
- 호흡 애니메이션
- 복잡도 자동 감지
- 퀴즈 설정 통합
- 통계 추적

## 향후 계획 (Future Plans)

- [ ] 추가 애니메이션 스타일 (파도, 펄스 등)
- [ ] 오디오 가이드 지원
- [ ] 학생별 맞춤 설정
- [ ] 명상 효과 분석 대시보드
- [ ] 모바일 앱 통합
- [ ] 다양한 명상 기법 (마인드풀니스, 시각화 등)

## 스크린샷 (Screenshots)

### 명상 루틴 화면
![Meditation Screen](docs/screenshot-meditation.png)

### 퀴즈 설정
![Quiz Settings](docs/screenshot-settings.png)

### 통계 대시보드
![Statistics](docs/screenshot-stats.png)

---

**Made with ❤️ for better learning experiences**
