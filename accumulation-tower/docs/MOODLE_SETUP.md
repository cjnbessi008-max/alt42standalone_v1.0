# Moodle 설정 가이드

Accumulation Tower와 Moodle을 연동하기 위한 상세 설정 가이드입니다.

---

## 📋 개요

Accumulation Tower는 Moodle의 **Web Services API**를 사용하여 학생의 성적 정보를 가져옵니다.

**필요한 Moodle 버전:** 3.7 이상
**필요한 권한:** 관리자 또는 웹 서비스 관리 권한

---

## 🔧 1단계: Web Services 활성화

### 1.1 웹 서비스 기능 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** → **고급 기능** 이동
3. **웹 서비스 활성화** 체크박스 선택
4. **변경사항 저장** 클릭

### 1.2 REST 프로토콜 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **프로토콜 관리**
2. **REST 프로토콜** 활성화 (눈 아이콘 클릭)

---

## 🛠️ 2단계: 외부 서비스 생성

### 2.1 새 서비스 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. **사용자 정의 서비스 추가** 클릭
3. 다음 정보 입력:
   - **이름:** `Accumulation Tower Service`
   - **약식 이름:** `accumulation_tower`
   - **활성화:** 체크
   - **승인된 사용자만:** 체크 (권장)
4. **서비스 추가** 클릭

### 2.2 함수 추가

생성한 서비스를 클릭하여 **함수 추가**:

#### 필수 함수 목록:

| 함수 이름 | 설명 |
|---------|------|
| `core_user_get_users` | 사용자 정보 조회 |
| `core_webservice_get_site_info` | 사이트 정보 조회 (테스트용) |
| `gradereport_user_get_grade_items` | 사용자 성적 조회 |
| `mod_quiz_get_quizzes_by_courses` | 코스의 퀴즈 목록 조회 |
| `mod_quiz_get_user_attempts` | 퀴즈 시도 정보 조회 |

각 함수를 검색하여 추가합니다.

---

## 👤 3단계: 웹 서비스 사용자 생성

### 3.1 전용 사용자 생성 (권장)

보안을 위해 웹 서비스 전용 사용자를 생성하는 것이 좋습니다.

1. **사이트 관리** → **사용자** → **계정** → **새 사용자 추가**
2. 정보 입력:
   - **사용자명:** `webservice_accumulation`
   - **암호:** 강력한 암호 설정
   - **이름:** `Accumulation Tower`
   - **성:** `Web Service`
   - **이메일:** 유효한 이메일 주소

### 3.2 역할 생성 및 할당

1. **사이트 관리** → **사용자** → **권한** → **역할 정의**
2. **새 역할 추가** 클릭
3. 역할 정보:
   - **약식 이름:** `accumulationtower`
   - **전체 이름:** `Accumulation Tower Service`
   - **역할 유형:** `시스템`

4. 다음 권한 부여:
   ```
   moodle/webservice:createtoken
   moodle/grade:view
   moodle/grade:viewall
   moodle/user:viewdetails
   mod/quiz:view
   mod/quiz:reviewmyattempts
   ```

5. 역할 생성 후, 생성한 사용자에게 이 역할 할당:
   - **사이트 관리** → **사용자** → **권한** → **시스템 역할 할당**
   - `Accumulation Tower Service` 역할 선택
   - 생성한 웹 서비스 사용자 추가

---

## 🔑 4단계: 토큰 생성

### 4.1 사용자에게 서비스 승인

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. 생성한 `Accumulation Tower Service` 찾기
3. **승인된 사용자** 클릭
4. 웹 서비스 사용자 추가

### 4.2 토큰 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
2. **토큰 추가** 클릭
3. 정보 입력:
   - **사용자:** 생성한 웹 서비스 사용자 선택
   - **서비스:** `Accumulation Tower Service` 선택
   - **유효기간:** 설정 (선택사항)
4. **변경사항 저장** 클릭
5. **생성된 토큰 복사** (이 토큰은 다시 볼 수 없으므로 안전한 곳에 저장!)

---

## ✅ 5단계: 테스트

### 5.1 cURL로 테스트

생성한 토큰이 작동하는지 확인:

```bash
curl "https://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

**성공 응답 예시:**
```json
{
  "sitename": "Your Moodle Site",
  "username": "webservice_accumulation",
  "firstname": "Accumulation Tower",
  "lastname": "Web Service",
  ...
}
```

**실패 응답 예시:**
```json
{
  "exception": "invalid_token",
  "errorcode": "invalidtoken",
  "message": "Invalid token - token not found"
}
```

### 5.2 성적 조회 테스트

실제 사용자 ID와 코스 ID로 테스트:

```bash
curl "https://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=gradereport_user_get_grade_items&moodlewsrestformat=json&userid=2&courseid=1"
```

---

## 🔒 보안 권장사항

### 토큰 관리

1. **토큰 저장:**
   - 환경 변수로 관리
   - 코드 저장소에 절대 커밋하지 않기
   - `.env` 파일은 `.gitignore`에 추가

2. **토큰 갱신:**
   - 정기적으로 토큰 갱신 (3-6개월마다)
   - 의심스러운 활동 발견 시 즉시 무효화

3. **IP 제한:**
   - 가능하면 IP 화이트리스트 설정
   - **사이트 관리** → **보안** → **HTTP 보안**

### 권한 최소화

1. 웹 서비스 사용자에게 **필요한 최소 권한만** 부여
2. 불필요한 코스 접근 제한
3. 정기적으로 권한 감사

### 로그 모니터링

1. **사이트 관리** → **보고서** → **로그**
2. 웹 서비스 사용자의 활동 정기적으로 확인
3. 비정상적인 패턴 감지 시 조사

---

## 🐛 문제 해결

### 문제 1: "Invalid token" 오류

**원인:**
- 토큰이 잘못 복사됨
- 토큰이 만료됨
- 사용자가 비활성화됨

**해결:**
1. 토큰 재생성
2. 사용자 계정 상태 확인
3. 서비스가 활성화되어 있는지 확인

### 문제 2: "Access control exception" 오류

**원인:**
- 사용자에게 필요한 권한이 없음
- 함수가 서비스에 추가되지 않음

**해결:**
1. 외부 서비스에 필요한 함수가 모두 추가되어 있는지 확인
2. 사용자 역할에 필요한 권한이 있는지 확인

### 문제 3: 빈 데이터 반환

**원인:**
- 해당 코스/사용자에 성적이 없음
- 사용자가 해당 코스에 등록되지 않음

**해결:**
1. Moodle에서 직접 성적이 있는지 확인
2. 사용자가 코스에 등록되어 있는지 확인
3. userId와 courseId가 올바른지 확인

---

## 📚 추가 리소스

- [Moodle Web Services 공식 문서](https://docs.moodle.org/en/Web_services)
- [Moodle Web Services API 문서](https://docs.moodle.org/dev/Web_services)
- [사용 가능한 함수 목록](https://docs.moodle.org/dev/Web_service_API_functions)

---

## 📝 체크리스트

설정 완료 확인:

- [ ] 웹 서비스 활성화
- [ ] REST 프로토콜 활성화
- [ ] 외부 서비스 생성 (`Accumulation Tower Service`)
- [ ] 필수 함수 5개 추가
- [ ] 웹 서비스 전용 사용자 생성
- [ ] 사용자 역할 및 권한 설정
- [ ] 토큰 생성
- [ ] 토큰 테스트 (cURL)
- [ ] `.env` 파일에 토큰 설정
- [ ] Backend 서버 재시작
- [ ] 앱에서 데이터 정상 표시 확인
