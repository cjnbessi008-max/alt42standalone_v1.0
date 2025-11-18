# Geo Spiral - 등비수열 나선형 시각화 앱

Moodle LMS와 연동하여 등비수열을 나선형으로 시각화하는 교육용 웹 애플리케이션입니다. 가상 스마트폰 화면에서 아름답고 인터랙티브한 수학 시각화를 제공합니다.

## 🌟 주요 기능

- **등비수열 나선형 시각화**: 다양한 등비수열을 로그 나선, 아르키메데스 나선, 피보나치 나선로 시각화
- **가상 스마트폰 UI**: 우측 하단에 표시되는 실감나는 스마트폰 인터페이스
- **Moodle 3.7 통합**: LMS와 완벽하게 연동되어 학습 진도 추적
- **인터랙티브 컨트롤**: 확대/축소, 회전, 애니메이션 기능
- **학습 분석**: 학생의 상호작용 및 진도 데이터 수집

## 🛠 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **React**: 18.2.0
- **Canvas API**: 나선형 렌더링
- **D3.js**: 수학적 시각화

### 인프라
- **Docker & Docker Compose**: 개발 환경 구성
- **Node.js**: 16 (프론트엔드 빌드)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── frontend/              # React 프론트엔드 앱
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/    # React 컴포넌트
│   │   │   │   ├── VirtualPhone.js        # 가상 스마트폰 UI
│   │   │   │   ├── SpiralVisualization.js # 나선형 시각화
│   │   │   │   └── SequenceSelector.js    # 수열 선택기
│   │   │   ├── utils/         # 유틸리티 함수
│   │   │   │   ├── spiralEngine.js        # 나선 계산 엔진
│   │   │   │   └── api.js                 # API 클라이언트
│   │   │   └── App.js         # 메인 앱 컴포넌트
│   │   └── package.json
│   │
│   ├── moodle-plugin/         # Moodle 블록 플러그인
│   │   ├── block_geospiral.php
│   │   ├── version.php
│   │   ├── view.php
│   │   ├── api.php            # REST API
│   │   ├── settings.php
│   │   ├── db/
│   │   │   ├── access.php
│   │   │   └── install.xml
│   │   ├── lang/en/
│   │   ├── styles/
│   │   └── js/
│   │
│   └── backend/               # PHP 백엔드 서비스
│
├── db/                        # 데이터베이스 스키마
│   └── schema.sql
│
├── config/                    # 설정 파일
│   ├── Dockerfile.php
│   └── php.ini
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 설치 및 실행

### 사전 요구사항

- Docker & Docker Compose
- Git

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
cp src/frontend/.env.example src/frontend/.env
```

필요에 따라 `.env` 파일을 수정하세요.

### 3. Docker 컨테이너 시작

```bash
docker-compose up -d
```

이 명령어는 다음 서비스를 시작합니다:
- **MySQL** (포트 3306)
- **PHP + Apache** (포트 8080)
- **Moodle** (포트 8081)
- **React Frontend** (포트 3000)

### 4. 데이터베이스 초기화

데이터베이스는 자동으로 초기화됩니다 (`db/schema.sql`).

### 5. 프론트엔드 개발 서버 접속

```bash
# 개발 모드 (Mock 데이터 사용)
http://localhost:3000
```

### 6. Moodle 접속

```bash
http://localhost:8081
```

Moodle 설치를 완료하고 Geo Spiral 블록을 활성화하세요.

## 📖 사용 방법

### 학생용

1. Moodle 코스에 로그인
2. Geo Spiral 블록에서 "Geo Spiral 시작" 버튼 클릭
3. 학습할 수열 선택
4. 우측 하단 가상 스마트폰 화면에서 나선형 시각화 확인
5. 컨트롤을 사용하여:
   - **애니메이션 시작**: 수열이 나선으로 펼쳐지는 애니메이션 재생
   - **확대/축소**: 나선형의 디테일 확인
   - **회전**: 다양한 각도에서 나선 관찰
   - **초기화**: 모든 설정을 초기 상태로 복원

### 교사용

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 블록 > Geo Spiral**에서 설정 구성
3. 학생 진도 및 상호작용 데이터 확인
4. 새로운 수열 추가 (데이터베이스 직접 수정)

## 🎨 수열 타입

### 등비수열 (Geometric Sequence)
- 첫 항 `a`와 공비 `r`로 정의
- 항: `a, ar, ar², ar³, ...`

### 피보나치 수열 (Fibonacci Sequence)
- 이전 두 항의 합으로 다음 항 생성
- 항: `1, 1, 2, 3, 5, 8, 13, ...`

### 나선 타입

1. **로그 나선 (Logarithmic Spiral)**
   - 공식: `r = a * e^(b*θ)`
   - 특징: 각도에 따라 지수적으로 증가

2. **아르키메데스 나선 (Archimedean Spiral)**
   - 공식: `r = a + b*θ`
   - 특징: 각도에 따라 선형으로 증가

3. **피보나치 나선 (Fibonacci Spiral)**
   - 피보나치 수열 기반
   - 황금비와 자연의 패턴 표현

## 🔧 개발 가이드

### 프론트엔드 개발

```bash
cd src/frontend
npm install
npm start
```

Mock 데이터를 사용하려면 `.env` 파일에서:
```
REACT_APP_USE_MOCK=true
```

### 새로운 수열 추가

데이터베이스에 직접 삽입:

```sql
INSERT INTO mdl_geospiral_sequences
(name, description, sequence_type, first_term, common_ratio, num_terms, spiral_type, created_by, created_at, updated_at)
VALUES
('My Sequence', '설명', 'geometric', 1.0, 2.0, 10, 'logarithmic', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### API 엔드포인트

- `GET /api.php?action=get_sequences&courseid=1` - 모든 수열 조회
- `GET /api.php?action=get_sequence&sequenceid=1&courseid=1` - 특정 수열 조회
- `GET /api.php?action=get_progress&sequenceid=1&courseid=1` - 진도 조회
- `POST /api.php?action=save_progress` - 진도 저장
- `POST /api.php?action=log_interaction` - 상호작용 로그

## 📊 데이터베이스 스키마

- `mdl_geospiral_sequences` - 수열 정의
- `mdl_geospiral_progress` - 학생 진도
- `mdl_geospiral_interactions` - 상호작용 이력
- `mdl_geospiral_config` - 시스템 설정

## 🧪 테스트

```bash
cd src/frontend
npm test
```

## 🐛 문제 해결

### Docker 컨테이너가 시작되지 않는 경우

```bash
docker-compose down
docker-compose up -d --build
```

### MySQL 연결 오류

`.env` 파일의 데이터베이스 설정을 확인하세요.

### 프론트엔드가 API에 연결되지 않는 경우

1. `src/frontend/.env`에서 `REACT_APP_USE_MOCK=true` 설정
2. 또는 `REACT_APP_API_URL` 확인

## 📝 라이선스

이 프로젝트는 GNU GPL v3 라이선스를 따릅니다.

## 👥 기여

KAIST Touch Math Academy

## 📞 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.

---

**Geo Spiral** - 수학을 아름답게 시각화합니다 ✨
