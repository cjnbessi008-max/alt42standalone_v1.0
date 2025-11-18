# Moodle LMS 연동 가이드

이 문서는 Correspondence Lines 앱을 Moodle 3.7과 연동하는 방법을 설명합니다.

## 연동 방식

### 1. Standalone 방식 (현재 구현)
- Correspondence Lines를 독립적인 웹 앱으로 실행
- REST API를 통해 Moodle과 데이터 교환
- iframe 또는 외부 링크로 Moodle에서 접근

### 2. LTI 방식 (향후 구현)
- LTI (Learning Tools Interoperability) 표준 사용
- Moodle 활동으로 직접 임베딩
- SSO (Single Sign-On) 자동 처리

## Standalone 방식 설정

### 1단계: Moodle Web Service 활성화

1. **관리자 로그인**
   - Moodle 사이트에 관리자로 로그인

2. **웹 서비스 활성화**
   ```
   사이트 관리 > 고급 기능
   ☑ 웹 서비스 활성화
   ```

3. **프로토콜 활성화**
   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리
   ☑ REST 프로토콜 활성화
   ```

4. **외부 서비스 생성**
   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스
   + 추가
   이름: Correspondence Lines Integration
   약칭: correspondence_lines
   ☑ 활성화
   ```

5. **함수 추가**
   ```
   서비스 편집 > 함수 추가
   - core_user_get_users_by_field
   - core_user_get_users
   - gradereport_user_get_grade_items
   - core_grades_update_grades
   ```

6. **토큰 생성**
   ```
   사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
   + 토큰 추가
   사용자: 관리자 또는 서비스 계정
   서비스: Correspondence Lines Integration
   ```

   생성된 토큰을 복사하여 `.env` 파일에 저장:
   ```env
   MOODLE_API_TOKEN=your_generated_token_here
   ```

### 2단계: Backend 환경 변수 설정

`backend/.env` 파일 수정:

```env
# Moodle Configuration
MOODLE_URL=http://your-moodle-instance.com
MOODLE_API_TOKEN=your_generated_token_from_step1
```

### 3단계: Moodle에서 외부 도구로 추가

#### 방법 A: iframe 임베딩

1. **HTML 블록 추가**
   ```
   코스 > 편집 모드 켜기 > 블록 추가 > HTML
   ```

2. **iframe 코드 삽입**
   ```html
   <iframe
     src="http://your-app-url:5173"
     width="100%"
     height="800px"
     frameborder="0"
     style="border: 1px solid #ddd; border-radius: 8px;"
   ></iframe>
   ```

#### 방법 B: 외부 도구 (External Tool)

1. **외부 도구 설정**
   ```
   사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구 > 도구 관리
   + 도구 구성
   ```

2. **도구 정보 입력**
   ```
   도구 이름: Correspondence Lines
   도구 URL: http://your-app-url:5173
   소비자 키: correspondence_lines_key
   공유 비밀: your_secret_here
   ```

3. **코스에 활동 추가**
   ```
   코스 > 활동 추가 > 외부 도구
   선택: Correspondence Lines
   ```

## API 연동 구현

### 사용자 동기화

#### Moodle → Correspondence Lines

```typescript
// Backend: src/routes/moodleRoutes.ts
router.post('/sync-user', async (req, res) => {
  const { moodle_user_id } = req.body;

  // Moodle API 호출
  const response = await axios.get(
    `${MOODLE_URL}/webservice/rest/server.php`,
    {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field: 'id',
        'values[0]': moodle_user_id,
      },
    }
  );

  const moodleUser = response.data[0];

  // 로컬 데이터베이스에 학생 생성/업데이트
  await db.query(
    `INSERT INTO students (id, moodle_user_id, username, email)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE username = ?, email = ?`,
    [
      uuid(),
      moodleUser.id,
      moodleUser.username,
      moodleUser.email,
      moodleUser.username,
      moodleUser.email,
    ]
  );

  res.json({ success: true });
});
```

### 성적 전송

#### Correspondence Lines → Moodle

```typescript
// Backend: src/routes/moodleRoutes.ts
router.post('/send-grade', async (req, res) => {
  const { moodle_user_id, moodle_question_id, grade } = req.body;

  // Moodle gradebook에 성적 전송
  const response = await axios.post(
    `${MOODLE_URL}/webservice/rest/server.php`,
    null,
    {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'core_grades_update_grades',
        moodlewsrestformat: 'json',
        source: 'correspondence_lines',
        courseid: COURSE_ID,
        component: 'mod_quiz',
        activityid: moodle_question_id,
        itemnumber: 0,
        'grades[0][studentid]': moodle_user_id,
        'grades[0][grade]': grade,
      },
    }
  );

  res.json({ success: true, data: response.data });
});
```

