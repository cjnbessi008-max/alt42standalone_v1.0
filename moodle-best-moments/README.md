# Moodle Best Thinking Moments Extractor

## 개요 (Overview)
Moodle LMS와 연동하여 학생들의 학습 활동에서 "오늘 가장 잘한 사고 순간"을 자동으로 추출하는 플러그인입니다.

## 기술 스택 (Technology Stack)
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **JavaScript**: ES5+ (Moodle 호환)

## 주요 기능 (Key Features)
1. **실시간 학습 활동 모니터링**: Moodle 로그 시스템 연동
2. **사고 순간 분석**: 학생의 문제 해결 과정, 창의적 접근 평가
3. **자동 추출**: 매일 정해진 시간에 최고의 순간 자동 선정
4. **리포트 생성**: 교사 및 학생용 대시보드 제공
5. **알림 시스템**: 우수 사고 순간 발생 시 알림

## 분석 기준 (Analysis Criteria)
### 사고 순간 평가 요소:
- **문제 해결 효율성**: 시도 횟수 대비 성공률
- **창의적 접근**: 독특한 해결 방법 사용
- **개선도**: 이전 시도 대비 향상도
- **지속성**: 어려운 문제에 대한 꾸준한 시도
- **협업**: 포럼/그룹 활동에서의 기여도

## 디렉토리 구조 (Directory Structure)
```
moodle-best-moments/
├── config/              # 설정 파일
│   ├── database.php     # DB 연결 설정
│   └── config.php       # 플러그인 설정
├── db/                  # 데이터베이스 스키마
│   ├── install.xml      # 테이블 정의
│   └── access.php       # 권한 설정
├── classes/             # PHP 클래스
│   ├── analyzer/        # 분석 엔진
│   ├── collector/       # 데이터 수집
│   └── reporter/        # 리포트 생성
├── lib.php              # 핵심 함수
├── version.php          # 버전 정보
├── lang/                # 다국어 지원
│   ├── en/              # 영어
│   └── ko/              # 한국어
└── ui/                  # 사용자 인터페이스
    ├── dashboard.php    # 대시보드
    └── report.php       # 리포트 페이지
```

## 설치 방법 (Installation)
1. Moodle의 `local/` 디렉토리에 플러그인 복사
2. Moodle 관리자 페이지에서 플러그인 설치
3. 데이터베이스 테이블 자동 생성
4. Cron job 설정 (매일 자동 실행)

## Moodle 데이터 소스 (Data Sources)
- `mdl_logstore_standard_log`: 학습 활동 로그
- `mdl_quiz_attempts`: 퀴즈 시도 기록
- `mdl_assign_submission`: 과제 제출
- `mdl_forum_posts`: 포럼 게시물
- `mdl_grade_grades`: 성적 정보

## 개발 로드맵 (Development Roadmap)
- [x] 프로젝트 구조 설계
- [ ] 데이터베이스 스키마 설계
- [ ] Moodle API 연동
- [ ] 데이터 수집 모듈
- [ ] 분석 알고리즘 구현
- [ ] UI 개발
- [ ] 자동 실행 스케줄러
- [ ] 테스트 및 문서화

## 라이선스 (License)
MIT License

## 개발자 (Developer)
KAIST Touch Math Academy
