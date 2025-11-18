# Math Learning App - 독립형 웹앱

AI 기반 추천 시스템을 활용한 똑똑한 수학 학습 플랫폼

## 주요 특징

### 🎯 자동 추천 시스템
- **적응형 난이도**: 학생 실력에 맞춰 자동으로 문제 난이도 조정
- **개인화된 학습**: 각 학생의 진도와 성취도를 추적하여 맞춤 문제 제공
- **효율적인 학습**: 과한 계산 없이 빠른 추천 알고리즘

### 📚 완전한 학습 관리 시스템
- **학생 인터페이스**: 깔끔한 UI로 문제 풀이에 집중
- **교사 대시보드**: 손쉬운 문제 생성 및 관리
- **실시간 통계**: 학생 진도 및 성취도 실시간 확인
- **다양한 문제 유형**: 객관식, 주관식, 숫자 답, 참/거짓

### 🚀 기술 스택
- **Backend**: PHP 7.1.9 (호환)
- **Database**: MySQL 5.7 (호환)
- **Architecture**: PSR-4 autoloading, MVC 패턴
- **Security**: 세션 기반 인증, SQL Injection 방지
- **Performance**: 파일 기반 캐싱, 최적화된 쿼리

## 빠른 시작

### 1. 데이터베이스 설치

```bash
cd database
./install.sh
```

### 2. 환경 설정

```bash
cp config/.env.example config/.env
nano config/.env
```

### 3. 웹 서버 설정

DocumentRoot를 `public/` 디렉토리로 지정

### 4. 접속

```
http://localhost/login.php
```

## 기본 계정

| 역할 | 아이디 | 비밀번호 |
|------|--------|----------|
| 교사 | teacher | teacher123 |
| 학생 | student | student123 |

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/                 # 설정 파일
├── database/              # DB 스키마 및 설치 스크립트
├── src/                   # 소스 코드
│   ├── Core/             # 핵심 기능 (인증)
│   ├── Database/         # DB 연결
│   └── Services/         # 비즈니스 로직
├── public/               # 웹 루트
│   ├── admin/           # 교사 대시보드
│   └── student/         # 학생 인터페이스
└── cache/               # 캐시 파일
```

## 주요 기능

### 학생: 자동 추천 문제 풀이
- 실력에 맞는 문제 자동 선택
- 진도 및 정답률 실시간 표시
- 카테고리별 학습 관리

### 교사: 문제 생성 및 관리
- 직관적인 문제 생성 UI
- 학생 성취도 통계
- 문제별 정답률 분석

## 상세 문서

더 자세한 정보는 다음 파일을 참고하세요:
- 설치 가이드: `INSTALL.md`
- API 문서: `docs/API.md`

---

개발: 2025-11-18 | PHP 7.1.9 | MySQL 5.7
