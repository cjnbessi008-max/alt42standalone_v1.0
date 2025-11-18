# Overlap Field - 연립부등식 교집합 시각화

Moodle LMS와 연동하여 연립부등식의 교집합을 부드러운 색 계층(color gradient)으로 표현하는 교육용 웹앱입니다.

![Overlap Field Demo](docs/images/demo.png)

## 주요 기능

### 🎨 **Overlap Field 시각화**
- 여러 부등식의 교집합을 부드러운 색상 그라데이션으로 표현
- 겹치는 영역이 많을수록 진한 색상으로 표시
- 실시간 인터랙티브 시각화

### 📱 **가상 스마트폰 화면**
- 우측 하단에 표시되는 모바일 앱 시뮬레이션
- 반응형 디자인으로 다양한 화면 크기 지원
- 현실적인 스마트폰 프레임 디자인

### 🔗 **Moodle LMS 연동**
- Moodle 3.7+ 지원
- MySQL 5.7, PHP 7.1.9 호환
- 문제 데이터를 LMS에서 직접 받아 동작
- 학생 답안 및 진행 상황 추적

### ⚙️ **사용자 정의 가능**
- 격자 밀도 조절
- 색상 강도 조절
- 애니메이션 효과
- 좌표 범위 설정

## 시스템 요구사항

### Moodle 서버
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹서버**: Apache 2.4+ 또는 Nginx 1.14+

### 클라이언트 (학생/교사)
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript 활성화 필수
- Canvas API 지원 브라우저

## 설치 방법

### 1. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/moodle-plugin/overlap_field mod/

