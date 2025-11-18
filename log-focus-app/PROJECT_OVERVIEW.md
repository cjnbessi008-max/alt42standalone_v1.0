# Log Focus - 프로젝트 개요

## 📱 프로젝트 소개

**Log Focus**는 Moodle 3.7 LMS와 연동하여 학생 활동 로그를 실시간으로 수집하고, 우측 하단의 가상 스마트폰 화면에서 핵심 키워드를 자동으로 하이라이트하여 표시하는 독립형 웹 애플리케이션입니다.

### 주요 특징

- ✨ **자동 키워드 하이라이트**: 로그의 중요 키워드를 7가지 카테고리로 자동 색상 강조
- 📱 **가상 스마트폰 UI**: 우측 하단 고정 위치에 모바일 화면 시뮬레이션
- 🔄 **Moodle 실시간 연동**: Web Service API를 통한 실시간 데이터 동기화
- 📊 **실시간 통계**: 성공/실패/경고 로그 실시간 집계
- 🔍 **고급 필터링**: 사용자, 활동 유형, 날짜별 로그 필터링
- ⚡ **자동 새로고침**: 5초 간격 자동 업데이트

## 🎯 사용 사례

### 교육자 관점
- 학생들의 퀴즈/과제 제출 상태 실시간 모니터링
- 오류 및 타임아웃 발생 즉시 파악
- 학습 활동 패턴 분석

### 관리자 관점
- 시스템 오류 및 경고 신속 대응
- 사용자 활동 로그 감사 추적
- LMS 성능 모니터링

### 개발자 관점
- Moodle API 연동 샘플 코드
- 키워드 하이라이팅 시스템 참고
- 독립형 웹앱 아키텍처 학습

## 🏗️ 아키텍처

### 기술 스택

```
Frontend:
├── HTML5
├── CSS3 (Flexbox, Grid, Animations)
└── Vanilla JavaScript (ES6+)

Backend:
├── PHP 7.1.9+
├── MySQL 5.7
└── Moodle 3.7 Web Services

Server:
└── Apache 2.4+ / Nginx 1.14+
```

### 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  Control     │              │   Virtual    │        │
│  │   Panel      │              │  Smartphone  │        │
│  │              │              │    Screen    │        │
│  └──────┬───────┘              └──────┬───────┘        │
└─────────┼──────────────────────────────┼───────────────┘
          │                              │
          └──────────┬───────────────────┘
                     │ AJAX (fetch API)
          ┌──────────▼───────────────────────────────────┐
          │         log_api.php (REST API)               │
          │  ┌─────────────────────────────────────┐    │
          │  │  • get_logs()                       │    │
          │  │  • get_keywords()                   │    │
          │  │  • sync_moodle()                    │    │
          │  │  • add_log()                        │    │
          │  └─────────────────────────────────────┘    │
          └──────────┬───────────┬──────────────────────┘
                     │           │
         ┌───────────▼──┐   ┌───▼─────────────────┐
         │   MySQL DB   │   │  moodle_connector   │
         │              │   │                     │
         │ • activity   │   │  • getQuizAttempts  │
         │   _logs      │   │  • parseLogData     │
         │ • highlight  │   │  • API calls        │
         │   _keywords  │   └──────────┬──────────┘
         │ • sync       │              │
         │   _status    │              │ cURL
         └──────────────┘   ┌──────────▼──────────┐
                            │  Moodle 3.7 API     │
                            │  (Web Services)     │
                            └─────────────────────┘
