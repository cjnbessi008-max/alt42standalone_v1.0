# Curvy Log - Progressive Web App (PWA)

## 📱 독립형 웹 애플리케이션

Curvy Log는 이제 **Progressive Web App**으로 제공됩니다! 앱처럼 설치하고 오프라인에서도 사용할 수 있습니다.

---

## 🌟 PWA 주요 기능

### 1. **앱으로 설치 가능**
- 홈 화면에 앱 아이콘 추가
- 브라우저 없이 독립 실행
- 네이티브 앱과 유사한 사용자 경험
- Android, iOS, Windows, macOS 모두 지원

### 2. **오프라인 지원**
- Service Worker를 통한 자동 캐싱
- 인터넷 없이도 앱 사용 가능
- 데이터 동기화 (온라인 복귀 시)
- 오프라인 알림 표시

### 3. **AI 기반 학습 추천**
- 학습 패턴 자동 분석
- 맞춤형 콘텐츠 추천
- 약점 영역 식별
- 학습 진척도 추적

### 4. **실시간 알림**
- 학습 리마인더
- 새로운 추천 알림
- 앱 업데이트 알림
- 백그라운드 동기화

---

## 🚀 설치 방법

### Android (Chrome)

1. Chrome 브라우저에서 Curvy Log 열기
2. 주소창 오른쪽의 "설치" 버튼 클릭
3. 또는 메뉴(⋮) → "홈 화면에 추가"
4. 확인하면 홈 화면에 아이콘 추가

### iOS (Safari)

1. Safari에서 Curvy Log 열기
2. 공유 버튼(⎙) 탭
3. "홈 화면에 추가" 선택
4. "추가" 탭하여 설치 완료

### Windows/Mac (Chrome/Edge)

1. 브라우저에서 Curvy Log 열기
2. 주소창 오른쪽의 설치 아이콘(⊕) 클릭
3. "설치" 버튼 클릭
4. 데스크톱에서 앱처럼 실행

### 수동 설치 프롬프트

앱 내 "앱으로 설치" 버튼이 표시되면 클릭하여 설치할 수 있습니다.

---

## 🎯 주요 페이지

### 1. **메인 페이지** (`index.html`)
- Curvy Log 애니메이션 뷰어
- 가상 스마트폰 디스플레이
- 실시간 데이터 시각화
- 애니메이션 컨트롤

### 2. **대시보드** (`dashboard.html`)
- 학습 통계 요약
- 진척도 그래프
- 주간 활동 차트
- 최근 활동 목록

### 3. **AI 추천** (`recommendations.html`)
- 맞춤형 학습 추천
- 학습 인사이트
- 약점 분석
- 추천 콘텐츠 목록

### 4. **데모 모드** (`demo.html`)
- Moodle 없이 테스트 가능
- 샘플 데이터 제공
- 즉시 체험 가능

---

## 🔧 기술 스택

### PWA 핵심 기술

```
Progressive Web App
├── manifest.json          # 앱 메타데이터
├── service-worker.js      # 오프라인 지원
└── js/pwa-install.js      # 설치 관리
```

### 추천 엔진

```
AI Recommendation System
├── js/recommendation-engine.js   # 추천 알고리즘
├── api/get_recommendations.php   # 서버 API
└── recommendations.html          # UI
```

### 캐싱 전략

1. **Static Assets** (Cache-First)
   - HTML, CSS, JavaScript
   - 이미지, 폰트, 아이콘

2. **API Requests** (Network-First)
   - 최신 데이터 우선
   - 오프라인 시 캐시 사용

3. **Background Sync**
   - 온라인 복귀 시 자동 동기화
   - 실패한 요청 재시도

---

## 📊 AI 추천 알고리즘

### 분석 항목

1. **학습 패턴 분석**
   - 평균 점수 및 추세
   - 학습 빈도 및 간격
   - 시간대별 패턴

2. **성과 분석**
   - Catmull-Rom Spline 기반 곡선 분석
   - 선형 회귀로 학습 속도 계산
   - R² 값으로 신뢰도 측정

3. **약점 식별**
   - 표준편차 기반 임계값 설정
   - 주제별 성적 그룹화
   - 빈도와 심각도 분석

4. **정체기 감지**
   - 슬라이딩 윈도우로 분산 분석
   - 낮은 분산 구간 식별
   - 돌파 전략 추천

### 추천 타입

| 타입 | 우선순위 | 설명 |
|------|---------|------|
| `performance` | High | 성적 향상/하락 기반 추천 |
| `weak_area` | High | 약점 영역 집중 학습 |
| `plateau` | Medium | 정체기 돌파 전략 |
| `consistency` | Medium | 학습 규칙성 개선 |
| `engagement` | High | 학습 동기 부여 |
| `challenge` | Low | 고급 과정 도전 |

### 신뢰도 계산

```javascript
confidence = {
  performance: R² 값 (회귀 분석),
  weak_area: severity = (threshold - avgScore) / threshold,
  consistency: 1 - (stdDev / mean),
  engagement: (recentRatio + activityDensity) / 2
}
```

---

## 🎨 아이콘 생성

### 자동 생성 도구

`tools/generate-icons.html` 파일을 브라우저에서 열면 모든 크기의 아이콘이 자동으로 생성됩니다.

**생성되는 아이콘 크기:**
- 72x72 (Android)
- 96x96 (Android)
- 128x128 (Android)
- 144x144 (Android)
- 152x152 (iOS)
- 192x192 (Android, Chrome)
- 384x384 (Android)
- 512x512 (Splash Screen)

**사용 방법:**
1. `tools/generate-icons.html` 열기
2. "아이콘 생성" 버튼 클릭
3. 각 아이콘 개별 다운로드 또는 "모두 다운로드"
4. `/assets/icons/` 폴더에 저장