### Frontend에서 사용

```typescript
// Frontend: src/api/problemApi.ts
export const moodleApi = {
  async syncUser(moodleUserId: number) {
    const response = await apiClient.post('/moodle/sync-user', {
      moodle_user_id: moodleUserId,
    });
    return response.data;
  },

  async sendGrade(moodleUserId: number, questionId: number, grade: number) {
    const response = await apiClient.post('/moodle/send-grade', {
      moodle_user_id: moodleUserId,
      moodle_question_id: questionId,
      grade: grade,
    });
    return response.data;
  },
};
```

## URL 파라미터를 통한 자동 로그인

Moodle에서 사용자 정보를 URL 파라미터로 전달:

```
http://your-app-url:5173/problem/123?moodle_user_id=456&session_token=xyz
```

Frontend에서 파라미터 처리:

```typescript
// Frontend: src/pages/ProblemPage.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const moodleUserId = params.get('moodle_user_id');
  const sessionToken = params.get('session_token');

  if (moodleUserId && sessionToken) {
    // 사용자 동기화 및 자동 로그인
    moodleApi.syncUser(Number(moodleUserId)).then((user) => {
      setStudentId(user.id);
    });
  }
}, []);
```

## 보안 고려사항

### 1. CORS 설정

Moodle 도메인에서의 접근 허용:

```typescript
// Backend: src/index.ts
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://your-moodle-instance.com',
    ],
    credentials: true,
  })
);
```

### 2. 토큰 검증

세션 토큰 검증 미들웨어:

```typescript
// Backend: src/middleware/auth.ts
export async function verifyMoodleSession(req, res, next) {
  const sessionToken = req.headers['x-session-token'];

  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Moodle에 토큰 검증 요청
  try {
    const response = await axios.get(
      `${MOODLE_URL}/webservice/rest/server.php`,
      {
        params: {
          wstoken: sessionToken,
          wsfunction: 'core_webservice_get_site_info',
          moodlewsrestformat: 'json',
        },
      }
    );

    req.moodleUser = response.data;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
}
```

### 3. HTTPS 사용

프로덕션 환경에서는 반드시 HTTPS 사용:

```nginx
# nginx.conf
server {
  listen 443 ssl;
  server_name your-app-url.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location / {
    proxy_pass http://localhost:5173;
  }
}
```

## LTI 연동 (향후 구현)

### LTI 1.3 표준 구현

1. **LTI Platform 등록** (Moodle)
2. **Tool 등록** (Correspondence Lines)
3. **OIDC 인증 플로우** 구현
4. **Deep Linking** 지원
5. **Gradebook 서비스** 연동

참고 자료:
- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3)
- [Moodle LTI Documentation](https://docs.moodle.org/en/LTI)

## 문제 해결

### CORS 에러

**증상**: "Access to XMLHttpRequest has been blocked by CORS policy"

**해결**:
```typescript
// Backend CORS 설정 확인
app.use(cors({
  origin: 'http://your-moodle-instance.com',
  credentials: true,
}));
```

### 토큰 인증 실패

**증상**: "Invalid token" 에러

**해결**:
1. Moodle에서 토큰이 활성화되어 있는지 확인
2. 토큰 유효 기간 확인
3. `.env` 파일의 토큰 값 재확인

### iframe 샌드박스 제한

**증상**: iframe 내에서 기능 동작 안 함

**해결**:
```html
<iframe
  src="..."
  sandbox="allow-scripts allow-same-origin allow-forms"
></iframe>
```

## 테스트

### 로컬 테스트

```bash
# Moodle 목 서버 실행
cd moodle-mock-server
npm install
npm start

# 환경 변수 설정
export MOODLE_URL=http://localhost:8080
export MOODLE_API_TOKEN=test_token

# 앱 실행
docker-compose up
```

### 통합 테스트

```typescript
// tests/moodle-integration.test.ts
describe('Moodle Integration', () => {
  it('should sync user from Moodle', async () => {
    const response = await request(app)
      .post('/api/moodle/sync-user')
      .send({ moodle_user_id: 123 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should send grade to Moodle', async () => {
    const response = await request(app)
      .post('/api/moodle/send-grade')
      .send({
        moodle_user_id: 123,
        moodle_question_id: 456,
        grade: 85,
      });

    expect(response.status).toBe(200);
  });
});
```

## 참고 자료

- [Moodle Web Services](https://docs.moodle.org/dev/Web_services)
- [Moodle External Tool](https://docs.moodle.org/en/External_tool)
- [LTI Advantage](https://www.imsglobal.org/lti-advantage-overview)
