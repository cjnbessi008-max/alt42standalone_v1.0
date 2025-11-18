# Function Live Sync - 테스트 가이드

## 기본 기능 테스트

### 1. 프론트엔드 테스트

#### 1.1 함수 파서 테스트

브라우저 콘솔(F12)에서 실행:

```javascript
// 파서 인스턴스 생성
const parser = new FunctionParser();

// 일차함수 파싱
let result = parser.parse('y = 2x + 3');
console.log('일차함수:', result);

// 이차함수 파싱
result = parser.parse('y = x^2 - 4x + 3');
console.log('이차함수:', result);

// 삼각함수 파싱
result = parser.parse('y = sin(x)');
console.log('삼각함수:', result);

// 포인트 생성
const points = parser.generatePoints(-10, 10, 0.5);
console.log('포인트 개수:', points.length);
console.log('샘플 포인트:', points.slice(0, 5));
```

예상 결과:
```javascript
{
  success: true,
  function: ƒ,
  normalizedExpression: "2*x+3",
  parameters: { type: "linear", slope: 2, intercept: 3 }
}
```

#### 1.2 그래프 렌더링 테스트

```javascript
// 그래프 렌더러 생성
const graph = new GraphRenderer('graph-canvas');

// 샘플 포인트 생성
const samplePoints = [];
for (let x = -10; x <= 10; x += 0.1) {
    samplePoints.push({ x, y: x * x });
}

// 그래프 그리기
graph.updateGraph(samplePoints);

// 줌 테스트
graph.zoom(0.8);  // 확대
graph.zoom(1.2);  // 축소

// 범위 변경 테스트
graph.setRange(-5, 5, -5, 5);
```

#### 1.3 실시간 업데이트 테스트

다음 함수들을 순서대로 입력하여 애니메이션 확인:
1. `y = x`
2. `y = 2x`
3. `y = 2x + 3`
4. `y = x^2`
5. `y = sin(x)`

각 입력 후 그래프가 부드럽게 변하는지 확인.

---

### 2. 백엔드 API 테스트

#### 2.1 문제 조회 API

```bash
# 문제 목록 조회
curl -X GET http://localhost/backend/api/problems.php

# 특정 문제 조회
curl -X GET http://localhost/backend/api/problems.php?id=1

# JSON 포맷팅 (jq 사용)
curl -s http://localhost/backend/api/problems.php?id=1 | jq .
```

예상 결과:
```json
{
  "success": true,
  "problem": {
    "id": "1",
    "title": "일차함수 그래프 그리기",
    "description": "일차함수 y = mx + b의 그래프를 그려보세요...",
    "function_type": "linear",
    "initial_function": "y = 2x + 1",
    "x_range_min": "-10.00",
    "x_range_max": "10.00",
    ...
  }
}
```

#### 2.2 세션 시작 API

```bash
curl -X POST http://localhost/backend/api/sync.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_session",
    "problem_id": 1,
    "student_id": "test_student_123",
    "student_name": "테스트 학생"
  }' | jq .
```

예상 결과:
```json
{
  "success": true,
  "session_id": "1",
  "session_token": "abc123...",
  "is_new": true,
  "initial_function": "y = 2x + 1"
}
```

세션 토큰을 저장해두세요!

#### 2.3 함수 동기화 API

```bash
# 위에서 받은 session_token 사용
SESSION_TOKEN="여기에_세션_토큰_붙여넣기"

curl -X POST http://localhost/backend/api/sync.php \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"sync_function\",
    \"session_token\": \"$SESSION_TOKEN\",
    \"function_expression\": \"y = 3x + 2\",
    \"change_type\": \"edit\",
    \"graph_data\": []
  }" | jq .
```

예상 결과:
```json
{
  "success": true,
  "message": "Function synchronized",
  "session_id": "1"
}
```

#### 2.4 답안 제출 API

```bash
curl -X POST http://localhost/backend/api/sync.php \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"submit_answer\",
    \"session_token\": \"$SESSION_TOKEN\",
    \"submitted_function\": \"y = 2x + 1\"
  }" | jq .
```

---

### 3. 데이터베이스 테스트

#### 3.1 데이터 확인

```bash
mysql -u root -p function_live_sync

# 문제 목록 확인
SELECT * FROM problems;

# 세션 목록 확인
SELECT * FROM student_sessions ORDER BY started_at DESC LIMIT 5;

# 함수 변경 로그 확인
SELECT * FROM function_changes ORDER BY timestamp DESC LIMIT 10;

# 학생 답안 확인
SELECT * FROM student_answers ORDER BY submitted_at DESC LIMIT 5;
```

#### 3.2 통계 쿼리

```sql
-- 문제별 세션 수
SELECT p.title, COUNT(s.id) as session_count
FROM problems p
LEFT JOIN student_sessions s ON p.id = s.problem_id
GROUP BY p.id;

-- 학생별 시도 횟수
SELECT student_id, student_name, COUNT(*) as total_sessions
FROM student_sessions
GROUP BY student_id
ORDER BY total_sessions DESC;

-- 평균 시도 횟수
SELECT AVG(attempt_count) as avg_attempts
FROM student_sessions
WHERE is_active = 0;
```

---

### 4. 통합 테스트 시나리오

#### 시나리오 1: 학생이 문제를 풀고 답안을 제출

1. **브라우저에서 접속**
   ```
   http://localhost/function-live-sync/frontend/?problem_id=1
   ```

2. **함수 입력**
   - `y = 2x + 1` 입력
   - 그래프가 즉시 표시되는지 확인

3. **여러 함수 시도**
   - `y = x`
   - `y = 3x - 2`
   - `y = -0.5x + 4`
   - 애니메이션 확인

4. **샘플 함수 사용**
   - 드롭다운에서 "y = x²" 선택
   - 그래프 변경 확인

