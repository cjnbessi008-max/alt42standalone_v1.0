# Sampling Game - Moodle Activity Module

통계 교육을 위한 인터랙티브 표본추출 게임 Moodle 플러그인

## 소개

**Sampling Game**은 학생들이 통계적 표본추출 방법을 재미있고 인터랙티브하게 배울 수 있도록 설계된 Moodle 활동 모듈입니다. 가상 스마트폰 인터페이스를 통해 다양한 표본추출 기법을 실습할 수 있습니다.

## 주요 기능

### 📱 가상 스마트폰 인터페이스
- 우측 하단에 표시되는 실제 스마트폰 화면 형태의 UI
- 모던한 그라디언트 디자인과 직관적인 인터페이스
- 반응형 디자인 지원 (데스크톱, 태블릿, 모바일)

### 📊 다양한 표본추출 방법 지원
1. **단순무작위추출 (Simple Random Sampling)**: 각 항목이 동일한 확률로 선택
2. **계통추출 (Systematic Sampling)**: 일정한 간격으로 항목 선택
3. **층화추출 (Stratified Sampling)**: 그룹별로 비례 추출
4. **집락추출 (Cluster Sampling)**: 전체 집락을 무작위로 선택

### 🎮 게임 시나리오
- **학생들 (Students)**: 교실 속 학생 아이콘
- **공들 (Balls)**: 다양한 색상의 공
- **사탕들 (Candies)**: 사탕 이모지
- **카드들 (Cards)**: 플레이 카드

### ⚙️ 설정 가능한 옵션
- 모집단 크기 (10-1000)
- 표본 크기
- 제한 시간 (선택사항)
- 표본추출 방법
- 게임 시나리오/테마

### 📈 성적 관리
- Moodle 성적부 자동 연동
- 여러 시도 허용 (최고 점수 기록)
- 자동 피드백 생성
- 시도 내역 확인 가능

## 기술 사양

### 요구사항
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 아키텍처
```
mod/samplinggame/
├── version.php           # 플러그인 버전 정보
├── lib.php              # 핵심 Moodle API 함수
├── view.php             # 메인 게임 뷰
├── index.php            # 코스 내 활동 목록
├── mod_form.php         # 활동 설정 폼
├── submit_attempt.php   # 시도 제출 API
├── db/
│   ├── install.xml      # 데이터베이스 스키마
│   └── access.php       # 권한 정의
├── lang/
│   ├── en/              # 영어 언어팩
│   └── ko/              # 한국어 언어팩
├── classes/
│   └── event/           # Moodle 이벤트
├── js/
│   └── samplinggame.js  # 게임 로직
├── css/
│   └── styles.css       # 스타일시트
└── pix/
    └── icon.png         # 플러그인 아이콘
```

## 설치 방법

### 1. 파일 복사
```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# samplinggame 모듈을 mod 디렉토리에 복사
cp -r /path/to/mod/samplinggame ./mod/

# 권한 설정 (웹 서버가 읽을 수 있도록)
chown -R www-data:www-data ./mod/samplinggame
```

### 2. Moodle 업그레이드
1. Moodle 관리자로 로그인
2. 사이트 관리 → 알림
3. "데이터베이스 업그레이드" 버튼 클릭
4. 설치 프로세스 완료

### 3. 플러그인 확인
- 사이트 관리 → 플러그인 → 활동 모듈
- "Sampling Game" 항목 확인

## 사용 방법

### 교사용 가이드

#### 1. 새 활동 추가
1. 코스 페이지에서 "활동 또는 자료 추가" 클릭
2. "Sampling Game" 선택
3. 설정 입력:
   - **게임 이름**: 활동 제목
   - **설명**: 학습 목표 및 지침
   - **모집단 크기**: 50-100 추천
   - **표본 크기**: 모집단의 10-20% 추천
   - **표본추출 방법**: 가르치고자 하는 방법 선택
   - **게임 시나리오**: 학생들에게 친숙한 테마 선택
   - **제한 시간**: (선택) 긴장감 추가를 위해 설정

#### 2. 권장 설정

**입문자용 (단순무작위추출)**
```
모집단 크기: 50
표본 크기: 10
표본추출 방법: 단순무작위추출
게임 시나리오: 학생들
제한 시간: 없음
```

**중급자용 (계통추출)**
```
모집단 크기: 100
표본 크기: 10
표본추출 방법: 계통추출
게임 시나리오: 공들
제한 시간: 3분
```

**고급자용 (층화추출)**
```
모집단 크기: 80
표본 크기: 16
표본추출 방법: 층화추출
게임 시나리오: 사탕들
제한 시간: 5분
```

#### 3. 학생 성적 확인
1. 활동 페이지 → 성적 보기
2. Moodle 성적부에서 확인
3. 각 학생의 시도 내역 및 최고 점수 확인

### 학생용 가이드

