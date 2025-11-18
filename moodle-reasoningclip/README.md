# Reasoning Clip for Moodle 3.7

**자동 추론 순간 감지 및 클립 시스템**

Moodle LMS와 연동하여 학생들이 문제를 풀 때 핵심적인 추론 순간을 자동으로 감지하고 저장하는 플러그인입니다.

## 📋 개요

이 플러그인은 학생들의 문제 해결 과정을 실시간으로 추적하고, AI 기반 알고리즘을 통해 다음과 같은 핵심 추론 순간을 자동으로 감지합니다:

- **돌파 순간 (Breakthrough)**: 오답에서 정답으로 전환되는 순간
- **고민 기간 (Struggle)**: 지속적인 어려움을 겪는 구간
- **빠른 해결 (Rapid Solve)**: 빠르고 정확한 문제 해결
- **생각하는 시간 (Pause & Think)**: 행동 전 긴 휴지 시간
- **체계적 접근 (Systematic)**: 일관된 패턴의 문제 해결
- **시행착오 (Trial & Error)**: 빠른 시도와 수정 패턴

## 🎯 주요 기능

### 1. 실시간 행동 추적
- 학생의 모든 상호작용 자동 기록 (클릭, 입력, 포커스, 제출 등)
- 비침습적 추적으로 학습 경험 방해 없음
- 세션 기반 데이터 관리

### 2. AI 기반 추론 감지
- 7가지 유형의 추론 순간 자동 감지
- 신뢰도 점수 (0-1) 기반 필터링
- 설정 가능한 감지 임계값

### 3. 교사 대시보드
- 모든 학생의 추론 클립 통합 뷰
- 학생별, 활동별, 유형별 필터링
- 통계 및 분포 시각화
- 클립 상세 정보 확인

### 4. API 지원
- RESTful API를 통한 외부 시스템 연동
- 실시간 분석 및 클립 생성
- 데이터 조회 및 필터링

## 📦 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Browser**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 🚀 설치 방법

### 1. 플러그인 다운로드

```bash
cd /path/to/moodle
git clone https://github.com/kaist-touchmath/moodle-reasoningclip.git local/reasoningclip
```

또는 ZIP 파일을 다운로드하여 `local/reasoningclip` 디렉토리에 압축 해제

### 2. 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림**으로 이동
3. 플러그인 설치 알림이 표시되면 **데이터베이스 업그레이드** 클릭
4. 설치 완료 확인

### 3. 권한 설정

**사이트 관리 > 사용자 > 권한 > 역할 정의**에서 다음 권한 설정:

- `local/reasoningclip:view` - 학생 자신의 클립 보기
- `local/reasoningclip:viewall` - 모든 학생의 클립 보기 (교사)
- `local/reasoningclip:manage` - 설정 관리 (관리자)
- `local/reasoningclip:delete` - 클립 삭제 (관리자)

### 4. 웹 서비스 활성화

**사이트 관리 > 플러그인 > 웹 서비스 > 관리**에서:

1. 웹 서비스 활성화
2. REST 프로토콜 활성화
3. 다음 함수 추가:
   - `local_reasoningclip_save_events`
   - `local_reasoningclip_analyze_session`
   - `local_reasoningclip_get_clips`

## ⚙️ 설정 방법

### 코스별 설정

각 코스 모듈에서 추론 클립을 활성화하려면:

1. 코스로 이동
2. 퀴즈 또는 활동 편집
3. **추론 클립 설정** 섹션에서:
   - **활성화**: 체크
   - **감지 임계값**: 0.7 (기본값, 0-1 범위)
   - **활성화된 클립 유형**: 감지할 유형 선택

### 전역 설정

**사이트 관리 > 플러그인 > 로컬 플러그인 > Reasoning Clip**에서:

- 기본 감지 임계값
- 자동 분석 활성화/비활성화
- 데이터 보관 기간

## 💻 사용 방법

### 학생 측

추론 클립은 학생의 학습 과정을 방해하지 않고 자동으로 작동합니다.

1. 퀴즈 또는 문제 활동 시작
2. 평소처럼 문제 풀이
3. JavaScript가 자동으로 상호작용 추적
4. 핵심 추론 순간이 자동 감지 및 저장

### 교사 측

#### 대시보드 접근

```
코스 페이지 > 추가 도구 > 추론 클립 대시보드
```

또는 직접 URL:
```
https://your-moodle-site/local/reasoningclip/dashboard.php?courseid={COURSE_ID}
```

#### 클립 조회 및 분석

1. **필터 적용**:
   - 특정 학생 선택
   - 활동 선택
   - 클립 유형 선택

2. **통계 확인**:
   - 총 클립 수
   - 유형별 분포
   - 학생별 패턴

3. **상세 정보 보기**:
   - 클립 항목 클릭
   - 전체 상호작용 시퀀스 확인
   - 시간 경과 분석

## 🔧 개발자 가이드

### JavaScript 추적 초기화

퀴즈 또는 활동 페이지에 다음 코드 추가:

