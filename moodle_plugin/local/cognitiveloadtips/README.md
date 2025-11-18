# Cognitive Load Tips Plugin for Moodle 3.7

인지 부하 최소화 팁 플러그인 - Moodle LMS와 연동하여 고난도 문제 진입 전에 학습 팁을 제공합니다.

## 개요

이 플러그인은 학생들이 어려운 퀴즈 문제를 풀기 전에 인지 부하를 최소화하는 팁을 표시하여 학습 효과를 향상시킵니다. 문제 난이도에 따라 적절한 팁을 자동으로 선택하여 표시하며, 호흡법, 집중 전략, 문제 해결 전략 등을 포함합니다.

## 주요 기능

### 1. 난이도 기반 팁 표시
- 문제 난이도 (1-5단계)에 따라 자동으로 적절한 팁 선택
- 고난도 문제 (4-5단계) 전에 특별히 설계된 팁 제공
- 난이도는 수동 설정 또는 학생 성취도 기반 자동 계산

### 2. 다양한 카테고리의 팁
- **호흡 (Breathing)**: 심호흡, 긴장 완화 기법
- **집중 (Focus)**: 집중력 향상, 휴식 전략
- **전략 (Strategy)**: 문제 해결 전략, 단계별 접근법
- **마음가짐 (Mindset)**: 긍정적 사고, 자신감 향상

### 3. 한국어/영어 완벽 지원
- 한국어와 영어로 작성된 기본 팁 제공
- 사용자 언어 설정에 따라 자동 선택
- 추가 언어 확장 가능

### 4. 상호작용 추적
- 학생의 팁 조회 시간 기록
- 팁 유용성 피드백 수집
- 건너뛰기 패턴 분석
- 관리자용 통계 대시보드

### 5. 퀴즈별 세부 설정
- 퀴즈마다 팁 활성화/비활성화
- 난이도 기준 설정 (예: 4단계 이상만)
- 무작위 팁 vs 모든 팁 표시
- 건너뛰기 허용 여부

### 6. 필수 읽기 모드
- 중요한 팁은 일정 시간 필수 읽기로 설정
- 진행 표시줄과 카운트다운 타이머
- 시간 경과 후 "계속하기" 버튼 활성화

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상 (또는 MariaDB 10.2+)
- **브라우저**: 최신 Chrome, Firefox, Safari, Edge

## 설치 방법

### 1. 플러그인 파일 복사

```bash
cd /path/to/moodle
cp -r moodle_plugin/local/cognitiveloadtips /path/to/moodle/local/
```

### 2. 권한 설정

```bash
cd /path/to/moodle/local/cognitiveloadtips
chown -R www-data:www-data .
chmod -R 755 .
```

### 3. Moodle 관리자 페이지 접속

1. Moodle에 관리자로 로그인
2. `사이트 관리 > 알림` 메뉴로 이동
3. 플러그인 설치 알림이 표시되면 "데이터베이스 업그레이드" 클릭
4. 설치 완료 확인

### 4. 기본 팁 자동 생성 확인

설치 시 다음의 기본 팁이 자동으로 생성됩니다:

**한국어 팁 (7개)**
- 심호흡하기
- 문제 천천히 읽기
- 그림으로 시각화하기
- 단계별로 나누기
- 알고 있는 것 정리하기
- 잠시 휴식하기
- 긍정적으로 생각하기

**영어 팁 (7개)**
- Take Deep Breaths
- Read Slowly
- Visualize with Drawings
- Break Into Steps
- Organize What You Know
- Take a Short Break
- Think Positively

## 사용 방법

### 교사용: 퀴즈 설정

1. 퀴즈 편집 페이지로 이동
2. "인지 부하 최소화 팁" 섹션 찾기
3. 다음 옵션 설정:
   - ✅ **팁 활성화**: 이 퀴즈에서 팁 사용
   - 🎚️ **난이도 기준**: 몇 단계부터 팁 표시할지 선택
   - 🎲 **무작위 팁**: 랜덤 1개 vs 모든 팁
   - ⏭️ **건너뛰기 허용**: 학생이 팁을 건너뛸 수 있는지

