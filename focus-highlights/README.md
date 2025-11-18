# Focus Highlights - LMS 초집중 순간 하이라이트 시스템

Moodle LMS와 연동하여 학습자의 초집중 순간을 자동으로 감지하고 하이라이트로 저장하는 독립형 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 스마트 초집중 감지
- **연속 학습 시간**: 5분 이상 지속적인 집중
- **높은 정답률**: 80% 이상의 정확도
- **빠른 응답 시간**: 최적 응답 속도 분석
- **활발한 상호작용**: 클릭, 키보드 입력 등 추적
- **집중도 점수**: 0-100점 척도로 자동 계산

### 2. 포괄적인 분석 대시보드
- **학생 대시보드**: 개인 학습 패턴 및 하이라이트 확인
- **교사 대시보드**: 과목별 학생 참여도 모니터링
- **시각화**: 일별 집중도 추세 그래프
- **통계**: 세션 수, 평균 점수, 총 학습 시간 등

### 3. Moodle 완벽 연동
- Moodle Web Services API 통합
- 사용자 및 과목 자동 동기화
- 독립 실행 가능한 웹 애플리케이션
- 실시간 활동 추적

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 또는 Nginx
- **브라우저**: 최신 브라우저 (JavaScript 활성화 필요)

## 🚀 설치 방법

### 1. 파일 업로드
```bash
# 웹 서버 디렉토리에 업로드
cd /var/www/html
cp -r focus-highlights /var/www/html/
```

### 2. 권한 설정
```bash
chmod 755 focus-highlights
chmod 644 focus-highlights/config/*.php
chmod 755 focus-highlights/sql
```

### 3. 웹 설치 마법사 실행
브라우저에서 접속:
```
http://yourdomain.com/focus-highlights/install.php
```

설치 단계:
1. **데이터베이스 구성**: MySQL 연결 정보 입력
2. **Moodle 연동**: Moodle URL 및 웹 서비스 토큰 입력
3. **완료**: 설치 완료 확인

### 4. Moodle 웹 서비스 설정

#### 4.1 웹 서비스 활성화
1. Moodle 관리 → 사이트 관리 → 플러그인 → 웹 서비스 → 개요
2. "웹 서비스 활성화" 체크

#### 4.2 웹 서비스 생성
1. 웹 서비스 → 관리 → 외부 서비스
2. "추가" 클릭
3. 이름: "Focus Highlights"
4. 다음 함수들 추가:
   - `core_user_get_users_by_field`
   - `core_course_get_courses`
   - `core_course_get_contents`
   - `core_enrol_get_enrolled_users`
   - `mod_quiz_get_user_attempts`
   - `mod_assign_get_submissions`

#### 4.3 사용자 및 토큰 생성
1. 웹 서비스 사용 권한이 있는 사용자 생성
2. 웹 서비스 → 관리 → 토큰 관리
3. "추가" 클릭하여 토큰 생성
4. 생성된 토큰을 설치 마법사에 입력

## 🔧 Moodle 통합

### JavaScript 추적 코드 추가

Moodle 테마 또는 과목 페이지에 다음 코드를 추가:

```html
<!-- Focus Highlights Tracker -->
<script src="/focus-highlights/public/js/tracker.js"></script>
<div data-focus-tracker
     data-user-id="<?php echo $USER->id; ?>"
     data-course-id="<?php echo $COURSE->id; ?>"
     data-activity-id="<?php echo $cm->id ?? ''; ?>">
</div>
```

### 테마에 영구 통합

`theme/yourtheme/layout/includes/footer.php` 에 추가:

```php
<?php
global $USER, $COURSE, $cm;

if (isloggedin() && !isguestuser()) {
    ?>
    <script src="/focus-highlights/public/js/tracker.js"></script>
    <div data-focus-tracker
         data-user-id="<?php echo $USER->id; ?>"
         data-course-id="<?php echo $COURSE->id; ?>">
    </div>
    <?php
}
?>
```

