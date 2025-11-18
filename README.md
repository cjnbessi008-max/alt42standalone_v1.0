# 🌊 Log Flow Animation

로그 계산 과정을 물흐르듯 시각화하는 교육용 웹 애플리케이션

## 📋 프로젝트 개요

**Log Flow**는 Moodle LMS와 연동하여 학생들에게 로그(logarithm) 계산 과정을 직관적이고 아름다운 애니메이션으로 보여주는 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면을 배치하여 모바일 환경을 시뮬레이션하고, 계산의 각 단계를 물이 흐르는 듯한 애니메이션으로 표현합니다.

### 주요 기능

- 🎯 **로그 계산 시각화**: log<sub>b</sub>(x) 계산 과정을 단계별로 시각화
- 🌊 **물흐르듯 애니메이션**: 물방울, 물결, 흐름 효과로 계산 과정 표현
- 📱 **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 보이는 UI
- 🔗 **Moodle LMS 연동**: Moodle 3.7과 웹 서비스를 통해 문제 정보 연동
- 📊 **단계별 설명**: 각 계산 단계마다 자세한 설명 제공
- ⚡ **애니메이션 제어**: 속도 조절, 자동 재생, 단계별 탐색
- 📈 **진행률 표시**: 시각적 진행률 바로 학습 진도 확인

## 🛠️ 기술 스택

### Frontend
- **HTML5**: 구조 및 마크업
- **CSS3**: 스타일링 및 애니메이션
- **JavaScript (ES6+)**: 로직 및 인터랙션
- **SVG**: 벡터 그래픽 애니메이션

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 연동

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html                      # 메인 HTML 파일
├── css/
│   ├── styles.css                 # 메인 스타일시트
│   ├── smartphone.css             # 스마트폰 UI 스타일
│   └── animations.css             # 애니메이션 효과
├── js/
│   ├── logCalculator.js           # 로그 계산 로직
│   ├── logFlowAnimation.js        # 애니메이션 엔진
│   ├── moodleIntegration.js       # Moodle 연동
│   └── main.js                    # 메인 앱 컨트롤러
├── api/
│   └── moodle_connector.php       # Moodle API 연동
├── assets/                         # 이미지 등 리소스
└── README.md                      # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 기본 설치 (데모 모드)

Moodle 없이 데모 모드로 실행:

```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 웹 서버로 실행 (예: Python HTTP 서버)
python -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000
```

### 2. Moodle 연동 설치

#### 2.1 환경 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Moodle 3.7
- Apache 또는 Nginx 웹 서버

#### 2.2 Moodle 설정

1. **Moodle Web Services 활성화**

   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 관리
   - "웹 서비스 활성화" 체크
   ```

2. **외부 서비스 생성**

   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스
   - 서비스 이름: "LogFlow API"
   - 필요한 함수 추가:
     * core_webservice_get_site_info
     * core_question_get_questions
   ```