### 교사용: 문제 난이도 설정

#### 방법 1: 문제 편집 시 수동 설정
```
1. 문제 은행에서 문제 선택
2. "난이도" 필드에서 1-5 선택
3. 저장
```

#### 방법 2: 자동 계산 사용
```php
// 관리자 페이지에서 "난이도 자동 계산" 실행
// 학생 성취도 데이터 기반으로 자동 설정
```

자동 계산 기준:
- 정답률 < 30% → 난이도 5 (매우 어려움)
- 정답률 30-50% → 난이도 4 (어려움)
- 정답률 50-80% → 난이도 3 (보통)
- 정답률 80-90% → 난이도 2 (쉬움)
- 정답률 > 90% → 난이도 1 (매우 쉬움)

### 학생용: 팁 보기

1. 퀴즈 시작
2. 고난도 문제 전에 팁 자동 표시
3. 팁 읽기 (필수 팁은 카운트다운 후 계속)
4. "도움됨/도움 안됨" 피드백 제공 (선택)
5. "문제 풀러 가기" 또는 "건너뛰기" 클릭

## 관리자 기능

### 팁 관리

`사이트 관리 > 플러그인 > 로컬 플러그인 > 인지 부하 팁`

- **팁 추가/수정/삭제**
- **난이도 범위 설정**
- **카테고리 지정**
- **표시 시간 설정**
- **필수 읽기 여부**
- **언어 선택**
- **활성화/비활성화**

### 통계 대시보드

다음 정보를 확인할 수 있습니다:
- 📊 전체 팁 수
- 👥 전체 상호작용 수
- 👀 표시된 팁 vs 건너뛴 팁
- ⏱️ 평균 조회 시간
- ⭐ 가장 인기 있는 팁

## API 엔드포인트

### 웹 서비스 API

외부 시스템과 통합을 위한 REST API 제공:

```php
// 1. 팁 가져오기
GET /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_get_tips&
    difficulty=4&
    language=ko&
    random=1

// 2. 문제 난이도 조회
GET /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_get_question_difficulty&
    questionid=123

// 3. 문제 난이도 설정
POST /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_set_question_difficulty&
    questionid=123&
    difficulty=4

// 4. 상호작용 기록
POST /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_record_interaction&
    tipid=5&
    questionid=123&
    duration=15&
    skipped=0

// 5. 피드백 제출
POST /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_submit_feedback&
    tipid=5&
    helpful=1

// 6. 통계 조회 (관리자만)
GET /webservice/rest/server.php?
    wsfunction=local_cognitiveloadtips_get_statistics
```

### API 사용 설정

1. `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스`
2. "새 서비스 추가"
3. 위의 함수들 추가
4. 토큰 생성하여 API 호출

## 데이터베이스 스키마

### local_clt_tips
팁 정보 저장
- id, title, content
- category, difficulty_min, difficulty_max
- display_duration, is_mandatory
- language, sortorder, enabled

### local_clt_question_difficulty
문제 난이도 매핑
- id, questionid
- difficulty_level (1-5)
- cognitive_complexity
- auto_calculated

### local_clt_user_interactions
사용자 상호작용 기록
- id, userid, tipid
- questionid, quizid
- view_duration, was_helpful, skipped
- timecreated

### local_clt_quiz_settings
퀴즈별 설정
- id, quizid
- enabled, show_before_difficulty
- random_tip, allow_skip

## 커스터마이징

### 새 팁 추가

```sql
INSERT INTO mdl_local_clt_tips
(title, content, category, difficulty_min, difficulty_max,
 display_duration, is_mandatory, language, enabled,
 timecreated, timemodified)
VALUES
('새 팁 제목', '팁 내용입니다...', 'strategy', 4, 5,
 10, 0, 'ko', 1,
 UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### 팁 카테고리 확장

`classes/output/tip_display.php` 파일의 `export_for_template` 함수에서 새 카테고리 추가:

```php
case 'new_category':
    $tipdata->icon = '🆕';
    $tipdata->category_name = get_string('category_new', 'local_cognitiveloadtips');
    break;
