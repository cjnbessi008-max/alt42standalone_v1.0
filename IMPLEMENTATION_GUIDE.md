# Moodle 3.7 LMS 통합 가이드 / Integration Guide

## 개요 / Overview

이 가이드는 Moodle 3.7 LMS에 "놓친 문제 피드백(Missed Question Feedback)" 플러그인을 통합하는 방법을 설명합니다.

This guide explains how to integrate the "Missed Question Feedback" plugin into Moodle 3.7 LMS.

## 시스템 환경 / System Environment

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7

## 통합 단계 / Integration Steps

### 1단계: 플러그인 설치 / Step 1: Plugin Installation

#### 옵션 A: 파일 복사 / Option A: File Copy

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/html/moodle  # (또는 Moodle 설치 경로)

# 플러그인 디렉토리 복사
cp -r /path/to/alt42standalone_v1.0/local/missedquestionfeedback local/

# 파일 권한 설정
chown -R www-data:www-data local/missedquestionfeedback
chmod -R 755 local/missedquestionfeedback
```

#### 옵션 B: 심볼릭 링크 / Option B: Symbolic Link

```bash
cd /var/www/html/moodle/local
ln -s /path/to/alt42standalone_v1.0/local/missedquestionfeedback missedquestionfeedback
```

### 2단계: 데이터베이스 설치 / Step 2: Database Installation

웹 브라우저에서 Moodle 관리 페이지에 접속합니다:

Access the Moodle admin page in your web browser:

```
https://your-moodle-site.com/admin
```

Moodle이 자동으로 새 플러그인을 감지하고 데이터베이스 업그레이드를 제안합니다. "Upgrade Moodle database now" 버튼을 클릭합니다.

Moodle will automatically detect the new plugin and prompt for database upgrade. Click "Upgrade Moodle database now".

#### 수동 설치 (필요시) / Manual Installation (if needed)

```bash
cd /var/www/html/moodle
php admin/cli/upgrade.php
```

### 3단계: Moodle Quiz 모듈 수정 / Step 3: Modify Moodle Quiz Module

**중요**: 이 단계는 퀴즈 리뷰 페이지에 피드백을 표시하기 위해 필수입니다.

**Important**: This step is essential to display feedback in quiz review pages.

#### 방법 1: 직접 수정 / Method 1: Direct Modification

`mod/quiz/review.php` 파일을 수정합니다:

Edit the `mod/quiz/review.php` file:

```bash
cd /var/www/html/moodle
nano mod/quiz/review.php  # 또는 선호하는 에디터 사용
```

다음 위치를 찾습니다 (약 200-250줄):

Find this location (around line 200-250):

```php
// Display each question
foreach ($questions as $i => $question) {
    // ... existing question display code ...
    echo $question->render();

    // 여기에 추가 / ADD HERE:
    if (function_exists('local_missedquestionfeedback_quiz_review_question')) {
        $qa = $attemptobj->get_question_attempt($i);
        echo local_missedquestionfeedback_quiz_review_question($qa, $attemptobj->get_attemptid());
    }
}
```

#### 방법 2: 템플릿 오버라이드 / Method 2: Template Override

Moodle 테마에서 템플릿을 오버라이드합니다:

Override the template in your Moodle theme:

```bash
cd /var/www/html/moodle/theme/YOUR_THEME
mkdir -p templates/mod/quiz
cp ../../mod/quiz/templates/review.mustache templates/mod/quiz/
```

그 다음 `templates/mod/quiz/review.mustache`를 수정하여 피드백 블록을 추가합니다.

Then modify `templates/mod/quiz/review.mustache` to add the feedback block.

### 4단계: 초기 설정 / Step 4: Initial Configuration

#### 4.1 권한 확인 / Check Permissions

```
사이트 관리 → 사용자 → 권한 → 역할 정의
Site Administration → Users → Permissions → Define roles
```

다음 역할에 권한이 올바르게 설정되었는지 확인:

Verify permissions are correctly set for these roles:

- **학생 / Students**: `local/missedquestionfeedback:view`
- **교사 / Teachers**: `local/missedquestionfeedback:view`, `local/missedquestionfeedback:viewreports`
- **관리자 / Managers**: All permissions

#### 4.2 첫 번째 개념 생성 / Create First Concept

```
사이트 관리 → Missed Question Feedback → Manage Concepts
```

예시:

```
이름: 분수의 기본 개념
카테고리: 수학
설명: 분수의 덧셈, 뺄셈, 곱셈, 나눗셈
```

#### 4.3 첫 번째 오개념 생성 / Create First Misconception

```
사이트 관리 → Missed Question Feedback → Manage Misconceptions
```

예시:

```
개념: 분수의 기본 개념
이름: 분자와 분모를 각각 더함
설명: 학생이 1/4 + 1/4 = 2/8이라고 계산함
왜 틀렸나: 같은 분모를 가진 분수를 더할 때는 분자만 더하고 분모는 그대로 유지해야 함
올바른 이해: 1/4 + 1/4 = 2/4 = 1/2
개선 방법: 분수 덧셈의 기본 규칙을 복습하세요
리소스 URL: https://example.com/math/fractions
심각도: 보통
```

### 5단계: 퀴즈 문제 매핑 / Step 5: Map Quiz Questions

기존 퀴즈가 있다면:

If you have existing quizzes:

1. 퀴즈 문제 ID 확인 / Identify quiz question IDs
2. "Map Questions" 페이지에서 문제와 오개념 연결
3. 특정 오답 선택지와 오개념 연결 (선택사항)

### 6단계: 테스트 / Step 6: Testing

#### 6.1 학생 계정으로 테스트 / Test as Student

1. 테스트 학생 계정으로 로그인
2. 퀴즈 시작
3. 의도적으로 틀린 답 선택 (매핑된 오개념이 있는 문제)
4. 퀴즈 제출
5. 결과 리뷰 페이지에서 피드백 확인

#### 6.2 교사 계정으로 테스트 / Test as Teacher

1. 교사 계정으로 로그인
2. "Misconception Analytics" 접속
3. 학생들의 오개념 패턴 확인
4. 피드백 조회 및 리소스 클릭 통계 확인

## 문제 해결 / Troubleshooting

### 문제 1: 플러그인이 감지되지 않음 / Plugin not detected

**해결책 / Solution:**

```bash
# 캐시 삭제
php admin/cli/purge_caches.php