## 📊 사용 방법

### 학생 대시보드 접속
```
http://yourdomain.com/focus-highlights/public/student_dashboard.php?user_id=1
```

기능:
- 개인 통계 (총 세션, 하이라이트 수, 평균 점수)
- 최근 하이라이트 목록
- 일별 집중도 추세 그래프
- 과목별 분석
- 최근 학습 세션

### 교사 대시보드 접속
```
http://yourdomain.com/focus-highlights/public/teacher_dashboard.php?teacher_id=2
```

기능:
- 과목 선택 및 전환
- 과목별 통계
- 학생별 하이라이트 목록
- 학생 성과 요약
- 개별 학생 상세보기

## 🎨 커스터마이징

### 집중도 감지 기준 조정

`fh_config` 테이블에서 설정 변경:

```sql
-- 최소 집중 시간 (초 단위, 기본값: 300초 = 5분)
UPDATE fh_config SET config_value = '600' WHERE config_key = 'min_focus_duration';

-- 최소 집중 점수 (0-100, 기본값: 70)
UPDATE fh_config SET config_value = '75' WHERE config_key = 'min_focus_score';

-- 최소 정답률 (0-100, 기본값: 80)
UPDATE fh_config SET config_value = '85' WHERE config_key = 'min_accuracy_rate';

-- 최대 응답 시간 (초 단위, 기본값: 60)
UPDATE fh_config SET config_value = '45' WHERE config_key = 'max_response_time';

-- 추적 간격 (초 단위, 기본값: 5)
UPDATE fh_config SET config_value = '10' WHERE config_key = 'tracking_interval';
```

### 스타일 커스터마이징

`public/css/style.css` 파일을 수정하여 색상 및 디자인 변경:

```css
/* 메인 색상 변경 */
header {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

/* 하이라이트 강조 색상 */
.highlight-score {
    background: #YOUR_COLOR;
}
```

## 📁 프로젝트 구조

```
focus-highlights/
├── config/
│   ├── database.php          # 데이터베이스 설정
│   └── moodle.php            # Moodle 연동 설정
├── includes/
│   ├── db.php                # 데이터베이스 연결 클래스
│   ├── moodle_api.php        # Moodle API 통합
│   └── focus_tracker.php     # 집중도 추적 로직
├── api/
│   ├── track_activity.php    # 활동 추적 API
│   ├── get_highlights.php    # 하이라이트 조회 API
│   └── get_dashboard_data.php # 대시보드 데이터 API
├── public/
│   ├── index.php             # 홈페이지
│   ├── student_dashboard.php # 학생 대시보드
│   ├── teacher_dashboard.php # 교사 대시보드
│   ├── css/
│   │   └── style.css         # 스타일시트
│   └── js/
│       ├── tracker.js        # 클라이언트 추적 스크립트
│       └── dashboard.js      # 대시보드 JavaScript
├── sql/
│   └── schema.sql            # 데이터베이스 스키마
├── install.php               # 설치 마법사
└── README.md                 # 이 파일
```

## 🔍 API 엔드포인트

### 1. 활동 추적 (track_activity.php)

**세션 시작**
```javascript
POST /api/track_activity.php
{
  "action": "start_session",
  "user_id": 1,
  "course_id": 5,
  "activity_id": 12
}
```

**활동 기록**
```javascript
POST /api/track_activity.php
{
  "action": "log_activity",
  "session_id": 123,
  "user_id": 1,
  "course_id": 5,
  "activity_type": "click",
  "activity_data": {"element": "button"}
}
```

**세션 종료**
```javascript
POST /api/track_activity.php
{
  "action": "end_session",
  "session_id": 123,
  "user_id": 1,
  "course_id": 5
}
```

### 2. 하이라이트 조회 (get_highlights.php)

```javascript
GET /api/get_highlights.php?user_id=1&limit=20&offset=0
```

### 3. 대시보드 데이터 (get_dashboard_data.php)

