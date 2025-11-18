# 빠른 시작 가이드 (Quick Start Guide)

Color Partition 기능을 바로 사용해보세요!

## 1단계: Docker로 실행 (가장 빠른 방법)

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 브라우저에서 접속
# http://localhost:3000
```

완료! 🎉

## 2단계: 첫 번째 함수 분석

1. 브라우저에서 `http://localhost:3000` 접속
2. 기본 함수 `x**2 - 4*x + 3`가 입력되어 있음
3. "분석하기 (Analyze)" 버튼 클릭
4. 그래프와 색깔 구간이 표시됨!

## 3단계: 다른 함수 시도하기

### 예시 1: 3차 함수
```
x**3 - 3*x**2 - 9*x + 5
```
x 범위: -4 ~ 6

### 예시 2: 삼각함수
```
sin(x)
```
x 범위: -6.28 ~ 6.28

### 예시 3: 지수함수
```
exp(-x**2/2)
```
x 범위: -4 ~ 4

### 예시 4: 복합함수
```
x**2 * sin(x)
```
x 범위: -10 ~ 10

## 4단계: 가상 스마트폰 화면 보기

- 우측 하단에 스마트폰 프레임이 표시됨
- 최소화/닫기 버튼으로 제어 가능
- 메인 화면의 "가상 스마트폰 보기" 버튼으로 토글

## API 직접 테스트

### cURL로 테스트
```bash
curl -X POST "http://localhost:8000/api/analyze-function" \
  -H "Content-Type: application/json" \
  -d '{
    "expression": "x**2 - 4*x + 3",
    "x_min": -2,
    "x_max": 6,
    "properties": ["increasing", "decreasing"]
  }'
```

### Swagger UI로 테스트
`http://localhost:8000/docs` 접속

## 중지 및 재시작

```bash
# 중지
docker-compose down

# 재시작
docker-compose up -d

# 완전 삭제 (데이터 포함)
docker-compose down -v
```

## 트러블슈팅

### 문제: 포트가 이미 사용 중
```bash
# 포트 확인
lsof -i :3000
lsof -i :8000

# docker-compose.yml에서 포트 변경
```

### 문제: 백엔드 연결 실패
```bash
# 백엔드 로그 확인
docker-compose logs backend

# 백엔드 재시작
docker-compose restart backend
```

### 문제: 함수 분석 오류
- 올바른 Python 문법 사용: `x**2` (O), `x^2` (X)
- 곱셈 기호 명시: `2*x` (O), `2x` (X)
- 지원 함수: sin, cos, tan, exp, log, sqrt 등

## 다음 단계

- `README.md`: 전체 문서 읽기
- `tasks/0001-prd-ai-education-pipeline.md`: PRD 문서
- `database/schemas/`: 데이터베이스 스키마 확인
- LMS 연동 준비하기

## 문의

문제가 있나요? GitHub Issues에 등록해주세요!
