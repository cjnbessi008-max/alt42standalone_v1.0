# LMS 학습 리듬 분석 시스템

Moodle LMS와 연동하여 학습자의 사고 루틴과 학습 리듬 흐름을 분석하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 🎯 학습 리듬 분석
- **패턴 유형 분석**: 일일형, 주간형, 집중형, 분산형 학습 패턴 식별
- **최적 학습 시간대**: 개인별 집중도가 높은 시간대 추천
- **학습 규칙성 점수**: 학습 패턴의 일관성 평가
- **일일 집중도 추이**: 30일간의 학습 집중도 변화 시각화

### 🧠 사고 루틴 분석
- **사고 유형**: 빠른 사고형, 신중한 사고형, 다양한 사고형 분류
- **응답 시간 패턴**: 문제 풀이 속도 분석 및 분포
- **반복 학습 패턴**: 복습 및 재시도 습관 분석
- **오답 수정률**: 오답 후 정답 달성 비율
- **문제 풀이 방식**: 순차적, 선택적, 무작위 접근 방식 파악

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js 3.9.1
- **LMS**: Moodle 3.7 (Web Services API)

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 이상 (Web Services 활성화 필요)
- PHP Extensions:
  - PDO
  - PDO_MySQL
  - cURL
  - JSON

## 설치 방법

### 1. 파일 다운로드 및 배치

```bash
# 웹 서버의 루트 디렉토리에 프로젝트 복사
cp -r lms-rhythm-analysis /var/www/html/

# 또는 원하는 위치에 배치
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

`.env` 파일에서 다음 항목을 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_NAME=lms_rhythm_analysis
DB_USER=your_db_user
DB_PASS=your_db_password

# Moodle 설정
MOODLE_URL=http://your-moodle-site.com
MOODLE_WS_TOKEN=your_web_service_token
```

### 4. Moodle Web Services 설정

Moodle 관리자 페널에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**로 이동
2. 웹 서비스 활성화
3. REST 프로토콜 활성화
4. 웹 서비스 사용자 생성 또는 기존 사용자에 권한 부여
5. 외부 서비스 생성 및 다음 함수 추가:
   - `core_user_get_users`
   - `core_enrol_get_users_courses`
   - `core_course_get_contents`
   - `core_completion_get_activities_completion_status`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_attempt_review`
   - `core_webservice_get_site_info`
6. 토큰 생성 후 `.env`에 추가

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여
chown -R www-data:www-data lms-rhythm-analysis
chmod -R 755 lms-rhythm-analysis
```

## 사용 방법

### 1. 로그인

1. 브라우저에서 `http://your-server/lms-rhythm-analysis/public/` 접속
2. Moodle 사용자 ID 입력
3. 로그인 버튼 클릭

### 2. 데이터 수집

1. 대시보드에서 **"데이터 수집"** 버튼 클릭
2. 시스템이 자동으로 Moodle에서 학습 데이터 가져오기
3. 수집된 활동 개수 확인

### 3. 분석 실행

1. **"분석 실행"** 버튼 클릭
2. 리듬 패턴 및 사고 루틴 자동 분석
3. 대시보드에서 결과 확인

### 4. 결과 해석

#### 리듬 패턴
- **규칙성 점수**: 80점 이상 = 매우 규칙적, 60-79 = 규칙적, 40-59 = 보통, 40 미만 = 불규칙
- **패턴 강도**: 높을수록 예측 가능한 학습 패턴
- **최적 학습 시간**: 가장 집중도가 높은 시간대

#### 사고 루틴
- **빠른 사고형**: 직관적, 빠른 판단, 문제 해결 속도 중시
- **신중한 사고형**: 분석적, 심사숙고, 정확도 중시
- **다양한 사고형**: 상황에 따라 유연하게 대응

## 프로젝트 구조

