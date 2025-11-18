# Step Detection LMS - 프로젝트 요약

## 📋 프로젝트 개요

**이름**: Step Detection LMS
**목적**: Moodle 3.7 LMS와 연동하여 학생들이 수학 문제를 풀 때 논리적 중간단계를 건너뛰었는지 탐지하는 독립형 웹 애플리케이션

**기술 스택**:
- Backend: PHP 7.1.9
- Database: MySQL 5.7
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Integration: Moodle 3.7 Web Services

---

## 🎯 핵심 기능

### 1. 단계별 문제 풀이 추적
- 학생이 각 문제의 모든 중간 단계를 순서대로 입력
- 각 단계별 소요 시간, 정확성, 힌트 사용 여부 실시간 기록
- 타이머 기반 진행 상황 모니터링

### 2. 건너뛰기 탐지 알고리즘 (4가지)

#### a) 시간 이상 탐지 (Time Anomaly Detection)
- **목적**: 비정상적으로 빠른 문제 해결 탐지
- **방법**:
  - 문제별 평균 소요 시간 대비 현재 학생의 시간 비교
  - 임계값: 평균의 50% 이하 시간 소요 시 의심
  - 균일한 타이밍 패턴 검사 (모든 단계를 동일한 시간에 완료)
- **신뢰도**: 70-95% (속도 비율과 패턴에 따라 조정)

#### b) 논리적 불일치 탐지 (Logical Inconsistency Detection)
- **목적**: 단계 간 논리적 연결 오류 탐지
- **방법**:
  - 이전 단계의 출력과 다음 단계의 입력 일치성 검증
  - 예: 통분 단계에서 4/6 입력 → 다음 단계에서 2/3 사용 (불일치)
- **신뢰도**: 70-95% (불일치 개수에 따라 조정)

#### c) 순서 위반 탐지 (Sequence Violation Detection)
- **목적**: 필수 단계 건너뛰기 탐지
- **방법**:
  - 문제별로 정의된 필수 단계 목록과 실제 완료 단계 비교
  - 건너뛴 필수 단계 식별
- **신뢰도**: 90% (명확한 위반이므로 높은 신뢰도)

#### d) 힌트 의존도 탐지 (Hint Dependency Detection)
- **목적**: 과도한 힌트 의존 탐지
- **방법**:
  - 전체 단계 중 힌트 사용 비율 계산
  - 임계값: 70% 이상 힌트 사용 시 의존적으로 판단
  - 힌트 확인 후 즉시 정답 입력 패턴 분석 (15초 이내)
- **신뢰도**: 60-95% (힌트 사용 패턴에 따라 조정)

### 3. 신뢰도 점수 시스템
- 0-100점 척도의 신뢰도 점수 산출
- 각 탐지 유형의 심각도에 따라 페널티 부과:
  - Critical: -40점
  - High: -25점
  - Medium: -15점
  - Low: -5점
- 탐지 신뢰도에 따라 페널티 조정

### 4. 교사 대시보드
- 전체 학생 현황 (총 학생, 제출 풀이, 탐지율, 평균 신뢰도)
- 학생별 신뢰도 프로필 및 패턴 분석
- 탐지 유형별 통계 및 시각화
- 학생별 상세 풀이 과정 리플레이
- 의심스러운 풀이 검토 및 관리

### 5. Moodle 연동
- Moodle 사용자 동기화
- 성적 자동 전송 (Grade Book 연동)
- 학습 활동 로그 전송
- Web Service API를 통한 양방향 통신

---

## 🗄️ 데이터베이스 구조

### 주요 테이블 (15개)

1. **students**: 학생 정보 (Moodle 사용자 ID 포함)
2. **teachers**: 교사 정보
3. **problem_types**: 문제 유형 정의 (분수, 방정식, 도형 등)
4. **problems**: 문제 정의
5. **problem_steps**: 문제별 단계 정의
6. **student_solutions**: 학생 풀이 세션
7. **step_submissions**: 단계별 제출 기록
8. **skip_detections**: 건너뛰기 탐지 결과
9. **student_trust_profiles**: 학생별 신뢰도 프로필
10. **problem_statistics**: 문제별 통계
11. **moodle_sync_log**: Moodle 연동 로그
12. **system_settings**: 시스템 설정

---

## 📁 프로젝트 구조

