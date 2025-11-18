# Anxiety Detection System for Moodle LMS
# 무들 LMS용 불안 감지 시스템

**Version:** 1.0.0
**Compatibility:** Moodle 3.7+, PHP 7.1.9+, MySQL 5.7+
**Author:** KAIST Touch Math Academy
**License:** GNU GPL v3 or later

---

## 📋 Overview / 개요

### English
The Anxiety Detection System is a Moodle plugin that monitors student behavioral patterns in real-time to detect excessive anxiety during learning activities. It provides teachers with actionable insights and alerts when students show signs of stress or struggle.

**Key Features:**
- 🔍 Real-time behavioral tracking (clicks, response times, errors, navigation patterns)
- 📊 Anxiety score calculation using multi-metric analysis
- 🚨 Automatic alerts for teachers when anxiety levels are high
- 📈 Visual dashboards for teachers and students
- 🔒 Privacy-focused with configurable data retention
- 🌐 Bilingual support (English/Korean)

### 한국어
불안 감지 시스템은 학습 활동 중 학생들의 행동 패턴을 실시간으로 모니터링하여 과도한 불안을 감지하는 무들 플러그인입니다. 교사에게 실행 가능한 인사이트를 제공하고 학생이 스트레스나 어려움의 징후를 보일 때 알림을 보냅니다.

**주요 기능:**
- 🔍 실시간 행동 추적 (클릭, 응답 시간, 오류, 탐색 패턴)
- 📊 다중 메트릭 분석을 사용한 불안 점수 계산
- 🚨 불안 수준이 높을 때 교사에게 자동 알림
- 📈 교사 및 학생을 위한 시각적 대시보드
- 🔒 구성 가능한 데이터 보존으로 프라이버시 중심
- 🌐 이중 언어 지원 (영어/한국어)

---

## 🚀 Installation / 설치

### Method 1: Manual Installation / 방법 1: 수동 설치

1. **Download and Extract / 다운로드 및 압축 해제**
   ```bash
   cd /path/to/moodle
   mkdir -p local/anxiety
   # Copy all files from moodle-plugin/local/anxiety to local/anxiety
   ```

2. **Set Permissions / 권한 설정**
   ```bash
   chown -R www-data:www-data local/anxiety
   chmod -R 755 local/anxiety
   ```

3. **Install via Moodle Admin / 무들 관리자를 통한 설치**
   - Log in as administrator / 관리자로 로그인
   - Navigate to: Site administration → Notifications
   - Follow the upgrade prompts / 업그레이드 안내를 따르세요
   - Click "Upgrade Moodle database now" / "지금 무들 데이터베이스 업그레이드" 클릭

4. **Verify Installation / 설치 확인**
   - Go to: Site administration → Plugins → Local plugins
   - You should see "Anxiety Detection System" listed
   - 목록에 "불안 감지 시스템"이 표시되어야 합니다

### Method 2: Git Installation / 방법 2: Git 설치

```bash
cd /path/to/moodle/local
git clone <repository-url> anxiety
cd anxiety
# Follow steps 2-4 from Method 1
```

---

## ⚙️ Configuration / 설정

### Initial Configuration / 초기 설정

1. **Navigate to Settings / 설정으로 이동**
   - Site administration → Plugins → Local plugins → Anxiety Detection System
   - 사이트 관리 → 플러그인 → 로컬 플러그인 → 불안 감지 시스템

2. **Configure Thresholds / 임계값 구성**
   - **Mild Threshold** (경미한 불안 임계값): Default 30 (recommended: 25-35)
   - **Moderate Threshold** (중간 불안 임계값): Default 50 (recommended: 45-55)
   - **Severe Threshold** (심각한 불안 임계값): Default 70 (recommended: 65-75)

3. **Alert Settings / 알림 설정**
   - **Enable Alerts** (알림 활성화): Checked by default
   - **Alert Frequency** (알림 빈도): 300 seconds (5 minutes) - prevents alert spam