### 수동 생성

Canvas API를 사용하여 프로그래밍 방식으로 생성:

```javascript
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const dataUrl = generateIcon(size);
  downloadImage(dataUrl, `icon-${size}x${size}.png`);
});
```

---

## 🔔 알림 설정

### 권한 요청

```javascript
// 알림 권한 요청
await pwaInstaller.requestNotificationPermission();

// 알림 전송
await pwaInstaller.sendNotification('제목', {
  body: '내용',
  icon: '/assets/icons/icon-192x192.png',
  badge: '/assets/icons/badge-72x72.png',
  vibrate: [200, 100, 200]
});
```

### 푸시 알림 유형

1. **학습 리마인더**
   - 매일 같은 시간 알림
   - 학습 목표 달성 알림

2. **새로운 추천**
   - AI가 새 추천을 생성했을 때
   - 약점 영역 발견 시

3. **앱 업데이트**
   - 새 버전 출시 알림
   - 새 기능 안내

---

## 🌐 오프라인 기능

### 캐시 관리

Service Worker가 자동으로 다음 리소스를 캐시합니다:

```javascript
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/recommendations.html',
  '/demo.html',
  '/css/style.css',
  '/js/curvy-log.js',
  '/js/recommendation-engine.js',
  // ... more files
];
```

### 오프라인 상태 감지

```javascript
// 오프라인 감지
window.addEventListener('offline', () => {
  console.log('Offline mode');
  showOfflineBanner();
});

// 온라인 복귀
window.addEventListener('online', () => {
  console.log('Back online');
  syncData();
});
```

### 데이터 동기화

```javascript
// Background Sync API
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-learning-data');
});
```

---

## 📱 매니페스트 구성

`manifest.json` 파일의 주요 설정:

```json
{
  "name": "Curvy Log - AI Learning Analytics",
  "short_name": "Curvy Log",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#4a90e2",
  "icons": [...],
  "shortcuts": [
    {
      "name": "학습 대시보드",
      "url": "/dashboard.html"
    },
    {
      "name": "AI 추천",
      "url": "/recommendations.html"
    }
  ]
}
```

---

## 🔍 Service Worker 생명주기

### 1. Install
```javascript
self.addEventListener('install', event => {
  // 정적 자산 캐싱
  event.waitUntil(cacheStaticAssets());
});
```

### 2. Activate
```javascript
self.addEventListener('activate', event => {
  // 오래된 캐시 삭제
  event.waitUntil(cleanupOldCaches());
});
```

### 3. Fetch
```javascript
self.addEventListener('fetch', event => {
  // 요청 가로채기 및 캐시 전략 적용
  event.respondWith(handleFetch(event.request));
});
```

---

## 🧪 테스트

### PWA 기능 테스트

1. **Lighthouse 감사**
   ```bash
   # Chrome DevTools
   F12 → Lighthouse → Generate Report
   ```
   - PWA 점수 90+ 목표
   - 설치 가능성 확인
   - 오프라인 동작 확인

2. **Application 탭**
   ```bash
   # Chrome DevTools
   F12 → Application
   ```
   - Manifest 확인
   - Service Worker 상태
   - Cache Storage 내용

3. **수동 테스트**
   - 오프라인 모드 전환 후 앱 사용
   - 설치 후 독립 실행
   - 알림 수신 확인

### 추천 엔진 테스트

```javascript
// 콘솔에서 테스트
const engine = new RecommendationEngine();
const result = await engine.generateRecommendations(testData);
console.log(result);
```

---

## 🚀 배포

### 웹 서버 설정

**Apache:**
```apache
# .htaccess
<IfModule mod_headers.c>
    Header set Service-Worker-Allowed "/"
    Header set Cache-Control "max-age=0, must-revalidate"
</IfModule>
```

**Nginx:**
```nginx
# nginx.conf
location /service-worker.js {
    add_header Service-Worker-Allowed "/";
    add_header Cache-Control "max-age=0, must-revalidate";
}
```

### HTTPS 필수

PWA는 HTTPS에서만 동작합니다 (localhost 제외).

**Let's Encrypt 설정:**
```bash
sudo certbot --apache -d yourdomain.com
```

---

## 📈 성능 최적화

### 1. 코드 스플리팅
```javascript
// 필요할 때만 로드
const module = await import('./js/heavy-module.js');
```

### 2. 이미지 최적화
- WebP 포맷 사용
- Lazy Loading 적용
- 적절한 크기 사용

### 3. 캐시 전략
- 정적 자산: Cache-First
- API: Network-First
- 이미지: Cache-First with Update

---

## 🔐 보안

### 1. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

### 2. HTTPS Only
```javascript
if (location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

### 3. Input Validation
```javascript
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}
```

---

## 🐛 트러블슈팅

### Service Worker가 업데이트되지 않음

```javascript
// 강제 업데이트
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

### 캐시 초기화

```javascript
// 모든 캐시 삭제
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### 알림이 표시되지 않음

1. 브라우저 알림 권한 확인
2. HTTPS 사용 확인
3. Service Worker 등록 확인

---

## 📚 참고 자료

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

## 📝 버전 히스토리

### v1.0.0 (2024)
- ✅ PWA 기본 기능
- ✅ AI 추천 엔진
- ✅ 오프라인 지원
- ✅ 설치 가능
- ✅ 푸시 알림

---

## 💡 향후 계획

- [ ] 백그라운드 동기화 고도화
- [ ] 웹 푸시 API 통합
- [ ] 음성 인터페이스
- [ ] AR/VR 시각화
- [ ] 멀티 플랫폼 동기화

---

## 📞 지원

문의사항이나 버그 리포트는 이슈 트래커에 등록해주세요.

**Happy Learning! 🎓**
