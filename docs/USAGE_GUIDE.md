# Alt42 사용 가이드

## 목차
1. [빠른 시작](#빠른-시작)
2. [학생 인터페이스 사용법](#학생-인터페이스-사용법)
3. [교사 인터페이스 사용법](#교사-인터페이스-사용법)
4. [LMS 연동 설정](#lms-연동-설정)
5. [고급 기능](#고급-기능)
6. [문제 해결](#문제-해결)

---

## 빠른 시작

### 1단계: 시스템 시작

```bash
# 터미널 1: 백엔드 서버 시작
cd backend/api
python main.py

# 터미널 2: 프론트엔드 개발 서버 시작
cd frontend
npm start
```

### 2단계: 브라우저에서 접속

- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:8000/docs

### 3단계: 마이크 권한 허용

처음 접속 시 브라우저에서 마이크 접근 권한을 요청합니다. "허용"을 클릭하세요.

---

## 학생 인터페이스 사용법

### 학습 세션 시작

1. **로그인**
   ```
   학생 ID를 입력하고 "학습 시작" 버튼 클릭
   ```

2. **한숨 감지 활성화**
   ```
   자동으로 마이크를 통해 한숨 감지가 시작됩니다.
   화면 상단의 "감지 중" 표시를 확인하세요.
   ```

3. **학습 진행**
   ```
   평소처럼 학습을 진행하세요.
   시스템이 백그라운드에서 한숨을 감지합니다.
   ```

### 휴식 제안 받기

#### 자동 제안
시스템이 다음 상황에서 자동으로 휴식을 제안합니다:
- 깊은 한숨이 3회 이상 감지되었을 때
- 스트레스 레벨이 70% 이상일 때
- 90분 이상 학습했을 때

#### 휴식 제안 모달

모달이 표시되면:

```
┌─────────────────────────────────────┐
│  💆 휴식 시간이에요                   │
│                                     │
│  스트레스 레벨: ████████░░ 80%       │
│                                     │
│  스트레스 징후가 감지되었습니다       │
│  (3회의 깊은 한숨)                   │
│                                     │
│  추천 활동:                          │
│  • 심호흡 운동 (5분)                │
│  • 전신 스트레칭 (10분)              │
│  • 마음챙김 명상 (10분)              │
│                                     │
│  [나중에]  [휴식하기]                │
└─────────────────────────────────────┘
```

**선택 옵션:**
1. **휴식하기**: 추천 활동 중 하나를 선택하여 휴식 시작
2. **나중에**: 모달 닫기 (10초 후 자동으로 닫힘)

### 휴식 활동 선택

1. 원하는 활동 카드를 클릭하여 선택
2. 선택된 활동은 파란색 테두리로 표시됨
3. "휴식하기" 버튼 클릭

### 스트레스 레벨 모니터링

화면 우측 상단에서 실시간 스트레스 레벨 확인:
- 🟢 녹색 (0-40%): 양호
- 🟡 노란색 (40-60%): 보통
- 🟠 주황색 (60-80%): 높음
- 🔴 빨간색 (80-100%): 매우 높음

---

## 교사 인터페이스 사용법

### 학생 모니터링 대시보드

교사는 다음 정보를 확인할 수 있습니다:

```
┌─────────────────────────────────────────┐
│  학생 학습 상태 모니터링                  │
├─────────────────────────────────────────┤
│  학생 ID     스트레스   한숨 횟수   휴식 │
│  ─────────────────────────────────────  │
│  김철수      ███░░░░░   2회        1회  │
│  이영희      ██████░░   5회        3회  │
│  박민수      ████░░░░   3회        2회  │
└─────────────────────────────────────────┘
```

### 휴식 제안 이력 조회

```bash
# API를 통해 학생의 휴식 제안 이력 조회
curl http://localhost:8000/api/break/history/student_001?limit=10
```

응답:
```json
{
  "student_id": "student_001",
  "history": [
    {
      "stress_level": 0.75,
      "reason_ko": "90분간 학습하셨습니다. 재충전할 시간입니다.",
      "timestamp": "2025-11-18T14:30:00"
    }
  ],
  "total": 1
}
```

---

## LMS 연동 설정

### Canvas LMS 연동

#### 1단계: Canvas API 토큰 발급

1. Canvas 관리자 페이지 접속
2. Settings → Approved Integrations
3. New Access Token 생성
4. 토큰 복사

#### 2단계: Alt42에 LMS 등록

```bash
curl -X POST "http://localhost:8000/api/lms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_canvas",
    "lms_type": "canvas",
    "base_url": "https://your-canvas-instance.com",
    "api_token": "your_token_here"
  }'
```

#### 3단계: 학습 세션 시작

```bash
curl -X POST "http://localhost:8000/api/lms/session/start" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_canvas",
    "student_id": "student_001",
    "course_id": "course_123"
  }'
```

### Moodle LMS 연동

#### 1단계: Moodle 웹 서비스 활성화

1. Site administration → Plugins → Web services → Manage protocols
2. REST protocol 활성화
3. External service 생성

#### 2단계: 사용자 토큰 생성

```bash
# Moodle 관리자 페이지에서 토큰 생성
Site administration → Plugins → Web services → Manage tokens
```

#### 3단계: Alt42에 등록

```bash
curl -X POST "http://localhost:8000/api/lms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_moodle",
    "lms_type": "moodle",
    "base_url": "https://your-moodle-instance.com",
    "api_token": "your_wstoken_here"
  }'
```

### KAIST LMS 연동

```bash
curl -X POST "http://localhost:8000/api/lms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "kaist_lms",
    "lms_type": "kaist",
    "base_url": "https://kaist-lms.example.com",
    "api_token": "your_kaist_token"
  }'
```

### LMS 알림 테스트

```bash
curl -X POST "http://localhost:8000/api/lms/notification/break" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_canvas",
    "student_id": "student_001",
    "course_id": "course_123",
    "reason": "Time for a break!",
    "reason_ko": "휴식 시간이에요!"
  }'
```

---

## 고급 기능

### 통합 워크플로우 API

오디오 분석 + 휴식 제안 + LMS 알림을 한 번에 처리:

```bash
curl -X POST "http://localhost:8000/api/workflow/analyze-and-suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_001",
    "audio_samples": [0.1, 0.2, ...],
    "sample_rate": 16000
  }'
```

### 커스텀 휴식 활동 추가

`backend/services/break_suggestion/break_service.py`의 `BREAK_ACTIVITIES` 리스트에 추가:

```python
BreakActivity(
    "my_custom_activity",
    "Custom Activity",
    "나만의 활동",
    "Description in English",
    "한국어 설명",
    10,  # duration in minutes
    BreakType.MEDIUM_BREAK,
    "easy"
)
```

### 한숨 감지 임계값 조정

`backend/services/sigh_detection/sigh_detector.py`에서 설정 변경:

```python
class SighDetector:
    # 한숨 감지 임계값
    CONFIDENCE_THRESHOLD = 0.7  # 높일수록 엄격
    STRESS_ACCUMULATION_THRESHOLD = 3  # 횟수 조정
    STRESS_TIME_WINDOW = timedelta(minutes=10)  # 시간 윈도우
```

---

## 문제 해결

### 마이크 접근 권한 오류

**증상**: "마이크 접근 권한이 필요합니다" 오류

**해결방법**:
1. 브라우저 설정 → 개인정보 및 보안 → 사이트 설정
2. 마이크 권한 확인
3. localhost:3000에 마이크 접근 허용

### 한숨 감지가 작동하지 않음

**체크리스트**:
- [ ] 마이크가 올바르게 연결되어 있는가?
- [ ] 브라우저 콘솔에 오류가 있는가?
- [ ] 백엔드 서버가 실행 중인가?
- [ ] API 엔드포인트가 응답하는가?

```bash
# API 헬스 체크
curl http://localhost:8000/health
```

### LMS 연동 실패

**확인 사항**:
1. API 토큰이 유효한가?
2. LMS URL이 올바른가?
3. 네트워크 연결이 정상인가?
4. LMS 서버가 응답하는가?

```bash
# LMS 연결 테스트
curl -X GET "https://your-lms.com/api/v1/courses" \
  -H "Authorization: Bearer your_token"
```

### 높은 False Positive 비율

한숨이 아닌 소리를 한숨으로 감지하는 경우:

**해결방법**:
1. `CONFIDENCE_THRESHOLD` 값 증가 (0.7 → 0.85)
2. 마이크 노이즈 캔슬레이션 활성화
3. 조용한 환경에서 테스트

### 성능 문제

**최적화 팁**:
- 오디오 샘플링 레이트 조정 (16000 → 8000)
- 감지 주기 증가 (5초 → 10초)
- 브라우저 하드웨어 가속 활성화

---

## 추가 리소스

- [API 문서](http://localhost:8000/docs)
- [아키텍처 문서](./ARCHITECTURE.md)
- [배포 가이드](./DEPLOYMENT.md)
- [기여 가이드](../CONTRIBUTING.md)

---

**문의사항이 있으시면 이슈를 등록해주세요!** 📧
