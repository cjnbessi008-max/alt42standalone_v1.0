# Set MiniMap - 집합 구조 시각화 웹앱

LMS(Moodle)와 연동하여 수학 집합 구조를 미니맵으로 표현하고, 우측 하단 가상 스마트폰 화면에 문제를 표시하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 1. 집합 구조 시각화 (Set MiniMap)
- **다양한 레이아웃**: 트리, 벤 다이어그램, 네트워크, 계층 구조
- **인터랙티브 탐색**: 팬(Pan), 줌(Zoom), 클릭 선택
- **시각적 관계 표현**: 부분집합, 교집합, 합집합, 서로소 관계 시각화
- **실시간 하이라이트**: 선택된 집합 강조 표시

### 2. 가상 스마트폰 디스플레이
- **우측 하단 배치**: 실제 스마트폰처럼 보이는 UI
- **문제 표시**: 선택한 집합의 문제를 스마트폰 화면에 표시
- **네비게이션**: 이전/다음 버튼, 키보드 화살표, 터치 스와이프 지원
- **진행도 표시**: 문제 풀이 진행 상황 프로그레스 바
- **토글 기능**: 스마트폰 화면 숨기기/보이기

### 3. Moodle LMS 연동
- **문제 동기화**: Moodle 문제 은행에서 문제 가져오기
- **자동 분류**: 문제 유형 및 난이도별 자동 분류
- **실시간 업데이트**: 최신 문제 자동 반영

### 4. 반응형 디자인
- 데스크톱, 태블릿, 모바일 최적화
- 터치 제스처 지원
- 다크/라이트 테마 대응 가능

## 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **PDO**: 데이터베이스 연결

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, 그라디언트, 애니메이션
- **Vanilla JavaScript**: ES6+, SVG 조작

### 연동
- **Moodle**: 3.7 Web Services API
- **cURL**: HTTP 통신

## 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE set_minimap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 임포트
mysql -u root -p set_minimap < database/schema.sql
```

### 2. PHP 설정

`api/config.php` 파일을 편집하여 데이터베이스 및 Moodle 연결 정보를 입력합니다:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'set_minimap');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

### 3. Moodle Web Service 설정

Moodle 사이트에서 Web Services를 활성화해야 합니다:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
2. 웹 서비스 활성화
3. 프로토콜 활성화: REST
4. 서비스 생성: `set_minimap_service`
5. 토큰 생성 후 `config.php`에 입력

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    DocumentRoot "/path/to/alt42standalone_v1.0/public"
    ServerName setminimap.local

    <Directory "/path/to/alt42standalone_v1.0/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### PHP Built-in Server (개발용)

```bash
cd public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

## 사용 방법

### 1. 집합 구조 탐색

1. 좌측 사이드바에서 집합 선택
2. 미니맵에서 집합 구조 시각화 확인
3. 레이아웃 변경: 상단 선택 상자에서 원하는 레이아웃 선택
4. 확대/축소: `+`, `-` 버튼 또는 마우스 휠
5. 이동: 미니맵을 드래그하여 이동

### 2. 문제 풀이

1. 집합을 선택하면 우측에 관련 문제 목록 표시
2. 문제를 클릭하면 스마트폰 화면에 표시
3. 스마트폰에서 이전/다음 버튼으로 문제 탐색
4. 키보드 화살표 키로도 조작 가능

### 3. Moodle 동기화

1. 상단 "Moodle 동기화" 버튼 클릭
2. Moodle에서 최신 문제 가져오기
3. 자동으로 집합에 매핑

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                 # 웹 루트
│   ├── index.html         # 메인 페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   ├── js/
│   │   ├── app.js         # 메인 애플리케이션 로직
│   │   ├── minimap.js     # 미니맵 시각화
│   │   └── smartphone.js  # 스마트폰 UI
│   └── assets/            # 이미지, 폰트 등
├── api/                    # PHP 백엔드
│   ├── config.php         # 설정 파일
│   ├── database.php       # DB 연결 클래스
│   ├── moodle_connector.php # Moodle API 연결
│   └── endpoints/         # API 엔드포인트
│       ├── get_sets.php   # 집합 조회
│       ├── get_problems.php # 문제 조회
│       └── sync_moodle.php  # Moodle 동기화
├── database/              # 데이터베이스
│   └── schema.sql        # DB 스키마
└── README.md             # 이 파일
```

## API 엔드포인트

### GET /api/endpoints/get_sets.php
집합 목록 및 관계 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "sets": [...],
    "tree": [...],
    "relationships": [...],
    "total": 6
  }
}
```

### GET /api/endpoints/get_problems.php?set_id={id}
문제 목록 조회 (선택적으로 집합별 필터링)

**응답:**
```json
{
  "success": true,
  "data": {
    "problems": [...],
    "total": 5,
    "set_id": 1
  }
}
```

### POST /api/endpoints/sync_moodle.php
Moodle 문제 동기화

**응답:**
```json
{
  "success": true,
  "synced": 5,
  "message": "5개의 문제가 동기화되었습니다."
}
```

## 데이터베이스 스키마

### sets
- 집합 정보 (id, name, description, parent_id, color, position_x, position_y)

### set_relationships
- 집합 간 관계 (set_a_id, set_b_id, relationship_type)

### problems
- 문제 정보 (id, moodle_question_id, question_text, question_type, difficulty_level)

### problem_set_mapping
- 문제-집합 매핑

### student_progress
- 학습자 진행 상황

## 커스터마이징

### 색상 변경

`public/css/style.css`의 CSS 변수 수정:

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --danger-color: #e74c3c;
    /* ... */
}
```

### 스마트폰 크기 조정

```css
:root {
    --smartphone-width: 280px;
    --smartphone-height: 560px;
}
```

## 트러블슈팅

### 데이터베이스 연결 오류
- `api/config.php`의 DB 정보 확인
- MySQL 서버 실행 확인
- 권한 설정 확인

### Moodle 연동 오류
- Moodle Web Services 활성화 확인
- 토큰 유효성 확인
- CORS 설정 확인

### 화면이 표시되지 않음
- PHP 에러 로그 확인
- 브라우저 콘솔 확인
- 파일 경로 확인

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy

## 버전

v1.0.0 (2025)

## 지원

문제가 발생하면 이슈를 등록해주세요.