```javascript
require(['local_reasoningclip/tracker'], function(Tracker) {
    var tracker = Tracker.init({
        questionId: 123,        // 문제 ID
        userId: 456,            // 사용자 ID
        courseId: 789,          // 코스 ID
        cmId: 101,              // 코스 모듈 ID
        autoAnalyze: true,      // 자동 분석
        batchSize: 10,          // 배치 크기
        sendInterval: 30000     // 전송 주기 (ms)
    });
});
```

### API 사용 예제

#### 이벤트 저장

```javascript
M.core_ajax.call([{
    methodname: 'local_reasoningclip_save_events',
    args: {
        events: [{
            userid: 456,
            sessionid: 'session_123',
            questionid: 789,
            eventtype: 'input',
            eventdata: '{"value": "42"}',
            timecreated: 1705552800
        }]
    }
}]);
```

#### 클립 조회

```javascript
M.core_ajax.call([{
    methodname: 'local_reasoningclip_get_clips',
    args: {
        cmid: 101,
        userid: 456,
        cliptype: 'breakthrough',
        limit: 20
    },
    done: function(response) {
        console.log('Clips:', response.clips);
    }
}]);
```

### PHP API 사용

```php
use local_reasoningclip\reasoning_detector;

// 이벤트 분석 및 클립 감지
$events = [/* 이벤트 배열 */];
$clips = reasoning_detector::detect_reasoning_moments($events, $questionid, $userid);

// 클립 저장
foreach ($clips as $clip) {
    reasoning_detector::save_clip($clip, $courseid, $cmid);
}

// 클립 조회
$clips = reasoning_detector::get_clips($questionid, $userid);
```

## 📊 데이터 구조

### 데이터베이스 테이블

#### `local_reasoningclip`
추론 클립 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | 기본 키 |
| userid | int | 학생 ID |
| courseid | int | 코스 ID |
| cmid | int | 코스 모듈 ID |
| questionid | int | 문제 ID |
| cliptype | varchar(50) | 클립 유형 |
| clipdata | text | JSON 데이터 |
| timespent | int | 소요 시간 (초) |
| confidence | decimal(5,2) | 신뢰도 점수 |
| timecreated | int | 생성 시각 |

#### `local_reasoningclip_events`
학생 상호작용 이벤트

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | 기본 키 |
| userid | int | 학생 ID |
| sessionid | varchar(255) | 세션 ID |
| questionid | int | 문제 ID |
| eventtype | varchar(50) | 이벤트 유형 |
| eventdata | text | JSON 데이터 |
| timecreated | int | 생성 시각 |

#### `local_reasoningclip_config`
코스 모듈별 설정

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | 기본 키 |
| cmid | int | 코스 모듈 ID |
| enabled | tinyint | 활성화 여부 |
| detection_threshold | decimal(5,2) | 감지 임계값 |
| clip_types | text | 활성화된 클립 유형 (JSON) |

## 🔒 개인정보 보호

이 플러그인은 다음 개인 데이터를 수집합니다:

- 학생 ID
- 상호작용 이벤트 (클릭, 입력 등)
- 문제 해결 시간
- 답안 제출 기록

데이터는 교육 목적으로만 사용되며, 교사와 관리자만 접근 가능합니다.

**GDPR/개인정보보호법 준수**:
- 학생은 자신의 데이터를 조회할 수 있습니다
- 데이터 삭제 요청 지원
- 익명화 처리 가능

## 🐛 문제 해결

### 클립이 생성되지 않음

1. 웹 서비스가 활성화되어 있는지 확인
2. JavaScript 콘솔에서 오류 확인
3. 감지 임계값이 너무 높지 않은지 확인 (0.7 권장)
4. 최소 3개 이상의 이벤트가 기록되었는지 확인

### JavaScript 오류

1. Moodle 캐시 제거: **사이트 관리 > 개발 > 캐시 제거**
2. 브라우저 캐시 제거
3. JavaScript 압축 비활성화 (개발 중)

### API 호출 실패

1. 웹 서비스 토큰 확인
2. AJAX 요청 권한 확인
3. 네트워크 탭에서 요청/응답 확인

## 📈 성능 최적화

### 권장 설정

- **배치 크기**: 10-20 이벤트
- **전송 주기**: 30초
- **감지 임계값**: 0.7
- **데이터 보관**: 90일

### 대규모 배포

- 데이터베이스 인덱스 최적화
- 이벤트 데이터 정기적 아카이빙
- 캐싱 활성화 (Redis 권장)

## 📝 라이선스

GNU GPL v3 or later

## 👥 기여자

- KAIST Touch Math Academy
- Developed for AI Education System Pipeline

## 📧 지원

- 이슈 리포트: GitHub Issues
- 이메일: support@kaist-touchmath.org
- 문서: https://docs.kaist-touchmath.org/reasoningclip

## 🔄 업데이트 내역

### v1.0-beta (2025-01-18)
- 초기 릴리스
- 7가지 추론 순간 감지 알고리즘
- 교사 대시보드
- REST API 지원
- 한국어/영어 지원

## 🗺️ 로드맵

### v1.1 (예정)
- 실시간 알림 기능
- 비디오 클립 재생
- ML 기반 감지 개선
- 모바일 앱 지원

### v2.0 (예정)
- 다른 LMS 플랫폼 지원
- 고급 분석 대시보드
- 학생 피드백 통합
- 협력 학습 추적

---

**Made with ❤️ for better education**
