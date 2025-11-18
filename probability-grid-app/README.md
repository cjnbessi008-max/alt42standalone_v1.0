# Probability Grid - 확률 공간 시각화 웹앱

확률 공간을 색깔 격자로 시각화하고, Moodle LMS와 연동하여 학생들에게 대화형 확률 학습 경험을 제공하는 웹 애플리케이션입니다.

## 🎯 주요 기능

- **확률 격자 시각화**: 확률 공간을 직관적인 색깔 격자로 표시
- **가상 스마트폰 디스플레이**: 우측 하단에 스마트폰 화면 형태로 앱 표시
- **Moodle LTI 연동**: Moodle 3.7과 완벽하게 통합
- **대화형 학습**: 클릭 가능한 격자 셀, 실시간 피드백
- **다국어 지원**: 한국어/영어 인터페이스

## 📋 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3, SVG
- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7+
- **LMS**: Moodle 3.7+ (LTI 1.1 지원)

## 🚀 설치 방법

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 이상 (LMS 연동 시)

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE probability_grid CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'prob_grid_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON probability_grid.* TO 'prob_grid_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
USE probability_grid;
SOURCE /path/to/probability-grid-app/database/schema.sql;
```

### 3. 애플리케이션 설정

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/webserver/htdocs

# 저장소 클론 또는 파일 복사
cp -r probability-grid-app ./

# 환경 변수 설정
cd probability-grid-app
cp .env.example .env

# .env 파일 편집
nano .env
```

`.env` 파일에서 다음 값들을 업데이트하세요:

```env
DB_HOST=localhost
DB_NAME=probability_grid
DB_USER=prob_grid_user
DB_PASS=your_password

LTI_CONSUMER_KEY=moodle_probability_grid
LTI_SHARED_SECRET=your_secure_secret_key

APP_BASE_URL=http://your-domain.com/probability-grid-app
TOOL_URL=http://your-domain.com/probability-grid-app/moodle-plugin/lti_handler.php
```

### 4. 웹 서버 설정

#### Apache

`.htaccess` 파일이 이미 포함되어 있습니다. `mod_rewrite`가 활성화되어 있는지 확인하세요:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

다음 설정을 Nginx 서버 블록에 추가하세요:

```nginx
location /probability-grid-app {
    try_files $uri $uri/ /probability-grid-app/public/index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## 🔧 Moodle LTI 연동 설정

### Moodle에서 External Tool 추가

1. **Moodle 관리자로 로그인**

2. **Site Administration → Plugins → Activity modules → External tool → Manage tools**

3. **"Configure a tool manually" 클릭**

4. **다음 정보 입력:**
   - Tool name: `Probability Grid`
   - Tool URL: `http://your-domain.com/probability-grid-app/moodle-plugin/lti_handler.php`
   - Consumer key: `.env` 파일의 `LTI_CONSUMER_KEY` 값
   - Shared secret: `.env` 파일의 `LTI_SHARED_SECRET` 값
   - Default launch container: `New window`

5. **Privacy 설정:**
   - Share launcher's name with tool: ✓
   - Share launcher's email with tool: ✓
   - Accept grades from the tool: ✓

6. **Custom parameters (선택사항):**
   ```
   custom_question_id=$ResourceLink.id
   ```

7. **Save changes**

### 코스에 활동 추가

1. **코스 편집 모드 활성화**
2. **"Add an activity or resource" 클릭**
3. **"External tool" 선택**
4. **위에서 설정한 "Probability Grid" 도구 선택**
5. **활동 이름 및 설명 입력**
6. **Save and display**

## 📱 사용 방법

### 독립 실행형 (Standalone)

브라우저에서 직접 접속:

```
http://your-domain.com/probability-grid-app/public/index.html
```

### Moodle LTI를 통한 실행

1. Moodle 코스에서 Probability Grid 활동 클릭
2. 앱이 새 창 또는 우측 하단 가상 스마트폰에서 실행됨
3. 문제 설명 읽기
4. 격자 셀 클릭하여 확률 영역 선택
5. 답 입력 및 제출
6. 실시간 피드백 확인

## 📊 문제 추가하기

