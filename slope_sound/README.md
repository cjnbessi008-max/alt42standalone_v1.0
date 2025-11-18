# 🎵 Slope Sound - 도함수 사운드 학습 앱

도함수 구조를 사운드 시그널로 알려주는 교육용 웹앱입니다. Moodle LMS와 연동하여 문제 정보를 받아 동작하며, 우측 하단 가상 스마트폰 화면에 표시됩니다.

## 📋 주요 기능

- **시각적 학습**: 함수 그래프를 실시간으로 시각화
- **청각적 피드백**: 도함수 값(기울기)을 사운드로 변환
  - 양수 기울기 → 높은 음
  - 음수 기울기 → 낮은 음
  - 기울기 크기 → 음 높이 차이
- **인터랙티브**: 그래프를 터치/드래그하여 각 점의 기울기 탐색
- **진행도 추적**: 학습자의 탐색 영역과 시간 기록
- **Moodle 연동**: LMS와 완벽한 통합으로 학습 데이터 관리

## 🎯 학습 목표

1. 도함수의 개념을 직관적으로 이해
2. 함수의 기울기 변화를 체험적으로 학습
3. 청각을 활용한 멀티모달 학습 경험
4. 자기주도적 탐색을 통한 수학적 사고력 향상

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5 Canvas**: 그래프 렌더링
- **Web Audio API**: 실시간 사운드 생성
- **Vanilla JavaScript**: ES6+ (프레임워크 없이 경량화)
- **CSS3**: 반응형 디자인 및 스마트폰 UI

### 수학 엔진
- 수치 미분법을 이용한 도함수 계산
- 다양한 함수 지원 (다항식, 삼각함수, 지수함수 등)

## 📁 프로젝트 구조

```
slope_sound/
├── moodle_plugin/           # Moodle 플러그인
│   ├── version.php          # 플러그인 버전 정보
│   ├── db/
│   │   ├── access.php       # 권한 설정
│   │   └── install.xml      # 데이터베이스 스키마
│   ├── classes/
│   │   ├── problem_manager.php   # 문제 관리
│   │   └── attempt_manager.php   # 시도 관리
│   ├── lang/en/
│   │   └── local_slopesound.php  # 언어 파일
│   └── api.php              # API 엔드포인트
│
├── webapp/                  # 웹 애플리케이션
│   ├── index.html          # 메인 페이지
│   ├── css/
│   │   └── style.css       # 스타일시트
│   ├── js/
│   │   ├── math-engine.js      # 수학 계산 엔진
│   │   ├── audio-engine.js     # 사운드 생성 엔진
│   │   ├── graph-renderer.js   # 그래프 렌더링
│   │   ├── moodle-api.js       # Moodle API 연동
│   │   └── app.js              # 메인 애플리케이션
│   └── api/
│       ├── config.php          # 독립 실행 설정
│       └── standalone_api.php  # 독립 실행 API
│
├── database/
│   └── schema.sql          # 데이터베이스 스키마
│
└── docs/
    ├── INSTALL.md          # 설치 가이드
    └── USER_GUIDE.md       # 사용자 가이드
```

## 🚀 설치 방법

### 1. Moodle 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r slope_sound/moodle_plugin local/slopesound

# 소유자 변경 (웹서버 사용자)
chown -R www-data:www-data local/slopesound

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 선택
USE moodle;

# 스키마 임포트
source /path/to/slope_sound/database/schema.sql;
```

### 3. 웹앱 배포

#### 방법 A: Moodle 통합 배포

```bash
# Moodle 내부에 배포
cp -r slope_sound/webapp /path/to/moodle/local/slopesound/webapp

# URL: https://your-moodle-site.com/local/slopesound/webapp/
```

#### 방법 B: 독립 웹서버 배포

```bash
# 웹 서버 루트에 배포
cp -r slope_sound/webapp /var/www/html/slope-sound

# Apache 설정
sudo a2enmod rewrite
sudo systemctl restart apache2

# URL: https://your-site.com/slope-sound/
```

### 4. 설정 파일 수정

```bash
# 독립 실행 시 데이터베이스 설정
nano webapp/api/config.php

