# ALT42 Standalone PWA - Graph Visualizer

독립형 Progressive Web App으로 동작하는 교육용 그래프 시각화 도구입니다.

## 🚀 주요 기능

### 📱 PWA (Progressive Web App)
- **오프라인 지원** - 인터넷 연결 없이도 완전히 작동
- **앱 설치** - 홈 화면에 설치 가능
- **빠른 로딩** - Service Worker 캐싱으로 즉시 로드
- **자동 업데이트** - 새 버전 자동 감지 및 업데이트

### 💾 로컬 스토리지
- **IndexedDB** - 브라우저 로컬에 모든 데이터 저장
- **자동 저장** - 30초마다 자동으로 그래프 저장
- **데이터 내보내기/가져오기** - JSON 형식으로 백업 가능
- **영구 저장소** - 브라우저가 데이터를 삭제하지 않도록 요청

### 🎆 교점 Burst 효과
- **실시간 교점 감지** - 그래프 엣지 간 교차점 자동 탐지
- **파티클 폭발 효과** - 교점 발생시 화려한 애니메이션
- **커스터마이징** - 파티클 수, 강도 조절 가능
- **충격파 효과** - 폭발 시 동심원 애니메이션

### 📊 그래프 시각화
- **드래그 앤 드롭** - 마우스로 노드 자유롭게 이동
- **동적 엣지 생성** - 개념 간 관계 연결
- **한국어 라벨** - 수학 개념 한국어 표시
- **자동 레이아웃** - 원형 배치로 최적 가시성

### 📚 샘플 문제
- **10가지 분수 문제** - 초급부터 고급까지
- **개념 학습** - 분수의 기본 개념부터 응용까지
- **그래프 데이터** - 각 문제마다 개념 관계도 포함

## 📦 설치 및 실행

### 웹 서버 없이 로컬에서 실행

1. **파일 다운로드**
   ```bash
   git clone https://github.com/your-org/alt42standalone_v1.0.git
   cd alt42standalone_v1.0
   ```

2. **로컬 서버 실행** (Service Worker는 HTTPS 또는 localhost 필요)

   **Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Node.js:**
   ```bash
   npx http-server -p 8000
   ```

3. **브라우저에서 열기**
   ```
   http://localhost:8000
   ```

### PWA 설치

1. 브라우저에서 앱 실행
2. 주소창 옆 "설치" 버튼 클릭 (또는 우측 상단 "📥 앱 설치" 버튼)
3. 홈 화면에 아이콘이 생성됩니다
4. 앱 아이콘을 클릭하여 독립형 모드로 실행

## 🎨 아이콘 생성

1. `generate-icons.html` 파일을 브라우저에서 열기
2. "모든 아이콘 생성" 버튼 클릭
3. 각 크기별로 다운로드 버튼 클릭
4. `icons/` 폴더에 저장

필요한 크기: 72, 96, 128, 144, 152, 192, 384, 512px

## 📖 사용 방법

### 기본 조작

**그래프 편집:**
- **노드 추가**: "노드 추가" 버튼 클릭
- **엣지 추가**: "엣지 추가" 버튼 클릭 (최소 2개 노드 필요)
- **노드 이동**: 마우스로 드래그
- **초기화**: "초기화" 버튼으로 현재 문제로 리셋

**문제 관리:**
- **다음 문제**: "다음 문제" 버튼으로 랜덤 문제 로드
- **그래프 저장**: "그래프 저장" 버튼으로 현재 상태 저장
- **자동 저장**: 30초마다 자동으로 저장됨

**Burst 효과 조절:**
- **활성화/비활성화**: 체크박스로 on/off
- **파티클 수**: 슬라이더로 10-100 개 조절
- **폭발 강도**: 슬라이더로 0.5-3.0 배 조절

### 모바일 뷰

- 우측 하단 가상 스마트폰에 실시간 동기화
- 학생 관점 UI 미리보기
- 터치 최적화 인터페이스

### 오프라인 사용

1. 온라인 상태에서 앱을 한 번 실행
2. Service Worker가 모든 리소스 캐싱
3. 이후 인터넷 없이 완전히 작동
4. 우측 상단에 오프라인 상태 표시

## 🗂️ 데이터 관리

### 저장된 데이터

**IndexedDB 스토어:**
- `problems` - 문제 데이터
- `graphs` - 저장된 그래프 상태
- `progress` - 학생 진행도 (향후)
- `settings` - 앱 설정
- `syncQueue` - 동기화 대기열 (향후)

### 데이터 내보내기

```javascript
// 콘솔에서 실행
const data = await app.exportData();
```

JSON 파일로 다운로드됩니다.

### 데이터 가져오기

```javascript
// 콘솔에서 실행
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  await app.importData(e.target.files[0]);
};
fileInput.click();
```

## 🛠️ 기술 스택

### Frontend
- **HTML5 Canvas** - 그래프 렌더링
- **Vanilla JavaScript** - 프레임워크 없음
- **CSS3** - 반응형 디자인
- **PWA APIs** - Service Worker, Cache API, IndexedDB

