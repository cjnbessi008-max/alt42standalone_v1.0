# Moodle Integration Guide

## Moodle 3.7 연동 가이드

이 문서는 Shape Transformer를 Moodle 3.7 LMS와 연동하는 방법을 설명합니다.

## 1. Moodle 웹 서비스 설정

### 1.1 웹 서비스 활성화

1. Moodle 관리자 계정으로 로그인
2. `사이트 관리 > 고급 기능` 이동
3. "웹 서비스 활성화" 체크박스 선택
4. 저장

### 1.2 웹 서비스 프로토콜 활성화

1. `사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리` 이동
2. "REST 프로토콜" 활성화

### 1.3 외부 서비스 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스` 이동
2. "사용자 정의 서비스 추가" 클릭
3. 다음 정보 입력:
   - **이름**: Shape Transformer Service
   - **약식 이름**: shape_transformer
   - **활성화**: 체크
   - **승인된 사용자만**: 선택 해제 (또는 필요에 따라 설정)
   - **파일 다운로드 필요**: 선택 해제
   - **파일 업로드 필요**: 선택 해제

4. "함수 추가" 클릭하여 다음 함수들 추가:
   - `core_user_get_users_by_field`
   - `core_grades_update_grades`
   - `gradereport_user_get_grades_table`
   - `core_course_get_courses`
   - `core_enrol_get_enrolled_users`

## 2. 토큰 생성

### 2.1 특정 사용자용 토큰 생성

1. `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리` 이동
2. "토큰 생성" 클릭
3. 다음 정보 입력:
   - **사용자**: Shape Transformer를 사용할 관리자 계정 선택
   - **서비스**: Shape Transformer Service 선택
   - **IP 제한**: (선택사항) 보안을 위해 서버 IP 입력

4. 생성된 토큰 복사
5. Shape Transformer의 `.env` 파일에 토큰 설정:
   ```
   MOODLE_TOKEN=your_generated_token_here
   ```

## 3. Moodle 활동 추가

### 3.1 외부 도구(External Tool) 설정

1. 원하는 과정(Course) 편집 모드 활성화
2. "활동 또는 리소스 추가" 클릭
3. "외부 도구(External Tool)" 선택

### 3.2 외부 도구 구성

**활동 이름**: 형상 변환기

**외부 도구 URL**:
```
http://your-domain.com/public/index.html?moodle_user_id={user_id}&moodle_course_id={course_id}
```

**Launch Container**: 새 창 또는 임베드 선택

**고급 설정**:
- **사용자 정보 공유**: "이름, 이메일, 사용자 ID 공유" 선택
- **등급 수용**: 체크 (성적을 Moodle로 전송하려면)
- **최대 등급**: 100

### 3.3 매개변수 전달

사용자 정의 매개변수 추가:
```
moodle_user_id={user_id}
moodle_course_id={course_id}
```

## 4. 성적 동기화 설정

### 4.1 성적 항목 추가

Shape Transformer는 자동으로 성적을 Moodle로 전송할 수 있습니다.

1. 과정의 "성적" 메뉴 이동
2. Shape Transformer 활동이 성적 항목에 표시되는지 확인
3. 최대 점수를 100점으로 설정

### 4.2 자동 동기화 확인

앱에서 자동 동기화가 활성화되어 있는지 확인:

`public/js/config.js`:
```javascript
MOODLE: {
    ENABLED: true,
    AUTO_SYNC: true,
    SYNC_INTERVAL: 60000 // 1분마다 동기화
}
```

## 5. 테스트

### 5.1 연동 테스트

1. 학생 계정으로 Moodle 로그인
2. 해당 과정의 Shape Transformer 활동 클릭
3. 앱이 정상적으로 로드되는지 확인
4. 우측 상단에 학생 이름이 표시되는지 확인

### 5.2 성적 동기화 테스트

1. Shape Transformer에서 도형 학습 진행
2. 1분 정도 대기 (자동 동기화 대기)
3. Moodle 성적부에서 점수가 업데이트되었는지 확인

## 6. 문제 해결

### 6.1 토큰 인증 실패

**증상**: "Moodle authentication failed" 오류

**해결**:
1. `.env` 파일의 MOODLE_TOKEN이 올바른지 확인
2. Moodle 웹 서비스가 활성화되어 있는지 확인
3. 토큰이 만료되지 않았는지 확인

### 6.2 CORS 오류

**증상**: 브라우저 콘솔에 CORS 관련 오류

**해결**:
1. Moodle의 `config.php`에 다음 추가:
```php
$CFG->allowedorigins = ['http://your-shape-transformer-domain.com'];
```

### 6.3 성적이 동기화되지 않음

**증상**: 앱에서 학습했지만 Moodle 성적부에 반영되지 않음

**해결**:
1. 외부 도구 설정에서 "등급 수용"이 체크되어 있는지 확인
2. 브라우저 개발자 도구에서 API 호출 로그 확인
3. PHP 오류 로그 확인: `/api/moodle.php` 호출 상태

### 6.4 사용자 정보가 표시되지 않음

**증상**: 앱에서 "게스트"로 표시됨

**해결**:
1. URL 매개변수가 올바르게 전달되는지 확인
2. 외부 도구 설정에서 "사용자 정보 공유"가 활성화되어 있는지 확인

## 7. 보안 고려사항

### 7.1 토큰 보안

- 토큰은 절대 공개 저장소에 커밋하지 마세요
- `.env` 파일은 `.gitignore`에 포함되어야 합니다
- 프로덕션 환경에서는 IP 제한을 설정하세요

### 7.2 HTTPS 사용

프로덕션 환경에서는 반드시 HTTPS를 사용하세요:
```
MOODLE_URL=https://your-moodle-domain.com
```

### 7.3 권한 관리

웹 서비스 사용자에게 필요한 최소 권한만 부여하세요.

## 8. 고급 설정

### 8.1 커스텀 성적 계산

`api/moodle.php`의 `syncProgressToMoodle` 함수를 수정하여 성적 계산 로직을 변경할 수 있습니다.

### 8.2 추가 데이터 전송

학습 분석 데이터를 Moodle로 전송하려면 커스텀 필드를 추가할 수 있습니다.

## 9. 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/37/en/Web_services)
- [Moodle External Tool](https://docs.moodle.org/37/en/External_tool)
- [Moodle REST Protocol](https://docs.moodle.org/37/en/Using_web_services)

## 10. 지원

문제가 발생하면 다음을 확인하세요:
1. Moodle 로그: `사이트 관리 > 보고서 > 로그`
2. PHP 오류 로그
3. 브라우저 개발자 도구 콘솔

---

**마지막 업데이트**: 2025-11-18
