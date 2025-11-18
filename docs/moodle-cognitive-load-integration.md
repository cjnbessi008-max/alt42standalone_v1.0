# Moodle LMS 인지 부하 수치화 통합 시스템

## 1. 개요

### 목적
Moodle 3.7 LMS와 연동하여 문제 유형별로 필요한 인지 부하(사고 체력량)를 자동으로 수치화하고 측정하는 시스템 구축

### 기술 스택
- **LMS**: Moodle 3.7
- **웹 서버**: PHP 7.1.9
- **데이터베이스**: MySQL 5.7
- **AI 파이프라인**: Python 3.11+ / FastAPI
- **인지 부하 분석**: Claude API + 커스텀 알고리즘

---

## 2. 인지 부하(Cognitive Load) 수치화 모델

### 2.1 인지 부하 측정 차원

#### A. 내재적 부하 (Intrinsic Load)
문제 자체의 복잡도
- **개념 복잡도**: 포함된 수학 개념의 수 (1-5점)
- **관계 복잡도**: 개념 간 상호작용 수 (1-5점)
- **필수 단계**: 해결에 필요한 최소 단계 수 (1-10점)
- **전제 지식**: 필요한 선수 학습 개념 수 (0-10점)

#### B. 외재적 부하 (Extraneous Load)
문제 제시 방식의 복잡도
- **정보 밀도**: 제공된 정보의 양과 밀도 (1-5점)
- **시각적 복잡도**: 다이어그램, 표, 그래프 수 (0-5점)
- **언어 복잡도**: 문장 구조 및 어휘 난이도 (1-5점)
- **멀티미디어 요소**: 동시에 처리해야 할 정보 채널 수 (1-5점)

#### C. 본유적 부하 (Germane Load)
학습 스키마 구축에 필요한 인지적 노력
- **추상화 수준**: 구체적 vs 추상적 사고 요구 (1-5점)
- **패턴 인식**: 패턴 발견 및 적용 필요성 (1-5점)
- **전이 가능성**: 다른 문제로의 전이 가능성 (1-5점)

### 2.2 종합 인지 부하 점수 계산

```
총 인지 부하 점수 (CLS: Cognitive Load Score) =
  (내재적 부하 × 0.5) + (외재적 부하 × 0.3) + (본유적 부하 × 0.2)

점수 범위: 0-100

분류:
- 0-20: 매우 낮음 (Very Low)
- 21-40: 낮음 (Low)
- 41-60: 중간 (Medium)
- 61-80: 높음 (High)
- 81-100: 매우 높음 (Very High)
```

### 2.3 문제 유형별 가중치

| 문제 유형 | 내재적 | 외재적 | 본유적 | 예시 |
|---------|-------|-------|-------|------|
| 단순 계산 | 0.3 | 0.5 | 0.2 | 7 + 8 = ? |
| 단어 문제 | 0.4 | 0.4 | 0.2 | 사과 3개를 2명이 나눠먹으면? |
| 다단계 문제 | 0.5 | 0.3 | 0.2 | 분수 덧셈 후 약분 |
| 개념 이해 | 0.3 | 0.2 | 0.5 | 분수가 무엇인지 설명하기 |
| 문제 해결 | 0.6 | 0.2 | 0.2 | 최적화 문제 |
| 증명/논리 | 0.7 | 0.1 | 0.2 | 수학적 귀납법 |

---

## 3. Moodle 통합 아키텍처

### 3.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS (PHP 7.1.9)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Custom Activity Module: mod_cognitiveload           │   │
│  │ - 문제 메타데이터 수집                                │   │
│  │ - 학생 상호작용 추적                                   │   │
│  │ - 인지 부하 점수 표시                                  │   │
│  └─────────────┬────────────────────────────────────────┘   │
│                │ REST API                                    │
│  ┌─────────────▼────────────────────────────────────────┐   │
│  │ Moodle Web Services (webservice/rest/server.php)    │   │
│  └─────────────┬────────────────────────────────────────┘   │
└────────────────┼─────────────────────────────────────────────┘
                 │ HTTP REST
