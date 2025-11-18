# Area Walk - 적분 시각화 교육 웹앱

## 📱 프로젝트 개요
적분의 물리적 의미를 캐릭터의 이동으로 시각화하여 학생들이 직관적으로 이해할 수 있도록 돕는 교육용 웹 애플리케이션입니다.

## 🎯 핵심 기능
- **적분 시각화**: 그래프 아래 면적을 실시간으로 계산하고 표시
- **캐릭터 애니메이션**: 적분 값만큼 캐릭터가 이동
- **Moodle 연동**: LMS와 완전 통합되어 문제 관리 및 성적 처리
- **가상 스마트폰 UI**: 우측 하단에 모바일 화면 형태로 표시

## 🛠 기술 스택
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Canvas API
- **LMS**: Moodle 3.7

## 📁 프로젝트 구조
```
area-walk/
├── backend/              # PHP 백엔드
│   ├── api/             # REST API 엔드포인트
│   ├── models/          # 데이터 모델
│   ├── utils/           # 유틸리티 함수
│   └── config/          # 설정 파일
├── frontend/            # 프론트엔드
│   ├── js/              # JavaScript 파일
│   ├── css/             # 스타일시트
│   └── assets/          # 이미지, 스프라이트
├── moodle-plugin/       # Moodle 플러그인
│   └── areawalk/        # Question Type Plugin
├── database/            # 데이터베이스
│   ├── schema/          # 스키마 정의
│   ├── migrations/      # 마이그레이션
│   └── seeds/           # 초기 데이터
├── docs/                # 문서
└── tests/               # 테스트 코드
```

## 🚀 설치 방법

### 1. 데이터베이스 설정
```bash
mysql -u root -p < database/schema/create_tables.sql
mysql -u root -p < database/seeds/sample_data.sql
```

### 2. 백엔드 설정
```bash
cd backend
cp config/config.example.php config/config.php
# config.php 파일에서 데이터베이스 연결 정보 수정
```

### 3. Moodle 플러그인 설치
```bash
cp -r moodle-plugin/areawalk /path/to/moodle/question/type/
# Moodle 관리자 페이지에서 플러그인 설치 완료
```

### 4. 프론트엔드 배포
```bash
# 웹 서버 document root에 frontend 디렉토리 복사
cp -r frontend /var/www/html/area-walk
```

## 🧪 테스트
```bash
# 백엔드 테스트
cd tests/backend
phpunit

# 프론트엔드 테스트
cd tests/frontend
npm test
```

## 📖 사용 방법

### 교사 (문제 출제)
1. Moodle에 로그인
2. 문제 은행에서 "Area Walk" 문제 유형 선택
3. 함수 수식 입력 (예: x^2)
4. 적분 범위 설정 (예: 0부터 2까지)
5. 저장 후 퀴즈에 추가

### 학생 (문제 풀이)
1. 퀴즈 시작
2. 우측 하단 가상 스마트폰 화면에서 문제 확인
3. 그래프와 캐릭터 애니메이션 관찰
4. 적분 값 계산 후 입력
5. 제출하면 캐릭터가 이동하며 정답 확인

## 📊 API 문서
- `GET /api/v1/problems/{id}` - 문제 정보 조회
- `POST /api/v1/problems/{id}/submit` - 답안 제출
- `GET /api/v1/progress/{user_id}` - 진도 조회
- `POST /api/v1/calculate-integral` - 적분 계산

자세한 API 문서는 [docs/api.md](docs/api.md) 참조

## 🎨 개발 가이드

### 새로운 함수 타입 추가
1. `backend/utils/FunctionParser.php`에 파싱 로직 추가
2. `frontend/js/graph-renderer.js`에 렌더링 로직 추가
3. `database/seeds/functions.sql`에 샘플 데이터 추가

### 캐릭터 스프라이트 변경
1. `frontend/assets/sprites/` 디렉토리에 PNG 파일 추가
2. `database`에 character_sprite 필드 업데이트

## 🐛 알려진 이슈
- [ ] Safari에서 Canvas 렌더링 성능 저하
- [ ] 복잡한 삼각함수의 경우 계산 시간 증가
- [ ] 모바일 브라우저 터치 이벤트 최적화 필요

## 📝 라이센스
KAIST Touch Math Academy - Educational Use Only

## 👥 기여자
- 설계 및 개발: Claude AI Assistant
- 프로젝트 관리: KAIST Touch Math Academy

## 📞 문의
기술 지원: support@kaist-math.edu
버그 리포트: GitHub Issues

---
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