# 권한 설정
chmod -R 755 mod/overlap_field
chown -R www-data:www-data mod/overlap_field
```

### 2. Moodle 관리자 페이지에서 플러그인 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림** 으로 이동
3. "Overlap Field" 플러그인 업그레이드/설치 확인
4. 데이터베이스 테이블 자동 생성 확인

### 3. 웹앱 파일 배포

```bash
# 웹앱 파일을 Moodle 플러그인 디렉토리에 복사
cp -r /path/to/alt42standalone_v1.0/webapp/* mod/overlap_field/webapp/
```

### 4. 활동 생성 및 사용

1. 코스로 이동
2. **활동 추가 > Overlap Field** 선택
3. 부등식 입력 (한 줄에 하나씩):
   ```
   y > 2*x + 1
   y < -x + 5
   x > -3
   x < 4
   ```
4. 저장 후 학생에게 공개

## 사용 예시

### 기본 연립부등식 문제

```text
활동명: 연립부등식의 영역

부등식:
y > 2*x + 1
y < -x + 5
y > -0.5*x - 2
x > -3
x < 4

시각화 설정:
{
  "xMin": -5,
  "xMax": 5,
  "yMin": -5,
  "yMax": 5,
  "showGrid": true,
  "showAxes": true
}
```

### 고급 설정 예시

#### 원형 영역
```text
부등식:
x*x + y*y < 16
x > 0
y > 0
```

#### 다각형 영역
```text
부등식:
y < 3
y > -2
x < 4
x > -3
y < x + 2
y > -x - 1
```

## 기술 스택

### Backend (Moodle Plugin)
- **PHP 7.1.9**: 플러그인 로직
- **MySQL 5.7**: 데이터 저장
- **Moodle API**: LMS 통합

### Frontend (Webapp)
- **HTML5**: 구조
- **CSS3**: 스타일링 및 애니메이션
- **Vanilla JavaScript**: 로직 (프레임워크 없음)
- **Canvas API**: 고성능 시각화

### 핵심 모듈
- `inequality-parser.js`: 부등식 파싱 및 평가
- `color-utils.js`: 색상 블렌딩 및 그라데이션
- `overlap-field-renderer.js`: Canvas 기반 렌더링 엔진
- `smartphone-controller.js`: 애플리케이션 컨트롤러

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│            Moodle LMS (PHP + MySQL)             │
│  ┌──────────────────────────────────────────┐   │
│  │      Overlap Field Plugin (mod)          │   │
│  │  - 활동 관리 (lib.php)                   │   │
│  │  - 데이터베이스 스키마 (install.xml)     │   │
│  │  - 학생 답안 추적 (attempts)             │   │
│  └──────────────┬───────────────────────────┘   │
└─────────────────┼───────────────────────────────┘
                  │ PostMessage API
                  ▼
┌─────────────────────────────────────────────────┐
│          Webapp (HTML5 + Canvas API)            │
│  ┌──────────────────────────────────────────┐   │
│  │  Virtual Smartphone UI                   │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Overlap Field Renderer            │  │   │
│  │  │  - Inequality Parser               │  │   │
│  │  │  - Color Gradient Engine           │  │   │
│  │  │  - Canvas Visualization            │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 데이터베이스 스키마

### `mdl_overlap_field` 테이블
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT(10) | Primary key |
| course | INT(10) | 코스 ID |
| name | VARCHAR(255) | 활동 이름 |
| intro | TEXT | 활동 소개 |
| inequalities | TEXT | 부등식 (JSON) |
| visualization_config | TEXT | 시각화 설정 (JSON) |
| timecreated | INT(10) | 생성 시간 |
| timemodified | INT(10) | 수정 시간 |

### `mdl_overlap_field_attempts` 테이블
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT(10) | Primary key |
| overlap_field_id | INT(10) | 활동 ID |
| userid | INT(10) | 사용자 ID |
| attempt_number | INT(6) | 시도 번호 |
| user_answer | TEXT | 사용자 답안 (JSON) |
| is_correct | INT(1) | 정답 여부 |
| score | DECIMAL(10,5) | 점수 |
| timecreated | INT(10) | 시작 시간 |
| timecompleted | INT(10) | 완료 시간 |

## API 문서

### JavaScript API

#### `OverlapFieldRenderer`

```javascript
// 렌더러 생성
const renderer = new OverlapFieldRenderer('canvasId', {
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  gridSize: 100,
  colorIntensity: 0.7
});

// 부등식 로드
renderer.loadInequalities([
  'y > 2*x + 1',
  'y < -x + 5'
]);

// 설정 업데이트
renderer.updateConfig({
  gridSize: 150,
  colorIntensity: 0.9
});

// 애니메이션 토글
renderer.toggleAnimation();

// 초기화
renderer.reset();
```

#### `InequalityParser`

```javascript
const parser = new InequalityParser();

// 단일 부등식 파싱
const ineq = parser.parse('y > 2*x + 1');

// 평가
const result = ineq.evaluate(1, 3); // true or false

// 여러 부등식 파싱
const inequalities = parser.parseMultiple([
  'y > 2*x + 1',
  'y < -x + 5'
]);
```

### PHP API

```php
// 문제 데이터 가져오기
$data = overlap_field_get_problem_data($overlap_field_id);

// 학생 답안 저장
$answer_data = new stdClass();
$answer_data->is_correct = true;
$answer_data->score = 100.0;

$attempt_id = overlap_field_save_attempt(
    $overlap_field_id,
    $userid,
    $answer_data
);
```

## 문제 해결

### 문제: 플러그인이 Moodle에 나타나지 않음
**해결**:
- 파일 권한 확인 (`chmod -R 755 mod/overlap_field`)
- Moodle 캐시 삭제 (**사이트 관리 > 개발 > 캐시 제거**)
- PHP 오류 로그 확인

### 문제: 시각화가 표시되지 않음
**해결**:
- 브라우저 콘솔에서 JavaScript 오류 확인
- webapp 파일이 올바른 위치에 있는지 확인
- 브라우저의 Canvas API 지원 확인

### 문제: 부등식 파싱 오류
**해결**:
- 부등식 형식 확인 (예: `y > 2*x + 1`)
- 공백 제거 시도
- 지원되는 연산자 사용: `>`, `<`, `>=`, `<=`, `=`

## 라이선스

GNU GPL v3 or later

## 기여

버그 리포트 및 기능 제안은 이슈로 등록해 주세요.

## 개발자

KAIST - 2025

## 연락처

기술 지원: [support@example.com]

---

**Version**: 1.0.0
**Last Updated**: 2025-01-18
