# 🎵 Rhythm Seq - 리듬 수열 학습 앱

Moodle LMS와 연동되는 수열 학습 웹 애플리케이션입니다. 수열을 리듬감 있게 시각화하여 학생들이 패턴을 이해하기 쉽게 도와줍니다.

## 📱 주요 기능

- **Moodle LMS 연동**: Moodle 3.7 데이터베이스에서 문제 정보를 실시간으로 가져옵니다
- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 표시되는 앱 화면
- **리듬 애니메이션**: 수열의 각 숫자가 크기와 위치를 바꾸며 리듬감 있게 움직입니다
- **인터랙티브 컨트롤**: 애니메이션 속도 조절, 일시정지, 재시작 기능
- **반응형 디자인**: 데스크톱, 태블릿, 모바일에서 모두 사용 가능

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, Animations

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7
- Apache 또는 Nginx 웹 서버
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)

## 🚀 설치 방법

### 1. 파일 배포

```bash
# 웹 서버 루트 디렉토리로 복사
cp -r rhythm-seq-app /var/www/html/

# 또는 Apache htdocs
cp -r rhythm-seq-app /Applications/XAMPP/htdocs/
```

### 2. 데이터베이스 설정

`config.php` 파일을 편집하여 Moodle 데이터베이스 연결 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');        // Moodle DB 호스트
define('DB_NAME', 'moodle');           // Moodle DB 이름
define('DB_USER', 'your_username');    // DB 사용자명
define('DB_PASS', 'your_password');    // DB 비밀번호
define('DB_PREFIX', 'mdl_');           // Moodle 테이블 접두사
```

### 3. 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chmod -R 755 rhythm-seq-app
chown -R www-data:www-data rhythm-seq-app  # Ubuntu/Debian
# 또는
chown -R apache:apache rhythm-seq-app      # CentOS/RHEL
```

### 4. 웹 서버 설정

#### Apache

`.htaccess` 파일이 이미 포함되어 있습니다. `mod_rewrite`가 활성화되어 있는지 확인하세요:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

Nginx를 사용하는 경우, 다음 설정을 추가하세요:

```nginx
location /rhythm-seq-app {
    index index.php;
    try_files $uri $uri/ /index.php?$query_string;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 접속

브라우저에서 다음 주소로 접속합니다:

```
http://your-server/rhythm-seq-app/
```

## 📖 사용 방법

### 1. 문제 불러오기

1. 좌측 패널의 "문제 선택" 드롭다운에서 원하는 문제를 선택합니다
2. 또는 "📚 문제 불러오기" 버튼을 클릭하여 선택된 문제를 로드합니다

### 2. 애니메이션 시작

1. 문제가 로드되면 우측 스마트폰 화면에 수열이 표시됩니다
2. "▶️ 애니메이션 시작" 버튼을 클릭합니다
3. 수열의 각 숫자가 리듬감 있게 움직이며 시각화됩니다

### 3. 컨트롤

- **애니메이션 속도**: 슬라이더로 1~10 사이의 속도 조절 (10이 가장 빠름)
- **⏸️ 일시정지**: 현재 애니메이션을 일시정지
- **🔄 초기화**: 애니메이션을 처음부터 다시 시작

## 📂 프로젝트 구조

```
rhythm-seq-app/
├── index.php              # 메인 페이지
├── config.php             # 데이터베이스 설정
├── api/
│   └── get_questions.php  # Moodle 문제 조회 API
├── css/
│   └── style.css          # 스타일시트
├── js/
│   └── rhythm-seq.js      # 애니메이션 로직
├── docs/
│   └── MOODLE_INTEGRATION.md  # Moodle 연동 가이드
└── README.md              # 이 파일
```

## 🔧 Moodle 통합

### 문제 형식

Rhythm Seq는 다음 형식의 Moodle 문제를 인식합니다:

1. **대괄호 형식**: `[1, 2, 3, 4, 5]`
2. **텍스트 형식**: `수열: 2, 4, 6, 8, 10`
3. **영문 형식**: `sequence: 1, 3, 5, 7, 9`

### Moodle 문제 생성 예시

```
질문 제목: 홀수 수열 패턴
질문 내용: 다음 수열의 규칙을 찾아보세요: [1, 3, 5, 7, 9, 11, 13, 15]
```

### 지원되는 문제 유형

- Short Answer (단답형)
- Numerical (수치형)
- Essay (서술형)

## 🎨 커스터마이징

### 애니메이션 스타일 변경

`css/style.css`에서 다음 애니메이션을 수정할 수 있습니다:

```css
@keyframes pulse { /* 크기 변화 */ }
@keyframes bounce { /* 튕기기 */ }
@keyframes glow { /* 빛나기 */ }
```

### 색상 테마 변경

`css/style.css`의 CSS 변수를 수정하여 색상을 변경할 수 있습니다:

```css
/* 주 색상 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 버튼 색상 */
.btn-primary { background: #4CAF50; }
.btn-success { background: #2196F3; }
```

## 🐛 문제 해결

### 문제 목록이 로드되지 않음

1. `config.php`의 데이터베이스 연결 정보를 확인하세요
2. PHP 에러 로그를 확인하세요: `/var/log/apache2/error.log`
3. 브라우저 콘솔에서 네트워크 요청을 확인하세요

### 애니메이션이 작동하지 않음

1. 브라우저 콘솔에서 JavaScript 에러를 확인하세요
2. 문제가 올바르게 로드되었는지 확인하세요
3. 브라우저 캐시를 삭제하고 페이지를 새로고침하세요

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 접속 테스트
mysql -u your_username -p moodle
```

## 🔐 보안 고려사항

1. **프로덕션 환경**: `config.php`에서 `DEBUG_MODE`를 `false`로 설정하세요
2. **SQL Injection 방지**: PDO prepared statements를 사용합니다
3. **접근 제한**: Moodle 사용자 인증과 통합하는 것을 권장합니다

## 📊 데이터베이스 쿼리 설명

### 문제 조회 쿼리

```sql
SELECT
    q.id,
    q.name,
    q.questiontext,
    qc.name AS category
FROM mdl_question q
LEFT JOIN mdl_question_categories qc ON q.category = qc.id
WHERE q.qtype IN ('shortanswer', 'numerical', 'essay')
ORDER BY q.id DESC
```

## 🚧 향후 계획

- [ ] 음향 효과 추가 (각 숫자마다 다른 음계)
- [ ] 사용자 학습 진도 저장
- [ ] 다양한 애니메이션 패턴 추가
- [ ] Moodle 플러그인으로 전환
- [ ] 학생 답안 제출 기능
- [ ] 선생님 대시보드 추가

## 📝 라이센스

This project is part of KAIST Touch Math Academy AI Education System.

## 👥 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 다음으로 연락주세요:
- 기술 지원: [개발팀 이메일]
- 교육 관련: [교육팀 이메일]

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Compatible with**: Moodle 3.7, PHP 7.1.9, MySQL 5.7
