# Next Term Vision - AI 추천 기반 독립형 웹앱 🎯

수열 학습을 위한 지능형 추천 시스템을 갖춘 독립형 교육 웹 애플리케이션

## 🌟 주요 기능

### 🤖 AI 추천 엔진
- **다중 알고리즘 기반 문제 추천**
  - 난이도 매칭 (30%): Zone of Proximal Development 적용
  - 약점 보완 (25%): 덜 익힌 영역 우선 학습
  - 다양성 (15%): 균형 잡힌 학습 경험
  - 협업 필터링 (15%): 유사 학생 분석
  - 최근 성과 (10%): 실시간 난이도 조정
  - 탐색 (5%): 새로운 시도 장려

### 📊 학습 분석
- **실시간 통계 대시보드**
  - 현재 레벨 및 경험치 추적
  - 정답률 및 평균 소요 시간
  - 유형별 숙련도 시각화
  - 학습 기록 및 진행 상황

### 🎨 인터랙티브 UI
- **스마트폰 시뮬레이터**: 실제 모바일 앱 경험
- **4가지 애니메이션**: Slide, Fade, Bounce, Grow
- **즉각적인 피드백**: 정답/오답 시각화
- **추천 이유 표시**: AI 의사결정 투명성

### 👥 사용자 관리
- 회원가입 및 로그인 시스템
- 개인별 학습 프로필 관리
- 세션 기반 인증
- 비밀번호 암호화 (bcrypt)

## 📁 프로젝트 구조

```
standalone/
├── backend/
│   ├── api/
│   │   ├── auth_api.php          # 인증 API
│   │   ├── recommend_api.php     # 추천 API
│   │   └── problem_api.php       # 문제 API
│   ├── auth/
│   │   └── auth.php              # 인증 클래스
│   ├── recommendation/
│   │   └── RecommendationEngine.php  # 추천 엔진
│   └── config.php                # 설정 파일
├── database/
│   └── schema_standalone.sql     # 데이터베이스 스키마
└── frontend/
    ├── index.html                # 메인 페이지
    ├── styles/
    │   └── main.css              # 스타일시트
    └── scripts/
        ├── api.js                # API 통신
        ├── auth.js               # 인증 로직
        ├── app.js                # 앱 로직
        └── animation.js          # 애니메이션
```

## 🚀 설치 및 실행

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE nextterm_standalone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 실행
mysql -u root -p nextterm_standalone < database/schema_standalone.sql
```

### 2. 백엔드 설정

`backend/config.php` 파일에서 데이터베이스 연결 정보 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'nextterm_standalone');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName nextterm-standalone.local
    DocumentRoot /path/to/standalone/frontend

    <Directory /path/to/standalone/frontend>
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /path/to/standalone/backend
    <Directory /path/to/standalone/backend>
        Require all granted
    </Directory>
</VirtualHost>
```

#### PHP 내장 서버 (개발용)

```bash
cd frontend
php -S localhost:8000
```

### 4. 접속 및 테스트

1. 브라우저에서 `http://localhost:8000` 접속
2. **데모 계정으로 로그인**:
   - 사용자명: `student1`
   - 비밀번호: `student123`
3. 또는 새로운 계정 회원가입

## 💡 사용 방법

### 학습 시작

1. **로그인** 후 메인 대시보드 확인
2. **AI 추천 문제** 버튼 클릭
3. AI가 당신의 수준에 맞는 최적의 문제 제공
4. 수열 패턴을 분석하고 **다음 항 입력**
5. 즉각적인 피드백 수신

### 약점 보완

1. **약점 보완 문제** 버튼 클릭
2. 가장 덜 익힌 유형의 문제 집중 학습
3. 숙련도가 올라가면 다른 유형 추천

### 통계 확인

- 좌측 사이드바에서 실시간 통계 확인
- 유형별 숙련도 그래프 확인
- 경험치 및 레벨 확인

## 🧠 추천 알고리즘 상세

### 1. 난이도 매칭 (30%)

**Zone of Proximal Development** 원리 적용:
- 현재 레벨과 동일: 0.9점
- 현재 레벨 ±1: 1.0점 (최적)
- 현재 레벨 ±2: 0.7점
- 그 이상: 0.1점

### 2. 숙련도 갭 (25%)

덜 익힌 영역 우선:
```
점수 = 1.0 - 현재_숙련도
```

### 3. 다양성 (15%)

최근 푼 문제 유형 회피:
- 최근에 많이 푼 유형: 0.2점
- 안 푼 유형: 0.8점

