# Quick Start Guide

## 빠른 시작 가이드

이 가이드를 따라 논리적 간격 정량화 시스템을 로컬 환경에서 실행할 수 있습니다.

## 사전 요구사항

- Docker 및 Docker Compose
- Anthropic API Key (Claude AI 사용을 위해 필요)

## 1단계: API Key 설정

1. `.env` 파일을 편집합니다:
```bash
nano .env
```

2. `ANTHROPIC_API_KEY` 값을 자신의 API key로 변경합니다:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
```

## 2단계: 애플리케이션 실행

```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 3단계: 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 4단계: 사용 시작

1. 브라우저에서 http://localhost:3000 접속
2. "문제 목록" 클릭
3. 샘플 문제 선택 (초기 데이터베이스에 기본 문제가 포함됨)
4. 풀이 과정을 단계별로 입력
5. "제출 및 분석 시작" 클릭
6. AI 분석 결과 확인

## 문제 해결

### 포트 충돌
다른 애플리케이션이 포트를 사용 중인 경우:

```bash
# .env 파일에서 포트 변경
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### 데이터베이스 연결 오류
```bash
# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

### API Key 오류
- `.env` 파일에 올바른 ANTHROPIC_API_KEY가 설정되어 있는지 확인
- 컨테이너 재시작: `docker-compose restart backend`

## 서비스 중지

```bash
docker-compose down
```

## 데이터 초기화

```bash
# 모든 데이터와 함께 컨테이너 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d
```

## 다음 단계

- [API 문서](http://localhost:8000/docs)에서 모든 엔드포인트 확인
- 새로운 문제 추가하기
- 분석 결과 데이터 탐색하기
