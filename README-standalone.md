# Root Glow - 독립형 웹앱 (Standalone PWA)

**수학 함수의 근을 시각적으로 찾고 학습하는 Progressive Web App**

Root Glow는 서버 없이 브라우저만으로 실행 가능한 독립형 웹 애플리케이션입니다. 근을 찾을 때 해당 위치가 은은하게 빛나는 "Root Glow" 효과와 함께, 우측 하단에 가상 스마트폰 화면이 표시됩니다.

## ✨ 주요 특징

### 🚀 독립형 실행
- ✅ 서버 설치 불필요 - 브라우저에서 바로 실행
- ✅ PHP/MySQL 불필요 - 순수 JavaScript로 작동
- ✅ 오프라인 지원 - 인터넷 없이도 사용 가능
- ✅ 빠른 로딩 - 모든 리소스 캐싱

### 📱 Progressive Web App (PWA)
- ✅ 홈 화면에 설치 가능
- ✅ 네이티브 앱처럼 실행
- ✅ Service Worker로 오프라인 지원
- ✅ 자동 업데이트

### 🎯 Root Glow 기능
- ✅ 근 위치에서 빛나는 시각적 효과
- ✅ 10단계 조절 가능한 Glow 강도
- ✅ 커스텀 Glow 색상
- ✅ 실시간 펄스 애니메이션

### 📚 학습 기능
- ✅ 15개의 내장 문제 (쉬움/보통/어려움)
- ✅ 카테고리별 문제 분류 (이차함수, 삼차함수, 사차함수)
- ✅ 힌트 시스템
- ✅ 자동 답안 평가 및 피드백
- ✅ 학습 진행 상황 추적

### 📊 데이터 관리
- ✅ LocalStorage 기반 데이터 저장
- ✅ 진행 상황 자동 저장
- ✅ 통계 기록 (시도 횟수, 정답률)
- ✅ 데이터 내보내기/가져오기

### 📱 가상 스마트폰 화면
- ✅ 우측 하단에 표시
- ✅ 실시간 그래프 렌더링
- ✅ 문제 정보 및 결과 표시
- ✅ 모바일 UI 시뮬레이션

## 🚀 빠른 시작

### 방법 1: 간단한 실행 (권장)

1. **파일 다운로드**
   ```bash
   git clone https://github.com/your-repo/alt42standalone_v1.0.git
   cd alt42standalone_v1.0
   ```

2. **브라우저에서 열기**
   - `index.html` 파일을 더블클릭하거나
   - 브라우저 주소창에 파일 경로 입력

3. **완료!** 🎉
   - 별도의 설치나 설정 없이 바로 사용 가능

### 방법 2: 로컬 서버 사용 (PWA 기능 활성화)

PWA 기능(설치, 오프라인)을 완전히 사용하려면 HTTPS 또는 localhost가 필요합니다.

#### Python 사용
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용
```bash
npx http-server -p 8000
```

#### PHP 사용
```bash
php -S localhost:8000
```

그 다음 브라우저에서 `http://localhost:8000` 접속

### 방법 3: GitHub Pages 호스팅

무료로 온라인 호스팅:

1. GitHub 저장소 생성
2. 파일 업로드
3. Settings > Pages > Source 설정
4. 자동 생성된 URL 접속

## 📖 사용 방법

### 기본 사용법

1. **문제 선택**
   - 🎲 랜덤 문제: 무작위 문제 로드
   - 📋 문제 목록: 난이도/카테고리별 문제 선택

2. **함수 입력**
   - 문제의 함수가 자동으로 입력되거나
   - 직접 함수 입력 가능 (예: `x^2 - 4`)

3. **근 찾기**
   - "근 찾기" 버튼 클릭 또는 `Ctrl+Enter`
   - 자동으로 근 계산 및 그래프 표시

4. **결과 확인**
   - 메인 화면: Root Glow 효과와 함께 그래프 표시
   - 우측 하단: 가상 스마트폰 화면에 요약 표시
   - 자동 답안 평가 및 피드백

5. **Glow 효과 조정**
   - 강도: 1-10 슬라이더
   - 색상: 컬러 피커
   - 활성화/비활성화: 체크박스

### 지원하는 함수

