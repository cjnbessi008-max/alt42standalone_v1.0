# Logic Puzzle LMS App

명제 논리 구조를 퍼즐처럼 조립하는 학습 웹앱

## 🎓 개요

Moodle 3.7 LMS와 연동하여 논리학 명제를 시각적으로 학습할 수 있는 인터랙티브 웹 애플리케이션입니다.

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS Integration**: Moodle 3.7 Web Services API

## 📋 주요 기능

1. **모바일 뷰포트 시뮬레이터**: 우측 하단에 가상 스마트폰 화면 표시
2. **명제 논리 블록**: AND, OR, NOT, IF-THEN, 변수 블록
3. **드래그 앤 드롭**: 블록을 드래그하여 논리 구조 조립
4. **실시간 검증**: 조립한 논리식의 정확성 즉시 확인
5. **Moodle 연동**: LMS에서 문제 정보 자동 수신 및 결과 전송

## 🗂 프로젝트 구조

```
logic-puzzle-lms/
├── public/              # 웹 루트
│   ├── index.html       # 메인 페이지
│   ├── css/             # 스타일시트
│   ├── js/              # JavaScript 모듈
│   └── assets/          # 이미지, 아이콘
├── api/                 # PHP 백엔드 API
│   ├── config.php       # 설정 파일
│   ├── moodle-connector.php
│   ├── get-problems.php
│   └── submit-answer.php
├── database/            # DB 스키마
│   └── schema.sql
└── config/              # 환경 설정
    └── config.example.php
```

## 🚀 설치 및 실행

### 1. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 2. 설정 파일 생성

```bash
cp config/config.example.php api/config.php
# config.php 파일을 편집하여 Moodle 및 MySQL 연결 정보 입력
```

### 3. 웹 서버 실행

Apache 또는 Nginx를 사용하여 `public/` 디렉토리를 웹 루트로 설정

```bash
# PHP 내장 서버 사용 시 (개발용)
cd public
php -S localhost:8000
```

### 4. Moodle 웹 서비스 활성화

Moodle 관리자 페이지에서:
1. 사이트 관리 → 플러그인 → 웹 서비스 → 관리
2. 웹 서비스 활성화
3. 토큰 생성 및 `config.php`에 추가

## 📖 사용 방법

1. 웹 브라우저에서 앱 접속
2. 우측 하단 모바일 화면에 문제가 표시됨
3. 좌측 도구 패널에서 논리 블록을 선택
4. 드래그하여 작업 영역에 배치 및 연결
5. "제출" 버튼으로 답안 검증

## 🧩 논리 블록 종류

- **변수 블록**: P, Q, R (명제 변수)
- **AND 블록**: ∧ (논리곱)
- **OR 블록**: ∨ (논리합)
- **NOT 블록**: ¬ (부정)
- **IMPLIES 블록**: → (함의)
- **IFF 블록**: ↔ (동치)

## 🔒 보안 고려사항

- SQL Injection 방지: PDO Prepared Statements 사용
- XSS 방지: 모든 사용자 입력 sanitize
- CSRF 보호: 토큰 기반 요청 검증
- Moodle API 인증: 토큰 기반 인증

## 📝 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