MySQL 데이터베이스에 직접 문제를 추가할 수 있습니다:

```sql
INSERT INTO problems (
    moodle_question_id,
    moodle_course_id,
    title,
    description,
    grid_width,
    grid_height,
    total_cells,
    probability_data,
    color_scheme,
    correct_answer
) VALUES (
    3,  -- Moodle 문제 ID
    101,  -- Moodle 코스 ID
    '카드 뽑기',
    '52장의 카드에서 하트를 뽑을 확률을 구하세요.',
    4,  -- 격자 너비
    13,  -- 격자 높이
    52,  -- 총 셀 수
    '{
        "events": [
            {
                "name": "하트",
                "cells": [0,1,2,3,4,5,6,7,8,9,10,11,12],
                "probability": 0.25,
                "color": "#FF0000"
            },
            {
                "name": "다이아몬드",
                "cells": [13,14,15,16,17,18,19,20,21,22,23,24,25],
                "probability": 0.25,
                "color": "#FF6B6B"
            },
            {
                "name": "클로버",
                "cells": [26,27,28,29,30,31,32,33,34,35,36,37,38],
                "probability": 0.25,
                "color": "#00AA00"
            },
            {
                "name": "스페이드",
                "cells": [39,40,41,42,43,44,45,46,47,48,49,50,51],
                "probability": 0.25,
                "color": "#000000"
            }
        ]
    }',
    '{"background": "#FFFFFF", "border": "#333333", "text": "#000000"}',
    '0.25'
);
```

## 🏗️ 프로젝트 구조

```
probability-grid-app/
├── public/                      # 프론트엔드 파일
│   ├── index.html              # 메인 HTML
│   ├── app.js                  # 메인 앱 로직
│   └── styles.css              # 스타일시트
├── src/
│   ├── components/             # JavaScript 컴포넌트
│   │   ├── ProbabilityGrid.js  # 격자 시각화 컴포넌트
│   │   └── SmartphoneDisplay.js # 스마트폰 디스플레이 컴포넌트
│   ├── api/                    # API 관련 파일
│   │   ├── api.php             # REST API 엔드포인트
│   │   └── client.js           # API 클라이언트
│   └── utils/                  # 유틸리티 함수
├── moodle-plugin/              # Moodle LTI 플러그인
│   ├── config.php              # 설정 파일
│   ├── lti_handler.php         # LTI 요청 핸들러
│   └── lti_validator.php       # OAuth 서명 검증
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── .env.example                # 환경 변수 예제
└── README.md                   # 이 파일
```

## 🧪 테스트

### 로컬 테스트 (LTI 없이)

```bash
# 웹 서버 시작 (PHP 내장 서버 사용)
cd probability-grid-app/public
php -S localhost:8000

# 브라우저에서 열기
open http://localhost:8000/index.html?problem=1
```

### LTI 통합 테스트

1. [IMS LTI Tool Consumer Simulator](https://lti.tools/saltire/tc) 사용
2. 또는 로컬 Moodle 인스턴스 설정

## 🔒 보안 고려사항

1. **환경 변수**: `.env` 파일을 버전 관리 시스템에 커밋하지 마세요
2. **LTI Secret**: 강력한 `LTI_SHARED_SECRET` 사용
3. **Database**: 최소 권한 원칙 적용
4. **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용
5. **Input Validation**: 모든 사용자 입력 검증

## 🐛 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log
```

### LTI 서명 오류

- `LTI_CONSUMER_KEY`와 `LTI_SHARED_SECRET`이 Moodle 설정과 일치하는지 확인
- 시스템 시간이 올바른지 확인 (OAuth는 타임스탬프 기반)

### CORS 오류

`.env` 파일의 `CORS_ORIGINS`에 Moodle 도메인이 포함되어 있는지 확인:

```env
CORS_ORIGINS=http://localhost,http://moodle.example.com
```

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 👥 기여

기여는 언제나 환영합니다! 이슈를 열거나 풀 리퀘스트를 제출해주세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 열어주세요.

---

**개발**: AI Education System Pipeline Project
**버전**: 1.0.0
**최종 업데이트**: 2025
