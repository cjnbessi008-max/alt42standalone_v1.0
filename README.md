# Moodle Question Auto-Display System

효율적인 Moodle 3.7 LMS 연동 시스템으로 문제를 자동으로 표시합니다.

## 특징

- ✅ **효율적인 캐싱**: 과한 계산 없이 빠른 응답 속도
- 📚 **Moodle 3.7 호환**: 완벽한 Moodle 데이터베이스 연동
- 🎨 **모던한 UI**: 반응형 디자인과 깔끔한 인터페이스
- 🔒 **안전한 쿼리**: Prepared Statements로 SQL Injection 방지
- 🚀 **성능 최적화**: 필요한 데이터만 조회하는 최적화된 쿼리
- 📱 **가상 스마트폰 뷰**: 우측 하단에 표시되는 모바일 화면
- 🚫 **Duplicate Barrier**: 중복 문제 차단 애니메이션 시스템

## 새로운 기능: Duplicate Barrier 🚫

### 가상 스마트폰 화면
- 우측 하단에 고정된 가상 스마트폰 (320x640px)
- 문제 클릭 시 스마트폰 화면에 자동 표시
- 최소화/펼치기 토글 기능

### 중복 감지 시스템
- 세션 기반 실시간 중복 추적
- MySQL 데이터베이스 영구 저장
- 조회 횟수 및 시간 기록

### 애니메이션 효과
- 중복 문제 클릭 시 시각적 차단 효과
- 펄스, 흔들림, 회전 애니메이션
- 2초 자동 종료

자세한 사용법은 [DUPLICATE_BARRIER_GUIDE.md](DUPLICATE_BARRIER_GUIDE.md) 참조

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7
- **웹 서버**: Apache 또는 Nginx
- **브라우저**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

## 설치 방법

### 1. 파일 다운로드

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 설정

```bash
# 환경 변수 파일 생성
cp config/.env.example config/.env

# 환경 변수 편집
nano config/.env
```

`.env` 파일에 Moodle 데이터베이스 정보 입력:

```ini
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password
```

### 3. 캐시 디렉토리 생성

```bash
mkdir -p cache
chmod 755 cache
```

### 4. 웹 서버 설정

#### Apache

`public` 디렉토리를 DocumentRoot로 설정:

```apache
<VirtualHost *:80>
    ServerName moodle-display.local
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
    server_name moodle-display.local;
    root /path/to/alt42standalone_v1.0/public;

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

### 5. 접속

브라우저에서 설정한 도메인으로 접속:

```
http://moodle-display.local
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   ├── config.php          # 시스템 설정
│   └── .env.example        # 환경 변수 예시
├── src/
│   ├── autoload.php        # PSR-4 오토로더
│   ├── Database/
│   │   └── Connection.php  # 데이터베이스 연결 관리
│   └── Services/
│       ├── CacheService.php    # 캐싱 서비스
│       └── QuestionService.php # 문제 조회 서비스
├── public/
│   ├── index.php           # 메인 페이지
│   ├── api.php            # API 엔드포인트
│   └── css/
│       └── style.css       # 스타일시트
├── cache/                  # 캐시 파일 저장소
└── README.md              # 이 파일
```

## 주요 기능

### 1. 문제 목록 표시

- Moodle 데이터베이스에서 문제 자동 조회
- 카테고리별 필터링
- 페이지네이션 지원

### 2. 효율적인 캐싱

```php
// 캐시는 자동으로 관리됩니다
// 기본 캐시 TTL: 1시간
// 수동 캐시 삭제: api.php?action=clear_cache
```

### 3. API 엔드포인트

#### 문제 목록 조회

```
GET /api.php?action=questions&page=1&category=5
```

응답:
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_questions": 95,
      "per_page": 10
    }
  }
}
```

#### 단일 문제 조회

```
GET /api.php?action=question&id=123
```

#### 카테고리 목록 조회

```
GET /api.php?action=categories
```

#### 퀴즈의 문제 조회

```
GET /api.php?action=quiz_questions&quiz_id=5
```

## 설정 옵션

`config/config.php` 파일에서 다양한 옵션을 설정할 수 있습니다:

### 표시 설정

```php
'display' => [
    'per_page' => 10,              // 페이지당 문제 수
    'default_category' => null,     // 기본 카테고리 (null = 전체)
    'show_hidden' => false,         // 숨겨진 문제 표시 여부
    'order_by' => 'name',          // 정렬 기준
    'order_direction' => 'ASC',     // 정렬 방향
],
```

### 캐시 설정

```php
'cache' => [
    'enabled' => true,      // 캐시 활성화
    'ttl' => 3600,         // 캐시 유효 시간 (초)
],
```

### 성능 설정

```php
'performance' => [
    'enable_query_cache' => true,           // 쿼리 캐시 활성화
    'max_questions_per_query' => 100,       // 쿼리당 최대 문제 수
    'use_prepared_statements' => true,      // Prepared Statements 사용
],
```

## 보안

### 구현된 보안 기능

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: HTML 출력 시 `htmlspecialchars()` 사용
3. **데이터 검증**: 입력 데이터 타입 확인 및 검증

### 권장 사항

- 프로덕션 환경에서는 `display_errors = 0` 설정
- HTTPS 사용 권장
- 데이터베이스 사용자는 SELECT 권한만 부여
- 정기적인 캐시 정리

## 성능 최적화

### 캐싱 전략

- 파일 기반 캐시로 데이터베이스 부하 감소
- 기본 1시간 캐시 TTL
- 쿼리 결과 자동 캐싱

### 쿼리 최적화

- 필요한 컬럼만 SELECT
- 인덱스를 활용한 WHERE 절
- LIMIT/OFFSET을 통한 페이지네이션

### 예상 성능

- **첫 요청**: ~200-500ms (DB 쿼리)
- **캐시된 요청**: ~10-50ms (파일 읽기)
- **동시 접속**: 100+ 사용자 지원 가능

## 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed: ...
```

**해결 방법**:
1. `.env` 파일의 데이터베이스 정보 확인
2. MySQL 서버 실행 여부 확인
3. 사용자 권한 확인

```sql
GRANT SELECT ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### 캐시 문제

캐시가 업데이트되지 않을 때:

```bash
# 캐시 디렉토리 비우기
rm -rf cache/*.cache

# 또는 API를 통해
curl http://your-domain/api.php?action=clear_cache
```

### 권한 문제

```bash
# 캐시 디렉토리 권한 설정
chmod 755 cache
chown www-data:www-data cache
```

## 개발

### 코드 스타일

- PSR-4 오토로딩
- PSR-12 코딩 스타일
- 명확한 주석과 문서화

### 확장 방법

새로운 기능 추가 예시:

```php
// src/Services/CustomService.php
namespace MoodleIntegration\Services;

class CustomService {
    public function customMethod() {
        // 새로운 기능 구현
    }
}
```

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 지원

문의사항이 있으시면 개발팀에 연락해주세요.

---

**개발 정보**:
- 개발 날짜: 2025-11-18
- 호환성: MySQL 5.7, PHP 7.1.9, Moodle 3.7
- 특징: 효율적인 캐싱, 최적화된 쿼리, 안전한 데이터 처리