```
step-detection-lms/
├── config/                  # 설정 파일
│   ├── config.php          # 앱 설정
│   └── database.php        # DB 연결
├── database/               # 데이터베이스
│   ├── schema.sql          # 스키마 정의
│   └── sample_data.sql     # 샘플 데이터
├── docs/                   # 문서
│   └── API.md              # API 문서
├── public/                 # 웹 루트
│   ├── index.php           # 메인 엔트리 포인트
│   ├── student.html        # 학생 UI
│   ├── teacher.html        # 교사 대시보드
│   ├── css/
│   │   └── style.css       # 스타일시트
│   └── js/
│       ├── app.js          # 학생 앱 로직
│       └── teacher.js      # 교사 대시보드 로직
├── src/                    # 소스 코드
│   ├── controllers/        # API 컨트롤러
│   │   ├── ProblemController.php
│   │   ├── SolutionController.php
│   │   ├── DetectionController.php
│   │   └── StudentController.php
│   ├── models/             # 데이터 모델
│   │   ├── Problem.php
│   │   └── Solution.php
│   └── services/           # 비즈니스 로직
│       ├── SkipDetectionService.php
│       └── MoodleIntegration.php
├── .env.example            # 환경 변수 예제
├── .gitignore              # Git 제외 파일
├── INSTALL.md              # 설치 가이드
└── README.md               # 프로젝트 소개
```

---

## 🔌 API 엔드포인트

### Problems
- `GET /api/v1/problems` - 문제 목록
- `GET /api/v1/problems/{id}` - 문제 상세
- `GET /api/v1/problem-types` - 문제 유형

### Solutions
- `POST /api/v1/solutions/start` - 풀이 시작
- `POST /api/v1/solutions/submit-step` - 단계 제출
- `POST /api/v1/solutions/submit-final` - 최종 제출
- `POST /api/v1/solutions/hint` - 힌트 보기
- `GET /api/v1/solutions/{id}` - 풀이 상세

### Detections
- `GET /api/v1/detections/solution/{id}` - 풀이별 탐지
- `GET /api/v1/detections/student/{id}` - 학생별 탐지
- `POST /api/v1/detections/analyze/{id}` - 재분석

### Students
- `GET /api/v1/students` - 학생 목록
- `GET /api/v1/students/{id}` - 학생 상세
- `GET /api/v1/students/{id}/trust-profile` - 신뢰도 프로필

---

## 🚀 설치 및 실행

### 1. 시스템 요구사항
- PHP 7.1.9+
- MySQL 5.7+
- Apache/Nginx with mod_rewrite

### 2. 설치 단계
```bash
# 1. 데이터베이스 생성
mysql -u root -p
CREATE DATABASE step_detection_lms CHARACTER SET utf8mb4;

# 2. 스키마 적용
mysql -u root -p step_detection_lms < database/schema.sql

# 3. 샘플 데이터 로드 (선택)
mysql -u root -p step_detection_lms < database/sample_data.sql

# 4. 환경 설정
cp .env.example .env
nano .env  # DB 정보 입력

# 5. 웹 서버 설정 (Apache)
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 3. 접속
- 학생: `http://your-domain.com/`
- 교사: `http://your-domain.com/teacher`

상세 설치 가이드: [INSTALL.md](INSTALL.md)

---

## 📊 탐지 알고리즘 성능 지표

### 탐지 정확도 목표
- **시간 이상**: 85% 정확도
- **논리적 불일치**: 90% 정확도
- **순서 위반**: 95% 정확도 (명확한 위반)
- **힌트 의존**: 75% 정확도

### 거짓 양성(False Positive) 최소화
- 다중 탐지 알고리즘 사용으로 교차 검증
- 신뢰도 점수를 통한 가중치 적용
- 교사의 최종 검토를 통한 확정

---

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: 모든 출력 데이터 이스케이프
3. **인증**: JWT 토큰 기반 (프로덕션 환경)
4. **데이터 암호화**: 민감 정보 AES-256 암호화
5. **CORS**: 허용된 도메인만 접근 가능

---

## 📈 향후 개발 계획

### Phase 1 (완료)
- ✅ 기본 문제 풀이 시스템
- ✅ 4가지 탐지 알고리즘
- ✅ 교사 대시보드
- ✅ Moodle 연동

### Phase 2 (계획)
- [ ] AI/ML 기반 패턴 학습 (정상 vs 비정상)
- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 버전
- [ ] 다국어 지원 확장

### Phase 3 (계획)
- [ ] 음성/비디오 녹화 연동
- [ ] 눈동자 추적 (시선 분석)
- [ ] 고급 통계 및 리포팅
- [ ] 다른 과목 지원 확장

---

## 🤝 기여 방법

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 라이선스

MIT License

---

## 👥 개발자

KAIST Touch Math Academy Development Team

---

## 📞 지원 및 문의

- GitHub Issues: [프로젝트 이슈](https://github.com/your-repo/issues)
- Email: support@example.com
- 문서: [API 문서](docs/API.md), [설치 가이드](INSTALL.md)

---

**최종 업데이트**: 2025-11-18
**버전**: 1.0.0
**상태**: Production Ready
