# 📊 집중도 분석기 (Concentration Analyzer)

Moodle 3.7 LMS와 연동하여 학습자의 집중도를 분석하고 들쭉날쭉한 패턴을 탐지하는 독립형 웹 애플리케이션

## 🎯 주요 기능

### 1. **Moodle LMS 데이터 동기화**
- Moodle 3.7의 `logstore_standard_log` 테이블에서 사용자 활동 로그 수집
- 실시간 또는 주기적 동기화 지원
- 클릭, 페이지 뷰, 제출 등 모든 활동 추적

### 2. **집중도 계산 엔진**
- **다차원 집중도 분석:**
  - 활동 빈도 (Activity Frequency)
  - 클릭률 (Click Rate per Minute)
  - 일관성 (Consistency of Intervals)
  - 응답 시간 (Response Time)
- 5분 단위 시간 윈도우로 집중도 점수 계산 (0-100점)

### 3. **들쭉날쭉한 구간 탐지 (Fluctuation Detection)**
- **통계적 방법:**
  - Z-점수(표준점수) 기반 이상 탐지
  - 이동평균(Moving Average) 적용
- **변동 유형 분류:**
  - 🔺 급상승 (Spike)
  - 🔻 급하락 (Drop)
  - 📊 불규칙 (Irregular)
- **심각도 판정:** Low / Medium / High

### 4. **시각화 대시보드**
- Chart.js 기반 실시간 그래프
- 시간별 집중도 추이 그래프
- 변동 구간 하이라이트
- 통계 요약 카드

### 5. **분석 리포트 생성**
- 자동 요약 생성
- 맞춤형 추천 사항 제공
- PDF/HTML 출력 지원

## 🛠️ 기술 스택

- **Backend:** PHP 7.1.9
- **Database:** MySQL 5.7
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charting:** Chart.js 4.4.0
- **Integration:** Moodle 3.7 LMS

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 LMS (별도 설치 필요)

## 🚀 설치 방법

### 1. 파일 배포

```bash
# 웹 서버 루트 디렉토리에 복사
cd /var/www/html
cp -r /path/to/concentration-analyzer .
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < concentration-analyzer/database/schema.sql
```

### 3. 설정 파일 수정

`includes/config.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
// 메인 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'concentration_analyzer');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 데이터베이스 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 4. 권한 설정

```bash
# 디렉토리 권한 설정
chmod -R 755 concentration-analyzer/
chown -R www-data:www-data concentration-analyzer/

# 로그 디렉토리 생성 (선택)
mkdir concentration-analyzer/logs
chmod 777 concentration-analyzer/logs
```

### 5. 웹 브라우저 접속

```
http://your-domain.com/concentration-analyzer/
```

## 📖 사용 방법

### 1단계: Moodle 데이터 동기화

1. 대시보드 상단의 **"🔄 Moodle 데이터 동기화"** 버튼 클릭
2. Moodle 로그 테이블에서 사용자 활동 데이터를 가져옵니다

### 2단계: 분석 대상 선택

1. **사용자** 드롭다운에서 분석할 학습자 선택
2. **코스 ID** 자동 입력 (또는 수동 입력)
3. **시작 날짜**와 **종료 날짜** 선택

### 3단계: 집중도 분석 실행

1. **"🔍 집중도 분석 실행"** 버튼 클릭
2. 시스템이 자동으로:
   - 시간 윈도우별 집중도 계산
   - 들쭉날쭉한 구간 탐지
   - 통계 생성

### 4단계: 결과 확인

1. **"📈 데이터 불러오기"** 버튼으로 결과 시각화
2. 그래프에서 집중도 추이 확인
3. 표에서 변동 구간 상세 정보 확인

## 📊 집중도 계산 방식

### 점수 구성 (0-100점)

| 구성 요소 | 가중치 | 설명 |
|---------|--------|------|
| 활동 빈도 | 30점 | 시간 윈도우 내 활동 횟수 |
| 클릭률 | 25점 | 분당 클릭 수 (최적: 3-10회/분) |
| 일관성 | 25점 | 활동 간 시간 간격의 균일성 |
| 응답 시간 | 20점 | 활동 간 평균 시간 (빠를수록 좋음) |

### 변동 탐지 알고리즘

```
Z-점수 = (실제 값 - 평균) / 표준편차

