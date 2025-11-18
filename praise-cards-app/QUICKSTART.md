# 🚀 빠른 시작 가이드

## 1단계: 환경 설정 (5분)

### Anthropic API 키 발급
1. https://console.anthropic.com/ 접속
2. 회원가입 후 API Keys 메뉴 선택
3. "Create Key" 클릭하여 API 키 발급

### 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 API 키 입력
# ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 2단계: 서비스 시작 (2분)

```bash
# Docker로 모든 서비스 시작
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

서비스 준비 대기 (약 30초):
- ✅ postgres (데이터베이스)
- ✅ redis (캐시)
- ✅ backend (API 서버)
- ✅ frontend (웹 앱)

## 3단계: 데모 데이터 생성 (1분)

```bash
# Python 3가 설치되어 있어야 합니다
python3 demo_data.py
```

이 스크립트는 다음을 생성합니다:
- 3명의 샘플 학생
- 6-9개의 학습 세션
- 자동 생성된 칭찬 카드

## 4단계: 웹앱 확인

브라우저에서 열기:
- 🌐 **메인 앱**: http://localhost:3000
- 📚 **API 문서**: http://localhost:8000/docs

## 다음 단계

### 수동으로 데이터 추가하기

#### 1. 학생 추가
```bash
curl -X POST http://localhost:8000/api/v1/students/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "gildong@example.com",
    "grade_level": 5
  }'
```

#### 2. 학습 세션 기록 (카드 자동 생성)
```bash
# 학생 ID를 위에서 받은 것으로 교체하세요
curl -X POST http://localhost:8000/api/v1/learning-sessions/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "학생-ID-여기에-입력",
    "module_name": "수학 기초",
    "duration_minutes": 45,
    "questions_attempted": 20,
    "questions_correct": 18,
    "progress_percentage": 85.0
  }'
```

### 성취 기준

다음 조건을 만족하면 자동으로 칭찬 카드가 생성됩니다:

| 성취 | 조건 | 이모지 |
|------|------|--------|
| 높은 정확도 | 80% 이상 정답 | 🎯 |
| 연속 학습 | 3일 연속 학습 | 🔥 |
| 모듈 완료 | 진도율 100% | 🏆 |
| 학습 시간 | 하루 30분 이상 | ⏰ |
| 진도 향상 | 진도율 20% 이상 증가 | 🚀 |
| 만점 | 100% 정확도 | ⭐ |

### API 탐색

http://localhost:8000/docs 에서 모든 API를 테스트할 수 있습니다.

### 서비스 중지

```bash
# 서비스 중지
docker-compose down

# 데이터까지 삭제
docker-compose down -v
```

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 다른 포트로 변경
# docker-compose.yml 파일에서 ports를 수정:
# - "8001:8000"  # backend
# - "3001:3000"  # frontend
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 컨테이너 재시작
```bash
docker-compose restart backend
docker-compose restart frontend
```

## 추가 정보

자세한 내용은 [README.md](README.md)를 참조하세요.
