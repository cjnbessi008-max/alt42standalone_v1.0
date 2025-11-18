# Shape Morph Animation System

## 개요

Moodle LMS와 연동하여 학습 개념의 전이를 시각적으로 표현하는 Shape Morph 애니메이션 시스템입니다.

## 주요 기능

- 🎨 **실시간 형상 변환**: 수학 개념을 부드러운 애니메이션으로 시각화
- 📱 **모바일 디스플레이**: 우측 하단 스마트폰 프레임 형태로 표시
- 🔗 **Moodle 연동**: MySQL 5.7, PHP 7.1.9, Moodle 3.7 지원
- 🎯 **개념 전이 시각화**: 학습 진행에 따른 개념 변화 표현

## 기술 스택

### Frontend
- React 18 + TypeScript
- Canvas API (애니메이션 렌더링)
- Vite (빌드 도구)

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7 API

## 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 개발 서버 시작

\`\`\`bash
npm run dev
\`\`\`

### 3. 빌드

\`\`\`bash
npm run build
\`\`\`

### 4. Moodle 플러그인 설치

\`\`\`bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성
mkdir -p local/shape_morph

# 파일 복사
cp -r src/backend/moodle-integration/* local/shape_morph/

# 데이터베이스 스키마 적용
mysql -u moodle_user -p moodle_db < src/backend/moodle-integration/db/schema.sql
\`\`\`

### 5. Moodle 테마에 통합

\`\`\`php
// theme/yourtheme/layout/includes/footer.php
<script src="/local/shape_morph/dist/shape-morph.js"></script>
<link rel="stylesheet" href="/local/shape_morph/dist/shape-morph.css">
\`\`\`

## 프로젝트 구조

\`\`\`
alt42standalone_v1.0/
├── src/
│   ├── backend/                    # PHP Backend
│   │   ├── moodle-integration/
│   │   │   ├── api/               # REST API
│   │   │   ├── db/                # DB Schema
│   │   │   └── config/            # Configuration
│   │   └── shape-morph/           # Concept Analysis
│   └── frontend/                   # React Frontend
│       ├── components/
│       │   ├── SmartphoneFrame/   # Mobile Frame UI
│       │   ├── ShapeMorphCanvas/  # Animation Canvas
│       │   └── ConceptTransition/ # Transition Control
│       ├── services/              # API Clients
│       ├── utils/                 # Utilities
│       └── types/                 # TypeScript Types
├── docs/                          # Documentation
├── package.json
└── README.md
\`\`\`

## API 엔드포인트

### 문제 정보 조회
\`\`\`
GET /local/shape_morph/api/problem-provider.php?action=get_problem_concept&questionid={id}
\`\`\`

### 현재 개념 조회
\`\`\`
GET /local/shape_morph/api/problem-provider.php?action=get_current_concept&courseid={id}
\`\`\`

### 진행 상황 업데이트
\`\`\`
POST /local/shape_morph/api/problem-provider.php?action=update_progress
Body: { conceptid: number }
\`\`\`

## 개발 가이드

자세한 기술 사양은 [docs/shape-morph-animation-spec.md](docs/shape-morph-animation-spec.md)를 참조하세요.

## 라이선스

MIT License

## 작성자

KAIST Touch Math Academy
