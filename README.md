# Roll Along - 함수 시각화 학습 앱

x값 변화에 따른 y값의 움직임을 공처럼 굴러가며 보여주는 수학 학습 웹 애플리케이션입니다.

## 특징

- 📱 **가상 스마트폰 인터페이스**: 우측 하단에 실제 스마트폰처럼 보이는 화면
- 🎯 **물리 시뮬레이션**: 공이 실제로 굴러가는 듯한 애니메이션
- 📊 **다양한 함수 지원**: 일차, 이차, 삼차, 사인, 코사인 함수 및 사용자 정의 함수
- 🔗 **Moodle LMS 연동**: Moodle 3.7과 완벽하게 통합
- 📈 **학습 추적**: 학생 진도 및 답안 자동 저장
- 🎨 **반응형 디자인**: 데스크톱, 태블릿, 모바일 지원

## 기술 스택

### 프론트엔드
- HTML5 Canvas
- CSS3 (Flexbox, Animations)
- JavaScript (ES6+)
- Physics Engine (Custom)

### 백엔드
- PHP 7.1.9+
- MySQL 5.7+
- Moodle 3.7+

## 설치 방법

### 1. 파일 복사

```bash
# Roll Along 앱을 웹 서버 디렉토리에 복사
cp -r public /var/www/html/roll-along
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 선택 (Moodle 데이터베이스)
USE moodle;

# 테이블 생성
source moodle-integration/setup-database.sql
```

### 3. 설정 파일 수정

```bash
# 데이터베이스 설정 파일 수정
nano public/config/db-config.php
```

다음 값들을 변경하세요:
- `DB_HOST`: 데이터베이스 호스트 (예: localhost)
- `DB_NAME`: Moodle 데이터베이스 이름
- `DB_USER`: 데이터베이스 사용자명
- `DB_PASS`: 데이터베이스 비밀번호

### 4. 권한 설정

```bash
# 웹 서버가 파일을 읽을 수 있도록 권한 설정
chmod -R 755 /var/www/html/roll-along
chown -R www-data:www-data /var/www/html/roll-along
```

### 5. 웹 서버 설정 (Apache 예시)

```apache
<VirtualHost *:80>
    ServerName rollal.yourdomain.com
    DocumentRoot /var/www/html/roll-along

    <Directory /var/www/html/roll-along>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/roll-along-error.log
    CustomLog ${APACHE_LOG_DIR}/roll-along-access.log combined
</VirtualHost>
```

### 6. PHP 설정 확인

`php.ini` 파일에서 다음 설정 확인:

```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 256M
max_execution_time = 300
```

## 사용 방법

### 독립 실행 모드

브라우저에서 직접 접속:
```
http://yourdomain.com/roll-along/
```

### Moodle 연동 모드

Moodle에서 URL 파라미터와 함께 실행:
```
http://yourdomain.com/roll-along/?problemId=123&userId=456&courseId=789
```

파라미터:
- `problemId`: 문제 ID
- `userId`: 사용자 ID
- `courseId`: 코스 ID
- `sessionId`: 세션 ID (선택사항)

## API 엔드포인트

### 문제 정보 가져오기
```
GET /api/moodle-bridge.php?action=getProblem&problemId={id}
```

### 진도 저장
```
POST /api/moodle-bridge.php?action=submitProgress
Content-Type: application/json

{
  "userId": 123,
  "courseId": 456,
  "problemId": 789,
  "progress": {
    "eventName": "function_changed",
    "eventData": { "function": "quadratic" }
  }
}
```

### 답안 제출
```
POST /api/moodle-bridge.php?action=submitAnswer
Content-Type: application/json

{
  "userId": 123,
  "courseId": 456,
  "problemId": 789,
  "answer": {
    "x": 5,
    "y": 25,
    "function": "quadratic"
  }
}
```

## 기능 설명

### 1. 함수 선택
- 일차함수 (y = x)
- 이차함수 (y = x²)
- 삼차함수 (y = x³)
- 사인함수 (y = sin(x))
- 코사인함수 (y = cos(x))
- 사용자 정의 함수

### 2. 인터랙티브 컨트롤
- **X 값 슬라이더**: 공의 x 좌표 조정
- **애니메이션 속도**: 공의 이동 속도 조절
- **재생/일시정지**: 자동 애니메이션 제어
- **리셋**: 초기 상태로 돌아가기

### 3. 시각화
- 실시간 좌표 표시
- 함수 그래프 렌더링
- 공의 궤적 (trail) 표시
- 회전 애니메이션

## 문제 추가 방법

SQL을 통해 직접 추가:

```sql
INSERT INTO roll_along_problems (title, instructions, function_type, x_min, x_max, y_min, y_max, difficulty_level)
VALUES (
    '새로운 함수 문제',
    '문제 설명을 여기에 작성하세요',
    'quadratic',
    -10, 10, -10, 10, 2
);
```

또는 PHP API를 통해 프로그래밍 방식으로 추가 가능.

## 성능 최적화

### 캐싱
- Canvas 렌더링 최적화
- 함수 계산 결과 캐싱
- API 응답 캐싱 (Redis 권장)

### 데이터베이스
- 인덱스 최적화 (이미 적용됨)
- 쿼리 최적화
- 연결 풀링 사용

## 보안

### 프로덕션 환경 체크리스트
- [ ] `db-config.php`에서 `APP_DEBUG = false` 설정
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] `API_KEY` 변경
- [ ] HTTPS 사용
- [ ] CORS 정책 적절히 설정
- [ ] SQL 인젝션 방지 (prepared statements 사용)
- [ ] XSS 방지 (입력 검증)

## 문제 해결

### 데이터베이스 연결 오류
```
Error: Database connection failed
```
- `db-config.php`의 DB 설정 확인
- MySQL 서비스 실행 상태 확인
- 방화벽 설정 확인

### Canvas가 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas 크기가 0인지 확인
- CSS 로드 확인

### Moodle 연동 안됨
- URL 파라미터 확인
- API 엔드포인트 접근 가능 확인
- CORS 헤더 설정 확인

## 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 (제한적 지원)

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 문의

- 이메일: support@example.com
- 문서: https://docs.example.com/roll-along

## 변경 이력

### v1.0.0 (2025-01-18)
- 초기 릴리스
- 기본 물리 엔진 구현
- Moodle LMS 연동
- 6가지 함수 타입 지원
- 반응형 디자인

---

**KAIST Touch Math Academy**
AI Education System Pipeline
