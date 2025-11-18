# Reflection Mode 📱

**y=x 기준 대칭 시각화 도구 - Moodle LMS 연동**

수학 교육용 웹 애플리케이션으로, y=x 선을 기준으로 도형을 접었을 때 겹치는 부분을 시각화합니다. Moodle 3.7과 완벽하게 통합되며, 우측 하단에 표시되는 가상 스마트폰 화면에서 작동합니다.

![Reflection Mode Demo](docs/demo.gif)

## ✨ 주요 기능

### 📐 수학적 시각화
- **y=x 대칭 변환**: 실시간 좌표 변환 (x, y) → (y, x)
- **겹침 영역 계산**: 원본과 대칭 도형의 교집합 면적 자동 계산
- **다양한 도형 지원**: 다각형, 원, 삼각형, 사각형, 사용자 정의 도형

### 📱 스마트폰 시뮬레이터
- **가상 화면**: 우측 하단에 고정된 스마트폰 프레임
- **터치 인터페이스**: 모바일 친화적 터치 제스처 지원
- **반응형 디자인**: 다양한 화면 크기 자동 대응

### 🎓 교육용 기능
- **단계별 힌트**: 학습자 수준별 맞춤 힌트 제공
- **실시간 피드백**: 즉각적인 정오답 판정
- **진행 상황 추적**: 학생별 학습 통계 및 분석
- **애니메이션**: 대칭 과정 애니메이션으로 개념 이해 향상

### 🔗 Moodle 연동
- **LTI 1.1/1.3 지원**: 표준 LTI 프로토콜
- **성적 자동 동기화**: Moodle 성적부에 자동 반영
- **SSO 인증**: Moodle 계정으로 자동 로그인
- **과제 통합**: Moodle 과제로 직접 추가 가능

## 🚀 빠른 시작

### 필수 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+

### 설치 방법

#### 1. 파일 복사
```bash
# 웹 서버 디렉토리에 복사
cp -r reflection-mode /var/www/html/
cd /var/www/html/reflection-mode
```

#### 2. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 스키마 실행
source database/schema.sql
```

#### 3. 환경 설정
```bash
# .env 파일 생성
cp .env.example .env

# 설정 편집
nano .env
```

필수 설정 항목:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `LTI_CONSUMER_KEY`, `LTI_CONSUMER_SECRET`

#### 4. 권한 설정
```bash
# 파일 권한 설정
chmod -R 755 /var/www/html/reflection-mode
chown -R www-data:www-data /var/www/html/reflection-mode

# 로그 디렉토리 생성
mkdir -p /var/log/reflection-mode
chown www-data:www-data /var/log/reflection-mode
```

#### 5. Moodle 설정

**a. LTI 도구 등록**
1. 사이트 관리 → 플러그인 → 활동 모듈 → External tool
2. "도구 관리" 클릭
3. "수동으로 도구 구성" 클릭

**b. 설정 입력**
```
도구 이름: Reflection Mode
도구 URL: https://yourdomain.com/reflection-mode/api/moodle-lti.php
Consumer key: reflection_mode_key (또는 .env의 값)
Shared secret: (LTI_CONSUMER_SECRET 값)
LTI version: LTI 1.1
```

**c. 고급 설정**
- ✅ 성적 동기화 (Grade passback) 활성화
- ✅ 회원 정보 공유
- ✅ 이메일 공유
- ✅ 이름 공유

**d. 코스에 추가**
1. 코스 편집 모드 활성화
2. "활동 또는 리소스 추가"
3. "External tool" 선택
4. "Reflection Mode" 선택

## 📚 사용 방법

### 학생용

#### 1. 문제 접속
- Moodle 코스에서 Reflection Mode 활동 클릭
- 자동으로 스마트폰 화면에 문제 표시

#### 2. 도형 그리기
- **터치/클릭**: 캔버스에 점 추가
- **드래그**: 점 위치 이동
- **미리 정의된 도형**: "도형 그리기" 버튼으로 샘플 생성

#### 3. 시각화 옵션
- ☑️ **원본 도형 표시**: 원본 도형 보기/숨기기
- ☑️ **대칭 도형 표시**: y=x 대칭 도형 보기/숨기기
- ☑️ **겹치는 부분 강조**: 교집합 영역 강조
- ☑️ **y=x 축 표시**: 대칭축 보기/숨기기
- ☑️ **격자 표시**: 좌표 격자 보기/숨기기

#### 4. 분석 결과 확인
- **원본 면적**: 원본 도형의 넓이
- **겹치는 면적**: 교집합 넓이
- **겹침 비율**: 겹치는 부분의 비율 (%)

#### 5. 답안 제출
- 계산 완료 후 "제출" 버튼 클릭
- 결과가 자동으로 Moodle 성적부에 반영

### 교사용

#### 1. 문제 생성
```sql
INSERT INTO problems (
    title, description, shape_type, shape_data, difficulty, tags
) VALUES (
    '정삼각형 대칭',
    '정삼각형을 y=x로 대칭시켰을 때 겹치는 면적을 구하세요.',
    'triangle',
    '{"points": [{"x": 0, "y": 4}, {"x": -3, "y": -2}, {"x": 3, "y": -2}]}',
    'medium',
    '기하학,대칭,삼각형'
);
```

#### 2. 문제 관리
- MySQL 데이터베이스에서 직접 관리
- 또는 관리자 대시보드 사용 (별도 개발 필요)

#### 3. 통계 확인
```sql
-- 문제별 통계
SELECT * FROM problem_statistics WHERE id = 1;