```

### CSS 스타일 변경

`templates/tip_display.mustache` 파일의 `<style>` 섹션 수정

## 문제 해결

### 팁이 표시되지 않을 때

1. ✅ 퀴즈 설정에서 팁이 활성화되어 있는지 확인
2. ✅ 문제 난이도가 설정되어 있는지 확인
3. ✅ 난이도 기준이 문제 난이도보다 낮은지 확인
4. ✅ 해당 언어의 팁이 존재하는지 확인
5. ✅ JavaScript 오류가 없는지 브라우저 콘솔 확인

### JavaScript 에러

```bash
# AMD 모듈 다시 빌드
cd /path/to/moodle
php admin/cli/purge_caches.php
```

### 데이터베이스 재설치

```bash
# 플러그인 제거 후 재설치
# Moodle 관리자 페이지에서:
# 사이트 관리 > 플러그인 > 플러그인 관리 > 인지 부하 팁 > 제거
# 그 후 다시 설치
```

## 성능 최적화

### 데이터베이스 인덱스

이미 최적화된 인덱스가 포함되어 있습니다:
- `local_clt_tips`: difficulty + enabled + language
- `local_clt_question_difficulty`: difficulty_level
- `local_clt_user_interactions`: user + question, timecreated

### 캐싱

```php
// 팁 조회 시 캐싱 사용
$cache = cache::make('local_cognitiveloadtips', 'tips');
$tips = $cache->get($cachekey);
```

## 보안 고려사항

- ✅ 모든 API 호출은 로그인 필수
- ✅ Capability 기반 권한 관리
- ✅ XSS 방지: format_string(), format_text() 사용
- ✅ SQL Injection 방지: $DB prepared statements 사용
- ✅ CSRF 방지: Moodle sesskey 사용

## 개인정보 보호

GDPR 준수:
- 사용자 데이터 export 지원
- 사용자 삭제 시 관련 데이터 자동 삭제
- `classes/privacy/provider.php`에서 처리

## 라이선스

GNU General Public License v3.0

## 지원 및 기여

**개발자**: KAIST Touch Math Academy
**버전**: 1.0
**Moodle 호환**: 3.7+

## 변경 이력

### v1.0 (2025-01-18)
- ✨ 초기 릴리스
- ✨ 한국어/영어 기본 팁 14개 포함
- ✨ 난이도 기반 자동 팁 선택
- ✨ 퀴즈별 세부 설정
- ✨ 상호작용 추적 및 통계
- ✨ REST API 제공
- ✨ 필수 읽기 타이머 기능

## 예시 화면

### 팁 표시 화면
```
┌─────────────────────────────────────────┐
│ 난이도: ★★★★☆                          │
│ 문제를 풀기 전에 잠깐!                    │
├─────────────────────────────────────────┤
│ 🫁 심호흡하기                            │
│                                         │
│ 어려운 문제를 풀기 전에 깊게 숨을       │
│ 들이쉬고 천천히 내쉬세요. 3회 반복하면  │
│ 집중력이 높아집니다.                    │
│                                         │
│ ━━━━━━━━━━━━━━━ 100%                   │
│ 천천히 읽어보세요 (0초)                 │
├─────────────────────────────────────────┤
│ 이 팁이 도움이 되었나요?                 │
│ [👍 도움됨] [👎 도움 안됨]              │
│                                         │
│        [건너뛰기] [문제 풀러 가기] →    │
└─────────────────────────────────────────┘
```

## 추가 자료

- [Moodle 플러그인 개발 가이드](https://docs.moodle.org/dev/)
- [인지 부하 이론](https://en.wikipedia.org/wiki/Cognitive_load)
- [교육심리학 연구](https://www.kaist.ac.kr)