```
lms-rhythm-analysis/
├── config/
│   └── database.php           # 데이터베이스 연결 설정
├── src/
│   ├── api/
│   │   └── moodle_connector.php   # Moodle API 연동
│   ├── models/
│   │   └── learning_data.php      # 학습 데이터 수집/저장
│   ├── analysis/
│   │   ├── rhythm_analyzer.php    # 리듬 분석 알고리즘
│   │   └── routine_analyzer.php   # 루틴 분석 알고리즘
│   └── utils/
│       └── helpers.php            # 유틸리티 함수
├── public/
│   ├── index.php              # 로그인 페이지
│   ├── dashboard.php          # 분석 대시보드
│   ├── css/
│   │   └── style.css         # 스타일시트
│   └── js/
│       └── charts.js         # 차트 설정 (미래 확장용)
├── database/
│   └── schema.sql            # 데이터베이스 스키마
├── .env.example              # 환경 변수 예제
└── README.md                 # 문서 (본 파일)
```

## 데이터베이스 스키마

### 주요 테이블

1. **users**: Moodle 사용자 정보 캐시
2. **learning_activities**: 학습 활동 로그
3. **quiz_responses**: 퀴즈 응답 상세 데이터
4. **learning_sessions**: 학습 세션 정보
5. **rhythm_patterns**: 리듬 패턴 분석 결과
6. **thinking_routines**: 사고 루틴 분석 결과
7. **daily_focus_snapshots**: 일일 집중도 스냅샷

## 분석 알고리즘 상세

### 리듬 분석

1. **패턴 유형 결정**
   - 활동 일수 기반 집중도/분산도 계산
   - 요일별/시간대별 분산 분석
   - 엔트로피 기반 패턴 강도 측정

2. **최적 학습 시간**
   - 시간대별 성공률과 집중도 결합
   - 가중 평균으로 최적 시간대 5개 선정

3. **규칙성 점수**
   - 학습 간격의 변동 계수(CV) 계산
   - CV가 낮을수록 높은 점수

### 사고 루틴 분석

1. **사고 유형 분류**
   - 평균 응답 시간과 분산 기반
   - 빠른 사고형: 평균 < 60초, CV < 0.5
   - 신중한 사고형: 평균 > 120초, CV < 0.7

2. **문제 풀이 방식**
   - 문제 순서 패턴 분석
   - 순차율 70% 이상 = 순차적 접근

3. **오답 수정률**
   - 오답 후 재시도하여 정답 달성 비율
   - 학습 효과 측정 지표

## 문제 해결

### Moodle 연결 오류

```
문제: "Moodle API Error" 메시지
해결:
1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 필요한 함수들이 외부 서비스에 추가되었는지 확인
```

### 데이터베이스 연결 오류

```
문제: "Database connection failed"
해결:
1. .env 파일의 DB 설정 확인
2. MySQL 서버가 실행 중인지 확인
3. 사용자 권한 확인
```

### 분석 결과가 표시되지 않음

```
문제: 분석 후에도 결과가 없음
해결:
1. 먼저 "데이터 수집"을 실행했는지 확인
2. 최소 3개 이상의 학습 활동이 있어야 분석 가능
3. 30일 이내의 데이터가 있는지 확인
```

## 보안 고려사항

1. **토큰 보안**: `.env` 파일을 웹에서 접근 불가능한 위치에 보관
2. **SQL Injection**: PDO prepared statements 사용으로 방어
3. **XSS 방어**: 모든 출력에 `htmlspecialchars()` 적용
4. **세션 관리**: PHP 세션으로 사용자 인증 관리

## 향후 개선 사항

- [ ] 다중 사용자 동시 분석
- [ ] 실시간 데이터 동기화
- [ ] 학습 추천 알고리즘
- [ ] 학습 그룹 비교 분석
- [ ] PDF 리포트 생성
- [ ] 이메일 알림 기능
- [ ] API 엔드포인트 제공

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

## 기여

기여를 환영합니다! Pull Request를 통해 개선사항을 제안해주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2024
