# 약한 개념 연결 탐지 시스템

Moodle LMS와 연동하여 학습 개념 간 연결이 약한 지점을 자동으로 발견하는 독립형 웹 애플리케이션

## 📋 개요

이 시스템은 Moodle 3.7 LMS에서 퀴즈 및 학생 응답 데이터를 분석하여 다음을 수행합니다:

- **개념 자동 추출**: 퀴즈 문제에서 수학 개념을 자동으로 추출
- **개념 그래프 생성**: 개념 간의 관계를 그래프로 구성
- **약한 연결 탐지**: 4가지 알고리즘을 사용하여 학습 약점 자동 발견
- **시각화 대시보드**: 발견된 약점을 교사에게 시각적으로 제공

## 🔧 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, Bootstrap
- **Integration**: Moodle 3.7 Web Services (REST API)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   └── config.php              # 설정 파일 (DB, Moodle API)
├── src/
│   ├── Database.php            # DB 연결 관리
│   ├── MoodleConnector.php     # Moodle API 연동
│   ├── ConceptExtractor.php    # 개념 추출 엔진
│   └── WeakLinkDetector.php    # 약한 연결 탐지
├── public/
│   ├── index.php               # 메인 대시보드
│   ├── sync.php                # Moodle 데이터 동기화
│   ├── analyze.php             # 약한 연결 분석
│   └── css/
│       └── style.css           # 스타일시트
├── sql/
│   └── schema.sql              # 데이터베이스 스키마
└── README.md
```

## 🚀 설치 가이드

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (Web Services 활성화 필요)
- cURL PHP 확장

### 2. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 스키마를 적용합니다:

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE weak_link_detector CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'weaklink'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON weak_link_detector.* TO 'weaklink'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE weak_link_detector;
SOURCE /path/to/alt42standalone_v1.0/sql/schema.sql;
```

### 3. 설정 파일 수정

`config/config.php` 파일을 열어 다음 설정을 수정합니다:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'weak_link_detector');
define('DB_USER', 'root');  // 또는 생성한 사용자
define('DB_PASS', '');      // 비밀번호 입력

// Moodle 연동 설정
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token');
```

### 4. Moodle Web Services 설정

Moodle에서 Web Services를 활성화하고 토큰을 생성합니다:

1. **사이트 관리 > 고급 기능** → "Web services 활성화" 체크
2. **사이트 관리 > 서버 > Web services > 외부 서비스** → "moodle_mobile_app" 활성화
3. **사이트 관리 > 서버 > Web services > 토큰 관리** → 새 토큰 생성
4. 생성된 토큰을 `config/config.php`의 `MOODLE_TOKEN`에 입력

필요한 Web Service 함수:
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`
- `mod_quiz_get_attempt_data`
- `core_webservice_get_site_info`

### 5. 웹 서버 설정

#### Apache
```apache
<VirtualHost *:80>
    ServerName weaklink.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name weaklink.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 6. 권한 설정

```bash
# 웹 서버가 접근할 수 있도록 권한 설정
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0
sudo chmod -R 755 /path/to/alt42standalone_v1.0
```

## 📖 사용 방법

### 1. 대시보드 접속

웹 브라우저에서 `http://your-domain/` 또는 `http://localhost/` 접속

### 2. Moodle 데이터 동기화

1. 대시보드에서 "📥 Moodle 데이터 동기화" 클릭
2. (선택) 특정 코스 ID 입력 또는 비워서 모든 코스 동기화
3. "▶️ 동기화 시작" 클릭
4. 퀴즈, 문제, 학생 응답 데이터가 로컬 DB에 저장됨

### 3. 약한 연결 분석

1. 대시보드에서 "🔍 약한 연결 분석 실행" 클릭
2. "▶️ 분석 시작" 클릭
3. 시스템이 4가지 알고리즘으로 약한 연결 탐지:
   - **낮은 정답률**: 두 개념 모두 정답률이 낮은 경우
   - **높은 오답 상관관계**: 한 개념에서 실패한 학생이 다른 개념에서도 실패
   - **선수 개념 미숙**: 선수 개념 미학습으로 다음 개념에서 어려움
   - **개념 간격**: 난이도 차이가 크지만 연결이 약한 경우

### 4. 결과 확인

대시보드에서 발견된 약한 연결을 확인하고:
- 약점 점수 (높을수록 심각)
- 영향받는 학생 수
- 권장사항
- 약점 유형별 통계

## 🔍 탐지 알고리즘

### 1. 낮은 정답률 (Low Accuracy)
```
조건: 두 개념의 정답률이 모두 60% 미만
약점 점수 = 100 - (개념1 정답률 + 개념2 정답률) / 2
```

### 2. 높은 오답 상관관계 (High Error Correlation)
```
조건: 개념1 실패 학생 중 70% 이상이 개념2도 실패
약점 점수 = 상관도 × 100
```

### 3. 선수 개념 미숙 (Prerequisite Failure)
```
조건: 선수 개념 숙달도 < 70% AND 다음 개념 숙달도 < 60%
약점 점수 = 100 - 선수 개념 숙달도
```

### 4. 개념 간격 (Concept Gap)
```
조건: 연결 강도 < 0.4 AND 난이도 차이 > 0.3
약점 점수 = 난이도 차이 × 100 + (0.4 - 연결 강도) × 50
```

## ⚙️ 설정 조정

`config/config.php`에서 다음 임계값을 조정할 수 있습니다:

```php
define('WEAK_LINK_THRESHOLD', 0.4);        // 약한 연결 임계값
define('LOW_ACCURACY_THRESHOLD', 60);      // 낮은 정답률 임계값 (%)
define('MIN_ATTEMPTS_FOR_ANALYSIS', 5);    // 최소 시도 횟수
define('CORRELATION_THRESHOLD', 0.7);      // 오답 상관도 임계값
```

## 🗄️ 데이터베이스 스키마

주요 테이블:
- `concepts`: 추출된 개념
- `concept_relations`: 개념 간 관계
- `quiz_analysis`: 퀴즈 분석 결과
- `weak_links`: 발견된 약한 연결
- `student_performance_patterns`: 학생별 성과 패턴
- `moodle_sync_log`: 동기화 기록

## 🐛 문제 해결

### Moodle 연결 실패
- Moodle URL이 정확한지 확인
- Web Service 토큰이 유효한지 확인
- Moodle에서 Web Services가 활성화되었는지 확인
- 방화벽이 차단하지 않는지 확인

### 데이터베이스 연결 실패
- MySQL 서비스가 실행 중인지 확인
- DB 사용자 이름/비밀번호가 정확한지 확인
- 데이터베이스가 생성되었는지 확인

### 개념이 추출되지 않음
- Moodle 데이터가 동기화되었는지 확인
- 퀴즈 문제에 한글/영문 개념 키워드가 포함되어 있는지 확인
- `src/ConceptExtractor.php`의 키워드 사전을 확장

## 📊 시스템 특징

### 장점
- ✅ 독립형 웹앱으로 설치 간편
- ✅ Moodle과 느슨한 결합 (API 연동)
- ✅ 실시간이 아닌 배치 분석 (서버 부담 감소)
- ✅ 4가지 다각도 분석 알고리즘
- ✅ 시각적 대시보드

### 확장 가능성
- 🔮 그래프 시각화 (D3.js, vis.js)
- 🔮 실시간 알림 시스템
- 🔮 AI 기반 개념 추출 (NLP)
- 🔮 자동 개입 제안 생성
- 🔮 다른 LMS 지원 (Canvas, Blackboard)

## 📝 라이센스

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📞 지원

문의사항이 있으시면 개발팀에 연락하세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
