# Instant Speed Ball - 순간변화율 시각화 학습 앱

순간변화율(미분)의 개념을 공의 운동으로 시각화하여 학습하는 웹 기반 교육 애플리케이션입니다.

## 📱 주요 기능

- **실시간 공 운동 시뮬레이션**: Canvas API를 사용한 부드러운 애니메이션
- **물리 엔진**: 등가속도 운동 방정식 기반 정확한 계산
- **실시간 그래프**: 속도-시간 그래프 실시간 표시
- **스마트폰 프레임**: 우측 하단에 가상 스마트폰 화면으로 표시
- **Moodle 연동**: LMS와 완벽하게 통합되는 활동 모듈
- **다양한 문제 유형**: 자유낙하, 위로 던진 공, 최고점, 아래로 던진 공 등

## 🎯 교육 목표

학생들이 다음을 학습할 수 있습니다:

- 순간변화율의 개념 이해
- 위치-시간-속도 관계 파악
- 미분의 물리적 의미 체험
- 그래프 해석 능력 향상

## 🏗️ 프로젝트 구조

```
instant-speed-ball/
├── webapp/                    # 독립 웹 애플리케이션
│   ├── index.html            # 메인 HTML
│   ├── css/
│   │   ├── smartphone.css    # 스마트폰 프레임 스타일
│   │   └── app.css          # 앱 메인 스타일
│   ├── js/
│   │   ├── ball-physics.js  # 물리 엔진
│   │   ├── graph.js         # 실시간 그래프
│   │   └── app.js           # 메인 애플리케이션 로직
│   └── api/
│       ├── config.php       # 데이터베이스 설정
│       ├── problem-loader.php    # 문제 로더 API
│       ├── record-attempt.php    # 답안 기록 API
│       └── list-problems.php     # 문제 목록 API
├── moodle-module/            # Moodle 3.7 활동 모듈
│   └── mod_instantspeedball/
│       ├── version.php
│       ├── lib.php
│       ├── view.php
│       ├── db/
│       │   └── install.xml
│       └── lang/
│           ├── en/
│           └── ko/
├── database/
│   └── schema.sql           # MySQL 5.7 스키마
└── README.md
```

## 💻 기술 스택

### 프론트엔드
- **HTML5 Canvas**: 공 애니메이션 및 그래프
- **Vanilla JavaScript**: 의존성 없는 순수 JS
- **CSS3**: 반응형 디자인 및 스마트폰 프레임

### 백엔드
- **PHP 7.1.9**: Moodle 3.7 호환
- **MySQL 5.7**: 데이터 저장
- **RESTful API**: JSON 기반 통신

### LMS 통합
- **Moodle 3.7**: 활동 모듈 형태로 통합

## 📦 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 (Moodle이 이미 있다면 생략)
CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용
mysql -u moodle_user -p moodle < database/schema.sql
```

### 2. 웹앱 설치 (독립 실행)

```bash
# 웹 서버 디렉토리에 복사
cp -r webapp /var/www/html/instant-speed-ball

# API 설정 파일 수정
nano /var/www/html/instant-speed-ball/api/config.php
# DB_HOST, DB_NAME, DB_USER, DB_PASS 수정

# 권한 설정
chown -R www-data:www-data /var/www/html/instant-speed-ball
chmod -R 755 /var/www/html/instant-speed-ball
```

브라우저에서 `http://your-server/instant-speed-ball` 접속

### 3. Moodle 모듈 설치

```bash
# Moodle 플러그인 디렉토리에 복사
cp -r moodle-module/mod_instantspeedball /path/to/moodle/mod/

# Moodle 관리자로 로그인 후 알림 페이지 방문
# Site administration → Notifications → Upgrade Moodle database now
```

**또는 Moodle UI를 통한 설치:**

1. Site administration → Plugins → Install plugins
2. ZIP 파일 업로드 (moodle-module을 ZIP으로 압축)
3. 설치 진행

### 4. 웹앱을 Moodle에 통합

```bash
# 웹앱을 Moodle 모듈 내부로 복사
cp -r webapp /path/to/moodle/mod/instantspeedball/

# 또는 심볼릭 링크 생성
ln -s /var/www/html/instant-speed-ball /path/to/moodle/mod/instantspeedball/webapp
```

## 🎮 사용 방법

### 독립 웹앱으로 사용

1. 브라우저에서 `index.html` 열기
2. URL 파라미터로 문제 선택: `?problem=1`
3. 시작 버튼 클릭하여 시뮬레이션 실행
4. 그래프와 메트릭 관찰
5. 답안 입력 및 제출

### Moodle 활동으로 사용

