# Flow Moments - Moodle Plugin

**자동 몰입 순간 감지 및 추출 플러그인**

이 플러그인은 학생들이 복잡한 문제를 풀 때 경험하는 "몰입(Flow) 순간"을 자동으로 감지하고 추적합니다. Mihaly Csikszentmihalyi의 몰입 이론(Flow Theory)을 기반으로 학생의 행동 패턴을 분석하여 최적의 학습 상태를 식별합니다.

## 주요 기능

### 1. 실시간 행동 추적
- **클라이언트 측 추적**: 클릭, 입력, 스크롤, 키 입력 등의 세밀한 행동 추적
- **서버 측 이벤트**: Moodle 이벤트 시스템과 통합하여 퀴즈, 과제 등의 활동 추적
- **비침해적 추적**: 학생의 학습 경험을 방해하지 않는 백그라운드 추적

### 2. 지능형 몰입 감지
6가지 핵심 지표를 기반으로 몰입 상태 감지:

| 지표 | 설명 | 가중치 |
|------|------|--------|
| **시간 일관성** | 일정한 리듬의 작업 시간 패턴 | 25% |
| **최적 난이도** | 50-70%의 정답률 (도전적이지만 달성 가능) | 20% |
| **연속성** | 중단 없는 지속적인 활동 | 15% |
| **입력 리듬** | 고른 입력 속도와 패턴 | 15% |
| **자가 수정** | 적절한 수정 빈도 (10-30%) | 15% |
| **응답 일관성** | 일정한 응답 시간 | 10% |

**몰입 점수 (Flow Score)**: 0-100점
- **85점 이상**: 탁월한 몰입 상태
- **70-84점**: 양호한 몰입 상태
- **70점 미만**: 몰입 상태 아님

### 3. 시각화 대시보드
- 개인별 몰입 통계 요약
- 몰입 순간 기록 및 상세 정보
- 시간대별 몰입 패턴 분석
- 코스별 비교 분석

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 방법

### 1. 플러그인 다운로드 및 설치

```bash
# Moodle 루트 디렉토리로 이동
cd /path/to/moodle

# local 디렉토리에 플러그인 복사
cp -r /path/to/local_flowmoments local/flowmoments

# 파일 권한 설정
chmod -R 755 local/flowmoments
chown -R www-data:www-data local/flowmoments
```

### 2. 데이터베이스 설치

Moodle 관리자로 로그인 후:
1. **사이트 관리 > 알림** 으로 이동
2. "플러그인 업그레이드" 실행
3. Flow Moments 플러그인 설치 확인

또는 CLI로 설치:

```bash
php admin/cli/upgrade.php
```

### 3. JavaScript 모듈 빌드 (선택사항)

AMD 모듈을 사용하는 경우:

```bash
cd local/flowmoments
php admin/tool/componentlibrary/cli/build.php
```

### 4. 퀴즈 페이지에 추적 활성화

퀴즈 또는 활동 페이지에 다음 속성 추가:

```html
<div data-flowtracking="enabled">
    <!-- 퀴즈 내용 -->
</div>
```

또는 테마에서 자동으로 활성화:

```php
// theme/yourtheme/layout/columns2.php
$PAGE->requires->js_call_amd('local_flowmoments/tracker', 'init');
```

## 사용 방법

### 학생용

학생은 별도의 조치 없이 평소대로 학습합니다. 플러그인은 자동으로 백그라운드에서 작동합니다.

**대시보드 접근**:
1. 사용자 메뉴 > "몰입 순간" 클릭
2. 또는 직접 URL: `https://your-moodle.com/local/flowmoments/`

### 교사용

**학생 몰입 데이터 조회**:
1. **사이트 관리 > 보고서 > 몰입 순간**
2. 학생 선택 및 코스 선택
3. 몰입 통계 및 상세 분석 확인

**대시보드 기능**:
- **요약 통계**: 총 몰입 순간, 평균 점수, 총 몰입 시간
- **기록 테이블**: 각 몰입 순간의 시작 시간, 지속 시간, 점수, 지표
- **코스별 필터링**: 특정 코스의 데이터만 조회

## 데이터베이스 구조

### 주요 테이블

#### 1. `mdl_local_flowmoments_tracking`
학생 행동 추적 데이터 (원시 데이터)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| userid | INT | 사용자 ID |
| courseid | INT | 코스 ID |
| cmid | INT | 코스 모듈 ID |
| eventtype | VARCHAR(50) | 이벤트 유형 |
| eventdata | TEXT | 이벤트 데이터 (JSON) |
| timespent | INT | 소요 시간 (초) |
| timestamp | INT | 타임스탬프 |