```

## 📂 프로젝트 구조

```
log-focus-app/
│
├── config/                      # 설정 파일
│   ├── database.php            # DB 연결 설정 (Singleton 패턴)
│   └── moodle.php              # Moodle API 설정
│
├── api/                         # 백엔드 API
│   ├── moodle_connector.php    # Moodle Web Service 연동
│   │   ├── callMoodleAPI()     # API 호출 (캐싱 포함)
│   │   ├── getQuizAttempts()   # 퀴즈 시도 데이터 가져오기
│   │   ├── parseLogData()      # 로그 데이터 파싱
│   │   └── formatLogMessage()  # 로그 메시지 포맷팅
│   │
│   └── log_api.php             # REST API 엔드포인트
│       ├── getLogs()           # 로그 조회 (필터링)
│       ├── addLog()            # 로그 추가
│       ├── getHighlightKeywords() # 키워드 설정 조회
│       └── syncFromMoodle()    # Moodle 동기화
│
├── public/                      # 프론트엔드 (공개 디렉토리)
│   ├── index.php               # 메인 페이지
│   │
│   ├── css/
│   │   └── style.css           # 전체 스타일시트
│   │       ├── 가상 스마트폰 UI
│   │       ├── 키워드 하이라이트 스타일
│   │       ├── 컨트롤 패널
│   │       └── 반응형 디자인
│   │
│   ├── js/
│   │   └── log-focus.js        # 메인 JavaScript (ES6 Class)
│   │       ├── LogFocus class
│   │       ├── loadLogs()      # 로그 로드
│   │       ├── highlightKeywords() # 키워드 하이라이트
│   │       ├── displayLogs()   # 로그 표시
│   │       └── syncWithMoodle() # Moodle 동기화
│   │
│   └── .htaccess               # Apache 설정
│
├── database/                    # 데이터베이스 스크립트
│   ├── schema.sql              # DB 스키마 (테이블 정의)
│   │   ├── activity_logs       # 활동 로그 테이블
│   │   ├── highlight_keywords  # 키워드 설정 테이블
│   │   ├── sync_status         # 동기화 상태 테이블
│   │   └── user_preferences    # 사용자 설정 테이블
│   │
│   └── sample_data.sql         # 샘플 데이터 (테스트용)
│
├── test.php                     # 시스템 테스트 스크립트
├── install.sh                   # 자동 설치 스크립트
├── README.md                    # 사용자 문서
├── INSTALL_GUIDE.md            # 설치 가이드
└── PROJECT_OVERVIEW.md         # 이 문서
```

## 🎨 키워드 하이라이트 시스템

### 작동 원리

1. **데이터베이스에서 키워드 로드**
   ```javascript
   await loadKeywords() // highlight_keywords 테이블에서 로드
   ```

2. **로그 메시지 분석**
   ```javascript
   highlightKeywords(text) // 정규식 매칭
   ```

3. **HTML 하이라이트 적용**
   ```javascript
   <span class="highlight highlight-error">ERROR</span>
   ```

### 키워드 카테고리

| 카테고리 | 설명 | 예시 키워드 | 색상 코드 | 우선순위 |
|---------|-----|-----------|---------|---------|
| **error** | 오류 및 실패 | ERROR, FAIL, EXCEPTION | #ff4444 | 10 |
| **warning** | 경고 | WARNING, ALERT, TIMEOUT | #ff9800 | 9 |
| **success** | 성공 | SUCCESS, PASS, CORRECT | #4caf50 | 8 |
| **action** | 학생 행동 | SUBMIT, ATTEMPT, ANSWER | #2196f3 | 7 |
| **problem** | 문제 관련 | QUIZ, GRADE, SCORE | #9c27b0 | 6 |
| **negative** | 부정적 결과 | INCORRECT, WRONG | #ff5722 | 8 |
| **time** | 시간 관련 | DEADLINE, END | #009688 | 6 |

### 하이라이트 알고리즘

```javascript
// 1. 키워드를 길이 순으로 정렬 (긴 것부터)
keywords.sort((a, b) => b.keyword.length - a.keyword.length);

// 2. 각 키워드에 대해 단어 경계 매칭
const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');

// 3. HTML 스타일 적용
text.replace(regex, `<span class="highlight-${category}">${match}</span>`);
```

## 🔄 Moodle 연동 흐름

### 1. 인증 및 연결
```
User → Quiz ID 입력 → Sync 버튼 클릭
  ↓
log-focus.js → syncWithMoodle()
  ↓
log_api.php?action=sync_moodle&quiz_id=123
  ↓
moodle_connector.php → callMoodleAPI()
  ↓
Moodle Web Service (HTTPS + Token)
```

### 2. 데이터 처리
```
Moodle Response (JSON)
  ↓
parseLogData() → 표준 포맷 변환
  ↓
activity_logs 테이블에 저장
  ↓
Frontend에 응답
  ↓
displayLogs() → 하이라이트 적용
  ↓
