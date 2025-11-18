# DMN Drift Quantification System

독립형 웹 애플리케이션으로 학습 중 학생의 집중력 저하(DMN Drift)를 정량화하고 실시간 피드백을 제공하는 시스템입니다.

## 🎯 주요 기능

### 1. DMN Drift 정량화
- **응답 시간 패턴 분석**: 문제 해결 시간의 변화 추적
- **정답률 추이**: 시간에 따른 정확도 변화 모니터링
- **클릭/인터랙션 패턴**: 마우스 움직임, 클릭 빈도 분석
- **비활동 시간 감지**: 5초 이상 무응답 자동 감지
- **포커스 손실 추적**: 탭 전환, 창 전환 횟수 기록
- **스크롤 패턴 분석**: 비정상적인 스크롤 행동 감지

### 2. Moodle LMS 통합
- **LTI 1.3 표준 지원**: Moodle과 seamless 연동
- **자동 학생 동기화**: Moodle 사용자 자동 가져오기
- **성적 연동**: 학습 진도 및 성과 자동 전송
- **SSO 인증**: Moodle 계정으로 로그인

### 3. 실시간 모니터링
- **실시간 대시보드**: 학생 참여도 실시간 추적
- **자동 알림**: 집중력 저하 시 자동 경고
- **개입 권장**: AI 기반 교사 개입 추천

### 4. 교사 피드백 시스템
- **시각화 대시보드**: 학생별 트렌드 차트
- **개입 메시지**: 학생에게 실시간 메시지 전송
- **성과 분석**: 종합 통계 및 인사이트

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              React Frontend (TypeScript)                     │
│  Student View | Teacher Dashboard | Real-time Monitor       │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────────┐
│                PHP 7.1.9 Backend                             │
│  Sessions API | Events API | Metrics API | LTI API          │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                    MySQL 5.7 Database                        │
│  Students | Sessions | Events | Metrics | Interventions     │
└──────────────────────────────────────────────────────────────┘
```

## 📊 DMN Drift 계산 알고리즘

### 복합 지표 (0-100점)

```
DMN Drift Score =
  (응답시간 점수 × 25%) +
  (정확도 점수 × 30%) +
  (인터랙션 점수 × 20%) +
  (포커스 점수 × 15%) +
  (휴지 점수 × 10%)
```

### 등급 분류
- **Low (0-40)**: 정상 집중 상태
- **Moderate (40-60)**: 경미한 집중력 저하
- **High (60-80)**: 심각한 집중력 저하, 개입 필요
- **Critical (80-100)**: 즉각적인 휴식 권장

## 🚀 설치 및 실행

### 사전 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Node.js 18 이상
- Composer (PHP 패키지 관리자)

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE dmn_drift_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 적용
mysql -u root -p dmn_drift_tracker < database/schema.sql
```

### 2. 백엔드 설정

```bash
cd backend

# 환경 설정 파일 생성
cp config/.env.example config/.env

# .env 파일 수정 (데이터베이스 정보 입력)
nano config/.env
```

**config/.env 예시:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dmn_drift_tracker
DB_USER=root
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_LTI_KEY=your_lti_key
MOODLE_LTI_SECRET=your_lti_secret
```

### 3. PHP 개발 서버 실행

```bash
cd backend
php -S localhost:8000 -t api
```

### 4. 프론트엔드 설정 및 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
echo "VITE_API_URL=http://localhost:8000/api" > .env

# 개발 서버 실행
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

## 📡 API 엔드포인트

### Sessions API
```
POST   /api/sessions                    # 새 세션 생성
GET    /api/sessions/{id}               # 세션 조회
GET    /api/sessions/student/{id}       # 학생의 모든 세션
PUT    /api/sessions/{id}               # 세션 업데이트
POST   /api/sessions/{id}/end           # 세션 종료
```

### Events API
```
POST   /api/events                      # 이벤트 추적
POST   /api/events/batch                # 배치 이벤트 추적
GET    /api/events/session/{id}         # 세션 이벤트 조회
```

### Metrics API
```
POST   /api/metrics/calculate/{id}      # DMN 메트릭 계산
GET    /api/metrics/session/{id}        # 세션 메트릭 조회
GET    /api/metrics/session/{id}/latest # 최신 메트릭
GET    /api/metrics/student/{id}        # 학생 전체 메트릭
```

### LTI API
```
POST   /api/lti/launch                  # Moodle LTI 런치
POST   /api/lti/grade                   # 성적 전송
```

## 🔧 Moodle 통합 설정

### 1. Moodle에서 External Tool 설정

1. **사이트 관리 > 플러그인 > 활동 모듈 > External Tool**
2. **"Manage tools" 클릭**
3. **"Configure a tool manually" 클릭**

### 2. LTI 설정 정보

```
Tool Name: DMN Drift Tracker
Tool URL: http://your-domain.com/api/lti/launch
Consumer Key: your_lti_consumer_key
Shared Secret: your_lti_shared_secret
```

### 3. 권한 설정
- ✅ Accept grades from the tool
- ✅ Force SSL
- ✅ Share launcher's name with tool
- ✅ Share launcher's email with tool

## 🎨 프론트엔드 컴포넌트

### DmnDriftMonitor
실시간 학생 집중도 모니터링 컴포넌트

```tsx
import DmnDriftMonitor from './components/DmnDriftMonitor';

