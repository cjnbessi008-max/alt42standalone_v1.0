# 수학사 여정: 수의 문명을 찾아서

<div align="center">

**역사 속 수학을 체험하는 교육용 RPG 게임**

[게임 시작하기](#설치-및-실행) | [문서 보기](./docs/GDD-math-history-game.md)

</div>

---

## 🎮 프로젝트 소개

"수학사 여정"은 17개의 수학 영역을 역사적 시대별로 여행하며, 각 시대의 수학적 발견을 직접 체험하는 몰입형 학습 게임입니다.

### 핵심 특징

- 🏛️ **역사적 서사**: 메소포타미아부터 현대까지, 수학 발전의 역사를 시대감 있는 문투로 경험
- 🧩 **인터랙티브 퍼즐**: 각 시대의 수학적 문제를 직접 풀어보는 체험형 학습
- 🃏 **카드 수집 시스템**: 역사적 순간과 수학자들을 카드로 수집
- 📊 **능력치 시스템**: 창의성, 직관, 집착, 논리, 상상력 - 학습자의 성향 추적
- 🎨 **반실사풍 비주얼**: 시대별 색감과 애니메이션으로 몰입도 극대화

---

## 📚 17개의 여정

### Chapter 1: 수체계 (수의 역사) ✅
1. ✅ 메소포타미아 - 점토판의 기록 (60진법)
2. ✅ 이집트 - 단위분수의 비밀
3. ⏳ 그리스 - 무리수의 발견과 공포
4. ⏳ 인도 - 0의 탄생과 세계의 변화
5. ⏳ 아랍 - 십진법의 완성과 전파
6. ⏳ 르네상스 - 음수를 둘러싼 논쟁
7. ⏳ 근대 - 허수와 복소평면

### 향후 챕터
- Chapter 2: 지수와 로그
- Chapter 3: 수열
- Chapter 4: 식의 계산
- Chapter 5: 집합과 명제
- Chapter 6: 방정식
- Chapter 7: 부등식
- Chapter 8: 함수
- Chapter 9: 미분
- Chapter 10: 적분
- Chapter 11: 평면도형
- Chapter 12: 평면좌표
- Chapter 13: 입체도형
- Chapter 14: 공간좌표
- Chapter 15: 벡터
- Chapter 16: 경우의 수·확률
- Chapter 17: 통계

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Animation**: Framer Motion
- **Math Rendering**: KaTeX
- **Routing**: React Router v6

### Design
- **Typography**: Georgia (본문), Arial (제목), Nanum Myeongjo (한글 명조)
- **Color Palette**: 시대별 색상 (고대, 중세, 근대, 현대)
- **Animations**: Framer Motion + CSS animations

---

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── docs/
│   └── GDD-math-history-game.md    # 게임 디자인 문서
├── src/
│   ├── components/
│   │   ├── scenes/                 # Scene별 컴포넌트
│   │   │   ├── Scene1ClayTablet.tsx
│   │   │   └── Scene2UnitFractions.tsx
│   │   └── SceneTransitionScreen.tsx
│   ├── data/
│   │   └── chapter1-number-system.ts  # Chapter 1 데이터
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GamePage.tsx
│   │   └── CardAlbumPage.tsx
│   ├── store/
│   │   └── gameStore.ts            # Zustand 상태 관리
│   ├── types/
│   │   └── index.ts                # TypeScript 타입 정의
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎯 개발 로드맵

### Phase 1: 프로토타입 (현재 단계) 🔄
- [x] GDD 작성
- [x] 프로젝트 구조 설정
- [x] Scene 1 구현 (점토판)
- [x] Scene 2 구현 (단위분수)
- [x] 기본 UI 프레임워크
- [x] 능력치 시스템
- [x] 카드 시스템
- [ ] Scene 3-7 구현

### Phase 2: Chapter 1 완성
- [ ] 나머지 Scene 구현
- [ ] 장면 전환 연출 완성
- [ ] 비주얼 이미지 추가

### Phase 3: 확장
- [ ] 나머지 16개 챕터 콘텐츠 작성
- [ ] 각 챕터별 구현

### Phase 4: 폴리싱
- [ ] 사운드/음악 추가
- [ ] 성능 최적화
- [ ] 모바일 반응형 개선

---

## 🎨 스크린샷 (예정)

_개발 완료 후 스크린샷 추가 예정_

---

## 📖 참고 자료

### 수학사 리서치
- 메소포타미아 60진법 (바빌로니아 점토판)
- 이집트 단위분수 (Rhind Papyrus)
- 그리스 무리수 발견 (피타고라스 학파, 히파소스)
- 인도 0의 발명 (브라마굽타, 아리아바타)
- 아랍 십진법 전파 (알콰리즈미)
- 르네상스 음수 수용 (카르다노)
- 복소수와 복소평면 (오일러, 가우스)

### 참고 링크
- [Game Design Document](./docs/GDD-math-history-game.md)
- [Task PRD](./tasks/0001-prd-ai-education-pipeline.md)

---

## 🤝 기여하기

이 프로젝트는 교육용 목적으로 개발되었습니다. 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 교육용으로 개발되었습니다.

---

## 👥 제작

**개발**: Claude (Anthropic AI) + Human Collaboration
**기획**: 수학사 교육 게임 컨셉
**버전**: 1.0.0
**날짜**: 2025-11-20

---

<div align="center">

**수의 문명을 찾아서, 여정을 떠나보세요!**

[게임 시작하기](#설치-및-실행) | [문서 보기](./docs/GDD-math-history-game.md)

</div>
