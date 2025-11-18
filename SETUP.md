# 빠른 시작 가이드 (Quick Start Guide)

## 5분 안에 실행하기

### 1단계: 사전 요구사항 확인

다음이 설치되어 있는지 확인하세요:
- [ ] Docker Desktop ([다운로드](https://www.docker.com/products/docker-desktop))

### 2단계: 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 3단계: 실행

```bash
docker-compose up -d
```

### 4단계: 접속

웹 브라우저에서 접속:
- **애플리케이션**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

### 5단계: 확인

1. 드롭다운에서 "김민수" 학생 선택
2. 타임라인과 통계 확인
3. 차트에서 학습 진행 상황 확인

## 문제 해결 (Troubleshooting)

### 포트 충돌

포트가 이미 사용 중이면:
```bash
# 다른 포트로 변경
# docker-compose.yml 파일에서 포트 수정
# 예: "3000:3000" -> "3001:3000"
```

### 데이터베이스 연결 실패

```bash
# 컨테이너 재시작
docker-compose restart db

# 로그 확인
docker-compose logs db
```

### 프론트엔드 빌드 오류

```bash
# 컨테이너 재빌드
docker-compose build --no-cache frontend-dev
docker-compose up -d
```

### 전체 초기화

```bash
# 모든 컨테이너와 볼륨 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d
```

## 샘플 데이터

초기 실행 시 다음 샘플 데이터가 자동으로 생성됩니다:

### 학생 (3명)
- 김민수 (3학년) - 28일간 학습 기록
- 이지은 (3학년) - 22일간 학습 기록
- 박서준 (4학년) - 5일간 학습 기록

### 모듈 (3개)
- 분수의 이해
- 분수의 덧셈과 뺄셈
- 분수의 곱셈

### 문제 (7개)
- 시각화, 덧셈, 뺄셈, 약분, 비교 등

### 풀이 시도 (24건)
- 정답/오답 기록
- 소요 시간 기록
- 힌트 사용 여부

## 다음 단계

- [ ] API 문서 탐색: http://localhost:8000/docs
- [ ] 새로운 학생 추가
- [ ] 커스텀 문제 생성
- [ ] 타임라인 필터링 테스트
- [ ] 프로덕션 배포 준비

## 지원

문제가 발생하면:
1. `docker-compose logs` 확인
2. README.md의 전체 문서 참조
3. GitHub Issues에 문의
