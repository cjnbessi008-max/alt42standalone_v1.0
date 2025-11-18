# Scaling Stream - 닮음 스케일링 시각화 앱

**Scaling Stream**은 Moodle LMS와 연동하여 문제 정보를 받아 동작하며, 우측 하단의 가상 스마트폰 화면에 닮음 스케일링을 시각적으로 체감할 수 있는 교육용 웹 애플리케이션입니다.

## 주요 기능

- ✅ **Moodle LMS 연동**: Moodle 3.7 데이터베이스에서 문제 정보를 직접 가져옵니다
- 📱 **가상 스마트폰 UI**: 실제 스마트폰을 모방한 인터페이스를 화면 우측 하단에 표시
- 🎨 **닮음 스케일링 시각화**: 도형의 크기 변화를 실시간으로 애니메이션으로 표현
- 📊 **문제 유사도 분석**: 연속된 문제 간의 유사도를 자동으로 계산
- 🎯 **인터랙티브 학습**: 문제 풀이와 즉각적인 피드백 제공
- 🔄 **실시간 스트리밍**: 스케일링 애니메이션을 자동으로 재생

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **PDO**: 데이터베이스 연결

### 프론트엔드
- **HTML5**: 구조
- **CSS3**: 스타일링 및 애니메이션
- **JavaScript (ES6+)**: 동적 기능 및 API 통신

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Moodle 3.7 (설치 및 구성 완료)
- 웹 서버 (Apache 또는 Nginx)
- 최신 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 파일 배포

Scaling Stream 폴더를 웹 서버의 루트 디렉토리에 복사합니다:

```bash
# Apache 예시
cp -r scaling-stream /var/www/html/

# Nginx 예시
cp -r scaling-stream /usr/share/nginx/html/
```

### 2. 데이터베이스 설정

`config/database.php` 파일을 편집하여 Moodle 데이터베이스 연결 정보를 입력합니다:

```php
private $host = 'localhost';           // MySQL 호스트
private $db_name = 'moodle';          // Moodle 데이터베이스 이름
private $username = 'moodle_user';     // 데이터베이스 사용자
private $password = 'your_password';   // 데이터베이스 비밀번호
```

### 3. 설정 파일 구성

`config/config.php` 파일에서 Moodle URL과 기타 설정을 수정합니다:

```php
define('MOODLE_URL', 'http://your-moodle-url');
define('MOODLE_TOKEN', 'your_webservice_token');  // 선택사항
```

### 4. 권한 설정

웹 서버가 파일을 읽을 수 있도록 권한을 설정합니다:

```bash
chmod -R 755 scaling-stream
chown -R www-data:www-data scaling-stream  # Ubuntu/Debian
# 또는
chown -R apache:apache scaling-stream      # CentOS/RHEL
```

### 5. 접속

브라우저에서 다음 URL로 접속합니다:

```
http://your-server/scaling-stream/
```

## 사용 방법

### 기본 조작

1. **문제 불러오기**: 상단의 "문제 불러오기" 버튼을 클릭하여 Moodle에서 랜덤 문제를 가져옵니다
2. **스트리밍 시작**: "스트리밍 시작" 버튼으로 닮음 스케일링 애니메이션을 시작합니다
3. **일시정지**: "일시정지" 버튼으로 애니메이션을 멈추거나 재개합니다
4. **초기화**: "초기화" 버튼으로 모든 상태를 초기 상태로 되돌립니다

### 키보드 단축키

- `L`: 문제 불러오기
- `S`: 스트리밍 시작
- `P`: 일시정지/재개
- `R`: 초기화

### 스마트폰 UI 조작

- **드래그**: 우측의 "⋮⋮" 핸들을 드래그하여 스마트폰 위치를 이동할 수 있습니다
- **문제 풀이**: 스마트폰 화면에서 답변을 선택하면 즉각적인 피드백을 받습니다

## 프로젝트 구조