- 급상승: Z-점수 > 1.5
- 급하락: Z-점수 < -1.5
- 심각도:
  * Low: 1.5 ≤ |Z| < 2.0
  * Medium: 2.0 ≤ |Z| < 3.0
  * High: |Z| ≥ 3.0
```

## 🔌 API 엔드포인트

### Moodle 동기화
```bash
POST /api/moodle_sync.php
{
  "action": "sync",
  "user_id": 123,
  "course_id": 456,
  "from_timestamp": 1234567890
}
```

### 집중도 분석
```bash
POST /api/analyze_patterns.php
{
  "action": "full_analysis",
  "user_id": 123,
  "course_id": 456,
  "start_time": 1234567890,
  "end_time": 1234567890
}
```

### 데이터 조회
```bash
GET /api/get_concentration_data.php?action=metrics&user_id=123&course_id=456
```

### 리포트 생성
```bash
POST /api/generate_report.php
{
  "action": "generate",
  "user_id": 123,
  "course_id": 456,
  "start_time": 1234567890,
  "end_time": 1234567890
}
```

## 🗂️ 프로젝트 구조

```
concentration-analyzer/
├── index.php                  # 메인 대시보드
├── api/
│   ├── moodle_sync.php       # Moodle 데이터 동기화
│   ├── analyze_patterns.php   # 집중도 분석 실행
│   ├── get_concentration_data.php  # 데이터 조회
│   └── generate_report.php    # 리포트 생성
├── includes/
│   ├── config.php            # 설정 파일
│   ├── db.php                # 데이터베이스 연결
│   └── analyzer.php          # 분석 엔진
├── assets/
│   ├── css/
│   │   └── style.css         # 스타일시트
│   ├── js/
│   │   └── app.js            # 메인 JavaScript
│   └── vendor/
│       └── chart.min.js      # Chart.js 라이브러리
└── database/
    └── schema.sql            # 데이터베이스 스키마
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **user_activity_logs** - Moodle 활동 로그
2. **concentration_metrics** - 집중도 계산 결과
3. **fluctuation_analysis** - 변동 구간 분석
4. **analysis_reports** - 생성된 리포트
5. **sync_history** - 동기화 이력

## 🔒 보안 고려사항

- SQL Injection 방지 (PDO Prepared Statements)
- XSS 방지 (HTML 이스케이핑)
- CSRF 토큰 사용 권장
- 데이터베이스 자격 증명 보안
- HTTPS 사용 권장

## 🐛 문제 해결

### Moodle 연결 오류
```
Error: Moodle 데이터베이스 연결 실패
```
**해결:** `includes/config.php`에서 Moodle DB 정보 확인

### 데이터가 표시되지 않음
```
Empty chart or table
```
**해결:**
1. Moodle 동기화 실행
2. 집중도 분석 실행
3. 날짜 범위 확인

### 권한 오류
```
Error: Permission denied
```
**해결:**
```bash
chmod -R 755 concentration-analyzer/
chown -R www-data:www-data concentration-analyzer/
```

## 📈 성능 최적화

- 인덱스 활용 (user_id, course_id, time_window_start)
- 데이터 배치 처리 (10,000개씩)
- 캐싱 고려 (Redis/Memcached)
- 비동기 분석 작업 (Cron Job)

## 🔄 업그레이드 가이드

### 데이터베이스 마이그레이션
```bash
# 백업
mysqldump -u root -p concentration_analyzer > backup.sql

# 새 스키마 적용
mysql -u root -p concentration_analyzer < database/migration.sql
```

## 📝 라이선스

MIT License

## 👥 지원 및 기여

- **이슈 리포트:** GitHub Issues
- **문의:** support@example.com

## 🎓 학술 참조

집중도 분석 알고리즘은 다음 연구를 기반으로 합니다:
- 교육 데이터 마이닝 (Educational Data Mining)
- 시계열 이상 탐지 (Time Series Anomaly Detection)
- 학습 분석학 (Learning Analytics)

---

**개발 환경:** PHP 7.1.9, MySQL 5.7, Moodle 3.7
**버전:** 1.0.0
**최종 업데이트:** 2025
