# Reflection Pair: 지수-로그 거울 반사 시스템

Moodle LMS와 연동하여 지수 함수와 로그 함수의 역함수 관계를 시각적으로 보여주는 교육용 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 실시간으로 두 함수의 거울 반사 관계를 표시합니다.

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 🎯 주요 기능

### 1. 지수-로그 함수 시각화
- 지수 함수 y = b^x 표시
- 로그 함수 y = log_b(x) 표시
- y = x 반사선 표시
- 다양한 밑(base) 지원: e, 2, 10 등

### 2. 가상 스마트폰 디스플레이
- 화면 우측 하단에 고정 배치
- 반응형 디자인 (모바일 대응)
- 실시간 그래프 렌더링

### 3. 대화형 조작
- 드래그로 그래프 이동
- 마우스 휠/터치로 확대/축소
- 컨트롤 버튼으로 뷰 조정
- 반사선 토글 기능

### 4. Moodle LMS 연동
- 코스 및 사용자 정보 연동
- 문제 데이터 자동 로드
- 학습 진도 추적
- 상호작용 데이터 기록

## 📁 프로젝트 구조

```
reflection_pair/
├── api/
│   └── problems.php          # REST API 엔드포인트
├── config/
│   ├── database.php          # 데이터베이스 연결 클래스
│   └── db_config.ini.example # 설정 파일 예제
├── database/
│   └── schema.sql            # MySQL 데이터베이스 스키마
├── assets/
│   ├── css/
│   │   └── smartphone.css    # 가상 스마트폰 스타일
│   └── js/
│       ├── reflection-visualizer.js  # 시각화 엔진
│       └── moodle-integration.js     # Moodle 연동
├── views/
│   └── index.html            # 메인 화면
└── README.md                 # 본 문서
```

## 🚀 설치 방법

### 1. 파일 배포
```bash
# Moodle 디렉토리에 복사
cp -r reflection_pair /var/www/html/moodle/local/

# 또는 독립 실행
cp -r reflection_pair /var/www/html/
```

### 2. 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE moodle_reflection_pair CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle_reflection_pair.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
mysql -u moodle_user -p moodle_reflection_pair < reflection_pair/database/schema.sql
```

### 3. 설정 파일 생성
```bash
cd reflection_pair/config
cp db_config.ini.example db_config.ini

