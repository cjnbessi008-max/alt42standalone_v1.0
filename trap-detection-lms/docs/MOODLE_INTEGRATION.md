# Moodle LTI 연동 가이드

## 개요

Trap Detection LMS는 LTI 1.1 표준을 사용하여 Moodle 3.7과 연동됩니다. 이 문서는 Moodle에서 Trap Detection LMS를 External Tool로 추가하고 사용하는 방법을 설명합니다.

## LTI (Learning Tools Interoperability)란?

LTI는 학습 관리 시스템(LMS)과 외부 교육 도구를 연결하는 표준 프로토콜입니다.
- **Single Sign-On**: 별도 로그인 없이 자동 인증
- **사용자 정보 전달**: Moodle 사용자 정보 자동 동기화
- **역할 기반 접근**: 학생/교사 역할 자동 구분

## 사전 준비

### 1. Trap Detection LMS 설치

먼저 Trap Detection LMS가 웹 서버에 설치되어 있어야 합니다.
[INSTALLATION.md](INSTALLATION.md) 참조

### 2. LTI 자격 증명 준비

`config/app.php`에서 LTI 설정을 확인하거나 변경합니다:

```php
'lti' => [
    'consumer_key' => 'trap_detection_key',
    'consumer_secret' => 'your_secure_secret_here',
    'session_timeout' => 3600,
],
```

**보안 권장사항:**
- `consumer_secret`을 강력한 비밀번호로 변경하세요
- 최소 20자 이상의 무작위 문자열 사용
- 프로덕션 환경에서는 반드시 변경 필요

## Moodle 설정

### 1. External Tool 관리자 페이지 접속

1. Moodle에 **관리자**로 로그인
2. **사이트 관리** (Site administration) 클릭
3. **플러그인** (Plugins) → **활동 모듈** (Activity modules) → **External tool** → **Manage tools** 클릭

### 2. 새 External Tool 추가

**"Configure a tool manually"** 클릭

### 3. Tool 설정 입력

| 필드 | 값 | 설명 |
|------|-----|------|
| **Tool name** | `Trap Detection LMS` | 도구 이름 (원하는 대로 변경 가능) |
| **Tool URL** | `https://your-domain.com/moodle-integration/lti/launch.php` | LTI launch 엔드포인트 URL |
| **LTI version** | `LTI 1.0/1.1` | 버전 선택 |
| **Consumer key** | `trap_detection_key` | config/app.php의 consumer_key와 동일 |
| **Shared secret** | `your_secure_secret_here` | config/app.php의 consumer_secret과 동일 |
| **Default launch container** | `New window` | 새 창으로 열기 권장 |
| **Tool configuration usage** | `Show in activity chooser and as a preconfigured tool` | 활동 선택기에 표시 |

### 4. Privacy 설정

**중요**: 다음 옵션을 **활성화**하세요:

- ☑ **Share launcher's name with the tool**
- ☑ **Share launcher's email with the tool**
- ☐ Accept grades from the tool (선택사항)

### 5. 저장

**"Save changes"** 클릭

## 과정(Course)에 추가

### 1. 과정 편집 모드 활성화

1. 원하는 과정으로 이동
2. 우측 상단의 **편집 모드 켜기** (Turn editing on) 클릭

### 2. External Tool 활동 추가

1. 원하는 섹션에서 **활동 또는 리소스 추가** (Add an activity or resource) 클릭
2. **External tool** 선택
3. **추가** (Add) 클릭

### 3. 활동 설정

| 필드 | 값 |
|------|-----|
| **Activity name** | `함정 탐지 학습 시스템` (원하는 이름) |
| **Preconfigured tool** | `Trap Detection LMS` (위에서 설정한 도구 선택) |
| **Launch container** | `New window` |

### 4. 저장

**"Save and display"** 또는 **"Save and return to course"** 클릭

## 사용 방법

### 학생 입장

1. Moodle 과정에서 **Trap Detection LMS** 활동 클릭
2. 자동으로 로그인되어 학생 모드로 이동
3. 문제를 풀고 함정 탐지 피드백 받기

### 교사 입장

1. Moodle 과정에서 **Trap Detection LMS** 활동 클릭
2. 자동으로 로그인되어 교사 대시보드로 이동
3. 학생들의 함정 통계 및 분석 확인

