# 🚀 빠른 시작 가이드

이 가이드는 5분 안에 시스템을 실행할 수 있도록 도와줍니다.

## 필수 조건

- Docker와 Docker Compose가 설치되어 있어야 합니다
- Anthropic API Key가 필요합니다 ([console.anthropic.com](https://console.anthropic.com/)에서 무료 발급)

## 설치 단계

### 1. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 열고 API 키 입력
# ANTHROPIC_API_KEY=your_api_key_here
```

### 2. Docker Compose로 실행

```bash
# 모든 서비스 시작 (데이터베이스, 백엔드, 프론트엔드)
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 3. 브라우저에서 접속

- **프론트엔드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

## 사용 방법

1. **학생 등록**: 이름과 학년을 입력합니다
2. **문제 풀기**: 시스템이 제공하는 문제를 풉니다
3. **추론 설명**: 틀렸다면 이유를 한 문장으로 설명합니다
4. **피드백 확인**: AI가 분석한 피드백을 확인합니다

## 문제 해결

### 포트가 이미 사용 중인 경우

`docker-compose.yml`에서 포트를 변경하세요:

```yaml
ports:
  - "8001:8000"  # 백엔드를 8001로 변경
  - "3001:3000"  # 프론트엔드를 3001로 변경
```

### 데이터베이스 연결 오류

```bash
# 데이터베이스 상태 확인
docker-compose ps database

# 데이터베이스 재시작
docker-compose restart database
```

### API 키 오류

- `.env` 파일에 API 키가 올바르게 설정되었는지 확인
- Anthropic 콘솔에서 API 키가 활성화되어 있는지 확인

## 추가 문제 추가하기

데이터베이스에 직접 연결하거나 API를 통해 문제를 추가할 수 있습니다:

### 방법 1: API 사용

```bash
curl -X POST http://localhost:8000/api/problems/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "분수 곱셈",
    "description": "1/2 × 1/3 = ?",
    "problem_type": "fractions",
    "difficulty_level": 2,
    "correct_answer": "1/6",
    "answer_type": "text"
  }'
```

### 방법 2: 데이터베이스 직접 접근

```bash
# PostgreSQL에 연결
docker-compose exec database psql -U reasoning_user -d reasoning_db

# SQL 실행
INSERT INTO problems (title, description, problem_type, difficulty_level, correct_answer)
VALUES ('새 문제', '문제 설명', 'arithmetic', 1, '정답');
```

## 서비스 종료

```bash
# 모든 서비스 종료
docker-compose down

# 데이터베이스까지 삭제 (주의!)
docker-compose down -v
```

## 다음 단계

- 📖 전체 문서: [README.md](README.md)
- 🔧 Moodle 통합: [LMS Integration](#lms-integration)
- 🎨 커스터마이징: 프롬프트 및 UI 수정

## 지원

문제가 발생하면 GitHub Issues에 문의해주세요.
