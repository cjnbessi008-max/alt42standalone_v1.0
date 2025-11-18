# 🌳 Log Tree - 로그 함수 학습 앱

로그 함수의 성장을 나무의 성장으로 시각화하는 인터랙티브 교육 웹앱입니다.

## 📋 개요

Log Tree는 Moodle LMS와 연동하여 학생들이 로그 함수 문제를 풀면서, 나무가 자라는 것을 시각적으로 확인할 수 있는 게임화된 학습 도구입니다.

### 주요 기능

- 📱 **가상 스마트폰 UI**: 우측 하단에 스마트폰 프레임으로 나무 성장 애니메이션 표시
- 🌳 **로그 함수 시각화**: 문제 해결 수에 따라 logarithmic growth로 나무 성장
- 🔗 **Moodle 연동**: Moodle 3.7 Web Services API와 연동
- 🎮 **데모 모드**: Moodle 없이도 테스트 가능
- 📊 **실시간 통계**: 정확도, 레벨, 성장 지수 등 표시
- 🎨 **아름다운 애니메이션**: SVG 기반 부드러운 나무 성장 효과

## 🚀 시작하기

### 필요 사항

- 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)
- (선택) Moodle 3.7+ 설치 및 Web Services 활성화

### 설치

1. 프로젝트를 웹 서버에 배포:
```bash
# log-tree-app 폴더를 웹 서버 문서 루트에 복사
cp -r log-tree-app /var/www/html/
```

2. 브라우저로 접속:
```
http://localhost/log-tree-app/
```

### 데모 모드로 빠른 시작

1. 앱 실행 시 나타나는 설정 모달에서
2. **"데모 모드 사용"** 버튼 클릭
3. 바로 문제 풀이 시작!

## 🔧 Moodle 연동 설정

### Moodle 설정

1. **Web Services 활성화**:
   - 사이트 관리 > 고급 기능 > "모바일 서비스 활성화" 체크
   - 사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스

2. **토큰 생성**:
   - 사이트 관리 > 웹 서비스 > 토큰 관리
   - 사용자 선택 후 토큰 생성
   - 생성된 토큰 복사

3. **필요한 기능 활성화**:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quiz_access_information`
   - `mod_quiz_get_attempt_data`
   - `mod_quiz_process_attempt`

### 앱 설정

1. 앱 우측 상단 **⚙️ 설정 버튼** 클릭
2. 다음 정보 입력:
   - **Moodle URL**: `http://your-moodle-site.com`
   - **API Token**: 위에서 생성한 토큰
   - **Course ID**: 연동할 코스 ID
   - **Quiz ID**: 사용할 퀴즈 ID
3. **연결** 버튼 클릭

## 🎯 사용 방법

### 기본 사용

1. **문제 확인**: 왼쪽 대시보드에 현재 문제 표시
2. **답 입력**: 입력 필드에 숫자 답 입력
3. **제출**: "제출" 버튼 클릭 또는 Enter 키
4. **피드백 확인**: 정답/오답 여부와 설명 표시
5. **나무 성장 관찰**: 정답 시 우측 스마트폰 화면의 나무가 성장

### 로그 함수 성장 공식

나무의 높이는 다음 로그 함수로 계산됩니다:

```
높이 = 50 × log₂(해결한 문제 수 + 1)
```

- 문제를 많이 풀수록 나무가 크게 자라지만
- 성장 속도는 점점 느려집니다 (로그 함수의 특성)
- 이를 통해 로그 함수의 성장 패턴을 직관적으로 이해

### 통계 확인

- **해결한 문제**: 정답을 맞춘 문제 수
- **정확도**: (정답 수 / 전체 시도 수) × 100%
- **나무 높이**: 현재 나무의 높이 (cm)
- **성장 지수**: log₂(n) 공식으로 표시

## 📁 프로젝트 구조

```
log-tree-app/
├── index.html              # 메인 HTML
├── css/
│   └── styles.css         # 전체 스타일시트
├── js/
│   ├── app.js            # 메인 애플리케이션 로직
│   ├── moodle-api.js     # Moodle API 연동
│   ├── log-calculator.js # 로그 함수 계산
│   └── tree-visualizer.js # 나무 시각화
└── assets/
    └── images/           # 이미지 자산
```

## 🎨 주요 기술

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Visualization**: SVG (Scalable Vector Graphics)
- **Animation**: CSS3 Animations + Web Animations API
- **API**: Fetch API for Moodle integration
- **Storage**: LocalStorage for progress saving

## 🔍 기술적 특징

### 로그 함수 구현

```javascript
// 나무 높이 계산
height = 50 * Math.log2(problemsSolved + 1)

// 성장률 계산 (미분)
rate = 50 / ((problemsSolved + 1) * Math.LN2)

// 잎 개수 계산
leaves = 3 + Math.floor(Math.log2(height + 1) * 2)
```

### SVG 애니메이션

- 동적 SVG 요소 생성 및 조작
- requestAnimationFrame을 이용한 부드러운 애니메이션
- Ease-out 이징 함수로 자연스러운 성장 효과

### 반응형 디자인

- 데스크톱: 대시보드 + 스마트폰 프레임
- 태블릿: 스택형 레이아웃
- 모바일: 풀스크린 적응형 UI

## 🐛 트러블슈팅

### Moodle 연결 실패

1. **CORS 오류**: Moodle 서버에서 CORS 허용 필요
   ```php
   // Moodle config.php에 추가
   $CFG->allowedorigins = ['http://your-app-domain.com'];
   ```

2. **토큰 오류**: Web Services 활성화 및 토큰 권한 확인

3. **API 함수 없음**: 필요한 Web Services 함수 활성화 확인

### 나무가 안 자라는 경우

- 브라우저 콘솔에서 JavaScript 오류 확인
- LocalStorage 지원 여부 확인
- `window.resetApp()` 실행해서 초기화

### 데모 모드 문제

- 페이지 새로고침
- 브라우저 캐시 삭제

## 🎓 교육적 가치

1. **로그 함수 이해**: 시각적으로 로그 함수의 성장 패턴 학습
2. **즉각적 피드백**: 실시간으로 정답/오답 확인
3. **게임화**: 나무 성장을 통한 학습 동기 부여
4. **진행 상황 추적**: 통계로 학습 성과 확인

## 🔒 보안 고려사항

- API 토큰은 HTTPS를 통해서만 전송 권장
- LocalStorage에 민감 정보 저장 주의
- Moodle Web Services는 신뢰할 수 있는 도메인만 허용

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 지원

문제가 발생하면:
1. 브라우저 콘솔 확인
2. 데모 모드로 앱 동작 테스트
3. Moodle 설정 재확인

## 🚧 향후 개선 사항

- [ ] 다양한 나무 종류 선택
- [ ] 계절별 테마 (봄/여름/가을/겨울)
- [ ] 멀티플레이어 모드 (나무 키 경쟁)
- [ ] 업적 시스템
- [ ] 소셜 공유 기능
- [ ] 다양한 수학 함수 시각화 (지수, 삼각함수 등)

## 📞 연락처

프로젝트에 대한 문의사항이나 개선 제안은 이슈로 등록해주세요.

---

**Made with 🌳 for better math education**
