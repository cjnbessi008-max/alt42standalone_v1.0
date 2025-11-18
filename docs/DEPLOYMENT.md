# 배포 가이드

## Docker를 사용한 배포

### 개발 환경

1. **환경 변수 설정**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# backend/.env 파일 편집
nano backend/.env
```

2. **Docker Compose 실행**
```bash
docker-compose up -d
```

3. **데이터베이스 초기화**
```bash
# 마이그레이션 실행
docker-compose exec backend alembic upgrade head

# 또는 수동 SQL 실행
docker-compose exec db psql -U postgres -d ai_education_db -f /docker-entrypoint-initdb.d/001_init_schema.sql
```

4. **로그 확인**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 프로덕션 환경

#### 필수 사항
- 안전한 SECRET_KEY 설정
- HTTPS 인증서
- 프로덕션 데이터베이스 (관리형 PostgreSQL 권장)
- 환경 변수 보안 관리

#### 프로덕션 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: ${PRODUCTION_DATABASE_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DEBUG: "False"
      SECRET_KEY: ${SECRET_KEY}
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      VITE_API_BASE_URL: https://api.yourdomain.com/api/v1
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always
```

## Kubernetes 배포

### 1. Secret 생성
```bash
kubectl create secret generic app-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=anthropic-api-key=...
```

### 2. Deployment 적용
```bash
kubectl apply -f k8s/
```

### 3. Service 확인
```bash
kubectl get services
kubectl get pods
```

## AWS 배포

### ECS/Fargate 사용

1. **ECR에 이미지 푸시**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t ai-education-backend ./backend
docker tag ai-education-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-education-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-education-backend:latest
```

2. **RDS PostgreSQL 설정**
- RDS 인스턴스 생성
- VPC 및 보안 그룹 설정
- DATABASE_URL 업데이트

3. **ECS 태스크 정의 생성**
- Fargate 사용
- 환경 변수 설정
- 로그 드라이버 설정 (CloudWatch)

4. **ALB 설정**
- Application Load Balancer 생성
- HTTPS 리스너 설정
- SSL 인증서 적용

## 환경 변수 관리

### 프로덕션 환경 변수
```env
# Backend
DATABASE_URL=postgresql://user:pass@production-db:5432/dbname
ANTHROPIC_API_KEY=sk-ant-...
DEBUG=False
SECRET_KEY=<secure-random-key>
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### AWS Secrets Manager 사용
```bash
aws secretsmanager create-secret \
  --name ai-education/production \
  --secret-string file://secrets.json
```

## 데이터베이스 마이그레이션

### Alembic 사용
```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

## 모니터링

### 로그 관리
- CloudWatch Logs (AWS)
- ELK Stack
- Datadog

### 메트릭 수집
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
```

### 헬스 체크
```bash
curl http://localhost:8000/health
```

## 백업 전략

### 데이터베이스 백업
```bash
# PostgreSQL 백업
pg_dump -h localhost -U postgres ai_education_db > backup.sql

# 복원
psql -h localhost -U postgres ai_education_db < backup.sql
```

### 자동 백업 (AWS RDS)
- RDS 자동 백업 활성화
- 스냅샷 스케줄 설정
- 다른 리전으로 복제

## 성능 최적화

### 데이터베이스
- 인덱스 최적화
- 연결 풀링 설정
- 쿼리 최적화

### 캐싱
- Redis 사용
- API 응답 캐싱
- CDN 활용

### 로드 밸런싱
- 여러 백엔드 인스턴스
- 세션 스티키니스
- 헬스 체크 설정

## 보안 체크리스트

- [ ] HTTPS 강제
- [ ] 환경 변수 암호화
- [ ] SQL Injection 방어
- [ ] CORS 설정 검증
- [ ] Rate Limiting 적용
- [ ] 입력 검증
- [ ] 정기적인 보안 업데이트

## 트러블슈팅

### 일반적인 문제

1. **데이터베이스 연결 실패**
```bash
# 연결 테스트
docker-compose exec backend python -c "from app.core.database import engine; engine.connect()"
```

2. **Claude API 오류**
- API 키 확인
- 할당량 확인
- 네트워크 연결 확인

3. **CORS 오류**
- ALLOWED_ORIGINS 설정 확인
- 프론트엔드 URL 확인