```
scaling-stream/
├── index.html                  # 메인 HTML 파일
├── config/
│   ├── config.php             # 전역 설정
│   └── database.php           # 데이터베이스 연결
├── api/
│   ├── moodle_connector.php   # Moodle 연동 클래스
│   └── endpoints.php          # REST API 엔드포인트
├── assets/
│   ├── css/
│   │   ├── smartphone.css     # 스마트폰 UI 스타일
│   │   └── scaling-stream.css # 스케일링 시각화 스타일
│   └── js/
│       ├── api-client.js      # API 클라이언트
│       ├── scaling-stream.js  # 스케일링 엔진
│       ├── smartphone-ui.js   # 스마트폰 UI 컨트롤러
│       └── main.js            # 메인 애플리케이션
├── docs/
│   └── SETUP.md              # 상세 설정 가이드
└── README.md                 # 이 파일
```

## API 엔드포인트

Scaling Stream은 다음 REST API 엔드포인트를 제공합니다:

### 문제 조회

```
GET api/endpoints.php?action=get_questions&limit=20
```

### 문제 상세 정보

```
GET api/endpoints.php?action=get_question_details&id=123
```

### 랜덤 문제

```
GET api/endpoints.php?action=get_random_question
```

### 코스 목록

```
GET api/endpoints.php?action=get_courses&limit=20
```

### 유사도 계산

```
GET api/endpoints.php?action=calculate_similarity&question1=1&question2=2
```

### 헬스 체크

```
GET api/endpoints.php?action=health_check
```

## Moodle 데이터베이스 스키마

Scaling Stream은 다음 Moodle 테이블을 사용합니다:

- `mdl_question`: 문제 정보
- `mdl_question_categories`: 문제 카테고리
- `mdl_question_answers`: 문제 답변
- `mdl_quiz`: 퀴즈 정보
- `mdl_quiz_attempts`: 퀴즈 시도 기록
- `mdl_course`: 코스 정보
- `mdl_user`: 사용자 정보

## 문제 해결

### 데이터베이스 연결 실패

```
Connection Error: SQLSTATE[HY000] [2002] Connection refused
```

**해결 방법**:
1. MySQL 서비스가 실행 중인지 확인
2. `config/database.php`의 연결 정보 확인
3. 데이터베이스 사용자 권한 확인

### 문제를 불러올 수 없음

**해결 방법**:
1. Moodle 데이터베이스에 문제가 존재하는지 확인
2. 브라우저 콘솔에서 오류 메시지 확인
3. PHP 오류 로그 확인 (`error_log`)

### 스마트폰 UI가 표시되지 않음

**해결 방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일이 올바르게 로드되었는지 확인
3. 브라우저 캐시 삭제 후 새로고침

## 보안 고려사항

### 프로덕션 환경

프로덕션 환경에서는 다음 설정을 변경하세요:

```php
// config/config.php
error_reporting(0);
ini_set('display_errors', 0);
```

### 데이터베이스 권한

읽기 전용 권한으로 데이터베이스 사용자를 생성하는 것을 권장합니다:

```sql
CREATE USER 'scaling_stream_ro'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON moodle.* TO 'scaling_stream_ro'@'localhost';
FLUSH PRIVILEGES;
```

### CORS 설정

필요한 경우 `config/config.php`에서 CORS 헤더를 조정하세요.

## 개발 로드맵

- [x] Moodle LMS 연동
- [x] 가상 스마트폰 UI
- [x] 닮음 스케일링 시각화
- [x] 문제 유사도 계산
- [ ] 다양한 도형 타입 추가
- [ ] 학습 진도 추적
- [ ] 관리자 대시보드
- [ ] 다국어 지원 확장
- [ ] WebSocket 실시간 업데이트

## 기여

이 프로젝트에 기여하고 싶으시다면:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원

문제가 발생하거나 질문이 있으시면:

- 이슈 트래커에 문제를 등록해주세요
- 문서를 참조하세요: `docs/SETUP.md`

## 크레딧

- **Moodle**: 오픈소스 LMS 플랫폼
- **PHP**: 서버 사이드 스크립팅
- **JavaScript**: 클라이언트 사이드 인터랙션

---

**Scaling Stream** - 닮음을 시각적으로 체감하는 교육용 앱 🎓📱
