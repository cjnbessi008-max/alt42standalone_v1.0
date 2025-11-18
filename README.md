# LMS 키워드 버블 시각화 시스템

LMS(Learning Management System)의 문제 내용에서 핵심 키워드를 자동으로 추출하고, 시각적인 버블 형태로 표현하는 웹 애플리케이션입니다.

## 🌟 주요 기능

- **자동 키워드 추출**: NLP 기술을 활용한 한국어/영어 키워드 자동 추출
- **시각적 버블 표현**: D3.js를 활용한 인터랙티브 버블 시각화
- **키워드 관계 분석**: 키워드 간의 연관성 및 관계 시각화
- **실시간 필터링**: 카테고리, 중요도, 검색어를 통한 동적 필터링
- **반응형 UI**: Material-UI 기반의 세련된 사용자 인터페이스

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**: 컴포넌트 기반 UI 개발
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **D3.js**: 데이터 시각화
- **Vite**: 빠른 빌드 도구
- **Zustand**: 상태 관리

### Backend
- **Python 3.11**: 백엔드 언어
- **FastAPI**: 고성능 웹 프레임워크
- **KoNLPy**: 한국어 자연어 처리
- **NLTK**: 영어 자연어 처리
- **scikit-learn**: TF-IDF 기반 키워드 중요도 계산

### Infrastructure
- **Docker & Docker Compose**: 컨테이너화 및 오케스트레이션
- **PostgreSQL**: 데이터베이스 (향후 확장)
- **Redis**: 캐시 시스템 (향후 확장)

## 📦 설치 및 실행

### 방법 1: Docker Compose (권장)

```bash
# 저장소 클론
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# Docker Compose로 실행
docker-compose up -d

# 서비스 확인
docker-compose ps
```

서비스 URL:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 방법 2: 로컬 개발 환경

#### Backend 설정

```bash
cd backend/keyword-extraction

# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env

# 서버 실행
uvicorn main:app --reload --port 8000
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

## 🎯 사용 방법

### 1. 키워드 추출

1. 웹 브라우저에서 http://localhost:3000 접속
2. "문제 내용" 텍스트 영역에 LMS 문제 내용 입력
3. 언어 선택 (한국어/영어)
4. 추출 옵션 설정:
   - 최소 중요도 (0.0 ~ 1.0)
   - 최대 키워드 수 (5 ~ 50)
5. "키워드 추출" 버튼 클릭

### 2. 버블 시각화 인터랙션

- **확대/축소**: 마우스 휠 또는 줌 버튼 사용
- **이동**: 드래그하여 전체 뷰 이동
- **노드 드래그**: 개별 버블을 드래그하여 위치 조정
- **호버 정보**: 버블 위에 마우스를 올려 상세 정보 확인
- **필터링**: 상단 필터로 카테고리, 중요도 기준 필터링

### 3. 키워드 분석

추출된 키워드는 다음과 같이 분류됩니다:

- 🔵 **개념 (Concept)**: 파란색 - 핵심 개념 및 이론
- 🟢 **연산 (Operation)**: 초록색 - 계산 및 연산 방법
- 🟠 **개체 (Entity)**: 주황색 - 구체적 대상 및 객체
- 🟣 **속성 (Attribute)**: 보라색 - 특성 및 속성

## 📊 API 문서

### POST /api/keywords/extract

키워드 추출 API

**Request Body:**
```json
{
  "content": "분수의 덧셈과 뺄셈을 수행하세요. 분모가 다른 경우 통분이 필요합니다.",
  "language": "ko",
  "extraction_options": {
    "min_importance": 0.3,
    "max_keywords": 20,
    "include_relationships": true
  }
}
```

**Response:**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "keyword": "분수",
      "normalized_keyword": "분수",
      "keyword_type": "concept",
      "importance_score": 0.95,
      "frequency": 3,
      "category": "수학",
      "source_content": "..."
    }
  ],
  "relationships": [
    {
      "id": "uuid",
      "source_keyword_id": "uuid1",
      "target_keyword_id": "uuid2",
      "relationship_type": "related_to",
      "strength": 0.8
    }
  ],
  "visualization_data": {
    "nodes": [...],
    "links": [...]
  }
}
```

전체 API 문서: http://localhost:8000/docs

## 🗂️ 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── KeywordBubbleVisualization.tsx
│   │   │   └── KeywordExtractorForm.tsx
│   │   ├── services/           # API 서비스
│   │   ├── types/              # TypeScript 타입 정의
│   │   ├── utils/              # 유틸리티 함수
│   │   └── App.tsx             # 메인 앱 컴포넌트
│   ├── package.json
│   └── Dockerfile
│
├── backend/                     # Python 백엔드
│   └── keyword-extraction/
│       ├── services/           # 비즈니스 로직
│       │   ├── keyword_extractor.py
│       │   └── visualization_generator.py
│       ├── main.py             # FastAPI 애플리케이션
│       ├── requirements.txt
│       └── Dockerfile
│
├── database/                    # 데이터베이스 스키마 (향후)
├── docs/                       # 추가 문서
├── docker-compose.yml          # Docker Compose 설정
└── README.md                   # 이 파일
```

## 🔧 환경 변수

### Backend (.env)
```bash
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api
```

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend/keyword-extraction
pytest tests/
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

## 📈 향후 계획

- [ ] PostgreSQL 데이터베이스 통합
- [ ] 키워드 이력 관리 및 분석
- [ ] Redis 캐싱 구현
- [ ] 사용자 인증 및 권한 관리
- [ ] 다양한 시각화 레이아웃 (원형, 계층형 등)
- [ ] 키워드 데이터 내보내기 (SVG, PNG, JSON)
- [ ] 실시간 협업 기능
- [ ] AI 기반 키워드 추천

## 🤝 기여

기여는 언제나 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 Issue를 생성해주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