5. **답안 제출**
   - "답안 제출" 버튼 클릭
   - 피드백 확인

6. **데이터베이스 확인**
   ```sql
   -- 방금 생성된 세션 확인
   SELECT * FROM student_sessions ORDER BY id DESC LIMIT 1;

   -- 함수 변경 기록 확인
   SELECT function_expression, timestamp
   FROM function_changes
   WHERE session_id = (SELECT MAX(id) FROM student_sessions)
   ORDER BY timestamp;
   ```

#### 시나리오 2: 다양한 함수 타입 테스트

1. **일차함수**
   - `y = 2x + 3`
   - 함수 타입이 "일차함수"로 표시되는지 확인

2. **이차함수**
   - `y = x^2 - 4x + 3`
   - 포물선이 그려지는지 확인

3. **삼각함수**
   - `y = sin(x)`
   - 주기 함수가 제대로 그려지는지 확인
   - `y = 2*sin(x)` (진폭 변경)
   - `y = sin(2*x)` (주기 변경)

4. **복잡한 함수**
   - `y = x^3 - 3x`
   - `y = ln(x)` (x > 0 영역에서만 표시되는지 확인)
   - `y = e^x`

#### 시나리오 3: 에러 처리 테스트

1. **잘못된 수식 입력**
   - `y = x +` (불완전한 수식)
   - 에러 메시지 표시 확인

2. **위험한 코드 입력**
   - `y = eval("alert(1)")` (차단되어야 함)
   - `y = window.location` (차단되어야 함)

3. **나누기 0**
   - `y = 1/x` (x=0에서 불연속)
   - 그래프가 끊기는지 확인

---

### 5. 성능 테스트

#### 5.1 대량 포인트 렌더링

```javascript
// 10,000개 포인트 생성
const largePoints = [];
for (let x = -100; x <= 100; x += 0.02) {
    largePoints.push({ x, y: Math.sin(x) });
}

console.time('Render Large Graph');
window.app.graph.updateGraph(largePoints);
console.timeEnd('Render Large Graph');
```

목표: 100ms 이하

#### 5.2 빠른 함수 변경

```javascript
const functions = [
    'y = x',
    'y = x^2',
    'y = x^3',
    'y = sin(x)',
    'y = cos(x)',
    'y = ln(x)',
    'y = e^x'
];

let i = 0;
setInterval(() => {
    if (i < functions.length) {
        document.getElementById('function-input').value = functions[i];
        window.app.parseAndRender();
        i++;
    }
}, 500);
```

각 변경 시 애니메이션이 부드러운지 확인.

#### 5.3 동시 세션 테스트

```bash
# 10개 세션 동시 생성
for i in {1..10}; do
    curl -X POST http://localhost/backend/api/sync.php \
      -H "Content-Type: application/json" \
      -d "{
        \"action\": \"start_session\",
        \"problem_id\": 1,
        \"student_id\": \"student_$i\"
      }" &
done
wait

# 결과 확인
mysql -u root -p function_live_sync -e "SELECT COUNT(*) FROM student_sessions"
```

---

### 6. 크로스 브라우저 테스트

다음 브라우저에서 테스트:
- ✅ Chrome (최신)
- ✅ Firefox (최신)
- ✅ Safari (최신)
- ✅ Edge (최신)
- ⚠️ IE11 (기본 기능만)

확인 사항:
- 그래프 렌더링
- 애니메이션
- 반응형 디자인
- 스마트폰 시뮬레이션

---

### 7. 모바일 테스트

#### 실제 모바일 기기
1. 스마트폰에서 URL 접속
2. 터치 입력 확인
3. 확대/축소 동작 확인
4. 가로/세로 모드 전환 확인

#### 브라우저 개발자 도구
1. F12 → Device Toolbar (Ctrl+Shift+M)
2. iPhone, iPad, Android 기기 시뮬레이션
3. 다양한 화면 크기 테스트

---

### 8. 자동화 테스트 (선택사항)

#### JavaScript 단위 테스트 (Jest)

```bash
npm install --save-dev jest

# test/parser.test.js
```

```javascript
const FunctionParser = require('../frontend/js/parser.js');

test('parses linear function correctly', () => {
    const parser = new FunctionParser();
    const result = parser.parse('y = 2x + 3');

    expect(result.success).toBe(true);
    expect(result.parameters.type).toBe('linear');
    expect(result.parameters.slope).toBe(2);
    expect(result.parameters.intercept).toBe(3);
});

test('detects quadratic function', () => {
    const parser = new FunctionParser();
    const type = parser.detectFunctionType('y = x^2');

    expect(type).toBe('quadratic');
});
```

```bash
# 실행
npm test
```

---

## 체크리스트

### 필수 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 문제 조회 API 동작
- [ ] 세션 생성 및 관리
- [ ] 함수 파싱 정확성
- [ ] 그래프 렌더링
- [ ] 실시간 동기화
- [ ] 답안 제출

### 추가 테스트
- [ ] 다양한 함수 타입
- [ ] 에러 처리
- [ ] 성능 (렌더링 속도)
- [ ] 크로스 브라우저
- [ ] 모바일 반응형
- [ ] 보안 (SQL injection, XSS)

### 프로덕션 배포 전
- [ ] HTTPS 설정
- [ ] CORS 특정 도메인만 허용
- [ ] 에러 로그 비활성화
- [ ] 데이터베이스 백업 설정
- [ ] 성능 모니터링
- [ ] Moodle 연동 테스트

---

## 문제 보고

테스트 중 문제 발견 시:
1. 브라우저 콘솔 스크린샷
2. Network 탭 요청/응답
3. 재현 단계
4. 예상 동작 vs 실제 동작

GitHub Issue로 보고해주세요!
