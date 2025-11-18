# Rule Patternizer - 미분 공식 패턴 학습 앱

**Rule Patternizer**는 Moodle LMS와 연동되어 미분 공식을 '패턴'으로 기억하도록 돕는 교육용 웹앱입니다. 가상 스마트폰 화면에 표시되며, 학습자가 미분 공식을 반복 학습하고 마스터리 레벨을 추적할 수 있습니다.

---

## 주요 기능 | Features

### 한글
- ✅ **Moodle 3.7 통합**: Moodle 활동 모듈로 완전히 통합
- ✅ **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 스타일 인터페이스
- ✅ **11가지 미분 공식**: Constant, Power, Product, Chain Rule 등
- ✅ **패턴 기반 학습**: 공식을 패턴으로 인식하고 기억
- ✅ **진행도 추적**: 각 공식별 마스터리 레벨 (0-100%) 표시
- ✅ **즉각적인 피드백**: 답안 제출 시 즉시 정답 여부 확인
- ✅ **힌트 시스템**: 문제 해결에 어려움이 있을 때 힌트 제공
- ✅ **LaTeX 수식 렌더링**: MathJax를 이용한 수학 공식 표시

### English
- ✅ **Moodle 3.7 Integration**: Fully integrated as a Moodle activity module
- ✅ **Virtual Smartphone UI**: Mobile app-style interface displayed at bottom right
- ✅ **11 Differentiation Rules**: Including Constant, Power, Product, Chain Rule, etc.
- ✅ **Pattern-Based Learning**: Recognize and memorize formulas as patterns
- ✅ **Progress Tracking**: Mastery level (0-100%) for each rule
- ✅ **Instant Feedback**: Immediate verification upon answer submission
- ✅ **Hint System**: Provides hints when struggling with problems
- ✅ **LaTeX Math Rendering**: Beautiful formula display using MathJax

---

## 기술 스택 | Technology Stack

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Math Rendering**: MathJax 3.x
- **Architecture**: Moodle Activity Module Plugin

---

## 시스템 요구사항 | System Requirements

### 필수 | Required
- Moodle 3.7 or higher
- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- mod_rewrite enabled

### 권장 | Recommended
- PHP 7.2+
- MySQL 5.7+ or MariaDB 10.2+
- 2GB+ RAM
- HTTPS enabled

---

## 설치 방법 | Installation

### 1. 플러그인 설치 | Plugin Installation

#### 방법 1: ZIP 파일로 설치 | Method 1: Install via ZIP

```bash
# 1. ZIP 파일 생성
cd /path/to/alt42standalone_v1.0
zip -r rule_patternizer.zip rule_patternizer/

# 2. Moodle 관리자 페이지에서 설치
# Site administration > Plugins > Install plugins
# ZIP 파일 업로드 후 설치
```

#### 방법 2: 직접 복사 | Method 2: Manual Installation

```bash
# Moodle 설치 디렉토리로 복사
cp -r rule_patternizer /path/to/moodle/mod/

# 권한 설정
cd /path/to/moodle
chown -R www-data:www-data mod/rulepatternizer
chmod -R 755 mod/rulepatternizer
```

### 2. 데이터베이스 설정 | Database Setup

```bash
# Moodle 관리자로 로그인
# Site administration > Notifications
# 자동으로 데이터베이스 테이블이 생성됩니다
```

### 3. 샘플 데이터 삽입 | Insert Sample Data

```sql
-- MySQL/MariaDB에 접속
mysql -u moodle_user -p moodle_db

-- 샘플 데이터 삽입 (테이블 prefix를 실제 값으로 변경)
-- 예: {rulepatternizer_rules} -> mdl_rulepatternizer_rules

-- 방법 1: SQL 파일 실행
source /path/to/rule_patternizer/db/sample_data.sql;

-- 방법 2: 직접 실행
-- rule_patternizer/db/sample_data.sql 파일을 열어서
-- {rulepatternizer_rules} -> mdl_rulepatternizer_rules
-- {rulepatternizer_problems} -> mdl_rulepatternizer_problems
-- {instance_id} -> 실제 활동 인스턴스 ID
-- 로 변경한 후 실행
```

### 4. 활동 추가 | Add Activity to Course