3. **토큰 생성**

   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
   - 사용자 선택 및 서비스 선택
   - 토큰 생성
   ```

#### 2.3 데이터베이스 설정

```sql
-- 진행상황 테이블
CREATE TABLE mdl_logflow_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    progress_data TEXT,
    timestamp INT NOT NULL,
    UNIQUE KEY unique_user_problem (user_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 답안 테이블
CREATE TABLE mdl_logflow_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    answer DECIMAL(10, 6),
    steps TEXT,
    is_correct TINYINT(1),
    grade INT,
    timestamp INT NOT NULL,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.4 PHP 설정

`api/moodle_connector.php` 파일에서 데이터베이스 연결 정보 수정:

```php
private $db_host = 'localhost';
private $db_name = 'moodle';
private $db_user = 'your_db_user';
private $db_pass = 'your_db_password';
```

### 3. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # PHP 설정
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
</IfModule>
```

#### Nginx

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

## 📖 사용 방법

### 데모 모드

1. 브라우저에서 `index.html` 열기
2. "Moodle 연결" 버튼 클릭하여 데모 모드 활성화
3. 밑(base)과 진수(value) 입력
4. "계산 시작" 버튼 클릭
5. 스마트폰 화면에서 애니메이션 감상

### Moodle 연동 모드

URL 파라미터로 접속:

```
http://your-domain.com/index.html?moodle_url=http://moodle.example.com&ws_token=YOUR_TOKEN&problem_id=log_101
```

파라미터:
- `moodle_url`: Moodle 서버 URL
- `ws_token`: Moodle 웹 서비스 토큰
- `problem_id`: 문제 ID (선택사항)

### 애니메이션 제어

- **속도 조절**: 슬라이더로 0.5x ~ 3x 속도 조절
- **자동 재생**: 체크박스로 자동 재생 활성화/비활성화
- **단계별 설명**: 각 단계의 자세한 설명 표시/숨김
- **초기화**: "초기화" 버튼으로 앱 상태 리셋

### 키보드 단축키

- `Ctrl + Enter`: 계산 시작
- `Ctrl + R`: 초기화

## 🎨 애니메이션 효과

### 1. 물방울 효과 (Water Drop)
계산 시작 시 물방울이 떨어지는 효과

### 2. 흐르는 물 효과 (Flow Water)
계산 과정이 경로를 따라 흐르는 효과

### 3. 물결 효과 (Ripple)
중요한 단계에서 물결이 퍼지는 효과

### 4. 펄스 효과 (Pulse)
현재 값이 깜박이며 강조되는 효과

### 5. 빛나는 효과 (Glow)
계산 완료 시 결과가 빛나는 효과

## 🧮 로그 계산 예시

### 정수 결과

```
log₂(8) = 3

단계:
1. 2¹ = 2
2. 2² = 4
3. 2³ = 8 ✓
```

### 소수 결과

```
log₂(5) ≈ 2.3219

단계:
1. 범위 찾기: 2² < 5 < 2³
2. 선형 보간: 2 + (5-4)/(8-4) = 2.25
3. 정확한 값: ln(5)/ln(2) = 2.3219
```

## 🔧 API 사용 예시

### JavaScript에서 사용

```javascript
// 로그 계산
const calculator = new LogCalculator();
calculator.setParameters(2, 8);
const result = calculator.calculate();

// 애니메이션
const animation = new LogFlowAnimation('svgId');
animation.setSteps(result.steps);
await animation.playAll();

// Moodle 연동
const moodle = new MoodleIntegration();
await moodle.connect(moodleUrl, wsToken);
const problem = await moodle.getProblem('log_101');
```

### PHP API 호출

```php
// 문제 가져오기
POST /api/moodle_connector.php
{
    "action": "get_problem",
    "problem_id": "log_101",
    "session_token": "xxx"
}

// 답안 제출
POST /api/moodle_connector.php
{
    "action": "submit_answer",
    "problem_id": "log_101",
    "answer": 3,
    "steps": "[...]",
    "session_token": "xxx"
}
```

## 🐛 문제 해결

### 애니메이션이 표시되지 않음

1. 브라우저 콘솔에서 JavaScript 오류 확인
2. SVG 요소가 제대로 로드되었는지 확인
3. CSS 애니메이션이 지원되는 브라우저인지 확인

### Moodle 연결 실패

1. Web Services가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. CORS 설정 확인
4. PHP 오류 로그 확인: `/var/log/php_errors.log`

### 데이터베이스 연결 오류

1. MySQL 서버 실행 여부 확인
2. 데이터베이스 접속 정보 확인
3. 테이블이 생성되었는지 확인

## 📝 개발자 도구

브라우저 콘솔에서 사용 가능:

```javascript
// 버전 정보
logFlow.version

// 전체 정보
logFlow.info()

// 각 모듈 접근
logFlow.calculator()
logFlow.animation()
logFlow.moodle()
```

## 🌟 향후 계획

- [ ] 다양한 로그 성질 시각화 (곱셈 법칙, 거듭제곱 법칙 등)
- [ ] 여러 애니메이션 테마 추가
- [ ] 모바일 터치 제스처 지원
- [ ] 다국어 지원 (영어, 중국어 등)
- [ ] 학습 통계 및 분석 대시보드
- [ ] 게임화 요소 추가 (점수, 배지 등)

## 📄 라이선스

MIT License

## 👥 기여

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

## 🙏 감사의 말

- Moodle 커뮤니티
- SVG 애니메이션 튜토리얼 제공자들
- 오픈소스 기여자들

---

**Log Flow** - 수학을 더 아름답게 ✨
