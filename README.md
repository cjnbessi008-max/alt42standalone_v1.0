# Dot Collector - 부분 넓이 누적 학습 시스템

[![Moodle](https://img.shields.io/badge/Moodle-3.7+-orange.svg)](https://moodle.org/)
[![PHP](https://img.shields.io/badge/PHP-7.1.9+-blue.svg)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 개요

**Dot Collector**는 Moodle LMS와 연동되는 교육용 웹 애플리케이션으로, 학생들이 부분 넓이를 도트(점)로 시각화하며 넓이 개념을 학습할 수 있도록 돕습니다.

### 주요 특징

- 🎯 **Moodle 3.7 통합**: 완벽한 Moodle 플러그인으로 구현
- 📱 **가상 스마트폰 UI**: 우측 하단에 표시되는 직관적인 모바일 인터페이스
- 🔵 **도트 누적 시스템**: 클릭으로 도트를 배치하여 넓이를 시각화
- 📊 **실시간 피드백**: 즉각적인 정답/오답 피드백 제공
- 🎨 **다양한 도형 지원**: 직사각형, 삼각형, 원 등
- 💾 **학습 진행 추적**: 학생별 진행 상황 및 성취도 저장

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Moodle LMS (3.7+)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Dot Collector Plugin (PHP)             │   │
│  │  - Activity Module                               │   │
│  │  - API Endpoints                                 │   │
│  │  - Session Management                            │   │
│  └──────────────────┬──────────────────────────────┘   │
└────────────────────┼──────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐    ┌─────────▼──────────┐
│  Webapp (HTML/  │    │  External MySQL    │
│  CSS/JavaScript)│    │  Database (5.7+)   │
│                 │    │                    │
│  - Smartphone   │    │  - Questions       │
│    Frame UI     │    │  - Attempts        │
│  - Dot Canvas   │    │  - Dot Data        │
│  - API Client   │    │  - Progress        │
└─────────────────┘    └────────────────────┘
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── moodle_plugin/          # Moodle 플러그인
│   ├── version.php         # 플러그인 버전 정보
│   ├── lib.php             # 핵심 라이브러리 함수
│   ├── view.php            # 활동 뷰 페이지
│   ├── api.php             # REST API 엔드포인트
│   ├── mod_form.php        # 활동 설정 폼
│   ├── db/                 # 데이터베이스 정의
│   │   ├── install.xml     # Moodle 테이블 스키마
│   │   └── access.php      # 권한 정의
│   ├── lang/               # 언어 파일
│   │   └── en/
│   │       └── dotcollector.php
│   └── classes/            # PHP 클래스
│       └── event/
│           └── course_module_viewed.php
│
├── webapp/                 # 웹 애플리케이션
│   ├── index.html          # 메인 HTML
│   ├── css/
│   │   ├── smartphone.css  # 스마트폰 프레임 스타일
│   │   └── dotcollector.css # 앱 스타일
│   └── js/
│       ├── api.js          # API 통신 모듈
│       ├── dotcollector.js # 도트 누적 로직
│       └── app.js          # 메인 애플리케이션 로직
│
├── database/               # 데이터베이스
│   └── schema.sql          # MySQL 스키마 정의
│
├── docs/                   # 문서
│   ├── INSTALLATION.md     # 설치 가이드
│   └── USER_GUIDE.md       # 사용자 가이드
│
├── tasks/                  # 프로젝트 관리
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md               # 이 파일
```

## 빠른 시작

### 1. 필수 요구사항

- Moodle 3.7 이상
- PHP 7.1.9 이상
- MySQL 5.7 이상
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)

### 2. 설치

```bash
# 1. 외부 데이터베이스 생성
mysql -u root -p < database/schema.sql

# 2. Moodle 플러그인 설치
cp -r moodle_plugin /path/to/moodle/mod/dotcollector
cp -r webapp /path/to/moodle/mod/dotcollector/

# 3. 권한 설정
chown -R www-data:www-data /path/to/moodle/mod/dotcollector
chmod -R 755 /path/to/moodle/mod/dotcollector

# 4. Moodle 관리자 페이지에서 플러그인 설치 완료
```

자세한 설치 방법은 [INSTALLATION.md](docs/INSTALLATION.md)를 참조하세요.

### 3. 데이터베이스 설정

플러그인 설정에서 외부 데이터베이스 연결 정보를 입력합니다:

- **호스트**: localhost
- **데이터베이스**: dotcollector
- **사용자**: dotcollector_user
- **비밀번호**: your_secure_password

## 사용 방법

### 교사

1. Moodle 코스에 Dot Collector 활동 추가
2. 활동 이름과 설명 입력
3. 학생들이 접근할 수 있도록 공개

### 학생

1. Dot Collector 활동 클릭
2. 우측 하단 가상 스마트폰에서 문제 확인
3. 캔버스에 도트를 클릭하여 넓이 누적
4. 답안 제출 및 피드백 확인

자세한 사용 방법은 [USER_GUIDE.md](docs/USER_GUIDE.md)를 참조하세요.

## 기술 스택

### 백엔드
- **PHP 7.1.9**: Moodle 플러그인 및 API
- **MySQL 5.7**: 데이터 저장소
- **Moodle API**: 사용자 인증 및 세션 관리

### 프론트엔드
- **HTML5**: 구조
- **CSS3**: 스타일링 및 애니메이션
- **Vanilla JavaScript**: 로직 (프레임워크 없음)
- **Canvas API**: 도트 시각화

### 주요 라이브러리
- SVG (도형 시각화)
- Canvas 2D Context (도트 그리기)
- Fetch API (비동기 통신)

## 데이터베이스 스키마

### 주요 테이블

- **sessions**: 사용자 세션 관리
- **questions**: 문제 정보 (도형 타입, 정답, 메타데이터)
- **student_attempts**: 학생 답안 및 시도 기록
- **dot_accumulations**: 도트 배치 데이터 및 누적 넓이

자세한 스키마는 `database/schema.sql`을 참조하세요.

## API 엔드포인트

### 주요 API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api.php?action=ping` | GET | 서버 상태 확인 |
| `/api.php?action=get_questions` | POST | 문제 목록 조회 |
| `/api.php?action=get_question` | POST | 특정 문제 조회 |
| `/api.php?action=submit_answer` | POST | 답안 제출 |
| `/api.php?action=save_dots` | POST | 도트 데이터 저장 |
| `/api.php?action=get_progress` | POST | 학습 진행 상황 조회 |

모든 API는 세션 토큰을 통해 인증됩니다.

## 개발

### 로컬 개발 환경 설정

```bash
# Moodle 개발 환경 실행 (Docker 예시)
docker run -d -p 8080:80 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MOODLE_DATABASE_NAME=moodle \
  bitnami/moodle:3.7

# 플러그인 심볼릭 링크 생성 (개발 시)
ln -s /path/to/alt42standalone_v1.0/moodle_plugin \
      /path/to/moodle/mod/dotcollector
```

### 디버깅

```php
// lib.php에 디버그 로그 추가
debugging('Debug message', DEBUG_DEVELOPER);

// JavaScript 콘솔 로그
console.log('Debug info:', data);
```

## 테스트

### 기능 테스트 체크리스트

- [ ] Moodle 활동 생성
- [ ] 세션 토큰 생성 및 검증
- [ ] 문제 로드
- [ ] 도트 추가/제거
- [ ] 누적 넓이 계산
- [ ] 답안 제출
- [ ] 정답/오답 피드백
- [ ] 다음 문제 로드
- [ ] 진행 상황 저장
- [ ] 데이터베이스 연결

### 브라우저 호환성

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 기여

프로젝트 개선을 위한 기여를 환영합니다!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 크레딧

- **개발**: KAIST Touch Math Academy
- **디자인**: AI-Generated UI/UX
- **기획**: AI Education Pipeline Team

## 연락처

- **프로젝트**: Dot Collector
- **기관**: KAIST Touch Math Academy
- **이메일**: touchmath@kaist.ac.kr
- **웹사이트**: https://touchmath.kaist.ac.kr

## 버전 히스토리

- **v1.0.0** (2025-11-18)
  - 초기 릴리스
  - Moodle 3.7+ 지원
  - 기본 도트 누적 기능
  - 직사각형, 삼각형, 원 지원
  - 가상 스마트폰 UI

## 향후 계획

- [ ] 더 많은 도형 타입 지원 (다각형, 복합 도형)
- [ ] 힌트 시스템
- [ ] 게임화 요소 (배지, 리더보드)
- [ ] 다국어 지원 확대
- [ ] 학습 분석 대시보드
- [ ] AI 기반 맞춤형 문제 추천
- [ ] 오프라인 모드

---

**Made with ❤️ by KAIST Touch Math Academy**