# db_config.ini 편집
nano db_config.ini
```

**db_config.ini 내용:**
```ini
[database]
host = localhost
db_name = moodle_reflection_pair
username = moodle_user
password = your_actual_password
```

### 4. 권한 설정
```bash
# PHP 파일 실행 권한
chmod 755 reflection_pair/api/*.php
chmod 644 reflection_pair/config/db_config.ini

# 보안: 외부 접근 차단
chmod 600 reflection_pair/config/db_config.ini
```

## 🔧 Moodle 통합

### 방법 1: Activity Module (권장)
```php
// Moodle 활동 모듈로 등록
// moodle/mod/reflectionpair/ 에 배치

// version.php
$plugin->component = 'mod_reflectionpair';
$plugin->version = 2024011800;
$plugin->requires = 2017111300; // Moodle 3.7

// lib.php에서 activity 정의
```

### 방법 2: Standalone Integration
```html
<!-- Moodle 페이지에 직접 삽입 -->
<iframe src="/local/reflection_pair/views/index.html?course_id=<?= $COURSE->id ?>&user_id=<?= $USER->id ?>"
        width="100%" height="600px" frameborder="0"></iframe>
```

### 방법 3: Block Plugin
```php
// Moodle 블록으로 추가
// blocks/reflectionpair/ 에 배치
class block_reflectionpair extends block_base {
    public function get_content() {
        // 스마트폰 위젯 렌더링
    }
}
```

## 📊 데이터베이스 스키마

### rp_problems 테이블
문제 정보 저장
```sql
- id: 고유 ID
- moodle_course_id: 코스 ID
- moodle_user_id: 사용자 ID
- problem_type: 문제 유형 (exponential, logarithmic, both)
- difficulty_level: 난이도 (1-5)
- base_number: 밑 (e, 2, 10 등)
- x_range_min/max: X축 범위
- show_reflection_line: 반사선 표시 여부
```

### rp_interactions 테이블
사용자 상호작용 추적
```sql
- id: 고유 ID
- problem_id: 문제 ID (FK)
- moodle_user_id: 사용자 ID
- interaction_type: 상호작용 유형 (view, zoom, toggle, etc)
- interaction_data: JSON 형식 추가 데이터
- timestamp: 시간
```

### rp_progress 테이블
학습 진도 관리
```sql
- moodle_user_id: 사용자 ID
- moodle_course_id: 코스 ID
- problems_completed: 완료한 문제 수
- total_time_seconds: 총 학습 시간
- mastery_score: 숙련도 점수 (0-100)
```

## 🎮 사용 방법

### 기본 사용
1. 웹 브라우저에서 `index.html` 열기
2. 우측 하단 스마트폰 화면 확인
3. 그래프를 드래그하여 이동
4. 마우스 휠로 확대/축소

### API 사용

#### 문제 조회
```javascript
// GET /api/problems.php?id=1
fetch('/reflection_pair/api/problems.php?id=1')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### 사용자 문제 목록
```javascript
// GET /api/problems.php?course_id=1&user_id=1
fetch('/reflection_pair/api/problems.php?course_id=1&user_id=1')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### 문제 생성
```javascript
// POST /api/problems.php
fetch('/reflection_pair/api/problems.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    moodle_course_id: 1,
    moodle_user_id: 1,
    problem_type: 'both',
    base_number: 2.71828,
    difficulty_level: 2
  })
});
```

#### 상호작용 기록
```javascript
// POST /api/problems.php
fetch('/reflection_pair/api/problems.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    action: 'record_interaction',
    problem_id: 1,
    moodle_user_id: 1,
    interaction_type: 'zoom',
    interaction_data: {action: 'in'}
  })
});
```

## 🎨 커스터마이징

### 색상 변경
`assets/css/smartphone.css` 파일의 CSS 변수 수정:
```css
:root {
    --reflection-color-exp: #ff6b6b;    /* 지수 함수 색상 */
    --reflection-color-log: #4ecdc4;    /* 로그 함수 색상 */
    --reflection-line: #ffd93d;         /* 반사선 색상 */
}
```

### 스마트폰 크기 조정
```css
:root {
    --smartphone-scale: 0.6;  /* 0.3 ~ 1.0 */
}
```

### 기본 밑(base) 변경
`assets/js/reflection-visualizer.js`:
```javascript
baseNumber: Math.E,  // e (자연로그)
// baseNumber: 2,    // 이진 로그
// baseNumber: 10,   // 상용 로그
```

## 🔒 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 입력 데이터 검증 및 이스케이프
3. **CSRF 방지**: Moodle 세션 토큰 사용 권장
4. **설정 파일 보호**: `db_config.ini` 외부 접근 차단
5. **API 인증**: Moodle 세션 검증 추가 권장

```php
// API에 인증 추가 예시
require_once('../../config.php'); // Moodle config
require_login();
```

## 📈 성능 최적화

1. **데이터베이스 인덱스**: 스키마에 이미 적용됨
2. **캔버스 렌더링**: requestAnimationFrame 사용
3. **이벤트 디바운싱**: 과도한 API 호출 방지
4. **자동 새로고침**: 30초 간격 (조정 가능)

## 🐛 문제 해결

### 데이터베이스 연결 실패
```bash
# PHP PDO MySQL 확장 확인
php -m | grep pdo_mysql

# 없으면 설치
sudo apt-get install php7.1-mysql
sudo systemctl restart apache2
```

### 스마트폰 화면이 보이지 않음
- CSS 파일 경로 확인
- 브라우저 콘솔에서 에러 확인
- z-index 충돌 확인

### API 호출 실패
- `Access-Control-Allow-Origin` 헤더 확인
- PHP 에러 로그 확인: `/var/log/apache2/error.log`
- 데이터베이스 권한 확인

### 그래프가 그려지지 않음
- JavaScript 콘솔 에러 확인
- Canvas API 지원 브라우저 확인
- 문제 데이터 로드 확인

## 📚 교육적 활용

### 학습 시나리오

1. **기본 개념 이해**
   - e^x와 ln(x)의 반사 관계 관찰
   - 점 (a, b)와 (b, a)의 대응 확인

2. **다양한 밑 비교**
   - base=2, 10, e 비교
   - 밑이 클수록 가파른 증가 관찰

3. **정의역과 치역**
   - 지수: 모든 실수 → 양수
   - 로그: 양수 → 모든 실수

4. **역함수 개념**
   - f(f⁻¹(x)) = x 확인
   - 그래프의 대칭성 이해

## 🔄 업데이트 이력

### Version 1.0 (2024-01-18)
- 초기 릴리스
- 기본 지수/로그 시각화
- Moodle 3.7 연동
- MySQL 5.7 지원
- 가상 스마트폰 UI

## 📝 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능

## 👥 기여

이슈 및 개선 제안은 GitHub Issues를 통해 제출해주세요.

## 📞 지원

- 기술 지원: support@example.com
- 문서: https://docs.example.com/reflection-pair
- Moodle 통합: https://moodle.org/plugins/

---

**Made with ❤️ for Mathematics Education**
