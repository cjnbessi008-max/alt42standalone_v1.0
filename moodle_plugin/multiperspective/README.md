# Multi-Perspective Practice Module for Moodle

## 개요 (Overview)

Multi-Perspective Practice 모듈은 학생들이 문제를 여러 관점에서 바라보고 이해하는 연습을 제공하는 Moodle 활동 플러그인입니다.

The Multi-Perspective Practice module is a Moodle activity plugin that helps students explore and understand problems from multiple perspectives, encouraging deeper learning through different viewpoints.

## 주요 기능 (Key Features)

### 학생용 기능 (Student Features)
- 📊 **다양한 관점 제공**: 시각적, 대수적, 기하학적, 실생활 응용 등 여러 관점에서 문제 탐색
- 🔄 **관점 전환**: 자유롭게 다른 관점으로 전환하며 문제 이해
- ✅ **답안 제출**: 여러 관점 탐색 후 답안 제출
- 📈 **진도 추적**: 어떤 관점을 봤는지, 몇 번 시도했는지 추적
- 💡 **힌트 제공**: 각 관점별 힌트 제공
- 🖼️ **멀티미디어 지원**: 이미지, 동영상 등 다양한 형태의 자료 제공

### 교사용 기능 (Teacher Features)
- ✏️ **문제 생성**: 다양한 유형의 문제 생성 (개방형, 선택형, 수치형)
- 🎯 **관점 관리**: 각 문제에 대해 여러 관점 추가 및 관리
- ⚙️ **설정 제어**: 최소 관점 개수, 시도 횟수 등 세부 설정
- 📊 **분석 리포트**: 학생들의 학습 패턴 및 관점 활용도 분석
- 🎓 **자동 채점**: 수치형/선택형 문제 자동 채점
- 📝 **수동 채점**: 개방형 문제 수동 채점 지원

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.7 이상 (Moodle 3.7+)
- **PHP**: 7.1.9 이상 (PHP 7.1.9+)
- **MySQL**: 5.7 이상 (MySQL 5.7+)
- **Browser**: 최신 버전의 Chrome, Firefox, Safari, Edge

## 설치 방법 (Installation)

### 1. 플러그인 다운로드
```bash
cd /path/to/moodle
mkdir -p mod/multiperspective
cp -r /path/to/plugin/* mod/multiperspective/
```

### 2. 권한 설정
```bash
chown -R www-data:www-data mod/multiperspective
chmod -R 755 mod/multiperspective
```

### 3. Moodle 관리자 페이지 접속
1. Moodle 사이트에 관리자로 로그인
2. "Site administration" → "Notifications" 접속
3. 플러그인 설치 진행

### 4. 데이터베이스 테이블 생성 확인
설치 과정에서 다음 테이블들이 자동으로 생성됩니다:
- `mdl_multiperspective` - 활동 인스턴스
- `mdl_multiperspective_problems` - 문제
- `mdl_multiperspective_persp` - 관점
- `mdl_multiperspective_attempts` - 학생 시도
- `mdl_multiperspective_views` - 관점 조회 기록

## 사용 방법 (Usage Guide)

### 교사용 가이드 (Teacher Guide)

#### 1. 활동 생성
1. 코스 페이지에서 "Add an activity or resource" 클릭
2. "Multi-Perspective Practice" 선택
3. 활동 이름 및 설정 입력:
   - **Activity name**: 활동 이름
   - **Minimum perspectives required**: 학생이 답안 제출 전 봐야 하는 최소 관점 개수
   - **Require all perspectives**: 모든 관점을 봐야 제출 가능하도록 설정
   - **Allow retry**: 재시도 허용 여부
   - **Maximum attempts**: 최대 시도 횟수 (0 = 무제한)

#### 2. 문제 추가
1. 생성된 활동에서 "Manage problems" 클릭
2. "Add problem" 클릭
3. 문제 정보 입력:
   - **Problem title**: 문제 제목
   - **Problem statement**: 문제 설명
   - **Problem type**: 문제 유형 (개방형/선택형/수치형)
   - **Correct answer**: 정답 (선택사항)
   - **Difficulty level**: 난이도 (1-5)

#### 3. 관점 추가
1. 문제 편집 페이지에서 "Add perspective" 클릭
2. 관점 정보 입력:
   - **Perspective name**: 관점 이름 (예: "시각적 표현", "대수적 접근")
   - **Perspective type**: 관점 유형 선택
   - **Content**: 해당 관점에서 본 문제 설명
   - **Hints**: 힌트 (선택사항)
   - **Media URL**: 이미지/동영상 URL (선택사항)

#### 4. 학생 진도 확인
1. "Reports" 메뉴 클릭
2. 학생별 시도 횟수, 점수, 관점 활용도 확인

### 학생용 가이드 (Student Guide)

#### 1. 문제 풀이
1. 활동에 접속하여 문제 목록 확인
2. 풀고 싶은 문제 클릭

#### 2. 관점 탐색
1. 상단의 탭을 클릭하여 다른 관점으로 전환
2. 각 관점에서 문제를 어떻게 바라볼 수 있는지 학습
3. 필요시 힌트 버튼 클릭

#### 3. 답안 제출
1. 요구된 최소 관점 개수 이상 탐색
2. 답안 입력란에 답 작성
3. "Submit answer" 클릭
4. 즉시 피드백 확인 (자동 채점 문제의 경우)

## 관점 유형 (Perspective Types)

