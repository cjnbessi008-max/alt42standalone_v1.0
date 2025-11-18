# 🌊 Fluid Geometry - AI Education System

[![KAIST](https://img.shields.io/badge/KAIST-Touch%20Math%20Academy-blue)](https://www.kaist.ac.kr)
[![Moodle](https://img.shields.io/badge/Moodle-3.7-orange)](https://moodle.org)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org)

AI 기반 수학 교육 시스템으로 도형의 기하학적 성질을 **유체 애니메이션**으로 시각화하여 학습합니다.

## 📱 주요 기능

### 1. **Fluid Geometry 애니메이션**
- 도형이 물처럼 흐르면서 변형되는 물리 시뮬레이션
- 기하학적 성질 보존 실시간 표시 (면적, 둘레, 꼭짓점)
- Matter.js 물리 엔진 기반 부드러운 애니메이션

### 2. **스마트폰 시뮬레이터**
- 우측 하단에 표시되는 가상 스마트폰 화면
- 반응형 디자인으로 모든 디바이스 지원
- 실제 모바일 앱 경험 제공

### 3. **Moodle LMS 연동**
- Moodle 3.7+ 완벽 호환
- Web Services API를 통한 실시간 데이터 동기화
- 문제 불러오기, 학습 진도 추적, 결과 제출

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** 16.x 이상
- **npm** 또는 **yarn**
- **Moodle** 3.7+ (PHP 7.1.9, MySQL 5.7)

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

앱이 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🔧 Moodle 연동 설정

### 1. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/moodle-plugin/local/fluidgeometry ./local/

# Moodle 관리자 페이지에서 플러그인 설치
# 사이트 관리 > 알림 > 데이터베이스 업그레이드
```

### 2. Web Services 활성화

1. **사이트 관리 > 고급 기능**
   - "Enable web services" 체크
   - "Enable REST protocol" 체크

2. **사이트 관리 > 플러그인 > Web services > 관리**
   - REST protocol 활성화

3. **외부 서비스 생성**
   - 사이트 관리 > 서버 > Web services > 외부 서비스
   - "Fluid Geometry Service" 추가

4. **토큰 생성**
   - 사이트 관리 > 서버 > Web services > 토큰 관리
   - 사용자 및 서비스 선택하여 토큰 생성

### 3. 프론트엔드 설정

`.env` 파일 생성:

```env
VITE_MOODLE_URL=https://your-moodle-site.com
VITE_MOODLE_WS_TOKEN=your_web_service_token_here
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   ├── SmartphoneSimulator.tsx    # 스마트폰 UI 시뮬레이터
│   │   ├── SmartphoneSimulator.css
│   │   ├── FluidGeometry.tsx          # 유체 기하학 애니메이션
│   │   └── FluidGeometry.css
│   ├── services/
│   │   └── moodleApi.ts               # Moodle API 서비스
│   ├── App.tsx                        # 메인 애플리케이션
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── moodle-plugin/
│   └── local/
│       └── fluidgeometry/             # Moodle 플러그인
│           ├── version.php
│           ├── externallib.php
│           └── db/
│               ├── services.php
│               └── install.xml
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # 프로젝트 PRD
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎓 사용 방법

### 학생 사용자

1. **문제 불러오기**: Moodle LMS에서 자동으로 문제를 불러옵니다
2. **도형 관찰**: 스마트폰 화면에서 도형이 물처럼 흐르는 것을 관찰합니다
3. **상호작용**:
   - 클릭/터치로 도형과 상호작용
   - "유체 모드" 버튼으로 유체 효과 활성화
   - "흔들기" 버튼으로 도형에 힘 가하기
4. **성질 확인**: 실시간으로 면적, 둘레, 꼭짓점 수가 유지되는 것을 확인
5. **결과 제출**: 학습 완료 후 자동으로 Moodle에 결과 제출

### 교사 사용자

1. Moodle 관리자 페이지에서 새로운 Fluid Geometry 문제 생성
2. 도형 유형 선택 (삼각형, 사각형, 원, 다각형)
3. 난이도 설정
4. 학생들의 학습 진도 및 결과 확인

## 🛠 기술 스택

### Frontend
- **React 18.2** - UI 라이브러리
- **TypeScript 5.0** - 타입 안정성
- **Vite** - 빌드 도구
- **Matter.js** - 2D 물리 엔진
- **Axios** - HTTP 클라이언트

### Backend (Moodle Plugin)
- **PHP 7.1.9** - Moodle 플러그인 개발
- **MySQL 5.7** - 데이터베이스
- **Moodle 3.7** - LMS 플랫폼

## 📊 학습 목표

### 기하학적 불변량 이해
- 도형이 변형되어도 유지되는 성질 학습
- 면적 보존 원리
- 둘레와 형태의 관계
- 꼭짓점의 개념

### 물리 시뮬레이션을 통한 직관적 학습
- 시각적 피드백으로 추상적 개념 구체화
- 인터랙티브 조작으로 능동적 학습
- 실시간 데이터로 수학적 정확성 체험

## 🔍 API 문서

### Moodle Web Services

#### `local_fluidgeometry_get_problem`
특정 문제 정보 가져오기

**Parameters:**
- `problemid` (int): 문제 ID

**Returns:**
```json
{
  "id": 1,
  "name": "삼각형의 성질",
  "intro": "삼각형의 불변량을 학습하세요",
  "shapetype": "triangle",
  "difficulty": 1,
  "timemodified": 1700000000
}
```

#### `local_fluidgeometry_submit_attempt`
학생 답안 제출

**Parameters:**
- `problemid` (int): 문제 ID
- `starttime` (int): 시작 시간
- `endtime` (int): 종료 시간
- `area` (float): 측정된 면적
- `perimeter` (float): 측정된 둘레
- `vertices` (int): 꼭짓점 개수

**Returns:**
```json
{
  "success": true,
  "attemptid": 123,
  "score": 95.5
}
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 GPL v3 라이선스를 따릅니다.

## 👥 개발팀

**KAIST Touch Math Academy - AI Education System Team**

- 프로젝트 관리: KAIST
- 기술 지원: [이메일 주소]

## 📞 지원

- 이슈 제기: [GitHub Issues](https://github.com/yourusername/alt42standalone_v1.0/issues)
- 문서: [Wiki](https://github.com/yourusername/alt42standalone_v1.0/wiki)
- 이메일: support@example.com

## 🎯 로드맵

### v1.0.0 (현재)
- ✅ Fluid Geometry 기본 애니메이션
- ✅ Moodle 3.7 연동
- ✅ 스마트폰 시뮬레이터
- ✅ 기하학적 성질 실시간 표시

### v1.1.0 (예정)
- ⏳ 더 많은 도형 유형 지원
- ⏳ 고급 물리 시뮬레이션 옵션
- ⏳ 학습 분석 대시보드
- ⏳ 다국어 지원 (영어, 중국어, 일본어)

### v2.0.0 (계획)
- 📋 AI 기반 자동 문제 생성
- 📋 3D 도형 지원
- 📋 협업 학습 모드
- 📋 WebXR 지원

---

**Made with ❤️ by KAIST Touch Math Academy**
