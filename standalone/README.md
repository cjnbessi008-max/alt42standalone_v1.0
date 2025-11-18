# Alt42 Standalone - AI 학습 추천 시스템

완전한 독립형 웹앱으로 작동하는 AI 기반 적응형 수학 학습 시스템입니다.

## 🎯 주요 기능

### 1. **AI 기반 추천 엔진**
- 머신러닝 알고리즘을 활용한 개인화된 문제 추천
- 학습자의 약점 분석 및 보완 문제 제공
- 적응형 난이도 조절 시스템
- 실시간 성과 분석 기반 추천

### 2. **로그 스케일 그래프 with Area Color**
- Chart.js를 사용한 아름다운 데이터 시각화
- 로그 스케일 적용으로 작은 변화도 명확하게 표시
- Area Fill 기능으로 직관적인 진행도 확인
- 데스크톱과 모바일 화면에 각각 최적화된 그래프

### 3. **완전한 오프라인 지원 (PWA)**
- Service Worker를 통한 오프라인 작동
- 로컬 스토리지 기반 데이터 저장
- 인터넷 연결 없이도 모든 기능 사용 가능
- 설치 가능한 Progressive Web App

### 4. **포괄적인 학습 분석**
- 실시간 학습 통계 및 인사이트
- 카테고리별/난이도별 성과 분석
- 연속 학습일 추적
- 업적 시스템으로 동기부여

### 5. **스마트폰 화면 시뮬레이션**
- 우측 하단에 가상 스마트폰 UI
- 모바일 학습 경험 미리보기
- 미니 그래프로 간편한 진행도 확인

## 📁 파일 구조

```
standalone/
├── index.html              # 메인 HTML
├── manifest.json          # PWA 매니페스트
├── sw.js                  # Service Worker
├── css/
│   └── main.css          # 메인 스타일시트
├── js/
│   ├── storage.js        # 로컬 스토리지 관리
│   ├── problem-database.js   # 문제 데이터베이스 (25개 문제)
│   ├── recommendation-engine.js  # AI 추천 엔진
│   ├── learning-analytics.js     # 학습 분석
│   ├── graph-manager.js   # 그래프 관리 (Area Color)
│   └── app.js            # 메인 앱 로직
├── data/                 # 데이터 파일
└── assets/               # 이미지 및 아이콘
```

## 🚀 시작하기

### 1. 로컬에서 실행

```bash
# 웹 서버 실행 (Python 3)
cd standalone
python3 -m http.server 8000

# 또는 Node.js
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

### 2. PWA로 설치

1. Chrome/Edge 브라우저에서 접속
2. 주소창 우측의 "설치" 아이콘 클릭
3. 데스크톱 앱처럼 사용 가능

## 💡 사용 방법

### 기본 학습 흐름

1. **문제 추천 받기**
   - AI가 당신의 학습 패턴을 분석하여 최적의 문제 추천
   - 추천 이유와 함께 문제 제시

2. **문제 풀기**
   - 답안 입력 후 제출
   - 힌트 기능 활용 가능
   - 문제 스킵 가능

3. **결과 확인**
   - 즉시 정답/오답 피드백
   - 상세한 해설 제공
   - 점수 및 통계 업데이트

4. **진행도 분석**
   - 로그 그래프로 학습 추이 확인
   - 카테고리별 강점/약점 파악
   - 개인화된 추천 받기

### 추천 알고리즘 이해하기

AI 추천 엔진은 다음 요소를 고려합니다:

- **약점 보완 (40%)**: 정답률이 낮은 카테고리 우선 추천
- **적응형 난이도 (30%)**: 최근 성적에 따라 난이도 조절
- **다양성 (20%)**: 다양한 분야 경험 유도
- **최근 성과 (10%)**: 연승/연패 상황 고려

## 📊 로그 스케일 그래프

### Area Color 특징

```javascript
// 그래프 설정 예시
{
    backgroundColor: 'rgba(102, 126, 234, 0.3)', // Area Color
    fill: true,                                   // 영역 채우기
    tension: 0.4                                  // 부드러운 곡선
}
```

### 로그 스케일 이점

- 작은 변화도 명확하게 시각화
- 초기 학습자의 빠른 성장 곡선 표시
- 장기적인 학습 추이 파악 용이

## 🎨 커스터마이징

### 색상 변경

`css/main.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* 원하는 색상으로 변경 */
}
```

### 문제 추가

`js/problem-database.js`에서 문제 객체 추가:

```javascript
{
    id: 26,
    category: '대수학',
    difficulty: 'medium',
    question: '문제 내용',
    answer: '정답',
    hint: '힌트',
    explanation: '해설',
    points: 20
}
```

### 추천 알고리즘 조정

`js/recommendation-engine.js`에서 가중치 수정:

```javascript
this.algorithmWeights = {
    weaknessTarget: 0.4,      // 약점 보완
    difficultyProgression: 0.3, // 난이도 진행
    varietyBonus: 0.2,         // 다양성
    recentPerformance: 0.1     // 최근 성과
};
```

## 🔧 고급 기능

### 데이터 백업 및 복원

```javascript
// 브라우저 콘솔에서
window.alt42.exportData()  // 백업
window.alt42.importData()  // 복원
```

### 앱 초기화

```javascript
window.alt42.resetApp()    // 모든 데이터 삭제 및 리셋
```

### 디버깅

```javascript
// 현재 상태 확인
console.log(window.alt42.storage.get('statistics'));
console.log(window.alt42.analytics.generateAnalyticsReport());