```javascript
// 다항식
x^2 - 4              // 이차함수
x^3 - 6*x^2 + 11*x - 6   // 삼차함수
2*x^2 - 5*x + 2      // 계수 포함

// 삼각함수 (준비 중)
sin(x)
cos(x)
tan(x)

// 기타 함수
sqrt(x) - 2          // 제곱근
abs(x) - 3           // 절댓값
```

### 키보드 단축키

| 단축키 | 기능 |
|-------|------|
| `Ctrl + Enter` | 근 찾기 실행 |
| `Ctrl + R` | 새 문제 로드 |
| `Ctrl + L` | 문제 목록 열기 |
| `ESC` | 모달 닫기 |

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html                     # 메인 페이지
├── manifest.json                  # PWA Manifest
├── service-worker.js              # Service Worker (오프라인 지원)
│
├── assets/                        # 아이콘 및 이미지
│   └── README.md
│
├── src/
│   ├── css/
│   │   ├── style.css             # 메인 스타일
│   │   ├── smartphone.css        # 스마트폰 디스플레이
│   │   └── glow-effects.css     # Glow 효과
│   │
│   └── js/
│       ├── app-standalone.js     # 메인 앱 로직 ⭐
│       ├── math-utils.js         # 수학 유틸리티
│       ├── root-finder.js        # 근 찾기 알고리즘
│       ├── graph-renderer.js     # 그래프 렌더링
│       ├── glow-effects.js      # Glow 효과 관리
│       ├── smartphone-display.js # 스마트폰 화면
│       ├── problem-database.js   # 문제 데이터베이스 ⭐
│       └── standalone-storage.js # LocalStorage 관리 ⭐
│
└── README-standalone.md          # 이 문서
```

⭐ = 독립형 버전의 핵심 파일

## 🎓 내장 문제 목록

### 쉬움 (6문제)
1. 이차함수의 근 찾기 - 기본 (`x^2 - 4`)
2. 이차함수 - 인수분해 (`x^2 - 2*x - 3`)
3. 완전제곱식 (`x^2 - 6*x + 9`)
4. 이차함수 - 소인수분해 (`x^2 - 5*x + 6`)
5. 이차함수 - 음수 계수 (`-x^2 + 9`)
6. 이차함수 - 분수 근 (`2*x^2 - 5*x + 2`)

### 보통 (7문제)
7. 삼차함수의 근 찾기 (`x^3 - 6*x^2 + 11*x - 6`)
8. 삼차함수 - 중근 (`x^3 - 3*x^2 + 3*x - 1`)
9. 사차함수 (`x^4 - 5*x^2 + 4`)
10. 이차함수 - 실근 없음 (`x^2 + 4`)
11. 삼차함수 응용 (`x^3 - x`)
12. 고차 다항식 (`x^4 - 1`)
13. 삼차함수 - 대칭 (`x^3 - 4*x`)

### 어려움 (2문제)
14. 삼차함수 - 복잡 (`x^3 - 7*x + 6`)
15. 삼차함수 - 도전 (`x^3 + 2*x^2 - 5*x - 6`)

## 💾 데이터 저장

### LocalStorage 사용
- 모든 데이터는 브라우저의 LocalStorage에 저장
- 브라우저를 닫아도 데이터 유지
- 약 5-10MB 저장 가능

### 저장되는 데이터
- ✅ 사용자 정보
- ✅ 문제별 진행 상황
- ✅ 답안 제출 내역
- ✅ 통계 (시도 횟수, 정답률)
- ✅ 설정 (Glow 강도, 색상)

### 데이터 관리

**데이터 내보내기:**
```javascript
// 개발자 콘솔에서
rootGlowApp.storage.exportData();
```

**데이터 가져오기:**
```javascript
// JSON 파일 내용을
const jsonString = '...';
rootGlowApp.storage.importData(jsonString);
```

**모든 데이터 삭제:**
```javascript
rootGlowApp.storage.clearAllData();
```

## 🔧 고급 기능

### PWA 설치

#### 데스크톱 (Chrome, Edge)
1. 주소창 오른쪽의 설치 아이콘 클릭
2. 또는 메뉴 > 앱 설치
3. 앱이 독립 창으로 실행됨

#### 모바일 (Android)
1. 메뉴 > 홈 화면에 추가
2. 또는 자동 팝업 프롬프트 사용
3. 아이콘이 홈 화면에 추가됨

#### 모바일 (iOS/Safari)
1. 공유 버튼 탭
2. "홈 화면에 추가" 선택
3. 이름 확인 후 추가

### 오프라인 사용

1. **최초 접속 시**: 인터넷 연결 필요
2. **이후**: 완전 오프라인 사용 가능
3. **Service Worker**가 자동으로 리소스 캐싱

**오프라인 확인:**
- 인터넷 연결 끊기
- 앱 실행
- 모든 기능 정상 작동!

### 커스터마이징

#### 새 문제 추가

`src/js/problem-database.js` 파일 수정:

```javascript
{
    id: 'PROB016',
    title: '내 문제 제목',
    function: 'x^2 + 3*x - 10',
    description: '문제 설명',
    difficulty: '보통',
    category: '이차함수',
    expectedRoots: [-5, 2],
    tolerance: 0.01,
    minX: -10,
    maxX: 10,
    hints: [
        '힌트 1',
        '힌트 2',
        '힌트 3'
    ]
}
```

#### 스타일 변경

- `src/css/style.css`: 메인 스타일
- `src/css/glow-effects.css`: Glow 색상/강도
- `src/css/smartphone.css`: 스마트폰 화면

#### 테마 색상 변경

`src/css/style.css`에서 색상 변수 수정:
```css
/* 메인 그라데이션 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Glow 기본 색상 */
--glow-color: #00ffff;
```

## 🌐 브라우저 호환성

### 완벽하게 지원
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### PWA 기능 제한
- ⚠️ iOS Safari: 일부 PWA 기능 제한
- ⚠️ Firefox: 설치 기능 없음 (오프라인은 작동)

### 최소 요구사항
- JavaScript 활성화
- LocalStorage 지원
- Canvas API 지원

## 📱 모바일 최적화

- ✅ 터치 제스처 지원
- ✅ 반응형 레이아웃
- ✅ 모바일 화면 크기 최적화
- ✅ 가로/세로 모드 지원

## 🐛 문제 해결

### PWA 설치 안됨
**증상**: 설치 프롬프트가 나타나지 않음

**해결**:
1. HTTPS 또는 localhost 사용 확인
2. manifest.json 경로 확인
3. Service Worker 등록 확인 (개발자 도구 > Application)

### 오프라인 작동 안됨
**증상**: 인터넷 없이 앱이 로드되지 않음

**해결**:
1. 한 번 이상 온라인 접속 필요
2. Service Worker 등록 확인
3. 캐시 수동 삭제 후 재접속

### LocalStorage 초과
**증상**: "QuotaExceededError" 오류

**해결**:
```javascript
// 오래된 데이터 삭제
rootGlowApp.storage.clearAllData();

