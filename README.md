# 형상 변환기 (Shape Transformer)

KAIST Touch Math Academy의 교육용 웹 애플리케이션입니다. 학생들이 도형을 터치하면 부드럽게 변형되며 수학적 성질을 배울 수 있습니다.

## 🎯 주요 기능

- **인터랙티브 도형 학습**: 터치와 애니메이션을 통한 직관적인 학습
- **다양한 변형 효과**: 회전, 크기 변경, 이동, 형태 변환, 기울이기, 반사
- **실시간 성질 표시**: 도형의 수학적 성질을 즉시 확인
- **Moodle LMS 연동**: 학습 진도를 Moodle에 자동 동기화
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면 표시

## 🛠 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5 Canvas**: 도형 렌더링
- **Vanilla JavaScript**: ES6+
- **CSS3**: 애니메이션 및 반응형 디자인

## 📋 요구사항

- PHP >= 7.1.9
- MySQL >= 5.7
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정 (데이터베이스 및 Moodle 설정)
nano .env
```

### 3. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName shape-transformer.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    # API 프록시 설정
    Alias /api /path/to/alt42standalone_v1.0/api
    <Directory /path/to/alt42standalone_v1.0/api>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name shape-transformer.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /path/to/alt42standalone_v1.0/api;
        try_files $uri $uri/ =404;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 4. 실행

```bash
# 웹 서버 재시작
sudo service apache2 restart
# 또는
sudo service nginx restart

# 브라우저에서 접속
http://localhost/alt42standalone_v1.0/public/
```

## 📱 Moodle 연동

### Moodle 웹 서비스 활성화

1. Moodle 관리자 로그인
2. `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스` 로 이동
3. 새 서비스 생성: "Shape Transformer"
4. 필요한 함수 추가:
   - `core_user_get_users_by_field`
   - `core_grades_update_grades`
   - `gradereport_user_get_grades_table`

### 토큰 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리`
2. 새 토큰 생성
3. `.env` 파일의 `MOODLE_TOKEN`에 토큰 입력

### Moodle 활동 추가

Shape Transformer를 Moodle 활동으로 추가하려면:

1. 과정 편집 모드 활성화
2. "활동 또는 리소스 추가" 클릭
3. "외부 도구(External Tool)" 선택
4. URL: `http://your-domain.com/public/index.html?moodle_user_id={user_id}&moodle_course_id={course_id}`

## 🎨 도형 종류

- 원 (Circle)
- 정사각형 (Square)
- 정삼각형 (Triangle)
- 직사각형 (Rectangle)
- 오각형 (Pentagon)
- 육각형 (Hexagon)

## 🔄 변형 효과

- **회전 (Rotate)**: 360도 회전 애니메이션
- **크기 변경 (Scale)**: 확대/축소 효과
- **이동 (Translate)**: 랜덤 위치로 이동
- **형태 변환 (Morph)**: 색상 변경 애니메이션
- **기울이기 (Skew)**: 좌우 기울임 효과
- **반사 (Reflect)**: 좌우 반전 효과

## 📊 API 엔드포인트

### Shapes API
- `GET /api/shapes.php` - 모든 도형 조회
- `GET /api/shapes.php?id={id}` - 특정 도형 조회
- `POST /api/shapes.php` - 도형 생성 (관리자)

### Transformations API
- `GET /api/transformations.php` - 모든 변형 조회

### Interactions API
- `POST /api/interactions.php` - 인터랙션 기록
- `GET /api/interactions.php?user_id={id}` - 사용자 인터랙션 조회

### Sessions API
- `POST /api/sessions.php` - 세션 생성
- `GET /api/sessions.php?session_id={id}` - 세션 조회
- `PUT /api/sessions.php` - 세션 업데이트

### Moodle API
- `POST /api/moodle.php` - Moodle 인증 및 동기화

## 🧪 개발 모드

디버그 모드를 활성화하려면 `public/js/config.js`에서:

```javascript
const CONFIG = {
    DEBUG: true,
    // ...
};
```

## 📈 학습 분석

앱은 다음 데이터를 추적합니다:

- 도형별 터치 횟수
- 변형 효과 사용 빈도
- 학습 시간
- 성질 탐색 패턴
- Moodle 성적 동기화

## 🎓 교육적 목표

- 도형의 기본 성질 이해
- 기하학적 변환 개념 학습
- 수학 공식의 시각적 이해
- 인터랙티브 학습을 통한 참여도 향상

## 🤝 기여

KAIST Touch Math Academy 프로젝트의 일부입니다.

## 📄 라이선스

교육용 목적으로만 사용 가능합니다.

## 📞 문의

기술 문의: KAIST Touch Math Academy

---

**제작**: AI Education System Pipeline
**버전**: 1.0.0
**마지막 업데이트**: 2025-11-18
