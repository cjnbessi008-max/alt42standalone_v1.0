# AI Problem Optimizer for Moodle 3.7

학생 개인별 최적 문제 수량을 자동으로 산출하는 Moodle 플러그인

## 개요

이 플러그인은 학생의 학습 데이터를 실시간으로 분석하여 각 학생에게 최적화된 문제 수량을 자동으로 계산합니다.

### 주요 기능

- **실시간 성과 추적**: 문제 풀이 정확도, 속도, 학습 패턴 자동 추적
- **최적 문제 수 자동 산출**: AI 알고리즘 기반 개인화된 문제 수량 계산
- **적응형 난이도 조정**: 학생 성과에 따라 자동으로 난이도 레벨 조정
- **학습 대시보드**: 학생과 교사를 위한 직관적인 성과 분석 대시보드
- **REST API**: 외부 시스템과의 손쉬운 연동

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx

## 설치 방법

### 1. 플러그인 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성 (존재하지 않는 경우)
mkdir -p local/aiproblemoptimizer

# 플러그인 파일 복사
cp -r /path/to/plugin/* local/aiproblemoptimizer/
```

### 2. 데이터베이스 스키마 설치

Moodle 관리자로 로그인 후:

1. **사이트 관리** > **알림** 메뉴로 이동
2. 플러그인이 자동으로 감지되면 "데이터베이스 업그레이드" 버튼 클릭
3. 설치 완료 확인

또는 수동으로 SQL 실행:

```bash
mysql -u moodle_user -p moodle_db < sql/install_schema.sql
```

### 3. 플러그인 활성화

1. **사이트 관리** > **플러그인** > **로컬 플러그인** 메뉴로 이동
2. "AI Problem Optimizer" 플러그인이 설치되었는지 확인
3. 각 과목에서 플러그인 활성화

## 설정 방법

### 과목별 설정

1. 과목 페이지에 접속
2. **설정** > **AI 문제 최적화** 메뉴 선택
3. 다음 파라미터 설정:

#### 기본 설정
- **기본 문제 수**: 기준이 되는 문제 수 (기본값: 10)
- **최소 문제 수**: 최소 제한 (기본값: 5)
- **최대 문제 수**: 최대 제한 (기본값: 30)

#### 난이도 조정 임계값
- **난이도 상승 임계값**: 정확도 90% 이상 시 난이도 상승 (기본값: 0.90)
- **난이도 하락 임계값**: 정확도 60% 미만 시 난이도 하락 (기본값: 0.60)

#### 시간 임계값
- **빠른 풀이 임계값**: 30초 미만 (기본값: 30)
- **느린 풀이 임계값**: 60초 이상 (기본값: 60)

#### 학습 지속도
- **높은 지속도 임계값**: 연속 5일 이상 (기본값: 5)

#### 활성화 옵션
- **플러그인 활성화**: 이 과목에서 플러그인 사용 여부
- **자동 난이도 조정**: 성과에 따른 자동 난이도 조정 여부

## 사용 방법

### 학생용

#### 1. 개인 대시보드 확인

```
https://your-moodle.com/local/aiproblemoptimizer/index.php?courseid=123
```

대시보드에서 확인 가능한 정보:
- 총 시도 횟수 및 정확도
- 평균 문제 풀이 시간
- 연속 학습 일수
- 권장 문제 수
- 현재 난이도 레벨
- 학습 조언

#### 2. 퀴즈 풀이

- 일반적인 Moodle 퀴즈처럼 문제를 풉니다
- 플러그인이 자동으로 성과를 추적하고 분석합니다
- 다음 퀴즈 시작 시 최적화된 문제 수가 자동으로 적용됩니다

### 교사용

#### 1. 학생 성과 모니터링

```
https://your-moodle.com/local/aiproblemoptimizer/reports.php?courseid=123
```

확인 가능한 정보:
- 과목 전체 통계
- 학생별 성과 비교
- 난이도별 성취도
- 학습 패턴 분석

#### 2. 개별 학생 데이터 조회

```
https://your-moodle.com/local/aiproblemoptimizer/index.php?courseid=123&userid=456
```

## API 사용법

### 1. 최적 문제 수 조회

```bash
curl "https://your-moodle.com/local/aiproblemoptimizer/api.php?action=get_optimal_problems&userid=123&courseid=45" \
  -H "Cookie: MoodleSession=xxx"
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "userid": 123,
    "courseid": 45,
    "recommended_problems": 15,
    "factors": {
      "accuracy": 0.85,
      "accuracy_factor": 1.0,
      "speed_factor": 1.2,
      "consistency_factor": 1.1
    },
    "metrics": {
      "accuracy": 0.85,
      "avg_time": 45,
      "consistency_days": 6,
      "difficulty_level": 3
    }
  },
  "timestamp": 1638360000
}
```

### 2. 문제 풀이 기록

```bash
curl -X POST "https://your-moodle.com/local/aiproblemoptimizer/api.php?action=record_attempt" \
  -H "Cookie: MoodleSession=xxx" \
  -d "userid=123" \
  -d "courseid=45" \
  -d "quizid=78" \
  -d "problem_type=fraction_addition" \
  -d "difficulty_level=3" \
  -d "is_correct=1" \
  -d "time_spent=42"
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "history_id": 789,
    "updated_metrics": {
      "accuracy": 0.86,
      "recommended_problems": 16
    },
    "difficulty_adjustment": {
      "adjusted": false,
      "reason": "Performance within optimal range"
    }
  },
  "timestamp": 1638360100
}
```

### 3. 학생 대시보드 데이터

```bash
curl "https://your-moodle.com/local/aiproblemoptimizer/api.php?action=get_student_dashboard&userid=123&courseid=45" \
  -H "Cookie: MoodleSession=xxx"
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "overall_stats": {
      "total_attempts": 150,
      "accuracy": 0.83,
      "total_time_hours": 12.5,
      "consecutive_learning_days": 6
    },
    "recent_performance": [
      {
        "date": "2025-11-18",
        "problems_attempted": 15,
        "accuracy": 0.85,
        "time_spent_minutes": 45.5
      }
    ],
    "difficulty_progress": {
      "level_1": {"attempts": 30, "correct": 29, "mastery": 0.9667},
      "level_2": {"attempts": 40, "correct": 35, "mastery": 0.8750},
      "level_3": {"attempts": 50, "correct": 38, "mastery": 0.7600}
    },
    "recommendations": {
      "optimal_problems": 16,
      "difficulty_level": 3,
      "study_tip": "잘 하고 있습니다. 꾸준히 연습하세요."
    }
  },
  "timestamp": 1638360200
}
```

### 4. 과목 통계

```bash
curl "https://your-moodle.com/local/aiproblemoptimizer/api.php?action=get_course_statistics&courseid=45" \
  -H "Cookie: MoodleSession=xxx"
```

## 최적화 알고리즘 설명

### 입력 변수
1. **정확도 (accuracy)**: 최근 문제 풀이 정답률
2. **평균 시간 (avg_time)**: 문제당 평균 소요 시간
3. **학습 지속도 (consistency)**: 연속 학습 일수
4. **난이도 레벨 (difficulty)**: 현재 난이도 (1-5)

### 계산 공식

```
최적_문제수 = 기본_문제수 × 정확도_인자 × 속도_인자 × 지속도_인자
```

#### 정확도 인자
- 정확도 ≥ 90%: **1.3** (높은 정확도 → 더 많은 문제)
- 정확도 ≥ 70%: **1.0** (보통 정확도 → 기본)
- 정확도 < 70%: **0.7** (낮은 정확도 → 집중 학습)

#### 속도 인자
- 평균 시간 < 30초: **1.2** (빠른 풀이 → 더 많은 문제)
- 평균 시간 < 60초: **1.0** (보통 속도 → 기본)
- 평균 시간 ≥ 60초: **0.8** (느린 풀이 → 적은 문제)

#### 지속도 인자
- 연속 학습 ≥ 5일: **1.1** (꾸준한 학습 → 약간 증가)
- 연속 학습 < 5일: **1.0** (기본)

### 예시 계산

**학생 A**:
- 정확도: 85% (인자: 1.0)
- 평균 시간: 25초 (인자: 1.2)
- 연속 학습: 7일 (인자: 1.1)
- 기본 문제 수: 10

```
최적 문제수 = 10 × 1.0 × 1.2 × 1.1 = 13.2 ≈ 13문제
```

**학생 B**:
- 정확도: 95% (인자: 1.3)
- 평균 시간: 20초 (인자: 1.2)
- 연속 학습: 10일 (인자: 1.1)
- 기본 문제 수: 10

```
최적 문제수 = 10 × 1.3 × 1.2 × 1.1 = 17.16 ≈ 17문제
```

**학생 C**:
- 정확도: 55% (인자: 0.7)
- 평균 시간: 75초 (인자: 0.8)
- 연속 학습: 2일 (인자: 1.0)
- 기본 문제 수: 10

```
최적 문제수 = 10 × 0.7 × 0.8 × 1.0 = 5.6 ≈ 6문제
```

## 난이도 자동 조정

### 상승 조건
- 최근 10문제 정확도 ≥ 90%
- 현재 난이도 < 5

### 하락 조건
- 최근 10문제 정확도 < 60%
- 현재 난이도 > 1

### 최적 구간
- 목표 정확도: 70% ~ 85%
- 이 구간에서는 난이도 유지

## 문제 해결

### 플러그인이 작동하지 않는 경우

1. **권한 확인**
```bash
chmod -R 755 local/aiproblemoptimizer
chown -R www-data:www-data local/aiproblemoptimizer
```

2. **데이터베이스 테이블 확인**
```sql
SHOW TABLES LIKE 'mdl_ai_%';
```

3. **캐시 삭제**
- **사이트 관리** > **개발** > **캐시 삭제**

### 최적 문제 수가 계산되지 않는 경우

1. 최소 10개 이상의 문제를 풀어야 정확한 계산이 가능합니다
2. 과목별 설정이 올바른지 확인하세요
3. 로그 확인:
```sql
SELECT * FROM mdl_ai_optimization_log
WHERE userid = 123 AND courseid = 45
ORDER BY timecreated DESC LIMIT 10;
```

### API 호출이 실패하는 경우

1. **세션 확인**: 유효한 Moodle 세션이 있는지 확인
2. **권한 확인**: API를 호출하는 사용자가 적절한 권한이 있는지 확인
3. **CORS 설정**: 외부에서 호출하는 경우 CORS 설정 확인

## 성능 최적화

### 데이터베이스 인덱스

플러그인은 자동으로 적절한 인덱스를 생성하지만, 대규모 환경에서는 추가 최적화가 필요할 수 있습니다:

```sql
-- 추가 인덱스 (필요시)
CREATE INDEX idx_history_user_time_correct
ON mdl_ai_problem_history(userid, timecreated, is_correct);

CREATE INDEX idx_metrics_course_modified
ON mdl_ai_student_metrics(courseid, timemodified);
```

### 캐싱

대규모 환경에서는 Redis 캐싱 사용을 권장합니다:

```php
// config.php에 추가
$CFG->session_handler_class = '\core\session\redis';
$CFG->session_redis_host = '127.0.0.1';
$CFG->session_redis_port = 6379;
```

### 배치 처리

많은 학생의 최적화를 한 번에 계산해야 하는 경우:

```bash
php cli/calculate_all_optimal_problems.php --courseid=45
```

## 업그레이드

### 플러그인 업그레이드

1. 백업 생성
```bash
cp -r local/aiproblemoptimizer local/aiproblemoptimizer.backup
mysqldump -u root -p moodle_db > backup.sql
```

2. 새 파일 복사
```bash
cp -r /path/to/new/plugin/* local/aiproblemoptimizer/
```

3. Moodle 업그레이드 실행
- **사이트 관리** > **알림** > **데이터베이스 업그레이드**

## 라이선스

GNU General Public License v3.0

## 지원

- **문서**: https://docs.your-site.com/aiproblemoptimizer
- **이슈 리포트**: https://github.com/your-org/aiproblemoptimizer/issues
- **이메일**: support@your-site.com

## 기여

기여를 환영합니다! Pull Request를 제출해주세요.

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 최적화 알고리즘
- REST API
- 학생/교사 대시보드
- 다국어 지원 (한국어, 영어)

## 크레딧

개발: KAIST Touch Math Academy
