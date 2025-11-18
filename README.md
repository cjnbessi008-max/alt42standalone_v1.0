# 📚 Vector Star Map - 학습 별자리 시각화 시스템

> 벡터 끝점이 별자리처럼 연결되는 교육용 학습 경로 시각화 웹 애플리케이션

## 🌟 프로젝트 개요

**Vector Star Map**은 Moodle LMS와 연동하여 학습 개념을 시각적으로 표현하는 교육 시스템입니다. 각 학습 문제/개념을 벡터의 끝점(별)으로 표시하고, 관련된 개념들을 별자리의 선처럼 연결하여 직관적인 학습 경로를 제공합니다.

### 주요 특징

- ⭐ **벡터 별자리 시각화** - HTML5 Canvas 기반 실시간 렌더링
- 🔗 **개념 간 연결** - 선수학습, 관련 개념, 심화 개념을 선으로 표시
- 📊 **학습 진도 추적** - 학생의 학습 상태를 색상으로 구분
- 🎨 **애니메이션 효과** - 파티클 효과, 글로우 효과, 펄스 효과
- 📱 **모바일 UI** - 우측 하단 가상 스마트폰 화면에 표시
- 🔄 **Moodle 연동** - Moodle 3.7 Web Services API 호환

## 🛠️ 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7 (LMS 연동)

### 프론트엔드
- **HTML5 Canvas** - 벡터 시각화
- **JavaScript (ES6+)** - 애니메이션 엔진
- **CSS3** - 반응형 디자인

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── index.php                 # 메인 페이지
├── config/
│   ├── config.php           # 전역 설정
│   └── database.php         # 데이터베이스 연결 클래스
├── api/
│   ├── moodle_connector.php # Moodle API 커넥터
│   ├── get_problems.php     # 문제 데이터 조회 API
│   └── save_progress.php    # 학습 진도 저장 API
├── js/
│   ├── vector-star-map.js   # Vector Star Map 시각화 엔진
│   └── mobile-app.js        # 모바일 앱 컨트롤러
├── css/
│   └── styles.css           # 스타일시트
├── db/
│   └── schema.sql           # 데이터베이스 스키마
└── README.md
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성 및 테이블 생성
mysql -u root -p < db/schema.sql
```

### 2. 설정 파일 수정

`config/config.php` 파일을 열어 다음 항목을 수정하세요:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'vector_star_map');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle LMS Integration
define('MOODLE_URL', 'http://your-moodle-site.com/moodle');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

### 3. Moodle Web Service 설정

Moodle 관리자 페널에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
2. "웹 서비스 활성화" 체크
3. "REST 프로토콜 활성화" 체크
4. 웹 서비스 토큰 생성 및 `config.php`에 입력

### 4. 웹 서버 설정

```bash
# Apache를 사용하는 경우
# DocumentRoot를 프로젝트 디렉토리로 설정

# PHP 내장 서버로 테스트 (개발용)
php -S localhost:8000
```

### 5. 브라우저에서 접속

```
http://localhost:8000/index.php
```

## 📊 데이터베이스 스키마

### problems 테이블
학습 문제/개념 정보 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | Primary Key |
| moodle_id | INT | Moodle 문제 ID |
| course_id | INT | 코스 ID |
| title | VARCHAR(255) | 문제 제목 |
| vector_x, vector_y, vector_z | DECIMAL(10,6) | 벡터 좌표 (0~1 범위) |
| difficulty | INT(1-5) | 난이도 |
| problem_type | ENUM | 문제 유형 |

### constellations 테이블
개념 간 연결 정보 (별자리 선)

| 필드 | 타입 | 설명 |
|------|------|------|
| from_problem_id | INT | 시작 문제 ID |
| to_problem_id | INT | 끝 문제 ID |
| relationship_type | ENUM | 관계 유형 (prerequisite, related, advanced) |
| strength | DECIMAL(3,2) | 연결 강도 (0~1) |

### student_progress 테이블
학생 학습 진도 추적

| 필드 | 타입 | 설명 |
|------|------|------|
| student_id | INT | 학생 ID |
| problem_id | INT | 문제 ID |
| status | ENUM | 상태 (not_started, in_progress, completed, mastered) |
| score | DECIMAL(5,2) | 점수 (0~100) |
| attempts | INT | 시도 횟수 |

## 🎨 시각화 설명

### 별(Star)의 의미

- **색상**: 학습 상태 표시
  - 🔘 회색 (`#4a5568`) - 아직 시작 안함
  - 🟠 주황색 (`#f6ad55`) - 진행중
  - 🟢 초록색 (`#48bb78`) - 완료
  - 🔵 파란색 (`#4299e1`) - 마스터

