# Higher Derivative Lines

고계 도함수를 색다른 선 스타일로 표현하는 교육용 수학 시각화 시스템

## 프로젝트 개요

Higher Derivative Lines는 Moodle LMS와 연동하여 수학 함수의 고계 도함수를 시각화하는 웹 애플리케이션입니다. 각 도함수 차수마다 고유한 선 스타일(실선, 점선, 파선 등)을 사용하여 학생들이 도함수의 특성을 직관적으로 이해할 수 있도록 돕습니다.

### 주요 특징

- **고계 도함수 계산**: 최대 5차 도함수까지 자동 계산
- **차별화된 시각화**: 각 도함수 차수마다 다른 선 스타일과 색상 적용
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 디바이스 시뮬레이션
- **Moodle 연동**: PHP 7.1.9, MySQL 5.7, Moodle 3.7과 완벽 호환
- **실시간 그래프**: 인터랙티브한 수학 함수 그래프 렌더링
- **다양한 색상 테마**: Professional, Vibrant, Pastel, Colorblind-friendly 등

### 선 스타일 규칙

| 도함수 | 표기 | 선 스타일 | 색상 (Professional) |
|--------|------|-----------|---------------------|
| 원함수 | f(x) | 실선 (굵게) | Dark Blue-Gray |
| 1차 도함수 | f'(x) | 파선 | Red |
| 2차 도함수 | f''(x) | 점선 | Blue |
| 3차 도함수 | f'''(x) | 파선-점선 | Green |
| 4차 도함수 | f⁽⁴⁾(x) | 파선-점-점 | Purple |

## 기술 스택

### Backend
- **Python 3.11+**: FastAPI, SymPy, NumPy, Matplotlib
- **PHP 7.1.9**: Moodle 연동 API
- **MySQL 5.7**: 데이터베이스

### Frontend
- **React 18+**: TypeScript
- **Recharts**: 그래프 시각화
- **Vite**: 빌드 도구

### Infrastructure
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 오케스트레이션

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── ai-pipeline/              # Python FastAPI 백엔드
│   │   ├── math_engine/
│   │   │   └── calculus/
│   │   │       ├── derivatives.py    # 도함수 계산 엔진
│   │   │       ├── graphing.py       # 그래프 생성
│   │   │       └── visualization.py  # 선 스타일 관리
│   │   ├── main.py               # FastAPI 애플리케이션
│   │   └── requirements.txt
│   └── moodle-integration/       # PHP Moodle 연동
│       ├── php/
│       │   ├── api/              # REST API 엔드포인트
│       │   ├── config/           # 설정 파일
│       │   └── lib/              # API 클라이언트
│       └── sql/
├── frontend/                     # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── math-visualization/
│   │   │   │   └── DerivativeGraph.tsx
│   │   │   └── virtual-display/
│   │   │       └── SmartphoneScreen.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── database/
│   └── mysql/
│       ├── init/
│       │   └── schema.sql        # 데이터베이스 스키마
│       └── my.cnf                # MySQL 설정
├── docker/                       # Docker 설정
│   ├── fastapi.dockerfile
│   ├── php-moodle.dockerfile
│   └── frontend.dockerfile
├── docker-compose.yml
└── README.md
```

## 설치 및 실행

### 사전 요구사항

- Docker & Docker Compose
- Git

### 설치 단계

1. **저장소 클론**

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**

```bash
cp .env.example .env
# .env 파일을 열어 필요한 설정을 수정하세요
```

3. **Docker 컨테이너 실행**

```bash
docker-compose up -d
```

4. **데이터베이스 초기화** (첫 실행 시 자동으로 실행됨)

데이터베이스가 자동으로 초기화되며, 샘플 데이터가 삽입됩니다.

5. **서비스 접속**

- **프론트엔드**: http://localhost:3000
- **FastAPI 백엔드**: http://localhost:8000
- **FastAPI 문서**: http://localhost:8000/docs
- **PHP API**: http://localhost:8080

### 개별 서비스 실행 (개발용)

#### Python Backend

```bash
cd backend/ai-pipeline
pip install -r requirements.txt
python main.py
```

#### React Frontend

```bash
cd frontend
npm install
npm run dev
```

#### MySQL 데이터베이스

```bash
docker run -d \
  --name mysql-derivative \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=moodle \
  -e MYSQL_USER=moodleuser \
  -e MYSQL_PASSWORD=moodlepass \
  -p 3306:3306 \
  -v $(pwd)/database/mysql/init:/docker-entrypoint-initdb.d \
  mysql:5.7
```

## API 사용 예시

### 1. 도함수 계산

```bash
curl -X POST http://localhost:8000/api/derivatives \
  -H "Content-Type: application/json" \
  -d '{
    "function": "x**3 - 3*x**2 + 2*x + 1",
    "max_order": 3
  }'
```

### 2. 그래프 생성

```bash
curl -X POST http://localhost:8000/api/graph \
  -H "Content-Type: application/json" \
  -d '{
    "function": "x**3 - 3*x**2 + 2*x + 1",
    "max_order": 3,
    "domain_min": -2,
    "domain_max": 4,
    "num_points": 500,
    "color_scheme": "professional"
  }'
```

### 3. Moodle 문제 처리

```bash
curl -X POST http://localhost:8000/api/moodle/question \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 1,
    "user_id": 1,
    "function": "x**2 + 2*x + 1",
    "required_orders": [0, 1, 2]
  }'
```

## 사용 방법

### 웹 인터페이스

1. **함수 입력**: Python 문법으로 수식 입력 (예: `x**2 + 2*x + 1`)
2. **옵션 설정**:
   - 최대 도함수 차수 (1-5)
   - 정의역 범위 (Min, Max)
   - 색상 테마 선택
   - 표시할 도함수 선택
3. **그래프 생성**: "Generate Graph" 버튼 클릭
4. **결과 확인**: 우측 하단 가상 스마트폰 화면에서 그래프 확인

### 함수 표기법

- **거듭제곱**: `x**2` (x²), `x**3` (x³)
- **곱셈**: `2*x`, `3*x**2`
- **삼각함수**: `sin(x)`, `cos(x)`, `tan(x)`
- **지수/로그**: `exp(x)`, `ln(x)`, `log(x)`
- **기타**: `sqrt(x)`, `abs(x)`

### 예제 함수

- `x**2 + 2*x + 1` - 간단한 2차 함수
- `x**3 - 3*x**2 + 2*x + 1` - 임계점이 있는 3차 함수
- `sin(x)` - 삼각함수 (주기적 도함수)
- `exp(x)` - 지수함수 (불변 도함수)
- `x**4 - 4*x**3 + 6*x**2 - 4*x + 1` - 4차 다항식

## Moodle 연동

### 데이터베이스 테이블

- `mdl_derivative_functions`: 도함수 문제 저장
- `mdl_student_derivative_work`: 학생 답안 추적
- `mdl_derivative_graph_settings`: 사용자 그래프 설정
- `mdl_derivative_activity_log`: 활동 로그
- `mdl_derivative_progress`: 학생 진도 추적

### PHP API 엔드포인트

- `POST /api/math_endpoints.php/calculate`: 도함수 계산
- `POST /api/math_endpoints.php/graph`: 그래프 생성
- `POST /api/math_endpoints.php/question`: Moodle 문제 처리
- `POST /api/math_endpoints.php/save-progress`: 진도 저장
- `GET /api/math_endpoints.php/get-progress`: 진도 조회

## 개발

### 테스트

```bash
# Python 테스트
cd backend/ai-pipeline
python -m pytest

# Frontend 테스트
cd frontend
npm test
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f fastapi
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### 개발 모드

모든 서비스는 핫 리로드를 지원합니다:
- FastAPI: `--reload` 플래그로 실행
- React: Vite의 HMR (Hot Module Replacement)
- PHP: 볼륨 마운트로 실시간 반영

## 문제 해결

### MySQL 연결 오류

```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# 데이터베이스 재초기화
docker-compose down -v
docker-compose up -d
```

### Python 의존성 오류

```bash
# 컨테이너 재빌드
docker-compose build fastapi
docker-compose up -d fastapi
```

### 프론트엔드 빌드 오류

```bash
# Node 모듈 재설치
cd frontend
rm -rf node_modules
npm install

# 또는 Docker에서
docker-compose build frontend
docker-compose up -d frontend
```

## 라이센스

이 프로젝트는 교육용 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈 트래커를 통해 제출해 주세요.

## 개발팀

KAIST Touch Math Academy - AI Education System Pipeline

## 버전 히스토리

- **v1.0.0** (2024-01-18): 초기 릴리스
  - 고계 도함수 계산 및 시각화
  - Moodle 3.7 연동
  - 가상 스마트폰 디스플레이
  - Docker 기반 배포

## 추가 리소스

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [SymPy 문서](https://docs.sympy.org/)
- [Recharts 문서](https://recharts.org/)
- [Moodle 3.7 문서](https://docs.moodle.org/37/en/Main_page)
