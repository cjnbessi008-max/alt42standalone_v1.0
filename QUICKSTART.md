# 빠른 시작 가이드

## 5분 안에 시작하기

### 1단계: 설치 (1분)
```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 의존성 설치
pip install -r requirements.txt
```

### 2단계: 설정 (2분)
```bash
# 설정 파일 복사
cp config/database.config.example.json config/database.config.json

# 텍스트 에디터로 설정 파일 편집
nano config/database.config.json
```

**필수 수정 항목:**
- `host`: Moodle 데이터베이스 호스트
- `user`: 데이터베이스 사용자명
- `password`: 데이터베이스 비밀번호
- `database`: Moodle 데이터베이스 이름

### 3단계: 실행 (2분)

#### 옵션 A: 웹 인터페이스 (권장)
```bash
cd webapp
python app.py
```
브라우저에서 `http://localhost:5000` 접속

#### 옵션 B: 커맨드 라인
```bash
cd backend
python analysis_pipeline.py --course-id 1
```

## 첫 분석 실행

### 웹 인터페이스 사용
1. 브라우저에서 홈페이지 열기
2. Moodle 코스 ID 입력 (예: 1)
3. "분석 시작" 버튼 클릭
4. 완료되면 "결과 보기" 클릭

### 커맨드 라인 사용
```bash
# 전체 코스 분석
python analysis_pipeline.py --course-id 1

# 특정 학생 분석
python analysis_pipeline.py --course-id 1 --user-id 42

# 결과 확인
ls ../output/
```

## 결과 확인

### 생성되는 파일들
```
output/
├── course_1_summary_20251118_140530.json       # 전체 요약
├── course_1_detailed_reports_20251118_140530.json  # 상세 리포트
└── course_1_deviations_20251118_140530.csv     # CSV (엑셀로 열람 가능)
```

### CSV 파일 열기
1. Excel, Google Sheets, 또는 LibreOffice Calc에서 열기
2. 학생별 편차 점수 확인
3. 정렬 및 필터링으로 분석

## 다음 단계

### 더 자세한 분석
- **대시보드**: 웹에서 `/dashboard` 접속
- **학생 상세**: 특정 학생의 개선 방안 확인
- **CSV 내보내기**: 스프레드시트로 추가 분석

### 설정 조정
`config/database.config.json`에서:
- `top_tier_percentage`: 최상위권 비율 (기본: 10%)
- `min_activities_for_analysis`: 최소 활동 수 (기본: 5)

### 문제 해결
**연결 오류가 발생하면:**
1. MySQL 서버가 실행 중인지 확인
2. 데이터베이스 인증 정보 확인
3. 방화벽 설정 확인

**분석 결과가 없으면:**
1. 학생들이 활동을 완료했는지 확인
2. 코스 ID가 올바른지 확인
3. Moodle 버전 호환성 확인 (3.7+ 지원)

## 추가 도움말
- 📖 전체 문서: `README.md`
- 🏗️ 프로젝트 구조: `tasks/0001-prd-ai-education-pipeline.md`
- 🐛 문제 보고: GitHub Issues

---

**즐거운 분석 되세요! 🎓**