┌────────────────▼─────────────────────────────────────────────┐
│          Cognitive Load Analysis Service (Python)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ FastAPI REST API                                     │   │
│  │ - POST /api/analyze-problem                          │   │
│  │ - GET  /api/cognitive-load/{problem_id}              │   │
│  │ - POST /api/batch-analyze                            │   │
│  └─────────────┬────────────────────────────────────────┘   │
│  ┌─────────────▼────────────────────────────────────────┐   │
│  │ Cognitive Load Calculator                            │   │
│  │ - 문제 파싱 및 분석                                    │   │
│  │ - AI 기반 복잡도 평가 (Claude API)                    │   │
│  │ - 규칙 기반 점수 계산                                  │   │
│  └─────────────┬────────────────────────────────────────┘   │
└────────────────┼─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│               MySQL 5.7 Database                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Moodle Tables    │  │ Custom Tables    │                 │
│  │ - mdl_quiz       │  │ - cogload_cache  │                 │
│  │ - mdl_question   │  │ - cogload_metrics│                 │
│  │ - mdl_user       │  │ - problem_analysis│                │
│  └──────────────────┘  └──────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름

1. **문제 생성 단계**
   - 교사가 Moodle에서 문제(Quiz Question) 생성
   - Custom Activity Module이 문제 데이터를 캡처
   - Python API로 인지 부하 분석 요청 전송
   - 분석 결과를 Moodle DB에 저장

2. **학습 진행 단계**
   - 학생이 문제 풀이 시작
   - 행동 데이터 수집 (시간, 시도 횟수, 힌트 사용)
   - 실시간 인지 부하 조정 (동적 난이도 조절)

3. **분석 및 리포트**
   - 학생별 인지 부하 프로필 생성
   - 교사 대시보드에 통계 표시
   - 적응형 학습 경로 제안

---

## 4. Moodle 커스텀 모듈 구현

### 4.1 디렉토리 구조

```
moodle/
└── mod/
    └── cognitiveload/
        ├── version.php          # 모듈 버전 정보
        ├── lib.php              # 핵심 Moodle API 함수
        ├── mod_form.php         # 활동 설정 폼
        ├── view.php             # 학생 뷰
        ├── db/
        │   ├── install.xml      # 데이터베이스 스키마
        │   ├── access.php       # 권한 정의
        │   └── upgrade.php      # 업그레이드 스크립트
        ├── classes/
        │   ├── analyzer.php     # 인지 부하 분석기 클래스
        │   ├── api_client.php   # Python API 클라이언트
        │   └── output/
        │       └── dashboard.php # 대시보드 렌더러
        ├── lang/
        │   ├── en/
        │   │   └── cognitiveload.php
        │   └── ko/
        │       └── cognitiveload.php
        └── templates/
            ├── view.mustache
            └── dashboard.mustache
```