- **글로우(Glow)**: 난이도 표시
  - 난이도 1 (쉬움) - 연한 초록색
  - 난이도 2 (보통) - 청록색
  - 난이도 3 (어려움) - 주황색
  - 난이도 4 (매우 어려움) - 빨간색
  - 난이도 5 (전문가) - 보라색

### 연결선(Constellation Line)

- **파란선 + 화살표** - 선수학습 관계 (prerequisite)
- **보라선** - 관련 개념 (related)
- **주황선** - 심화 개념 (advanced)
- **회색선** - 유사 개념 (similar)

## 🔌 API 엔드포인트

### GET `/api/get_problems.php`

문제 데이터 및 연결 정보 조회

**Parameters:**
- `course_id` (int) - 코스 ID
- `student_id` (int) - 학생 ID (선택)

**Response:**
```json
{
  "success": true,
  "data": {
    "problems": [...],
    "connections": [...],
    "metadata": {...}
  }
}
```

### POST `/api/save_progress.php`

학습 진도 저장

**Request Body:**
```json
{
  "student_id": 1,
  "problem_id": 1001,
  "status": "completed",
  "score": 95.5,
  "time_spent": 180
}
```

## 🎯 사용 방법

### 학생 사용자

1. **별자리 보기**: 우측 하단 모바일 화면에서 학습 별자리 확인
2. **별 클릭**: 학습하고 싶은 개념(별)을 클릭하여 상세 정보 확인
3. **학습 시작**: "시작하기" 버튼을 클릭하여 문제 풀이
4. **진도 확인**: 상단 통계 패널에서 진도율 확인

### 관리자

1. **문제 추가**: `db/schema.sql`의 INSERT 문 참고하여 problems 테이블에 추가
2. **연결 설정**: constellations 테이블에서 개념 간 관계 설정
3. **벡터 좌표**: vector_x, vector_y 값을 0~1 범위로 설정 (Canvas 크기에 매핑됨)

## 🔧 커스터마이징

### Canvas 크기 변경

`js/mobile-app.js`:
```javascript
this.starMap = new VectorStarMap('starMapCanvas', {
    width: 350,   // 너비
    height: 600,  // 높이
    // ...
});
```

### 애니메이션 설정

`js/vector-star-map.js`:
```javascript
this.config = {
    starRadius: 8,              // 별 크기
    starGlowRadius: 15,         // 글로우 반경
    connectionWidth: 2,         // 연결선 두께
    animationDuration: 1000,    // 애니메이션 지속시간 (ms)
    particleCount: 30,          // 파티클 수
    enableParticles: true,      // 파티클 효과 ON/OFF
    enableGlow: true            // 글로우 효과 ON/OFF
};
```

### 색상 테마 변경

`js/vector-star-map.js`:
```javascript
this.statusColors = {
    'not_started': '#4a5568',   // 회색
    'in_progress': '#f6ad55',   // 주황색
    'completed': '#48bb78',     // 초록색
    'mastered': '#4299e1'       // 파란색
};
```

## 🐛 트러블슈팅

### 문제: 별자리가 표시되지 않음

**해결:**
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. API 응답 확인: `http://localhost:8000/api/get_problems.php?course_id=101`
3. 데이터베이스에 샘플 데이터가 있는지 확인

### 문제: Moodle 연동 실패

**해결:**
1. Moodle 웹 서비스가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. CORS 설정 확인 (Moodle 서버에서 Cross-Origin 요청 허용)

### 문제: 데이터베이스 연결 오류

**해결:**
1. `config/config.php`의 DB 설정 확인
2. MySQL 서비스 실행 여부 확인
3. 사용자 권한 확인

## 📈 향후 개발 계획

- [ ] Moodle 플러그인 버전 개발
- [ ] 3D 벡터 시각화 (Three.js)
- [ ] AI 기반 학습 경로 추천
- [ ] 실시간 협업 학습 기능
- [ ] 모바일 네이티브 앱 (React Native)
- [ ] 학습 분석 대시보드

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 개발자

KAIST Touch Math Academy AI Education System Pipeline 프로젝트의 일부로 개발되었습니다.

## 📞 문의

문제가 발생하거나 제안 사항이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**Made with ❤️ for Better Education**
