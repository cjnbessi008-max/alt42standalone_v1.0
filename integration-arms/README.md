# Integration Arms 🤖

**부분적분을 두 로봇 팔이 시각적으로 만들어주는 인터랙티브 학습 앱**

Integration Arms는 KAIST Touch Math Academy에서 개발한 부분적분(Integration by Parts) 교육용 웹 애플리케이션입니다. 두 개의 로봇 기계팔이 부분적분 공식 `∫ u dv = uv - ∫ v du`의 변환 과정을 시각적으로 보여주며, 학생들이 직접 u와 dv를 선택하며 인터랙티브하게 학습할 수 있습니다.

## ✨ 주요 기능

### 🎬 로봇 팔 애니메이션
- **왼쪽 팔**: 원래 적분식 `∫ u dv`를 잡고 당김
- **오른쪽 팔**: 변환된 식 `uv - ∫ v du`를 생성
- 부드러운 inverse kinematics 기반 3관절 로봇 팔 시뮬레이션
- 애니메이션 속도 조절 (0.5x ~ 2.0x)

### 📱 가상 스마트폰 인터페이스
- 우측 하단에 360x640px 가상 스마트폰 화면
- 드래그로 위치 이동 가능
- 최소화/최대화 기능
- 모바일 반응형 디자인

### 🎯 인터랙티브 학습
- 문제에서 u와 dv를 직접 선택
- 실시간 정답/오답 피드백
- 단계별 힌트 시스템
- 난이도별 문제 (Easy/Medium/Hard)

### 📊 학습 진도 추적
- 정답률, 평균 시간, 숙련도 레벨 표시
- 개인별 학습 기록 저장
- Moodle LMS 연동으로 성적 자동 동기화

### 🔗 Moodle 3.7 LMS 연동
- Moodle Web Services API 통합
- SSO (Single Sign-On) 인증
- 문제 자동 가져오기
- 학습 활동 로깅

## 🛠️ 기술 스택

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 통합

### Frontend
- **HTML5/CSS3**: 마크업 및 스타일링
- **JavaScript (ES6+)**: 클라이언트 로직
- **Canvas API**: 로봇 팔 렌더링
- **GSAP 3**: 부드러운 애니메이션
- **KaTeX**: 수식 렌더링

