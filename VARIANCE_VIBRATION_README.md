# Variance Vibration Feature Documentation

## 분산 진동 학습 시스템 (Variance Vibration Learning System)

**Alt42 Standalone v1.0 - Educational Platform Feature**

---

## 📋 개요 (Overview)

Variance Vibration은 통계학의 분산(Variance) 개념을 촉각적 피드백과 시각적 표현을 통해 학습할 수 있는 혁신적인 교육 기능입니다. 데이터의 분산이 클수록 스마트폰 화면의 진동이 강해지는 직관적인 학습 경험을 제공합니다.

This innovative educational feature teaches statistical variance through haptic feedback and visual representation. As the variance of data increases, the smartphone screen vibration intensifies, providing an intuitive learning experience.

---

## 🎯 주요 기능 (Key Features)

### 1. **분산 계산 및 시각화 (Variance Calculation & Visualization)**
- 실시간 분산 계산 (Real-time variance calculation)
- 평균, 표준편차, 범위 등 통계 정보 표시 (Display mean, standard deviation, range)
- 인터랙티브 캔버스 시각화 (Interactive canvas visualization)
- 데이터 포인트별 분산 기여도 색상 표시 (Color-coded variance contribution per data point)

### 2. **진동 피드백 시스템 (Vibration Feedback System)**
- 분산 값에 비례한 진동 강도 (1-10) (Vibration intensity proportional to variance)
- 3가지 진동 패턴: 연속, 펄스, 점진적 (3 vibration patterns: continuous, pulsed, progressive)
- 정규화된 분산 사용으로 일관된 경험 (Normalized variance for consistent experience)
- 디바이스 진동 지원 자동 감지 (Automatic vibration support detection)

### 3. **Moodle LMS 연동 (Moodle LMS Integration)**
- Moodle 3.7 데이터베이스 통합 (Moodle 3.7 database integration)
- 문제 자동 가져오기 (Automatic problem import)
- 학생 제출 추적 (Student submission tracking)
- 성능 분석 및 통계 (Performance analytics and statistics)

### 4. **가상 스마트폰 UI (Virtual Smartphone UI)**
- 우측 하단 고정 위치 (Fixed position: bottom-right corner)
- 360px 스마트폰 프레임 디자인 (360px smartphone frame design)
- 상태 바, 시간, 배터리 표시 (Status bar with time and battery)
- 반응형 디자인 (Responsive design)

### 5. **다국어 지원 (Multilingual Support)**
- 한국어 / 영어 완전 지원 (Full Korean / English support)
- 문제, 힌트, 피드백 이중 언어 (Bilingual problems, hints, feedback)

---

## 🏗️ 아키텍처 (Architecture)

### Frontend (React + TypeScript)
```
frontend/src/
├── components/
│   └── VarianceVibration.tsx          # Main React component
│   └── VarianceVibration.css          # Smartphone UI styles
└── utils/
    ├── VarianceCalculator.ts           # Variance calculation utilities
    └── VarianceVibrationHandler.ts     # Vibration mapping logic
```

### Backend (PHP 7.1.9 + Python 3.8+)
```
src/Services/
└── VarianceVibrationService.php       # PHP service for Moodle integration

backend/services/
└── variance_vibration_service.py      # Python service for advanced features

public/
└── variance_api.php                   # RESTful API endpoints
```

### Database (MySQL 5.7)
```
database/schema/
└── variance_vibration.sql             # Complete database schema
```

---

## 📊 데이터베이스 스키마 (Database Schema)

### 1. `variance_problems` 테이블
문제 정보 저장 (Stores variance problems)

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | 문제 고유 ID (Problem unique ID) |
| question_text | TEXT | 문제 설명 (영어) (Problem description - English) |
| question_text_ko | TEXT | 문제 설명 (한국어) (Problem description - Korean) |
| data_set | JSON | 계산할 데이터 배열 (Data array for calculation) |
| is_sample | BOOLEAN | 표본 분산 여부 (Sample variance flag) |
| expected_variance | DECIMAL | 정답 분산 값 (Expected variance value) |
| hints | JSON | 힌트 배열 (영어) (Hints array - English) |
| hints_ko | JSON | 힌트 배열 (한국어) (Hints array - Korean) |
| category | VARCHAR | 문제 카테고리 (Problem category) |
| difficulty | ENUM | 난이도: easy, medium, hard (Difficulty level) |

