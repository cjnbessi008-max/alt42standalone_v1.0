# Integral Digest - 적분 문제 요약 시스템

## 📋 개요

**Integral Digest**는 적분 문제의 전체 구조를 자동으로 요약하고 분석하여 학생들에게 제공하는 지능형 학습 지원 시스템입니다.

Moodle 3.7 LMS와 통합되어 동작하며, 우측 하단 가상 스마트폰 화면에 모바일 최적화된 UI로 표시됩니다.

## 🎯 주요 기능

### 1. **문제 구조 자동 분석**
- 적분 문제의 유형, 난이도, 핵심 개념 자동 추출
- 피적분함수, 적분 구간, 변수 등 수학적 표현 파싱
- 학습 목표 및 선수 지식 자동 생성

### 2. **단계별 해법 다이제스트**
- 문제 해결 과정을 단계별로 분해하여 제시
- 각 단계의 수학적 공식과 설명 포함
- 대안적 풀이 방법 제안

### 3. **시각화 및 그래프**
- SVG 기반 함수 그래프 렌더링
- 적분 영역 음영 표시
- 터치 인터랙션 지원 (줌, 팬 등)

### 4. **학습 가이드**
- 흔한 실수 및 주의 사항 안내
- 개념 설명 및 학습 팁 제공
- 다음 학습 단계 추천

### 5. **통계 및 성과 분석**
- 평균 시도 횟수, 정답률, 소요 시간 추적
- 학생별 진행 상황 모니터링
- 문제별 성과 비교

## 🛠 기술 스택

- **Backend**: PHP 7.1.9, Moodle 3.7
- **Database**: MySQL 5.7
- **Frontend**: React, CSS3
- **API**: RESTful API with JSON

## 📁 파일 구조

```
alt42standalone_v1.0/
├── database/
│   └── integral_digest_schema.sql         # MySQL 스키마
├── moodle/
│   └── question/
│       └── type/
│           └── integral/
│               ├── classes/
│               │   └── integral_digest.php    # 핵심 클래스
│               ├── api/
│               │   └── digest_api.php         # REST API
│               └── lib.php                     # LMS 통합
├── mobile/
│   └── components/
│       ├── IntegralDigest.jsx             # React 컴포넌트
│       └── IntegralDigest.css             # 스타일시트
└── docs/
    └── INTEGRAL_DIGEST_README.md          # 문서 (본 파일)
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스에 스키마 적용
mysql -u root -p your_database < database/integral_digest_schema.sql
```

### 2. Moodle 플러그인 설치

```bash
# Moodle 디렉토리로 복사
cp -r moodle/question/type/integral /path/to/moodle/question/type/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

### 3. 모바일 컴포넌트 빌드

```bash
cd mobile
npm install
npm run build
```

### 4. API 엔드포인트 설정

Moodle 설정 파일(`config.php`)에 API 엔드포인트 추가:

```php
$CFG->integral_api_endpoint = $CFG->wwwroot . '/question/type/integral/api/digest_api.php';
```

## 📖 사용 방법

### PHP Backend - 다이제스트 생성

```php
<?php
require_once($CFG->dirroot . '/question/type/integral/classes/integral_digest.php');

use qtype_integral\integral_digest;

// 문제 데이터 준비
$problem_data = array(
    'problem_id' => 'uuid-here',
    'module_id' => 'module-uuid',
    'title' => '다항식의 정적분',
    'type' => 'definite_integral',
    'difficulty' => 2,
    'integrand' => 'x^2 + 2x + 1',
    'lower_bound' => '0',
    'upper_bound' => '2',
    'variable' => 'x',
    'correct_answer' => '26/3'
);

// 다이제스트 생성
$digest = new integral_digest();
$digest_id = $digest->create_digest($problem_data);

// 다이제스트 조회 (모바일 앱용)
$digest = new integral_digest($problem_data['problem_id']);
$mobile_data = $digest->get_digest('mobile');

echo json_encode($mobile_data);
```

### REST API 사용

#### 1. 다이제스트 조회

```javascript
// GET 요청
fetch('/question/type/integral/api/digest_api.php?action=get_digest&problem_id=uuid-here&format=mobile')
    .then(response => response.json())
    .then(data => {
        console.log(data.data);
    });
