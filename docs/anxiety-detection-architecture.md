# Anxiety Detection System for Moodle LMS
## Architecture Design Document

**Version:** 1.0
**Date:** 2025-11-18
**Target Environment:** Moodle 3.7, PHP 7.1.9, MySQL 5.7

---

## 1. System Overview

### Purpose
실시간으로 학생들의 학습 행동을 분석하여 지나친 불안정 사고(excessive anxiety)를 감지하고, 교사에게 알림을 제공하는 시스템.

### Key Features
- **실시간 행동 추적**: 클릭 패턴, 응답 시간, 에러 빈도 등 모니터링
- **불안 지표 분석**: 다중 메트릭 기반 불안 수준 계산
- **자동 알림**: 임계값 초과 시 교사/관리자에게 알림
- **대시보드**: 학생별/클래스별 불안 수준 시각화
- **Moodle 네이티브 통합**: Moodle 플러그인으로 구현

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Anxiety Detection Plugin (local_anxiety)    │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │  Data        │  │  Analysis    │  │  Alert    │ │  │
│  │  │  Collector   │→ │  Engine      │→ │  Manager  │ │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │  │
│  │         ↓                  ↓                ↓        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │          Dashboard (Teacher View)            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MySQL 5.7 Database                      │  │
│  │  - mdl_anxiety_metrics                               │  │
│  │  - mdl_anxiety_sessions                              │  │
│  │  - mdl_anxiety_alerts                                │  │
│  │  - mdl_anxiety_config                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Anxiety Detection Metrics

### 3.1 Primary Indicators (행동 지표)

| Metric | Description | Anxiety Trigger |
|--------|-------------|-----------------|
| **Response Time** | 문제 응답까지 소요 시간 | 평균 대비 > 200% 또는 < 30% |
| **Error Rate** | 오답 비율 | 연속 5회 이상 오답 |
| **Click Frequency** | 클릭/상호작용 빈도 | 분당 > 20회 (과도한 조작) |
| **Time on Task** | 문제당 체류 시간 | > 10분 (정체) 또는 < 10초 (포기) |
| **Navigation Pattern** | 페이지 이동 패턴 | 반복적인 뒤로가기 (> 5회) |
| **Session Duration** | 연속 학습 시간 | > 2시간 (과도한 집중) |
| **Interaction Variability** | 행동 패턴 변동성 | 표준편차 > 2σ |

### 3.2 Anxiety Score Calculation

```
Anxiety Score (0-100) = Weighted Sum of:
  - Response Time Deviation (25%)
  - Error Rate (20%)
  - Click Frequency Abnormality (15%)
  - Time on Task Deviation (20%)
  - Navigation Pattern Issues (10%)
  - Session Duration Excess (10%)

Level Classification:
  0-30:  Normal (정상)
  31-50: Mild Anxiety (경미한 불안)
  51-70: Moderate Anxiety (중간 불안)
  71-100: Severe Anxiety (심각한 불안)
```

---

## 4. Database Schema (MySQL 5.7)

### 4.1 mdl_anxiety_metrics
학생별 실시간 행동 메트릭 저장

```sql
CREATE TABLE mdl_anxiety_metrics (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,
  cmid BIGINT(10) UNSIGNED NULL DEFAULT NULL,

  -- Behavioral Metrics
  response_time INT(11) NOT NULL DEFAULT 0,
  click_count INT(11) NOT NULL DEFAULT 0,
  error_count INT(11) NOT NULL DEFAULT 0,
  time_on_task INT(11) NOT NULL DEFAULT 0,
  navigation_back_count INT(11) NOT NULL DEFAULT 0,

  -- Calculated Anxiety Score
  anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  anxiety_level ENUM('normal', 'mild', 'moderate', 'severe') NOT NULL DEFAULT 'normal',

  -- Timestamps
  timecreated BIGINT(10) UNSIGNED NOT NULL,

  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_timecreated (timecreated),
  KEY idx_anxiety_level (anxiety_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Real-time anxiety metrics per student';
```

