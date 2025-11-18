# Slope Heat Map - Moodle Learning Analytics

Moodle LMS와 연동하여 학습 난이도 기울기를 시각화하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 🎨 Slope Heat Map 시각화
- **색상 그라데이션**: 기울기가 완만할 때는 파란색, 가파를 때는 빨간색으로 표시
- **대화형 차트**: 각 문제를 클릭하여 상세 정보 확인
- **실시간 업데이트**: Moodle 데이터베이스에서 최신 정보 실시간 반영

### 📱 가상 스마트폰 UI
- 우측 하단에 스마트폰 프레임으로 모바일 앱 프리뷰 제공
- 문제 목록을 스크롤하며 기울기 정보 확인
- 터치 친화적인 인터페이스

### 📊 학습 분석
- **기울기 계산**: 학습 곡선의 가파른 정도를 수치화
- **성공률 분석**: 학생들의 문제 해결 성공률 추적
- **난이도 진행**: 문제 순서에 따른 난이도 변화 시각화

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7
- **웹서버**: Apache 2.4+ (mod_rewrite 활성화) 또는 Nginx
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 방법

### 1. 파일 업로드
웹 서버의 DocumentRoot 또는 원하는 디렉토리에 모든 파일을 업로드합니다.

```bash
/var/www/html/slope-heatmap/
├── api/
│   └── get_questions.php
├── css/
│   └── styles.css
├── js/
│   ├── slope-engine.js
│   └── heatmap-renderer.js
├── config.php
└── index.php
```

### 2. 데이터베이스 설정

`config.php` 파일을 열어 Moodle 데이터베이스 연결 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');           // Moodle DB 호스트
define('DB_NAME', 'moodle');              // Moodle DB 이름
define('DB_USER', 'moodle_user');         // DB 사용자명
define('DB_PASS', 'your_password_here');  // DB 비밀번호
define('DB_PREFIX', 'mdl_');              // Moodle 테이블 접두사 (기본: mdl_)
```

### 3. 권한 설정

Apache 사용자가 파일을 읽을 수 있도록 권한을 설정합니다:

```bash
chmod 755 /var/www/html/slope-heatmap
chmod 644 /var/www/html/slope-heatmap/*.php
chmod 644 /var/www/html/slope-heatmap/api/*.php
```

### 4. 웹서버 설정

#### Apache (.htaccess 자동 생성됨)
mod_rewrite가 활성화되어 있는지 확인:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx
nginx.conf에 다음 설정 추가:
```nginx
location /slope-heatmap/ {
    try_files $uri $uri/ /index.php?$query_string;
}
```

### 5. 접속

브라우저에서 다음 URL로 접속합니다:
```
http://your-domain.com/slope-heatmap/
```

## 사용 방법

### 메인 화면 구성

1. **좌측 패널 (데스크톱 뷰)**
   - Heat Map 차트: 각 문제의 기울기를 색상으로 시각화
   - 통계 정보: 총 문제 수, 평균 기울기, 평균 성공률 등
   - 컨트롤: 코스 선택, 기울기 범위 설정

2. **우측 패널 (모바일 뷰)**
   - 가상 스마트폰 화면
   - 문제 목록을 스크롤하며 확인
   - 각 문제의 기울기와 통계 정보 표시

### 색상 의미

| 색상 | 기울기 범위 | 의미 |
|------|------------|------|
| 🔵 파란색 | 0-4 | 매우 완만 (쉬운 진행) |
| 🟢 초록색 | 4-8 | 완만 (적절한 진행) |
| 🟡 노란색 | 8-12 | 보통 (주의 필요) |
| 🟠 주황색 | 12-16 | 가파름 (도전적) |
| 🔴 빨간색 | 16-20 | 매우 가파름 (매우 어려움) |

### 기울기 계산 방식

기울기는 다음 요소들을 종합하여 계산됩니다:

1. **문제 순서**: 학습 진행에 따른 위치
2. **성공률**: 학생들의 문제 해결 성공률 (낮을수록 어려움)
3. **배점**: 문제의 가중치

```
기울기 = 기본기울기 × (1 + 난이도계수 × 가중치계수)
```

## API 엔드포인트

### GET `/api/get_questions.php`

Moodle에서 문제 정보를 가져옵니다.

**매개변수:**
- `course_id` (선택): 특정 코스의 문제만 가져오기

**응답 예시:**
```json
{
  "success": true,
  "count": 50,
  "questions": [
    {
      "id": 1,
      "name": "문제 제목",
      "category": "수학",
      "position": 1,
      "slope": 5.23,
      "successRate": 75.5,
      "attemptCount": 120,
      "defaultMark": 1.0
    }
  ],
  "timestamp": 1234567890
}
```

## 커스터마이징

### 색상 변경

`js/slope-engine.js`의 `colorStops` 배열을 수정하여 색상을 변경할 수 있습니다:

```javascript
this.colorStops = [
    { value: 0.0, color: { r: 33, g: 102, b: 172 } },   // 파란색
    { value: 0.25, color: { r: 67, g: 160, b: 71 } },   // 초록색
    { value: 0.5, color: { r: 255, g: 235, b: 59 } },   // 노란색
    { value: 0.75, color: { r: 255, g: 152, b: 0 } },   // 주황색
    { value: 1.0, color: { r: 244, g: 67, b: 54 } }     // 빨간색
];
```

### 기울기 계산 로직 변경

`api/get_questions.php`의 기울기 계산 부분을 수정하여 자신만의 알고리즘을 적용할 수 있습니다.

## 문제 해결

### 데이터가 표시되지 않는 경우

1. `config.php`의 데이터베이스 연결 정보 확인
2. Moodle 데이터베이스에 접근 권한이 있는지 확인
3. 브라우저 개발자 도구(F12)에서 네트워크 탭 확인
4. `config.php`에서 `DEBUG_MODE`를 `true`로 설정하여 오류 메시지 확인

### PHP 오류

- PHP 버전이 7.1.9 이상인지 확인
- PDO MySQL 확장이 활성화되어 있는지 확인:
  ```bash
  php -m | grep pdo_mysql
  ```

### 권한 오류

- 웹 서버 사용자(www-data, apache 등)가 파일을 읽을 수 있는지 확인
- SELinux가 활성화된 경우 적절한 컨텍스트 설정

## 라이선스

MIT License

## 기술 스택

- **Backend**: PHP 7.1+, MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: HTML5 Canvas
- **LMS**: Moodle 3.7

## 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 작성자

Claude AI Assistant

## 버전

1.0.0 - 초기 릴리스 (2025-11-18)