#### 1. 게임 시작
1. 코스 페이지에서 "Sampling Game" 활동 클릭
2. 지침과 표본추출 방법 설명 읽기
3. "게임 시작" 버튼 클릭

#### 2. 표본 선택
1. 화면에 표시된 모집단 항목 확인
2. 표본추출 방법에 따라 항목 클릭하여 선택
3. 선택한 항목은 분홍색으로 표시됨
4. 필요한 개수만큼 선택 (상단 카운터 확인)

#### 3. 제출 및 결과
1. 모든 표본 선택 완료 후 "제출" 버튼 클릭
2. 점수와 피드백 확인
3. 필요시 "다시 시작" 버튼으로 재시도

## 채점 알고리즘

### 단순무작위추출
- 선택된 표본의 분포 균등성 평가
- 너무 규칙적이거나 편향된 선택 감점

### 계통추출
- 선택 간격의 일관성 평가
- 이상적인 간격과의 편차에 따라 채점

### 층화추출
- 각 층(stratum)별 표본 비율 평가
- 비례 배분 준수 여부에 따라 채점

### 집락추출
- 연속된 클러스터 형성 여부 평가
- 분산된 선택보다 뭉친 선택에 높은 점수

## Moodle LMS 연동

### 데이터베이스 구조

#### samplinggame 테이블
```sql
- id: 활동 ID
- course: 코스 ID
- name: 활동 이름
- population_size: 모집단 크기
- sample_size: 표본 크기
- sampling_method: 표본추출 방법
- game_scenario: 게임 시나리오
- time_limit: 제한 시간
- grade: 최대 점수
```

#### samplinggame_attempts 테이블
```sql
- id: 시도 ID
- samplinggame_id: 활동 ID
- userid: 사용자 ID
- attempt_number: 시도 번호
- selected_samples: 선택한 표본 (JSON)
- score: 획득 점수
- time_spent: 소요 시간
- feedback: 피드백 메시지
```

### API 엔드포인트

**POST /mod/samplinggame/submit_attempt.php**
```json
{
  "samplinggameid": 1,
  "userid": 123,
  "selectedsamples": [1, 11, 21, 31, 41],
  "score": 85.5,
  "timespent": 120,
  "sesskey": "abc123..."
}
```

**Response**
```json
{
  "success": true,
  "attemptid": 456,
  "score": 85.5,
  "feedback": "훌륭합니다! 표본추출 방법에 대한 강한 이해를 보여주셨습니다.",
  "message": "시도가 성공적으로 저장되었습니다"
}
```

## 개발 정보

### 이벤트

- `course_module_viewed`: 활동 조회
- `attempt_submitted`: 시도 제출

### 권한

- `mod/samplinggame:addinstance`: 활동 추가
- `mod/samplinggame:view`: 활동 보기
- `mod/samplinggame:submit`: 시도 제출
- `mod/samplinggame:viewreports`: 리포트 보기

### 커스터마이징

#### CSS 수정
`mod/samplinggame/css/styles.css` 파일을 편집하여 스타일 변경:
- 스마트폰 프레임 크기
- 색상 테마
- 애니메이션 효과

#### 채점 로직 수정
`mod/samplinggame/js/samplinggame.js`의 평가 함수 수정:
- `evaluateRandomness()`: 단순무작위추출 채점
- `evaluateSystematic()`: 계통추출 채점
- `evaluateStratified()`: 층화추출 채점
- `evaluateCluster()`: 집락추출 채점

## 문제 해결

### 플러그인이 설치되지 않음
- PHP 버전 확인 (7.1.9 이상)
- 파일 권한 확인 (`www-data` 소유)
- Moodle 버전 확인 (3.7 이상)

### 게임이 로드되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- CSS/JS 파일 경로 확인
- 캐시 클리어 (사이트 관리 → 개발 → 캐시 삭제)

### 점수가 성적부에 반영되지 않음
- 활동 설정에서 "성적" 값 확인
- 데이터베이스 `samplinggame_attempts` 테이블 확인
- Moodle 로그에서 오류 확인

## 라이선스

GNU GPL v3 - Moodle 플러그인 표준 라이선스

## 크레딧

- **개발자**: Claude (Anthropic AI)
- **프로젝트**: KAIST Touch Math Academy
- **버전**: 1.0
- **날짜**: 2025-11-18

## 지원 및 기여

이슈나 제안사항이 있으시면:
- GitHub Issues 등록
- Pull Request 제출
- 문서 개선 기여

## 버전 히스토리

### v1.0 (2025-11-18)
- 초기 릴리스
- 4가지 표본추출 방법 지원
- 가상 스마트폰 UI
- Moodle 성적부 연동
- 한국어/영어 지원

## 향후 계획

- [ ] 더 많은 게임 시나리오 추가
- [ ] 실시간 멀티플레이 모드
- [ ] 고급 통계 리포트
- [ ] 모바일 앱 버전
- [ ] AI 기반 개인화 피드백
- [ ] 성취 배지 시스템