4. **Set Capabilities / 권한 설정**
   - Go to: Site administration → Users → Permissions → Define roles
   - Edit roles to assign anxiety capabilities:
     - **Students**: `local/anxiety:view` (view own data)
     - **Teachers**: `local/anxiety:view`, `local/anxiety:viewothers`, `local/anxiety:receivealerts`
     - **Managers**: All capabilities including `local/anxiety:manage`

### Per-Course Configuration / 코스별 설정

Each course can have custom thresholds and weights:

```sql
-- Example: Insert custom config for course ID 5
INSERT INTO mdl_local_anxiety_config (courseid, mild_threshold, moderate_threshold, severe_threshold, timemodified)
VALUES (5, 35.00, 55.00, 75.00, UNIX_TIMESTAMP());
```

---

## 📊 How It Works / 작동 원리

### Behavioral Metrics Tracked / 추적되는 행동 메트릭

1. **Response Time** (응답 시간): Time to answer questions
   - Too fast (< 30% avg) = Rushing
   - Too slow (> 200% avg) = Struggling

2. **Error Rate** (오답률): Number of incorrect answers
   - Threshold: 5+ consecutive errors

3. **Click Frequency** (클릭 빈도): Interactions per minute
   - Threshold: > 20 clicks/min = Anxiety

4. **Time on Task** (과제 소요 시간): Duration per activity
   - < 10 seconds = Giving up
   - > 10 minutes = Stuck/Confused

5. **Navigation Pattern** (탐색 패턴): Back button usage
   - > 5 back navigations = Uncertainty

6. **Session Duration** (세션 지속 시간): Continuous learning time
   - > 2 hours = Potential burnout

### Anxiety Score Calculation / 불안 점수 계산

```
Anxiety Score (0-100) = Weighted Sum:
  - Response Time Deviation × 25%
  - Error Rate × 20%
  - Click Frequency Abnormality × 15%
  - Time on Task Deviation × 20%
  - Navigation Pattern Issues × 10%
  - Session Duration Excess × 10%
```

**Classification / 분류:**
- 0-30: Normal (정상)
- 31-50: Mild Anxiety (경미한 불안)
- 51-70: Moderate Anxiety (중간 불안)
- 71-100: Severe Anxiety (심각한 불안)

---

## 🎯 Usage / 사용법

### For Teachers / 교사용

1. **Access Dashboard / 대시보드 접근**
   - In any course, look for "Anxiety Dashboard" in the course navigation
   - 코스에서 "불안 대시보드" 메뉴를 찾으세요

2. **Monitor Students / 학생 모니터링**
   - View real-time anxiety levels for all students
   - Sort by anxiety score to identify students needing support
   - 모든 학생의 실시간 불안 수준 확인
   - 불안 점수로 정렬하여 지원이 필요한 학생 식별

3. **Respond to Alerts / 알림에 응답**
   - Receive Moodle messages when students show high anxiety
   - Click "Acknowledge" to mark alerts as reviewed
   - Review detailed metrics to understand the cause
   - 학생이 높은 불안을 보일 때 무들 메시지 수신
   - "확인"을 클릭하여 알림을 검토됨으로 표시
   - 원인을 이해하기 위해 상세 메트릭 검토

4. **Take Action / 조치 취하기**
   - Reach out to struggling students via message or email
   - Provide additional resources or clarification
   - Consider adjusting course difficulty or pacing
   - 어려움을 겪는 학생에게 메시지나 이메일로 연락
   - 추가 리소스나 설명 제공
   - 코스 난이도나 진행 속도 조정 고려

### For Students / 학생용

1. **View Your Data / 자신의 데이터 보기**
   - Access "Anxiety Dashboard" in your course
   - See your anxiety trend over time
   - 코스에서 "불안 대시보드" 접근
   - 시간에 따른 불안 추세 확인

