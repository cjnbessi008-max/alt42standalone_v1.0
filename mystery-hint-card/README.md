# 🔍 미스터리 힌트 카드

KAIST Touch Math Academy를 위한 인터랙티브 힌트 시스템

## 📱 기능

- **스마트폰 시뮬레이터**: 우측 하단에 고정된 가상 모바일 화면
- **순차적 카드 개봉**: 학생들이 힌트를 하나씩 순서대로 개봉
- **3D 카드 뒤집기**: 부드러운 애니메이션으로 카드 개봉 효과
- **진행 상황 추적**: 프로그레스 바와 로컬 스토리지 저장
- **도형 단서**: 이모지 및 SVG로 시각적 힌트 제공
- **반응형 디자인**: 데스크톱과 모바일 모두 지원

## 🚀 빠른 시작

### 1. 로컬에서 실행

```bash
# 프로젝트 폴더로 이동
cd mystery-hint-card

# 간단한 HTTP 서버 실행 (Python 3)
python3 -m http.server 8000

# 또는 Node.js http-server 사용
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

### 2. 파일 구조

```
mystery-hint-card/
├── index.html              # 메인 HTML 페이지
├── css/
│   └── styles.css          # 스타일시트
├── js/
│   ├── app.js              # 메인 앱 로직
│   └── cards.js            # 카드 관리 클래스
├── data/
│   └── hints.json          # 힌트 데이터 (커스터마이징 가능)
└── README.md               # 이 파일
```

## 🎨 커스터마이징

### 힌트 데이터 수정

`data/hints.json` 파일을 편집하여 문제와 힌트를 변경할 수 있습니다:

```json
{
  "problemId": "your-problem-id",
  "problemTitle": "문제 제목",
  "cards": [
    {
      "id": 1,
      "title": "힌트 제목",
      "shape": "🎯",
      "shapeType": "custom",
      "text": "힌트 내용",
      "unlocked": false
    }
  ],
  "settings": {
    "sequential": true,      // 순차 개봉 여부
    "allowSkip": false,      // 건너뛰기 허용
    "maxUnlocks": 5          // 최대 개봉 수
  }
}
```

### 스타일 변경

`css/styles.css`에서 색상 변수를 수정:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    --phone-width: 320px;
    --phone-height: 600px;
}
```

## 🔌 Moodle/LMS 연동

### API 엔드포인트 (예정)

앱은 다음 API를 통해 Moodle과 연동할 수 있습니다:

#### 1. 문제 데이터 가져오기
```http
GET /api/problems/{problemId}
```

응답:
```json
{
  "id": "fraction-001",
  "title": "분수 더하기",
  "hints": [...],
  "settings": {...}
}
```

#### 2. 진행 상황 저장
```http
POST /api/progress
Content-Type: application/json

{
  "studentId": "student123",
  "problemId": "fraction-001",
  "progressData": {
    "unlockedCards": [1, 2, 3],
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

#### 3. 힌트 사용 로그
```http
POST /api/hints/log
Content-Type: application/json

{
  "studentId": "student123",
  "problemId": "fraction-001",
  "hintId": 1,
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### URL 파라미터

앱은 다음 URL 파라미터를 지원합니다:

```
http://localhost:8000?problemId=fraction-001&studentId=student123&mode=moodle
```

- `problemId`: 문제 ID
- `studentId`: 학생 ID
- `mode`: `standalone` (기본) 또는 `moodle`

## 📊 브라우저 지원

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ 모바일 브라우저 (iOS Safari, Chrome Mobile)

## 🛠️ 기술 스택

- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 3D Transforms, Animations
- **JavaScript (ES6+)**: 클래스, 비동기, 로컬 스토리지
- **SVG**: 벡터 그래픽 도형
- **Web Audio API**: 효과음 (선택적)

## 📝 개발 로드맵

- [x] 기본 카드 시스템 구현
- [x] 3D 뒤집기 애니메이션
- [x] 진행 상황 추적
- [x] 로컬 스토리지 저장
- [ ] Moodle API 연동
- [ ] 다국어 지원 (한글/영어)
- [ ] 접근성 향상 (ARIA, 키보드 네비게이션)
- [ ] 성능 최적화
- [ ] 단위 테스트 추가

## 🎯 사용 시나리오

1. **교사**: `hints.json`에서 문제와 힌트 설정
2. **학생**: 브라우저에서 앱 접속
3. **학습**: 문제 확인 후 필요시 힌트 카드 개봉
4. **진행**: 순차적으로 힌트를 확인하며 문제 해결
5. **완료**: 모든 힌트 개봉 시 축하 메시지

## 🔐 보안 고려사항

- 클라이언트 사이드 검증만으로는 부족 (서버 검증 필요)
- XSS 방지를 위한 입력 sanitization
- HTTPS 사용 권장
- CORS 설정 필요 (Moodle 연동 시)

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 👥 기여

문제 발견 시 Issue를 생성하거나 Pull Request를 보내주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
