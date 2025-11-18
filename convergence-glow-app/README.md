# 🌟 Convergence Glow - Standalone PWA

**수열의 수렴과 발산을 색감으로 시각화하는 독립형 Progressive Web App**

Moodle LMS 의존성을 제거하고 완전히 독립적으로 작동하는 교육용 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🚀 독립형 PWA
- **오프라인 지원**: 서비스 워커를 통한 완전한 오프라인 실행
- **설치 가능**: 홈 화면에 추가하여 네이티브 앱처럼 사용
- **빠른 로딩**: 최적화된 빌드와 캐싱으로 즉각적인 실행

### 📊 로컬 데이터 관리
- **IndexedDB**: 문제, 응답, 통계 데이터를 브라우저에 안전하게 저장
- **데이터 내보내기/가져오기**: JSON 형식으로 데이터 백업 및 복원
- **통계 추적**: 일별 학습 진행 상황 및 정확도 추적

### 🎨 향상된 시각화
- **부드러운 애니메이션**: 60fps Canvas 기반 실시간 렌더링
- **색감 기반 학습**: 직관적인 색상 변화로 수렴/발산 표현
- **인터랙티브**: 파티클 효과 및 동적 강조 표시

### 🔢 다양한 수열 지원
- 등차수열 (Arithmetic)
- 등비수열 (Geometric)
- 조화수열 (Harmonic)
- 사용자 정의 수식

### 📱 반응형 디자인
- 모바일, 태블릿, 데스크톱 완벽 지원
- 3D 스마트폰 UI 시뮬레이션
- 터치 및 마우스 상호작용

## 🛠 기술 스택

- **Vite**: 초고속 빌드 도구
- **Vanilla JavaScript (ES6+)**: 프레임워크 없는 순수 JavaScript
- **IndexedDB** (via `idb`): 로컬 데이터베이스
- **Canvas API**: 고성능 2D 시각화
- **Service Worker**: PWA 오프라인 지원
- **CSS3**: 모던 CSS with Custom Properties

## 🚀 빠른 시작

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 브라우저에서 열기

```
http://localhost:3000
```

## 📁 프로젝트 구조

```
convergence-glow-app/
├── public/
│   ├── manifest.json          # PWA 매니페스트
│   └── sw.js                   # 서비스 워커
├── src/
│   ├── core/
│   │   ├── database.js         # IndexedDB 래퍼
│   │   ├── sequence-engine.js  # 수열 계산 엔진
│   │   └── visualizer.js       # Canvas 시각화 엔진
│   ├── styles/
│   │   └── main.css            # 메인 스타일시트
│   └── main.js                 # 앱 진입점
├── index.html                  # HTML 템플릿
├── vite.config.js              # Vite 설정
├── package.json
└── README.md
```

## 💡 사용 방법

### 1. 문제 선택
- 앱이 시작되면 무작위 문제가 로드됩니다
- "🔄 새로운 문제" 버튼으로 다른 문제 선택

### 2. 시각화 설정
- **항의 개수**: 10~100개 조절
- **애니메이션 속도**: 0.5x~3.0x 조절

### 3. 시각화 시작
- "▶️ 시각화 시작" 버튼 클릭
- 수열이 색감 변화와 함께 애니메이션으로 표시

### 4. 답변 선택
- 시각화 완료 후 수렴/발산/진동수렴 선택
- 즉각적인 정답 피드백 제공

### 5. 학습 통계 확인
- 오늘의 시도 횟수
- 정확도 퍼센트

## 🎓 교육적 활용

### 학습 목표
- 수열의 극한 개념 이해
- 수렴과 발산의 차이점 인식
- 진동하며 수렴하는 수열 이해

### 추천 학습 순서
1. **기초**: 등비수열 (공비 0.5) - 수렴 개념
2. **기초**: 등비수열 (공비 2) - 발산 개념
3. **중급**: 조화수열 - 느린 수렴
4. **고급**: 진동 수열 - 부호 변화

## 🎨 색상 의미

| 색상 변화 | 의미 |
|---------|------|
| 노란색 → 청록색 | 수렴 (차가운 색으로 안정) |
| 청록색 → 빨간색 | 발산 (따뜻한 색으로 확산) |
| 분홍색 → 보라색 | 진동하며 수렴 |

## 🔧 커스터마이징

### 새로운 문제 추가

IndexedDB에 직접 문제를 추가할 수 있습니다:

```javascript
import { getDatabase } from './src/core/database.js';

const db = await getDatabase();

await db.addProblem({
    type: 'geometric',
    difficulty: 'medium',
    title: '나만의 수열',
    formula: {
        expression: 'a_n = 2 × (0.7)^n',
        latex: 'a_n = 2 \\times (0.7)^n',
        nStart: 0
    },
    initialTerm: 2,
    commonRatio: 0.7,
    convergenceType: 'convergent',
    limitValue: 0,
    visualConfig: {
        colorStart: '#FFE66D',
        colorEnd: '#4ECDC4',
        animationSpeed: 1.0
    },
    description: '설명 추가'
});
```

### 시각화 설정

`src/core/visualizer.js`의 설정을 조정:

```javascript
this.config = {
    colorStart: '#FFE66D',      // 시작 색상
    colorEnd: '#4ECDC4',        // 종료 색상
    animationSpeed: 1.0,        // 속도
    fps: 60,                     // 프레임레이트
    particleEffects: true,      // 파티클 효과
    showGrid: false             // 그리드 표시
};
```

## 📊 데이터 관리

### 데이터 내보내기

```javascript
const db = await getDatabase();
const exportData = await db.exportData();
const json = JSON.stringify(exportData, null, 2);

// 파일로 저장
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'convergence-glow-data.json';
a.click();
```

### 데이터 가져오기

```javascript
const db = await getDatabase();
const importData = JSON.parse(jsonString);
await db.importData(importData);
```

## 🌐 PWA 설치

### Android Chrome
1. 메뉴 → "홈 화면에 추가"
2. 아이콘 생성 확인

### iOS Safari
1. 공유 버튼 → "홈 화면에 추가"
2. 추가 확인

### Desktop Chrome
1. 주소창 우측의 설치 아이콘 클릭
2. "설치" 확인

## 🐛 문제 해결

### "데이터베이스 초기화 실패"
- 브라우저가 IndexedDB를 지원하는지 확인
- 프라이빗 모드가 아닌지 확인
- 브라우저 캐시 및 저장소 설정 확인

### "시각화가 표시되지 않음"
- Canvas API 지원 브라우저 사용 (Chrome, Firefox, Safari, Edge)
- 개발자 도구 콘솔에서 JavaScript 에러 확인

### "오프라인 모드가 작동하지 않음"
- HTTPS 또는 localhost에서 실행 중인지 확인
- 서비스 워커가 등록되었는지 확인 (DevTools > Application > Service Workers)

## 🔐 보안 및 프라이버시

- **모든 데이터는 로컬 저장**: 서버로 전송되지 않음
- **오프라인 우선**: 네트워크 연결 불필요
- **안전한 수식 평가**: 제한된 수식만 허용

## 📈 성능 최적화

- **코드 스플리팅**: vendor 청크 분리
- **트리 쉐이킹**: 사용하지 않는 코드 제거
- **압축 및 난독화**: Terser로 최소화
- **캐싱 전략**: Service Worker로 네트워크 요청 최소화

## 🤝 기여

버그 리포트 및 기능 제안 환영합니다!

## 📝 라이선스

MIT License

---

**Convergence Glow** - 수학을 색감으로 경험하는 혁신적인 독립형 PWA 🌈
