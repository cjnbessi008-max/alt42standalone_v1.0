# Function Mood - 빠른 시작 가이드

## 5분 안에 시작하기

### 1. 데이터베이스 설정 (1분)

```bash
# MySQL에 접속하여 데이터베이스 생성
mysql -u root -p << EOF
CREATE DATABASE function_mood CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fm_user'@'localhost' IDENTIFIED BY 'fm_password';
GRANT ALL PRIVILEGES ON function_mood.* TO 'fm_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 스키마 적용
mysql -u fm_user -p function_mood < database/schema.sql
```

### 2. 설정 파일 수정 (1분)

`config/config.php`를 열고 다음만 수정:

```php
define('DB_USER', 'fm_user');
define('DB_PASS', 'fm_password');
```

### 3. 웹 서버 시작 (1분)

#### 방법 A: PHP 내장 서버 (개발용)

```bash
cd function-mood
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

#### 방법 B: Apache/Nginx

```bash
# 프로젝트를 웹 루트로 복사
sudo cp -r function-mood /var/www/html/
sudo chown -R www-data:www-data /var/www/html/function-mood

# Apache 재시작
sudo systemctl restart apache2
```

브라우저에서 `http://localhost/function-mood` 접속

### 4. 첫 번째 함수 분석 (1분)

1. 메인 페이지에 접속
2. 입력란에 함수 입력 (예: `x^2`)
3. "분석하기" 버튼 클릭
4. 우측 하단 스마트폰 화면에서 결과 확인!

### 5. Moodle 연동 (선택사항, 5분)

#### Moodle Web Service 토큰 생성

1. Moodle 관리자 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. 가이드에 따라 웹 서비스 활성화 및 토큰 생성
4. 생성된 토큰을 `config/config.php`에 설정:

```php
define('MOODLE_URL', 'http://your-moodle.com');
define('MOODLE_TOKEN', 'your_generated_token');
```

#### 연결 테스트

```bash
curl http://localhost:8000/api/index.php?path=test-connection
```

## 예제 함수들

웹 페이지에서 바로 테스트해보세요:

- **x^2** - 평온한 이차 함수 (파란색)
- **x^3** - 역동적인 삼차 함수 (주황색)
- **sin(x)** - 활발한 사인 함수 (금색)
- **exp(x)** - 폭발적인 지수 함수 (빨간색)
- **1/x** - 급변하는 쌍곡선 (진한 빨간색)
- **abs(x)** - 안정적인 절댓값 (연두색)

## API 테스트

### cURL로 함수 분석

```bash
curl -X POST http://localhost:8000/api/index.php?path=analyze \
  -H "Content-Type: application/json" \
  -d '{
    "function": "x**2",
    "domain_min": -10,
    "domain_max": 10
  }'
```

### JavaScript로 함수 분석

```javascript
fetch('http://localhost:8000/api/index.php?path=analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    function: 'sin(x)',
    domain_min: -10,
    domain_max: 10
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

## 문제 해결

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# config/config.php에서 DB 설정 다시 확인
```

### 빈 화면이 표시됨
```bash
# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

### 스마트폰 UI가 표시되지 않음
- 브라우저 콘솔(F12)에서 JavaScript 오류 확인
- `assets/js/function-mood.js` 파일 경로 확인

## 다음 단계

✅ 설치 완료! 이제 다음을 확인하세요:

- **README.md** - 전체 기능 및 사용법
- **INSTALL.md** - 프로덕션 배포 가이드
- **database/schema.sql** - 데이터베이스 구조
- **moodle-integration/** - Moodle 블록 플러그인

## 데모 시나리오

### 시나리오 1: 학생 학습 도구로 사용

1. 학생이 웹 페이지 접속
2. 수학 문제의 함수 입력
3. 함수의 "감정" 확인 (완만함 vs 급변)
4. 시각적 피드백으로 함수 특성 이해

### 시나리오 2: 교사 Moodle 통합

1. Moodle에 퀴즈 문제 등록
2. Function Mood에서 코스 동기화
3. 자동으로 함수 문제 분석
4. 학생들에게 시각화된 결과 제공

### 시나리오 3: API 통합

```python
# Python 예제
import requests

response = requests.post('http://localhost:8000/api/index.php?path=analyze',
    json={
        'function': 'x**3 - 2*x',
        'domain_min': -5,
        'domain_max': 5
    })

result = response.json()
print(f"Mood: {result['analysis']['emotion']}")
print(f"Color: {result['analysis']['color']}")
print(f"Smoothness: {result['analysis']['smoothness']}")
```

## 지원

문제가 발생하면 다음을 확인하세요:

1. **README.md** - FAQ 및 상세 문서
2. **INSTALL.md** - 설치 문제 해결
3. PHP/MySQL 버전 요구사항 확인
4. 로그 파일 확인

---

**축하합니다! Function Mood를 시작할 준비가 되었습니다! 🎉**

함수의 감정을 탐험해보세요! 📊✨