```
1. 코스로 이동
2. "Turn editing on" 클릭
3. "Add an activity or resource" 클릭
4. "Rule Patternizer" 선택
5. 활동 이름과 설명 입력
6. "Save and display" 클릭
```

---

## 사용 방법 | Usage Guide

### 학생용 | For Students

1. **시작하기**
   - Rule Patternizer 활동 클릭
   - 우측 하단에 가상 스마트폰 화면이 나타남
   - "Start Learning" 버튼 클릭

2. **규칙 선택**
   - 학습하고 싶은 미분 공식 선택
   - 난이도 레벨(1-5)을 확인

3. **문제 풀기**
   - 제시된 문제를 읽고 답안 입력
   - "Submit" 버튼으로 제출
   - 즉각적인 피드백 확인

4. **진행도 확인**
   - "View Progress" 버튼 클릭
   - 각 규칙별 마스터리 레벨 확인
   - 통계 정보 확인 (시도 횟수, 정답률 등)

### 교사용 | For Teachers

1. **활동 생성**
   - 코스에 Rule Patternizer 활동 추가
   - 활동 설명 작성

2. **문제 관리**
   - 데이터베이스에서 직접 문제 추가/수정
   - `mdl_rulepatternizer_problems` 테이블 사용

3. **진행도 모니터링**
   - Moodle 기본 리포트 기능 활용
   - `mdl_rulepatternizer_progress` 테이블 조회

---

## 디렉토리 구조 | Directory Structure

```
rule_patternizer/
├── amd/
│   └── src/
│       └── app.js              # JavaScript 애플리케이션 로직
├── classes/
│   └── api.php                 # API 클래스
├── db/
│   ├── access.php              # 권한 정의
│   ├── install.xml             # 데이터베이스 스키마
│   └── sample_data.sql         # 샘플 데이터
├── docs/                       # 문서
├── lang/
│   └── en/
│       └── rulepatternizer.php # 언어 파일
├── styles/
│   └── smartphone.css          # 스마트폰 UI 스타일
├── tests/                      # 테스트 파일
├── ajax.php                    # AJAX 엔드포인트
├── lib.php                     # 핵심 라이브러리 함수
├── mod_form.php                # 활동 설정 폼
├── version.php                 # 플러그인 버전 정보
└── view.php                    # 메인 뷰 페이지
```

---

## API 엔드포인트 | API Endpoints

### GET/POST `/mod/rulepatternizer/ajax.php`

#### 1. 규칙 목록 조회 | Get Rules
```javascript
{
  action: 'get_rules',
  instanceid: 123
}
```

#### 2. 문제 조회 | Get Problem
```javascript
{
  action: 'get_random_problem',
  instanceid: 123,
  ruleid: 2
}
```

#### 3. 답안 제출 | Submit Answer
```javascript
{
  action: 'submit_answer',
  instanceid: 123,
  problemid: 45,
  answer: '2x',
  timetaken: 30
}
```

#### 4. 진행도 조회 | Get Progress
```javascript
{
  action: 'get_progress',
  instanceid: 123
}
```

#### 5. 다음 문제 조회 | Get Next Problem
```javascript
{
  action: 'get_next_problem',
  instanceid: 123
}
```

---

## 데이터베이스 스키마 | Database Schema

### 주요 테이블 | Main Tables

#### 1. `mdl_rulepatternizer`
활동 인스턴스 정보

#### 2. `mdl_rulepatternizer_rules`
미분 공식 정의
- `rule_name`: 공식 이름
- `rule_formula`: LaTeX 공식
- `pattern_type`: 패턴 유형
- `difficulty_level`: 난이도 (1-5)

#### 3. `mdl_rulepatternizer_problems`
연습 문제
- `problem_latex`: LaTeX 형식 문제
- `correct_answer`: 정답
- `hint`: 힌트

#### 4. `mdl_rulepatternizer_progress`
학습 진행도
- `attempts`: 시도 횟수
- `correct_count`: 정답 횟수
- `mastery_level`: 마스터리 레벨 (0-100)

#### 5. `mdl_rulepatternizer_answers`
답안 로그
- `user_answer`: 사용자 답안
- `is_correct`: 정답 여부
- `time_taken`: 소요 시간

---

## 문제 해결 | Troubleshooting

