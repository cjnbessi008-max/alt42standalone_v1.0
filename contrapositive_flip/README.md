# Contrapositive Flip - 대우 학습 앱

논리학의 대우(contrapositive)를 자동으로 생성하고 시각적으로 뒤집어 보여주는 교육용 웹앱입니다.

## 📱 주요 기능

- **자동 대우 생성**: 논리 명제(P → Q)에서 대우(¬Q → ¬P)를 자동으로 생성
- **시각적 플립 애니메이션**: 카드를 뒤집으며 원명제와 대우를 비교
- **Moodle 3.7 연동**: Moodle LMS의 문제은행과 통합
- **모바일 친화적 UI**: 우측 하단 가상 스마트폰 화면에 최적화
- **학습 추적**: 학생의 뒤집기 횟수, 소요 시간, 이해도 추적
- **다국어 지원**: 한국어/영어 지원

## 🛠 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Animations**: CSS3 3D Transforms

## 📁 프로젝트 구조

```
contrapositive_flip/
├── moodle_plugin/              # Moodle 플러그인
│   ├── version.php             # 플러그인 버전 정보
│   ├── lib.php                 # 핵심 라이브러리 함수
│   └── contrapositive_generator.php  # 대우 생성 엔진
├── database/                   # 데이터베이스
│   └── schema.sql              # MySQL 스키마
├── api/                        # REST API
│   └── contrapositive_api.php  # API 엔드포인트
├── web_app/                    # 웹 애플리케이션
│   ├── index.html              # 메인 HTML
│   ├── css/
│   │   └── style.css           # 스타일시트
│   └── js/
│       └── app.js              # 앱 로직
└── docs/                       # 문서
    ├── SETUP.md                # 설치 가이드
    └── API.md                  # API 문서
```

## 🚀 설치 방법

### 1. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r contrapositive_flip/moodle_plugin /path/to/moodle/local/contrapositive

# Moodle 관리자 페이지에서 플러그인 설치 완료
# Site administration > Notifications
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# Moodle 데이터베이스 선택
USE moodle;

# 스키마 실행
SOURCE contrapositive_flip/database/schema.sql;
```

### 3. 웹 앱 배포

```bash
# Moodle 루트 디렉토리에 웹 앱 복사
cp -r contrapositive_flip/web_app /path/to/moodle/local/contrapositive/app
cp -r contrapositive_flip/api /path/to/moodle/local/contrapositive/api

# 권한 설정
chmod -R 755 /path/to/moodle/local/contrapositive
```

### 4. 웹 앱 접속

브라우저에서 다음 URL로 접속:

```
https://your-moodle-site.com/local/contrapositive/app/index.html
```

## 📖 사용 방법

### 교사용

1. **Moodle 문제 은행에서 논리 명제 문제 생성**
   - 명제를 "P → Q" 형식으로 작성
   - 예: "만약 x > 5이면, x > 3이다"

2. **Contrapositive Flip 앱 연동**
   - API를 통해 자동으로 대우 생성
   - 생성된 대우: "만약 x ≤ 3이면, x ≤ 5이다"

3. **학생 학습 분석**
   - 학생별 뒤집기 횟수, 소요 시간 확인
   - 이해도 평가 결과 확인

### 학생용

1. **학습 시작**
   - "학습 시작하기" 버튼 클릭

2. **원명제 확인**
   - 화면에 표시된 원명제(P → Q) 읽기

3. **카드 뒤집기**
   - 카드를 탭하여 대우(¬Q → ¬P) 확인

4. **이해도 체크**
   - "이해했나요?" 질문에 답변
   - 이해한 경우: 자신의 말로 설명 작성
   - 더 공부가 필요한 경우: 카드를 여러 번 뒤집어 복습

5. **다음 문제로 이동**
   - "다음 문제" 버튼으로 계속 학습

## 🎯 대우(Contrapositive)란?

논리학에서 대우는 명제를 논리적으로 동치인 형태로 변환한 것입니다.

**원명제**: P → Q (만약 P이면 Q이다)
**대우**: ¬Q → ¬P (만약 Q가 아니면 P도 아니다)

### 예시

| 원명제 | 대우 |
|--------|------|
| x > 5 → x > 3 | x ≤ 3 → x ≤ 5 |
| 정사각형 → 4개의 변 | 4개의 변이 아님 → 정사각형이 아님 |
| n이 짝수 → n²이 짝수 | n²이 홀수 → n이 홀수 |

## 📊 API 엔드포인트

### GET /api/contrapositive_api.php?action=get_question&id={id}
문제 조회

### POST /api/contrapositive_api.php?action=generate
새 대우 문제 생성

```json
{
  "original_antecedent": "x > 5",
  "original_consequent": "x > 3",
  "language": "ko",
  "difficulty_level": 1
}
```

### POST /api/contrapositive_api.php?action=record_attempt
학생 시도 기록

### POST /api/contrapositive_api.php?action=update_attempt
시도 정보 업데이트

### GET /api/contrapositive_api.php?action=get_analytics&question_id={id}
문제별 학습 분석 조회

## 🔧 설정

### 언어 변경
- UI 상단의 언어 토글 버튼 사용 (한국어/English)

### 난이도 조정
- API 요청 시 `difficulty_level` 파라미터 설정 (1-3)

### 부정어 패턴 커스터마이징
- `contrapositive_generator.php`의 `$korean_negation_patterns` 또는 `$english_negation_patterns` 수정

## 🐛 트러블슈팅

### 문제: 카드가 뒤집어지지 않음
- **해결**: 브라우저의 CSS 3D transform 지원 확인
- Chrome, Firefox, Safari 최신 버전 사용 권장

### 문제: API 연결 실패
- **해결**:
  - Moodle 로그인 상태 확인
  - API 경로가 올바른지 확인
  - CORS 설정 확인

### 문제: 대우 생성이 부정확함
- **해결**:
  - `contrapositive_generator.php`의 부정어 패턴 확인
  - 복잡한 명제는 수동으로 검증

## 📝 라이선스

GNU GPL v3 or later

## 👥 기여

KAIST Touch Math Academy © 2025

## 📧 문의

기술 지원: [support@kaist-touchmath.edu]
버그 리포트: [GitHub Issues](https://github.com/your-repo/contrapositive-flip/issues)

## 🔄 업데이트 내역

### v1.0.0 (2025-01-18)
- 초기 릴리스
- Moodle 3.7 통합
- 한국어/영어 지원
- 모바일 최적화 UI
- 카드 플립 애니메이션
- 학습 추적 기능