### 4.2 데이터베이스 스키마 (install.xml)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="mod/cognitiveload/db" VERSION="20251118"
  COMMENT="Cognitive Load Analysis Module">
  <TABLES>
    <!-- 문제별 인지 부하 캐시 -->
    <TABLE NAME="cogload_cache" COMMENT="Cached cognitive load scores">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="questionid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="intrinsic_load" TYPE="number" LENGTH="5" DECIMALS="2" NOTNULL="true"/>
        <FIELD NAME="extraneous_load" TYPE="number" LENGTH="5" DECIMALS="2" NOTNULL="true"/>
        <FIELD NAME="germane_load" TYPE="number" LENGTH="5" DECIMALS="2" NOTNULL="true"/>
        <FIELD NAME="total_score" TYPE="number" LENGTH="5" DECIMALS="2" NOTNULL="true"/>
        <FIELD NAME="difficulty_level" TYPE="char" LENGTH="20" NOTNULL="true"/>
        <FIELD NAME="problem_type" TYPE="char" LENGTH="50" NOTNULL="true"/>
        <FIELD NAME="analyzed_at" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
        <KEY NAME="questionid" TYPE="foreign" FIELDS="questionid"
             REFTABLE="question" REFFIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="questionid_idx" UNIQUE="false" FIELDS="questionid"/>
      </INDEXES>
    </TABLE>

    <!-- 학생별 인지 부하 메트릭 -->
    <TABLE NAME="cogload_student_metrics" COMMENT="Student cognitive load metrics">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="userid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="questionid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="quizattemptid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="time_spent" TYPE="int" LENGTH="10" NOTNULL="true"
               COMMENT="Time in seconds"/>
        <FIELD NAME="num_attempts" TYPE="int" LENGTH="5" NOTNULL="true"/>
        <FIELD NAME="hints_used" TYPE="int" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
        <FIELD NAME="perceived_difficulty" TYPE="int" LENGTH="2"
               COMMENT="1-5 scale, student self-report"/>
        <FIELD NAME="is_correct" TYPE="int" LENGTH="1" NOTNULL="true"/>
        <FIELD NAME="cognitive_load_experienced" TYPE="number" LENGTH="5"
               DECIMALS="2" COMMENT="Calculated from behavior"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
        <KEY NAME="userid" TYPE="foreign" FIELDS="userid" REFTABLE="user" REFFIELDS="id"/>
        <KEY NAME="questionid" TYPE="foreign" FIELDS="questionid"
             REFTABLE="question" REFFIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="userid_idx" UNIQUE="false" FIELDS="userid"/>
        <INDEX NAME="questionid_idx" UNIQUE="false" FIELDS="questionid"/>
      </INDEXES>
    </TABLE>

    <!-- 문제 상세 분석 결과 -->
    <TABLE NAME="cogload_analysis" COMMENT="Detailed problem analysis">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="questionid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="concept_count" TYPE="int" LENGTH="5" NOTNULL="true"/>
        <FIELD NAME="relationship_count" TYPE="int" LENGTH="5" NOTNULL="true"/>
        <FIELD NAME="required_steps" TYPE="int" LENGTH="5" NOTNULL="true"/>
        <FIELD NAME="prerequisite_concepts" TYPE="text" NOTNULL="false"
               COMMENT="JSON array of concept IDs"/>
        <FIELD NAME="visual_complexity" TYPE="int" LENGTH="2" NOTNULL="true"/>
        <FIELD NAME="linguistic_complexity" TYPE="number" LENGTH="5" DECIMALS="2"/>
        <FIELD NAME="abstraction_level" TYPE="int" LENGTH="2" NOTNULL="true"/>
        <FIELD NAME="ai_analysis" TYPE="text" NOTNULL="false"
               COMMENT="JSON of AI analysis results"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
        <KEY NAME="questionid" TYPE="foreign" FIELDS="questionid"
             REFTABLE="question" REFFIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="questionid_unique" UNIQUE="true" FIELDS="questionid"/>
      </INDEXES>
    </TABLE>
  </TABLES>
</XMLDB>
```

---

## 5. Python 인지 부하 분석 서비스

### 5.1 API 엔드포인트

```python
# cognitive_load_service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import anthropic
import os

app = FastAPI(title="Cognitive Load Analysis Service")

class ProblemAnalysisRequest(BaseModel):
    problem_id: int
    problem_type: str  # 'calculation', 'word_problem', 'multistep', etc.
    question_text: str
    question_html: Optional[str] = None
    answer_type: str  # 'numerical', 'multiple_choice', 'essay', etc.
    grade_level: int
    subject: str = "mathematics"

class CognitiveLoadResponse(BaseModel):
    problem_id: int
    intrinsic_load: float
    extraneous_load: float
    germane_load: float
    total_score: float
    difficulty_level: str
    analysis_details: Dict

class BatchAnalysisRequest(BaseModel):
    problems: List[ProblemAnalysisRequest]