### 4.2 mdl_anxiety_sessions
학습 세션별 집계 데이터

```sql
CREATE TABLE mdl_anxiety_sessions (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,

  -- Session Info
  session_start BIGINT(10) UNSIGNED NOT NULL,
  session_end BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  session_duration INT(11) NOT NULL DEFAULT 0,

  -- Aggregated Metrics
  avg_response_time DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_clicks INT(11) NOT NULL DEFAULT 0,
  total_errors INT(11) NOT NULL DEFAULT 0,
  avg_anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  max_anxiety_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  -- Session Summary
  anxiety_peaks INT(11) NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety session aggregates';
```

### 4.3 mdl_anxiety_alerts
불안 알림 로그

```sql
CREATE TABLE mdl_anxiety_alerts (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  userid BIGINT(10) UNSIGNED NOT NULL,
  courseid BIGINT(10) UNSIGNED NOT NULL,

  -- Alert Info
  alert_type ENUM('mild', 'moderate', 'severe') NOT NULL,
  anxiety_score DECIMAL(5,2) NOT NULL,
  message TEXT NOT NULL,

  -- Status
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  acknowledged_by BIGINT(10) UNSIGNED NULL DEFAULT NULL,
  acknowledged_at BIGINT(10) UNSIGNED NULL DEFAULT NULL,

  -- Timestamps
  timecreated BIGINT(10) UNSIGNED NOT NULL,

  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_courseid (courseid),
  KEY idx_is_read (is_read),
  KEY idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety alert notifications';
```

### 4.4 mdl_anxiety_config
시스템 설정

```sql
CREATE TABLE mdl_anxiety_config (
  id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  courseid BIGINT(10) UNSIGNED NOT NULL DEFAULT 0,

  -- Threshold Settings
  mild_threshold DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  moderate_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  severe_threshold DECIMAL(5,2) NOT NULL DEFAULT 70.00,

  -- Alert Settings
  enable_alerts TINYINT(1) NOT NULL DEFAULT 1,
  alert_frequency INT(11) NOT NULL DEFAULT 300,

  -- Metric Weights
  weight_response_time DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  weight_error_rate DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  weight_click_frequency DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  weight_time_on_task DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  weight_navigation DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  weight_session_duration DECIMAL(3,2) NOT NULL DEFAULT 0.10,

  -- Timestamps
  timemodified BIGINT(10) UNSIGNED NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY idx_courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anxiety detection configuration';
```

---

## 5. Component Details

