# 빠른 시작 가이드

## 3단계로 실행하기

### 1. 의존성 설치
```bash
cd webapp
npm run setup
```

### 2. 데이터베이스 초기화
```bash
cd backend
npm run init-db
npm run seed
cd ..
```

### 3. 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

## 또는 자동 스크립트 사용 (Linux/Mac)

```bash
cd webapp
chmod +x start.sh
./start.sh
```

## Windows

```cmd
cd webapp
npm run setup
cd backend
npm run init-db
npm run seed
cd ..
npm run dev
```

## 샘플 데이터

### 학생
- 김철수 (ID: 1) - 분수 덧셈에 어려움
- 이영희 (ID: 2) - 전반적으로 우수
- 박민수 (ID: 3) - 중간 수준
- 최지현 (ID: 4) - 초급 단계

### 시도해 보기
1. 홈 페이지에서 학생 선택
2. 대시보드에서 AI 추천 문제 확인
3. "시각화" 메뉴에서 개념-문제 관계 그래프 탐색

## 주요 기능

- **AI 추천**: 3가지 알고리즘 조합 (컨텐츠, 협업, 지식그래프)
- **시각화**: D3.js 인터랙티브 그래프
- **분석**: 강점/약점 개념 자동 파악

## 문제 해결

### 포트가 이미 사용 중
```bash
# backend/.env 파일에서 PORT 변경
PORT=3002
```

### 데이터베이스 리셋
```bash
cd backend
npm run init-db -- --reset
npm run seed
```

더 자세한 정보는 `README.md`를 참조하세요!
