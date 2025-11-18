# Moodle 연동 가이드

## 개요

Jump Thinking Detection System은 LTI (Learning Tools Interoperability) 1.1 표준을 사용하여 Moodle 3.7과 연동됩니다.

## LTI 연동 방식

### LTI란?

LTI는 학습 관리 시스템(LMS)과 외부 교육 도구 간의 표준 연동 프로토콜입니다.

**장점:**
- 표준 프로토콜로 호환성이 높음
- Single Sign-On (SSO) 지원
- 성적 자동 전송 (Grade Passback)
- 사용자 정보 자동 동기화

## Moodle 설정 방법

### 1. 외부 도구 구성

#### 단계별 설정:

1. **Moodle 관리자 대시보드 접속**
   - 사이트 관리 메뉴 클릭

2. **외부 도구 관리**
   - 사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구 > 도구 구성

3. **새 외부 도구 추가**
   - "도구 수동으로 구성" 클릭

#### 도구 구성 정보:

| 필드 | 값 |
|------|-----|
| 도구 이름 | Jump Thinking Detection |
| 도구 URL | `https://your-domain.com/lti_launch.php` |
| Consumer Key | `moodle_demo_key` (또는 사용자 지정) |
| Shared Secret | `moodle_demo_secret_12345` (또는 사용자 지정) |
| Launch Container | Embed (iframe 권장) |
| 도구 구성 사용 | LTI 1.0/1.1 |

#### 프라이버시 설정:

- ✅ **론처의 이름을 도구와 공유**
- ✅ **론처의 이메일을 도구와 공유**
- ✅ **이름을 수락**
- ✅ **이메일 주소를 수락**

#### 서비스 설정:

- ✅ **IMS LTI Outcomes 사용** (성적 전송)

### 2. 코스에 활동 추가

1. **코스 편집 모드 켜기**
   - 코스 페이지에서 "편집 모드 켜기" 클릭

2. **활동 추가**
   - 섹션에서 "활동 또는 리소스 추가" 클릭
   - "외부 도구" 선택

3. **도구 선택**
   - 이전에 구성한 "Jump Thinking Detection" 선택
   - 활동 이름 입력 (예: "분수 계산 연습")

4. **추가 설정 (선택사항)**
   - 완료 조건 설정
   - 제한 조건 (날짜, 성적 등)
   - 성적 범위 설정 (0-100)

5. **저장**

### 3. 학생 접근 테스트

1. 학생 계정으로 로그인
2. 해당 코스 접속
3. Jump Thinking 활동 클릭
4. 자동으로 외부 시스템으로 이동

---

## 성적 전송 (Grade Passback)

### 자동 성적 전송

시스템은 학생이 문제 세트를 완료하면 자동으로 Moodle에 성적을 전송합니다.

#### 성적 계산 방식:

```
최종 성적 = (정답 수 / 전체 문제 수) × 100
```

#### 코드 예시:

```php
// src/LTI/LTIProvider.php에서
$score = $correctAnswers / $totalProblems; // 0.0 - 1.0
$ltiProvider->sendGrade($outcomeUrl, $sourcedId, $score, $consumerKey, $consumerSecret);
```

### 수동 성적 확인

Moodle 성적표에서:
1. 코스 > 성적
2. Jump Thinking 활동 열 확인
3. 학생별 성적 표시

---

## 사용자 역할 매핑

| Moodle 역할 | LTI 역할 | 시스템 역할 |
|-------------|----------|------------|
| Teacher (교사) | Instructor | teacher |
| Non-editing teacher | Instructor | teacher |
| Student (학생) | Learner | student |
| Manager (관리자) | Instructor | teacher |

---

## 문제 해결

### 1. "Invalid OAuth signature" 오류

**원인:**
- Consumer Key 또는 Secret 불일치
- URL 불일치 (http vs https)
- 시간 동기화 문제

**해결:**
```bash
# .env 파일 확인
cat .env | grep LTI

# Moodle 설정과 비교
# Consumer Key와 Secret이 정확히 일치해야 함

# 시스템 시간 확인
date
ntpdate pool.ntp.org  # 시간 동기화
```

