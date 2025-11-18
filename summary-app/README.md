# 1문장 핵심 - 학습 요약 시스템

Moodle LMS와 연동하여 학습자가 학습 활동 후 스스로 핵심 내용을 요약하고, AI 피드백을 받을 수 있는 독립형 웹 애플리케이션입니다.

## 📋 주요 기능

### 학습자 기능
- ✅ 학습 활동 완료 후 1-2문장으로 핵심 요약 작성
- ✅ 실시간 글자 수 카운터 (10~200자)
- ✅ AI (Claude) 기반 자동 피드백 생성
  - 명확성, 관련성, 완성도, 종합 점수 평가
  - 구체적인 개선 제안 제공
- ✅ 이전 요약 기록 조회

### 교사 기능
- ✅ 학습자 요약 현황 대시보드
- ✅ 코스/활동별 필터링
- ✅ 통계 (전체 요약 수, 참여 학습자, 평균 점수 등)
- ✅ 학습자 요약에 댓글 및 평가 작성
- ✅ CSV 내보내기 (예정)

### AI 피드백
- ✅ Claude API를 활용한 교육적 피드백
- ✅ 다국어 지원 (한국어/영어)
- ✅ 4가지 평가 기준 (명확성, 관련성, 완성도, 종합)

## 🛠️ 기술 스택

- **백엔드**: PHP 7.1.9
- **데이터베이스**: MySQL 5.7
- **프론트엔드**: HTML5, CSS3, JavaScript (Vanilla)
- **AI**: Claude API (Anthropic)
- **LMS 연동**: Moodle 3.7 Web Services API

## 📁 프로젝트 구조

```
summary-app/
├── config/
│   └── database.php          # 데이터베이스 설정
├── public/
│   ├── index.php             # 학습자용 UI
│   ├── teacher.php           # 교사용 대시보드
│   ├── css/
│   │   └── style.css         # 스타일시트
│   └── js/
│       └── summary.js        # 학습자용 JavaScript
├── src/
│   ├── Database.php          # DB 연결 클래스
│   ├── MoodleClient.php      # Moodle API 클라이언트
│   ├── SummaryService.php    # 요약 관리 서비스
│   └── AIFeedback.php        # AI 피드백 생성
├── api/
│   ├── save_summary.php      # 요약 저장 API
│   ├── get_summaries.php     # 요약 조회 API
│   ├── update_summary.php    # 요약 수정/삭제 API
│   └── generate_feedback.php # AI 피드백 생성 API
├── sql/
│   └── schema.sql            # 데이터베이스 스키마
└── README.md
```

## 🚀 설치 및 설정

### 1. 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (Web Services 활성화)
- Claude API 키 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
mysql -u root -p < sql/schema.sql
```

또는 MySQL 클라이언트에서:
```sql
source /path/to/summary-app/sql/schema.sql;
```

### 3. 환경 변수 설정

`.env` 파일 생성 (선택사항):
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=summary_system
DB_USER=root
DB_PASS=your_password
```

또는 `config/database.php`에서 직접 수정

### 4. 시스템 설정

데이터베이스의 `settings` 테이블에서 다음 값을 설정:

```sql
UPDATE settings SET setting_value = 'https://your-moodle-site.com'
WHERE setting_key = 'moodle_url';

UPDATE settings SET setting_value = 'your_moodle_token'
WHERE setting_key = 'moodle_token';

UPDATE settings SET setting_value = 'your_claude_api_key'
WHERE setting_key = 'claude_api_key';

UPDATE settings SET setting_value = '1'
WHERE setting_key = 'ai_enabled';
```

### 5. Moodle Web Services 설정

Moodle 관리자 페이지에서:

1. **관리 > 사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크

2. **관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - 새 서비스 생성: "Summary System"
   - 필요한 함수 추가:
     - `core_user_get_users_by_field`
     - `core_course_get_courses`
     - `core_enrol_get_users_courses`
     - `core_completion_get_activities_completion_status`
     - `core_webservice_get_site_info`

3. **관리 > 플러그인 > 웹 서비스 > 관리 토큰**
   - 새 토큰 생성 후 `settings` 테이블에 저장

### 6. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /summary-app/public/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

#### Nginx

```nginx
location /summary-app {
    try_files $uri $uri/ /summary-app/public/index.php?$query_string;
}
```

## 📖 사용 방법

### 학습자

1. 학습 활동 완료 후 요약 페이지 접속:
   ```
   http://your-domain/summary-app/public/index.php?user_id=1&course_id=101&activity_id=1001&activity_name=분수의%20이해
   ```

2. 학습 내용을 1-2문장으로 요약 작성

3. "AI 피드백 자동 생성" 체크 (선택)

4. "제출하기" 클릭

