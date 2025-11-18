# Color Union - 독립형 웹앱 (AI 추천 시스템)

**색감이 섞이며 확장되는 합집합 - AI 기반 적응형 학습 플랫폼**

완전히 독립적으로 실행 가능한 Progressive Web App (PWA)으로, 서버나 외부 의존성 없이 브라우저에서 완전히 작동합니다.

## 🌟 주요 기능

### 1. **AI 기반 맞춤형 추천 시스템**
- 📊 실시간 학습 패턴 분석
- 🎯 약점 영역 자동 감지 및 집중 학습
- 📈 적응형 난이도 조정 (5단계: Beginner → Expert)
- 💡 개인화된 학습 경로 제공
- 🔄 학습 트렌드 분석 (Improving/Stable/Declining)

### 2. **완전 독립형 아키텍처**
- ✅ 서버 불필요 (100% 클라이언트 사이드)
- ✅ Moodle 의존성 제거
- ✅ IndexedDB 로컬 데이터베이스
- ✅ 오프라인 완전 지원
- ✅ 설치 가능한 PWA

### 3. **사용자 관리 시스템**
- 🔐 로컬 인증 (SHA-256 해싱)
- 👤 프로필 관리
- 📧 이메일 기반 계정
- 🎓 학년별 맞춤 설정

### 4. **진보된 학습 분석**
- 📊 정확도 추적
- ⏱️ 평균 풀이 시간 분석
- 🏆 최고 점수 기록
- 🔥 연속 학습 스트릭
- 💪 강점/약점 영역 식별

### 5. **PWA 기능**
- 📱 홈 화면에 설치 가능
- 🌐 오프라인 작동
- 🔔 푸시 알림 (선택적)
- ⚡ 빠른 로딩 (Service Worker 캐싱)
- 💾 백그라운드 동기화

## 📁 프로젝트 구조

```
color-union-standalone/
├── index.html                  # 랜딩 페이지 (로그인/회원가입)
├── app.html                    # 메인 학습 앱
├── dashboard.html              # 분석 대시보드
├── manifest.json               # PWA 매니페스트
├── service-worker.js           # 오프라인 지원
│
├── css/
│   ├── main.css               # 메인 스타일
│   ├── auth.css               # 인증 스타일
│   ├── app.css                # 앱 스타일
│   └── dashboard.css          # 대시보드 스타일
│
├── js/
│   ├── app.js                 # 메인 앱 컨트롤러
│   │
│   └── modules/
│       ├── storage.js         # IndexedDB 관리
│       ├── auth.js            # 인증 시스템
│       ├── recommendation.js  # AI 추천 엔진
│       ├── notification.js    # 알림 시스템
│       ├── analytics.js       # 학습 분석
│       └── color-union-core.js # 핵심 학습 로직
│
├── assets/
│   ├── icons/                 # PWA 아이콘
│   ├── images/                # 이미지 리소스
│   └── screenshots/           # 앱 스크린샷
│
└── data/
    └── backup.json            # 데이터 백업
```

## 🚀 시작하기

### 방법 1: 직접 실행 (로컬 서버)

```bash
# 1. 프로젝트 복사
cd color-union-standalone

# 2. 로컬 웹 서버 실행 (Python)
python3 -m http.server 8000

# 또는 Node.js
npx serve

# 3. 브라우저에서 열기
open http://localhost:8000
```

### 방법 2: 웹 서버에 배포

```bash
# Apache/Nginx 웹 서버에 복사
cp -r color-union-standalone /var/www/html/color-union

# 또는 GitHub Pages에 배포
# (별도 설정 필요 없음 - 완전히 정적)
```

### 방법 3: PWA 설치

1. 브라우저에서 앱 열기
2. 주소 표시줄 또는 메뉴에서 "설치" 또는 "홈 화면에 추가" 클릭
3. 앱이 독립적으로 실행됩니다!

## 📖 사용 방법

### 1. 회원가입

```
1. "시작하기" 버튼 클릭
2. 사용자명, 이메일, 비밀번호, 학년 입력
3. 회원가입 완료
```

### 2. 학습 시작

```
1. 로그인
2. 메인 화면에서 "학습 시작" 클릭
3. AI가 추천한 문제 풀이
4. 실시간 피드백 및 점수 확인
```

### 3. 진행 상황 확인

```
1. 대시보드 메뉴 클릭
2. 통계 및 분석 확인:
   - 전체 정확도
   - 평균 점수
   - 약점 영역
   - 학습 트렌드
   - 스킬 레벨
```

## 🤖 AI 추천 시스템 동작 원리

### 1. 성과 분석
```javascript
// 최근 20개 문제 분석
- 정확도 계산
- 평균 풀이 시간
- 강점/약점 영역 식별
- 학습 트렌드 분석
```

### 2. 난이도 조정
```
정확도 ≥ 90% → 난이도 상승
정확도 < 50% → 난이도 하락
50% ≤ 정확도 < 90% → 유지
```

### 3. 문제 추천
```
약점 영역 70% + 복습 30%
또는
균형 잡힌 혼합 (강점이 없을 경우)
```

### 4. 학습 경로
```
Beginner (2-4 elements, 1-10 range)
↓
Easy (3-5 elements, 1-15 range)
↓
Medium (4-7 elements, 1-20 range)
↓
Hard (6-9 elements, 1-30 range)
↓
Expert (8-12 elements, 1-50 range)
```

## 📊 데이터 구조 (IndexedDB)