# 다음 항목 수정:
# - DB_HOST
# - DB_NAME
# - DB_USER
# - DB_PASS
```

## 🎮 사용 방법

### 교사용

1. **Moodle 로그인** → 관리자/교사 권한
2. **문제 추가**: Moodle 데이터베이스에 직접 입력 또는 API 사용
3. **퀴즈 연동**: Moodle 퀴즈 ID와 문제 연결 (선택사항)
4. **학습자 진행도 확인**: Moodle 리포트에서 확인

### 학습자용

1. **웹앱 접속**: Moodle 내부 또는 직접 URL
2. **문제 선택**: 왼쪽 문제 목록에서 선택
3. **그래프 탐색**:
   - 마우스로 그래프 위를 드래그
   - 터치스크린에서는 손가락으로 드래그
4. **사운드 청취**: 각 점의 기울기가 음높이로 표현됨
5. **정보 확인**:
   - X 좌표
   - 함수 값 f(x)
   - 기울기 (도함수 값)
   - 주파수 (Hz)
6. **진행도**: 탐색한 영역 비율 확인

## 🔧 개발자 가이드

### 새로운 함수 타입 추가

`webapp/js/math-engine.js`의 `evaluate()` 함수 수정:

```javascript
let jsExpression = expression
    .replace(/\^/g, '**')
    .replace(/sin/g, 'Math.sin')
    // 새로운 함수 추가
    .replace(/ln/g, 'Math.log');
```

### 사운드 매핑 커스터마이징

`webapp/js/audio-engine.js`의 파라미터 조정:

```javascript
this.baseFrequency = 440; // 기준 주파수
this.minFrequency = 220;  // 최소 주파수
this.maxFrequency = 880;  // 최대 주파수
this.duration = 200;      // 지속 시간 (ms)
```

### API 엔드포인트 추가

`moodle_plugin/api.php`에 새로운 액션 추가:

```php
case 'new_action':
    $param = required_param('param_name', PARAM_TYPE);
    // 처리 로직
    echo json_encode(['success' => true, 'data' => $result]);
    break;
```

## 📊 데이터베이스 스키마

### mdl_slopesound_problems
- 문제 정보 저장 (함수 표현식, 범위, 난이도)

### mdl_slopesound_attempts
- 학습자 시도 기록 (탐색한 점, 소요 시간, 점수)

### mdl_slopesound_audio_events
- 오디오 재생 이벤트 로그 (분석용)

## 🎨 UI 특징

- **가상 스마트폰**: 우측 하단에 iPhone 스타일 프레임
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **다크 모드 지원**: CSS 변수로 테마 커스터마이징 가능
- **애니메이션**: 부드러운 사운드 인디케이터

## 🔐 보안 고려사항

- Moodle 세션 인증 사용
- SQL 인젝션 방지 (준비된 문장 사용)
- XSS 방지 (입력 검증)
- CORS 정책 준수

## 🐛 문제 해결

### 사운드가 재생되지 않을 때
- 브라우저의 자동재생 정책: 사용자 인터랙션 후 초기화됨
- Web Audio API 지원 확인 (Chrome, Firefox, Safari 최신 버전)

### Moodle API 연결 실패
- `webapp/js/moodle-api.js`의 `baseUrl` 확인
- Moodle 세션 쿠키 확인
- CORS 설정 확인

### 데이터베이스 연결 오류
- `config.php`의 데이터베이스 정보 확인
- MySQL 서비스 상태 확인
- 테이블 존재 여부 확인

## 📝 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여자

- 수학 엔진 개발
- 사운드 엔진 개발
- UI/UX 디자인
- Moodle 통합

## 📞 지원

- 이슈 리포트: GitHub Issues
- 문의: support@example.com

## 🗺️ 로드맵

- [ ] 다양한 사운드 매핑 옵션 (음색, 음량 등)
- [ ] 게임화 요소 (점수, 배지)
- [ ] 협업 모드 (멀티플레이어)
- [ ] AR/VR 지원
- [ ] 음성 안내 추가
- [ ] 오프라인 모드

## 🙏 감사의 말

Moodle 커뮤니티와 Web Audio API 기여자들에게 감사드립니다.
