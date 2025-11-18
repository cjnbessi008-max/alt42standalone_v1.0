# 🎵 Magnitude Sound

**벡터의 크기와 방향을 음악으로 경험하는 교육용 웹 애플리케이션**

> Moodle LMS와 연동하여 벡터 문제를 시각적·청각적으로 학습할 수 있는 혁신적인 교육 도구

---

## ✨ 주요 기능

### 🎯 핵심 기능
- **📐 벡터 입력**: 터치/마우스로 직관적인 벡터 그리기
- **🎵 사운드 변환**: 벡터의 크기와 방향을 실시간 음악으로 변환
- **📱 가상 스마트폰**: 우측 하단에 고정된 스마트폰 UI
- **🔗 Moodle 연동**: LMS와 완벽하게 통합

### 🎼 사운드 매핑 시스템

| 벡터 속성 | 음악 요소 | 매핑 방식 |
|----------|----------|----------|
| **크기** (Magnitude) | 음량 (Volume) | 0~10 → 0%~100% |
| **크기** (Magnitude) | 주파수 (Frequency) | 0~10 → 220Hz~880Hz |
| **방향** (Direction) | 패닝 (Pan) | 0°~360° → Left~Right |
| **방향** (Direction) | 파형 (Waveform) | 8방향 → sine/triangle/square/sawtooth |

### 📊 예시

```
벡터 v = (3, 4)
├─ 크기: 5.0
├─ 방향: 53.13°
└─ 소리:
   ├─ 음량: 50%
   ├─ 주파수: 440 Hz (A4)
   ├─ 파형: triangle
   └─ 패닝: +0.8 (오른쪽)
```

---

## 🚀 빠른 시작

### 1. 필수 요구사항

- **서버**: PHP 7.1.9 이상, MySQL 5.7 이상
- **Moodle**: 3.7 이상 (선택)
- **브라우저**: Chrome, Firefox, Safari (Web Audio API 지원)

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/magnitude-sound-app.git

# 웹 서버 디렉토리로 이동
cd /var/www/html

# 파일 복사
cp -r magnitude-sound-app .

