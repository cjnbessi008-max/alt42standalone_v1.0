# Inverse Reflection - 역함수 시각화 모듈

Moodle LMS와 연동되는 수학 교육용 웹 애플리케이션으로, 역함수를 거울 반사처럼 시각화합니다.

## 🎯 주요 기능

- **역함수 시각화**: 원함수 f(x)와 역함수 f⁻¹(x)를 동시에 표시
- **거울 반사 애니메이션**: y=x 선을 기준으로 점들이 반사되는 과정을 애니메이션으로 표현
- **인터랙티브 그래프**: 그래프 위의 점을 클릭하여 반사 확인
- **Moodle 연동**: LMS에서 문제 정보를 받아 동작
- **스마트폰 UI**: 우측 하단 가상 스마트폰 화면에 표시

## 🛠 기술 스택

- **Backend**: PHP 7.1.9, MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **LMS**: Moodle 3.7
- **Math Library**: Math.js

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   └── moodle_integration.php      # Moodle API 연동
├── config/
│   └── database.php                # 데이터베이스 설정
├── database/
│   └── schema.sql                  # MySQL 스키마
├── frontend/
│   ├── index.html                  # 메인 페이지
│   ├── css/
│   │   ├── smartphone.css          # 스마트폰 UI 스타일
│   │   └── visualization.css       # 시각화 스타일
│   └── js/
│       ├── api-client.js           # API 클라이언트
│       ├── math-utils.js           # 수학 유틸리티
│       ├── visualization.js        # 그래프 렌더링
│       └── app.js                  # 메인 애플리케이션
└── README.md
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 2. PHP 설정

`config/database.php` 파일을 열어 데이터베이스 접속 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

PHP 7.1.9가 설치된 웹 서버에 프로젝트를 배포하세요.

```bash
# Apache 예시
sudo cp -r alt42standalone_v1.0 /var/www/html/
sudo chmod -R 755 /var/www/html/alt42standalone_v1.0
```

### 4. Moodle 연동

Moodle 활동에 다음 URL을 iframe으로 삽입하세요:

```html
<iframe src="http://your-server/alt42standalone_v1.0/frontend/index.html?question_id=1&student_id=123"
        width="100%" height="800px"></iframe>
```

**URL 파라미터:**
- `question_id`: Moodle 문제 ID
- `student_id`: 학생 ID

## 📖 사용 방법

### 학생용

1. Moodle에서 역함수 문제에 접속
2. 우측 하단에 표시되는 가상 스마트폰 화면 확인
3. 그래프 위의 점을 클릭하여 반사 확인
4. "점 반사 시연" 버튼으로 데모 보기

### 교사용

1. Moodle에서 새로운 역함수 문제 생성
2. 문제 정보가 자동으로 데이터베이스에 저장됨
3. 학생 진도 및 상호작용 데이터 확인 가능

## 🎨 커스터마이징

### 색상 변경

`visualization_settings` 테이블에서 색상을 변경할 수 있습니다:

```sql
UPDATE visualization_settings
SET color_original = '#FF5722',
    color_inverse = '#00BCD4',
    color_reflection_line = '#8BC34A'
WHERE problem_id = 1;
```

### 애니메이션 속도

```sql
UPDATE visualization_settings
SET animation_speed = 'fast'  -- 'slow', 'medium', 'fast'
WHERE problem_id = 1;
```

## 🔧 API 엔드포인트

### 문제 가져오기
```
GET /backend/moodle_integration.php?action=get_problem&moodle_id=1
```

### 난이도별 문제 목록
```
GET /backend/moodle_integration.php?action=get_problems_by_difficulty&difficulty=medium
```

### 학생 답안 제출
```
POST /backend/moodle_integration.php?action=submit_attempt
Content-Type: application/json

{
  "student_id": 123,
  "problem_id": 1,
  "attempted_inverse": "(x - 3) / 2",
  "is_correct": true,
  "interaction_data": {...}
}
```

### 학생 진도 조회
```
GET /backend/moodle_integration.php?action=get_progress&student_id=123&problem_id=1
```

## 📊 데이터베이스 스키마

### inverse_reflection_problems
- 역함수 문제 정보 저장
- 원함수, 역함수, 정의역, 난이도 등

### student_attempts
- 학생 시도 기록
- 답안, 정답 여부, 소요 시간, 상호작용 로그

### visualization_settings
- 시각화 설정
- 색상, 애니메이션 속도, 표시 옵션

## 🧪 테스트

브라우저에서 직접 열기:

```
http://localhost/alt42standalone_v1.0/frontend/index.html
```

Demo 모드로 실행되며, 샘플 문제(f(x) = 2x + 3)가 표시됩니다.

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 사용자 입력 검증 및 이스케이프
3. **CORS 설정**: 필요한 도메인만 허용하도록 수정
4. **세션 관리**: Moodle 세션 검증 구현 필요

## 📝 라이센스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여자

- Moodle 3.7 Integration
- PHP 7.1.9 Backend
- MySQL 5.7 Database
- HTML5 Canvas Visualization

## 🐛 문제 해결

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 권한 확인
GRANT ALL PRIVILEGES ON moodle.* TO 'your_user'@'localhost';
```

### 그래프가 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Math.js 라이브러리 로드 확인

### Moodle 연동 문제
- URL 파라미터 확인 (question_id, student_id)
- CORS 설정 확인
- Moodle 버전 호환성 확인 (3.7)

## 📞 지원

문의사항이나 버그 리포트는 이슈 트래커에 등록해주세요.
