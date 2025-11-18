# 학생 성과 분석 시스템 (Student Performance Analysis System)

Moodle LMS와 연동하여 최상위권 학생들의 평균 사고 루틴을 분석하고, 개별 학생들과의 편차를 분석하는 시스템입니다.

## 🎯 주요 기능

### 1. **Moodle LMS 연동**
- MySQL 5.7 데이터베이스 직접 연결
- Moodle 3.7 데이터 구조 지원
- PHP 7.1.9 환경과 호환

### 2. **최상위권 학생 분석**
- 상위 10% 학생 자동 식별
- 평균 사고 루틴 계산
- 학습 패턴 추출

### 3. **개인별 편차 분석**
- 정확도, 일관성, 시간 관리 등 다차원 분석
- 최상위권 평균과의 비교
- 백분위 순위 계산

### 4. **맞춤형 개선 방안**
- 데이터 기반 학습 권장사항
- 강점 및 약점 식별
- 실행 가능한 개선 전략

## 📋 시스템 요구사항

### 필수 요구사항
- Python 3.8 이상
- MySQL 5.7 (Moodle 데이터베이스)
- 4GB RAM 이상
- 500MB 이상 디스크 공간

### 선택 요구사항
- PostgreSQL 15+ (분석 데이터 저장용)
- Redis (캐싱용)

## 🚀 설치 방법

### 1. 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Python 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 데이터베이스 설정

`config/database.config.json` 파일을 편집하여 Moodle 데이터베이스 연결 정보를 입력합니다:

```json
{
  "moodle": {
    "host": "your-moodle-db-host",
    "port": 3306,
    "database": "moodle",
    "user": "your-username",
    "password": "your-password",
    "charset": "utf8mb4",
    "version": "5.7"
  }
}
```

## 💻 사용 방법

### 방법 1: 웹 인터페이스 사용

1. **웹 서버 시작**
```bash
cd webapp
python app.py
```

2. **브라우저에서 접속**
```
http://localhost:5000
```

3. **코스 분석 실행**
- 홈페이지에서 Moodle 코스 ID 입력
- "분석 시작" 버튼 클릭
- 결과를 웹에서 확인

### 방법 2: 커맨드 라인 사용

#### 전체 코스 분석
```bash
cd backend
python analysis_pipeline.py --course-id 1
```

#### 특정 학생 분석
```bash
python analysis_pipeline.py --course-id 1 --user-id 42
```

#### 출력 디렉토리 지정
```bash
python analysis_pipeline.py --course-id 1 --output-dir /path/to/output
```

## 📊 출력 결과

### 생성되는 파일

1. **요약 파일** (`course_X_summary_TIMESTAMP.json`)
   - 코스 전체 통계
   - 최상위권 프로필
   - 클래스 통계

2. **상세 리포트** (`course_X_detailed_reports_TIMESTAMP.json`)
   - 각 학생의 상세 분석
   - 편차 메트릭
   - 개선 권장사항

3. **CSV 파일** (`course_X_deviations_TIMESTAMP.csv`)
   - 스프레드시트로 열람 가능
   - 학생별 핵심 메트릭
   - 정렬 및 필터링 용이

### 결과 해석

#### 편차 점수 (Deviation Score)
- **0-10**: S등급 (최상위권 수준)
- **10-25**: A등급 (우수)
- **25-40**: B등급 (양호)
- **40-60**: C등급 (보통)
- **60+**: D등급 (개선 필요)

#### 분석 메트릭
- **정확도 (Accuracy)**: 문제 정답률
- **일관성 (Consistency)**: 성적 편차
- **시간 관리**: 문제당 평균 소요 시간
- **참여도 (Engagement)**: 활동 다양성 및 빈도
- **학습 속도 (Learning Velocity)**: 시간에 따른 개선율

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # 백엔드 분석 엔진
│   ├── moodle_connector.py    # Moodle DB 연결
│   ├── student_analyzer.py    # 학생 분석 엔진
│   ├── deviation_analyzer.py  # 편차 분석기
│   └── analysis_pipeline.py   # 메인 파이프라인
├── webapp/                     # 웹 인터페이스
│   ├── app.py                 # Flask 애플리케이션
│   └── templates/             # HTML 템플릿
│       ├── index.html         # 홈페이지
│       └── dashboard.html     # 대시보드
├── config/                     # 설정 파일
│   └── database.config.json   # DB 연결 정보
├── output/                     # 분석 결과 출력
├── tasks/                      # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
├── requirements.txt           # Python 의존성
└── README.md                  # 이 파일
```

## 🔧 고급 설정

### 분석 파라미터 조정

`config/database.config.json`에서 분석 설정을 변경할 수 있습니다:

```json
{
  "analysis_settings": {
    "top_tier_percentage": 10,        // 최상위권 비율 (%)
    "min_activities_for_analysis": 5, // 최소 활동 수
    "thinking_time_weight": 0.3,      // 시간 가중치
    "accuracy_weight": 0.4,           // 정확도 가중치
    "consistency_weight": 0.3         // 일관성 가중치
  }
}
```

## 🔒 보안 고려사항

1. **데이터베이스 인증 정보 보호**
   - `config/database.config.json`을 `.gitignore`에 추가
   - 프로덕션 환경에서는 환경 변수 사용 권장

2. **읽기 전용 데이터베이스 사용자**
   - Moodle DB에 읽기 권한만 부여
   - 실수로 데이터 수정 방지

3. **네트워크 보안**
   - 프로덕션 환경에서는 HTTPS 사용
   - 방화벽으로 데이터베이스 접근 제한

## 🐛 문제 해결

### 데이터베이스 연결 실패
```
Error: Failed to connect to Moodle database
```
**해결 방법:**
- 데이터베이스 호스트, 포트, 인증 정보 확인
- MySQL 서버가 실행 중인지 확인
- 방화벽 설정 확인

### 분석 데이터 부족
```
Warning: No performance data available
```
**해결 방법:**
- 학생들이 퀴즈나 과제를 완료했는지 확인
- `min_activities_for_analysis` 설정 조정
- 코스 ID가 올바른지 확인

### 메모리 부족
```
MemoryError: Unable to allocate array
```
**해결 방법:**
- 활동 로그 제한 조정 (`limit` 파라미터)
- 학생을 그룹으로 나누어 분석
- 서버 메모리 증설

## 📈 성능 최적화

### 대규모 코스 분석

학생 수가 많은 코스의 경우:

1. **배치 처리 활성화**
```python
# analysis_pipeline.py에서 batch_size 조정
BATCH_SIZE = 50  # 50명씩 처리
```

2. **로그 제한**
```python
# 활동 로그를 최근 N개로 제한
activity_logs = connector.get_activity_logs(course_id, user_id, limit=200)
```

3. **캐싱 활용**
- 반복 분석 시 중간 결과 저장
- Redis 사용 권장

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- Issue 트래커에 문제 등록
- 프로젝트 문서 참조: `tasks/0001-prd-ai-education-pipeline.md`

## 🎓 관련 프로젝트

이 시스템은 **AI Education System Pipeline** 프로젝트의 일부입니다.
전체 시스템 문서는 `tasks/0001-prd-ai-education-pipeline.md`를 참조하세요.

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
