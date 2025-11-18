# 빠른 시작 가이드

메타인지 미러링 시스템을 5분 안에 실행해보세요!

## 1단계: 준비물 확인

- ✅ Docker Desktop 설치 완료
- ✅ Anthropic API Key (https://console.anthropic.com/)

## 2단계: API 키 설정

```bash
# .env 파일 생성
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

## 3단계: 실행

```bash
# 모든 서비스 실행 (데이터베이스, API, AI 서비스, 프론트엔드)
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 4단계: 접속

브라우저에서 http://localhost:3001 접속

## 5단계: 테스트

1. "학습 시작" 버튼 클릭
2. 분수 문제에 답 입력
3. 오른쪽 패널에서 메타인지 요약 확인!

## 문제 해결

### API 키 오류
```bash
# .env 파일에 올바른 키 설정 확인
cat .env
```

### 포트 충돌
```bash
# 다른 포트 사용 시 docker-compose.yml 수정
# 또는 기존 프로세스 종료
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
```

### 서비스 재시작
```bash
docker-compose down
docker-compose up -d
```

## 다음 단계

- [전체 문서 읽기](README.md)
- [시스템 설계 이해하기](docs/metacognitive-mirroring-design.md)
- [API 문서 확인](README.md#api-문서)
- [LMS 연동 설정](README.md#lms-연동-가이드)

## 데모 시나리오

### 분수 문제 풀이 체험

1. **문제 읽기** (5-10초 대기)
   - "문제를 꼼꼼히 읽으며 이해하고 있어요"

2. **분모 입력** (12 입력)
   - "통분을 위해 분모를 계산하고 있어요"

3. **분자 계산** (8+3=11 입력)
   - "분자를 더하는 계산을 실행하고 있어요"

4. **답안 제출**
   - "답을 검증하고 확인하고 있어요"

## 추가 정보

### 시스템 구성요소

- **Frontend**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **AI Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 유용한 명령어

```bash
# 상태 확인
docker-compose ps

# 로그 보기
docker-compose logs -f [service-name]

# 재시작
docker-compose restart [service-name]

# 중지
docker-compose down

# 데이터 초기화
docker-compose down -v
```

## 도움말

문제가 해결되지 않으면:
1. [README.md의 문제 해결 섹션](README.md#문제-해결) 확인
2. GitHub Issues에 문의
3. 로그 파일 첨부: `docker-compose logs > debug.log`

즐거운 학습 되세요! 🚀