5. AI 피드백 확인 (4가지 점수 + 개선 제안)

### 교사

1. 교사 대시보드 접속:
   ```
   http://your-domain/summary-app/public/teacher.php
   ```

2. 코스/활동별 필터링하여 학습자 요약 확인

3. 각 요약에 댓글 및 별점 평가 작성

4. 통계 데이터 확인

5. CSV로 내보내기 (곧 지원)

## 🔌 API 엔드포인트

### 요약 저장
```http
POST /api/save_summary.php
Content-Type: application/json

{
  "moodle_user_id": 1,
  "moodle_course_id": 101,
  "moodle_activity_id": 1001,
  "activity_type": "quiz",
  "activity_name": "분수의 이해",
  "summary_text": "분수는 전체를 똑같이 나눈 것 중 일부를 나타내는 수입니다.",
  "generate_feedback": true
}
```

### 요약 조회
```http
GET /api/get_summaries.php?user_id=1
GET /api/get_summaries.php?course_id=101
GET /api/get_summaries.php?activity_id=1001
GET /api/get_summaries.php?summary_id=1
```

### AI 피드백 생성
```http
POST /api/generate_feedback.php
Content-Type: application/json

{
  "summary_id": 1
}
```

### 요약 수정
```http
PUT /api/update_summary.php
Content-Type: application/json

{
  "summary_id": 1,
  "user_id": 1,
  "summary_text": "수정된 요약 내용"
}
```

### 요약 삭제
```http
DELETE /api/update_summary.php
Content-Type: application/json

{
  "summary_id": 1,
  "user_id": 1
}
```

## 🎨 커스터마이징

### CSS 스타일 변경

`public/css/style.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #4a90e2;     /* 기본 색상 */
    --success-color: #27ae60;     /* 성공 색상 */
    --warning-color: #f39c12;     /* 경고 색상 */
    --danger-color: #e74c3c;      /* 위험 색상 */
}
```

### AI 프롬프트 수정

`src/AIFeedback.php`의 `buildPrompt()` 메소드에서 프롬프트 커스터마이징

### 글자 수 제한 변경

데이터베이스 `settings` 테이블:
```sql
UPDATE settings SET setting_value = '300'
WHERE setting_key = 'max_summary_length';

UPDATE settings SET setting_value = '20'
WHERE setting_key = 'min_summary_length';
```

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: `htmlspecialchars()` 사용
3. **CSRF 방지**: 토큰 기반 인증 (추가 구현 권장)
4. **API 키 보안**: 환경 변수 또는 암호화된 설정 사용
5. **권한 체크**: 요약 수정/삭제 시 사용자 권한 확인

## 📊 데이터베이스 스키마

### summaries
학습자 요약 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_user_id | INT | Moodle 사용자 ID |
| moodle_course_id | INT | Moodle 코스 ID |
| moodle_activity_id | INT | Moodle 활동 ID |
| activity_type | VARCHAR(50) | 활동 유형 |
| activity_name | VARCHAR(255) | 활동 이름 |
| summary_text | TEXT | 요약 내용 |
| word_count | INT | 글자 수 |
| created_at | TIMESTAMP | 작성일시 |
| updated_at | TIMESTAMP | 수정일시 |

### ai_feedback
AI 피드백

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| summary_id | INT | 요약 ID (FK) |
| feedback_text | TEXT | 피드백 내용 |
| clarity_score | DECIMAL(3,2) | 명확성 점수 |
| relevance_score | DECIMAL(3,2) | 관련성 점수 |
| completeness_score | DECIMAL(3,2) | 완성도 점수 |
| overall_score | DECIMAL(3,2) | 종합 점수 |
| suggestions | TEXT | 개선 제안 |
| created_at | TIMESTAMP | 생성일시 |

## 🐛 트러블슈팅

### 데이터베이스 연결 오류
- `config/database.php`의 접속 정보 확인
- MySQL 서비스 실행 여부 확인
- 사용자 권한 확인

### Moodle API 오류
- Web Services 활성화 확인
- 토큰 유효성 확인
- 필요한 함수가 서비스에 추가되었는지 확인

### AI 피드백 생성 실패
- Claude API 키 확인
- `ai_enabled` 설정 확인
- API 요청 제한 확인 (Rate Limit)

## 🔄 업데이트 계획

- [ ] 교사 댓글 기능 완성
- [ ] CSV 내보내기 기능
- [ ] 요약 통계 그래프 시각화
- [ ] 모바일 앱 연동
- [ ] 다중 언어 완전 지원
- [ ] 요약 품질 트렌드 분석
- [ ] 학습자 간 우수 요약 공유 기능

## 📝 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy - AI Education System Team

## 📧 문의

기술 지원이 필요하면 이슈를 등록해주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
