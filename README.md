# Moodle LMS 인지 부하 수치화 통합 시스템

Moodle 3.7 LMS와 연동하여 문제 유형별로 필요한 인지 부하(사고 체력량)를 자동으로 수치화하고 측정하는 시스템입니다.

## 🎯 주요 기능

- **자동 인지 부하 분석**: 문제 생성 시 자동으로 인지 부하 수치화
- **AI 기반 평가**: Claude API를 활용한 정밀한 복잡도 분석
- **3차원 평가**: 내재적/외재적/본유적 부하 종합 평가
- **실시간 학생 메트릭**: 학생의 실제 경험한 인지 부하 측정
- **교사 대시보드**: 문제별, 퀴즈별 인지 부하 시각화 및 분석
- **적응형 학습 지원**: 학생 수준에 맞는 문제 추천

## 📋 기술 스택

### Backend (Python)
- **FastAPI**: REST API 서버
- **Anthropic Claude**: AI 기반 문제 분석
- **Pydantic**: 데이터 검증 및 모델링

### Frontend (Moodle Plugin)
- **PHP 7.1.9**: Moodle 플러그인
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 플랫폼

## 🚀 빠른 시작

### 1. Python 서비스 설치

```bash
cd cognitive_load_service

# 가상 환경 생성 (권장)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
export ANTHROPIC_API_KEY="your-claude-api-key-here"

# 서비스 실행
uvicorn main:app --host 0.0.0.0 --port 8000
```

서비스가 실행되면 http://localhost:8000 에서 확인 가능합니다.

### 2. Moodle 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/moodle_plugin/mod/cognitiveload mod/

# 또는 심볼릭 링크 생성
ln -s /path/to/moodle_plugin/mod/cognitiveload mod/cognitiveload
```

Moodle 관리자 페이지에 로그인하여 플러그인 설치를 완료합니다:

1. 사이트 관리 → 알림
2. "Upgrade database now" 클릭
3. 플러그인 설정 페이지에서 API URL 설정: `http://localhost:8000`

### 3. 테스트

```bash
# Python API 테스트
cd cognitive_load_service
python test_api.py

# 또는 curl로 테스트
curl -X POST http://localhost:8000/api/analyze-problem \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "problem_type": "calculation",
    "question_text": "7 + 8 = ?",
    "answer_type": "numerical",
    "grade_level": 2
  }'
```

## 📚 문서

자세한 문서는 다음을 참고하세요:

- **[기술 사양 및 아키텍처](docs/moodle-cognitive-load-integration.md)**: 전체 시스템 설계 및 구현 상세
- **[PRD](tasks/0001-prd-ai-education-pipeline.md)**: AI 교육 시스템 파이프라인 제품 요구사항

## 🧠 인지 부하 이론

이 시스템은 Sweller의 인지 부하 이론(Cognitive Load Theory)을 기반으로 합니다:

### 1. 내재적 부하 (Intrinsic Load)
- 문제 자체의 본질적 복잡도
- 개념 복잡도, 관계 복잡도, 필수 단계 수, 전제 지식

### 2. 외재적 부하 (Extraneous Load)
- 문제 제시 방식으로 인한 불필요한 부하
- 정보 밀도, 시각적 복잡도, 언어 복잡도

### 3. 본유적 부하 (Germane Load)
- 학습 스키마 구축에 필요한 인지적 노력
- 추상화 수준, 패턴 인식 요구, 전이 가능성

### 종합 점수 계산

```
총 인지 부하 점수 (0-100) =
  (내재적 부하 × 0.5) + (외재적 부하 × 0.3) + (본유적 부하 × 0.2)

난이도 분류:
- 0-20: 매우 낮음
- 21-40: 낮음
- 41-60: 중간
- 61-80: 높음
- 81-100: 매우 높음
```

## 🔧 설정

### Python 서비스 설정

환경 변수로 설정:

```bash
# 필수
export ANTHROPIC_API_KEY="sk-ant-..."

# 선택사항
export DATABASE_URL="mysql://user:pass@localhost/moodle"
```

### Moodle 플러그인 설정

Moodle 관리 → 플러그인 → 활동 모듈 → Cognitive Load Analysis:

- **API URL**: Python 서비스 주소 (예: http://localhost:8000)
- **API Key**: 인증 키 (선택사항)
- **Cache Duration**: 캐시 유효 기간 (초, 기본: 86400 = 24시간)

## 📊 API 엔드포인트

### 단일 문제 분석
```
POST /api/analyze-problem
```

### 일괄 분석
```
POST /api/batch-analyze
```

### 퀴즈 분석
```
POST /api/analyze-quiz
```

### 캐시 조회
```
GET /api/cognitive-load/{problem_id}
```

### 통계
```
GET /api/stats
```

자세한 API 문서는 http://localhost:8000/docs 에서 확인 가능합니다.

## 🎨 사용 예시

### 교사 워크플로우

1. **문제 생성**: Moodle에서 퀴즈 문제 생성
2. **자동 분석**: 시스템이 자동으로 인지 부하 분석
3. **결과 확인**: 문제 편집 페이지에서 인지 부하 점수 확인
4. **조정**: 필요시 문제 난이도 조정
5. **퀴즈 구성**: 균형잡힌 난이도로 퀴즈 구성

### 학생 경험

1. **문제 풀이**: 학생이 퀴즈 시작
2. **행동 추적**: 시스템이 소요 시간, 시도 횟수 등 기록
3. **적응형 힌트**: 인지 부하가 높으면 자동으로 힌트 제공
4. **개인화**: 학생 수준에 맞는 문제 추천

## 🧪 문제 유형 예시

### 1. 단순 계산 (Very Low)
```
7 + 8 = ?
→ 인지 부하: 15점
```

### 2. 단어 문제 (Low-Medium)
```
철수는 사과를 12개 가지고 있었습니다.
영희에게 5개를 주고, 민수에게 3개를 주었습니다.
철수에게 남은 사과는 몇 개입니까?
→ 인지 부하: 35점
```

### 3. 다단계 문제 (Medium-High)
```
2/4 + 3/6을 더한 후 약분하세요.
→ 인지 부하: 58점
```

### 4. 증명 문제 (Very High)
```
n(n+1)/2가 1부터 n까지의 합임을 수학적 귀납법으로 증명하세요.
→ 인지 부하: 85점
```

## 🔒 보안

- API 키 인증 지원 (선택사항)
- CORS 설정으로 허용된 도메인만 접근
- SQL Injection 방지 (Parameterized queries)
- 입력 검증 및 Sanitization

## 📈 성능

- **캐싱**: 동일 문제에 대한 반복 분석 방지 (24시간 캐시)
- **비동기 처리**: 문제 분석을 백그라운드 작업으로 처리
- **배치 처리**: 퀴즈 전체를 한 번에 분석하여 API 호출 최소화
- **예상 비용**: Claude API 문제당 약 $0.01-0.02

## 🛠️ 문제 해결

### Python 서비스가 시작되지 않음

```bash
# ANTHROPIC_API_KEY 확인
echo $ANTHROPIC_API_KEY

# 포트 충돌 확인
lsof -i :8000

# 로그 확인
uvicorn main:app --log-level debug
```

### Moodle 플러그인 설치 오류

```bash
# 권한 확인
chmod -R 755 mod/cognitiveload

# 캐시 삭제
php admin/cli/purge_caches.php
```

### API 연결 오류

- Moodle 설정에서 API URL이 올바른지 확인
- 방화벽에서 포트 8000이 열려있는지 확인
- curl로 직접 테스트: `curl http://localhost:8000/health`

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 📄 라이선스

GNU GPL v3 or later

## 📞 지원

문제가 발생하거나 질문이 있으시면:

1. 문서 확인: `docs/moodle-cognitive-load-integration.md`
2. API 문서: http://localhost:8000/docs
3. 로그 확인: 서비스 로그 및 Moodle 디버그 모드

## 🗺️ 로드맵

### 단기 (v1.0)
- ✅ 기본 인지 부하 분석
- ✅ Moodle 통합
- ✅ 교사 대시보드

### 중기 (v1.5)
- ⬜ 실시간 적응형 학습
- ⬜ AI 개인교사 힌트
- ⬜ 다양한 문제 유형 지원

### 장기 (v2.0)
- ⬜ 협업 학습 지원
- ⬜ 종단 연구 데이터 분석
- ⬜ 다국어 지원 확대

---

Made with ❤️ for education
