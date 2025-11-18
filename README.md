# Sequence Puzzle - 수열 퍼즐 학습 앱

Moodle 3.7 LMS와 연동하여 수열의 규칙을 퍼즐로 조립하게 하는 교육용 웹 애플리케이션입니다.

## 🎯 주요 기능

- **다양한 수열 유형**: 등차수열, 등비수열, 피보나치, 커스텀 규칙
- **인터랙티브 퍼즐**: 드래그 앤 드롭 방식으로 규칙 조각 조립
- **가상 스마트폰 UI**: 우측 하단에 모바일 화면 시뮬레이터
- **Moodle LTI 연동**: 학습 결과를 Moodle 성적부로 자동 전송
- **실시간 피드백**: 즉각적인 정답/오답 피드백
- **학습 진도 추적**: 문제 풀이 통계 및 성과 분석

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache**: mod_rewrite 활성화
- **Moodle**: 3.7 (LTI 연동 시)

## 🚀 설치 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE sequence_puzzle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 스키마 및 샘플 데이터 임포트
mysql -u root -p sequence_puzzle < database/schema.sql
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 데이터베이스 정보 입력
nano .env
```

### 4. 웹 서버 설정

#### Apache 가상 호스트 설정 예시:

```apache
<VirtualHost *:80>
    ServerName sequence-puzzle.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sequence_puzzle_error.log
    CustomLog ${APACHE_LOG_DIR}/sequence_puzzle_access.log combined
</VirtualHost>
```

```bash
# Apache 재시작
sudo systemctl restart apache2
```

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 쓰기 권한 부여
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

## 🔧 Moodle LTI 연동 설정

### 1. Moodle에서 외부 도구 설정

1. **사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구 > 도구 관리**로 이동
2. **수동으로 도구 구성** 클릭
3. 다음 정보 입력:
   - **도구 이름**: Sequence Puzzle
   - **도구 URL**: `http://your-domain.com/index.php`
   - **소비자 키**: `.env` 파일의 `LTI_KEY` 값
   - **공유 비밀**: `.env` 파일의 `LTI_SECRET` 값
   - **개인정보 보호**:
     - ✅ 런처 이름 공유
     - ✅ 런처 이메일 공유
4. **저장** 클릭

### 2. 코스에 외부 도구 추가

1. 원하는 코스로 이동
2. **활동 또는 리소스 추가 > 외부 도구** 선택
3. 위에서 생성한 "Sequence Puzzle" 도구 선택
4. 활동 이름 입력 후 저장

### 3. Moodle Web Services 설정 (성적 동기화용)

1. **사이트 관리 > 서버 > 웹 서비스 > 개요**
2. **웹 서비스 활성화** 체크
3. **REST 프로토콜 활성화**
4. **새 서비스 생성**:
   - 이름: Sequence Puzzle Grades
   - 함수 추가: `core_grades_update_grades`
5. **토큰 생성** 후 `.env`의 `MOODLE_TOKEN`에 입력

## 📱 사용 방법

### 교사용

1. Moodle 코스에서 "Sequence Puzzle" 활동 클릭
2. 좌측 패널에서 카테고리 및 난이도 선택
3. 학생 학습 진도를 모니터링

### 학생용

1. Moodle에서 활동 시작
2. 우측 가상 스마트폰 화면에서 수열 문제 확인
3. 올바른 퍼즐 조각을 순서대로 선택
4. "정답 확인" 버튼으로 제출
5. 즉각적인 피드백 및 점수 확인

## 🗂️ 프로젝트 구조

```
alt42standalone_v1.0/
├── config/                 # 설정 파일
│   ├── database.php       # 데이터베이스 연결
│   └── moodle_config.php  # Moodle/LTI 설정
├── public/                # 공개 웹 루트
│   ├── index.php         # 메인 엔트리 포인트
│   ├── api.php           # REST API 엔드포인트
│   ├── css/              # 스타일시트
│   ├── js/               # JavaScript
│   └── assets/           # 이미지, 폰트 등
├── src/                  # 소스 코드
│   ├── Database/         # 데이터베이스 레이어
│   ├── Moodle/          # Moodle 연동 (LTI, 성적)
│   ├── Puzzle/          # 퍼즐 게임 엔진
│   └── Utils/           # 유틸리티 함수
├── database/            # 데이터베이스 스키마
│   └── schema.sql      # MySQL 스키마 및 샘플 데이터
├── .env.example        # 환경 변수 예시
└── README.md          # 이 파일
```

## 🎮 API 엔드포인트

### 인증

모든 보호된 엔드포인트는 `session_token` 파라미터 필요

### 엔드포인트 목록

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/api.php?action=categories` | GET | 카테고리 목록 |
| `/api.php?action=puzzle` | GET | 퍼즐 문제 조회 |
| `/api.php?action=start_attempt` | POST | 문제 풀이 시작 |
| `/api.php?action=submit_answer` | POST | 답안 제출 |
| `/api.php?action=use_hint` | POST | 힌트 사용 |
| `/api.php?action=progress` | GET | 학습 진도 조회 |
| `/api.php?action=history` | GET | 풀이 기록 조회 |

## 🛠️ 개발

### 디버그 모드 활성화

`.env` 파일에서:
```
DEBUG_MODE=true
```

### 새로운 퍼즐 추가

```sql
INSERT INTO sequence_puzzles (
    category_id, title, description, difficulty, sequence_type,
    sequence_data, puzzle_pieces, correct_answer, hint, points, time_limit
) VALUES (
    1,
    '문제 제목',
    '문제 설명',
    'medium',
    'arithmetic',
    '{"sequence": [1, 3, 5, 7], "missing_position": 4, "answer": 9}',
    '{"pieces": [...]}',
    '[1, 2, 3]',
    '힌트 텍스트',
    10,
    180
);
```

## 🔒 보안

- SQL Injection 방지: PDO prepared statements 사용
- XSS 방지: `htmlspecialchars()` 사용
- CSRF 보호: 세션 토큰 검증
- 비밀번호: `.env` 파일에 민감 정보 저장 (Git에서 제외)

## 📊 데이터베이스 스키마

### 주요 테이블

- `puzzle_categories`: 문제 카테고리
- `sequence_puzzles`: 수열 퍼즐 문제
- `student_sessions`: 학생 세션 관리
- `student_attempts`: 학생 답안 및 점수
- `learning_progress`: 학습 진도 추적
- `grade_sync_log`: Moodle 성적 동기화 로그

## 🐛 문제 해결

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# .env 파일의 DB 설정 확인
cat .env
```

### 세션 오류
```bash
# PHP 세션 디렉토리 권한 확인
ls -la /var/lib/php/sessions

# 권한 수정
sudo chmod 1733 /var/lib/php/sessions
```

### Moodle 연동 실패
- Moodle Web Services가 활성화되어 있는지 확인
- LTI 키/비밀이 `.env`와 Moodle 설정이 일치하는지 확인
- 방화벽에서 포트가 열려있는지 확인

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해 주세요.

## 📧 연락처

기술 지원: [your-email@example.com]

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
