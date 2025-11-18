# Hundred Art - 독립형 LMS 연동 웹앱

1-100 숫자를 아트워크로 재구성하는 교육용 웹 애플리케이션

## 개요

Hundred Art는 Moodle LMS와 연동하여 문제 정보를 받아 가상 스마트폰 화면에 숫자를 아트워크로 표시하는 독립형 웹앱입니다.

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **React**: 18+
- **TypeScript**: 5+
- **SVG/Canvas**: 아트워크 렌더링

## 프로젝트 구조

```
/
├── backend/          # PHP REST API
│   ├── api/         # API 엔드포인트
│   ├── config/      # 설정 파일
│   ├── models/      # 데이터 모델
│   └── services/    # 비즈니스 로직
├── frontend/        # React 애플리케이션
│   ├── public/      # 정적 파일
│   └── src/         # 소스 코드
├── database/        # MySQL 스키마 및 마이그레이션
└── docs/           # 문서
```

## 주요 기능

1. **Moodle LMS 연동**: 문제 데이터 실시간 동기화
2. **가상 스마트폰 UI**: 우측 하단 모바일 화면 시뮬레이션
3. **숫자 아트워크 생성**: 1-100 숫자를 창의적인 아트워크로 변환
4. **학습 진행 추적**: 학생 진도 및 성과 관리

## 빠른 시작

### 1. 저장소 클론 및 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# .env 파일 편집 (데이터베이스 및 Moodle 설정)
nano backend/.env
```

### 2. 데이터베이스 설정

```bash
# 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE hundred_art CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 스키마 및 초기 데이터 적용
mysql -u root -p hundred_art < database/schema.sql
mysql -u root -p hundred_art < database/seed_artworks.sql

# 나머지 아트워크 생성 (11-100)
php database/generate_artworks.php
```

### 3. 백엔드 실행

```bash
cd backend
php -S localhost:8000
```

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 상세 문서

- 📘 [설치 가이드](docs/INSTALLATION.md) - 전체 설치 및 배포 가이드
- 📗 [API 문서](docs/API_DOCUMENTATION.md) - REST API 사용법
- 📕 [Moodle 연동 가이드](docs/MOODLE_INTEGRATION.md) - Moodle LMS 연동 설정

## 주요 API 엔드포인트

### 아트워크
- `GET /api/artworks` - 전체 아트워크 목록
- `GET /api/artworks/{number}` - 특정 숫자 아트워크 조회

### 문제
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/{id}` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성

### 학습 진행
- `GET /api/progress/{student_id}` - 학생 진행 상황 조회
- `POST /api/progress` - 답안 제출

### Moodle 연동
- `POST /api/moodle/sync` - Moodle 데이터 동기화
- `GET /api/moodle/status` - 동기화 상태 확인

## 스크린샷

### 가상 스마트폰 화면
- 우측 하단에 표시되는 모바일 UI
- 1-100 숫자의 창의적인 SVG 아트워크
- 부드러운 애니메이션 효과

### 주요 화면
- 아트워크 선택 화면
- 문제 풀이 화면
- 학습 진행 추적 대시보드

## 라이선스

MIT License

## 기여

KAIST Touch Math Academy

## 문의

프로젝트 관련 문의사항은 Issues를 통해 등록해주세요.
