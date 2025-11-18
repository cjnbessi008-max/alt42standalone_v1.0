# Database Setup Guide

## 데이터베이스 스키마 설명

### 테이블 구조

#### 1. problems
부등식 문제를 저장하는 테이블
- `id`: 문제 ID (자동 증가)
- `title`: 문제 제목
- `description`: 문제 설명
- `inequality`: 부등식 표현식 (예: "x > 2", "-3 <= x < 5")
- `moodle_id`: Moodle 문제 ID (연동용)
- `difficulty_level`: 난이도 (1-5)
- `created_at`, `updated_at`: 생성/수정 시간

#### 2. students
학생 정보 테이블
- `id`: 학생 ID
- `name`: 학생 이름
- `email`: 이메일
- `moodle_user_id`: Moodle 사용자 ID
- `grade_level`: 학년

#### 3. student_attempts
학생의 문제 풀이 시도 기록
- `id`: 시도 ID
- `student_id`: 학생 ID (외래키)
- `problem_id`: 문제 ID (외래키)
- `answer`: 학생 답변
- `is_correct`: 정답 여부
- `time_spent_seconds`: 소요 시간
- `attempt_number`: 시도 번호
- `attempted_at`: 시도 시간

#### 4. sessions
학습 세션 추적
- `id`: 세션 ID
- `student_id`: 학생 ID
- `started_at`, `ended_at`: 시작/종료 시간
- `problems_attempted`: 시도한 문제 수
- `problems_correct`: 정답 문제 수
- `total_time_seconds`: 총 소요 시간

#### 5. visualization_settings
학생별 시각화 설정
- `student_id`: 학생 ID
- `min_value`, `max_value`: 수직선 범위
- `resolution`: 해상도
- `light_color`: 빛 색상
- `background_color`: 배경 색상

### 뷰 (Views)

#### problem_statistics
문제별 통계 정보
- 총 시도 횟수
- 정답 횟수
- 정답률
- 평균 소요 시간

#### student_performance
학생별 성과 정보
- 시도한 문제 수
- 정답 수
- 정답률
- 평균 소요 시간

### 저장 프로시저 (Stored Procedures)

#### record_attempt
학생의 문제 풀이 시도를 기록

```sql
CALL record_attempt(student_id, problem_id, answer, is_correct, time_spent);
```

#### get_student_progress
학생의 학습 진행 상황 조회

```sql
CALL get_student_progress(student_id);
```

## 설치 방법

### 1. MySQL 데이터베이스 생성

```bash
mysql -u root -p < schema.sql
```

### 2. 환경 변수 설정

`backend/.env` 파일 생성:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=light_interval
```

### 3. 연결 테스트

백엔드 서버를 실행하면 자동으로 데이터베이스 연결을 테스트합니다.

```bash
cd backend
npm run dev
```

## 샘플 데이터

스키마 생성 시 자동으로 다음 샘플 데이터가 삽입됩니다:

- 7개의 샘플 문제 (난이도 1-4)
- 3명의 샘플 학생

## 쿼리 예제

### 문제 통계 조회
```sql
SELECT * FROM problem_statistics;
```

### 학생 성과 조회
```sql
SELECT * FROM student_performance;
```

### 특정 문제의 모든 시도 조회
```sql
SELECT
  s.name,
  sa.answer,
  sa.is_correct,
  sa.time_spent_seconds,
  sa.attempted_at
FROM student_attempts sa
JOIN students s ON sa.student_id = s.id
WHERE sa.problem_id = 1
ORDER BY sa.attempted_at DESC;
```

### 학생별 진행 상황
```sql
CALL get_student_progress(1);
```

## 유지보수

### 백업
```bash
mysqldump -u root -p light_interval > backup_$(date +%Y%m%d).sql
```

### 복원
```bash
mysql -u root -p light_interval < backup_20231218.sql
```

## Moodle 연동

Moodle에서 문제를 가져올 때 `moodle_id` 필드를 사용하여 중복을 방지합니다.

API 엔드포인트:
- `POST /api/moodle/sync/:quizId` - Moodle 퀴즈에서 문제 동기화