```

**응답 예시:**

```json
{
    "success": true,
    "data": {
        "problem_id": "uuid-here",
        "title": "다항식의 정적분",
        "overview": {
            "type": "정적분",
            "difficulty": {
                "level": 2,
                "stars": "★★☆☆☆",
                "explanation": "기본 공식과 간단한 대수 계산이 필요한 문제입니다."
            },
            "time_estimate": "9분",
            "concept": "주어진 구간에서 함수의 정적분을 계산합니다..."
        },
        "mathematical_expression": {
            "integrand": "x^2 + 2x + 1",
            "bounds": { "lower": "0", "upper": "2" },
            "variable": "x",
            "latex": "\\int_{0}^{2} x^2 + 2x + 1 \\, dx"
        },
        "solution_digest": {
            "steps": [...],
            "final_answer": "26/3"
        }
    }
}
```

#### 2. 학생 답안 제출

```javascript
// POST 요청
fetch('/question/type/integral/api/digest_api.php?action=record_attempt&problem_id=uuid-here', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        answer: '8.667',
        is_correct: true,
        time_spent: 480,
        confidence_level: 4
    })
})
.then(response => response.json())
.then(data => {
    console.log('답안 기록됨:', data);
});
```

#### 3. 모듈의 모든 문제 조회

```javascript
// GET 요청
fetch('/question/type/integral/api/digest_api.php?action=get_module_digests&module_id=module-uuid&format=summary')
    .then(response => response.json())
    .then(data => {
        console.log('모듈의 문제들:', data.data);
    });
```

### React 컴포넌트 사용

```jsx
import React from 'react';
import IntegralDigest from './components/IntegralDigest';

function MobileApp() {
    return (
        <div className="mobile-screen-container">
            <IntegralDigest
                problemId="uuid-here"
                apiEndpoint="/question/type/integral/api/digest_api.php"
            />
        </div>
    );
}

export default MobileApp;
```

### LMS 통합 - AI 파이프라인에서 배치 생성

```php
<?php
// AI 파이프라인에서 생성된 문제들
$problems = array(
    array(
        'id' => 'problem-1',
        'title' => '기본 적분 1',
        'type' => 'definite_integral',
        'difficulty' => 1,
        'integrand' => 'x',
        'lower_bound' => '0',
        'upper_bound' => '1',
        'correct_answer' => '0.5'
    ),
    array(
        'id' => 'problem-2',
        'title' => '기본 적분 2',
        'type' => 'definite_integral',
        'difficulty' => 2,
        'integrand' => 'x^2',
        'lower_bound' => '0',
        'upper_bound' => '2',
        'correct_answer' => '8/3'
    )
    // ... 더 많은 문제
);

$module_id = 'module-uuid';

// 배치 생성
$results = qtype_integral_batch_create_from_ai_pipeline($problems, $module_id);

echo "성공: " . count($results['success']) . " 문제\n";
echo "실패: " . count($results['failed']) . " 문제\n";
```

## 📱 모바일 UI 구조

### 화면 레이아웃 (우측 하단 가상 스마트폰)

```
┌─────────────────────────────┐
│     📊 다항식의 정적분      │ ← 헤더 (10%)
├─────────────────────────────┤
│   문제 개요 (난이도 등)     │ ← 개요 (15%)
├─────────────────────────────┤
│   ∫₀² x² + 2x + 1 dx        │ ← 수학적 표현 (20%)
├─────────────────────────────┤
│   [그래프 시각화]           │ ← 시각화 (30%, 접을 수 있음)
│   함수 그래프 + 음영 영역    │
├─────────────────────────────┤
│   💡 해법 요약 (접혀 있음)  │ ← 해법 (15%, 접을 수 있음)
│   [정답 보기] 버튼          │
├─────────────────────────────┤
│ 📝 문제풀기 | 💡 힌트 | 🔄 │ ← 네비게이션 (10%)
└─────────────────────────────┘
```

### 인터랙션 기능

- **스와이프**: 섹션 간 이동
- **탭**: 섹션 접기/펼치기
- **핀치 줌**: 그래프 확대/축소
- **스크롤**: 컨텐츠 내비게이션

## 🔧 API 엔드포인트 목록

| 액션 | 메서드 | 파라미터 | 설명 |
|------|--------|----------|------|
| `get_digest` | GET | `problem_id`, `format` | 문제 다이제스트 조회 |
| `get_module_digests` | GET | `module_id`, `format` | 모듈의 모든 문제 조회 |
| `create_digest` | POST | JSON body | 새 다이제스트 생성 |
| `record_attempt` | POST | `problem_id`, JSON body | 학생 답안 기록 |
| `get_student_progress` | GET | `problem_id`, `student_id` | 진행 상황 조회 |
| `get_statistics` | GET | `problem_id` | 문제 통계 조회 |
| `get_mobile_config` | GET | `problem_id` | 모바일 설정 조회 |
| `list_problems` | GET | `page`, `per_page`, `difficulty`, `type` | 문제 목록 (페이지네이션) |
| `batch_create` | POST | JSON array | 배치 생성 (관리자) |
| `status` | GET | - | API 상태 확인 |

## 📊 데이터베이스 스키마

### 주요 테이블

1. **mdl_integral_digest**: 문제 다이제스트 메인 테이블
2. **mdl_student_integral_progress**: 학생별 진행 상황
3. **mdl_integral_digest_view**: 모바일 뷰 설정
4. **mdl_integral_modules**: 모듈 메타데이터
5. **mdl_integral_problems**: 문제 상세 정보
6. **mdl_student_attempts**: 답안 기록

## 🎨 UI 커스터마이징

### CSS 변수 수정

`IntegralDigest.css` 파일에서 색상 테마 변경:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #27ae60;
    --error-color: #e74c3c;
    --text-color: #333;
    --background-color: #f8f9fa;
}
```

