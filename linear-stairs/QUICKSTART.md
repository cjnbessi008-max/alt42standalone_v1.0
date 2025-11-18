# Linear Stairs - 빠른 시작 가이드

5분 안에 Linear Stairs를 실행하고 테스트해보세요!

## 🚀 1. 로컬에서 실행하기

### Python 서버 사용 (권장)

```bash
# 1. linear-stairs 디렉토리로 이동
cd linear-stairs

# 2. Python 서버 실행
python3 server.py

# 3. 브라우저에서 접속
# http://localhost:8000/demo.html
```

### 다른 방법들

**Node.js 사용:**
```bash
npx http-server -p 8000 -c-1
```

**PHP 사용:**
```bash
php -S localhost:8000
```

**VS Code Live Server 사용:**
1. VS Code에서 `index.html` 열기
2. 우클릭 → "Open with Live Server"

---

## 📱 2. 기본 사용법

### 앱 열기
브라우저에서 접속: `http://localhost:8000/index.html`

### URL 파라미터로 제어

등차수열 설정을 URL로 직접 전달:

```
http://localhost:8000/index.html?a1=3&d=5&n=7
```

**파라미터:**
- `a1`: 첫째항 (예: 3)
- `d`: 공차 (예: 5)
- `n`: 항의 개수 (예: 7)

### 예제들

**예제 1: 기본 등차수열 (1, 3, 5, 7, 9)**
```
http://localhost:8000/index.html?a1=1&d=2&n=5
```

**예제 2: 감소하는 수열 (20, 17, 14, 11, 8)**
```
http://localhost:8000/index.html?a1=20&d=-3&n=5
```

**예제 3: 큰 증가 (5, 15, 25, 35, 45)**
```
http://localhost:8000/index.html?a1=5&d=10&n=5
```

---

## 🎨 3. 데모 페이지 보기

여러 예제를 한 번에 보려면:

```
http://localhost:8000/demo.html
```

데모 페이지에서는:
- 다양한 등차수열 예제 확인
- 인터랙티브 컨트롤로 실시간 변경
- Moodle 연동 방법 확인

---

## 🔗 4. Moodle에 삽입하기

### 간단한 방법 (iframe)

1. **Linear Stairs를 웹 서버에 업로드**
   ```bash
   scp -r linear-stairs user@your-server.com:/var/www/html/
   ```

2. **Moodle 코스에서 "레이블" 또는 "페이지" 추가**

3. **HTML 모드에서 다음 코드 삽입:**
   ```html
   <iframe
       src="http://your-domain.com/linear-stairs/index.html?a1=1&d=2&n=5&moodle=1"
       width="100%"
       height="900px"
       frameborder="0"
       style="max-width: 375px; margin: 0 auto; display: block;">
   </iframe>
   ```

4. **저장하고 확인!**

---

## 📂 5. 파일 구조

```
linear-stairs/
├── index.html              # 메인 앱 페이지
├── demo.html               # 데모/예제 페이지
├── server.py               # 테스트용 Python 서버
├── README.md               # 전체 문서
├── QUICKSTART.md           # 이 파일
├── css/
│   └── style.css          # 스타일시트
├── js/
│   ├── app.js             # 메인 로직
│   └── moodle-connector.js # Moodle 연동
└── moodle-plugin-example/  # Moodle 플러그인 예제
    ├── view.php
    ├── submit.php
    ├── version.php
    └── MOODLE_INSTALL.md
```

---

## ⚡ 6. 빠른 테스트

### 터미널에서 직접 열기

**macOS:**
```bash
cd linear-stairs
python3 server.py &
open http://localhost:8000/demo.html
```

**Linux:**
```bash
cd linear-stairs
python3 server.py &
xdg-open http://localhost:8000/demo.html
```

**Windows:**
```bash
cd linear-stairs
python server.py
start http://localhost:8000/demo.html
```

---

## 🎯 7. 주요 기능

### 시각화 기능
- ✅ 등차수열을 계단 형태로 표현
- ✅ 각 항의 값과 위치를 명확하게 표시
- ✅ 공차를 화살표로 시각화
- ✅ 실시간 파라미터 조정

### 애니메이션
- ✅ "애니메이션 재생" 버튼 클릭
- ✅ 계단이 하나씩 생성되는 효과
- ✅ 수열의 생성 과정 이해

### 모바일 최적화
- ✅ 스마트폰 화면 시뮬레이션
- ✅ 터치 친화적 UI
- ✅ 반응형 디자인

---

## 🔧 8. 커스터마이징

### 색상 변경
`css/style.css` 파일에서:

```css
/* 메인 그라디언트 (라인 9) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

원하는 색상으로 변경:
```css
background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
```

### 스마트폰 크기 변경
`css/style.css` 파일에서:

```css
.smartphone-container {
    max-width: 375px;  /* 원하는 너비로 변경 */
    height: 812px;     /* 원하는 높이로 변경 */
}
```

---

## 🐛 9. 문제 해결

### 앱이 로드되지 않을 때
1. 브라우저 콘솔 확인 (F12)
2. 서버가 실행 중인지 확인
3. 포트가 사용 중이면 다른 포트 사용:
   ```bash
   python3 -m http.server 8080
   ```

### Canvas가 표시되지 않을 때
- 브라우저가 최신 버전인지 확인
- JavaScript가 활성화되어 있는지 확인

### Moodle iframe이 작동하지 않을 때
- CORS 설정 확인
- Moodle 보안 설정 확인

---

## 📚 10. 다음 단계

### 더 알아보기
- 📖 [전체 문서 보기](README.md)
- 🔧 [Moodle 플러그인 설치](moodle-plugin-example/MOODLE_INSTALL.md)
- 💻 소스 코드 분석

### 실제 환경에 배포
1. 웹 서버에 업로드 (Apache, Nginx)
2. HTTPS 설정 (Let's Encrypt)
3. Moodle에 통합
4. 학생들에게 공유

---

## ✨ 11. 예제 시나리오

### 시나리오 1: 수학 수업에서 사용

**교사:**
1. Moodle 코스에 Linear Stairs 추가
2. 문제 설정: "첫째항이 3이고 공차가 4인 등차수열의 10번째 항을 구하시오"
3. URL 생성: `?a1=3&d=4&n=10`
4. 학생들이 시각화를 보며 문제 이해

**학생:**
1. 계단 시각화를 통해 등차수열의 개념 이해
2. 애니메이션으로 생성 과정 관찰
3. 인터랙티브하게 다양한 값 실험
4. 답 도출

### 시나리오 2: 자습 도구로 사용

1. `demo.html` 접속
2. 컨트롤 패널에서 값 조정
3. 실시간으로 시각화 확인
4. 등차수열의 패턴 발견

---

## 🎓 12. 수학적 배경

### 등차수열이란?
연속하는 두 항의 차이가 일정한 수열

**일반항 공식:**
```
aₙ = a₁ + (n-1)d
```

**예시:**
```
a₁ = 3, d = 5
a₁ = 3
a₂ = 3 + 5 = 8
a₃ = 8 + 5 = 13
a₄ = 13 + 5 = 18
...
```

---

## 📞 도움말

문제가 발생하면:
1. README.md 파일 확인
2. 브라우저 콘솔(F12) 확인
3. GitHub Issues에 문의

---

**즐거운 학습 되세요! 📚✨**
