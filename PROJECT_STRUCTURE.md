# 프로젝트 구조 (Project Structure)

```
alt42standalone_v1.0/
│
├── README.md                    # 프로젝트 개요 및 사용 방법
├── INSTALL.md                   # 설치 가이드
├── PROJECT_STRUCTURE.md         # 이 파일
│
├── database/                    # 데이터베이스 스키마 및 마이그레이션
│   └── schema.sql              # MySQL 5.7 데이터베이스 스키마
│
├── api/                        # PHP 백엔드 API
│   ├── config.php              # 데이터베이스 설정 및 공통 함수
│   ├── shapes.php              # 도형 CRUD API
│   └── preferences.php         # 사용자 설정 API
│
├── public/                     # 프론트엔드 웹앱 (Document Root)
│   ├── index.html              # 메인 HTML 페이지
│   ├── styles.css              # UI 스타일시트
│   ├── shape-engine.js         # 도형 그리기 엔진 (Canvas)
│   ├── app.js                  # 애플리케이션 메인 로직
│   └── .htaccess               # Apache 설정
│
├── moodle/                     # Moodle 3.7 통합 모듈
│   └── mod/
│       └── shapeguide/
│           ├── version.php             # 플러그인 버전 정보
│           ├── mod_form.php           # 활동 설정 폼
│           ├── view.php               # 메인 뷰 페이지
│           ├── lib.php                # 핵심 라이브러리 함수
│           ├── db/
│           │   ├── install.xml        # 데이터베이스 스키마
│           │   └── access.php         # 권한 정의
│           └── lang/
│               ├── en/
│               │   └── shapeguide.php # 영어 언어팩
│               └── ko/
│                   └── shapeguide.php # 한국어 언어팩
│
└── tasks/                      # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 주요 컴포넌트 설명

### 1. Database Layer (데이터베이스)

**파일**: `database/schema.sql`

**테이블**:
- `shapes`: 도형 정보 (꼭짓점 좌표, 유형, 사용자 ID)
- `guide_lines`: 보조선 정보 (평행선, 수선)
- `user_preferences`: 사용자 설정 (색상, 표시 옵션)
- `activity_logs`: 활동 로그

### 2. Backend API (백엔드)

**디렉토리**: `api/`

**주요 파일**:
- `config.php`:
  - MySQL PDO 연결 관리
  - CORS 헤더 설정
  - 공통 유틸리티 함수

- `shapes.php`:
  - `GET`: 도형 목록/상세 조회
  - `POST`: 새 도형 생성 + 보조선 자동 생성
  - `PUT`: 도형 수정
  - `DELETE`: 도형 삭제

- `preferences.php`:
  - `GET`: 사용자 설정 조회
  - `PUT`: 사용자 설정 업데이트

### 3. Frontend (프론트엔드)

**디렉토리**: `public/`

**주요 파일**:

#### `index.html`
- 메인 UI 구조
- 제어판 (도형 선택, 체크박스)
- 데스크톱 캔버스 (도형 그리기)
- 스마트폰 뷰 (우측 하단 고정)

#### `styles.css`
- 반응형 레이아웃
- 스마트폰 프레임 스타일링
- 그라디언트 배경
- 모바일 뷰포트 대응

#### `shape-engine.js`
- `ShapeEngine` 클래스: 도형 렌더링 엔진
- Canvas API 기반 그리기
- 평행선/수선 자동 생성 알고리즘
- `GeometryUtils`: 기하학 유틸리티 함수

**주요 메서드**:
```javascript
class ShapeEngine {
    generateGuideLines()        // 보조선 자동 생성
    drawShape()                 // 도형 그리기
    drawGuideLines()            // 보조선 그리기
    createPredefinedShape()     // 사전 정의 도형 생성
    scaleToFit()               // 캔버스에 맞게 크기 조정
}
```

#### `app.js`
- 사용자 인터랙션 처리
- API 통신 (fetch)
- 이벤트 리스너 설정
- 도형 저장/불러오기
- Moodle 통합 함수

### 4. Moodle Integration (Moodle 연동)

**디렉토리**: `moodle/mod/shapeguide/`

**주요 파일**:

#### `version.php`
```php
$plugin->version   = 2025111800;
$plugin->requires  = 2019052000;  // Moodle 3.7
$plugin->component = 'mod_shapeguide';
```

#### `mod_form.php`
- 활동 추가/수정 폼
- 설정 필드: 평행선/수선 자동 생성, 색상, 라벨 등

#### `view.php`
- 학생/교사용 뷰 페이지
- 웹앱을 iframe으로 임베드
- Moodle 컨텍스트 전달 (코스 ID, 사용자 ID)

#### `lib.php`
- `shapeguide_add_instance()`: 활동 생성
- `shapeguide_update_instance()`: 활동 수정
- `shapeguide_delete_instance()`: 활동 삭제

#### `db/install.xml`
- Moodle 데이터베이스 스키마 정의
- `mdl_shapeguide` 테이블 생성

#### `db/access.php`
- 권한 정의:
  - `mod/shapeguide:addinstance`: 활동 추가
  - `mod/shapeguide:view`: 활동 보기
  - `mod/shapeguide:submit`: 도형 제출

## 데이터 흐름 (Data Flow)

### 도형 생성 프로세스

```
1. 사용자가 캔버스 클릭
   ↓
