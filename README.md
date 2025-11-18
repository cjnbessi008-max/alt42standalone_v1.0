# 🔥 Dot Product Heat Visualization

벡터의 내적(Dot Product)을 색 온도로 시각화하는 교육용 웹 애플리케이션입니다. Moodle LMS와 연동하여 수학 학습을 지원합니다.

## 📱 주요 기능

- **내적값 계산 및 시각화**: 두 벡터의 내적을 실시간으로 계산하고 따뜻한/차가운 색 온도로 표현
- **스마트폰 UI**: 우측 하단에 배치된 가상 스마트폰 화면으로 모바일 경험 제공
- **Moodle LMS 연동**: Moodle 3.7과 통합하여 문제 정보를 받아서 동작
- **학습 추적**: 학생의 시도 기록과 정답률을 데이터베이스에 저장
- **실시간 피드백**: 정답/오답 즉시 확인 및 축하 애니메이션

## 🎨 시각화 설명

내적값에 따른 색 온도:
- **음수 (negative)**: ❄️ 차가운 파란색 - 벡터가 반대 방향
- **0 (zero)**: 🌡️ 중립 흰색 - 벡터가 수직
- **양수 (positive)**: 🔥 따뜻한 빨간색 - 벡터가 같은 방향

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7 (LMS 연동)

### Frontend
- **HTML5 Canvas**: 벡터 시각화
- **CSS3**: 스마트폰 UI 디자인
- **Vanilla JavaScript**: 순수 자바스크립트 (프레임워크 없음)

## 📦 설치 방법

### 1. 사전 요구사항

```bash
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)
```

### 2. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 3. 데이터베이스 설정

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 4. 설정 파일 수정

`config.php` 파일을 열어서 데이터베이스 및 Moodle 정보를 입력하세요:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'dot_product_heat');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token');
```

### 5. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName dotproduct.local
    DocumentRoot /path/to/alt42standalone_v1.0

    <Directory /path/to/alt42standalone_v1.0>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name dotproduct.local;
    root /path/to/alt42standalone_v1.0;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 6. 권한 설정

```bash
chmod -R 755 /path/to/alt42standalone_v1.0
chown -R www-data:www-data /path/to/alt42standalone_v1.0
```

### 7. 접속 테스트

브라우저에서 다음 URL로 접속:

```
http://dotproduct.local/index.php?user_id=1&problem_id=1&user_name=TestStudent
```

## 🎯 사용 방법

### 기본 사용법

1. **문제 확인**: 화면에 표시된 두 벡터를 확인합니다
2. **내적 계산**: 내적값을 계산합니다 (공식: v₁·v₂ = x₁×x₂ + y₁×y₂)
3. **답안 입력**: 계산한 값을 입력 필드에 입력합니다
4. **제출**: "제출하기" 버튼을 클릭합니다
5. **결과 확인**: 색 온도 시각화와 함께 정답/오답 피드백을 확인합니다

### URL 파라미터

- `user_id`: 사용자 ID (필수)
- `problem_id`: 문제 ID (필수, 기본값: 1)
- `user_name`: 사용자 이름 (선택사항, 기본값: "Student")

예시:
```
index.php?user_id=123&problem_id=2&user_name=김철수
```

## 🔌 Moodle 연동

### Moodle Web Service 설정

1. **Web Service 활성화**
   - 사이트 관리 → 고급 기능 → "웹 서비스 활성화" 체크

2. **Web Service Token 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리
   - 새 토큰 생성 후 `config.php`에 입력

3. **필요한 함수 권한 부여**
   ```
   - core_course_get_contents
   - core_user_get_users_by_field
   - core_grades_update_grades
   ```

### LTI 통합 (선택사항)

Moodle 과정에 외부 도구로 추가:

1. 과정 → 활동 추가 → 외부 도구
2. 도구 URL: `http://dotproduct.local/index.php`
3. 사용자 정보 전송 설정

## 📊 데이터베이스 스키마

### 주요 테이블

#### `problems`
문제 정보 저장 (벡터 좌표, 정답 등)

#### `student_attempts`
학생의 답안 시도 기록

#### `heat_visualizations`
시각화 히스토리 (색 온도, 내적값 등)

#### `user_sessions`
사용자 세션 추적

자세한 스키마는 `database/schema.sql` 참고

## 🎨 커스터마이징

### 색 온도 범위 변경

`config.php`:
```php
define('COLD_COLOR', '#0000FF');    // 차가운 색 (파란색)
define('NEUTRAL_COLOR', '#FFFFFF'); // 중립 색 (흰색)
define('WARM_COLOR', '#FF0000');    // 따뜻한 색 (빨간색)
```

### UI 스타일 변경

`css/style.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... 기타 CSS 변수 수정 */
}
```

## 🧪 테스트

### API 엔드포인트 테스트

#### 문제 가져오기
```bash
curl "http://dotproduct.local/api/get_problem.php?id=1&user_id=1"
```

#### 답안 제출
```bash
curl -X POST http://dotproduct.local/api/submit_answer.php \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"user_id":1,"answer":11,"time_taken":30}'
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── index.php                   # 메인 진입점
├── config.php                  # 설정 파일
├── README.md                   # 이 파일
│
├── api/                        # API 엔드포인트
│   ├── get_problem.php         # 문제 조회 API
│   └── submit_answer.php       # 답안 제출 API
│
├── includes/                   # PHP 라이브러리
│   ├── db.php                  # 데이터베이스 클래스
│   └── moodle_api.php          # Moodle API 클라이언트
│
├── css/                        # 스타일시트
│   └── style.css               # 메인 스타일
│
├── js/                         # 자바스크립트
│   ├── app.js                  # 메인 앱 로직
│   └── dot_product_heat.js     # 시각화 엔진
│
├── database/                   # 데이터베이스
│   └── schema.sql              # MySQL 스키마
│
└── tasks/                      # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 🐛 문제 해결

### 데이터베이스 연결 실패
```
- config.php의 DB 설정 확인
- MySQL 서비스 실행 확인: service mysql status
- 사용자 권한 확인
```

### API 호출 실패
```
- Apache/Nginx 재시작
- PHP 에러 로그 확인: tail -f /var/log/apache2/error.log
- config.php에서 DEBUG_MODE를 true로 설정
```

### Moodle 연동 실패
```
- Moodle 웹 서비스 활성화 확인
- 토큰 유효성 확인
- CORS 설정 확인
```

## 🔒 보안 고려사항

- SQL Injection 방지: PDO prepared statements 사용
- XSS 방지: htmlspecialchars() 사용
- 세션 관리: 안전한 세션 ID 생성
- API 인증: Moodle 토큰 기반 인증

## 📝 라이선스

MIT License

## 👥 기여자

KAIST Touch Math Academy

## 📞 지원

문의사항이 있으시면 이슈를 등록해주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
