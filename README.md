# Moodle Self-Grading Math System

독립형 웹앱으로 Moodle LMS와 LTI 연동하여 학생들이 수학 문제를 풀고 **검산 근거를 스스로 작성**하도록 하는 시스템입니다.

## 주요 기능

### 🎯 핵심 기능
- **자기평가 (Self-Verification)**: 학생들이 문제 풀이 후 검산 근거를 스스로 작성
- **AI 기반 검증**: Claude API를 사용하여 검산 근거의 논리성, 완전성, 명확성 분석
- **LTI 1.1 연동**: Moodle 3.7과 표준 LTI 프로토콜로 완벽 통합
- **자동 채점**: 답안 정확도(70%) + 검산 품질(30%)로 자동 채점
- **성적 전송**: 채점 결과를 Moodle 성적부로 자동 전송

### 👨‍🏫 교사 기능
- 수학 문제 출제 및 관리
- 난이도, 점수, 제한시간 설정
- 학생 제출물 및 AI 피드백 확인
- 문제별 통계 (정답률, 평균 점수)

### 👨‍🎓 학생 기능
- 문제 풀이 및 답안 작성
- 풀이 과정 설명
- **검산 근거 작성** (자기평가의 핵심)
- 즉각적인 AI 피드백 수신
- 제출 이력 및 성적 확인

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: Bootstrap 4, jQuery, MathJax
- **LTI**: IMS LTI 1.1 (OAuth 1.0 서명)
- **AI**: Claude API (Anthropic)

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹서버
- Moodle 3.7 이상
- Claude API 키 (선택사항, AI 검증 기능용)

## 설치 방법

자세한 설치 가이드는 [INSTALL.md](./INSTALL.md)를 참조하세요.

### 빠른 시작

1. **데이터베이스 생성**
```bash
mysql -u root -p < database/migrations/001_initial_schema.sql
```

2. **환경 설정**
```bash
cp src/config/config.php.example src/config/config.php
# config.php 파일 편집
```

3. **웹서버 설정**
```bash
# public 폴더를 문서 루트로 설정
```

4. **Moodle LTI 설정**
- Moodle 관리자 페이지에서 외부 도구 추가
- Consumer Key와 Secret 설정
- Launch URL: `https://your-domain.com/lti/launch`

## 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── migrations/          # 데이터베이스 마이그레이션
├── docs/                    # 문서
├── public/                  # 웹 접근 루트
│   └── index.php           # 메인 진입점
├── src/
│   ├── api/                # API 엔드포인트
│   ├── assets/             # CSS, JS, 이미지
│   ├── config/             # 설정 파일
│   ├── controllers/        # 컨트롤러
│   ├── lib/                # 라이브러리 (Database, LTI, AI)
│   ├── models/             # 데이터 모델
│   └── views/              # 뷰 템플릿
├── logs/                   # 애플리케이션 로그
└── uploads/                # 업로드 파일
```

## 핵심 컴포넌트

### LTI 통합 (`src/lib/LTIHandler.php`)
- OAuth 1.0 서명 검증
- 사용자 인증 및 세션 생성
- 성적 전송 (LTI Outcome Service)

### AI 검증 (`src/lib/AIVerifier.php`)
- Claude API 호출
- 검산 근거 품질 분석
- 논리성, 완전성, 명확성 점수 산출
- 피드백 및 개선 제안 생성

### 데이터 모델
- **Problem**: 수학 문제
- **Submission**: 학생 제출물
- **Verification**: AI 검증 결과
- **LTI Session**: LTI 세션 관리

## 사용 예시

### 학생 워크플로우
1. Moodle 코스에서 외부 도구 클릭
2. LTI 인증 후 시스템 접속
3. 문제 선택 및 풀이
4. 답안 작성
5. 풀이 과정 설명
6. **검산 근거 작성** (예: "답을 원래 식에 대입하여 확인함")
7. 제출
8. 즉각적인 AI 피드백 및 채점 결과 확인
9. 성적이 자동으로 Moodle에 전송됨

### 교사 워크플로우
1. LTI를 통해 시스템 접속
2. 새 문제 생성
3. 문제 설명, 정답, 난이도 등 설정
4. 검산 필수 여부 설정
5. 학생 제출물 확인
6. AI 분석 결과 및 학생 검산 근거 검토
7. 필요시 추가 피드백 작성

## 설정 옵션

### 채점 가중치 (`src/config/config.php`)
```php
define('ANSWER_WEIGHT', 0.7);      // 답안 정확도: 70%
define('VERIFICATION_WEIGHT', 0.3); // 검산 품질: 30%
```

### AI 설정
```php
define('AI_ENABLED', true);
define('CLAUDE_API_KEY', 'your-api-key');
define('CLAUDE_MODEL', 'claude-3-sonnet-20240229');
```

## 보안 고려사항

- OAuth 1.0 서명 검증 (LTI)
- CSRF 토큰 보호
- SQL Injection 방지 (PDO Prepared Statements)
- XSS 방지 (htmlspecialchars)
- 세션 보안 (httponly, secure)

## 문제 해결

### LTI 인증 실패
- Consumer Key와 Secret 확인
- OAuth 서명 알고리즘 확인 (HMAC-SHA1)
- 시스템 시간 동기화 확인

### AI 검증 실패
- Claude API 키 확인
- API 요청 제한 확인
- 로그 파일 확인 (`logs/`)

### 성적 전송 실패
- LTI Outcome Service URL 확인
- sourcedId 확인
- Moodle 로그 확인

## 로깅

로그 파일은 `logs/YYYY-MM-DD.log` 형식으로 저장됩니다.

```php
Logger::info('Message');
Logger::error('Error message', ['context' => $data]);
```

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원

- 문의: KAIST Touch Math Academy
- 문서: `/docs` 폴더 참조

## 기여

버그 리포트 및 기능 제안을 환영합니다.

## 버전 히스토리

### v1.0.0 (2025-11-18)
- 초기 릴리스
- LTI 1.1 Moodle 연동
- AI 기반 자기평가 검증
- 자동 채점 및 성적 전송
- 교사/학생 대시보드