```javascript
GET /api/get_dashboard_data.php?user_id=1&days=30
```

## 🧪 테스트

### 1. 테스트 사용자 생성

```sql
-- 학생 사용자
INSERT INTO fh_users (moodle_user_id, username, firstname, lastname, email, role)
VALUES (1, 'student1', '학생', '일', 'student1@example.com', 'student');

-- 교사 사용자
INSERT INTO fh_users (moodle_user_id, username, firstname, lastname, email, role)
VALUES (2, 'teacher1', '교사', '일', 'teacher1@example.com', 'teacher');
```

### 2. 테스트 과목 생성

```sql
INSERT INTO fh_courses (moodle_course_id, course_name, course_shortname)
VALUES (1, '수학 입문', 'MATH101');
```

### 3. 테스트 세션 생성

브라우저 콘솔에서:

```javascript
// 추적 시작
const tracker = new FocusTracker(1, 1);

// 정답 제출 시뮬레이션
tracker.recordAnswer(true, 15); // 정답, 15초
tracker.recordAnswer(true, 12); // 정답, 12초
tracker.recordAnswer(false, 25); // 오답, 25초

// 세션 종료
tracker.endSession();
```

## 🔒 보안 고려사항

1. **API 보안**: CORS 설정 검토 및 필요시 제한
2. **SQL Injection**: PDO 준비된 문장 사용
3. **XSS 방지**: 모든 출력에 `htmlspecialchars()` 적용
4. **인증**: 프로덕션 환경에서 적절한 인증 시스템 구현
5. **HTTPS**: 프로덕션 환경에서 HTTPS 사용 권장

## 📈 집중도 점수 계산 방식

집중도 점수는 다음 4가지 요소로 계산됩니다 (총 100점):

1. **지속 시간 점수 (30점)**
   - 30분 이상: 만점
   - 비례 배분

2. **상호작용 빈도 점수 (25점)**
   - 최적: 15초당 1회 상호작용
   - 비례 배분

3. **정답률 점수 (30점)**
   - 정답률에 비례

4. **응답 시간 점수 (15점)**
   - 5초 이하: 너무 빠름 (5점)
   - 5-30초: 최적 (15점)
   - 30초 이상: 느림 (감점)

### 하이라이트 기준

다음 조건을 **모두** 만족해야 하이라이트로 저장됩니다:

- ✅ 최소 5분 이상 집중
- ✅ 집중도 점수 70점 이상
- ✅ 정답률 80% 이상 (답변이 있는 경우)
- ✅ 평균 응답 시간 60초 이하

## 🐛 문제 해결

### 데이터베이스 연결 오류
```
Database connection failed
```
**해결**: `config/database.php` 파일의 DB 정보 확인

### Moodle API 오류
```
Moodle token not configured
```
**해결**:
1. Moodle 웹 서비스가 활성화되어 있는지 확인
2. 토큰이 올바르게 생성되었는지 확인
3. `fh_config` 테이블의 `moodle_token` 값 확인

### 추적이 작동하지 않음
**해결**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. `tracker.js` 경로가 올바른지 확인
3. `data-focus-tracker` 속성이 있는지 확인
4. API 엔드포인트가 접근 가능한지 확인

### 하이라이트가 생성되지 않음
**해결**:
1. 집중도 기준 설정 확인 (`fh_config` 테이블)
2. 세션이 최소 5분 이상인지 확인
3. 정답률이 80% 이상인지 확인

## 📞 지원 및 기여

문제가 발생하거나 기능 제안이 있으시면:
- GitHub Issues를 통해 보고
- Pull Request를 통한 기여 환영

## 📄 라이선스

이 프로젝트는 교육 목적으로 제공됩니다.

## 🙏 감사의 말

- Moodle 커뮤니티
- PHP 및 MySQL 개발자
- 모든 기여자 및 사용자

---

**Version**: 1.0.0
**Last Updated**: 2024
**Compatibility**: PHP 7.1.9 | MySQL 5.7 | Moodle 3.7