### 2. `variance_submissions` 테이블
학생 제출 추적 (Tracks student submissions)

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | 제출 고유 ID (Submission unique ID) |
| problem_id | VARCHAR(36) | 문제 ID (Problem ID) |
| student_id | VARCHAR(100) | 학생 ID (Student ID) |
| submitted_answer | DECIMAL | 제출한 답 (Submitted answer) |
| is_correct | BOOLEAN | 정답 여부 (Correctness flag) |
| percent_error | DECIMAL | 오차율 (%) (Percent error) |
| vibration_intensity | INT | 진동 강도 (1-10) (Vibration intensity) |
| vibration_pattern | JSON | 진동 패턴 배열 (Vibration pattern array) |
| time_spent_seconds | INT | 소요 시간 (초) (Time spent in seconds) |

### 3. `variance_vibration_settings` 테이블
시스템 설정 (System configuration)

샘플 설정 포함 (Includes sample settings):
- `default_vibration_config`: 기본 진동 설정 (Default vibration configuration)
- `tolerance_settings`: 난이도별 오차 허용 범위 (Tolerance by difficulty)
- `vibration_patterns`: 사전 정의된 진동 패턴 (Predefined vibration patterns)
- `display_settings`: UI 표시 설정 (UI display settings)

---

## 🔧 설치 및 설정 (Installation & Setup)

### 1. 데이터베이스 설정 (Database Setup)

```bash
# MySQL에 로그인 (Login to MySQL)
mysql -u root -p

# 데이터베이스 생성 (Create database)
CREATE DATABASE alt42_variance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용 (Apply schema)
mysql -u root -p alt42_variance < database/schema/variance_vibration.sql
```

### 2. PHP 환경 설정 (PHP Configuration)

`.env` 파일 생성 (Create `.env` file):

```env
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=alt42_variance
MOODLE_DB_USER=your_username
MOODLE_DB_PASS=your_password
MOODLE_DB_PREFIX=mdl_
```

### 3. Frontend 설정 (Frontend Setup)

```bash
cd frontend
npm install
npm run build
```

### 4. 서버 시작 (Start Server)

```bash
# PHP 내장 서버 사용 (Use PHP built-in server)
cd public
php -S localhost:8000

# 또는 Apache/Nginx 설정 (Or configure Apache/Nginx)
```

---

## 📡 API 엔드포인트 (API Endpoints)

### Base URL: `http://localhost:8000/variance_api.php`

### 1. 문제 조회 (Get Problem)
```http
GET /problems/{problemId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sample_001",
    "questionText": "Calculate the sample variance...",
    "questionTextKo": "다음 시험 점수의 표본 분산을 계산하세요:",
    "dataSet": [85, 90, 78, 92, 88, 85, 95, 82],
    "isSample": true,
    "expectedVariance": 32.8571,
    "hints": ["First, calculate the mean...", "..."],
    "hintsKo": ["먼저 평균을 계산하세요...", "..."],
    "category": "test_scores",
    "difficulty": "easy"
  }
}
```

### 2. 카테고리별 문제 목록 (Get Problems by Category)
```http
GET /problems?category=test_scores&difficulty=easy&limit=10&offset=0
```

### 3. 분산 계산 (Calculate Variance)
```http
POST /calculate
Content-Type: application/json

{
  "values": [10, 12, 11, 13, 12, 10, 14, 11],
  "isSample": true,
  "useNormalizedVariance": true,
  "patternType": "progressive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "mean": 11.625,
      "variance": 2.267857,
      "standardDeviation": 1.506,
      "count": 8,
      "min": 10,
      "max": 14,
      "range": 4
    },
    "vibration": {
      "intensity": 3,
      "pattern": [65, 30, 95, 30, 125],
      "patternType": "progressive"
    }
  }
}
```

### 4. 답안 제출 (Submit Answer)
```http
POST /submit
Content-Type: application/json

{
  "problemId": "sample_001",
  "studentId": "student_123",
  "submittedAnswer": 32.85,
  "timeSpentSeconds": 120,
  "deviceInfo": {
    "browser": "Chrome",
    "vibrationSupported": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub_1234567890",
    "isCorrect": true,
    "percentError": 0.21,
    "expectedVariance": 32.8571,
    "vibrationIntensity": 5,
    "vibrationPattern": [80, 30, 110, 30, 140, 30, 170, 30, 200],
    "attemptNumber": 1
  }
}
```

### 5. 설정 조회 (Get Configuration)
```http
GET /config
```

---

## 💻 React 컴포넌트 사용법 (React Component Usage)

### 기본 사용 (Basic Usage)

