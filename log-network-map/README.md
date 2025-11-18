# Log Network Map 📊

학습 개념과 로그 데이터를 네트워크 형태로 시각화하는 독립형 웹 애플리케이션입니다.

## 🎯 주요 기능

- **네트워크 시각화**: Vis.js를 사용한 인터랙티브한 개념 네트워크 맵
- **학습 경로 추적**: 학생들의 학습 경로를 시각적으로 표시
- **Moodle 연동**: Moodle LMS와 데이터 동기화
- **모바일 미리보기**: 우측 하단 가상 스마트폰 화면으로 모바일 뷰 확인
- **실시간 필터링**: 난이도별, 학생별 필터링 기능
- **다양한 레이아웃**: 계층형, 힘 기반, 원형 레이아웃 지원

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7 (선택사항)

## 🚀 설치 방법

### 1. 프로젝트 복사

```bash
git clone <repository-url>
cd log-network-map
```

### 2. 데이터베이스 설정

MySQL에 접속하여 데이터베이스를 생성하고 스키마를 임포트합니다:

```bash
mysql -u root -p < database/schema.sql
```

또는 MySQL 클라이언트에서:

```sql
SOURCE /path/to/log-network-map/database/schema.sql;
```

### 3. 설정 파일 구성

설정 예시 파일을 복사하고 수정합니다:

```bash
cp config.example.php config.php
```

`config.php` 파일을 편집하여 데이터베이스 연결 정보를 입력합니다:

```php
'DB_HOST' => 'localhost',
'DB_NAME' => 'log_network_map',
'DB_USER' => 'your_username',
'DB_PASS' => 'your_password',
```

### 4. Moodle 연동 설정 (선택사항)

Moodle과 연동하려면 Moodle Web Service를 활성화하고 토큰을 생성해야 합니다:

1. Moodle 관리자 페이지 → 사이트 관리 → 플러그인 → 웹 서비스 → 개요
2. "Enable web services" 활성화
3. "Enable protocols" → REST protocol 활성화
4. "Create a specific user" → 웹 서비스 전용 사용자 생성
5. "Create a token for a user" → 토큰 생성

생성된 토큰을 `config.php`에 입력:

```php
'MOODLE_URL' => 'http://your-moodle-site.com',
'MOODLE_TOKEN' => 'your_generated_token',
```

### 5. 웹 서버 설정

#### Apache

`.htaccess` 파일이 자동으로 적용됩니다. `mod_rewrite`가 활성화되어 있는지 확인하세요.

#### Nginx

다음 설정을 Nginx 설정 파일에 추가:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/log-network-map/frontend;
    index index.html;

    location /backend/ {
        alias /path/to/log-network-map/backend/;
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6. 권한 설정

로그 디렉토리에 쓰기 권한 부여:

```bash
mkdir -p logs
chmod 755 logs
```

## 💻 사용 방법

### 기본 사용

1. 웹 브라우저에서 `http://localhost/log-network-map/frontend/` 접속
2. 좌측 사이드바에서 학생 선택 및 필터 설정
3. 네트워크 맵에서 개념 노드 클릭하여 상세 정보 확인
4. 우측 하단 모바일 아이콘 클릭하여 모바일 미리보기 표시

### 필터 사용

- **학생 선택**: 특정 학생의 학습 경로만 표시
- **난이도 필터**: 초급/중급/고급 개념 선택적 표시
- **레이아웃 변경**: 계층형, 힘 기반, 원형 레이아웃 선택
- **학습 경로 표시**: 학생의 실제 학습 경로를 점선으로 표시

### Moodle 데이터 동기화

1. 상단 메뉴에서 "Moodle 연동" 버튼 클릭
2. 사용자 데이터 동기화 실행
3. 학생 선택 드롭다운에서 동기화된 학생 확인

## 📡 API 엔드포인트

### 네트워크 데이터
```
GET /backend/api/network.php?student_id={id}
```

### 개념 관리
```
GET  /backend/api/concepts.php
POST /backend/api/concepts.php
```

### 학습 로그
```
GET  /backend/api/logs.php?student_id={id}
GET  /backend/api/logs.php?concept_id={id}
POST /backend/api/logs.php
```

### Moodle 연동
```
GET  /backend/api/moodle.php?action=get_users
GET  /backend/api/moodle.php?action=get_courses
POST /backend/api/moodle.php (action: sync_users, import_logs)
```

## 🗂️ 프로젝트 구조

```
log-network-map/
├── backend/                 # PHP 백엔드
│   ├── api/                # API 엔드포인트
│   │   ├── concepts.php
│   │   ├── logs.php
│   │   ├── network.php
│   │   └── moodle.php
│   ├── config/             # 설정 파일
│   │   └── database.php
│   ├── models/             # 데이터 모델
│   │   ├── Concept.php
│   │   └── LearningLog.php
│   └── utils/              # 유틸리티
│       └── cors.php
├── frontend/               # 프론트엔드
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── config.js
│   │       ├── api.js
│   │       ├── network.js
│   │       └── app.js
│   ├── index.html
│   └── mobile-preview.html
├── database/               # 데이터베이스
│   └── schema.sql
├── docs/                   # 문서
├── config.example.php      # 설정 예시
└── README.md
```

## 🎨 커스터마이징

### 노드 색상 변경

`frontend/assets/js/config.js` 파일에서 난이도별 색상 설정:

```javascript
NODE_STYLES: {
    beginner: {
        color: '#3498db',  // 파란색
        label: '초급'
    },
    // ...
}
```

### 레이아웃 설정

`NETWORK_OPTIONS` 객체에서 각 레이아웃의 물리 엔진 및 배치 설정 조정 가능

### 데이터베이스 스키마 확장

필요에 따라 `database/schema.sql`을 수정하고, 해당 모델 파일 업데이트

## 🔧 문제 해결

### 네트워크 맵이 표시되지 않는 경우

1. 브라우저 콘솔에서 에러 확인
2. `backend/api/network.php`에 직접 접속하여 JSON 응답 확인
3. 데이터베이스 연결 설정 확인

### CORS 에러 발생

`backend/utils/cors.php` 파일에서 허용할 오리진 설정 확인

### Moodle 연동 실패

1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. Moodle 서버와 네트워크 연결 확인

## 📊 데이터 모델

### Concepts (개념)
- 교육적 개념/노드
- 난이도, 카테고리, 색상 속성

### Concept Relationships (개념 관계)
- 개념 간 연결 관계
- 선수학습, 관련, 확장, 적용 타입

### Learning Logs (학습 로그)
- 학생의 개념별 학습 활동 기록
- 활동 유형, 점수, 소요 시간

### Learning Paths (학습 경로)
- 학생의 개념 간 이동 경로
- 전환 횟수, 성공률 추적

## 🔐 보안 고려사항

- 모든 사용자 입력은 서버 측에서 검증 및 새니타이징
- SQL Injection 방지를 위한 Prepared Statements 사용
- CORS 설정을 통한 허용된 도메인만 접근 가능
- Moodle 토큰은 환경 변수 또는 별도 설정 파일로 관리

## 📝 라이센스

MIT License

## 👥 기여

이슈 및 Pull Request는 언제든 환영합니다!

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**버전**: 1.0.0
**개발 환경**: PHP 7.1.9 + MySQL 5.7 + Vis.js 9.1.2
**호환성**: Moodle 3.7+