### 문제: 스마트폰 화면이 표시되지 않음
**해결책**:
```bash
# CSS 파일 경로 확인
ls /path/to/moodle/mod/rulepatternizer/styles/smartphone.css

# 브라우저 캐시 삭제
# Moodle: Site administration > Development > Purge all caches
```

### 문제: 문제가 로드되지 않음
**해결책**:
```sql
-- 샘플 데이터가 삽입되었는지 확인
SELECT COUNT(*) FROM mdl_rulepatternizer_rules;
SELECT COUNT(*) FROM mdl_rulepatternizer_problems;

-- 활동 인스턴스 ID 확인
SELECT id, name FROM mdl_rulepatternizer;
```

### 문제: LaTeX 수식이 렌더링되지 않음
**해결책**:
- MathJax CDN 로드 확인
- 브라우저 콘솔에서 에러 확인
- 네트워크 연결 확인

### 문제: AJAX 요청 실패
**해결책**:
```bash
# PHP 에러 로그 확인
tail -f /var/log/apache2/error.log

# Moodle 디버그 모드 활성화
# Site administration > Development > Debugging
# Debug messages: DEVELOPER
```

---

## 커스터마이징 | Customization

### 새로운 규칙 추가 | Add New Rules

```sql
INSERT INTO mdl_rulepatternizer_rules
(rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Your Rule Name',
    '\\frac{d}{dx}[your formula]',
    'symbolic',
    3,
    'Description of your rule',
    'Example: ...',
    UNIX_TIMESTAMP()
);
```

### 문제 추가 | Add New Problems

```sql
INSERT INTO mdl_rulepatternizer_problems
(rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    1,  -- rule_id
    123,  -- instance_id
    'Your problem text',
    'f(x) = x^2',
    '2x',
    'Your hint here',
    2,
    UNIX_TIMESTAMP()
);
```

### UI 커스터마이징 | Customize UI

```css
/* rule_patternizer/styles/smartphone.css 수정 */

/* 스마트폰 프레임 색상 변경 */
#smartphone-frame {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* 버튼 색상 변경 */
.btn-primary {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

---

## 성능 최적화 | Performance Optimization

### 1. 데이터베이스 인덱스
```sql
-- 이미 install.xml에 포함되어 있음
-- 추가 인덱스가 필요한 경우:
CREATE INDEX idx_user_rule ON mdl_rulepatternizer_progress(userid, rule_id);
```

### 2. 캐싱
```php
// lib.php에 캐싱 추가 예시
$cache = cache::make('mod_rulepatternizer', 'rules');
if ($rules = $cache->get('all_rules')) {
    return $rules;
}
// ... DB query
$cache->set('all_rules', $rules);
```

### 3. JavaScript 최소화
```bash
# 프로덕션 환경에서는 JavaScript 압축
uglifyjs rule_patternizer/amd/src/app.js -o rule_patternizer/amd/src/app.min.js
```

---

## 보안 고려사항 | Security Considerations

- ✅ Moodle 권한 시스템 통합
- ✅ SQL Injection 방지 (Moodle DB API 사용)
- ✅ XSS 방지 (입력값 escape 처리)
- ✅ CSRF 보호 (Moodle 세션 관리)
- ✅ 사용자 인증 및 권한 체크

---

## 라이선스 | License

GNU General Public License v3.0

---

## 지원 및 기여 | Support & Contribution

### 버그 리포트 | Bug Reports
이슈를 발견하시면 GitHub Issues에 등록해주세요.

### 기여 방법 | How to Contribute
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 버전 정보 | Version History

### v1.0.0 (2024-11-18)
- 초기 릴리스
- 11가지 미분 공식 지원
- 가상 스마트폰 UI
- 진행도 추적 시스템
- Moodle 3.7 통합

---

## 연락처 | Contact

프로젝트 관련 문의: [Your Contact Information]

---

## 참고 자료 | References

- [Moodle Developer Documentation](https://docs.moodle.org/dev/)
- [MathJax Documentation](https://docs.mathjax.org/)
- [MySQL 5.7 Reference](https://dev.mysql.com/doc/refman/5.7/en/)
- [PHP 7.1 Documentation](https://www.php.net/manual/en/)

---

**Rule Patternizer** - Making Calculus Pattern Recognition Easy! 🚀📱
