# Moodle 연동 가이드

Balance Machine을 Moodle 3.7 LMS와 연동하는 방법에 대한 상세 가이드입니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [Moodle 웹 서비스 활성화](#moodle-웹-서비스-활성화)
3. [Balance Machine 설정](#balance-machine-설정)
4. [기능 및 API](#기능-및-api)
5. [문제 해결](#문제-해결)

## 사전 요구사항

- Moodle 3.7 이상
- Moodle 관리자 권한
- Balance Machine 백엔드 서버 실행 중

## Moodle 웹 서비스 활성화

### 1. 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** 으로 이동
3. **웹 서비스 활성화** 체크박스 선택 및 저장

### 2. 외부 서비스 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스** 로 이동
2. **외부 서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Balance Machine Integration`
   - 약칭: `balancemachine`
   - 활성화: 체크
4. 저장 후 **함수 추가** 클릭
5. 다음 함수들을 추가:
   ```
   core_user_get_users_by_field
   core_course_get_courses
   core_enrol_get_enrolled_users
   core_grades_update_grades
   core_completion_update_activity_completion_status_manually
   core_message_send_instant_messages
   core_webservice_get_site_info
   ```

### 3. 사용자 권한 부여

1. **사이트 관리 > 사용자 > 권한 > 역할 정의** 로 이동
2. 새 역할 생성 또는 기존 역할 수정
3. 다음 권한 부여:
   ```
   webservice/rest:use
   moodle/webservice:createtoken
   moodle/course:view
   moodle/user:viewdetails
   moodle/grade:edit
   ```

### 4. 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리** 로 이동
2. **토큰 추가** 클릭
3. 정보 입력:
   - 사용자: Balance Machine을 사용할 사용자 선택
   - 서비스: `Balance Machine Integration` 선택
4. 저장하고 **토큰 값을 복사**하여 안전하게 보관

### 5. REST 프로토콜 활성화

1. **사이트 관리 > 서버 > 웹 서비스 > 프로토콜 관리** 로 이동
2. **REST 프로토콜** 활성화

## Balance Machine 설정

### 1. 환경 변수 설정

`backend/.env` 파일에 다음 내용 추가:

```env
MOODLE_API_URL=https://your-moodle-site.com/webservice/rest/server.php
MOODLE_TOKEN=your_generated_token_here
```

### 2. 연결 테스트

```bash
# Backend API를 통해 테스트
curl -X POST http://localhost:3001/api/moodle/test
```

성공 응답:
```json
{
  "success": true,
  "data": {
    "connected": true
  },
  "message": "Moodle connection successful"
}
```

## 기능 및 API

### 1. 사용자 정보 가져오기

**Endpoint:** `GET /api/moodle/user/:userId`

**예시:**
```bash
curl http://localhost:3001/api/moodle/user/123
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "student_park",
    "firstname": "Park",
    "lastname": "Student",
    "email": "park@student.com"
  }
}
```

### 2. 성적 제출

**Endpoint:** `POST /api/moodle/grade`

**요청 본문:**
```json
{
  "courseId": 1,
  "userId": 123,
  "itemName": "Balance Machine - Problem 1",
  "grade": 85.5,
  "maxGrade": 100
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "submitted": true
  },
  "message": "Grade submitted to Moodle successfully"
}
```

### 3. 코스 학생 목록 가져오기

**Endpoint:** `GET /api/moodle/course/:courseId/users`

**예시:**
```bash
curl http://localhost:3001/api/moodle/course/1/users
```

### 4. 데이터 동기화

**Endpoint:** `POST /api/moodle/sync`

**요청 본문:**
```json
{
  "type": "quiz",
  "id": 5
}
```

## 통합 워크플로우

### 학생이 문제를 풀 때

1. 학생이 Balance Machine에서 문제 시작
2. Balance Machine이 Moodle에서 학생 정보 조회
3. 학생이 문제 풀이 완료
4. Balance Machine이 점수 계산
5. 점수를 Moodle 성적부에 자동 제출
6. Moodle에서 완료 상태 업데이트

### 코드 예시

```typescript
// 문제 완료 후 Moodle에 성적 제출
import { progressAPI } from './services/api';
import axios from 'axios';

async function submitToMoodle(studentId: number, score: number, problemId: number) {
  try {
    // Balance Machine에 결과 저장
    await progressAPI.submitAttempt({
      student_id: studentId,
      problem_id: problemId,
      score: score,
      // ... other data
    });

    // Moodle에 성적 제출
    await axios.post('http://localhost:3001/api/moodle/grade', {
      courseId: 1, // Your course ID
      userId: studentId,
      itemName: `Balance Machine - Problem ${problemId}`,
      grade: score,
      maxGrade: 100
    });

    console.log('Grade submitted to Moodle successfully');
  } catch (error) {
    console.error('Failed to submit grade:', error);
  }
}
```

## 문제 해결

### 연결 실패

**증상:** `Moodle connection failed` 오류

**해결 방법:**
1. MOODLE_API_URL이 정확한지 확인
2. MOODLE_TOKEN이 유효한지 확인
3. Moodle 웹 서비스가 활성화되어 있는지 확인
4. 네트워크 연결 확인 (방화벽, 프록시 등)

### 권한 오류

**증상:** `Access control exception` 오류

**해결 방법:**
1. 토큰을 생성한 사용자에게 필요한 권한이 있는지 확인
2. 외부 서비스에 필요한 함수가 모두 추가되었는지 확인
3. 사용자 역할에 웹 서비스 사용 권한이 있는지 확인

### 성적 제출 실패

**증상:** 성적이 Moodle에 나타나지 않음

**해결 방법:**
1. courseId가 올바른지 확인
2. userId가 해당 코스에 등록되어 있는지 확인
3. Moodle 성적부 설정 확인
4. Balance Machine 로그에서 오류 메시지 확인

### 디버깅

백엔드 로그 확인:
```bash
# Docker를 사용하는 경우
docker-compose logs -f backend

# 직접 실행하는 경우
cd backend
npm run dev
```

Moodle 로그 확인:
1. Moodle 관리자 페이지
2. **사이트 관리 > 보고서 > 로그**
3. 웹 서비스 관련 활동 필터링

## 보안 고려사항

1. **토큰 보안**
   - `.env` 파일을 절대 커밋하지 마세요
   - 토큰을 정기적으로 갱신하세요
   - HTTPS를 사용하여 통신을 암호화하세요

2. **권한 최소화**
   - Balance Machine에 필요한 최소한의 권한만 부여
   - 전체 관리자 권한은 피하세요

3. **입력 검증**
   - 모든 사용자 입력을 검증
   - SQL 인젝션 방지

## 추가 리소스

- [Moodle Web Services 공식 문서](https://docs.moodle.org/dev/Web_services)
- [Moodle REST API 가이드](https://docs.moodle.org/dev/Creating_a_web_service_client)
- [Balance Machine API 문서](../README.md)

## 지원

문제가 발생하면 다음을 통해 문의하세요:
- GitHub Issues
- 이메일: support@balancemachine.com
