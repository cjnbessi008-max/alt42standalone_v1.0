# 빠른 시작 가이드

## 5분 안에 시작하기

### 1단계: 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: Docker로 실행 (가장 쉬운 방법)

```bash
# Docker Compose 실행
docker-compose up -d

# 실행 확인
docker-compose ps
```

3개의 컨테이너가 실행됩니다:
- `triangle-frontend` (포트 3000)
- `triangle-backend` (포트 5000)
- `triangle-db` (포트 5432)

### 3단계: 앱 접속

브라우저에서 다음 주소 접속:
- http://localhost:3000

데모 문제가 자동으로 로드됩니다!

## 스마트폰에서 테스트하기

### 방법 1: 같은 Wi-Fi 네트워크

1. PC의 IP 주소 확인:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. 스마트폰 브라우저에서 접속:
   ```
   http://[PC-IP주소]:3000
   ```

### 방법 2: ngrok 사용

```bash
# ngrok 설치 (https://ngrok.com)
ngrok http 3000
```

생성된 URL을 스마트폰에서 접속!

## Moodle 연동하기

### 1. Moodle Web Service 활성화

Moodle 관리자 설정:
1. **사이트 관리 → 플러그인 → 웹 서비스 → 개요**
2. 다음 항목 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

### 2. 토큰 생성

1. **사이트 관리 → 사용자 → 권한 → 토큰 관리**
2. 새 토큰 생성
3. 생성된 토큰 복사

### 3. 환경 변수 설정

`backend/.env` 파일 수정:
```env
MOODLE_URL=https://your-moodle-instance.com
MOODLE_WS_TOKEN=복사한_토큰_붙여넣기
```

### 4. 백엔드 재시작

```bash
docker-compose restart backend
```

## 문제 추가하기

### API로 문제 생성

```bash
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새로운 문제",
    "description": "설명",
    "sourceTriangle": {
      "id": "src",
      "vertices": [
        {"x": 100, "y": 100},
        {"x": 200, "y": 100},
        {"x": 150, "y": 200}
      ],
      "color": "#3b82f6",
      "isTarget": false,
      "scaleFactor": 1
    },
    "targetTriangle": {
      "id": "tgt",
      "vertices": [
        {"x": 300, "y": 200},
        {"x": 500, "y": 200},
        {"x": 400, "y": 400}
      ],
      "color": "#8b5cf6",
      "isTarget": true,
      "scaleFactor": 2
    },
    "requiredScaleFactor": 2.0,
    "tolerance": 0.05,
    "difficulty": "medium"
  }'
```

## 문제 해결

### 포트가 이미 사용 중인 경우

docker-compose.yml 파일에서 포트 변경:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # 3000 → 3001로 변경
```

### 데이터베이스 초기화

```bash
# 모든 데이터 삭제하고 재시작
docker-compose down -v
docker-compose up -d
```

### 로그 확인

```bash
# 모든 컨테이너 로그
docker-compose logs -f

# 특정 컨테이너만
docker-compose logs -f backend
```

## 다음 단계

- [전체 문서 읽기](../README.md)
- [API 문서](API.md)
- [개발 가이드](DEVELOPMENT.md)

## 도움이 필요하신가요?

- GitHub Issues에 질문 남기기
- 이메일: support@kaist-touchmath.edu
