# 🔷 도형 보조선 자동 생성기 (Shape Guide Lines Generator)

**평행선과 수선이 자동으로 생성되는 독립형 PWA 웹앱**

[![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/Works-Offline-green.svg)](https://developers.google.com/web/fundamentals/codelabs/offline/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 주요 기능

### 🎨 도형 그리기
- ✅ **다양한 도형 지원**: 삼각형, 정사각형, 직사각형, 오각형, 육각형
- ✅ **자유 그리기 모드**: 사용자 정의 도형 생성
- ✅ **Canvas 기반**: 부드럽고 정확한 렌더링

### 📏 자동 보조선 생성
- ✅ **평행선 자동 생성**: 각 변에 대한 평행선 표시
- ✅ **수선 자동 생성**: 각 꼭짓점에서 수직선 표시
- ✅ **실시간 업데이트**: 도형 변경 시 즉시 재계산

### 📱 스마트폰 뷰
- ✅ **실시간 미리보기**: 우측 하단 가상 스마트폰 화면
- ✅ **자동 스케일링**: 모바일 화면에 최적화된 크기 조정
- ✅ **토글 기능**: 필요시 숨김/표시 가능

### 💾 로컬 저장
- ✅ **서버 불필요**: LocalStorage 기반 완전 독립 실행
- ✅ **무제한 저장**: 브라우저 용량 한도 내 자유롭게 저장
- ✅ **자동 복구**: 페이지 새로고침 후에도 데이터 유지

### 📤 데이터 관리
- ✅ **내보내기**: JSON 파일로 백업
- ✅ **불러오기**: 백업 파일 복원
- ✅ **공유 가능**: 파일을 통한 데이터 공유

### 🚀 PWA 기능
- ✅ **설치 가능**: 홈 화면에 앱처럼 설치
- ✅ **오프라인 동작**: 인터넷 없이도 완전 작동
- ✅ **빠른 로딩**: Service Worker 캐싱

---

## 🚀 빠른 시작

### 방법 1: 로컬에서 실행

```bash
# 프로젝트 디렉토리로 이동
cd standalone

# Python 내장 서버로 실행 (Python 3 필요)
python3 -m http.server 8000

# 또는 npm 스크립트 사용
npm start
```

브라우저에서 접속: `http://localhost:8000`

### 방법 2: 정적 호스팅

GitHub Pages, Netlify, Vercel 등에 배포:

```bash
# 빌드 없이 바로 배포 가능 (순수 정적 파일)
# standalone/ 폴더를 호스팅 서비스에 업로드
```

### 방법 3: 직접 파일 열기

```bash
# 파일 탐색기에서 index.html을 더블클릭
# (일부 기능은 http:// 프로토콜이 필요할 수 있음)
```

---

## 📖 사용 방법

### 1️⃣ 도형 선택
상단 툴바에서 원하는 도형 유형을 선택하세요:
- **삼각형**: 정삼각형
- **정사각형**: 정사각형
- **직사각형**: 가로로 긴 직사각형
- **오각형**: 정오각형
- **육각형**: 정육각형
- **자유 그리기**: 클릭으로 점을 찍어 사용자 정의 도형 생성

### 2️⃣ 도형 그리기
- 캔버스를 **클릭**하면 선택한 도형이 그려집니다
- 자유 그리기 모드에서는 **클릭**으로 점 추가, **더블클릭**으로 완성

### 3️⃣ 보조선 확인
- **평행선** (하늘색 점선): 각 변과 평행한 선
- **수선** (빨간색 점선): 각 변에 수직인 선
- 체크박스로 표시/숨김 토글 가능

### 4️⃣ 저장 및 관리
- **저장 버튼**: 현재 도형을 이름과 함께 저장
- **갤러리**: 저장된 도형 목록 확인
- **불러오기**: 갤러리에서 클릭하여 다시 불러오기
- **삭제**: 휴지통 아이콘으로 삭제

### 5️⃣ 내보내기/불러오기
- **내보내기**: JSON 파일로 모든 데이터 백업
- **불러오기**: JSON 파일에서 데이터 복원

---

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl + S` | 현재 도형 저장 |
| `Ctrl + N` | 새 도형 만들기 |
| `Ctrl + E` | 데이터 내보내기 |
| `Esc` | 모달 닫기 / 그리기 취소 |

---

## 🏗️ 프로젝트 구조

```
standalone/
├── index.html              # 메인 HTML
├── manifest.json           # PWA 매니페스트
├── service-worker.js       # Service Worker (오프라인 지원)
├── package.json            # 프로젝트 설정
│
├── css/
│   └── style.css          # 전체 스타일시트
│
├── js/
│   ├── storage.js         # LocalStorage 관리
│   ├── shape-engine.js    # 도형 그리기 엔진
│   ├── ui.js              # UI 컴포넌트 관리
│   └── app.js             # 메인 애플리케이션 로직
│
└── icons/                 # PWA 아이콘 (필요시 생성)
```

---

## 🎯 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, Gradient, Animations
- **JavaScript (ES6+)**: 모듈 패턴, Classes, Async/Await

### Canvas API
- **2D Context**: 도형 렌더링
- **Path2D**: 복잡한 경로 그리기
- **Transformations**: 좌표 변환 및 스케일링

### 저장소
- **LocalStorage**: 키-밸류 저장소
- **JSON**: 데이터 직렬화
- **Blob API**: 파일 내보내기

### PWA
- **Service Worker**: 오프라인 지원 및 캐싱
- **Web App Manifest**: 설치 가능한 앱
- **Cache API**: 리소스 캐싱

---

## 🧮 보조선 생성 알고리즘

### 평행선 생성

```javascript
// 1. 변의 방향 벡터 계산
const dx = p2.x - p1.x;
const dy = p2.y - p1.y;

// 2. 정규화
const length = Math.sqrt(dx * dx + dy * dy);
const ux = dx / length;
const uy = dy / length;

// 3. 수직 벡터 (90도 회전)
const perpX = -uy;
const perpY = ux;

// 4. 평행선 시작/끝점 계산
const offset = 40; // 픽셀
const parallelStart = {
    x: p1.x + perpX * offset,
    y: p1.y + perpY * offset
};
const parallelEnd = {
    x: p2.x + perpX * offset,
    y: p2.y + perpY * offset
};
```

### 수선 생성

```javascript
// 꼭짓점에서 변에 수직인 선
const perpLength = 60;
const perpStart = {
    x: vertex.x - perpX * perpLength / 2,
    y: vertex.y - perpY * perpLength / 2
};
const perpEnd = {
    x: vertex.x + perpX * perpLength / 2,
    y: vertex.y + perpY * perpLength / 2
};
```

---

## 🔧 커스터마이징

### 보조선 색상 변경

`js/storage.js`에서 기본 설정 수정:

```javascript
const defaultSettings = {
    parallelColor: '#4ECDC4',      // 평행선 색상
    perpendicularColor: '#FF6B6B', // 수선 색상
    shapeColor: '#2c3e50',         // 도형 색상
};
```

### UI 테마 변경

`css/style.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --parallel-color: #4ECDC4;
    --perpendicular-color: #FF6B6B;
}
```

---

## 🌐 브라우저 지원

| 브라우저 | 버전 | 지원 |
|---------|------|------|
| Chrome | 60+ | ✅ 완벽 |
| Firefox | 55+ | ✅ 완벽 |
| Safari | 11+ | ✅ 완벽 |
| Edge | 79+ | ✅ 완벽 |
| Opera | 47+ | ✅ 완벽 |
| IE | 11 | ❌ 미지원 |

---

## 💡 활용 사례

### 교육
- 기하학 수업에서 평행선/수선 개념 교육
- 학생들의 도형 이해도 향상
- 시각적 학습 도구

### 개인 학습
- 스스로 도형의 성질 탐구
- 다양한 도형 실험
- 보조선 패턴 발견

### 과제 제출
- 도형 데이터 내보내기로 과제 제출
- 교사가 학생 작품 검토 용이

---

## 🐛 문제 해결

### Q: 도형이 저장되지 않아요
**A**: 브라우저의 LocalStorage가 비활성화되어 있을 수 있습니다.
- **해결**: 브라우저 설정 > 개인정보 > 쿠키 및 사이트 데이터 > 허용

### Q: 오프라인에서 작동하지 않아요
**A**: Service Worker가 등록되지 않았을 수 있습니다.
- **해결**: `http://` 또는 `https://` 프로토콜로 접속 (file:// 불가)
- 브라우저 개발자 도구 > Application > Service Workers 확인

### Q: 스마트폰 뷰가 보이지 않아요
**A**: 화면 크기가 작을 수 있습니다.
- **해결**: 화면을 확대하거나 데스크톱에서 접속

### Q: 데이터를 백업하고 싶어요
**A**: "내보내기" 버튼을 사용하세요.
- JSON 파일로 모든 데이터 저장 가능
- 나중에 "불러오기"로 복원 가능

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

```
Copyright (c) 2025 Shape Guide Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 기여

기여를 환영합니다! Pull Request를 보내주세요.

### 기여 방법
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 문의

- 이슈: [GitHub Issues](https://github.com/cjnbessi008-max/alt42standalone_v1.0/issues)
- 이메일: [your-email@example.com](mailto:your-email@example.com)

---

## 🎓 교육 리소스

- [Canvas API 튜토리얼](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [PWA 가이드](https://web.dev/progressive-web-apps/)
- [LocalStorage 가이드](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Made with ❤️ for mathematics education**

🔷 **도형 보조선 자동 생성기** - 평행선과 수선을 쉽게 이해하세요!
