# Term Growth - 함수 항 성장 학습 시스템

함수의 항(term)이 추가될 때 그래프가 점진적으로 성장하는 과정을 시각화하는 교육용 웹 애플리케이션입니다.

## 📋 개요

**Term Growth**는 수학 학습을 위한 인터랙티브 웹 애플리케이션으로, 다항식 함수의 각 항이 그래프에 미치는 영향을 단계별로 시각화합니다. 학생들은 항을 하나씩 추가하며 함수 그래프가 어떻게 변화하는지 직관적으로 이해할 수 있습니다.

### 주요 기능

- ✅ **단계별 항 추가**: 함수의 항을 하나씩 추가하며 그래프 변화 관찰
- ✅ **실시간 그래프 시각화**: Chart.js 기반 부드러운 애니메이션
- ✅ **가상 스마트폰 UI**: 우측 하단에 표시되는 학생용 앱 화면
- ✅ **자동 재생 모드**: 항이 자동으로 추가되는 데모 모드
- ✅ **Moodle LMS 연동 준비**: Moodle 3.7과의 통합을 위한 API 구조
- ✅ **진행도 추적**: 학습 진행 상황 실시간 표시

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **차트 라이브러리**: Chart.js 4.4.0
- **수학 엔진**: Math.js 12.2.0
- **LMS 연동**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)

## 📁 프로젝트 구조

```
term-growth-app/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트 (스마트폰 UI, 반응형)
├── js/
│   ├── term-growth.js     # 메인 로직 (그래프, 애니메이션)
│   └── moodle-integration.js  # Moodle LMS 연동
├── assets/                 # 이미지 및 리소스 (추후 확장)
└── README.md              # 이 문서
```

## 🚀 실행 방법

### 로컬 환경에서 실행

1. **파일 다운로드**
   ```bash
   cd term-growth-app
   ```

2. **웹 서버 실행**

   간단한 HTTP 서버 실행 (Python):
   ```bash
   python -m http.server 8000
   ```

   또는 Node.js를 사용하는 경우:
   ```bash
   npx http-server -p 8000
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:8000
   ```

### Moodle LMS와 연동

#### 1. Moodle 설정

Moodle 3.7에서 Web Services 활성화:

```php
// Moodle 관리자 → 사이트 관리 → 플러그인 → 웹 서비스 → 관리
// 1. 웹 서비스 활성화
// 2. REST 프로토콜 활성화
// 3. 서비스 생성: 'term_growth_service'
```

#### 2. 웹 서비스 함수 생성 (PHP)

Moodle의 local plugin 생성:

```php
// local/termgrowth/externallib.php

class local_termgrowth_external extends external_api {

    /**
     * 문제 데이터 가져오기
     */
    public static function get_problem($problemid) {
        global $DB;

        $params = self::validate_parameters(
            self::get_problem_parameters(),
            array('problemid' => $problemid)
        );

        // MySQL에서 문제 데이터 조회
        $problem = $DB->get_record('termgrowth_problems',
            array('id' => $problemid), '*', MUST_EXIST);

        return array(
            'id' => $problem->id,
            'title' => $problem->title,
            'terms' => json_decode($problem->terms_json),
            // ... 기타 필드
        );
    }

    /**
     * 학생 진행도 저장
     */
    public static function save_progress($problemid, $step, $percentage) {
        global $DB, $USER;

        $record = new stdClass();
        $record->userid = $USER->id;
        $record->problemid = $problemid;
        $record->current_step = $step;
        $record->percentage = $percentage;
        $record->timemodified = time();

        $DB->insert_record('termgrowth_progress', $record);

        return array('success' => true);
    }
}
```

#### 3. MySQL 데이터베이스 스키마

