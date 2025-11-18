# Moodle Confidence Reasoning Plugin

Moodle 3.7 LMS와 연동하여 학생들이 퀴즈 문제에 답변할 때 **확신도(confidence level)**와 **확신한 이유(reasoning)**를 기록하는 플러그인입니다.

## 기능 (Features)

### 학생 기능
- **확신도 선택**: 1(매우 불확실)부터 5(매우 확신)까지 슬라이더로 선택
- **이유 카테고리**: 공부한 내용, 계산, 기억, 추측 등 선택 가능
- **자유 텍스트**: 답변 확신/불확신 이유를 직접 작성
- **실시간 저장**: 각 문제마다 자동으로 저장

### 교사 기능
- **개별 학생 리포트**: 각 학생의 확신도 및 이유 확인
- **통계 대시보드**: 평균 확신도, 확신도와 정답률 상관관계 분석
- **전체 학생 개요**: 모든 학생의 확신도 통계 한눈에 보기

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: 모던 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 플러그인 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 복사
cp -r /path/to/moodle-plugin/local/confidencereasoning ./local/
```

### 2. Moodle 관리자 페이지에서 설치

1. Moodle 관리자 계정으로 로그인
2. **Site administration** → **Notifications** 접속
3. 플러그인 설치 알림이 표시되면 **Upgrade Moodle database now** 클릭
4. 설치 완료 확인

### 3. 권한 설정 (선택사항)

**Site administration** → **Users** → **Permissions** → **Define roles**에서 필요시 권한 조정:

- `local/confidencereasoning:submit` - 학생이 확신도 제출
- `local/confidencereasoning:view` - 교사가 학생 데이터 조회
- `local/confidencereasoning:viewstats` - 통계 조회
- `local/confidencereasoning:manage` - 플러그인 관리

## 사용 방법

### 학생: 퀴즈 응시 시 확신도 입력

1. 퀴즈에 접속하여 문제 풀이
2. 각 문제 아래에 자동으로 표시되는 확신도 입력 영역 확인:
   - **슬라이더**: 1-5 확신도 선택
   - **카테고리**: 답을 찾은 방법 선택
   - **텍스트**: 이유 자유 작성
3. 퀴즈 제출 시 자동으로 모든 확신도 데이터 저장

### 교사: 확신도 리포트 보기

1. 해당 퀴즈 페이지 접속
2. URL에 리포트 페이지 추가:
   ```
   https://your-moodle-site/local/confidencereasoning/report.php?quizid=123
   ```
   (123은 실제 퀴즈 ID로 변경)

3. **전체 학생 통계** 또는 **개별 학생 상세 보기** 선택

## 데이터베이스 스키마

### `mdl_local_confidence_reasoning`
학생의 확신도 및 이유를 저장하는 메인 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | Primary key |
| questionattemptid | INT | 문제 응시 ID (외래키) |
| userid | INT | 사용자 ID |
| quizid | INT | 퀴즈 ID |
| questionid | INT | 문제 ID |
| confidencelevel | INT | 확신도 (1-5) |
| reasoning | TEXT | 이유 (자유 텍스트) |
| reasoningcategory | VARCHAR | 이유 카테고리 |
| timecreated | INT | 생성 시간 |
| timemodified | INT | 수정 시간 |

### `mdl_local_confidence_stats`
학생별 퀴즈별 통계 요약 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | Primary key |
| userid | INT | 사용자 ID |
| quizid | INT | 퀴즈 ID |
| avgconfidence | DECIMAL | 평균 확신도 |
| totalattempts | INT | 총 응시 횟수 |
| correctwithhighconfidence | INT | 높은 확신도로 정답 수 |
| incorrectwithhighconfidence | INT | 높은 확신도로 오답 수 |
| timecreated | INT | 생성 시간 |
| timemodified | INT | 수정 시간 |

## 파일 구조

```
local/confidencereasoning/
├── version.php              # 플러그인 버전 정보
├── lib.php                  # 메인 라이브러리 함수
├── report.php               # 교사용 리포트 페이지
├── styles.css               # CSS 스타일
├── db/
│   ├── install.xml          # 데이터베이스 스키마
│   ├── access.php           # 권한 정의
│   ├── events.php           # 이벤트 옵저버 등록
│   └── services.php         # 웹 서비스 정의
├── classes/
│   ├── observer.php         # 이벤트 핸들러
│   └── external.php         # 웹 서비스 API
├── lang/
│   ├── en/
│   │   └── local_confidencereasoning.php  # 영어 언어팩
│   └── ko/
│       └── local_confidencereasoning.php  # 한국어 언어팩
└── amd/
    └── src/
        └── confidence_ui.js  # JavaScript UI 모듈
```

## API 사용

### AJAX 웹 서비스

```javascript
// JavaScript에서 확신도 저장
require(['core/ajax'], function(Ajax) {
    Ajax.call([{
        methodname: 'local_confidencereasoning_save_confidence_data',
        args: {
            questionattemptid: 123,
            userid: 456,
            quizid: 789,
            questionid: 101,
            confidencelevel: 4,
            reasoning: '공부했던 내용입니다',
            reasoningcategory: 'studied'
        }
    }]);
});
```

### PHP 함수

```php
// 확신도 저장
local_confidencereasoning_save(
    $questionattemptid,
    $userid,
    $quizid,
    $questionid,
    $confidencelevel,
    $reasoning,
    $reasoningcategory
);

// 확신도 조회
$data = local_confidencereasoning_get($questionattemptid);

// 통계 업데이트
local_confidencereasoning_update_stats($userid, $quizid);

// 통계 조회
$stats = local_confidencereasoning_get_stats($userid, $quizid);
```

## 향후 AI Education System Pipeline 연동

이 플러그인은 향후 AI Education System Pipeline (PRD 참조)과 LTI (Learning Tools Interoperability)를 통해 연동될 예정입니다.

### 연동 계획
1. **LTI Provider 구현**: Moodle을 LTI Tool Provider로 구성
2. **데이터 동기화**: 확신도 데이터를 AI 시스템으로 전송
3. **메타인지 분석**: 확신도와 정답률 상관관계 분석
4. **적응형 학습**: 학생의 확신도 패턴에 따른 맞춤형 문제 제공

## 문제 해결

### JavaScript가 로드되지 않는 경우

```bash
# Moodle 캐시 삭제
php admin/cli/purge_caches.php

# JavaScript 재컴파일 (AMD 모듈)
# 브라우저에서 Shift + F5로 강력 새로고침
```

### 데이터베이스 테이블이 생성되지 않는 경우

```bash
# CLI로 업그레이드 실행
php admin/cli/upgrade.php
```

### 권한 오류가 발생하는 경우

1. **Site administration** → **Users** → **Permissions** → **Capability overview**
2. `local/confidencereasoning:submit` 확인
3. Student 역할에 허용되어 있는지 확인

## 라이선스

GPL v3 - Moodle 표준 라이선스를 따릅니다.

## 지원

문제가 발생하거나 기능 제안이 있으시면 GitHub Issues에 등록해주세요.

## 개발자 정보

- **버전**: 1.0.0
- **호환성**: Moodle 3.7+
- **개발**: KAIST Touch Math Academy
- **언어**: 한국어, English

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 확신도 및 이유 기록 기능
- 교사용 리포트 페이지
- 한국어/영어 다국어 지원
- MySQL 5.7, PHP 7.1.9, Moodle 3.7 지원