-- 학생별 진행 상황
SELECT * FROM student_progress WHERE moodle_user_id = 123;
```

## 🎨 사용자 정의

### 커스텀 CSS
```css
/* assets/css/custom.css */

/* 스마트폰 프레임 위치 변경 */
.smartphone-container {
    bottom: 10px;
    right: 10px;
}

/* 색상 테마 변경 */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --overlap-color: #ff6347;
}
```

### 커스텀 도형 추가
```javascript
// assets/js/custom-shapes.js

reflectionEngine.addCustomShape('hexagon', [
    { x: 2, y: 0 },
    { x: 1, y: 1.732 },
    { x: -1, y: 1.732 },
    { x: -2, y: 0 },
    { x: -1, y: -1.732 },
    { x: 1, y: -1.732 }
]);
```

## 🔧 API 문서

### 성적 전송 API

**Endpoint**: `/api/moodle-lti.php`

**Method**: POST

**Parameters**:
```json
{
    "action": "send_grade",
    "session_token": "abc123...",
    "score": 85.5
}
```

**Response**:
```json
{
    "success": true
}
```

### 문제 데이터 로드

**Endpoint**: `/public/index.php`

**Parameters**:
- `problem_id`: 문제 ID (integer)
- `session`: LTI 세션 토큰 (string)

## 📊 데이터베이스 스키마

### 주요 테이블

#### `problems` - 문제 정의
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 문제 ID |
| title | VARCHAR(255) | 문제 제목 |
| shape_data | JSON | 도형 좌표 데이터 |
| difficulty | ENUM | 난이도 (easy/medium/hard) |

#### `attempts` - 학생 제출
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 시도 ID |
| problem_id | INT | 문제 ID |
| moodle_user_id | INT | 학생 ID |
| score | DECIMAL | 점수 (0-100) |
| is_correct | TINYINT | 정답 여부 |

#### `lti_sessions` - LTI 세션
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 세션 ID |
| session_token | VARCHAR(64) | 세션 토큰 |
| moodle_user_id | INT | 사용자 ID |
| expires_at | TIMESTAMP | 만료 시간 |

자세한 스키마는 `database/schema.sql` 참조

## 🧪 테스트

### 수동 테스트
```bash
# 웹 브라우저에서 접속
https://yourdomain.com/reflection-mode/public/index.php

# LTI 통합 테스트
https://yourdomain.com/reflection-mode/api/moodle-lti.php
```

### 샘플 문제 확인
데이터베이스 설치 시 3개의 샘플 문제가 자동으로 생성됩니다:
1. 삼각형의 y=x 대칭 (난이도: 쉬움)
2. 정사각형의 대칭 (난이도: 쉬움)
3. 복잡한 다각형 (난이도: 중간)

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| Ctrl/Cmd + D | 도형 그리기 |
| Ctrl/Cmd + Z | 캔버스 지우기 |
| Ctrl/Cmd + R | 초기화 |
| Ctrl/Cmd + E | 이미지 저장 |
| Space | 애니메이션 토글 |
| G | 격자 토글 |
| A | 축 토글 |
| O | 겹침 토글 |

## 🐛 문제 해결

### 문제: LTI 연결 실패
**해결**:
1. Consumer Key와 Secret 확인
2. Moodle 도구 URL 확인
3. PHP 오류 로그 확인: `/var/log/apache2/error.log`

### 문제: 데이터베이스 연결 오류
**해결**:
```bash
# MySQL 서비스 확인
systemctl status mysql

# 권한 확인
GRANT ALL PRIVILEGES ON reflection_mode.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
```

### 문제: 스마트폰 화면이 표시되지 않음
**해결**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일 로드 확인
3. 화면 크기 조정 (최소 1400px 너비 권장)

### 문제: 성적이 Moodle에 전송되지 않음
**해결**:
1. Grade passback 설정 확인
2. `outcome_service_url` 값 확인
3. Moodle 로그 확인: 사이트 관리 → 보고서 → 로그

## 📦 프로젝트 구조

```
reflection-mode/
├── public/
│   └── index.php           # 메인 애플리케이션
├── assets/
│   ├── css/
│   │   ├── smartphone.css  # 스마트폰 UI 스타일
│   │   └── reflection.css  # 대칭 시각화 스타일
│   └── js/
│       ├── reflection-engine.js  # 대칭 계산 엔진
│       └── smartphone-app.js     # UI 컨트롤러
├── api/
│   └── moodle-lti.php      # LTI 통합 핸들러
├── config/
│   └── database.php        # 데이터베이스 설정
├── database/
│   └── schema.sql          # 데이터베이스 스키마
├── .env.example            # 환경 설정 템플릿
└── README.md               # 이 파일
```

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Canvas API
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Integration**: LTI 1.1/1.3, OAuth 1.0
- **Moodle**: 3.7 (호환)

## 🔐 보안

- OAuth 1.0 서명 검증
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (htmlspecialchars)
- CSRF 토큰 (세션 기반)
- 세션 타임아웃 (1시간)

## 📈 향후 계획

- [ ] 관리자 대시보드 개발
- [ ] 다국어 지원 (영어, 한국어)
- [ ] 실시간 협업 모드
- [ ] 3D 도형 대칭 시각화
- [ ] 모바일 앱 (React Native)
- [ ] AI 기반 힌트 생성
- [ ] Canvas → Blackboard 연동

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📄 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy Team

## 📞 지원

- **이메일**: support@example.com
- **문서**: https://docs.example.com/reflection-mode
- **이슈 트래커**: https://github.com/example/reflection-mode/issues

---

**Powered by Claude Code** 🤖 | Made with ❤️ for Math Education
