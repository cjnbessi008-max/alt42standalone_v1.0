# Venn Glow - 집합 학습 웹앱

Moodle LMS와 연동하여 집합 문제를 감성적인 빛나는 벤다이어그램으로 표시하는 교육용 웹앱

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)

## 주요 기능

- Moodle LMS와 실시간 연동
- 우측 하단 가상 스마트폰 화면에 앱 표시
- 집합 A·B를 빛나는 원으로 시각화
- 교집합 변화의 감성적 애니메이션 효과

## 프로젝트 구조

```
/
├── api/              # PHP 백엔드 API
├── public/           # 프론트엔드 파일
├── lib/              # 라이브러리 및 유틸리티
├── config/           # 설정 파일
└── docs/             # 문서
```

## 설치 및 실행

### 1. Moodle 데이터베이스 설정

`config/database.php` 파일에서 Moodle 데이터베이스 연결 정보를 설정합니다.

### 2. 웹 서버 설정

Apache 또는 Nginx에서 `public/` 디렉토리를 document root로 설정합니다.

### 3. 접속

브라우저에서 설정한 URL로 접속합니다.

## 개발

- **Branch**: `claude/venn-glow-animation-0176TuZtyy3YyyByPASyfyg2`
- **PRD**: [tasks/0001-prd-ai-education-pipeline.md](tasks/0001-prd-ai-education-pipeline.md)