## 테스트

### 1. 기본 연동 테스트

1. 학생 계정으로 Moodle 로그인
2. Trap Detection LMS 활동 클릭
3. 자동 로그인 확인
4. 문제 풀이 테스트

### 2. 역할 확인 테스트

**학생 계정:**
- 학생 모드로 접속되는지 확인
- 문제 풀이 화면이 표시되는지 확인

**교사 계정:**
- 교사 대시보드로 접속되는지 확인
- 통계 데이터가 표시되는지 확인

### 3. 사용자 동기화 테스트

1. Trap Detection LMS 데이터베이스 확인:
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

2. Moodle에서 접속한 사용자가 자동으로 생성되었는지 확인

## 문제 해결

### "Invalid LTI request" 오류

**원인:**
- Consumer key 또는 shared secret 불일치
- OAuth 서명 검증 실패
- 서버 시간 차이

**해결 방법:**

1. **Key/Secret 확인:**
```bash
# Trap Detection LMS 설정 확인
cat config/app.php | grep -A 5 "'lti'"
```

Moodle의 consumer key와 shared secret이 정확히 일치하는지 확인

2. **서버 시간 확인:**
```bash
date
```

서버 시간이 정확한지 확인 (OAuth는 타임스탬프 검증)

3. **로그 확인:**
```bash
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

### "Database connection failed" 오류

**해결 방법:**
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 데이터베이스 연결 테스트
mysql -u root -p -e "USE trap_detection_lms; SELECT COUNT(*) FROM users;"
```

### 사용자가 생성되지 않음

**확인 사항:**

1. Privacy 설정에서 사용자 정보 공유가 활성화되어 있는지 확인
2. LTI 요청에 user_id가 포함되어 있는지 확인

**디버깅:**
```php
// moodle-integration/lti/launch.php에 임시로 추가
error_log("LTI POST data: " . print_r($_POST, true));
```

### HTTPS 관련 오류

**권장사항:**
프로덕션 환경에서는 반드시 HTTPS 사용

```bash
# Let's Encrypt SSL 인증서 설치
sudo certbot --apache -d your-domain.com
```

## 고급 설정

### 1. Grade 동기화 (선택사항)

Moodle로 점수를 다시 보내려면:

1. Tool 설정에서 **"Accept grades from the tool"** 활성화
2. Trap Detection LMS에 Grade 전송 기능 구현 필요

### 2. Custom Parameters

특정 문제 또는 퀴즈를 지정하려면:

Moodle External tool 설정에서:
```
question_id=5
quiz_id=10
```

LTI launch.php에서 받아서 사용:
```php
$questionId = $_POST['custom_question_id'] ?? null;
```

### 3. Deep Linking (LTI 1.3)

향후 LTI 1.3 업그레이드 시 Deep Linking 지원 계획

## 보안 체크리스트

- [ ] HTTPS 사용 (프로덕션 필수)
- [ ] Strong shared secret 설정 (20자 이상)
- [ ] Privacy 설정 확인
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 로그 모니터링 활성화
- [ ] 정기적인 보안 업데이트

## 성능 최적화

### 1. 세션 타임아웃 조정

```php
// config/app.php
'lti' => [
    'session_timeout' => 7200, // 2시간으로 증가
],
```

### 2. 데이터베이스 인덱스 확인

```sql
SHOW INDEX FROM lti_sessions;
SHOW INDEX FROM users;
```

### 3. 캐싱 활성화

향후 Redis 또는 Memcached 통합 계획

## 참고 자료

- [LTI 1.1 Specification](https://www.imsglobal.org/specs/ltiv1p1/implementation-guide)
- [Moodle LTI Documentation](https://docs.moodle.org/en/External_tool)
- [OAuth 1.0 Specification](https://oauth.net/core/1.0/)

## 지원

문제가 발생하면:

1. **로그 확인**: `/var/log/apache2/error.log`
2. **데이터베이스 확인**: `lti_sessions` 테이블
3. **이슈 등록**: GitHub Issues

---

**Moodle LTI 연동 완료!** 🎉

이제 Moodle에서 Trap Detection LMS를 원활하게 사용할 수 있습니다.