### 주요 Store

#### 1. **users**
```javascript
{
  id: 1,
  username: "student1",
  email: "student@example.com",
  passwordHash: "sha256...",
  grade: "elementary-5",
  createdAt: "2025-11-18T...",
  settings: { ... }
}
```

#### 2. **sessions**
```javascript
{
  id: 1,
  userId: 1,
  startedAt: "2025-11-18T...",
  completedAt: "2025-11-18T...",
  isCompleted: true,
  score: 85,
  problems: [...]
}
```

#### 3. **userProgress**
```javascript
{
  userId: 1,
  totalSessions: 15,
  totalProblems: 150,
  correctProblems: 128,
  averageScore: 85.3,
  bestScore: 98,
  currentStreak: 5,
  skillLevel: 3,
  experiencePoints: 1250,
  weakAreas: ["large_sets", "high_overlap"],
  strongAreas: ["small_sets", "no_overlap"]
}
```

#### 4. **recommendations**
```javascript
{
  userId: 1,
  difficulty: "medium",
  problemTypes: [
    { type: "large_sets", weight: 0.5 },
    { type: "high_overlap", weight: 0.2 },
    { type: "mixed", weight: 0.3 }
  ],
  setSize: { min: 4, max: 7 },
  reasoning: "현재 정확도: 75.5% large_sets 영역 집중 학습을 권장합니다."
}
```

## 🎨 커스터마이징

### 추천 알고리즘 조정

`js/modules/recommendation.js:line 35`:
```javascript
// 약점 영역 비율 조정
const weaknessWeight = 0.7; // 70% 약점, 30% 복습
```

### 난이도 임계값 변경

`js/modules/recommendation.js:line 245`:
```javascript
if (accuracy >= 90) {  // 90% → 85%로 변경 가능
    return this.increaseDifficulty(skillLevel);
}
```

### 색상 테마 변경

`css/main.css:line 12`:
```css
:root {
    --primary-color: #667eea;  /* 원하는 색상으로 변경 */
    --secondary-color: #764ba2;
}
```

## 🔒 보안 고려사항

### 현재 구현
- ✅ SHA-256 비밀번호 해싱
- ✅ 클라이언트 사이드 검증
- ✅ XSS 방지 (textContent 사용)
- ✅ CSRF 토큰 (선택적)

### 프로덕션 권장사항
```bash
# 더 강력한 해싱 라이브러리 사용
npm install bcrypt.js

# 또는
npm install argon2-browser
```

## 📈 성능 최적화

### Service Worker 캐싱
- 정적 자산: 영구 캐시
- HTML 페이지: 네트워크 우선
- API 응답: 런타임 캐시

### IndexedDB 최적화
- 인덱스 사용: `username`, `email`, `userId`
- 쿼리 제한: 최근 20개 항목만
- 백그라운드 정리: 오래된 데이터 자동 삭제

## 💾 데이터 백업/복원

### 백업
```javascript
// 브라우저 콘솔에서 실행
const data = await storageManager.exportData();
const json = JSON.stringify(data);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

// 다운로드 링크 생성
const a = document.createElement('a');
a.href = url;
a.download = 'color-union-backup.json';
a.click();
```

### 복원
```javascript
// 파일 선택 후
const file = document.querySelector('input[type="file"]').files[0];
const reader = new FileReader();

reader.onload = async (e) => {
    const data = JSON.parse(e.target.result);
    await storageManager.importData(data);
    console.log('복원 완료!');
};

reader.readAsText(file);
```

## 🌐 브라우저 호환성

| 브라우저 | 버전 | 지원 |
|---------|------|------|
| Chrome | 80+ | ✅ 완전 지원 |
| Firefox | 75+ | ✅ 완전 지원 |
| Safari | 13+ | ✅ 완전 지원 |
| Edge | 80+ | ✅ 완전 지원 |
| Opera | 67+ | ✅ 완전 지원 |

### 필수 기능
- IndexedDB
- Service Workers
- LocalStorage
- Web App Manifest
- Crypto API

## 🐛 문제 해결

### 문제: PWA 설치 안 됨
```
해결: HTTPS 필요 (로컬에서는 localhost 허용)
또는 manifest.json 경로 확인
```

### 문제: 데이터 저장 안 됨
```
해결: IndexedDB 사용 가능 확인
콘솔: await storageManager.init()
```

### 문제: 로그인 유지 안 됨
```
해결: LocalStorage 확인
시크릿 모드에서는 작동하지 않음
```

## 📝 라이선스

교육 목적 오픈 소스 프로젝트

## 🎯 로드맵

### v1.1 (예정)
- [ ] 음성 피드백
- [ ] 게임화 요소 (배지, 업적)
- [ ] 친구 챌린지
- [ ] 리더보드

### v1.2 (예정)
- [ ] 다크 모드
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 접근성 개선 (WCAG AA)
- [ ] 모바일 네이티브 앱 (Capacitor)

### v2.0 (예정)
- [ ] 서버 동기화 (선택적)
- [ ] 멀티 플레이어 모드
- [ ] AI 튜터 챗봇
- [ ] 증강현실 (AR) 모드

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 연락처

프로젝트 링크: [https://github.com/your-repo/color-union-standalone](https://github.com/your-repo/color-union-standalone)

## 🙏 감사의 말

- AI Education System Pipeline PRD에 기반
- IndexedDB API
- Service Worker API
- Web App Manifest Specification

---

**Made with ❤️ for Education**
