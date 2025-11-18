# Quick Start Guide

Higher Derivative Lines를 5분 안에 시작하는 방법

## 빠른 시작 (Docker 사용)

### 1단계: 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: 환경 설정

```bash
cp .env.example .env
```

### 3단계: Docker로 실행

```bash
docker-compose up -d
```

### 4단계: 브라우저에서 접속

```
http://localhost:3000
```

완료! 🎉

## 첫 번째 그래프 만들기

1. 함수 입력란에 `x**2 + 2*x + 1` 입력
2. "Generate Graph" 버튼 클릭
3. 우측 하단 가상 스마트폰 화면에서 그래프 확인

## 서비스 상태 확인

```bash
docker-compose ps
```

모든 서비스가 "Up" 상태여야 합니다.

## 서비스 중지

```bash
docker-compose down
```

## 문제 발생 시

### 로그 확인
```bash
docker-compose logs -f
```

### 데이터베이스 재초기화
```bash
docker-compose down -v
docker-compose up -d
```

### 도움말
README.md의 "문제 해결" 섹션을 참조하세요.

## API 테스트

### FastAPI 문서 (Swagger)
```
http://localhost:8000/docs
```

### 간단한 API 호출 테스트
```bash
curl http://localhost:8000/api/examples
```

## 다음 단계

- README.md: 전체 문서 읽기
- API 탐색: http://localhost:8000/docs
- 다양한 함수 시도: sin(x), exp(x), x**3 등
