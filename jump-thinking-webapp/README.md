# Jump Thinking Detection System

## 개요
Moodle LMS와 연동하여 학생의 **비약 사고(Jump Thinking)** 패턴을 감지하는 독립형 웹 애플리케이션입니다.

### 주요 기능
- 🎯 보조 문제 없이 바로 답을 도출하는 사고 패턴 감지
- 📊 단계별 문제 풀이 과정 추적
- 📈 교사용 분석 대시보드
- 🔗 Moodle LTI 1.1 표준 연동

## 시스템 요구사항
- PHP 7.1.9+
- MySQL 5.7+
- Apache/Nginx 웹 서버
- Moodle 3.7+

## 설치 방법

### 1. 데이터베이스 설정
```bash
mysql -u root -p < database/schema.sql
```

### 2. 설정 파일 구성
`config/database.php` 파일에서 데이터베이스 연결 정보 설정

### 3. Moodle 연동
1. Moodle 관리자 페이지 접속
2. **사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구 관리**
3. 새 외부 도구 추가
4. Launch URL: `https://your-domain.com/public/lti_launch.php`
5. Consumer Key 및 Shared Secret 설정

## 비약 사고 감지 알고리즘

### 감지 기준
1. **시간 패턴**: 중간 단계 문제를 너무 빨리 건너뛰는 경우
2. **단계 스킵**: 필수 단계를 거치지 않고 최종 답 도출
3. **순서 위반**: 논리적 순서를 따르지 않는 접근
4. **정답 일관성**: 중간 과정 없이 최종 답만 정확

### 점수 계산
- Jump Score (0-100): 비약 사고 경향성
- 높을수록 더 많은 단계를 건너뛰는 경향

## 프로젝트 구조
```
jump-thinking-webapp/
├── config/              # 설정 파일
├── public/              # 웹 루트
│   ├── student/        # 학생 인터페이스
│   ├── teacher/        # 교사 대시보드
│   └── api/            # REST API
├── src/                # 백엔드 로직
│   ├── LTI/           # LTI 연동
│   ├── JumpThinking/  # 감지 알고리즘
│   ├── Database/      # DB 연결
│   └── Models/        # 데이터 모델
└── database/          # SQL 스키마
```

## 라이선스
MIT License
