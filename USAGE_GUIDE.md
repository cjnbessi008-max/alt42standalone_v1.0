# 워밍업 문제 추천 시스템 - 사용 가이드

## 목차

1. [시작하기](#시작하기)
2. [LMS 연동 설정](#lms-연동-설정)
3. [기본 사용법](#기본-사용법)
4. [API 사용 예제](#api-사용-예제)
5. [문제 해결](#문제-해결)

## 시작하기

### 1단계: 백엔드 서버 실행

```bash
cd backend
pip install -r requirements.txt
python -m src.main
```

서버가 http://localhost:8000 에서 실행됩니다.

### 2단계: 프론트엔드 앱 실행

```bash
cd frontend
npm install
npm start
```

웹앱이 http://localhost:3000 에서 실행됩니다.

### 3단계: 웹앱 접속

브라우저에서 http://localhost:3000 을 열면 워밍업 문제 추천 화면이 나타납니다.

## LMS 연동 설정

### Moodle과 연동하기

#### 1. Moodle에서 Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **Site administration → Advanced features** 로 이동
3. **Enable web services** 체크박스 선택
4. 저장

#### 2. API 토큰 생성

1. **Site administration → Server → Web services → Manage tokens** 로 이동
2. **Create token** 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰 복사

#### 3. 백엔드 설정

`backend/.env` 파일 편집:

```bash
LMS_TYPE=moodle
LMS_BASE_URL=https://your-moodle-site.com
LMS_API_TOKEN=your_generated_token_here
```

### Canvas와 연동하기

#### 1. Canvas Access Token 생성

1. Canvas에 로그인
2. **Account → Settings** 로 이동
3. **+ New Access Token** 클릭
4. Purpose 입력 (예: "Warmup Problem Integration")
5. 생성된 토큰 복사

#### 2. 백엔드 설정

`backend/.env` 파일 편집:

```bash
LMS_TYPE=canvas
LMS_BASE_URL=https://your-canvas-site.com
LMS_API_TOKEN=your_access_token_here
```

## 기본 사용법

### 학생 입장에서 사용하기

#### 1. 워밍업 문제 받기

웹앱을 열면 자동으로 워밍업 문제가 추천됩니다.

- **추천 이유**: 왜 이 문제가 추천되었는지 설명
- **신뢰도**: 추천의 신뢰도 (0-100%)
- **난이도**: 문제의 난이도 표시
- **예상 시간**: 문제 풀이 예상 시간

#### 2. 문제 풀기

1. 문제를 읽습니다
2. 답 입력란에 답을 입력합니다
3. **제출하기** 버튼을 클릭합니다

#### 3. 결과 확인

제출 후 즉시 결과를 확인할 수 있습니다:

- **정답**: ✅ 정답입니다! 메시지와 함께 초록색으로 표시
- **오답**: ❌ 다시 한번 생각해보세요. 메시지와 함께 빨간색으로 표시
- **정답 확인**: 오답인 경우 정답 표시
- **해설**: 문제 풀이 해설 제공
- **LMS 동기화**: LMS에 자동으로 결과 전송

#### 4. 다음 문제

**다음 워밍업 문제 →** 버튼을 클릭하면 새로운 워밍업 문제를 받을 수 있습니다.

### 교사/관리자 입장에서 사용하기

#### API를 통한 문제 관리

##### 1. 문제 목록 조회

```bash
curl http://localhost:8000/api/warmup/problems
```

##### 2. 특정 난이도 문제만 조회

```bash
curl "http://localhost:8000/api/warmup/problems?difficulty=easy&subject=math"
```

##### 3. 학생 이력 조회

```bash
curl http://localhost:8000/api/warmup/student/student_123/history
```

## API 사용 예제

### Python에서 사용하기

```python
import requests

# 1. 워밍업 문제 추천
response = requests.post('http://localhost:8000/api/warmup/recommend', json={
    "student_id": "student_123",
    "problem_type": "calculation",
    "subject": "math",
    "grade_level": 3
})

recommendation = response.json()
problem = recommendation['recommended_problem']

print(f"추천 문제: {problem['title']}")
print(f"내용: {problem['content']}")
print(f"이유: {recommendation['reason']}")

# 2. 답안 제출
student_answer = "2/3"
submit_response = requests.post('http://localhost:8000/api/warmup/submit', params={
    "student_id": "student_123",
    "problem_id": problem['id'],
    "answer": student_answer,
    "time_spent_seconds": 120
})

result = submit_response.json()
print(f"정답 여부: {result['is_correct']}")
print(f"메시지: {result['message']}")
```

### JavaScript에서 사용하기

```javascript
// 1. 워밍업 문제 추천
const recommendProblem = async () => {
  const response = await fetch('http://localhost:8000/api/warmup/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      student_id: 'student_123',
      problem_type: 'calculation',
      subject: 'math',
      grade_level: 3
    })
  });

  const recommendation = await response.json();
  console.log('추천 문제:', recommendation.recommended_problem.title);
  console.log('추천 이유:', recommendation.reason);

  return recommendation;
};

// 2. 답안 제출
const submitAnswer = async (problemId, answer) => {
  const params = new URLSearchParams({
    student_id: 'student_123',
    problem_id: problemId,
    answer: answer,
    time_spent_seconds: 120
  });

  const response = await fetch(`http://localhost:8000/api/warmup/submit?${params}`, {
    method: 'POST'
  });

  const result = await response.json();
  console.log('정답 여부:', result.is_correct);
  console.log('메시지:', result.message);

  return result;
};

// 사용 예제
(async () => {
  const recommendation = await recommendProblem();
  const result = await submitAnswer(recommendation.recommended_problem.id, '2/3');
})();
```

### cURL로 테스트하기

```bash
# 1. 워밍업 문제 추천
curl -X POST http://localhost:8000/api/warmup/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_123",
    "problem_type": "calculation",
    "subject": "math",
    "grade_level": 3
  }'

# 2. 답안 제출
curl -X POST "http://localhost:8000/api/warmup/submit?student_id=student_123&problem_id=prob_001&answer=1/2&time_spent_seconds=120"

# 3. 학생 이력 조회
curl http://localhost:8000/api/warmup/student/student_123/history

# 4. 문제 목록 조회
curl http://localhost:8000/api/warmup/problems

# 5. 특정 문제 상세
curl http://localhost:8000/api/warmup/problems/prob_001
```

## 문제 해결

### 백엔드 서버가 실행되지 않아요

**증상**: `ModuleNotFoundError` 또는 import 에러

**해결**:
```bash
# 의존성 재설치
pip install --upgrade -r requirements.txt

# Python 경로 확인
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### CORS 에러가 발생해요

**증상**: 브라우저 콘솔에 `Access-Control-Allow-Origin` 에러

**해결**:
`backend/src/main.py`에서 CORS 설정 확인:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 URL 추가
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### LMS 연동이 안 돼요

**증상**: `lms_synced: false`

**해결**:
1. `.env` 파일에 LMS 설정이 올바른지 확인
2. LMS API 토큰이 유효한지 확인
3. LMS 서버가 접근 가능한지 확인
4. 방화벽 설정 확인

**LMS 연동 없이 사용하기**:
LMS 설정을 하지 않아도 워밍업 문제 추천 기능은 정상 동작합니다. 단, 결과가 LMS에 동기화되지 않을 뿐입니다.

### 프론트엔드가 백엔드에 연결되지 않아요

**증상**: 문제 추천 중 오류 발생

**해결**:
1. 백엔드 서버가 실행 중인지 확인 (http://localhost:8000)
2. `frontend/.env` 파일 확인:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```
3. 브라우저 개발자 도구 → Network 탭에서 요청 확인

### 추천 가능한 워밍업 문제가 없다고 나와요

**증상**: "추천 가능한 워밍업 문제가 없습니다" 에러

**원인**: 해당 조건에 맞는 문제가 데이터베이스에 없음

**해결**:
- 현재는 샘플 데이터만 있으므로, 다른 과목이나 학년으로 시도
- 또는 `backend/src/services/problem_repository.py`에 문제 추가

## 추가 리소스

- **API 문서**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **프로젝트 README**: [README.md](README.md)
- **PRD 문서**: [tasks/0001-prd-ai-education-pipeline.md](tasks/0001-prd-ai-education-pipeline.md)

## 지원

문제가 계속되면 GitHub Issues를 통해 문의해주세요.