가상 스마트폰 화면에 표시
```

## 📊 데이터베이스 스키마

### activity_logs 테이블
```sql
id                 INT AUTO_INCREMENT PRIMARY KEY
moodle_user_id     INT NOT NULL
user_name          VARCHAR(255)
activity_type      VARCHAR(100)      -- QUIZ, ASSIGNMENT, etc.
problem_id         INT
problem_name       VARCHAR(255)
action             VARCHAR(100)      -- STARTED, SUBMITTED, etc.
result             VARCHAR(50)       -- PASS, FAIL, etc.
score              DECIMAL(5,2)
log_message        TEXT              -- 실제 로그 메시지
raw_data           JSON              -- Moodle 원본 데이터
created_at         TIMESTAMP
```

### highlight_keywords 테이블
```sql
id          INT AUTO_INCREMENT PRIMARY KEY
keyword     VARCHAR(100) UNIQUE
category    VARCHAR(50)
color       VARCHAR(20)
is_active   TINYINT(1)
priority    INT
```

## 🚀 주요 기능 구현

### 1. 실시간 로그 표시
```javascript
class LogFocus {
    async loadLogs(filters = {}) {
        const response = await fetch(`api/log_api.php?action=get_logs&...`);
        const data = await response.json();
        this.displayLogs(data);
    }
}
```

### 2. 자동 새로고침
```javascript
toggleAutoRefresh() {
    this.refreshInterval = setInterval(() => {
        this.loadLogs();
    }, 5000); // 5초마다
}
```

### 3. 필터링
```sql
SELECT * FROM activity_logs
WHERE moodle_user_id = :user_id
  AND activity_type = :activity_type
  AND created_at >= :from_date
ORDER BY created_at DESC
LIMIT 100
```

## 🔒 보안 기능

### SQL Injection 방지
```php
$stmt = $db->prepare("SELECT * FROM activity_logs WHERE id = :id");
$stmt->execute([':id' => $id]);
```

### XSS 방지
```javascript
// 사용자 입력은 하이라이트 전에 이스케이프
message.textContent = userInput; // innerHTML 대신 textContent
```

### API 인증
```php
// Moodle 토큰 기반 인증
$params['wstoken'] = MOODLE_TOKEN;
```

## 📈 성능 최적화

### 1. 데이터베이스 인덱싱
```sql
INDEX idx_user_id (moodle_user_id)
INDEX idx_created_at (created_at)
INDEX idx_activity_type (activity_type)
```

### 2. API 응답 캐싱
```php
if (time() - $cached['time'] < CACHE_DURATION) {
    return $cached['data'];
}
```

### 3. 프론트엔드 최적화
- CSS/JS 파일 압축 (mod_deflate)
- 브라우저 캐싱 (mod_expires)
- 로그 제한 (최대 100개)

## 🧪 테스트

### 단위 테스트
```bash
php test.php
```

체크 항목:
- PHP 버전 및 확장
- 데이터베이스 연결
- Moodle 설정
- API 엔드포인트
- 파일 권한

### 통합 테스트
1. 샘플 데이터 로드
2. 로그 표시 확인
3. 키워드 하이라이트 확인
4. 필터링 기능 확인
5. Moodle 동기화 확인

## 📋 향후 개선 사항

### 단기 (1-2개월)
- [ ] 사용자 인증 시스템 추가
- [ ] 로그 검색 기능
- [ ] 다크 모드 지원
- [ ] 로그 내보내기 (CSV, PDF)

### 중기 (3-6개월)
- [ ] 실시간 알림 (WebSocket)
- [ ] 대시보드 위젯 커스터마이징
- [ ] 모바일 앱 (PWA)
- [ ] 다국어 지원

### 장기 (6개월+)
- [ ] 머신러닝 기반 이상 탐지
- [ ] 자동 리포트 생성
- [ ] 다른 LMS 지원 (Canvas, Blackboard)
- [ ] 클러스터 환경 지원

## 🤝 기여 가이드

### 코드 스타일
- PHP: PSR-12
- JavaScript: ES6+, Airbnb Style
- CSS: BEM 방법론

### Pull Request 프로세스
1. Fork 프로젝트
2. Feature 브랜치 생성
3. 커밋 메시지 규칙 준수
4. 테스트 통과 확인
5. PR 생성

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 👥 개발팀

- **Lead Developer**: Log Focus Team
- **Architecture**: Full Stack
- **Technologies**: PHP, MySQL, JavaScript, Moodle

## 📞 지원

- **GitHub Issues**: 버그 리포트 및 기능 제안
- **Email**: support@logfocus.example.com
- **Documentation**: README.md, INSTALL_GUIDE.md

---

**Version**: 1.0.0
**Last Updated**: 2024
**Status**: Production Ready ✅
