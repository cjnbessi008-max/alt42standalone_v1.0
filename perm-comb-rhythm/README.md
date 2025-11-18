# Perm-Comb Rhythm 🎵

순열(Permutation)과 조합(Combination)의 차이를 **두 색의 리듬**으로 표현하는 교육용 웹앱입니다.

## 개요

Perm-Comb Rhythm은 KAIST Touch Math Academy를 위해 개발된 Moodle 3.7 플러그인으로, 학생들이 순열과 조합의 개념을 시각적·청각적으로 학습할 수 있도록 도와줍니다.

### 주요 특징

- 🎨 **색상 구분**: 순열(파란색), 조합(분홍색)
- 🎵 **리듬 패턴**: 순열은 변화하는 음계, 조합은 동일한 음
- 📱 **모바일 최적화**: 우측 하단 가상 스마트폰 화면에 표시
- 📊 **학습 추적**: 정확도 및 진행 상황 통계
- 🔗 **Moodle 통합**: LMS와 완벽한 연동

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: 최신 Chrome, Firefox, Safari, Edge

## 설치 방법

### 1. 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성
mkdir -p mod/permcombrhythm

# 파일 복사
cp -r perm-comb-rhythm/moodle-plugin/* mod/permcombrhythm/
```

### 2. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여 (예: www-data)
chown -R www-data:www-data mod/permcombrhythm
chmod -R 755 mod/permcombrhythm
```

### 3. Moodle 업그레이드

1. Moodle 관리자로 로그인
2. `사이트 관리` > `알림` 페이지로 이동
3. "데이터베이스 업그레이드" 버튼 클릭
4. 설치 완료 확인

### 4. 활동 추가

1. 코스 편집 모드 활성화
2. "활동 또는 리소스 추가" 클릭
3. "Perm-Comb Rhythm" 선택
4. 설정:
   - **이름**: 활동 이름 입력
   - **설명**: 학습 목표 설명
   - **난이도**: 1-5 선택 (1=쉬움, 5=어려움)
   - **문제 유형**: 순열/조합/혼합 선택

## 사용 방법

### 학생 관점

1. **활동 접근**: 코스에서 Perm-Comb Rhythm 활동 클릭
2. **리듬 관찰**: 우측 하단 스마트폰 화면에 표시된 리듬 패턴 확인
3. **리듬 재생**: "▶ 리듬 재생" 버튼으로 소리와 애니메이션 확인
4. **답 입력**: 경우의 수 계산 후 답 입력
5. **제출**: "제출" 버튼 클릭
6. **피드백**: 정답/오답 확인 및 설명 보기
7. **다음 문제**: "다음 문제" 버튼으로 계속 학습

### 교사 관점

1. **활동 생성**: 위의 설치 방법 참조
2. **난이도 조정**: 학생 수준에 맞게 1-5 설정
3. **통계 확인**: Moodle 성적표에서 학생 진행 상황 확인
4. **피드백 제공**: 개별 학생 시도 내역 검토

## 리듬 패턴 설명

### 순열 (Permutation)
- **색상**: 파란색 그라데이션 (#667eea)
- **패턴**: 각 막대의 높이가 다름 (순서 중요)
- **소리**: 올라가는 음계 (440Hz, 540Hz, 640Hz...)
- **의미**: 순서가 중요! ABC ≠ ACB

### 조합 (Combination)
- **색상**: 분홍색 그라데이션 (#f5576c)
- **패턴**: 모든 막대의 높이가 동일 (순서 무관)
- **소리**: 동일한 음 (523.25Hz - C5)
- **의미**: 순서가 중요하지 않음! {A,B,C} = {C,A,B}

## 파일 구조

```
perm-comb-rhythm/
├── moodle-plugin/              # Moodle 플러그인 파일
│   ├── version.php             # 플러그인 버전 정보
│   ├── lib.php                 # 핵심 함수
│   ├── view.php                # 메인 뷰
│   ├── api.php                 # REST API 엔드포인트
│   ├── db/
│   │   ├── install.xml         # 데이터베이스 스키마
│   │   └── access.php          # 권한 정의
│   ├── lang/en/
│   │   └── permcombrhythm.php  # 언어 파일
│   └── app/                    # 웹앱
│       ├── index.html          # 앱 HTML
│       ├── style.css           # 스타일시트
│       └── app.js              # 앱 로직
├── webapp/                     # 독립형 웹앱 (선택)
└── docs/                       # 문서
```

## API 엔드포인트

### GET `/mod/permcombrhythm/api.php?action=getproblem&id={activityId}`
새로운 문제 생성

**응답 예시:**
```json
{
  "success": true,
  "problem": {
    "type": "permutation",
    "n": 5,
    "r": 3,
    "answer": 60,
    "difficulty": 2
  }
}
```

### POST `/mod/permcombrhythm/api.php`
답안 제출

**요청 파라미터:**
- `action`: "submit"
- `id`: 활동 ID
- `answer`: 사용자 답
- `problemdata`: JSON 문제 데이터
- `timespent`: 소요 시간 (초)

**응답 예시:**
```json
{
  "success": true,
  "correct": true,
  "correctanswer": 60,
  "attemptid": 123
}
```

### GET `/mod/permcombrhythm/api.php?action=getstats&id={activityId}`
사용자 통계 조회

**응답 예시:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "correct": 7,
    "accuracy": 70.0,
    "recent": [...]
  }
}
```

## 데이터베이스 스키마

### `mdl_permcombrhythm`
활동 인스턴스 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본키 |
| course | INT | 코스 ID |
| name | VARCHAR(255) | 활동 이름 |
| difficulty | INT(2) | 난이도 (1-5) |
| problemtype | VARCHAR(20) | 문제 유형 |

### `mdl_permcombrhythm_attempts`
학생 시도 기록

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본키 |
| permcombrhythmid | INT | 활동 ID |
| userid | INT | 사용자 ID |
| problemdata | TEXT | 문제 데이터 (JSON) |
| useranswer | INT | 사용자 답 |
| iscorrect | INT(1) | 정답 여부 (0/1) |
| timespent | INT | 소요 시간 (초) |
| timecreated | INT | 생성 시간 |

## 문제 해결

### 문제: 스마트폰 화면이 표시되지 않음
**해결:** 브라우저 콘솔에서 iframe 오류 확인. CORS 설정 검토.

### 문제: 리듬이 재생되지 않음
**해결:** 브라우저가 Web Audio API를 지원하는지 확인. HTTPS 필요할 수 있음.

### 문제: API 호출 실패
**해결:**
1. Moodle 세션 활성화 확인
2. api.php 파일 권한 확인 (755)
3. Moodle 오류 로그 확인 (`{moodledata}/temp/errorlog`)

### 문제: 데이터베이스 오류
**해결:**
```bash
# Moodle CLI로 데이터베이스 재설치
php admin/cli/uninstall_plugins.php --plugins=mod_permcombrhythm
# 플러그인 재설치
```

## 개발자 정보

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas API**: 리듬 시각화
- **Web Audio API**: 사운드 생성
- **Backend**: PHP 7.1+
- **Database**: MySQL 5.7

### 커스터마이징

#### 색상 변경
`app/app.js`의 CONFIG 객체 수정:
```javascript
const CONFIG = {
    PERM_COLOR: '#667eea',      // 순열 색상
    COMB_COLOR: '#f5576c',      // 조합 색상
    BEAT_DURATION: 400,         // 비트 간격 (ms)
};
```

#### 난이도 조정
`lib.php`의 `permcombrhythm_generate_problem` 함수 수정:
```php
$n = rand(3 + $difficulty, 6 + $difficulty);  // n 범위
$r = rand(2, min($n, 3 + floor($difficulty / 2)));  // r 범위
```

## 라이센스

Copyright © 2025 KAIST Touch Math Academy
GNU GPL v3 or later

## 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 버전 히스토리

- **v1.0** (2025-11-18): 초기 릴리스
  - 순열/조합 리듬 시각화
  - Moodle 3.7 통합
  - 모바일 최적화

## 연락처

KAIST Touch Math Academy
Email: contact@example.com