1. **Visual/Graphical (시각적/그래픽)**: 그래프, 다이어그램, 그림을 통한 표현
2. **Algebraic/Symbolic (대수적/기호)**: 수식, 방정식을 통한 표현
3. **Geometric (기하학적)**: 도형, 공간적 관계를 통한 표현
4. **Real-world Application (실생활 응용)**: 실제 상황에 적용한 예시
5. **Conceptual Understanding (개념적 이해)**: 기본 개념과 원리 설명
6. **Numerical/Computational (수치적/계산)**: 구체적인 수치 계산 과정

## 문제 유형 (Problem Types)

1. **Open-ended (개방형)**: 서술형 답안, 수동 채점 필요
2. **Multiple choice (선택형)**: 정답 선택, 자동 채점
3. **Numeric (수치형)**: 숫자 답안, 자동 채점 (오차 허용 범위: ±0.01)

## 예시 활용 사례 (Example Use Cases)

### 분수 학습
**문제**: "1/2 + 1/3 = ?"

- **시각적 관점**: 원 그래프로 분수 표현, 색칠된 영역 합치기
- **대수적 관점**: 통분 과정을 수식으로 표현
- **실생활 관점**: 피자 두 조각 합치기 문제로 표현
- **수치적 관점**: 소수로 변환하여 계산

### 기하학 문제
**문제**: "삼각형의 넓이 구하기"

- **기하학적 관점**: 도형 그림과 높이, 밑변 표시
- **대수적 관점**: 넓이 공식 (1/2 × 밑변 × 높이)
- **시각적 관점**: 삼각형을 직사각형의 절반으로 표현
- **실생활 관점**: 땅의 면적 측정 문제

## 데이터베이스 스키마 (Database Schema)

```sql
-- Main activity table
CREATE TABLE mdl_multiperspective (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    intro TEXT NOT NULL,
    min_perspectives INT DEFAULT 2,
    require_all_perspectives TINYINT DEFAULT 0,
    allow_retry TINYINT DEFAULT 1,
    max_attempts INT DEFAULT 0,
    grade INT DEFAULT 100,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- Problems table
CREATE TABLE mdl_multiperspective_problems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    multiperspectiveid BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    correct_answer TEXT,
    difficulty_level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);

-- Perspectives table
CREATE TABLE mdl_multiperspective_persp (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problemid BIGINT NOT NULL,
    perspective_name VARCHAR(100) NOT NULL,
    perspective_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    content_format INT DEFAULT 1,
    hints TEXT,
    media_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    timecreated BIGINT NOT NULL
);

-- Student attempts table
CREATE TABLE mdl_multiperspective_attempts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    multiperspectiveid BIGINT NOT NULL,
    problemid BIGINT NOT NULL,
    userid BIGINT NOT NULL,
    attempt_number INT DEFAULT 1,
    answer TEXT NOT NULL,
    is_correct TINYINT DEFAULT 0,
    score DECIMAL(10,5) DEFAULT 0,
    perspectives_viewed TEXT,
    time_spent INT DEFAULT 0,
    feedback TEXT,
    timecreated BIGINT NOT NULL
);

-- Perspective views tracking table
CREATE TABLE mdl_multiperspective_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problemid BIGINT NOT NULL,
    perspectiveid BIGINT NOT NULL,
    userid BIGINT NOT NULL,
    view_count INT DEFAULT 1,
    time_spent INT DEFAULT 0,
    first_viewed BIGINT NOT NULL,
    last_viewed BIGINT NOT NULL
);
```

## 권한 (Capabilities)

- `mod/multiperspective:addinstance` - 활동 추가
- `mod/multiperspective:view` - 활동 보기
- `mod/multiperspective:submit` - 답안 제출
- `mod/multiperspective:manage` - 문제 관리
- `mod/multiperspective:viewreports` - 리포트 보기
- `mod/multiperspective:viewallreports` - 모든 학생 리포트 보기

## 문제 해결 (Troubleshooting)

### 플러그인이 목록에 나타나지 않음
```bash
# 캐시 삭제
php admin/cli/purge_caches.php
```

### 데이터베이스 오류
```bash
# 데이터베이스 업그레이드 강제 실행
php admin/cli/upgrade.php
```

### 파일 권한 문제
```bash
# 올바른 권한 설정
chown -R www-data:www-data mod/multiperspective
chmod -R 755 mod/multiperspective
```

## 기술 지원 (Support)

문제가 발생하거나 제안사항이 있으시면:
- KAIST Touch Math Academy 연락
- Moodle 로그 확인: Site administration → Reports → Logs

## 라이선스 (License)

This plugin is licensed under the GNU General Public License v3.0 or later.

## 개발자 정보 (Developer Information)

- **Package**: mod_multiperspective
- **Copyright**: 2025 KAIST Touch Math Academy
- **Version**: 1.0
- **Moodle Version**: 3.7+

## 향후 개선 계획 (Future Enhancements)

- [ ] 실시간 협업 기능
- [ ] AI 기반 관점 추천
- [ ] 학습 분석 대시보드 강화
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 확대
- [ ] LTI 연동 지원
- [ ] 게임화 요소 추가

## 변경 이력 (Changelog)

### Version 1.0 (2025-11-18)
- 초기 릴리스
- 기본 기능 구현: 문제 생성, 관점 관리, 학생 답안 제출
- 자동 채점 기능
- 진도 추적 기능
- 통계 및 리포트 기능