# 또는 웹 인터페이스에서:
# 사이트 관리 → 개발 → 캐시 삭제
```

### 문제 2: 데이터베이스 오류 / Database errors

**해결책 / Solution:**

```bash
# 데이터베이스 연결 확인
mysql -u moodleuser -p moodledb

# 테이블 확인
SHOW TABLES LIKE 'mdl_missed_feedback%';

# 수동 업그레이드
php admin/cli/upgrade.php --non-interactive
```

### 문제 3: 피드백이 표시되지 않음 / Feedback not showing

**체크리스트 / Checklist:**

1. ✓ `mod/quiz/review.php` 수정 확인
2. ✓ 플러그인 활성화 확인
3. ✓ 개념과 오개념 생성 확인
4. ✓ 문제-오개념 매핑 확인
5. ✓ 브라우저 캐시 삭제
6. ✓ Moodle 캐시 삭제

**디버깅 / Debugging:**

`config.php`에 디버깅 활성화:

```php
$CFG->debug = 32767;
$CFG->debugdisplay = 1;
```

### 문제 4: 권한 오류 / Permission errors

**해결책 / Solution:**

```
사이트 관리 → 사용자 → 권한 → 시스템 권한 확인
```

또는:

```bash
cd /var/www/html/moodle
php admin/cli/reset_roles.php
```

## 성능 최적화 / Performance Optimization

### 데이터베이스 인덱스 확인 / Verify Database Indexes

```sql
-- 인덱스 확인
SHOW INDEX FROM mdl_missed_feedback_qmapping;
SHOW INDEX FROM mdl_missed_feedback_interactions;

