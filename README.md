# Boundary Slider - 적분 경계값 슬라이더

Moodle LMS와 연동하여 적분 경계값을 시각적으로 설정할 수 있는 인터랙티브 웹 애플리케이션입니다.

## 📱 주요 기능

- **인터랙티브 슬라이더**: 적분의 하한(a)과 상한(b)을 직관적으로 조정
- **실시간 피드백**: 슬라이더 조작 시 즉시 적분 구간 시각화
- **스마트폰 시뮬레이터**: 우측 하단에 가상 스마트폰 화면으로 실시간 동기화 표시
- **Moodle 연동**: LMS에서 문제 정보를 가져와 자동으로 설정
- **자동 채점**: 정답 범위 내 답안 제출 시 자동 채점 및 성적 기록
- **학습 분석**: 슬라이더 상호작용 로그를 통한 학습 패턴 분석

## 🛠 기술 스택

- **Frontend**:
  - HTML5 / CSS3
  - Vanilla JavaScript (ES6+)
  - 반응형 웹 디자인

- **Backend**:
  - PHP 7.1.9
  - MySQL 5.7
  - RESTful API

- **연동**:
  - Moodle 3.7

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Apache 2.4+ 또는 Nginx
- Moodle 3.7 (선택적)

## 🚀 설치 방법

### 1. 파일 다운로드 및 배치

```bash
# 웹 서버 루트 디렉토리로 이동
cd /var/www/html

# 프로젝트 클론 또는 복사
git clone <repository-url> boundary-slider
cd boundary-slider
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE moodle;
SOURCE db/schema.sql;
```

### 3. 설정 파일 수정

`config.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

**Apache의 경우** `.htaccess` 파일이 자동으로 적용됩니다.

**Nginx의 경우** 다음 설정을 추가하세요:

```nginx
location /boundary-slider {
    try_files $uri $uri/ /index.php?$query_string;
}
```

### 5. 권한 설정

```bash
# 파일 권한 설정
chmod 755 api/
chmod 644 api/*.php
chmod 644 js/*.js
chmod 644 css/*.css
```

## 📖 사용 방법

### 단독 실행 (데모 모드)

브라우저에서 다음 URL로 접속:

```
http://localhost/boundary-slider/index.php
```

### Moodle 연동 모드

문제 ID를 파라미터로 전달:

```
http://localhost/boundary-slider/index.php?problem_id=1
```

### 슬라이더 조작

1. **하한(a) 슬라이더**: 적분 구간의 시작점 설정
2. **상한(b) 슬라이더**: 적분 구간의 끝점 설정
3. 슬라이더를 조작하면 우측 하단 스마트폰 화면에 실시간 반영
4. "답안 제출" 버튼 클릭하여 답안 제출

### 키보드 단축키

- **←/→ 또는 ↑/↓**: 슬라이더 미세 조정
- **Home**: 최솟값으로 이동
- **End**: 최댓값으로 이동

## 📊 데이터베이스 구조

### 주요 테이블

1. **mdl_boundary_problems**: 문제 정보
   - 함수 표현식
   - 슬라이더 범위 (min, max, step)
   - 정답 경계값
   - 허용 오차

2. **mdl_boundary_answers**: 학생 답안
   - 제출된 경계값
   - 채점 결과
   - 시도 횟수

3. **mdl_boundary_interactions**: 상호작용 로그
   - 슬라이더 조작 기록
   - 학습 패턴 분석용

### 샘플 데이터

설치 시 4개의 샘플 문제가 자동으로 생성됩니다:
- 기본 적분 (x²)
- 삼각함수 (sin(x))
- 지수함수 (e^x)
- 고급 다항식

## 🔧 API 엔드포인트

### 1. 문제 가져오기

```
GET /api/get_problem.php?id={problem_id}
```

**응답 예시**:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "기본 적분 문제",
    "description": "함수 f(x) = x²의 적분 구간을 설정하세요.",
    "function": "x²",
    "min_bound": -5.0,
    "max_bound": 5.0,
    "step": 0.1,
    "initial_lower": 0.0,
    "initial_upper": 1.0
  }
}
```

### 2. 답안 제출

```
POST /api/submit_answer.php
Content-Type: application/json

{
  "problem_id": 1,
  "lower_bound": 0.0,
  "upper_bound": 2.0,
  "timestamp": "2025-11-18T10:30:00"
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "정답입니다!",
  "data": {
    "answer_id": 123,
    "is_correct": true,
    "score": 100
  }
}
```

## 🎨 커스터마이징

### 슬라이더 색상 변경

`css/styles.css` 파일에서 CSS 변수 수정:

```css
:root {
    --primary-color: #4CAF50;  /* 슬라이더 색상 */
    --secondary-color: #2196F3; /* 강조 색상 */
}
```

### 슬라이더 동작 변경

`js/boundary-slider.js`에서 `BoundarySlider` 클래스 수정:

```javascript
const slider = new BoundarySlider({
    lowerBound: 0,
    upperBound: 1,
    min: -10,
    max: 10,
    step: 0.1,
    onChange: (bounds) => {
        // 슬라이더 변경 시 실행할 코드
    }
});
```

## 📱 스마트폰 시뮬레이터

우측 하단에 표시되는 가상 스마트폰 화면은:
- 데스크톱 화면(1400px 이상)에서만 표시
- 슬라이더 조작 시 실시간 동기화
- 모바일 환경 미리보기 제공

반응형 디자인으로 실제 스마트폰에서도 정상 작동합니다.

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 출력 시 HTML 이스케이핑
3. **CSRF 방지**: 토큰 검증 (추가 구현 권장)
4. **세션 관리**: Moodle 세션과 통합

## 📈 학습 분석

### 통계 뷰 활용

```sql
-- 학생별 성과 확인
SELECT * FROM mdl_boundary_student_stats
WHERE user_id = 123;

-- 문제별 난이도 분석
SELECT * FROM mdl_boundary_problem_stats
ORDER BY success_rate ASC;
```

### 슬라이더 상호작용 분석

```sql
-- 학생의 시도 패턴 분석
SELECT slider_type, AVG(ABS(new_value - old_value)) as avg_change
FROM mdl_boundary_interactions
WHERE user_id = 123 AND problem_id = 1
GROUP BY slider_type;
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결방법**:
1. `config.php`에서 DB 정보 확인
2. MySQL 서비스 실행 확인: `sudo service mysql status`
3. 방화벽 설정 확인

### 슬라이더가 움직이지 않음

**해결방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. `js/` 디렉토리 파일 권한 확인
3. 브라우저 캐시 삭제

### 스마트폰 화면이 보이지 않음

**해결방법**:
- 화면 너비가 1400px 이상인지 확인
- `css/styles.css`에서 `@media` 쿼리 확인

## 📝 라이선스

MIT License

## 👥 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 📞 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.

---

**개발 환경**: PHP 7.1.9, MySQL 5.7, Moodle 3.7
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
