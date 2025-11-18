# 개념-문제 매칭 시각화 시스템

Moodle LMS와 연동하여 학습 개념과 문제 간의 관계를 시각적으로 표현하는 웹 애플리케이션입니다.

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 및 설정](#설치-및-설정)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)
- [문제 해결](#문제-해결)

## 프로젝트 개요

이 시스템은 Moodle 3.7 LMS와 연동하여 학습 개념(Concept)과 문제(Problem) 간의 관계를 자동으로 추출하고 인터랙티브한 그래프로 시각화합니다. 교육자와 학습자가 학습 구조를 직관적으로 이해할 수 있도록 돕습니다.

### 핵심 기능

- **Moodle LMS 연동**: Moodle 데이터베이스에서 문제 및 카테고리 정보 자동 동기화
- **개념-문제 매칭**: 자동 알고리즘을 통한 개념과 문제 간 연관 관계 분석
- **인터랙티브 시각화**: D3.js 기반 동적 그래프 렌더링
- **학생 진도 추적**: 개념별 학습 성취도 및 진도 분석
- **문제 추천 시스템**: 학생의 약점 개념 기반 맞춤형 문제 추천

## 주요 기능

### 1. 시각화 기능
- 🌐 **인터랙티브 그래프**: 개념과 문제를 노드로, 관계를 엣지로 표현
- 🔍 **줌 & 팬**: 확대/축소 및 드래그로 그래프 탐색
- 🎯 **노드 선택**: 개별 개념/문제 클릭 시 상세 정보 표시
- 🎨 **시각적 구분**: 개념(녹색), 문제(파란색) 색상으로 구분

### 2. Moodle 연동
- 📚 **카테고리 동기화**: Moodle 문제 카테고리를 개념으로 변환
- 📝 **문제 동기화**: Moodle 문제 데이터 자동 가져오기
- 📊 **진도 동기화**: 학생별 문제 풀이 이력 및 성취도 추적

### 3. 분석 기능
- 📈 **성취도 분석**: 개념별 학생 마스터리 레벨 추적
- 🎯 **약점 파악**: 낮은 성취도 개념 자동 식별
- 💡 **문제 추천**: 개인 맞춤형 학습 문제 제안

## 기술 스택

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터 저장 및 Moodle DB 연동
- **PDO**: 안전한 데이터베이스 접근

### Frontend
- **HTML5 / CSS3**: 사용자 인터페이스
- **JavaScript (ES6+)**: 클라이언트 로직
- **D3.js v7**: 데이터 시각화
- **jQuery 3.6**: DOM 조작

### Integration
- **Moodle 3.7**: LMS 플랫폼
- **REST API**: 프론트엔드-백엔드 통신

## 시스템 요구사항

### 서버 환경
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx
- Moodle 3.7 (선택적)

### 클라이언트 (브라우저)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 설치 및 설정

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE concept_problem_matching CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용
mysql -u root -p concept_problem_matching < src/database/schema.sql
```

### 3. 설정 파일 수정

`config/config.php` 파일을 환경에 맞게 수정:

```php
// 메인 DB 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'concept_problem_matching');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle DB 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /

# API 라우팅
RewriteRule ^api/(.*)$ src/backend/api/api.php/$1 [L,QSA]

# 정적 파일 허용
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ src/frontend/index.html [L]
```

#### Nginx

```nginx
location /api/ {
    rewrite ^/api/(.*)$ /src/backend/api/api.php/$1 last;
}

location / {
    try_files $uri $uri/ /src/frontend/index.html;
}
```

### 5. 권한 설정

```bash
# 로그 디렉토리 쓰기 권한
mkdir -p logs
chmod 755 logs
```

## 사용 방법

### 1. 웹 인터페이스 접속

브라우저에서 `http://localhost/concept-matching` (또는 설정된 URL) 접속

### 2. Moodle 데이터 동기화

1. 상단 툴바에서 **"🔄 Moodle 동기화"** 버튼 클릭
2. 동기화 완료 후 그래프가 자동으로 렌더링됨

### 3. 그래프 탐색

- **줌**: 마우스 휠 또는 우측 +/- 버튼
- **팬**: 그래프 배경 드래그
- **노드 선택**: 개념/문제 노드 클릭하여 상세 정보 확인
- **노드 이동**: 노드를 드래그하여 위치 조정

### 4. 필터링

- **카테고리 필터**: 특정 주제(분수, 소수 등)만 표시
- **난이도 필터**: 초급/중급/고급 문제 선택적 표시

### 5. 학생 진도 조회

1. 하단 패널에서 학생 ID 입력
2. **"진도 불러오기"** 버튼 클릭
3. 개념별 성취도 및 통계 확인

## API 문서

### Base URL
```
/src/backend/api/api.php
```

### 엔드포인트

#### 개념 (Concepts)

```
GET /concepts
GET /concepts/{id}
GET /concepts/{id}/problems?include_related=true
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "분수의 개념",
      "category": "수학-분수",
      "difficulty_level": "beginner"
    }
  ]
}
```

#### 문제 (Problems)

```
GET /problems
GET /problems/{id}
GET /problems/{id}/concepts
```

#### 그래프 데이터

```
GET /graph?category=수학-분수&difficulty_level=beginner
```

**응답 구조**:
```json
{
  "success": true,
  "data": {
    "nodes": {
      "concepts": [...],
      "problems": [...]
    },
    "edges": [...],
    "statistics": {
      "total_concepts": 5,
      "total_problems": 10,
      "total_mappings": 15
    }
  }
}
```

#### 학생 진도

```
GET /progress/{student_id}?concept_id={concept_id}
```

#### Moodle 동기화

```
POST /sync/concepts
POST /sync/problems
POST /sync/progress
POST /sync/all
```

#### 문제 추천

```
GET /recommendations/{student_id}?limit=10
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   └── config.php              # 설정 파일
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   └── api.php        # REST API 엔드포인트
│   │   ├── models/
│   │   │   ├── ConceptProblemModel.php  # 데이터 모델
│   │   │   └── MoodleIntegration.php    # Moodle 연동
│   │   └── utils/
│   │       ├── Database.php    # DB 연결 관리
│   │       └── Logger.php      # 로깅 유틸리티
│   ├── database/
│   │   └── schema.sql          # DB 스키마
│   └── frontend/
│       ├── index.html          # 메인 페이지
│       ├── css/
│       │   └── style.css       # 스타일시트
│       └── js/
│           ├── app.js          # 메인 앱 로직
│           ├── api.js          # API 통신
│           └── visualization.js # D3.js 시각화
├── logs/                       # 로그 파일 (자동 생성)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 데이터베이스 스키마

### 주요 테이블

1. **concepts**: 학습 개념 정보
2. **problems**: 문제 정보
3. **concept_problem_mapping**: 개념-문제 매칭 관계
4. **student_progress**: 학생 학습 진도
5. **concept_prerequisites**: 개념 선수 관계
6. **moodle_sync_log**: Moodle 동기화 로그

상세 스키마는 `src/database/schema.sql` 참조

## 문제 해결

### Moodle 연결 실패

**증상**: "Moodle database connection failed" 오류

**해결**:
1. `config/config.php`에서 Moodle DB 설정 확인
2. MySQL 사용자 권한 확인
3. Moodle 테이블 접두사(`mdl_`) 확인

### 그래프가 표시되지 않음

**해결**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. D3.js 라이브러리 로드 확인
3. API 응답 확인 (개발자 도구 Network 탭)
4. 샘플 데이터로 테스트 (index.html에서 제공)

### API 호출 실패

**해결**:
1. 웹 서버 rewrite 규칙 확인
2. PHP 에러 로그 확인 (`logs/` 디렉토리)
3. `config/config.php`에서 `DEBUG_MODE = true` 설정
4. 데이터베이스 연결 확인

### 성능 문제

**대용량 데이터 처리**:
- 그래프 노드 수 제한 (`GRAPH_MAX_NODES` 설정)
- 필터 사용으로 데이터 범위 축소
- 데이터베이스 인덱스 최적화

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `src/backend/api/api.php`에 라우팅 추가
2. `src/backend/models/`에 비즈니스 로직 구현
3. `src/frontend/js/api.js`에 클라이언트 함수 추가

### 시각화 커스터마이징

`src/frontend/js/visualization.js`의 `GraphVisualization` 클래스 수정:
- 노드 크기/색상: `renderGraph()` 메서드
- 레이아웃 알고리즘: `simulation` 설정
- 인터랙션: 이벤트 핸들러 수정

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해 주세요.

## 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일 (`logs/` 디렉토리)
2. 브라우저 개발자 도구 콘솔
3. MySQL 에러 로그
4. PHP 에러 로그

---

**개발**: AI Education System Pipeline
**버전**: 1.0.0
**마지막 업데이트**: 2025-11-18