2. **Self-Awareness / 자기 인식**
   - If your anxiety score is high, consider:
     - Taking a short break
     - Practicing deep breathing
     - Asking for help from teachers or classmates
     - Breaking problems into smaller steps
   - 불안 점수가 높다면 다음을 고려하세요:
     - 짧은 휴식 취하기
     - 심호흡 연습하기
     - 선생님이나 동료에게 도움 요청
     - 문제를 작은 단계로 나누기

3. **Warnings / 경고**
   - If system detects severe anxiety, you'll see a pop-up message
   - This is a gentle reminder to take care of yourself
   - 시스템이 심각한 불안을 감지하면 팝업 메시지가 표시됩니다
   - 이것은 자신을 돌보라는 부드러운 알림입니다

---

## 🔧 API Endpoints / API 엔드포인트

### Track Event / 이벤트 추적
```
POST /local/anxiety/ajax/track.php
Parameters:
  - sesskey (required): Moodle session key
  - userid (required): User ID
  - courseid (required): Course ID
  - cmid (optional): Course module ID
  - event_type (required): click, response, error, navigation_back, time_update
  - event_data (optional): JSON object with event details

Response:
{
  "success": true,
  "anxiety_score": 45.2,
  "anxiety_level": "mild",
  "components": { ... }
}
```

### Get Dashboard Data / 대시보드 데이터 가져오기
```
GET /local/anxiety/ajax/get_data.php
Parameters:
  - sesskey (required): Moodle session key
  - courseid (required): Course ID
  - userid (optional): Specific user ID (requires viewothers capability)
  - timerange (optional): today, week, month (default: week)

Response:
{
  "success": true,
  "students": [ ... ],  // For teachers
  "trend": [ ... ],      // For students
  "alerts": [ ... ],
  "alert_stats": { ... }
}
```

### Acknowledge Alert / 알림 확인
```
POST /local/anxiety/ajax/acknowledge_alert.php
Parameters:
  - sesskey (required): Moodle session key
  - alertid (required): Alert ID

Response:
{
  "success": true
}
```

---

## 🗄️ Database Schema / 데이터베이스 스키마

### Tables / 테이블

1. **mdl_local_anxiety_metrics**: Real-time behavioral metrics
2. **mdl_local_anxiety_sessions**: Session aggregates
3. **mdl_local_anxiety_alerts**: Alert notifications
4. **mdl_local_anxiety_config**: Configuration per course

See `db/install.xml` for complete schema definition.

---

## 🔐 Privacy & Security / 프라이버시 및 보안

### Data Privacy / 데이터 프라이버시

- **GDPR/PIPA Compliant**: Only behavioral metrics are collected, no sensitive content
- **Consent**: Inform students about tracking (add to course syllabus)
- **Data Retention**: Automatic cleanup after 90 days (configurable)
- **Access Control**: Students can only see their own data, teachers see assigned courses

### Security Measures / 보안 조치

- **Session Validation**: All API calls require valid Moodle session
- **Capability Checks**: Role-based access control (RBAC)
- **SQL Injection Prevention**: Uses Moodle DML API
- **XSS Prevention**: All output is escaped using Moodle functions

---

## 🛠️ Troubleshooting / 문제 해결

### Issue: Tracker not loading / 문제: 추적기가 로드되지 않음

**Solution:**
1. Clear Moodle cache: Site administration → Development → Purge all caches
2. Check browser console for JavaScript errors
3. Verify plugin files are in correct location: `/local/anxiety/`

### Issue: Dashboard shows no data / 문제: 대시보드에 데이터가 표시되지 않음

**Solution:**
1. Ensure students have visited course pages (tracking only starts on visit)
2. Check time range selector - try "This Month" for more data
3. Verify database tables were created:
   ```sql
   SHOW TABLES LIKE 'mdl_local_anxiety%';
   ```

### Issue: Alerts not being sent / 문제: 알림이 전송되지 않음

**Solution:**
1. Check Settings: Ensure "Enable Alerts" is checked
2. Verify message provider: Site administration → Plugins → Message outputs
3. Check user preferences: Users must enable notifications
4. Review alert frequency - may be throttled (default: 5 minutes between alerts)

