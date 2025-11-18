# Touch Math - Tangent Learning App

접선을 그릴 때 빛나는 효과를 제공하는 수학 학습 웹 애플리케이션입니다.

## 🌟 주요 기능

### 1. 접선 그리기 (Tangent Drawing)
- 곡선 위의 점을 터치/클릭하여 접선을 그립니다
- 실시간으로 접선 방정식을 계산하고 표시합니다
- 다양한 함수 타입 지원: 다항식, 삼각함수, 지수함수

### 2. Tangent Shine Effect ✨
- **파티클 버스트**: 접선이 그려질 때 아름다운 파티클 폭발 효과
- **글로우 라인**: 접선이 빛나며 나타나는 효과
- **스파클 트레일**: 접선을 따라 반짝이는 입자들
- **리플 효과**: 점을 선택할 때 퍼져나가는 물결 효과

### 3. Moodle LMS 연동
- Moodle 3.7 호환
- 문제 정보를 LMS로부터 받아옵니다
- 학생 답안을 제출하고 피드백을 받습니다
- 학습 과정을 자동으로 기록합니다

### 4. 모바일 최적화
- 스마트폰 화면에 맞춘 반응형 디자인
- 터치 인터랙션 완벽 지원
- 375x667 스마트폰 프레임 UI

## 🛠 기술 스택

### Frontend
- **HTML5 Canvas**: 그래프와 애니메이션 렌더링
- **JavaScript ES6+**: 객체지향 프로그래밍
- **CSS3**: 애니메이션과 반응형 디자인

### Backend (Moodle)
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── index.html              # 메인 HTML
│   ├── css/
│   │   └── style.css           # 스타일시트
│   └── js/
│       ├── app.js              # 메인 애플리케이션 로직
│       ├── tangent.js          # 접선 계산 및 그래프 렌더링
│       ├── shine-effect.js     # 빛나는 효과 애니메이션
│       └── moodle-api.js       # Moodle API 연동
├── moodle/
│   └── local/
│       └── touchmath/          # Moodle 플러그인 (별도 설치 필요)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🚀 사용 방법

### 로컬 개발 환경

1. **파일 열기**
   ```bash
   # 간단한 HTTP 서버 실행
   cd src
   python -m http.server 8000
   ```

2. **브라우저에서 접속**
   ```
   http://localhost:8000
   ```

3. **개발 모드**
   - Moodle에 연결되지 않으면 자동으로 목업 데이터를 사용합니다
   - URL 파라미터 없이도 테스트 가능합니다

### Moodle 통합

1. **URL 파라미터로 실행**
   ```
   http://your-domain/src/index.html?token=xxx&student_id=123&course_id=456&activity_id=789
   ```

2. **Moodle 임베드 (iframe)**
   ```html
   <iframe src="http://your-domain/src/index.html?token=xxx&..."
           width="375" height="667"></iframe>
   ```

## 🎨 Shine Effect 상세

### 효과 종류

1. **Particle Burst (파티클 버스트)**
   - 20개의 파티클이 방사형으로 퍼져나갑니다
   - 색상: 청색-보라색 그라디언트 (HSL 250-280)
   - 수명: 0.8-1.2초

2. **Glow Line (글로우 라인)**
   - 3단계 레이어로 빛나는 선
   - 외부 글로우 (15px blur)
   - 중간 글로우 (10px blur)
   - 코어 라인 (5px blur)

3. **Sparkle Trail (스파클 트레일)**
   - 접선을 따라 15개 지점에서 작은 불꽃
   - 순차적으로 나타나는 애니메이션 (50ms 간격)

4. **Ripple (리플)**
   - 3개의 동심원이 퍼져나가는 효과
   - 100ms 간격으로 순차 발생
   - 최대 반경: 50-80px

### 커스터마이징

`shine-effect.js`에서 다음 파라미터를 조정할 수 있습니다:

```javascript
// 파티클 개수
createParticleBurst(x, y, 20); // 20 -> 원하는 개수

// 색상 범위
const hue = 250 + Math.random() * 30; // 250-280 (청-보라)

// 수명
life: 1.0,
decay: 0.015, // 낮을수록 오래 지속
```

## 📱 지원 환경

### 브라우저
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 디바이스
- 모바일: 최적화됨
- 태블릿: 지원
- 데스크톱: 지원

## 🔧 Moodle 플러그인 설치

Moodle 연동을 위해서는 별도의 플러그인 설치가 필요합니다.

### 필요한 웹 서비스 함수

1. `local_touchmath_get_problem`
   - 문제 정보를 가져옵니다

2. `local_touchmath_submit_answer`
   - 학생 답안을 제출합니다

3. `local_touchmath_save_progress`
   - 학습 진행 상황을 저장합니다

4. `local_touchmath_log_event`
   - 학습 이벤트를 기록합니다

### 데이터베이스 스키마

```sql
-- 문제 테이블
CREATE TABLE mdl_touchmath_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    courseid BIGINT(10) NOT NULL,
    activityid BIGINT(10) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    functiontype VARCHAR(50),
    functiondata TEXT,
    timemodified BIGINT(10),
    PRIMARY KEY (id)
);

-- 제출 테이블
CREATE TABLE mdl_touchmath_submissions (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    problemid BIGINT(10) NOT NULL,
    studentid BIGINT(10) NOT NULL,
    answer TEXT,
    score DECIMAL(10,5),
    timecreated BIGINT(10),
    PRIMARY KEY (id)
);

-- 이벤트 로그 테이블
CREATE TABLE mdl_touchmath_events (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    studentid BIGINT(10) NOT NULL,
    eventtype VARCHAR(100),
    eventdata TEXT,
    timecreated BIGINT(10),
    PRIMARY KEY (id)
);
```

## 🧪 테스트

### 수동 테스트

1. **접선 그리기 테스트**
   - 곡선 위 여러 점을 클릭하여 접선이 올바르게 그려지는지 확인
   - 터치와 마우스 모두 테스트

2. **Shine Effect 테스트**
   - 파티클이 아름답게 나타나는지 확인
   - 성능 저하 없이 부드럽게 동작하는지 확인

3. **반응형 테스트**
   - 다양한 화면 크기에서 테스트
   - 개발자 도구로 모바일 환경 시뮬레이션

### 자동 테스트 (향후 추가)

```bash
# 향후 Jest로 단위 테스트 추가 예정
npm test
```

## 📈 성능 최적화

### 현재 최적화
- Canvas 고해상도 디스플레이 지원 (devicePixelRatio)
- 애니메이션 requestAnimationFrame 사용
- 파티클 수명 관리로 메모리 효율화
- 이벤트 리스너 passive 옵션

### 추가 최적화 계획
- WebGL 렌더링 (많은 파티클 처리 시)
- Web Workers (계산 최적화)
- 오프스크린 캔버스

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

Copyright © 2025 KAIST Touch Math Academy

## 👥 개발자

- AI Education System Pipeline Team
- KAIST Touch Math Academy

## 📞 문의

- 이메일: support@kaist-touchmath.edu
- 이슈: GitHub Issues

---

## 🎓 교육적 가치

이 앱은 다음과 같은 교육적 목표를 달성합니다:

1. **시각적 학습**: 접선의 개념을 시각적으로 이해
2. **즉각적 피드백**: 빛나는 효과로 학습자의 동기 부여
3. **인터랙티브**: 직접 조작하며 수학 개념 탐구
4. **재미있는 학습**: 게임적 요소로 흥미 유발

## 🔮 향후 계획

- [ ] 더 많은 함수 타입 지원
- [ ] 다양한 색상 테마
- [ ] 사운드 효과 추가
- [ ] 멀티플레이어 모드
- [ ] AR/VR 지원
- [ ] AI 기반 힌트 시스템