@app.post("/api/analyze-problem", response_model=CognitiveLoadResponse)
async def analyze_problem(request: ProblemAnalysisRequest):
    """
    단일 문제의 인지 부하를 분석합니다.
    """
    try:
        # 인지 부하 계산기 초기화
        calculator = CognitiveLoadCalculator()

        # AI 기반 분석
        ai_analysis = await analyze_with_ai(request)

        # 규칙 기반 분석
        rule_analysis = calculator.calculate_rule_based(request)

        # 종합 점수 계산
        result = calculator.compute_final_score(ai_analysis, rule_analysis)

        return CognitiveLoadResponse(
            problem_id=request.problem_id,
            intrinsic_load=result['intrinsic'],
            extraneous_load=result['extraneous'],
            germane_load=result['germane'],
            total_score=result['total'],
            difficulty_level=result['level'],
            analysis_details=result['details']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-analyze")
async def batch_analyze(request: BatchAnalysisRequest):
    """
    여러 문제를 일괄 분석합니다.
    """
    results = []
    for problem in request.problems:
        result = await analyze_problem(problem)
        results.append(result)
    return {"results": results}

@app.get("/api/cognitive-load/{problem_id}")
async def get_cached_score(problem_id: int):
    """
    캐시된 인지 부하 점수를 조회합니다.
    """
    # Moodle DB에서 캐시된 점수 조회
    pass

async def analyze_with_ai(request: ProblemAnalysisRequest) -> Dict:
    """
    Claude API를 사용한 AI 기반 분석
    """
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""
당신은 교육 심리학 전문가입니다. 다음 수학 문제의 인지 부하를 분석해주세요.

문제 유형: {request.problem_type}
학년 수준: {request.grade_level}
문제 내용:
{request.question_text}

다음 차원에서 1-10점으로 평가해주세요:

1. **내재적 부하 (Intrinsic Load)**:
   - 개념 복잡도 (필요한 수학 개념의 수와 깊이)
   - 관계 복잡도 (개념 간 상호작용)
   - 필수 단계 수 (해결에 필요한 최소 단계)
   - 전제 지식 (필요한 선수 학습 개념)

2. **외재적 부하 (Extraneous Load)**:
   - 정보 밀도 (불필요한 정보의 양)
   - 시각적 복잡도
   - 언어 복잡도 (문장 구조, 어휘 난이도)

3. **본유적 부하 (Germane Load)**:
   - 추상화 수준
   - 패턴 인식 요구
   - 전이 가능성

JSON 형식으로 응답해주세요:
{{
  "intrinsic": {{
    "concept_complexity": <점수>,
    "relationship_complexity": <점수>,
    "required_steps": <점수>,
    "prerequisite_knowledge": <점수>,
    "reasoning": "<설명>"
  }},
  "extraneous": {{
    "information_density": <점수>,
    "visual_complexity": <점수>,
    "linguistic_complexity": <점수>,
    "reasoning": "<설명>"
  }},
  "germane": {{
    "abstraction_level": <점수>,
    "pattern_recognition": <점수>,
    "transfer_potential": <점수>,
    "reasoning": "<설명>"
  }},
  "concepts_identified": ["개념1", "개념2", ...],
  "prerequisite_concepts": ["선수개념1", "선수개념2", ...],
  "estimated_time_minutes": <예상 소요 시간>,
  "recommendations": "<교사를 위한 추천사항>"
}}
"""

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    import json
    response_text = message.content[0].text

    # JSON 추출 (마크다운 코드 블록 제거)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]

    return json.loads(response_text.strip())


class CognitiveLoadCalculator:
    """
    인지 부하 계산 엔진
    """

    # 문제 유형별 가중치
    TYPE_WEIGHTS = {
        'calculation': {'intrinsic': 0.3, 'extraneous': 0.5, 'germane': 0.2},
        'word_problem': {'intrinsic': 0.4, 'extraneous': 0.4, 'germane': 0.2},
        'multistep': {'intrinsic': 0.5, 'extraneous': 0.3, 'germane': 0.2},
        'conceptual': {'intrinsic': 0.3, 'extraneous': 0.2, 'germane': 0.5},
        'problem_solving': {'intrinsic': 0.6, 'extraneous': 0.2, 'germane': 0.2},
        'proof': {'intrinsic': 0.7, 'extraneous': 0.1, 'germane': 0.2},
    }

    def calculate_rule_based(self, request: ProblemAnalysisRequest) -> Dict:
        """
        규칙 기반 인지 부하 계산
        """
        # 텍스트 분석
        text_length = len(request.question_text)
        word_count = len(request.question_text.split())
        sentence_count = request.question_text.count('.') + request.question_text.count('?')

        # 수식 개수 (간단한 패턴 매칭)
        import re
        equation_count = len(re.findall(r'[+\-*/=]', request.question_text))
        number_count = len(re.findall(r'\d+', request.question_text))

        # 기본 복잡도 점수
        linguistic_complexity = min(10, word_count / 10)  # 100단어 = 10점
        information_density = min(10, (text_length / 100) * 2)

        return {
            'linguistic_complexity': linguistic_complexity,
            'information_density': information_density,
            'equation_count': equation_count,
            'number_count': number_count,
            'word_count': word_count
        }

    def compute_final_score(self, ai_analysis: Dict, rule_analysis: Dict) -> Dict:
        """
        AI 분석과 규칙 기반 분석을 결합하여 최종 점수 계산
        """
        # 내재적 부하 계산
        intrinsic = (
            ai_analysis['intrinsic']['concept_complexity'] * 0.3 +
            ai_analysis['intrinsic']['relationship_complexity'] * 0.3 +
            ai_analysis['intrinsic']['required_steps'] * 0.2 +
            ai_analysis['intrinsic']['prerequisite_knowledge'] * 0.2
        )

        # 외재적 부하 계산
        extraneous = (
            ai_analysis['extraneous']['information_density'] * 0.4 +
            ai_analysis['extraneous']['visual_complexity'] * 0.3 +
            ai_analysis['extraneous']['linguistic_complexity'] * 0.3
        )

        # 본유적 부하 계산
        germane = (
            ai_analysis['germane']['abstraction_level'] * 0.4 +
            ai_analysis['germane']['pattern_recognition'] * 0.3 +
            ai_analysis['germane']['transfer_potential'] * 0.3
        )

        # 총점 계산 (0-100 스케일)
        total_score = (intrinsic * 0.5 + extraneous * 0.3 + germane * 0.2) * 10

        # 난이도 레벨 결정
        if total_score <= 20:
            level = "Very Low"
        elif total_score <= 40:
            level = "Low"
        elif total_score <= 60:
            level = "Medium"
        elif total_score <= 80:
            level = "High"
        else:
            level = "Very High"

        return {
            'intrinsic': round(intrinsic, 2),
            'extraneous': round(extraneous, 2),
            'germane': round(germane, 2),
            'total': round(total_score, 2),
            'level': level,
            'details': {
                'ai_analysis': ai_analysis,
                'rule_analysis': rule_analysis,
                'estimated_time': ai_analysis.get('estimated_time_minutes', 0),
                'recommendations': ai_analysis.get('recommendations', '')
            }
        }
```

---

## 6. Moodle PHP 통합 코드

### 6.1 API 클라이언트 (classes/api_client.php)

```php
<?php
namespace mod_cognitiveload;

defined('MOODLE_INTERNAL') || die();

/**
 * Python 인지 부하 분석 API 클라이언트
 */
class api_client {

    private $api_base_url;
    private $api_key;

    public function __construct() {
        // config.php에서 설정 읽기
        $this->api_base_url = get_config('mod_cognitiveload', 'api_url') ?:
                              'http://localhost:8000';
        $this->api_key = get_config('mod_cognitiveload', 'api_key');
    }

    /**
     * 문제의 인지 부하를 분석합니다
     *
     * @param object $question Moodle question 객체
     * @return object 인지 부하 분석 결과
     */
    public function analyze_question($question) {
        global $DB;

        // 캐시 확인
        $cached = $DB->get_record('cogload_cache', ['questionid' => $question->id]);
        if ($cached && (time() - $cached->analyzed_at) < 86400) { // 24시간 캐시
            return $cached;
        }

        // 문제 유형 판별
        $problem_type = $this->determine_problem_type($question);

        // API 요청 데이터 준비
        $request_data = [
            'problem_id' => $question->id,
            'problem_type' => $problem_type,
            'question_text' => strip_tags($question->questiontext),
            'question_html' => $question->questiontext,
            'answer_type' => $question->qtype,
            'grade_level' => $this->estimate_grade_level($question),
            'subject' => 'mathematics'
        ];

        // API 호출
        $response = $this->call_api('/api/analyze-problem', 'POST', $request_data);

        if ($response && !isset($response->error)) {
            // 결과를 DB에 저장
            $this->cache_result($response);
            return $response;
        }

        return null;
    }

    /**
     * 여러 문제를 일괄 분석
     */
    public function batch_analyze($questions) {
        $problems = [];
        foreach ($questions as $question) {
            $problems[] = [
                'problem_id' => $question->id,
                'problem_type' => $this->determine_problem_type($question),
                'question_text' => strip_tags($question->questiontext),
                'question_html' => $question->questiontext,
                'answer_type' => $question->qtype,
                'grade_level' => $this->estimate_grade_level($question),
                'subject' => 'mathematics'
            ];
        }

        $response = $this->call_api('/api/batch-analyze', 'POST', ['problems' => $problems]);

        if ($response && isset($response->results)) {
            foreach ($response->results as $result) {
                $this->cache_result($result);
            }
        }

        return $response;
    }

    /**
     * API 호출 헬퍼
     */
    private function call_api($endpoint, $method = 'GET', $data = null) {
        $url = $this->api_base_url . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($this->api_key) {
            $headers[] = 'Authorization: Bearer ' . $this->api_key;
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code >= 200 && $http_code < 300) {
            return json_decode($response);
        }

        debugging('Cognitive Load API Error: ' . $response, DEBUG_DEVELOPER);
        return null;
    }

    /**
     * 분석 결과를 DB에 캐시
     */
    private function cache_result($result) {
        global $DB;

        $record = new \stdClass();
        $record->questionid = $result->problem_id;
        $record->intrinsic_load = $result->intrinsic_load;
        $record->extraneous_load = $result->extraneous_load;
        $record->germane_load = $result->germane_load;
        $record->total_score = $result->total_score;
        $record->difficulty_level = $result->difficulty_level;
        $record->problem_type = $result->analysis_details->ai_analysis->concepts_identified[0] ?? 'unknown';
        $record->analyzed_at = time();
        $record->timecreated = time();
        $record->timemodified = time();

        // 기존 레코드가 있으면 업데이트, 없으면 삽입
        $existing = $DB->get_record('cogload_cache', ['questionid' => $result->problem_id]);
        if ($existing) {
            $record->id = $existing->id;
            $DB->update_record('cogload_cache', $record);
        } else {
            $DB->insert_record('cogload_cache', $record);
        }
    }

    /**
     * 문제 유형 판별
     */
    private function determine_problem_type($question) {
        $text = strtolower(strip_tags($question->questiontext));

        // 간단한 패턴 매칭으로 문제 유형 판별
        if (preg_match('/증명|prove|proof/i', $text)) {
            return 'proof';
        } else if (preg_match('/설명|explain|describe|what is/i', $text)) {
            return 'conceptual';
        } else if (str_word_count($text) > 30) {
            return 'word_problem';
        } else if (preg_match('/[+\-×÷*\/].*[+\-×÷*\/]/', $text)) {
            return 'multistep';
        } else {
            return 'calculation';
        }
    }

    /**
     * 학년 수준 추정
     */
    private function estimate_grade_level($question) {
        // 카테고리나 태그에서 학년 정보 추출
        // 또는 기본값 반환
        return 5; // 기본값: 5학년
    }
}
```

### 6.2 이벤트 옵저버 (classes/observer.php)

```php
<?php
namespace mod_cognitiveload;

defined('MOODLE_INTERNAL') || die();

/**
 * 이벤트 옵저버: Quiz 문제 생성/수정 시 자동 분석
 */
class observer {

    /**
     * 문제가 생성되었을 때 호출
     */
    public static function question_created(\core\event\question_created $event) {
        global $DB;

        $questionid = $event->objectid;
        $question = $DB->get_record('question', ['id' => $questionid]);

        if ($question) {
            $api_client = new api_client();
            $api_client->analyze_question($question);
        }
    }

    /**
     * 문제가 수정되었을 때 호출
     */
    public static function question_updated(\core\event\question_updated $event) {
        global $DB;

        $questionid = $event->objectid;
        $question = $DB->get_record('question', ['id' => $questionid]);

        if ($question) {
            // 캐시 무효화 후 재분석
            $DB->delete_records('cogload_cache', ['questionid' => $questionid]);

            $api_client = new api_client();
            $api_client->analyze_question($question);
        }
    }

    /**
     * 학생이 문제를 시도했을 때 호출
     */
    public static function question_answered(\mod_quiz\event\attempt_submitted $event) {
        global $DB;

        $attemptid = $event->objectid;
        $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);

        if ($attempt) {
            self::record_student_metrics($attempt);
        }
    }

    /**
     * 학생 행동 메트릭 기록
     */
    private static function record_student_metrics($attempt) {
        global $DB;

        // 문제별 시도 정보 수집
        $question_attempts = $DB->get_records('question_attempts',
            ['questionusageid' => $attempt->uniqueid]);

        foreach ($question_attempts as $qa) {
            $record = new \stdClass();
            $record->userid = $attempt->userid;
            $record->questionid = $qa->questionid;
            $record->quizattemptid = $attempt->id;

            // 행동 데이터 계산
            $steps = $DB->get_records('question_attempt_steps',
                ['questionattemptid' => $qa->id], 'timecreated ASC');

            if (!empty($steps)) {
                $first_step = reset($steps);
                $last_step = end($steps);

                $record->time_spent = $last_step->timecreated - $first_step->timecreated;
                $record->num_attempts = count($steps);
                $record->is_correct = ($qa->responsesummary === $qa->rightanswer) ? 1 : 0;

                // 경험한 인지 부하 추정 (시간과 시도 횟수 기반)
                $record->cognitive_load_experienced = self::estimate_experienced_load(
                    $record->time_spent,
                    $record->num_attempts,
                    $record->is_correct
                );

                $record->timecreated = time();

                $DB->insert_record('cogload_student_metrics', $record);
            }
        }
    }

    /**
     * 경험한 인지 부하 추정
     */
    private static function estimate_experienced_load($time_spent, $num_attempts, $is_correct) {
        // 기본 점수: 시간 (초당 0.1점)
        $time_score = min(50, $time_spent * 0.1);

        // 시도 횟수 패널티 (시도당 10점)
        $attempt_penalty = ($num_attempts - 1) * 10;

        // 정답 보너스 (맞으면 -10점)
        $correctness_bonus = $is_correct ? -10 : 0;

        $total = $time_score + $attempt_penalty + $correctness_bonus;

        return max(0, min(100, $total));
    }
}
```

---

## 7. 대시보드 및 리포트

### 7.1 교사 대시보드

교사 대시보드에서 다음 정보를 제공:

1. **퀴즈별 인지 부하 분포**
   - 전체 문제의 인지 부하 히스토그램
   - 문제 유형별 평균 인지 부하
   - 난이도 불균형 경고

2. **학생별 인지 부하 프로필**
   - 학생이 잘 대처하는 인지 부하 범위
   - 어려움을 겪는 문제 유형
   - 개인 맞춤형 학습 추천

3. **문제 추천**
   - 인지 부하 기반 문제 추천
   - 적응형 난이도 조절 제안

### 7.2 학생 뷰

학생에게는:
- 문제 난이도 표시 (별 개수 또는 색상)
- 예상 소요 시간
- 힌트 제공 (인지 부하 완화)

---

## 8. 배포 및 설정

### 8.1 Python 서비스 배포

```bash
# 의존성 설치
pip install fastapi uvicorn anthropic pydantic pymysql

# 환경 변수 설정
export ANTHROPIC_API_KEY="your-api-key"
export DATABASE_URL="mysql://user:pass@localhost/moodle"

# 서비스 실행
uvicorn cognitive_load_service.main:app --host 0.0.0.0 --port 8000
```

### 8.2 Moodle 플러그인 설치

```bash
cd /path/to/moodle
git clone <repository> mod/cognitiveload
cd mod/cognitiveload
```

Moodle 관리자 페이지에서 플러그인 설치 완료

### 8.3 설정

Moodle 관리 페이지 → 플러그인 → 활동 모듈 → Cognitive Load

- API URL: `http://your-server:8000`
- API Key: (선택사항)
- 캐시 유효 기간: 24시간
- 자동 분석 활성화: 예

---

## 9. 성능 고려사항

- **캐싱**: 동일 문제에 대한 반복 분석 방지 (24시간 캐시)
- **비동기 처리**: 문제 분석을 백그라운드 작업으로 처리
- **배치 처리**: 퀴즈 전체를 한 번에 분석하여 API 호출 최소화
- **Claude API 비용**: 문제당 약 $0.01-0.02 예상

---

## 10. 향후 개선 방향

1. **실시간 적응형 학습**: 학생 행동에 따라 실시간으로 문제 난이도 조절
2. **AI 개인교사**: 인지 부하를 고려한 맞춤형 힌트 제공
3. **협업 학습**: 그룹 학습 시 팀 전체의 인지 부하 균형
4. **종단 연구**: 장기간 데이터 수집으로 학습 패턴 분석
5. **다국어 지원**: 다양한 언어로 된 문제 분석

---

## 참고 문헌

- Sweller, J. (1988). Cognitive load during problem solving.
- Paas, F., & Van Merriënboer, J. (1994). Instructional control of cognitive load.
- Moodle Documentation: https://docs.moodle.org/dev/
- Claude API Documentation: https://docs.anthropic.com/