1. 코스에서 "활동 또는 리소스 추가" 클릭
2. "Instant Speed Ball" 선택
3. 활동 이름 및 설명 입력
4. 저장
5. 학생이 활동 클릭하여 실행

## 📊 문제 구조

### 데이터베이스 테이블: `isb_problems`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | INT | 문제 ID |
| `title` | VARCHAR(255) | 문제 제목 |
| `description` | TEXT | 문제 설명 |
| `initial_position` | DECIMAL(10,2) | 초기 위치 (m) |
| `initial_velocity` | DECIMAL(10,2) | 초기 속도 (m/s) |
| `acceleration` | DECIMAL(10,2) | 가속도 (m/s²) |
| `simulation_duration` | DECIMAL(10,2) | 시뮬레이션 시간 (초) |
| `question_type` | ENUM | 질문 유형 |
| `question_time` | DECIMAL(10,2) | 질문 시점 (초) |
| `correct_answer` | DECIMAL(10,2) | 정답 |
| `tolerance` | DECIMAL(10,2) | 오차 허용 범위 |

### 샘플 문제

1. **자유낙하 - 기본**: 높이 100m에서 공을 놓았을 때 2초 후 속도
2. **위로 던진 공**: 20m/s로 위로 던진 공의 1초 후 속도
3. **최고점에서의 속도**: 최고점에서의 순간속도 (0)
4. **아래로 던진 공**: 10m/s로 아래로 던진 공의 1초 후 속도
5. **자유 관찰**: 관찰 모드 (정답 없음)

## 🔧 API 엔드포인트

### GET `/api/problem-loader.php?id={problem_id}`
문제 데이터 조회

**응답 예시:**
```json
{
  "id": 1,
  "title": "자유낙하 - 기본",
  "description": "높이 100m에서 공을 가만히 놓았을 때...",
  "initial_position": 100.0,
  "initial_velocity": 0.0,
  "acceleration": -9.8,
  "simulation_duration": 10.0,
  "question_type": "velocity_at_time",
  "question_time": 2.0,
  "correct_answer": -19.6,
  "tolerance": 0.1
}
```

### POST `/api/record-attempt.php`
학생 답안 기록

**요청 예시:**
```json
{
  "problem_id": 1,
  "student_answer": -19.5,
  "is_correct": true,
  "time_spent": 45
}
```

### GET `/api/list-problems.php`
모든 문제 목록 조회

## 🎨 커스터마이징

### 새 문제 추가

```sql
INSERT INTO isb_problems
  (title, description, initial_position, initial_velocity, acceleration,
   simulation_duration, question_type, question_time, correct_answer, difficulty_level)
VALUES
  ('새 문제', '문제 설명', 50.0, 10.0, -9.8,
   10.0, 'velocity_at_time', 3.0, -19.4, 2);
```

### 스타일 변경

`webapp/css/app.css` 파일에서 다음을 수정:

- 색상 테마: `.app-header` 그라디언트
- 공 색상: `ball-physics.js`의 `this.ballColor`
- 폰트: `font-family` 속성

## 🧪 물리 공식

### 등가속도 운동

**위치:**
```
y(t) = y₀ + v₀t + ½at²
```

**속도 (순간변화율):**
```
v(t) = v₀ + at
```

**가속도:**
```
a = 상수 (일반적으로 -9.8 m/s²)
```

## 📱 브라우저 지원

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🔒 보안 고려사항

- ✅ PDO Prepared Statements (SQL Injection 방지)
- ✅ Input validation
- ✅ CORS 설정
- ✅ Moodle 인증 통합
- ⚠️ 프로덕션 환경에서는 `config.php`의 에러 출력 비활성화

## 📈 성능 최적화

- Canvas 애니메이션: 60 FPS 목표
- 데이터베이스 인덱스 활용
- 문제 데이터 캐싱 권장
- 정적 리소스 CDN 사용 권장

## 🐛 문제 해결

### 공이 표시되지 않을 때
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas 크기가 0이 아닌지 확인

### 데이터베이스 연결 오류
- `api/config.php`의 DB 설정 확인
- MySQL 서버 실행 상태 확인
- 사용자 권한 확인

### Moodle 통합 문제
- 플러그인 버전 확인 (Moodle 3.5+)
- 데이터베이스 테이블 생성 확인
- 웹앱 경로 확인

## 🤝 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📄 라이선스

GNU GPL v3 or later

## 👥 개발자

KAIST Touch Math Academy

## 📧 문의

- 기술 지원: support@example.com
- 교육 문의: education@example.com

---

**Version:** 1.0.0
**Last Updated:** 2025-01-18
