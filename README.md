# ALT42 Education System - Moodle Integration

## 개요

ALT42 교육 시스템은 AI 기반 교육 모듈 자동 생성 시스템입니다. 이 프로젝트는 Moodle 3.7 LMS와 통합하여 학생들이 문제를 재시도할 때 속도 개선을 추적하고 피드백을 제공합니다.

### 주요 기능

✅ **Moodle LTI 1.1 통합** - Moodle LMS와 완벽한 통합
✅ **재시도 속도 분석** - "다시 풀면 더 빨리 할 수 있는가?" 체크
✅ **자동 성적 동기화** - Moodle Gradebook 자동 업데이트
✅ **한국어 피드백** - 학생 친화적인 한국어 메시지
✅ **상세한 통계** - 학생별, 모듈별 상세 통계 제공

---

## 빠른 시작

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Moodle 3.7
- Apache 2.4 또는 Nginx 1.14

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 설정 입력

# 데이터베이스 스키마 생성
mysql -u root -p < database/moodle_integration_schema.sql
```

### 3. 웹 서버 설정

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^api/(.*)$ /src/php/api_endpoints.php [QSA,L]
```

#### Nginx
```nginx
location /api/ {
    rewrite ^/api/(.*)$ /src/php/api_endpoints.php last;
}
```

### 4. Moodle 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구**
3. 새 도구 추가:
   - **도구 URL**: `https://your-domain.com/api/lti/launch`
   - **Consumer Key**: `.env` 파일의 `LTI_CONSUMER_KEY`
   - **Shared Secret**: `.env` 파일의 `LTI_SHARED_SECRET`

### 5. 테스트

```bash
# API 헬스 체크
curl http://localhost/api/health

# 응답:
# {"success":true,"status":"healthy","timestamp":"2025-11-18 12:00:00","version":"1.0.0"}
```

---

## 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── moodle_integration_schema.sql    # MySQL 스키마
├── src/
│   └── php/
│       ├── MoodleLTIIntegration.php     # LTI 통합
│       ├── RetrySpeedAnalyzer.php       # 속도 분석 로직
│       └── api_endpoints.php             # REST API
├── docs/
│   └── MOODLE_INTEGRATION_GUIDE.md      # 상세 가이드
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md # PRD
├── .env.example                          # 환경 변수 예제
└── README.md                             # 이 파일
```

---

## API 사용 예제

### 문제 시도 기록

```bash
curl -X POST http://localhost/api/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "problem_id": "660e8400-e29b-41d4-a716-446655440000",
    "student_answer": {"numerator": 2, "denominator": 4},
    "is_correct": true,
    "time_spent_seconds": 45,
    "started_at": "2025-11-18 10:00:00",
    "completed_at": "2025-11-18 10:00:45"
  }'
```

### 재시도 분석 조회

```bash
curl http://localhost/api/students/{student_id}/problems/{problem_id}/analysis
```

### 재시도 권장 여부 확인

```bash
curl http://localhost/api/students/{student_id}/problems/{problem_id}/should-retry
```

---

## 주요 기능 설명

### 1. 재시도 속도 분석

시스템은 학생이 같은 문제를 여러 번 풀 때마다 시간을 측정하고 비교합니다:

- **첫 시도**: 60초
- **두 번째 시도**: 45초
- **개선율**: 25% (15초 단축)

### 2. 개선 수준 분류

| 개선율 | 수준 | 피드백 |
|--------|------|--------|
| ≥ 30% | Excellent | "놀라워요! 첫 시도보다 XX초나 빨라졌어요!" |
| 15-29% | Good | "잘했어요! XX초 더 빨라졌어요!" |
| 5-14% | Fair | "좋아요! XX초 빨라졌어요." |
| -5 to 5% | No Change | "비슷한 시간이 걸렸어요." |
| < -5% | Slower | "이번에는 더 오래 걸렸어요." |

### 3. 재시도 권장 로직

시스템이 자동으로 재시도를 권장하는 경우:
- ❌ 틀렸을 때
- 🐢 정답이지만 60초 이상 걸렸을 때
- 📈 개선 중이고 5회 미만 시도했을 때

재시도를 권장하지 않는 경우:
- ✅ 정답이고 30초 미만으로 빠르게 풀었을 때
- 🎓 이미 충분히 연습했을 때 (5회 이상)

---

## 데이터베이스 스키마

### 주요 테이블

#### `student_attempts`
학생의 모든 문제 시도를 기록합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(36) | UUID |
| student_id | VARCHAR(36) | 학생 ID |
| problem_id | VARCHAR(36) | 문제 ID |
| attempt_number | INT | 시도 횟수 (1, 2, 3...) |
| time_spent_seconds | INT | 소요 시간 (초) |
| is_correct | BOOLEAN | 정답 여부 |

#### `retry_speed_analysis`
재시도 속도 개선 분석 결과를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| student_id | VARCHAR(36) | 학생 ID |
| problem_id | VARCHAR(36) | 문제 ID |
| first_attempt_time | INT | 첫 시도 시간 |
| latest_attempt_time | INT | 최근 시도 시간 |
| improvement_percentage | DECIMAL(5,2) | 개선율 (%) |
| is_improving | BOOLEAN | 개선 중 여부 |

---

## 보안

### OAuth 1.0 서명 검증
모든 LTI 요청은 HMAC-SHA1 서명으로 검증됩니다.

### 재생 공격(Replay Attack) 방지
- Timestamp 검증 (5분 이내)
- Nonce 중복 확인

### SQL Injection 방지
모든 데이터베이스 쿼리는 Prepared Statements를 사용합니다.

---

## 문제 해결

### LTI 검증 실패

**에러 메시지**: "Invalid LTI request"

**해결 방법**:
1. Consumer Key와 Shared Secret 확인
2. 서버 시간 동기화 (`ntpdate` 사용)
3. PHP 에러 로그 확인: `/var/log/php-errors.log`

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON alt42_education.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 개발 로드맵

### Phase 1 (완료)
- ✅ MySQL 스키마 설계
- ✅ Moodle LTI 통합
- ✅ 재시도 속도 분석 로직
- ✅ REST API 엔드포인트

### Phase 2 (예정)
- ⏳ React 프론트엔드
- ⏳ 실시간 대시보드
- ⏳ 고급 분석 (학습 패턴 인식)
- ⏳ 다국어 지원 (영어)

### Phase 3 (계획)
- 📅 AI 기반 문제 추천
- 📅 게이미피케이션 요소
- 📅 모바일 앱
- 📅 여러 LMS 지원 (Canvas, Blackboard)

---

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 라이선스

MIT License

Copyright (c) 2025 ALT42 Education

---

## 문의

- **이슈**: https://github.com/your-org/alt42/issues
- **이메일**: support@alt42.com
- **문서**: https://docs.alt42.com

---

## 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 지원을 받아 개발되었습니다.