// 추천 테스트
const rec = window.alt42.recommendationEngine.recommendProblem();
console.log(rec);
```

## 📱 모바일 최적화

- 반응형 디자인으로 모든 화면 크기 지원
- 터치 인터페이스 최적화
- 스마트폰 화면 시뮬레이션 포함
- PWA 설치로 네이티브 앱 경험

## 🎓 학습 데이터 분석

### 제공되는 인사이트

1. **전체 통계**
   - 총 푼 문제 수
   - 전체 정답률
   - 획득 점수
   - 연속 학습일

2. **카테고리별 분석**
   - 각 카테고리별 정답률
   - 강점/약점 카테고리 식별
   - 마스터리 수준 평가

3. **난이도별 분석**
   - 난이도별 성과
   - 적정 난이도 추천

4. **시간 분석**
   - 문제당 평균 풀이 시간
   - 총 학습 시간
   - 학습 효율성 평가

5. **진행도 분석**
   - 최근 성적 추이
   - 향상도 측정
   - 일관성 점수

## 🏆 업적 시스템

- **시작이 반**: 10개 문제 해결
- **반백 달성**: 50개 문제 해결
- **백 문제 돌파**: 100개 문제 해결
- **완벽주의자**: 90% 이상 정답률 (20문제 이상)
- **일주일 연속**: 7일 연속 학습
- **한 달 마스터**: 30일 연속 학습
- **포인트 마스터**: 1000점 이상 획득
- **카테고리 마스터**: 특정 분야 85% 이상 달성

## 🔒 개인정보 보호

- 모든 데이터는 브라우저 로컬 스토리지에 저장
- 서버 전송 없음 (완전한 클라이언트 사이드)
- 외부 추적 없음
- 개인정보 수집 없음

## 🐛 문제 해결

### 그래프가 표시되지 않음

```javascript
// 콘솔에서 확인
console.log(window.Chart); // Chart.js 로드 확인
graphManager.initMainChart(); // 그래프 재초기화
```

### 데이터가 저장되지 않음

- 브라우저 로컬 스토리지 활성화 확인
- 시크릿 모드에서는 데이터가 저장되지 않을 수 있음
- 저장 공간 확인 (5-10MB 권장)

### 오프라인 모드가 작동하지 않음

- HTTPS 환경 또는 localhost 필요
- Service Worker 등록 확인: `navigator.serviceWorker.controller`
- 캐시 강제 업데이트: 개발자 도구 → Application → Service Workers → Update

## 🔄 업데이트 로드맵

- [ ] 더 많은 문제 추가 (100개 이상)
- [ ] 추가 과목 (영어, 과학 등)
- [ ] 친구와 경쟁 기능
- [ ] 학습 목표 설정
- [ ] 음성 입력 지원
- [ ] 다국어 지원

## 📄 라이선스

MIT License

## 🙏 기여

이슈와 풀 리퀘스트를 환영합니다!

## 📧 문의

문제나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Alt42** - AI와 함께하는 똑똑한 학습 🎓✨