### Libraries
- [KaTeX](https://katex.org/) - LaTeX 수식 렌더링
- [GSAP](https://greensock.com/gsap/) - 애니메이션 라이브러리

## 📦 설치 방법

### 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 이상 (mod_rewrite 활성화)
- Moodle 3.7 (선택사항)

### 1. 리포지토리 클론

```bash
git clone https://github.com/your-org/integration-arms.git
cd integration-arms
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE integration_arms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'integration_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON integration_arms.* TO 'integration_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 및 샘플 데이터 임포트
mysql -u integration_user -p integration_arms < database/schema.sql
mysql -u integration_user -p integration_arms < database/seed.sql
```

### 3. 환경 설정

`.env` 파일 생성 (또는 `src/config/*.php` 직접 수정):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=integration_arms
DB_USER=integration_user
DB_PASS=your_password

# Moodle
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token

# Environment
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

### 4. 로그 디렉토리 생성

```bash
mkdir -p logs
chmod 777 logs
```

### 5. Apache 설정

`/etc/apache2/sites-available/integration-arms.conf`:

```apache
<VirtualHost *:80>
    ServerName integration-arms.local
    DocumentRoot /path/to/integration-arms/public

    <Directory /path/to/integration-arms/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/integration-arms-error.log
    CustomLog ${APACHE_LOG_DIR}/integration-arms-access.log combined
</VirtualHost>
```

```bash
sudo a2ensite integration-arms
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 6. Moodle 연동 설정 (선택사항)

Moodle 관리자 페이지에서:

1. **웹 서비스 활성화**
   - `Site administration > Advanced features`
   - "Enable web services" 체크

2. **토큰 생성**
   - `Site administration > Server > Web services > Manage tokens`
   - Create token for your user

3. **필요한 함수 활성화**
   - `core_webservice_get_site_info`
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`

## 🚀 사용 방법

### 1. 애플리케이션 시작

브라우저에서 `http://integration-arms.local` 접속

### 2. Moodle 로그인 (선택사항)

Moodle 계정으로 SSO 로그인

### 3. 문제 풀이

1. 가상 스마트폰 화면에 문제가 표시됩니다
2. **▶️ 재생** 버튼으로 로봇 팔 애니메이션 시청
3. u와 dv를 선택합니다
4. **제출** 버튼을 클릭합니다
5. 실시간 피드백을 받습니다

### 4. 힌트 사용

막히면 **💡 힌트** 버튼을 클릭하여 도움말을 받습니다

### 5. 진도 확인

하단 진도 바에서 학습 통계를 확인합니다

## 📁 프로젝트 구조

```
integration-arms/
├── public/                 # 공개 디렉토리 (웹 루트)
│   ├── index.php          # 메인 진입점
│   ├── css/               # 스타일시트
│   │   ├── main.css
│   │   ├── smartphone.css
│   │   └── animations.css
│   ├── js/                # JavaScript
│   │   ├── app.js
│   │   ├── robot-arm.js
│   │   ├── animation-engine.js
│   │   ├── math-parser.js
│   │   └── moodle-connector.js
│   └── img/               # 이미지 및 아이콘
├── src/                   # 백엔드 소스
│   ├── config/            # 설정 파일
│   │   ├── database.php
│   │   └── moodle.php
│   ├── api/               # API 엔드포인트
│   │   ├── problem.php
│   │   ├── submit.php
│   │   └── progress.php
│   ├── models/            # 데이터 모델
│   │   ├── Problem.php
│   │   ├── Attempt.php
│   │   └── Progress.php
│   ├── services/          # 서비스 레이어
│   │   ├── MoodleService.php
│   │   └── GradingService.php
│   └── utils/             # 유틸리티
│       ├── Session.php
│       └── Logger.php
├── database/              # 데이터베이스
│   ├── schema.sql
│   └── seed.sql
├── tests/                 # 테스트
├── docs/                  # 문서
├── logs/                  # 로그 파일
└── README.md
```

## 🎓 부분적분 공식

Integration Arms가 시각화하는 부분적분 공식:

```
∫ u dv = uv - ∫ v du
```

### 예제 문제

**Easy**: `∫ x·e^x dx`
- u = x, dv = e^x dx
- du = dx, v = e^x
- 답: x·e^x - ∫ e^x dx = x·e^x - e^x + C

**Medium**: `∫ x·ln(x) dx`
- u = ln(x), dv = x dx
- du = 1/x dx, v = x²/2
- 답: (x²/2)·ln(x) - ∫ x/2 dx = (x²/2)·ln(x) - x²/4 + C

**Hard**: `∫ e^x·cos(x) dx`
- 부분적분 두 번 사용, 순환 관계 이용

## 🔧 개발 가이드

### 새 문제 추가

```php
INSERT INTO integration_problems
(moodle_question_id, problem_latex, correct_u, correct_dv, difficulty, hints)
VALUES
(2001, '\\int x^3 \\cdot \\sin(x) \\, dx', 'x^3', '\\sin(x) dx', 'hard',
 '["다항식을 여러 번 미분하세요", "부분적분을 3번 반복하세요"]');
```

### API 사용

```javascript
// 문제 가져오기
fetch('/src/api/problem.php?random=true&difficulty=medium')
    .then(res => res.json())
    .then(data => console.log(data.problem));

// 답안 제출
fetch('/src/api/submit.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        csrf_token: 'token',
        problem_id: 1,
        selected_u: 'x',
        selected_dv: 'e^x dx'
    })
})
    .then(res => res.json())
    .then(data => console.log(data));
```

### 로봇 팔 커스터마이징

```javascript
// 새 로봇 팔 생성
const arm = new RobotArm(canvas, x, y, 'left');

// 위치 이동
await arm.moveTo(targetX, targetY, duration);

// 물체 잡기/놓기
await arm.grab('수식');
await arm.release();

// 당기기 제스처
await arm.pull(-1);
```

## 🧪 테스트

```bash
# PHP Unit 테스트
./vendor/bin/phpunit tests/

# JavaScript 테스트 (Jest)
npm test
```

## 📊 성공 지표

- ✅ 부분적분 개념 이해도: **80% 이상**
- ✅ 문제 풀이 정확도: **70% 이상**
- ✅ 학습 시간 단축: **40% 이상**
- ✅ NPS (Net Promoter Score): **50 이상**

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 개발팀

- **KAIST Touch Math Academy**
- **Product Manager**: [Name]
- **Lead Developer**: [Name]
- **UX Designer**: [Name]

## 📞 문의

- 이메일: support@touchmath.kaist.ac.kr
- 이슈 트래커: https://github.com/your-org/integration-arms/issues
- 문서: https://docs.integration-arms.com

## 🙏 감사의 말

- KAIST Touch Math Academy
- Moodle Community
- GSAP Animation Library
- KaTeX Math Rendering

---

**Made with ❤️ by KAIST Touch Math Academy**
