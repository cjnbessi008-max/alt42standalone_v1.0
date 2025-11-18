# 🧠 LMS 사고력 패턴 분석 시스템

Moodle 3.7 LMS와 연동하여 학생들의 아침·저녁 학습 시간대별 사고력 차이를 분석하는 AI 기반 분석 시스템

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [아키텍처](#아키텍처)
- [라이선스](#라이선스)

## 개요

이 시스템은 Moodle LMS에서 수집한 학습 데이터를 기반으로 학생들의 시간대별 사고력 패턴을 분석합니다. 아침, 낮, 저녁, 밤 시간대별로 다음 지표들을 측정하고 비교합니다:

- **정확도 (Accuracy)**: 문제 해결의 정확성
- **집중도 (Concentration)**: 학습 활동 중 집중력 수준
- **사고 깊이 (Thinking Depth)**: 문제 해결 과정의 깊이
- **효율성 (Efficiency)**: 시간 대비 성과
- **일관성 (Consistency)**: 성과의 안정성

## 주요 기능

### 🔄 Moodle 3.7 LMS 연동
- Web Service API를 통한 실시간 데이터 동기화
- Quiz, Assignment 등 학습 활동 자동 수집
- 사용자 성적 및 활동 로그 추출

### 📊 시간대별 분석
- 4개 시간대 (아침/낮/저녁/밤) 자동 분류
- 각 시간대별 다차원 성과 분석
- 아침 vs 저녁 집중 비교 분석

### 🎯 사고력 지표 측정
- **문제 해결 속도**: 문제당 평균 소요 시간
- **정확도**: 정답률 및 오류 패턴 분석
- **집중도**: 상호작용 패턴 기반 집중력 측정
- **사고 깊이**: 문제 복잡도 대비 성과

### 📈 시각화 대시보드
- React 기반 인터랙티브 차트
- 시간대별 비교 레이더 차트
- 맞춤형 학습 제안
- 상세 통계 테이블

### 💡 AI 기반 추천
- 개인별 최적 학습 시간대 추천
- 성과 향상을 위한 맞춤 조언
- 취약 영역 식별 및 개선 방안

## 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 웹 서버
- **Moodle**: 3.7.x

### 클라이언트 환경
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge - 최신 2개 버전)
- JavaScript 활성화 필요

### PHP 확장 모듈
```bash
- php-mysql
- php-curl
- php-json
- php-mbstring
- php-pdo
```

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
```

```sql
CREATE DATABASE thinking_patterns CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'thinking_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON thinking_patterns.* TO 'thinking_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 스키마 적용

```bash
mysql -u thinking_user -p thinking_patterns < src/database/schema_thinking_patterns.sql
```

### 4. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# 설정 파일 편집
nano .env
```

**.env 파일 설정 예시:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=thinking_patterns
DB_USER=thinking_user
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token
```

### 5. Moodle Web Service 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. 웹 서비스 활성화:
   - "웹 서비스 활성화" 체크
   - 프로토콜: REST 활성화

4. 외부 서비스 생성:
   - **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: "Thinking Pattern Analysis"
   - 필요한 함수 추가:
     - `core_user_get_users_by_field`
     - `core_course_get_courses`
     - `core_enrol_get_users_courses`
     - `mod_quiz_get_user_attempts`
     - `mod_assign_get_submissions`

5. 토큰 생성:
   - **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - 사용자 선택 및 서비스 선택
   - 토큰 생성 후 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 6. 웹 서버 설정

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^api/(.*)$ src/api/ThinkingPatternAPI.php [L,QSA]
</IfModule>
```

**Nginx:**
```nginx
location /api/ {
    rewrite ^/api/(.*)$ /src/api/ThinkingPatternAPI.php last;
}
```

### 7. 프론트엔드 설정 (React)

```bash
# Node.js 및 npm 설치 확인
node --version
npm --version

# 의존성 설치
cd src/frontend
npm install recharts react react-dom

# 개발 서버 실행
npm start
```

## 사용 방법

### 데이터 동기화

```php
<?php
require_once 'src/database/DatabaseConnection.php';
require_once 'src/moodle-integration/MoodleClient.php';
require_once 'src/moodle-integration/DataCollector.php';

// 초기화
$db = DatabaseConnection::getInstance();
$moodleClient = new MoodleClient('http://your-moodle.com', 'your_token');
$collector = new DataCollector($moodleClient, $db);

// Quiz 데이터 동기화
$quizId = 123;
$userId = 456; // optional
$syncedCount = $collector->syncQuizAttempts($quizId, $userId);

echo "동기화 완료: {$syncedCount}개 활동";
```

### 사고력 패턴 분석

```php
<?php
require_once 'src/analytics/ThinkingPatternAnalyzer.php';

$analyzer = new ThinkingPatternAnalyzer($db);

// 사용자 분석 실행
$userId = 456;
$startDate = '2024-01-01';
$endDate = '2024-01-31';

$analysis = $analyzer->analyzeUserPatterns($userId, $startDate, $endDate);

// 결과 출력
print_r($analysis);
```

### React 대시보드 사용

```jsx
import ThinkingPatternDashboard from './src/frontend/ThinkingPatternDashboard';

function App() {
  return (
    <ThinkingPatternDashboard
      userId={456}
      apiBaseUrl="http://localhost:8000"
    />
  );
}
```

## API 문서

### 엔드포인트

#### 1. 사용자 분석 조회
```http
GET /api/analysis/{user_id}?start_date=2024-01-01&end_date=2024-01-31
```

**응답:**
```json
{
  "user_id": 456,
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "patterns": {
    "morning": {
      "avg_accuracy": 85.5,
      "avg_concentration": 78.2,
      "total_activities": 15
    },
    "evening": {
      "avg_accuracy": 72.3,
      "avg_concentration": 65.1,
      "total_activities": 12
    }
  },
  "comparison": {
    "overall_best_time": "morning",
    "morning_vs_evening": {
      "better_time": "morning",
      "confidence": 75.5
    }
  }
}
```

#### 2. 분석 실행
```http
POST /api/analyze
Content-Type: application/json

{
  "user_id": 456,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

#### 3. Moodle 데이터 동기화
```http
POST /api/sync
Content-Type: application/json

{
  "quiz_id": 123,
  "user_id": 456
}
```

#### 4. 사용자 요약 정보
```http
GET /api/summary/{user_id}?start_date=2024-01-01&end_date=2024-01-31
```

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│              React Dashboard                     │
│         (시각화 및 사용자 인터페이스)              │
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│          PHP Backend (API Layer)                │
│      - ThinkingPatternAPI.php                   │
└──────┬────────────────────────┬─────────────────┘
       │                        │
┌──────▼────────┐      ┌────────▼─────────────────┐
│  Moodle       │      │  Analytics Engine        │
│  Integration  │      │  - Pattern Analyzer      │
│  - Client     │      │  - Metrics Calculator    │
│  - Collector  │      │  - Recommender           │
└──────┬────────┘      └────────┬─────────────────┘
       │                        │
       └────────────┬───────────┘
                    │
          ┌─────────▼──────────┐
          │  MySQL Database    │
          │  - Learning Data   │
          │  - Metrics         │
          │  - Analysis Results│
          └────────────────────┘
```

## 데이터베이스 스키마

주요 테이블:
- `learning_sessions`: 학습 세션 기록
- `learning_activities`: 활동 상세 정보
- `thinking_metrics`: 사고력 지표 측정값
- `thinking_pattern_analysis`: 분석 결과 (집계)
- `interaction_events`: 상호작용 이벤트 로그

## 개발 로드맵

### Phase 1 (현재)
- ✅ Moodle 3.7 연동
- ✅ 시간대별 데이터 수집
- ✅ 기본 사고력 분석 알고리즘
- ✅ React 대시보드

### Phase 2 (예정)
- ⬜ 머신러닝 기반 예측 모델
- ⬜ 실시간 알림 시스템
- ⬜ 학습 스타일 프로파일링
- ⬜ 모바일 앱 지원

### Phase 3 (예정)
- ⬜ 다중 LMS 지원 (Canvas, Blackboard)
- ⬜ 협업 학습 패턴 분석
- ⬜ AI 기반 맞춤형 학습 경로 추천

## 문제 해결

### Moodle 연결 실패
```php
// 연결 테스트
$moodleClient = new MoodleClient($url, $token);
if ($moodleClient->testConnection()) {
    echo "연결 성공";
} else {
    echo "연결 실패 - 토큰 및 URL 확인";
}
```

### 데이터베이스 연결 오류
- MySQL 서비스 실행 확인: `sudo systemctl status mysql`
- 권한 확인: `SHOW GRANTS FOR 'thinking_user'@'localhost';`
- 포트 확인: `netstat -tlnp | grep 3306`

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 문의

- 프로젝트 이슈: [GitHub Issues](https://github.com/your-org/alt42standalone_v1.0/issues)
- 이메일: support@example.com

## 감사의 말

- KAIST Touch Math Academy
- Moodle Community
- React 및 Recharts 개발팀
