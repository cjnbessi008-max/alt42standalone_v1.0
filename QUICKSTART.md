# 🚀 Quick Start Guide

Overlap Sync Animation 빠른 시작 가이드

## 5분 안에 시작하기

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/cjnbessi008-max/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2️⃣ 의존성 설치

```bash
npm install
```

### 3️⃣ 개발 서버 실행

```bash
npm run dev
```

### 4️⃣ 브라우저에서 확인

브라우저에서 http://localhost:3000 접속

---

## 💡 주요 기능 미리보기

### ✨ 가상 스마트폰 화면
- 우측 하단에 실제 스마트폰과 유사한 UI로 표시
- 노치, 상태바, 홈 인디케이터 포함

### 🎯 Overlap Sync 애니메이션
- 두 개 이상의 도형이 서서히 겹쳐지는 애니메이션
- 원, 사각형, 삼각형 지원
- 부드러운 Framer Motion 애니메이션

### 🎮 애니메이션 제어
- ▶️ 재생/일시정지
- ⏹️ 정지
- 🔄 리셋

### 📚 다양한 난이도
- 🟢 **쉬움**: 기본 도형 2개
- 🟡 **보통**: 복잡한 도형 2개
- 🔴 **어려움**: 다중 도형 3개 이상

---

## 🔧 환경 설정 (선택사항)

### Mock 데이터 사용 (기본값)

기본적으로 Mock 데이터로 동작합니다. 별도 설정 없이 바로 사용 가능!

### 실제 LMS 연동

실제 Moodle LMS와 연동하려면:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
VITE_LMS_API_URL=http://your-lms-server.com/api
VITE_MOODLE_URL=https://your-moodle-instance.com
VITE_MOODLE_TOKEN=your_moodle_token_here
VITE_USE_MOCK_DATA=false
```

---

## 📦 프로덕션 빌드

```bash
# 빌드
npm run build

# 프리뷰
npm run preview
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 🎨 화면 구성

```
┌─────────────────────────────────────────────────────────────┐
│                    📚 학습 모듈 정보                          │
│  - 총 문제 수: 3개                                            │
│  - 현재 문제: 1 / 3                                           │
│  - 난이도: 🟢 쉬움                                            │
│                                                               │
│  문제 선택:                                  ┌──────────────┐│
│  ► 1. 원 겹치기 - 기초                       │  📱 Virtual  ││
│    2. 사각형 겹치기 - 중급                   │  Smartphone  ││
│    3. 복잡한 도형 겹치기 - 고급              │   Display    ││
│                                              │              ││
│  [← 이전]  [다음 →]                          │  [Animation] ││
│                                              │              ││
│  💡 시스템 설명                               │  [Controls]  ││
│  - Moodle 3.7+ LMS 연동                      │              ││
│  - PHP 7.1.9 + MySQL 5.7                    └──────────────┘│
│  - React 18 + TypeScript                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 사용 예시

### 1. 문제 선택
왼쪽 패널에서 "1. 원 겹치기 - 기초" 클릭

### 2. 애니메이션 시작
우측 스마트폰 화면에서 ▶️ 버튼 클릭

### 3. 관찰
- 두 원이 좌우에서 중앙으로 서서히 이동
- 진행률 바가 0% → 100% 증가
- 목표 겹침 비율 50% 도달 시 완료

### 4. 다음 문제
"다음 →" 버튼으로 다음 난이도 문제 진행

---

## 📱 지원 환경

- ✅ Chrome, Firefox, Safari, Edge (최신 버전)
- ✅ 데스크톱, 태블릿, 모바일
- ✅ 반응형 디자인

---

## 🆘 문제 해결

### "npm: command not found"
→ Node.js를 먼저 설치하세요: https://nodejs.org/

### "Port 3000 already in use"
→ 다른 포트 사용: `npm run dev -- --port 3001`

### 애니메이션이 작동하지 않음
→ 브라우저 콘솔(F12) 확인 후 에러 메시지 검색

---

## 📖 더 알아보기

- **상세 문서**: [README.md](./README.md)
- **백엔드 연동**: [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)
- **GitHub Issues**: 문제 발생 시 이슈 등록

---

## 🎉 완료!

이제 Overlap Sync Animation을 사용할 준비가 되었습니다!

**Happy Learning! 🚀📚**

---

**작성일**: 2025-01-18
**버전**: 1.0.0