```tsx
import VarianceVibration from './components/VarianceVibration';

function App() {
  return (
    <VarianceVibration
      problem={{
        id: 'sample_001',
        questionText: 'Calculate the variance...',
        dataSet: [10, 12, 11, 13, 12, 10, 14, 11],
        isSample: true,
        expectedVariance: 2.27,
        hints: ['Calculate mean first...'],
        category: 'basic_statistics'
      }}
      showStats={true}
      autoVibrate={true}
      onAnswerSubmit={(answer, isCorrect) => {
        console.log('Answer:', answer, 'Correct:', isCorrect);
      }}
      onVibrationTriggered={(result) => {
        console.log('Vibration:', result.intensity);
      }}
    />
  );
}
```

### 커스텀 모드 (Custom Mode)

```tsx
// 문제 없이 자유롭게 데이터 추가/제거 가능
// Free mode: add/remove data points freely
<VarianceVibration
  showStats={true}
  autoVibrate={true}
/>
```

---

## 🎨 UI 커스터마이징 (UI Customization)

### CSS 변수 오버라이드 (Override CSS Variables)

```css
.variance-vibration.smartphone-frame {
  /* 위치 변경 (Change position) */
  bottom: 50px;
  right: 30px;

  /* 크기 변경 (Change size) */
  width: 400px;

  /* 테마 색상 변경 (Change theme colors) */
  --primary-color: #667eea;
  --success-color: #4caf50;
  --error-color: #f44336;
}
```

### 진동 설정 커스터마이징 (Customize Vibration Settings)

```tsx
<VarianceVibration
  config={{
    minIntensity: 2,
    maxIntensity: 8,
    varianceThreshold: 50.0,
    useNormalizedVariance: true,
    patternType: 'pulsed',
    debounceMs: 500
  }}
/>
```

---

## 📈 진동 강도 매핑 (Vibration Intensity Mapping)

### 정규화 공식 (Normalization Formula)

```
CV (변동계수) = σ / μ
정규화 분산 = min(CV / 2.0, 1.0)
진동 강도 = minIntensity + (정규화 분산 × intensityRange)
```

### 강도 레벨 (Intensity Levels)

| Intensity | Description (KO) | Description (EN) | Vibration Pattern |
|-----------|------------------|------------------|-------------------|
| 1-2 | 매우 낮음 | Very Low | 65ms pulse |
| 3-4 | 낮음 | Low | 95ms pulse |
| 5-6 | 보통 | Medium | 125ms pulse |
| 7-8 | 높음 | High | 155ms pulse |
| 9-10 | 매우 높음 | Very High | 200ms pulse |

---

## 🧪 테스트 (Testing)

### 샘플 데이터로 테스트 (Test with Sample Data)

데이터베이스 스키마에는 5개의 샘플 문제가 포함되어 있습니다:
(The database schema includes 5 sample problems)

1. **sample_001**: 시험 점수 - 쉬움 (Test scores - Easy)
2. **sample_002**: 비즈니스 데이터 - 중간 (Business data - Medium)
3. **sample_003**: 스포츠 통계 - 중간 (Sports statistics - Medium)
4. **sample_004**: 기상 데이터 - 쉬움 (Weather data - Easy)
5. **sample_005**: 금융 데이터 - 어려움 (Financial data - Hard)

### API 테스트 (API Testing)

```bash
# 문제 조회 (Get problem)
curl http://localhost:8000/variance_api.php/problems/sample_001

# 분산 계산 (Calculate variance)
curl -X POST http://localhost:8000/variance_api.php/calculate \
  -H "Content-Type: application/json" \
  -d '{"values": [10, 12, 11, 13], "isSample": true}'

# 답안 제출 (Submit answer)
curl -X POST http://localhost:8000/variance_api.php/submit \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "sample_001",
    "studentId": "test_student",
    "submittedAnswer": 32.85,
    "timeSpentSeconds": 60
  }'
```

---

## 🔍 성능 분석 (Performance Analytics)

### 뷰를 통한 통계 확인 (Check Statistics via Views)

```sql
-- 문제별 성능 통계 (Problem performance statistics)
SELECT * FROM variance_problem_stats;

-- 학생 성능 분석 (Student performance analysis)
SELECT * FROM student_variance_performance;

-- 정답률 상위 문제 (Top problems by success rate)
SELECT id, category, difficulty, success_rate
FROM variance_problem_stats
ORDER BY success_rate DESC
LIMIT 10;
```

---

## 🌐 브라우저 호환성 (Browser Compatibility)

### 진동 API 지원 (Vibration API Support)