### 2. "Consumer is disabled" 오류

**원인:**
- 데이터베이스의 consumer가 비활성화됨

**해결:**
```sql
UPDATE lti_consumers SET enabled = 1 WHERE consumer_key = 'your_key';
```

### 3. 빈 화면 또는 404 오류

**원인:**
- Launch URL이 잘못됨
- Apache rewrite 규칙 문제

**해결:**
```bash
# URL 확인
echo "Launch URL: https://your-domain.com/lti_launch.php"

# .htaccess 확인
cat public/.htaccess

# Apache rewrite 모듈 확인
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 4. 사용자 정보가 표시되지 않음

**원인:**
- 프라이버시 설정이 비활성화됨

**해결:**
- Moodle 외부 도구 설정에서 프라이버시 옵션 모두 체크
- "이름 공유", "이메일 공유" 활성화

### 5. iframe에서 로드되지 않음

**원인:**
- X-Frame-Options 헤더 문제

**해결:**
```apache
# .htaccess에 추가
<Files "lti_launch.php">
    Header set X-Frame-Options "ALLOWALL"
</Files>
```

또는 Moodle에서 Launch Container를 "New Window"로 변경

---

## 고급 설정

### Custom Parameters

Moodle에서 추가 파라미터를 전달할 수 있습니다:

**Moodle 설정:**
```
custom_set_id=1
custom_difficulty=medium
```

**시스템에서 읽기:**
```php
$setId = $_POST['custom_set_id'] ?? 1;
$difficulty = $_POST['custom_difficulty'] ?? 'medium';
```

### Deep Linking (LTI 2.0)

현재 버전은 LTI 1.1만 지원하지만, 향후 LTI 1.3/Advantage로 업그레이드 가능:

- Content Item Selection
- Names and Role Provisioning
- Assignment and Grade Services

---

## 보안 고려사항

### OAuth 서명 검증

모든 LTI 요청은 HMAC-SHA1 서명으로 검증됩니다:

```php
// src/LTI/LTIValidator.php
public function verifyOAuthSignature($params) {
    $baseString = $this->buildOAuthBaseString($params);
    $expectedSignature = $this->calculateSignature($baseString);
    return $this->secureCompare($receivedSignature, $expectedSignature);
}
```

### HTTPS 필수

프로덕션 환경에서는 반드시 HTTPS를 사용하세요:
- SSL 인증서 설치 (Let's Encrypt 무료)
- HTTP를 HTTPS로 리디렉션

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Consumer Secret 관리

- 강력한 비밀키 사용 (최소 32자)
- 정기적으로 변경
- 환경 변수(.env)에만 저장
- Git에 커밋하지 않음

---

## 성능 최적화

### 세션 캐싱

```php
// config/app.php
'cache' => [
    'enabled' => true,
    'driver' => 'redis',  // 또는 'memcached'
    'ttl' => 3600
]
```

### 데이터베이스 인덱스

```sql
-- 이미 schema.sql에 포함됨
CREATE INDEX idx_consumer_key ON lti_consumers(consumer_key);
CREATE INDEX idx_session ON attempts(session_id);
```

---

## 모니터링

### 로그 확인

```bash
# LTI 론치 로그
tail -f logs/lti.log

# 일반 에러 로그
tail -f logs/error.log

# Apache 로그
tail -f /var/log/apache2/error.log
```

### 통계 쿼리

```sql
-- 총 LTI 론치 수
SELECT COUNT(*) FROM student_sessions;

-- 코스별 활동
SELECT context_id, COUNT(*) as launches
FROM student_sessions
GROUP BY context_id;
```

---

## 추가 리소스

- [IMS LTI 1.1 명세](https://www.imsglobal.org/specs/ltiv1p1)
- [Moodle 외부 도구 문서](https://docs.moodle.org/37/en/External_tool)
- [LTI 테스트 도구](https://lti.tools/test)
