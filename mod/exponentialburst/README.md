# Exponential Burst - Moodle Activity Module

## 개요 (Overview)

**Exponential Burst**는 지수 함수의 폭발적 성장을 시각적 불꽃 애니메이션으로 표현하는 Moodle 활동 모듈입니다. 학생들이 지수 문제를 풀면, 정답에 따라 우측 하단의 가상 스마트폰 화면에서 아름다운 불꽃 효과가 지수적으로 증가하며 폭발합니다.

**Exponential Burst** is a Moodle activity module that visualizes exponential growth through interactive firework animations on a virtual smartphone display positioned at the bottom right of the screen. When students solve exponential problems correctly, they see visual bursts that grow exponentially based on the answer.

## 주요 기능 (Key Features)

### 📱 가상 스마트폰 인터페이스
- 우측 하단에 고정된 가상 스마트폰 화면
- 실제 스마트폰처럼 보이는 프레임 디자인
- 반응형 디자인으로 모바일에서도 자연스러운 표시

### 🎆 지수 함수 시각화
- 정답 시 지수적으로 증가하는 불꽃 파티클 효과
- base^exponent에 따라 증가하는 파티클 수
- 다단계 폭발 애니메이션 (지수 값에 따라)
- 실시간 캔버스 기반 렌더링

### 📊 학습 진행 추적
- 학생별 진행 상황 저장
- 최고 점수 및 총 성공 횟수 기록
- 문제 풀이 시간 추적
- 모든 시도 내역 저장

### ⚙️ 난이도 조정
- 1-5 단계 난이도 설정
- 난이도에 따른 지수 범위 자동 조정
- 교사가 최대 지수 값 설정 가능

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.3 이상 (권장: 3.7)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: 최신 Chrome, Firefox, Safari, Edge

## 설치 방법 (Installation)

### 1. 파일 업로드

```bash
# Moodle 설치 디렉토리의 mod 폴더에 복사
cd /path/to/moodle
cp -r /path/to/exponentialburst mod/
```

### 2. 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chown -R www-data:www-data mod/exponentialburst
chmod -R 755 mod/exponentialburst
```

### 3. Moodle 알림 페이지 방문

1. Moodle에 관리자로 로그인
2. 사이트 관리 > 알림 페이지 자동 이동
3. "데이터베이스 업그레이드" 버튼 클릭
4. 설치 완료 확인

### 4. 플러그인 확인

- 사이트 관리 > 플러그인 > 활동 모듈
- "Exponential Burst" 확인

## 사용 방법 (Usage)

### 교사 (Teacher)

#### 1. 활동 추가
1. 코스로 이동
2. "편집 모드 켜기"
3. "활동 또는 리소스 추가" 클릭
4. "Exponential Burst" 선택

#### 2. 설정
- **이름**: 활동 이름 입력
- **설명**: 활동 설명 입력
- **난이도**: 1-5 선택 (1=쉬움, 5=어려움)
- **최대값**: 지수 함수의 최대값 설정 (기본: 100)
- **그래프 표시**: 그래프 표시 여부 선택

#### 3. 저장
- "저장하고 표시" 또는 "저장하고 코스로 돌아가기" 클릭

### 학생 (Student)

#### 1. 활동 시작
1. 코스에서 Exponential Burst 활동 클릭
2. 우측 하단의 가상 스마트폰 화면 확인
3. 제시된 지수 문제 확인

#### 2. 문제 풀기
1. 스마트폰 화면의 입력 필드에 답 입력
2. "Submit Answer" 버튼 클릭
3. 정답 시: 지수적 불꽃 효과 감상
4. 오답 시: 피드백 확인 후 재시도

#### 3. 진행 상황 확인
- 현재 레벨
- 최고 점수
- 총 성공 횟수

## 데이터베이스 스키마 (Database Schema)

### exponentialburst
활동 인스턴스 저장
- id, course, name, intro, difficulty, maxvalue, showgraph
- timecreated, timemodified

### exponentialburst_attempts
학생 시도 기록
- id, exponentialburstid, userid, questionid
- answer, iscorrect, visualdata, timespent, attemptnum
- timecreated

### exponentialburst_progress
학생 진행 상황
- id, exponentialburstid, userid
- currentlevel, totalbursts, bestscore, totaltime
- timecreated, timemodified

## 기술 스택 (Technology Stack)

### 백엔드 (Backend)
- **PHP 7.1+**: Moodle API 기반 백엔드
- **MySQL 5.7+**: 데이터 저장
- **Moodle XMLDB**: 데이터베이스 스키마 관리

### 프론트엔드 (Frontend)
- **HTML5 Canvas**: 불꽃 애니메이션 렌더링
- **Vanilla JavaScript**: 경량 프론트엔드 (라이브러리 없음)
- **CSS3**: 스마트폰 UI 스타일링, 애니메이션

## 커스터마이징 (Customization)

### 색상 변경
`styles.css` 파일에서 색상 팔레트 수정:
```css
var colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', /* ... */
];
```

### 난이도 조정
`lib.php`의 `exponentialburst_get_question()` 함수 수정:
```php
$base = rand(2, 5);  // 밑수 범위
$exponent = rand(1, min(5, $difficulty + 2));  // 지수 범위
```

### 애니메이션 속도
`module.js`의 `stageDelay` 값 조정:
```javascript
var stageDelay = 200; // milliseconds
```

## 문제 해결 (Troubleshooting)

### 스마트폰 화면이 보이지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- `module.js`, `styles.css` 파일 로드 확인
- 캐시 클리어 후 새로고침

### 불꽃 효과가 작동하지 않음
- 브라우저가 HTML5 Canvas 지원하는지 확인
- JavaScript 콘솔에서 에러 메시지 확인
- `burst-canvas` 요소 존재 확인

### 진행 상황이 저장되지 않음
- `ajax.php` 파일 권한 확인
- 브라우저 네트워크 탭에서 AJAX 요청 확인
- 데이터베이스 테이블 생성 확인

### 권한 오류
- 사이트 관리 > 사용자 > 권한 > 권한 정의
- `mod/exponentialburst:submit` 권한 확인
- 학생 역할에 권한 할당 확인

## 개발 로드맵 (Roadmap)

### v1.1 (계획)
- [ ] Moodle 질문 은행 통합
- [ ] 다국어 지원 (한국어, 영어)
- [ ] 교사 리포트 대시보드
- [ ] 성취도 배지 시스템

### v1.2 (계획)
- [ ] 사운드 효과 추가
- [ ] 다양한 시각화 테마
- [ ] 협동 학습 모드
- [ ] 리더보드 기능

## 라이선스 (License)

GNU GPL v3 or later

## 저작권 (Copyright)

Copyright (C) 2025 KAIST Touch Math Academy

## 지원 (Support)

- **이슈 리포트**: GitHub Issues
- **문의**: support@kaist-touchmath.edu
- **문서**: [Wiki](https://github.com/kaist/exponentialburst/wiki)

## 기여 (Contributing)

Pull requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 감사의 글 (Acknowledgments)

- KAIST Touch Math Academy 팀
- Moodle 커뮤니티
- Canvas API 튜토리얼 및 리소스 제공자들

---

**Made with ❤️ by KAIST Touch Math Academy**