#### 2. `mdl_local_flowmoments_detected`
감지된 몰입 순간

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| userid | INT | 사용자 ID |
| courseid | INT | 코스 ID |
| flowscore | DECIMAL(5,2) | 몰입 점수 (0-100) |
| starttime | INT | 시작 시간 |
| endtime | INT | 종료 시간 |
| duration | INT | 지속 시간 (초) |
| indicators | TEXT | 몰입 지표 (JSON) |

#### 3. `mdl_local_flowmoments_summary`
집계 통계

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| userid | INT | 사용자 ID |
| courseid | INT | 코스 ID |
| totalflowmoments | INT | 총 몰입 순간 수 |
| avgflowscore | DECIMAL(5,2) | 평균 몰입 점수 |
| totalflowtime | INT | 총 몰입 시간 (초) |

## 알고리즘 상세

### 몰입 감지 프로세스

1. **데이터 수집**: 5분 단위 시간 윈도우로 데이터 그룹화
2. **지표 계산**: 각 윈도우에 대해 6가지 지표 계산
3. **점수 산출**: 가중 평균으로 몰입 점수 계산
4. **몰입 판별**: 70점 이상이고 2분 이상 지속 시 몰입 순간으로 판정
5. **통계 업데이트**: 사용자별 집계 통계 업데이트

### 예시: 몰입 점수 계산

```
시나리오: 학생이 수학 문제를 풀고 있음

측정값:
- 시간 일관성: 85점 (문제당 일정한 시간 소요)
- 최적 난이도: 100점 (정답률 60% - 최적 구간)
- 연속성: 95점 (최대 간격 45초)
- 입력 리듬: 78점 (고른 입력 패턴)
- 자가 수정: 90점 (수정 빈도 15%)
- 응답 일관성: 82점 (일정한 응답 시간)

몰입 점수 = 85×0.25 + 100×0.20 + 95×0.15 + 78×0.15 + 90×0.15 + 82×0.10
          = 21.25 + 20 + 14.25 + 11.7 + 13.5 + 8.2
          = 88.9점

결과: 탁월한 몰입 상태 ✓
```

## 개인정보 보호 (GDPR 준수)

이 플러그인은 Moodle Privacy API를 완전히 구현합니다:

- **데이터 투명성**: 수집되는 모든 데이터 명시
- **데이터 내보내기**: 사용자가 자신의 데이터를 내보낼 수 있음
- **삭제 권리**: 사용자 데이터 완전 삭제 지원
- **최소 수집**: 몰입 감지에 필요한 최소한의 데이터만 수집

## 문제 해결

### JavaScript 추적이 작동하지 않을 때

1. 브라우저 콘솔 확인:
```javascript
// F12 > Console
console.log('Flow tracker loaded:', typeof define !== 'undefined');
```

2. AMD 모듈 캐시 지우기:
```bash
php admin/cli/purge_caches.php
```

3. 권한 확인:
```bash
chmod -R 755 local/flowmoments/amd
```

### 몰입 순간이 감지되지 않을 때

**원인**:
- 활동 시간이 2분 미만
- 행동 패턴이 불규칙
- 문제가 너무 쉽거나 어려움

**해결**:
1. 최소 5-10분 이상 활동 수행
2. 데이터가 쌓일 때까지 대기 (퀴즈 제출 후 분석 시작)
3. 추적 데이터 확인:
```sql
SELECT COUNT(*) FROM mdl_local_flowmoments_tracking
WHERE userid = YOUR_USER_ID;
```

### 데이터베이스 오류

```bash
# 데이터베이스 재설치
php admin/cli/uninstall_plugins.php --plugins=local_flowmoments
php admin/cli/upgrade.php
```

## 기술 스택

- **Backend**: PHP 7.1+, Moodle Plugin API
- **Frontend**: JavaScript (AMD/RequireJS), jQuery
- **Database**: MySQL 5.7+ (InnoDB)
- **Architecture**: Event-driven, Observer pattern

## 향후 계획

- [ ] AI 기반 개인화 몰입 임계값 조정
- [ ] 실시간 몰입 상태 알림
- [ ] 교사용 몰입 패턴 분석 리포트
- [ ] 다른 활동 유형 지원 (포럼, 위키 등)
- [ ] 모바일 앱 지원
- [ ] 머신러닝 기반 몰입 예측

## 라이선스

GPL v3 or later

## 크레딧

**개발**: KAIST Touch Math Academy
**연구 기반**: Mihaly Csikszentmihalyi - Flow Theory
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18

## 지원 및 문의

- **이슈**: GitHub Issues
- **문서**: [Moodle Docs - Flow Moments](https://docs.moodle.org/flowmoments)
- **이메일**: support@kaist-touchmath.ac.kr

---

**주의**: 이 플러그인은 교육 연구 목적으로 개발되었으며, 학생의 개인정보를 존중합니다. 데이터는 학습 개선 목적으로만 사용되어야 합니다.
