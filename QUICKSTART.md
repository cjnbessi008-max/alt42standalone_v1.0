# 🚀 빠른 시작 가이드

## 5분 안에 실행하기

### 1️⃣ 사전 준비
Docker가 설치되어 있는지 확인:
```bash
docker --version
docker-compose --version
```

### 2️⃣ 환경 설정 (선택사항)
Moodle 연동을 원하시면:
```bash
# backend/.env 파일 수정
cd backend
nano .env

# MOODLE_URL과 MOODLE_TOKEN 업데이트
```

### 3️⃣ 실행
```bash
# 프로젝트 루트에서
docker-compose up -d

# 로그 확인 (선택사항)
docker-compose logs -f
```

### 4️⃣ 접속
브라우저에서 다음 주소로 접속:
```
http://localhost:5173
```

우측 하단에 **스마트폰 화면**이 표시되며, 샘플 문제가 자동으로 로드됩니다!

## ✅ 동작 확인

### 화면에 표시되어야 하는 것들:
- ✅ 좌측: 문제 목록 (3개 샘플 문제)
- ✅ 우측 하단: 스마트폰 프레임
- ✅ 스마트폰 내부: 함수 그래프
- ✅ "▶ 애니메이션" 버튼

### 애니메이션 테스트:
1. 문제 카드 클릭 (예: "절댓값 함수의 미분가능성")
2. 우측 스마트폰 화면에서 **"▶ 애니메이션"** 버튼 클릭
3. 미분 가능한 구간이 **흐르는 색상**으로 애니메이션됩니다!

## 🎯 주요 기능 체험

### 1. 문제 선택
좌측 패널에서 문제 카드를 클릭하면 스마트폰 화면이 업데이트됩니다.

### 2. 애니메이션 제어
- **▶ 재생**: 미분 가능한 구간을 부드럽게 표시
- **⏸ 일시정지**: 애니메이션 중지

### 3. 구간 정보 확인
스마트폰 화면을 스크롤하여:
- ✓ 미분가능 구간 (초록색)
- ✗ 미분불가 구간 (빨간색)

## 🛑 중지 방법

```bash
# 서비스 중지 (데이터 보존)
docker-compose stop

# 완전히 제거 (데이터 삭제)
docker-compose down -v
```

## 🐛 문제 발생 시

### "Cannot connect to backend" 에러
```bash
# 백엔드 로그 확인
docker-compose logs backend

# 백엔드 재시작
docker-compose restart backend
```

### MySQL 연결 실패
```bash
# MySQL이 준비될 때까지 기다리기 (약 30초)
docker-compose logs mysql | grep "ready for connections"

# 모든 서비스 재시작
docker-compose restart
```

### 포트 충돌 (이미 사용 중)
다른 서비스가 포트를 사용 중이라면 docker-compose.yml에서 포트 변경:
```yaml
ports:
  - "5174:5173"  # 5173 → 5174로 변경
```

## 📖 더 알아보기

자세한 내용은 [README.md](README.md)를 참조하세요.

---

**즐거운 학습 되세요! 🎓**
