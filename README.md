# 개념 회피 감지 시스템 (Concept Avoidance Detection System)

[![PHP Version](https://img.shields.io/badge/PHP-7.1.9-blue.svg)](https://www.php.net/)
[![MySQL Version](https://img.shields.io/badge/MySQL-5.7-orange.svg)](https://www.mysql.com/)
[![Moodle Version](https://img.shields.io/badge/Moodle-3.7-green.svg)](https://moodle.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

학습자가 특정 개념을 회피하는 패턴을 자동으로 감지하는 독립형 웹 애플리케이션입니다. Moodle LMS와 연동하여 학생들의 퀴즈 풀이 데이터를 분석하고, 교사에게 인사이트를 제공합니다.

## 📋 주요 기능

### 🔍 자동 개념 회피 감지
- **낮은 정답률 감지**: 특정 개념에서 지속적으로 낮은 정답률을 보이는 패턴
- **빠른 건너뛰기 감지**: 문제를 제대로 읽지 않고 건너뛰는 행동 패턴
- **비정상 응답 시간 감지**: 너무 빠르거나 너무 느린 응답 시간
- **패턴 기반 회피 감지**: 유사한 개념 대비 특정 개념만 회피하는 패턴
- **복합 패턴 감지**: 여러 회피 신호가 복합적으로 나타나는 경우

### 📊 데이터 분석 및 시각화
- 학생별, 개념별 회피 패턴 대시보드
- 심각도별, 유형별 통계 차트
- 문제가 많은 개념 Top 10
- 주의가 필요한 학생 Top 10
- 실시간 감지 및 알림

### 🔄 Moodle LMS 연동
- Moodle 퀴즈 데이터 자동 동기화
- 문제-개념 매핑 관리
- 학생 시도 기록 추적
- 읽기 전용 연동 (Moodle 데이터 보호)

### 🎯 교사용 기능
- 직관적인 웹 대시보드
- 패턴 상세 분석 및 증거 데이터 확인
- 패턴 해결 상태 관리
- 개념 및 학생 필터링

## 🛠 기술 스택

### Backend
- **PHP 7.1.9**: Moodle 호환성 유지
- **MySQL 5.7**: 데이터베이스
- **PDO**: 안전한 데이터베이스 연결

### Frontend
- **HTML5 / CSS3**: 모던 웹 표준
- **Bootstrap 4**: 반응형 UI 프레임워크
- **Chart.js**: 데이터 시각화
- **jQuery**: DOM 조작 및 AJAX

### Architecture
- **RESTful API**: 백엔드-프론트엔드 분리
- **독립형 웹앱**: Moodle과 별도 실행
- **읽기 전용 연동**: Moodle 데이터 무결성 보장

## 📦 설치 방법

### 1. 시스템 요구사항

```bash
- PHP >= 7.1.9
- MySQL >= 5.7
- Apache/Nginx 웹 서버
- Moodle 3.7 (MySQL 데이터베이스 접근 권한)
```

### 2. 프로젝트 클론

```bash
git clone https://github.com/yourusername/concept-avoidance-detection.git
cd concept-avoidance-detection
```

### 3. 데이터베이스 설정

#### 독립형 데이터베이스 생성

```bash
mysql -u root -p < src/db/schema.sql
```

이 스크립트는 다음을 수행합니다:
- `concept_avoidance` 데이터베이스 생성
- 필요한 모든 테이블 생성
- 샘플 개념 데이터 삽입
- 감지 규칙 초기화

### 4. 설정 파일 수정

`src/config/config.php` 파일을 수정하여 데이터베이스 연결 정보를 입력합니다:

```php
// 독립형 앱 데이터베이스
define('DB_HOST', 'localhost');
define('DB_NAME', 'concept_avoidance');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 데이터베이스 (읽기 전용)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_readonly_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 5. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ src/api/index.php/$1 [L]
</IfModule>
```

#### Nginx

```nginx
location /api {
    try_files $uri $uri/ /src/api/index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

### 6. 권한 설정

```bash
chmod -R 755 src/
chmod -R 777 logs/
```

## 🚀 사용 방법

### 1. 웹 브라우저에서 접속

```
http://your-server/src/web/index.html
```

### 2. Moodle 데이터 동기화

대시보드에서 **"동기화"** 버튼을 클릭하여 Moodle 퀴즈 데이터를 가져옵니다.

### 3. 개념-문제 매핑 설정

Moodle 문제를 학습 개념과 매핑합니다 (수동 또는 API를 통해):

```bash
# API를 통한 매핑 예시
curl -X POST http://your-server/api/index.php/concepts/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_question_id": 123,
    "concept_id": 5,
    "is_primary": true
  }'
```

### 4. 회피 패턴 감지 실행

대시보드에서 **"전체 감지 실행"** 버튼을 클릭하여 모든 학생의 회피 패턴을 감지합니다.

### 5. 결과 확인

- **대시보드**: 전체 통계 및 최근 패턴
- **학생 탭**: 학생별 상세 분석
- **개념 탭**: 개념별 통계
- **패턴 상세**: 증거 데이터 및 해결 관리

## 📡 API 엔드포인트

### Dashboard
```
GET /api/index.php/dashboard
```

### Sync
```
POST /api/index.php/sync
GET /api/index.php/sync/history
GET /api/index.php/sync/status
```

### Detection
```
POST /api/index.php/detection/run
GET /api/index.php/detection/statistics
```

### Students
```
GET /api/index.php/students
GET /api/index.php/students/{id}/patterns
GET /api/index.php/students/{id}/analysis
GET /api/index.php/students/{id}/attempts
```

### Concepts
```
GET /api/index.php/concepts
GET /api/index.php/concepts/{id}
GET /api/index.php/concepts/{id}/patterns
GET /api/index.php/concepts/{id}/statistics
POST /api/index.php/concepts
PUT /api/index.php/concepts/{id}
```

### Patterns
```
GET /api/index.php/patterns
GET /api/index.php/patterns/{id}
PUT /api/index.php/patterns/{id}/resolve
PUT /api/index.php/patterns/{id}/notify
```

## 🧮 감지 알고리즘

### 1. 낮은 정답률 감지 (Low Accuracy Detection)

```
IF accuracy_rate < 25% THEN severity = 'critical'
ELSE IF accuracy_rate < 40% THEN severity = 'high'
ELSE IF accuracy_rate < 55% THEN severity = 'medium'
ELSE IF accuracy_rate < 70% THEN severity = 'low'
```

### 2. 빠른 건너뛰기 감지 (Quick Skip Detection)

```
IF skip_rate > 40% AND avg_time < 10s THEN severity = 'high'
ELSE IF skip_rate > 25% AND avg_time < 15s THEN severity = 'medium'
```

### 3. 비정상 시간 감지 (Time Abnormality Detection)

```
IF avg_time < 5s AND accuracy < 50% THEN abnormality = 'too_fast'
IF max_time > avg_time * 3 AND min_time < avg_time / 3 THEN abnormality = 'inconsistent'
```

### 4. 패턴 회피 감지 (Pattern Avoidance Detection)

```
performance_gap = sibling_avg_accuracy - concept_accuracy
IF performance_gap > 30% THEN severity = 'high'
ELSE IF performance_gap > 20% THEN severity = 'medium'
```

## 📊 데이터베이스 스키마

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `concepts` | 학습 개념 정의 |
| `concept_mappings` | Moodle 문제-개념 매핑 |
| `student_analysis` | 학생별 개념 분석 캐시 |
| `avoidance_patterns` | 감지된 회피 패턴 |
| `sync_log` | Moodle 동기화 로그 |
| `detection_rules` | 감지 알고리즘 규칙 |
| `system_settings` | 시스템 설정 |

## 🔧 고급 설정

### 감지 임계값 조정

`src/config/config.php`에서 감지 임계값을 조정할 수 있습니다:

```php
define('MIN_ATTEMPTS_FOR_ANALYSIS', 3);           // 분석 최소 시도 횟수
define('ACCURACY_THRESHOLD_LOW', 40.0);           // 낮은 정답률 임계값
define('ACCURACY_THRESHOLD_CRITICAL', 25.0);      // 긴급 정답률 임계값
define('QUICK_SKIP_TIME_SECONDS', 10);            // 빠른 건너뛰기 시간
define('ABNORMAL_TIME_MULTIPLIER', 3.0);          // 비정상 시간 배수
define('CONFIDENCE_THRESHOLD', 70.0);             // 신뢰도 임계값
```

### 자동 동기화 설정

Cron을 사용하여 자동 동기화를 설정할 수 있습니다:

```bash
# 매 30분마다 동기화
*/30 * * * * curl -X POST http://your-server/api/index.php/sync
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 연결 확인
mysql -u your_username -p -h localhost

# PHP PDO MySQL 확장 확인
php -m | grep pdo_mysql
```

### Moodle 데이터베이스 접근 권한

```sql
-- Moodle DB에 읽기 전용 사용자 생성
CREATE USER 'moodle_readonly'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'localhost';
FLUSH PRIVILEGES;
```

### 로그 확인

```bash
tail -f logs/$(date +%Y-%m-%d).log
```

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여

Pull Request는 언제나 환영합니다! 주요 변경사항은 먼저 이슈를 열어 논의해주세요.

## 📧 문의

- **이메일**: support@example.com
- **이슈 트래커**: https://github.com/yourusername/concept-avoidance-detection/issues

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline PRD를 기반으로 개발되었습니다.

---

**Built with ❤️ for better education**