### 스토리지
- **IndexedDB** - 로컬 데이터베이스
- **Cache API** - 리소스 캐싱
- **LocalStorage** - 설정 저장 (선택적)

### PWA 기능
- **Service Worker** - 오프라인 지원
- **Web App Manifest** - 설치 가능
- **Background Sync** - 백그라운드 동기화 (향후)
- **Push Notifications** - 푸시 알림 (향후)

## 📁 파일 구조

```
alt42standalone_v1.0/
├── index.html                 # 메인 HTML
├── styles.css                 # 스타일시트
├── manifest.json             # PWA 매니페스트
├── service-worker.js         # 서비스 워커
├── app-standalone.js         # 메인 앱 컨트롤러
├── pwa-controller.js         # PWA 기능 관리
├── storage-manager.js        # IndexedDB 관리
├── sample-problems.js        # 샘플 문제 데이터
├── graph-visualizer.js       # 그래프 렌더링
├── burst-effect.js           # 파티클 효과
├── generate-icons.html       # 아이콘 생성기
├── icons/                    # PWA 아이콘
│   └── README.md
└── README-STANDALONE.md      # 이 파일
```

## 🔧 개발자 도구

### 브라우저 개발자 콘솔

**Storage 확인:**
```
Application → Storage → IndexedDB → alt42-education-db
```

**Service Worker 상태:**
```
Application → Service Workers
```

**캐시 확인:**
```
Application → Cache Storage → alt42-graph-v1.0.0
```

### 디버깅

**로그 활성화:**
```javascript
// 콘솔에서
localStorage.setItem('debug', 'true');
```

**스토리지 통계:**
```javascript
const stats = await storageManager.getStats();
console.log(stats);
```

**네트워크 상태:**
```javascript
const info = pwaController.getNetworkInfo();
console.log(info);
```

## 🎯 샘플 문제 목록

1. **분수의 기본 개념** (초급)
2. **분수의 덧셈 - 같은 분모** (쉬움)
3. **분수의 덧셈 - 다른 분모** (보통)
4. **분수의 뺄셈 - 같은 분모** (쉬움)
5. **분수의 곱셈** (보통)
6. **분수의 나눗셈** (어려움)
7. **대분수와 가분수** (보통)
8. **분수의 크기 비교** (쉬움)
9. **분수와 소수의 관계** (보통)
10. **분수의 응용 - 실생활 문제** (어려움)

## 📱 모바일 지원

### iOS Safari
- **설치**: Share → Add to Home Screen
- **전체화면**: 홈 화면에서 실행시 전체화면
- **상태바**: Safe area 지원

### Android Chrome
- **설치**: 메뉴 → Add to Home screen
- **알림**: 앱 설치 배너 자동 표시
- **백그라운드**: Background Sync 지원 (향후)

## 🔒 보안 및 프라이버시

- **로컬 전용**: 모든 데이터는 브라우저에만 저장
- **서버 없음**: 외부 서버로 데이터 전송 안 함
- **HTTPS**: 프로덕션 환경에서는 HTTPS 필수
- **권한**: 특별한 권한 요구 없음

## 🐛 문제 해결

### Service Worker 등록 실패
- **원인**: HTTP 연결 (localhost 제외)
- **해결**: HTTPS 서버 사용 또는 localhost에서 테스트

### IndexedDB 초기화 실패
- **원인**: 브라우저 저장소 할당량 초과
- **해결**: 브라우저 데이터 삭제 또는 다른 브라우저 사용

### 아이콘이 표시되지 않음
- **원인**: 아이콘 파일이 없음
- **해결**: generate-icons.html로 아이콘 생성

### 오프라인에서 작동 안 함
- **원인**: 캐시되지 않은 리소스
- **해결**: 온라인 상태에서 한 번 실행 후 재시도

## 🚀 성능 최적화

### Canvas 렌더링
- 60fps 애니메이션 (requestAnimationFrame)
- Dirty region tracking (계획 중)
- 파티클 풀링으로 GC 압력 감소

### 스토리지
- 인덱스 사용으로 빠른 쿼리
- 트랜잭션 배치 처리
- 자동 압축 (계획 중)

### 네트워크
- Service Worker 캐싱
- 사전 캐싱 (precaching)
- 런타임 캐싱

## 📊 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Samsung Internet 14+
- ❌ IE 11 (지원 안 함)

## 🔮 향후 계획

- [ ] 백그라운드 동기화 (Background Sync)
- [ ] 푸시 알림 (Push Notifications)
- [ ] 음성 입력 (Web Speech API)
- [ ] 다크 모드 자동 전환
- [ ] 애니메이션 성능 개선
- [ ] 문제 추가 UI
- [ ] 학습 진행도 추적
- [ ] 공유 기능 (Web Share API)

## 📄 라이센스

이 프로젝트는 KAIST Touch Math Academy 교육 시스템의 일부입니다.

## 👥 기여자

- ALT42 Team
- KAIST Touch Math Academy

## 📞 지원

기술 문의: dev@kaist.ac.kr
교육 문의: math@kaist.ac.kr

---

**버전**: 1.0.0 (Standalone)
**최종 업데이트**: 2025-11-18
**상태**: Production Ready