### 4. 협업 필터링 (15%)

유사 학생 분석:
- 비슷한 레벨의 학생 찾기
- 그들이 푼 문제 중 성공률 70% 문제 추천

### 5. 최근 성과 (10%)

적응형 난이도:
- 최근 정답률 > 80%: 더 어려운 문제
- 최근 정답률 < 50%: 더 쉬운 문제

### 6. 탐색 (5%)

랜덤성 부여로 새로운 학습 경험 제공

## 📊 데이터베이스 구조

### 주요 테이블

- **users**: 사용자 정보 (인증, 프로필)
- **problems**: 문제 정보 (메타데이터, 개념 태그)
- **responses**: 학생 응답 기록
- **user_progress**: 학습 진행 상황 (숙련도, 레벨, XP)
- **recommendation_logs**: 추천 로그 (알고리즘 개선용)
- **concept_mastery**: 개념별 숙련도
- **similar_problems**: 문제간 유사도

### 샘플 데이터

- 관리자/교사 계정 2개
- 테스트 학생 계정 3개
- 16개 샘플 문제 (4가지 유형)

## 🔒 보안

- **비밀번호**: bcrypt 해싱
- **SQL Injection**: PDO Prepared Statements
- **XSS**: 입력값 sanitize
- **세션**: HttpOnly, SameSite 쿠키
- **CORS**: 설정 가능한 출처 제한

## 🎯 API 엔드포인트

### 인증 API

```
POST /api/auth_api.php?action=register
POST /api/auth_api.php?action=login
GET  /api/auth_api.php?action=logout
GET  /api/auth_api.php?action=me
POST /api/auth_api.php?action=change-password
```

### 추천 API

```
GET /api/recommend_api.php?action=get&count=5
GET /api/recommend_api.php?action=weakness&count=5
GET /api/recommend_api.php?action=path&goal=10&sessions=10
```

### 문제 API

```
POST /api/problem_api.php?action=submit
GET  /api/problem_api.php?action=stats
GET  /api/problem_api.php?action=history&page=1&limit=20
```

## 🛠️ 기술 스택

### 백엔드
- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **PDO**: 데이터베이스 추상화
- **bcrypt**: 비밀번호 해싱

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 그리드, 플렉스박스, 애니메이션
- **JavaScript**: ES6+, Vanilla JS (프레임워크 없음)
- **Fetch API**: AJAX 통신

## 📈 추천 시스템 학습

시스템은 다음 데이터를 활용하여 지속적으로 개선됩니다:

1. **추천 로그**: 추천한 문제와 실제 성과
2. **사용자 피드백**: 문제 난이도에 대한 평가
3. **학습 패턴**: 시간대별, 유형별 성과 분석
4. **협업 데이터**: 유사 학생 그룹의 학습 경로

## 🔄 레벨 시스템

### 자동 레벨 조정

- **레벨업**: 정답률 ≥ 80%, 최소 5문제
- **레벨다운**: 정답률 < 40%, 최소 5문제
- **레벨 범위**: 1 (쉬움) ~ 10 (고급)

### 경험치 (XP)

- 정답: +10 XP
- 오답: +3 XP (시도에 대한 보상)

## 🎓 학습 효과

Next Term Vision은 다음을 달성합니다:

1. **개인화 학습**: 각 학생에게 최적화된 문제
2. **적응형 난이도**: 실시간 수준 조정
3. **약점 보완**: 덜 익힌 영역 집중 학습
4. **동기 부여**: 레벨업, XP 시스템
5. **데이터 기반**: 학습 분석 및 개선

## 🧪 개발 모드

### 디버깅

`backend/config.php`에서:

```php
define('APP_ENV', 'development');
```

- 에러 메시지 표시
- 자세한 로그
- API 응답에 디버그 정보 포함

### 프로덕션 모드

```php
define('APP_ENV', 'production');
```

- 에러 숨김
- 최소한의 로그
- 보안 강화

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여자

- **AI Education System Team**
- **KAIST Touch Math Academy**

## 🆘 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 권한 확인
mysql -u root -p
SHOW GRANTS FOR 'your_user'@'localhost';
```

### API 호출 실패

1. 브라우저 개발자 도구 (F12) > Network 탭 확인
2. PHP 에러 로그 확인:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

### 세션 문제

```bash
# PHP 세션 디렉토리 권한 확인
ls -la /var/lib/php/sessions
```

## 📞 지원

문제 발생 시 GitHub 이슈 등록

---

**Made with ❤️ and 🤖 AI** | Next Term Vision v2.0.0 (Standalone)
