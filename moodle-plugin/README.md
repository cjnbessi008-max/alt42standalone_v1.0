# Problem Explanation - Moodle Activity Module

![Moodle 3.7](https://img.shields.io/badge/Moodle-3.7-orange)
![PHP 7.1.9](https://img.shields.io/badge/PHP-7.1.9-blue)
![MySQL 5.7](https://img.shields.io/badge/MySQL-5.7-blue)
![License GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-green)

## 개요 (Overview)

**Problem Explanation** 모듈은 학생들이 문제를 남에게 가르치듯 설명하도록 유도하여, "Learning by Teaching" (가르치며 배우기) 교육학적 원리를 통해 깊은 이해를 촉진하는 Moodle 활동 모듈입니다.

The **Problem Explanation** module is a Moodle activity that encourages students to explain problems as if teaching others, promoting deeper understanding through the "Learning by Teaching" pedagogical approach.

### 주요 기능 (Key Features)

- ✅ **단계별 문제 설명** - 학생들이 문제 해결 과정을 여러 단계로 나누어 설명
- 🤖 **AI 기반 자동 평가** - Claude API를 사용한 설명 품질 자동 평가
- 📊 **다차원 평가** - 명확성, 완전성, 정확성, 교육학적 품질 측정
- 👥 **동료 평가 (선택)** - 학생들이 서로의 설명을 평가하고 피드백 제공
- 📈 **교사 대시보드** - 모든 제출물 검토 및 성적 부여
- 🎯 **맞춤형 설정** - 최소/최대 단계 수, 평가 방식 등 유연한 설정

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.7 or later
- **PHP**: 7.1.9 or later
- **MySQL**: 5.7 or later
- **Claude API Key**: For AI evaluation feature (optional)

## 설치 방법 (Installation)

### 1. 플러그인 설치

```bash
# Moodle 루트 디렉토리로 이동
cd /path/to/moodle

# mod 디렉토리에 플러그인 복사
cp -r /path/to/mod_problemexplain ./mod/problemexplain

# 파일 권한 설정
chown -R www-data:www-data mod/problemexplain
chmod -R 755 mod/problemexplain
```

### 2. 데이터베이스 설치

Moodle 관리자 계정으로 로그인한 후:

1. **사이트 관리 > 알림** 페이지 방문
2. 자동으로 데이터베이스 테이블이 생성됩니다
3. 설치 완료 확인

### 3. Claude API 설정 (선택사항)

AI 평가 기능을 사용하려면:

1. **사이트 관리 > 플러그인 > 활동 모듈 > Problem Explanation** 이동
2. Claude API Key 입력 (https://console.anthropic.com/ 에서 발급)
3. 원하는 Claude 모델 선택:
   - **Claude 3 Opus**: 가장 강력 (높은 비용)
   - **Claude 3 Sonnet**: 균형잡힌 성능 (권장)
   - **Claude 3 Haiku**: 가장 빠름 (저비용)
4. 설정 저장

## 사용 방법 (Usage)

### 교사용 (For Teachers)

#### 활동 생성

1. 코스 페이지에서 **활동 추가 > Problem Explanation** 선택
2. 기본 설정:
   - **활동 이름**: 활동 제목 입력
   - **설명**: 활동 소개 입력

3. 문제 설정:
   - **문제 텍스트**: 학생들이 설명할 문제 입력
   - **문제 유형**: arithmetic, algebra, geometry 등 선택

4. 요구사항 설정:
   - **최소 단계 수**: 학생이 포함해야 할 최소 설명 단계 (기본: 3)
   - **최대 단계 수**: 허용되는 최대 단계 수 (기본: 10)

5. 평가 설정:
   - **AI 평가 활성화**: Claude API를 통한 자동 평가
   - **동료 평가 활성화**: 학생 간 상호 평가
   - **필요한 동료 평가 수**: 각 학생이 완료해야 할 평가 수

6. 성적 설정:
   - **최대 점수**: 활동의 만점 (기본: 100)

#### 제출물 검토 및 채점

1. 활동 페이지에서 **모든 제출물** 클릭
2. 대시보드에서 제출 현황 확인:
   - 총 제출물 수
   - 제출 완료 수
   - 채점 완료 수
   - 임시 저장 수

3. 개별 제출물 채점:
   - **채점** 버튼 클릭
   - 학생의 단계별 설명 검토
   - AI 평가 결과 참고 (활성화된 경우)
   - 점수 입력 및 피드백 작성
   - 저장

### 학생용 (For Students)

#### 문제 설명 작성

1. 활동 페이지 방문
2. 문제 읽기 및 이해
3. **설명 제목** 입력

4. 단계별 설명 작성:
   - **단계 제목**: 각 단계의 간략한 제목
   - **단계 설명**: 해당 단계에서 무엇을 하는지 상세히 설명
   - **이유**: 왜 이 단계가 필요한지 설명

5. 단계 추가/제거:
   - **단계 추가** 버튼으로 새 단계 추가
   - **단계 제거** 버튼으로 불필요한 단계 삭제

6. 저장 및 제출:
   - **변경사항 저장**: 임시 저장 (나중에 계속 작업 가능)
   - **설명 제출**: 최종 제출 (AI 평가 시작)

#### AI 평가 결과 확인

제출 후 AI 평가가 완료되면:

- **명확성 점수**: 설명이 얼마나 명확하고 이해하기 쉬운지
- **완전성 점수**: 필요한 모든 내용이 포함되었는지
- **정확성 점수**: 수학적/개념적 정확도
- **교육학적 품질 점수**: 가르치는 도구로서의 효과성
- **종합 점수**: 전체 평가 점수
- **AI 피드백**: 잘한 점에 대한 긍정적 피드백
- **개선 제안**: 구체적이고 실행 가능한 개선 방안

## 데이터베이스 스키마 (Database Schema)

### 주요 테이블 (Main Tables)

- **mdl_problemexplain**: 활동 인스턴스
- **mdl_problemexplain_submissions**: 학생 제출물
- **mdl_problemexplain_steps**: 설명 단계
- **mdl_problemexplain_ai_eval**: AI 평가 결과
- **mdl_problemexplain_grades**: 교사 성적
- **mdl_problemexplain_peer_reviews**: 동료 평가

자세한 스키마는 `db/install.xml` 참조

## 개발 정보 (Development)

### 파일 구조

```
mod_problemexplain/
├── version.php              # 플러그인 버전 정보
├── lib.php                  # 핵심 Moodle 함수
├── mod_form.php             # 활동 설정 폼
├── view.php                 # 학생 메인 페이지
├── submissions.php          # 교사 제출물 목록
├── grade.php                # 교사 채점 페이지
├── explanation_form.php     # 학생 설명 작성 폼
├── settings.php             # 관리자 설정
├── db/
│   ├── install.xml          # 데이터베이스 스키마
│   └── access.php           # 권한 정의
├── classes/
│   ├── submission_handler.php   # 제출 처리
│   ├── ai_evaluator.php         # AI 평가 엔진
│   └── event/                    # 이벤트 클래스
└── lang/
    └── en/
        └── problemexplain.php   # 언어 문자열
```

### AI 평가 기준

Claude API는 다음 기준으로 학생 설명을 평가합니다:

1. **Clarity (명확성) - 25%**
   - 기술 용어 설명 여부
   - 접근하기 쉬운 언어 사용
   - 논리적 단계 구성

2. **Completeness (완전성) - 25%**
   - 필수 단계 포함 여부
   - 추론의 빈틈 확인
   - 재현 가능성

3. **Accuracy (정확성) - 30%**
   - 계산의 정확도
   - 개념 설명의 정확성
   - 오개념 여부

4. **Pedagogy (교육학적 품질) - 20%**
   - "왜"에 대한 설명
   - 예시/비유 사용
   - 진정한 이해 촉진

### 프롬프트 엔지니어링

AI 평가 프롬프트는 `classes/ai_evaluator.php`의 `build_evaluation_prompt()` 메서드에서 관리됩니다. 평가 기준 조정이 필요한 경우 이 메서드를 수정하세요.

## 문제 해결 (Troubleshooting)

### AI 평가가 작동하지 않음

1. **API Key 확인**: 설정에서 Claude API key가 올바르게 입력되었는지 확인
2. **네트워크 연결**: 서버가 api.anthropic.com에 접근 가능한지 확인
3. **오류 로그**: Moodle 디버그 모드 활성화 후 오류 확인
4. **API 할당량**: Claude API 사용량 제한 확인

### 제출물이 저장되지 않음

1. **파일 권한**: mod/problemexplain 디렉토리 권한 확인
2. **데이터베이스**: 테이블이 올바르게 생성되었는지 확인
3. **세션**: 사용자 세션이 유효한지 확인

### 스타일/레이아웃 문제

1. **캐시 정리**: Moodle 캐시 비우기 (사이트 관리 > 개발 > 캐시 삭제)
2. **테마 호환성**: 다른 테마에서 테스트
3. **브라우저 캐시**: 브라우저 캐시 및 쿠키 삭제

## 라이선스 (License)

이 플러그인은 GNU GPL v3 라이선스 하에 배포됩니다.

## 기여 (Contributing)

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

## 지원 (Support)

- **이슈**: GitHub Issues를 통해 문제 보고
- **문의**: KAIST Touch Math Academy

## 크레딧 (Credits)

- **개발**: KAIST Touch Math Academy
- **AI 엔진**: Anthropic Claude
- **교육학 자문**: Learning by Teaching 연구팀

## 버전 히스토리 (Version History)

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 문제 설명 기능
- Claude API 통합
- AI 자동 평가
- 교사 채점 인터페이스
- 동료 평가 기능 (기본)

---

**Made with ❤️ for better learning through teaching**
