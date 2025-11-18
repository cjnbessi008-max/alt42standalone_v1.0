# Dancing Line Sorting - Moodle Plugin

수직선 위에서 숫자들이 춤추듯 정렬되는 과정을 시각화하는 교육용 웹 애플리케이션입니다.

## 📱 기능

- **실시간 정렬 시각화**: 수직선 위에서 숫자들이 애니메이션으로 움직이며 정렬되는 과정을 관찰할 수 있습니다
- **다양한 정렬 알고리즘**: 버블 정렬, 선택 정렬, 삽입 정렬, 퀵 정렬을 지원합니다
- **스마트폰 화면 UI**: 우측 하단에 가상 스마트폰 화면으로 표시되는 직관적인 인터페이스
- **통계 추적**: 비교 횟수, 교환 횟수, 소요 시간을 실시간으로 확인할 수 있습니다
- **Moodle LMS 연동**: 문제를 Moodle에서 받아오고 학생 시도를 데이터베이스에 저장합니다

## 🎯 지원하는 정렬 알고리즘

1. **버블 정렬 (Bubble Sort)**: 인접한 두 원소를 비교하며 정렬
2. **선택 정렬 (Selection Sort)**: 최솟값을 찾아 정렬
3. **삽입 정렬 (Insertion Sort)**: 정렬된 부분에 원소를 삽입하며 정렬
4. **퀵 정렬 (Quick Sort)**: 분할 정복을 이용한 빠른 정렬

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7+
- **LMS**: Moodle 3.7

## 📦 설치 방법

### 1. 파일 복사
```bash
cd /path/to/moodle
cp -r dancingline local/dancingline
```

### 2. 데이터베이스 설정
Moodle의 관리자 페이지에서 플러그인을 활성화하면 자동으로 데이터베이스 테이블이 생성됩니다:

- `mdl_local_dancingline_problems`: 정렬 문제 정보
- `mdl_local_dancingline_attempts`: 학생 시도 기록

### 3. 권한 설정
다음 권한이 자동으로 설정됩니다:
- `local/dancingline:view`: 앱 보기 (학생, 교사)
- `local/dancingline:createproblem`: 문제 생성 (교사)
- `local/dancingline:viewreports`: 리포트 보기 (교사)

## 🚀 사용 방법

### 학생용

1. Moodle에 로그인 후 `/local/dancingline/index.php` 접속
2. "숫자 생성" 버튼으로 랜덤 숫자 생성
3. 정렬 알고리즘 선택
4. "정렬 시작" 버튼 클릭
5. 수직선 위에서 춤추듯 정렬되는 숫자들을 관찰
6. 속도 조절 슬라이더로 애니메이션 속도 변경
7. 통계 패널에서 비교/교환 횟수 확인

### 교사용

#### 문제 생성 API 사용 예시:
```php
// 문제 생성
$problem = new stdClass();
$problem->courseid = $courseid;
$problem->name = '버블 정렬 연습';
$problem->description = '8개의 숫자를 버블 정렬로 정렬하세요';
$problem->numbers = json_encode([42, 17, 89, 3, 56, 28, 91, 14]);
$problem->algorithm = 'bubble';
$problem->difficulty = 1;
$problem->timecreated = time();
$problem->timemodified = time();

$DB->insert_record('local_dancingline_problems', $problem);
```

#### URL 파라미터로 문제 로드:
```
/local/dancingline/index.php?problemid=123
```

## 📊 데이터베이스 구조

### local_dancingline_problems
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 문제 ID |
| courseid | INT | 코스 ID |
| name | VARCHAR(255) | 문제 이름 |
| description | TEXT | 문제 설명 |
| numbers | TEXT | JSON 배열 형태의 숫자들 |
| algorithm | VARCHAR(50) | 정렬 알고리즘 |
| difficulty | INT | 난이도 (1-5) |
| timecreated | INT | 생성 시간 |
| timemodified | INT | 수정 시간 |

### local_dancingline_attempts
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 시도 ID |
| problemid | INT | 문제 ID (FK) |
| userid | INT | 사용자 ID |
| comparisons | INT | 비교 횟수 |
| swaps | INT | 교환 횟수 |
| timeelapsed | INT | 소요 시간 (초) |
| completed | INT | 완료 여부 (0/1) |
| score | DECIMAL | 점수 (0-100) |
| timecreated | INT | 시도 시간 |

## 🎨 UI 특징

- **가상 스마트폰 화면**: 우측 하단에 고정된 스마트폰 형태의 UI
- **수직선 정렬**: 숫자들이 수직선 위에서 위치를 변경하며 정렬
- **색상 코딩**:
  - 보라색 그라데이션: 일반 상태
  - 핑크색: 비교 중
  - 청록색: 교환 중
  - 녹색: 정렬 완료
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🔐 보안

- 세션 키 검증 (`confirm_sesskey`)
- 사용자 인증 확인 (`require_login`)
- SQL 인젝션 방지 (Moodle DML API 사용)
- XSS 방지 (적절한 이스케이핑)

## 📝 라이선스

이 플러그인은 Moodle의 GPLv3 라이선스를 따릅니다.

## 👨‍💻 개발자 정보

- **Version**: 1.0.0
- **Requires**: Moodle 3.7+
- **Component**: local_dancingline

## 🐛 버그 리포트

문제가 발생하면 GitHub Issues에 리포트해주세요.

## 🔄 업데이트 계획

- [ ] 병합 정렬, 힙 정렬 추가
- [ ] 학생별 진행 상황 대시보드
- [ ] 리더보드 기능
- [ ] 커스텀 숫자 배열 입력
- [ ] 정렬 과정 단계별 설명
- [ ] 다국어 지원 확대
- [ ] 음향 효과 추가
- [ ] 모바일 네이티브 앱 버전

## 📸 스크린샷

### 메인 화면
- 우측 하단에 스마트폰 UI
- 좌측에 문제 정보 패널

### 정렬 진행 중
- 숫자들이 수직선 위에서 움직임
- 실시간 통계 업데이트

### 정렬 완료
- 모든 숫자가 녹색으로 표시
- 최종 통계 확인

## 🙏 감사의 말

KAIST Touch Math Academy의 교육 혁신을 위해 개발되었습니다.