-- 필요시 추가 인덱스 생성
CREATE INDEX idx_questionid_answerid
ON mdl_missed_feedback_qmapping(questionid, answerid);
```

### 캐싱 설정 / Caching Configuration

`lib.php`에서 캐싱 활성화:

```php
// 오개념 데이터 캐싱
$cache = cache::make('local_missedquestionfeedback', 'misconceptions');
$misconception = $cache->get($misconceptionid);

if (!$misconception) {
    $misconception = api::get_misconception($misconceptionid);
    $cache->set($misconceptionid, $misconception);
}
```

## 보안 고려사항 / Security Considerations

1. **입력 검증 / Input Validation**: 모든 사용자 입력은 Moodle DML을 통해 처리됨
2. **권한 확인 / Permission Checks**: 모든 작업 전 권한 확인
3. **SQL Injection 방지 / SQL Injection Prevention**: 직접 SQL 쿼리 사용 금지, Moodle DML 사용
4. **XSS 방지 / XSS Prevention**: 모든 출력은 `s()` 또는 `format_text()` 사용

## 백업 및 복원 / Backup and Restore

### 백업 / Backup

```bash
# 데이터베이스 백업
mysqldump -u root -p moodledb mdl_missed_feedback_concepts \
  mdl_missed_feedback_misconceptions \
  mdl_missed_feedback_interactions \
  mdl_missed_feedback_qmapping > missed_feedback_backup.sql

# 플러그인 파일 백업
tar -czf missed_feedback_files.tar.gz local/missedquestionfeedback/
```

### 복원 / Restore

```bash
# 데이터베이스 복원
mysql -u root -p moodledb < missed_feedback_backup.sql

# 파일 복원
tar -xzf missed_feedback_files.tar.gz -C /var/www/html/moodle/
```

## 모니터링 / Monitoring

### 사용 통계 확인 / Check Usage Statistics

```sql
-- 총 피드백 조회수
SELECT COUNT(*) FROM mdl_missed_feedback_interactions WHERE viewed = 1;

-- 가장 많이 나타난 오개념
SELECT m.name, COUNT(*) as count
FROM mdl_missed_feedback_interactions i
JOIN mdl_missed_feedback_misconceptions m ON i.misconceptionid = m.id
GROUP BY m.id, m.name
ORDER BY count DESC
LIMIT 10;

-- 리소스 클릭률
SELECT
  SUM(resourceclicked) / COUNT(*) * 100 as click_rate
FROM mdl_missed_feedback_interactions
WHERE viewed = 1;
```

## 유지보수 / Maintenance

### 정기 작업 / Regular Tasks

1. **월간 / Monthly**:
   - 오개념 데이터 검토 및 업데이트
   - 사용하지 않는 매핑 정리
   - 분석 데이터 리뷰

2. **분기별 / Quarterly**:
   - 성능 분석
   - 데이터베이스 최적화
   - 백업 검증

3. **연간 / Yearly**:
   - Moodle 버전 업그레이드 시 플러그인 호환성 확인
   - 보안 감사
   - 전체 데이터 아카이브

## 추가 리소스 / Additional Resources

- [Moodle Plugin Development](https://docs.moodle.org/dev/Plugin_types)
- [Moodle Question Engine](https://docs.moodle.org/dev/Question_engine)
- [Moodle Database API](https://docs.moodle.org/dev/Data_manipulation_API)

## 지원 받기 / Getting Support

문제가 발생하면:

If you encounter issues:

1. 이 가이드의 문제 해결 섹션 확인
2. `/docs_*.md` 파일에서 상세 정보 확인
3. GitHub Issues에 문제 보고
4. Moodle 포럼에서 도움 요청

## 다음 단계 / Next Steps

1. 실제 퀴즈에서 플러그인 테스트
2. 교사 교육 실시
3. 학생 피드백 수집
4. 오개념 데이터베이스 확장
5. 분석 데이터를 활용한 교육 개선