### 레이아웃 비율 조정

`integral_digest.php`의 `format_for_mobile()` 메서드에서:

```php
'mobile_layout' => array(
    'sections' => array(
        array('type' => 'header', 'height' => '10%'),
        array('type' => 'overview', 'height' => '20%'),  // ← 높이 조정
        array('type' => 'expression', 'height' => '25%'),
        // ...
    )
)
```

## 🧪 테스트

### 샘플 데이터 삽입

```sql
-- 테스트 모듈 생성
INSERT INTO mdl_integral_modules (id, name, subject, topic, status)
VALUES (UUID(), '적분의 기초', 'Mathematics', 'Integrals', 'active');

-- 샘플 문제 및 다이제스트 생성
-- (integral_digest_schema.sql 파일 참조)
```

### API 테스트

```bash
# API 상태 확인
curl "http://localhost/moodle/question/type/integral/api/digest_api.php?action=status"

# 다이제스트 조회
curl "http://localhost/moodle/question/type/integral/api/digest_api.php?action=get_digest&problem_id=test-uuid&format=mobile"
```

## 🐛 문제 해결

### 일반적인 문제

**Q: API가 403 에러를 반환합니다.**
A: Moodle 세션이 유효한지 확인하세요. `require_login()` 체크가 활성화되어 있습니다.

**Q: 다이제스트가 생성되지 않습니다.**
A: PHP 에러 로그를 확인하세요. MySQL JSON 타입 지원 여부를 확인하세요 (MySQL 5.7+).

**Q: 모바일 UI가 표시되지 않습니다.**
A: React 컴포넌트가 빌드되었는지, CSS 파일이 로드되었는지 확인하세요.

**Q: LaTeX 수식이 렌더링되지 않습니다.**
A: MathJax 또는 KaTeX 라이브러리가 로드되었는지 확인하세요.

### 디버깅 모드

PHP에서 디버깅 활성화:

```php
// config.php에 추가
$CFG->debug = DEBUG_DEVELOPER;
$CFG->debugdisplay = 1;
```

## 🔐 보안 고려사항

1. **인증**: 모든 API 요청에 Moodle 세션 필요
2. **권한**: 교사는 모든 학생 데이터 조회 가능, 학생은 본인 데이터만
3. **SQL Injection**: Moodle DML 사용으로 방지
4. **XSS**: 모든 출력은 `htmlspecialchars()` 처리
5. **CSRF**: Moodle 세션 토큰 검증

## 📈 성능 최적화

1. **데이터베이스 인덱스**: 주요 필드에 인덱스 설정됨
2. **JSON 캐싱**: 복잡한 다이제스트는 생성 후 캐시
3. **페이지네이션**: 대량 데이터는 페이지 단위로 로드
4. **Lazy Loading**: 모바일 UI에서 섹션별 지연 로딩

## 🌍 다국어 지원

현재 한국어로 구현되어 있으며, 다국어 지원을 위해:

```php
// Moodle 언어 문자열 정의
$string['digest_overview'] = '문제 개요';
$string['digest_solution'] = '해법 요약';
// ...
```

## 📝 라이선스

GNU GPL v3 or later

## 🤝 기여

Alt42 Education System 프로젝트에 기여를 환영합니다.

## 📞 지원

- 이슈 트래커: GitHub Issues
- 이메일: support@alt42.edu
- 문서: [Alt42 Education Docs](https://docs.alt42.edu)

## 📚 추가 자료

- [Moodle Question Types](https://docs.moodle.org/dev/Question_types)
- [MySQL JSON Functions](https://dev.mysql.com/doc/refman/5.7/en/json.html)
- [React Mobile UI Best Practices](https://reactjs.org/docs/getting-started.html)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-18
**Author**: Alt42 Education System Team