- ✅ Chrome/Edge (Android)
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ❌ Safari (iOS) - iOS는 Web Vibration API 미지원 (iOS doesn't support Web Vibration API)
- ❌ Desktop browsers - 대부분 미지원 (Most don't support vibration)

### 폴백 처리 (Fallback Handling)

진동이 지원되지 않는 경우 시각적 피드백으로 대체:
(Visual feedback fallback when vibration not supported)
- 화면 흔들림 애니메이션 (Screen shake animation)
- 색상 변화 (Color changes)
- 경고 메시지 표시 (Warning message display)

---

## 📚 학습 시나리오 (Learning Scenarios)

### 1. 기초 분산 학습 (Basic Variance Learning)
학생들이 데이터를 직접 추가/제거하며 분산이 어떻게 변하는지 체험
(Students add/remove data and experience how variance changes)

### 2. 문제 풀이 모드 (Problem Solving Mode)
Moodle에서 가져온 문제를 풀고 즉각적인 피드백 받기
(Solve problems from Moodle and get immediate feedback)

### 3. 비교 학습 (Comparative Learning)
표본 분산 vs 모집단 분산 차이 이해
(Understand difference between sample vs population variance)

### 4. 실생활 데이터 분석 (Real-world Data Analysis)
날씨, 주가, 성적 등 실제 데이터로 분산 계산
(Calculate variance with real data: weather, stocks, grades)

---

## 🛠️ 문제 해결 (Troubleshooting)

### 진동이 작동하지 않을 때 (Vibration Not Working)

1. **HTTPS 확인**: Web Vibration API는 HTTPS 필요
   (Check HTTPS: Web Vibration API requires HTTPS)

2. **브라우저 지원 확인**: Chrome Android 권장
   (Check browser support: Chrome Android recommended)

3. **디바이스 설정**: 무음 모드 또는 진동 비활성화 확인
   (Device settings: Check silent mode or vibration disabled)

4. **사용자 인터랙션**: 자동재생 정책으로 인해 사용자 클릭 후 작동
   (User interaction: Autoplay policy requires user click first)

### 데이터베이스 연결 오류 (Database Connection Error)

```bash
# .env 파일 확인 (Check .env file)
cat config/.env

# MySQL 연결 테스트 (Test MySQL connection)
mysql -h localhost -u your_user -p your_database
```

### API 404 오류 (API 404 Error)

```bash
# .htaccess 설정 확인 (Check .htaccess configuration)
# 또는 직접 URL 사용 (Or use direct URL)
http://localhost:8000/variance_api.php/problems/sample_001
```

---

## 📖 참고 자료 (References)

### 통계 공식 (Statistical Formulas)

**모집단 분산 (Population Variance):**
```
σ² = Σ(xᵢ - μ)² / N
```

**표본 분산 (Sample Variance):**
```
s² = Σ(xᵢ - x̄)² / (n - 1)
```

**변동계수 (Coefficient of Variation):**
```
CV = σ / μ
```

### 관련 기술 문서 (Related Documentation)

- [Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Moodle 3.7 Database Schema](https://docs.moodle.org/dev/Database_schema)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [PHP 7.1 Documentation](https://www.php.net/manual/en/)

---

## 👥 기여자 (Contributors)

Alt42 Education Platform Team

---

## 📄 라이선스 (License)

Copyright © 2024 Alt42 Standalone v1.0

---

## 🎓 교육적 가치 (Educational Value)

### 촉각 학습 (Haptic Learning)
진동을 통해 추상적인 통계 개념을 물리적으로 체험
(Experience abstract statistical concepts physically through vibration)

### 즉각적 피드백 (Immediate Feedback)
답변 제출 즉시 정오답 및 진동 피드백 제공
(Immediate correct/incorrect feedback with vibration upon submission)

### 시각화 학습 (Visual Learning)
데이터 포인트, 평균선, 분산 기여도를 색상과 그래프로 표현
(Represent data points, mean line, variance contribution with colors and graphs)

### 자기주도 학습 (Self-directed Learning)
학생들이 직접 데이터를 조작하며 분산의 변화 관찰
(Students manipulate data themselves and observe variance changes)

---

## 🚀 향후 계획 (Future Enhancements)

- [ ] AI 기반 문제 자동 생성 (AI-based automatic problem generation)
- [ ] 다변량 분산 분석 지원 (Multivariate variance analysis support)
- [ ] 음성 안내 추가 (Add voice guidance)
- [ ] 게임화 요소 (점수, 배지) (Gamification elements: scores, badges)
- [ ] 협업 학습 모드 (Collaborative learning mode)
- [ ] AR/VR 통합 (AR/VR integration)

---

**질문이나 이슈는 GitHub Issues에 등록해주세요.**
**For questions or issues, please register on GitHub Issues.**