# 권한 설정
chmod -R 755 magnitude-sound-app
```

### 3. 데이터베이스 설정

`api/config.php` 파일을 편집:

```php
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'your_username');
define('MOODLE_DB_PASS', 'your_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 4. 실행

브라우저에서 접속:
```
http://localhost/magnitude-sound-app/public/index.html
```

**Moodle과 연동:**
```
http://localhost/magnitude-sound-app/public/index.html?question_id=42&user_id=123
```

---

## 📁 프로젝트 구조

```
magnitude-sound-app/
├── public/                     # 프론트엔드 파일
│   ├── index.html             # 메인 HTML
│   ├── css/
│   │   └── styles.css         # 스타일시트
│   ├── js/
│   │   ├── vector-input.js    # 벡터 입력 로직
│   │   ├── sound-engine.js    # Web Audio API 엔진
│   │   ├── moodle-api.js      # Moodle 통신
│   │   └── app.js             # 메인 애플리케이션
│   └── assets/                # 이미지, 아이콘 등
├── api/                        # 백엔드 API (PHP)
│   ├── config.php             # 설정 및 유틸리티
│   ├── get_problems.php       # 문제 조회 API
│   └── submit_answer.php      # 답안 제출 API
├── docs/                       # 문서
│   └── MOODLE_INTEGRATION.md  # Moodle 통합 가이드
└── README.md                   # 이 파일
```

---

## 🎮 사용 방법

### 1. 벡터 입력

1. **스마트폰 화면의 캔버스 터치**
2. **원점(O)에서 시작하여 드래그**
3. **자동으로 크기/방향 계산**

### 2. 소리 재생

1. **"✨ 소리 재생하기" 버튼 클릭**
2. **벡터에 대응하는 음악 자동 생성**
3. **1~2초간 재생**

### 3. 초기화

- **"🔄 초기화" 버튼**: 벡터와 소리 리셋
- **ESC 키**: 빠른 초기화
- **스페이스 바**: 소리 중지

### 4. 키보드 단축키

| 키 | 기능 |
|---|------|
| **Enter** | 소리 재생 |
| **Esc** | 초기화 |
| **Space** | 소리 중지 |

---

## 🔧 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 애니메이션
- **JavaScript (ES6+)**: 모듈화된 OOP
- **Canvas API**: 벡터 그래픽
- **Web Audio API**: 실시간 사운드 생성

### 백엔드
- **PHP 7.1.9**: RESTful API
- **MySQL 5.7**: 데이터 저장
- **Moodle 3.7**: LMS 통합

### 아키텍처
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser    │────▶│  PHP API     │────▶│  MySQL DB   │
│  (Frontend) │     │  (Backend)   │     │  (Moodle)   │
└─────────────┘     └──────────────┘     └─────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Web Audio API (Browser)                │
│  - Oscillator (음원)                    │
│  - Gain (음량)                           │
│  - StereoPanner (패닝)                  │
└─────────────────────────────────────────┘
```

---

## 🎨 커스터마이징

### 색상 변경

`public/css/styles.css`:
```css
:root {
    --primary-color: #6366f1;     /* 메인 색상 */
    --secondary-color: #8b5cf6;   /* 보조 색상 */
    --accent-color: #ec4899;      /* 강조 색상 */
}
```

### 사운드 파라미터 조정

`public/js/sound-engine.js`:
```javascript
vectorToSoundParams(vector) {
    // 주파수 범위 변경
    const minFreq = 110;  // A2
    const maxFreq = 1760; // A6

    // 지속 시간 변경
    const duration = 0.5 + (normalizedMagnitude * 2.5); // 0.5~3초
}
```

---

## 📚 API 문서

### GET /api/get_problems.php

**파라미터:**
- `question_id`: 문제 ID
- `quiz_id`: Quiz ID
- `course_id`: 코스 ID

**응답:**
```json
{
    "success": true,
    "data": {
        "id": 42,
        "name": "벡터의 크기와 방향",
        "vector_info": {
            "has_vector": true,
            "magnitude_range": {"min": 0, "max": 10}
        }
    }
}
```

### POST /api/submit_answer.php

**요청:**
```json
{
    "question_id": 42,
    "user_id": 123,
    "vector_x": 3.0,
    "vector_y": 4.0
}
```

**응답:**
```json
{
    "success": true,
    "data": {
        "answer_id": 1001,
        "calculated": {
            "magnitude": 5.0,
            "direction_degrees": 53.13
        },
        "sound_params": {
            "frequency": 440.0,
            "waveform": "triangle"
        }
    }
}
```

자세한 내용: [docs/MOODLE_INTEGRATION.md](docs/MOODLE_INTEGRATION.md)

---

## 🧪 테스트

### 독립 실행 (데모 모드)
```
http://localhost/magnitude-sound-app/public/index.html
```

### Moodle 통합 테스트
```
http://localhost/magnitude-sound-app/public/index.html?question_id=1&user_id=2
```

### API 테스트 (curl)
```bash
# 문제 조회
curl "http://localhost/magnitude-sound-app/api/get_problems.php?question_id=1"

# 답안 제출
curl -X POST "http://localhost/magnitude-sound-app/api/submit_answer.php" \
  -H "Content-Type: application/json" \
  -d '{"question_id":1,"user_id":2,"vector_x":3,"vector_y":4}'
```

---

## 🌐 브라우저 호환성

| 브라우저 | 버전 | 지원 |
|---------|------|------|
| Chrome | 58+ | ✅ 완벽 지원 |
| Firefox | 53+ | ✅ 완벽 지원 |
| Safari | 11+ | ✅ 완벽 지원 |
| Edge | 79+ | ✅ 완벽 지원 |
| IE | 11 | ❌ 미지원 |

---

## 🐛 문제 해결

### 소리가 재생되지 않음
✅ **해결책**:
- "시작하기" 버튼 클릭 (브라우저 자동재생 정책)
- HTTPS 사용 권장

### API 연결 오류
✅ **해결책**:
- `api/config.php`의 DB 정보 확인
- CORS 설정 확인
- PHP 에러 로그: `/var/log/apache2/error.log`

### 벡터가 그려지지 않음
✅ **해결책**:
- 캔버스 영역 클릭 확인
- 브라우저 콘솔(F12) 에러 확인
- JavaScript 활성화 확인

---

## 🤝 기여하기

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

MIT License

Copyright (c) 2025 Magnitude Sound Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...

자세한 내용: [LICENSE](LICENSE)

---

## 👥 제작자

- **프로젝트 관리**: Alt42 Standalone
- **개발**: Claude AI Assistant
- **교육 자문**: KAIST

---

## 📞 연락처

- **이슈 보고**: [GitHub Issues](https://github.com/your-repo/magnitude-sound-app/issues)
- **이메일**: support@example.com
- **웹사이트**: https://magnitude-sound.example.com

---

## 🎓 교육적 활용

### 적용 가능한 수업
- ✅ 고등학교 수학 (벡터)
- ✅ 대학 선형대수
- ✅ 물리학 (힘, 속도)
- ✅ 음악 이론
- ✅ 멀티미디어 프로그래밍

### 학습 효과
1. **시각화**: 벡터를 눈으로 확인
2. **청각화**: 크기/방향을 귀로 인식
3. **실습**: 직접 그리며 체득
4. **피드백**: 즉각적인 음향 피드백

---

## 🔮 향후 계획

- [ ] **음계 시스템**: 펜타토닉, 메이저 스케일 옵션
- [ ] **다중 벡터**: 여러 벡터 동시 표현 (화음)
- [ ] **3D 벡터**: Z축 추가 및 3D 사운드
- [ ] **녹음 기능**: 생성된 소리 다운로드
- [ ] **협업 모드**: 실시간 다중 사용자
- [ ] **AI 피드백**: 벡터 입력 패턴 분석

---

## 🙏 감사의 글

- **Moodle Community**: 훌륭한 LMS 플랫폼 제공
- **Web Audio API**: 브라우저 기반 음악 생성 가능
- **MDN Web Docs**: 포괄적인 웹 기술 문서
- **모든 교육자와 학생들**: 영감과 피드백 제공

---

**Made with ❤️ for Education**

벡터를 음악으로, 수학을 예술로. 🎵📐