2. app.js - handleCanvasClick()
   ↓
3. ShapeEngine.createPredefinedShape()
   ↓
4. ShapeEngine.generateGuideLines() - 보조선 자동 생성
   ↓
5. ShapeEngine.render() - 캔버스에 그리기
   ↓
6. syncToMobile() - 모바일 뷰 동기화
   ↓
7. 사용자가 "저장" 클릭
   ↓
8. app.js - saveShape()
   ↓
9. POST /api/shapes.php
   ↓
10. MySQL INSERT (shapes, guide_lines)
    ↓
11. 성공 응답 및 UI 업데이트
```

### 보조선 생성 알고리즘

```javascript
// 각 변 (edge)에 대해
for each edge (p1, p2):
    // 1. 변의 방향 벡터 계산
    dx = p2.x - p1.x
    dy = p2.y - p1.y

    // 2. 정규화
    length = sqrt(dx² + dy²)
    ux = dx / length
    uy = dy / length

    // 3. 수직 벡터 계산 (90도 회전)
    perpX = -uy
    perpY = ux

    // 4. 평행선 생성 (offset만큼 떨어진 위치)
    parallelStart = p1 + perp × offset
    parallelEnd = p2 + perp × offset

    // 5. 수선 생성 (꼭짓점에서 수직)
    perpStart = p1 - perp × length/2
    perpEnd = p1 + perp × length/2
```

## API 엔드포인트 상세

### POST /api/shapes.php

**Request Body**:
```json
{
    "shape_name": "삼각형 1",
    "shape_type": "triangle",
    "vertices": [
        {"x": 100, "y": 100},
        {"x": 200, "y": 100},
        {"x": 150, "y": 200}
    ],
    "moodle_course_id": 5,
    "moodle_activity_id": 23
}
```

**Response**:
```json
{
    "success": true,
    "shape_id": 42,
    "guide_lines_generated": 6
}
```

**자동 생성되는 보조선**:
- 평행선 3개 (각 변마다 1개)
- 수선 3개 (각 꼭짓점마다 1개)

## 설정 파일

### `api/config.php`

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_guide_lines');
define('DB_USER', 'root');
define('DB_PASS', '');

// Moodle 연동
define('MOODLE_DIR', '/path/to/moodle');

// CORS
define('ALLOWED_ORIGINS', '*');
```

### `.htaccess`

```apache
# CORS 허용
Header set Access-Control-Allow-Origin "*"

# Gzip 압축
AddOutputFilterByType DEFLATE text/css application/javascript

# 캐시 제어
ExpiresByType text/css "access plus 1 week"
```

## 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: HTML 출력 시 이스케이핑
3. **CSRF 방지**: Moodle 세션 토큰 사용
4. **파일 접근 제어**: `.htaccess`로 숨김 파일 보호
5. **권한 관리**: Moodle 권한 시스템 통합

## 성능 최적화

1. **데이터베이스 인덱스**: user_id, shape_id 컬럼
2. **JSON 필드**: 복잡한 데이터 구조 효율적 저장
3. **Canvas 최적화**: requestAnimationFrame 사용 가능
4. **Gzip 압축**: JavaScript/CSS 파일 압축 전송
5. **브라우저 캐싱**: static 파일 장기 캐시

## 확장 가능성

### 향후 추가 가능 기능

1. **더 많은 도형 타입**: 원, 타원, 곡선
2. **각도 측정**: 내각/외각 자동 계산 표시
3. **거리 측정**: 변의 길이 표시
4. **애니메이션**: 보조선 생성 과정 애니메이션
5. **내보내기**: PNG/SVG/PDF 내보내기
6. **협업 모드**: 실시간 공동 편집 (WebSocket)
7. **AI 도형 인식**: 손으로 그린 도형 자동 인식

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

문서 작성일: 2025-11-18
버전: 1.0