```sql
-- Moodle 데이터베이스에 테이블 추가

CREATE TABLE mdl_termgrowth_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    objective TEXT,
    terms_json TEXT,
    x_range_min INT DEFAULT -5,
    x_range_max INT DEFAULT 5,
    y_range_min INT DEFAULT -10,
    y_range_max INT DEFAULT 30,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mdl_termgrowth_progress (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    problemid BIGINT(10) NOT NULL,
    current_step INT,
    percentage DECIMAL(5,2),
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY userid (userid),
    KEY problemid (problemid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4. 웹앱에서 Moodle 연동

URL 파라미터를 통한 연동:

```
http://yourdomain.com/term-growth-app/?wstoken=YOUR_TOKEN&problemid=123
```

`js/moodle-integration.js` 파일에서 실제 API 호출 부분의 주석을 해제하고 사용:

```javascript
// Line 52-68의 실제 API 호출 코드 활성화
const response = await fetch(`${this.config.moodleUrl}${this.config.apiEndpoint}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
        wstoken: this.config.wsToken,
        wsfunction: 'local_termgrowth_get_problem',
        moodlewsrestformat: 'json',
        problemid: problemId
    })
});
```

## 💡 사용 방법

### 교사 / 관리자 패널 (좌측)

1. **문제 정보**: 현재 로드된 문제의 ID, 난이도, 목표 확인
2. **항 추가 제어**:
   - **다음 항 추가**: 수동으로 다음 항 추가
   - **초기화**: 처음 상태로 리셋
   - **자동 재생**: 자동으로 항이 추가되는 데모 모드
3. **현재 함수**: 현재까지 추가된 항의 함수 표현식 표시
4. **학습 진행도**: 진행률 바 및 단계 표시
5. **LMS 연동 상태**: Moodle 연결 상태 확인

### 학생용 앱 화면 (우측 - 가상 스마트폰)

1. **그래프 영역**: 함수의 시각적 표현
2. **현재 항 정보**: 방금 추가된 항과 설명
3. **다음 단계 버튼**: 학생이 직접 다음 항으로 진행

## 📊 데모 문제 예시

현재 내장된 데모 문제:

```javascript
{
    id: 'TG-001',
    title: '2차 다항식 이해하기',
    difficulty: '중급',
    terms: [
        { expression: '3', coefficient: 3, power: 0,
          description: '상수항 - 그래프를 y축 방향으로 이동' },
        { expression: '2x', coefficient: 2, power: 1,
          description: '1차항 - 그래프에 기울기 추가' },
        { expression: 'x²', coefficient: 1, power: 2,
          description: '2차항 - 그래프가 포물선으로 변화' }
    ]
}
```

**결과 함수**: f(x) = x² + 2x + 3

## 🎨 커스터마이징

### 1. 문제 데이터 수정

`js/moodle-integration.js`의 `loadDemoProblem()` 함수에서 데모 데이터 수정:

```javascript
this.currentProblem = {
    id: 'TG-002',
    title: '3차 다항식 학습',
    terms: [
        { expression: '-2', coefficient: -2, power: 0,
          description: '음수 상수항' },
        { expression: '4x', coefficient: 4, power: 1,
          description: '양의 기울기' },
        { expression: '-x²', coefficient: -1, power: 2,
          description: '아래로 볼록한 포물선' },
        { expression: '0.5x³', coefficient: 0.5, power: 3,
          description: '3차항 추가' }
    ],
    xRange: [-4, 4],
    yRange: [-20, 20]
};
```

### 2. 색상 테마 변경

`css/style.css`의 CSS 변수 수정:

```css
:root {
    --primary-color: #4A90E2;    /* 메인 색상 */
    --secondary-color: #50C878;  /* 보조 색상 */
    --accent-color: #F39C12;     /* 강조 색상 */
    /* ... */
}
```

### 3. 애니메이션 속도 조절

`js/term-growth.js`의 설정 수정:

```javascript
this.config = {
    animationDuration: 800,    // 그래프 애니메이션 (ms)
    autoPlayDelay: 2000,       // 자동 재생 간격 (ms)
    /* ... */
};
```

## 🔧 개발 및 확장

### 새로운 기능 추가

1. **다른 함수 유형 지원** (삼각함수, 지수함수 등)
2. **학생 응답 입력** (그래프 예측 기능)
3. **복수 그래프 비교** (여러 함수 동시 표시)
4. **상세 통계 분석** (학습 시간, 오답 패턴 등)

### API 확장

`moodle-integration.js`에 새로운 메서드 추가:

```javascript
async getStudentHistory(studentId) {
    // 학생의 학습 이력 조회
}

async generateReport() {
    // 학습 리포트 생성
}
```

## 📝 요구사항

- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge - 최신 2개 버전)
- JavaScript 활성화
- 인터넷 연결 (CDN 라이브러리 로드용)

### Moodle 연동 시

- Moodle 3.7 이상
- MySQL 5.7
- PHP 7.1.9 이상
- Web Services 활성화

## 🐛 문제 해결

### 그래프가 표시되지 않는 경우

1. 브라우저 콘솔 확인 (F12)
2. Chart.js CDN 로드 확인
3. 캐시 삭제 후 새로고침

### Moodle 연동이 안 되는 경우

1. Web Services가 활성화되어 있는지 확인
2. wstoken이 유효한지 확인
3. CORS 설정 확인 (동일 도메인 권장)

## 📄 라이센스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여

KAIST Touch Math Academy

## 📞 지원

문제가 발생하거나 기능 제안이 있으시면 이슈를 등록해주세요.

---

**Term Growth** - 수학을 시각적으로 이해하는 즐거움! 📊📈