// 또는 일부만 삭제
localStorage.removeItem('rootGlowApp');
```

### 그래프가 표시 안됨
**증상**: 캔버스가 비어있음

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. 함수 구문 확인 (`x^2` not `x**2`)
3. 브라우저 새로고침

## 🔒 보안 및 프라이버시

- ✅ 모든 데이터 로컬 저장 (서버 전송 없음)
- ✅ 외부 API 호출 없음
- ✅ 완전한 오프라인 작동
- ✅ 개인정보 수집 없음

## 📊 성능

- ⚡ 초기 로딩: ~100KB
- ⚡ 설치 후: 즉시 로딩
- ⚡ 근 찾기: <1초
- ⚡ 애니메이션: 60fps

## 🚧 향후 계획

- [ ] 삼각함수 지원 확대
- [ ] 지수/로그 함수
- [ ] 그래프 확대/축소
- [ ] 다크 모드
- [ ] 문제 공유 기능
- [ ] 사용자 정의 문제 추가
- [ ] 힌트 시스템 강화
- [ ] 통계 대시보드

## 💡 팁

1. **빠른 근 찾기**: `Ctrl+Enter` 사용
2. **문제 훑어보기**: 문제 목록에서 카테고리 필터 사용
3. **학습 추적**: 완료된 문제는 ✅로 표시됨
4. **데이터 백업**: 정기적으로 데이터 내보내기
5. **성능 향상**: PWA로 설치하여 사용

## 📄 라이선스

교육 목적으로 개발된 오픈소스 프로젝트입니다.

## 🤝 기여

기여를 환영합니다!
- 이슈 제보
- 문제 추가
- 기능 개선
- 버그 수정

## 📞 지원

문제가 있으시면 GitHub Issues에 등록해주세요.

---

**Root Glow Standalone** - 서버 없이 어디서나 수학 학습! ✨

Made with ❤️ for Mathematics Education