### Issue: Performance problems / 문제: 성능 문제

**Solution:**
1. Check database indexes:
   ```sql
   SHOW INDEX FROM mdl_local_anxiety_metrics;
   ```
2. Run cleanup task manually:
   ```bash
   php admin/cli/scheduled_task.php --execute='\\local_anxiety\\task\\cleanup_old_data'
   ```
3. Reduce tracking frequency in tracker.js (increase `throttleDelay`)

---

## 📈 Performance Optimization / 성능 최적화

### Recommended Settings / 권장 설정

- **Throttle Delay**: 1000ms (1 second between transmissions)
- **Batch Size**: 5 events per transmission
- **Cleanup Frequency**: Weekly (scheduled task runs every Sunday at 2 AM)
- **Data Retention**: 90 days (adjust based on storage capacity)

### Database Optimization / 데이터베이스 최적화

```sql
-- Add additional indexes for large installations
CREATE INDEX idx_timecreated_userid ON mdl_local_anxiety_metrics(timecreated, userid);
CREATE INDEX idx_courseid_anxietylevel ON mdl_local_anxiety_metrics(courseid, anxiety_level);

-- Partition tables by month (MySQL 5.7+)
-- Example for metrics table
ALTER TABLE mdl_local_anxiety_metrics PARTITION BY RANGE (timecreated) (
    PARTITION p2025_01 VALUES LESS THAN (UNIX_TIMESTAMP('2025-02-01')),
    PARTITION p2025_02 VALUES LESS THAN (UNIX_TIMESTAMP('2025-03-01')),
    -- Add more partitions as needed
);
```

---

## 🧪 Testing / 테스트

### Manual Testing / 수동 테스트

1. **As a Student:**
   - Enroll in a test course
   - Navigate pages, submit quizzes, make intentional errors
   - Check dashboard to see your anxiety score

2. **As a Teacher:**
   - Access dashboard to view student data
   - Trigger a high anxiety scenario (rapid clicks, many errors)
   - Verify alert is received

3. **API Testing:**
   ```bash
   # Test tracking endpoint
   curl -X POST "https://yourmoodle.com/local/anxiety/ajax/track.php" \
     -d "sesskey=YOUR_SESSKEY" \
     -d "userid=2" \
     -d "courseid=3" \
     -d "event_type=click" \
     -d "event_data={\"clickCount\":10}"
   ```

---

## 🤝 Support / 지원

### Documentation / 문서
- Architecture: See `docs/anxiety-detection-architecture.md`
- API Reference: See "API Endpoints" section above

### Contact / 연락처
- **Institution**: KAIST Touch Math Academy
- **Email**: support@example.com
- **GitHub**: [Repository URL]

### Contributing / 기여
Contributions are welcome! Please submit pull requests or open issues on GitHub.

---

## 📄 License / 라이선스

This plugin is licensed under the GNU General Public License v3.0 or later.

Copyright © 2025 KAIST Touch Math Academy

---

## 🙏 Acknowledgments / 감사의 말

- Moodle community for excellent documentation
- Educational psychology research on anxiety and learning
- Chart.js for visualization library

---

## 📝 Changelog / 변경 로그

### Version 1.0.0 (2025-11-18)
- ✨ Initial release
- 🔍 Real-time behavioral tracking
- 📊 Multi-metric anxiety scoring
- 🚨 Teacher alerting system
- 📈 Visual dashboards
- 🌐 Korean/English localization
- 🔒 Privacy and security features

---

**Note**: This system is designed to support teachers and students, not to replace professional mental health services. If a student is experiencing severe or persistent anxiety, please refer them to appropriate counseling resources.

**참고**: 이 시스템은 교사와 학생을 지원하기 위해 설계되었으며 전문적인 정신 건강 서비스를 대체하기 위한 것이 아닙니다. 학생이 심각하거나 지속적인 불안을 경험하는 경우 적절한 상담 리소스로 안내하십시오.