<DmnDriftMonitor
  sessionId={sessionId}
  refreshInterval={30000}  // 30초마다 업데이트
  onInterventionNeeded={(metrics) => {
    // 개입 필요 시 콜백
    console.log('Intervention needed!', metrics);
  }}
/>
```

### TeacherDashboard
교사용 종합 대시보드

```tsx
import TeacherDashboard from './pages/TeacherDashboard';

<TeacherDashboard studentId={studentId} />
```

### EventTracker
자동 이벤트 추적 유틸리티

```tsx
import eventTracker from './utils/eventTracker';

// 세션 시작 시 초기화
eventTracker.initialize(sessionId, studentId);

// 답안 제출 시
eventTracker.trackAnswerSubmit(problemId, isCorrect, responseTime);

// 컴포넌트 언마운트 시
useEffect(() => {
  return () => eventTracker.cleanup();
}, []);
```

## 📈 데이터베이스 스키마

### 주요 테이블

#### students
학생 정보 저장
```sql
- id (Primary Key)
- moodle_user_id (Unique)
- username, email, full_name
- grade_level
- created_at, updated_at
```

#### learning_sessions
학습 세션 추적
```sql
- id (Primary Key)
- student_id (Foreign Key)
- module_name
- session_start, session_end
- dmn_drift_score
- status (active/completed/abandoned)
```

#### interaction_events
모든 학생 인터랙션 기록
```sql
- id (Primary Key)
- session_id, student_id
- event_type (click/scroll/focus_loss 등)
- event_data (JSON)
- timestamp
```

#### dmn_drift_metrics
계산된 DMN drift 메트릭
```sql
- id (Primary Key)
- session_id, student_id
- avg_response_time_ms
- accuracy_rate
- click_frequency
- dmn_drift_score
- drift_level
- recommended_action
```

## 🔒 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 모든 출력 데이터 이스케이프
3. **CSRF 방지**: API 토큰 검증
4. **OAuth 서명**: LTI 런치 시 서명 검증
5. **데이터 암호화**: 민감 정보 암호화 저장

## 🧪 테스트

### 백엔드 테스트
```bash
# 세션 생성 테스트
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "module_name": "Test Module"}'

# 메트릭 계산 테스트
curl -X POST http://localhost:8000/metrics/calculate/1
```

### 프론트엔드 테스트
```bash
cd frontend
npm run test
```

## 📝 사용 시나리오

### 학생 사용 흐름
1. Moodle에서 LTI 활동 클릭
2. 자동으로 DMN Tracker 앱 실행
3. 학습 활동 중 자동으로 인터랙션 추적
4. 실시간으로 집중도 모니터링
5. 집중력 저하 시 알림 수신
6. 세션 종료 시 성적 Moodle로 자동 전송

### 교사 사용 흐름
1. 교사 대시보드 접속
2. 학생별 실시간 집중도 확인
3. 집중력 저하 학생에게 개입 메시지 전송
4. 장기 트렌드 분석 및 인사이트 획득

## 🛠️ 개발 로드맵

### Phase 1 (완료) ✅
- [x] 데이터베이스 스키마 설계
- [x] PHP 백엔드 API 구현
- [x] DMN Drift 계산 알고리즘
- [x] Moodle LTI 통합
- [x] React 프론트엔드
- [x] 실시간 모니터링
- [x] 교사 대시보드

### Phase 2 (예정)
- [ ] 자동 개입 시스템
- [ ] 머신러닝 기반 예측
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 (영어, 한국어)

### Phase 3 (계획)
- [ ] 고급 분석 도구
- [ ] A/B 테스트 기능
- [ ] 캔버스, 블랙보드 등 다른 LMS 통합

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 👥 팀

- **Backend Development**: PHP 7.1.9 + MySQL 5.7
- **Frontend Development**: React 18 + TypeScript
- **LMS Integration**: Moodle LTI 1.3

## 📞 지원

문제가 발생하거나 질문이 있으시면 Issue를 생성해주세요.

---

**Made with ❤️ for better student engagement tracking**
