# ⚡ Slope Sense - 5분 빠른 시작 가이드

## 🎯 목표
브라우저에서 바로 실행되는 기울기 학습 앱을 5분 안에 실행하기!

---

## 📥 Step 1: 다운로드 (30초)

```bash
# 옵션 A: Git 사용
git clone https://github.com/your-repo/slope-sense-standalone.git
cd slope-sense-standalone

# 옵션 B: ZIP 다운로드
# GitHub에서 "Code" > "Download ZIP" 클릭
# 압축 해제 후 폴더로 이동
```

---

## 🚀 Step 2: 실행 (30초)

### 가장 빠른 방법 (권장!)

#### Python 있는 경우:
```bash
python -m http.server 8000
```

#### Node.js 있는 경우:
```bash
npx serve
```

#### VS Code 사용 중:
1. Live Server 확장 설치
2. `index.html` 우클릭
3. "Open with Live Server" 클릭

#### 아무것도 없는 경우:
`index.html` 파일을 더블클릭!
(일부 브라우저에서는 CORS 문제로 작동 안 할 수 있음)

---

## 🎉 Step 3: 즐기기! (4분)

브라우저 열기:
```
http://localhost:8000
```

**우측 하단에 스마트폰 화면이 나타나면 성공!** 🎊

---

## 🎮 기본 사용법

1. **문제 읽기**: "두 점 사이의 기울기를 구하세요"
2. **애니메이션 관찰**: 공이 굴러가는 것을 보기
3. **답 입력**: 계산한 기울기 입력 (예: 0.5)
4. **제출**: "제출" 버튼 클릭
5. **다음 문제**: 정답 시 자동으로 다음 문제로!

---

## 🌐 온라인 배포 (선택사항)

### GitHub Pages (무료!)

```bash
# 1. GitHub 저장소 생성
# 2. 파일 푸시
git add .
git commit -m "Initial commit"
git push origin main

# 3. Settings > Pages
# Source: main branch
# 저장!

# 5분 후 접속:
# https://your-username.github.io/slope-sense-standalone
```

### Netlify (드래그 앤 드롭!)

1. [netlify.com](https://netlify.com) 접속
2. 로그인
3. `slope-sense-standalone` 폴더를 화면에 드래그
4. 끝! URL 받기

---

## ❓ 문제 해결

### 파일을 열었는데 작동 안 함
➜ 로컬 서버로 실행하세요 (위의 Step 2)

### "Cannot find module" 오류
➜ 폴더 구조가 올바른지 확인:
```
slope-sense-standalone/
├── index.html
├── js/
│   ├── app.js
│   └── modules/
└── ...
```

### 애니메이션이 안 보임
➜ 최신 브라우저 사용 (Chrome 63+, Firefox 60+)

---

## 🎊 완료!

이제 기울기를 재미있게 배울 준비가 되었습니다!

**더 많은 정보**: `README.md` 참조
**문제 신고**: GitHub Issues

---

**즐거운 학습 되세요!** 🚀📐
