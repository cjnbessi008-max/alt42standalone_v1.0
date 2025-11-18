# Step Simplifier - 방정식 단계별 풀이 앱

Moodle LMS와 연동되는 수학 방정식 단계별 학습 웹 애플리케이션

## 스크린샷

![Step Simplifier](docs/screenshot.png)

## 주요 기능

- ✅ 복잡한 방정식을 단계별로 풀이
- ✅ Moodle 3.7 LMS 연동
- ✅ 실시간 정답 검증 및 피드백
- ✅ 학습 진행 상황 추적
- ✅ 모바일 친화적 UI (가상 스마트폰 화면)
- ✅ MySQL 5.7, PHP 7.1.9 기반

## 빠른 시작

### 필수 요구사항

- PHP 7.1.9+
- MySQL 5.7+
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)

### 설치

1. **파일 복사**
   ```bash
   git clone <repository-url>
   cd step-simplifier
   ```

2. **데이터베이스 설정**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **환경 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 데이터베이스 정보 입력
   ```

4. **웹 서버 설정**
   - 프로젝트 디렉토리를 웹 서버 루트에 배치
   - Apache의 경우 mod_rewrite 활성화 필요

5. **브라우저에서 실행**
   ```
   http://localhost/step-simplifier/frontend/index.html
   ```

## 문서

- [설치 가이드](docs/INSTALLATION.md)
- [API 문서](docs/API.md)
- [상세 README](docs/README.md)

## 프로젝트 구조

```
step-simplifier/
├── backend/           # PHP 백엔드
│   ├── api/          # REST API 엔드포인트
│   ├── config/       # 설정 파일
│   ├── models/       # 데이터 모델
│   └── moodle/       # Moodle 연동
├── frontend/         # 웹 프론트엔드
│   ├── css/          # 스타일시트
│   ├── js/           # JavaScript
│   └── index.html    # 메인 HTML
├── database/         # DB 스키마
└── docs/            # 문서
```

## 기술 스택

- **백엔드**: PHP 7.1.9, MySQL 5.7
- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **LMS**: Moodle 3.7 Web Services
- **API**: RESTful JSON API

## API 예제

### 문제 가져오기
```javascript
GET /api/problems/1
```

### 답안 제출
```javascript
POST /api/progress/submit
{
  "user_id": 1,
  "problem_id": 1,
  "step_number": 2,
  "user_answer": "3x = 15"
}
```

## 라이선스

MIT License

## 기여

Pull Request를 환영합니다!

## 문의

이슈를 등록해주세요.