### 5.1 Data Collector (classes/collector.php)
- **Purpose**: JavaScript 이벤트 수집 및 PHP 엔드포인트로 전송
- **Technology**: AJAX (Moodle's YUI or vanilla JS for PHP 7.1 compatibility)
- **Events Tracked**:
  - Page load/unload
  - Quiz/assignment interactions
  - Click events
  - Focus/blur events
  - Form submissions

### 5.2 Analysis Engine (classes/analyzer.php)
- **Purpose**: 메트릭 계산 및 불안 점수 산출
- **Algorithm**:
  ```php
  function calculate_anxiety_score($metrics, $config) {
      $score = 0;
      $score += normalize_response_time($metrics->response_time) * $config->weight_response_time;
      $score += calculate_error_rate($metrics->error_count) * $config->weight_error_rate;
      // ... more calculations
      return min(100, max(0, $score));
  }
  ```

### 5.3 Alert Manager (classes/alert_manager.php)
- **Purpose**: 알림 생성 및 교사 통지
- **Notification Methods**:
  - Moodle 내부 메시징
  - 이메일 (선택적)
  - 대시보드 실시간 업데이트

### 5.4 Dashboard (dashboard.php)
- **Views**:
  - **Student View**: 개인 불안 수준 추이 (자기 인식)
  - **Teacher View**: 클래스 전체 불안 수준 모니터링
  - **Admin View**: 전체 코스 통계
- **Visualization**: Chart.js (경량, PHP 7.1 호환)

---

## 6. API Endpoints

### 6.1 Data Collection API
```
POST /local/anxiety/ajax/track.php
Parameters:
  - sesskey (Moodle session key)
  - userid
  - courseid
  - cmid (optional)
  - event_type (click, response, error, navigation)
  - event_data (JSON)
  - timestamp

Response: {"success": true, "anxiety_score": 45.2}
```

### 6.2 Dashboard Data API
```
GET /local/anxiety/ajax/get_data.php
Parameters:
  - sesskey
  - userid (optional, teacher can view all students)
  - courseid
  - timerange (today, week, month)

Response: {
  "students": [...],
  "anxiety_levels": {...},
  "alerts": [...]
}
```

---

## 7. Security Considerations

### 7.1 Privacy (PIPA/GDPR Compliance)
- **Data Minimization**: 개인 식별 최소화, 행동 데이터만 수집
- **Consent**: 학생/학부모 동의 필수
- **Retention**: 90일 후 자동 삭제 (설정 가능)
- **Access Control**: Role-based (학생은 자신만, 교사는 담당 학생만)

### 7.2 Moodle Security
- **Session Validation**: `require_sesskey()` 사용
- **Capability Checks**:
  - `local/anxiety:view` - 자신의 데이터 보기
  - `local/anxiety:viewothers` - 타인 데이터 보기 (교사)
  - `local/anxiety:manage` - 설정 관리 (관리자)
- **SQL Injection Prevention**: Moodle DMLAPI 사용
- **XSS Prevention**: `s()`, `format_text()` 사용

---

## 8. Performance Optimization

### 8.1 Data Collection
- **Throttling**: 클라이언트 측에서 1초당 최대 1회 전송
- **Batching**: 5개 이벤트 모아서 한 번에 전송
- **Async Processing**: 백그라운드 task로 분석 처리

### 8.2 Database
- **Indexing**: userid, courseid, timecreated에 인덱스
- **Partitioning**: 시간 기반 파티셔닝 (월별)
- **Archiving**: 90일 이상 데이터 아카이브 테이블로 이동

### 8.3 Caching
- **Config Caching**: Moodle cache API 활용
- **Dashboard Data**: 1분 캐시 (실시간 성능 균형)

---

## 9. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [x] Database schema
- [x] Plugin structure
- [x] Basic data collection

### Phase 2: Analysis Engine (Week 2)
- [ ] Anxiety score algorithm
- [ ] Real-time calculation
- [ ] Testing with sample data

### Phase 3: Dashboard & Alerts (Week 3)
- [ ] Teacher dashboard
- [ ] Alert system
- [ ] Email notifications

### Phase 4: Testing & Deployment (Week 4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Production deployment

---

## 10. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Detection Accuracy | > 80% | Teacher feedback validation |
| False Positive Rate | < 15% | Alert review |
| Response Time | < 500ms | API endpoint monitoring |
| Teacher Adoption | > 70% | Usage analytics |
| Student Satisfaction | NPS > 40 | Survey |

---

## 11. Future Enhancements

- **Machine Learning**: 개인별 베이스라인 학습
- **Sensor Integration**: 심박수, 아이트래킹 연동
- **Intervention Automation**: 불안 감지 시 자동 힌트 제공
- **Multi-LMS Support**: Canvas, Blackboard 확장
- **Mobile App**: 실시간 알림 앱

---

## References

- Moodle Plugin Development: https://docs.moodle.org/dev/
- PHP 7.1 Documentation: https://www.php.net/manual/en/
- MySQL 5.7 Reference: https://dev.mysql.com/doc/refman/5.7/en/
- Educational Psychology: Anxiety and Learning Performance Studies
