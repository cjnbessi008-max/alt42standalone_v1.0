# 넓이 채우기 애니메이션 앱 (Area Fill Animation App)

Moodle LMS와 연동하여 수학 문제를 가져오고, 우측 하단 가상 스마트폰 화면에 넓이가 천천히 채워지는 애니메이션을 표시하는 웹 애플리케이션입니다.

## 기술 스택

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Frontend**: HTML5 Canvas, JavaScript (Vanilla), CSS3

## 주요 기능

### 1. Moodle LMS 연동
- Moodle 3.7 데이터베이스에서 수학 문제 정보를 실시간으로 가져옴
- 넓이 관련 문제 필터링 (직사각형, 정사각형, 삼각형, 평행사변형)
- RESTful API 방식으로 문제 데이터 제공

### 2. Area Fill Animation
- **Canvas 기반** 부드러운 애니메이션 (60 FPS)
- **Easing 함수** 적용으로 자연스러운 움직임
- **실시간 진행률** 표시
- **4가지 도형** 지원:
  - 직사각형 (Rectangle)
  - 정사각형 (Square)
  - 삼각형 (Triangle)
  - 평행사변형 (Parallelogram)

### 3. 가상 스마트폰 UI
- 우측 하단에 고정된 스마트폰 프레임
- iPhone 스타일 노치 디자인
- 반응형 디자인 (모바일/데스크톱 대응)
- 슬라이드 인 애니메이션

### 4. 인터랙티브 컨트롤
- **시작**: 애니메이션 시작
- **일시정지**: 애니메이션 중지
- **초기화**: 처음부터 다시 시작
- **새 문제**: 랜덤으로 새로운 문제 불러오기

## 디렉토리 구조

```
area-fill-app/
├── index.php                   # 메인 페이지
├── config.php                  # Moodle DB 설정
├── README.md                   # 사용 설명서
├── api/
│   └── get_problem.php         # 문제 데이터 API
├── css/
│   └── styles.css              # 스타일시트
└── js/
    └── area-fill-animation.js  # 애니메이션 엔진
```

## 설치 방법

### 1. 파일 업로드

Moodle이 설치된 웹 서버에 `area-fill-app` 폴더를 업로드합니다.

```bash
# 예: Apache 웹 루트 디렉토리
/var/www/html/area-fill-app/
```

### 2. 데이터베이스 설정

`config.php` 파일을 열어 Moodle 데이터베이스 정보를 입력합니다:

```php
// Moodle Database Configuration
define('DB_HOST', 'localhost');           // 데이터베이스 호스트
define('DB_NAME', 'moodle');              // Moodle 데이터베이스 이름
define('DB_USER', 'moodleuser');          // 데이터베이스 사용자명
define('DB_PASS', 'your_password');       // 데이터베이스 비밀번호
define('DB_PREFIX', 'mdl_');              // Moodle 테이블 접두사
```

### 3. 파일 권한 설정

웹 서버가 파일을 읽을 수 있도록 권한을 설정합니다:

```bash
chmod -R 755 /var/www/html/area-fill-app/
chown -R www-data:www-data /var/www/html/area-fill-app/
```

### 4. 접속

브라우저에서 다음 URL로 접속합니다:

```
http://your-domain.com/area-fill-app/
```

## 사용 방법

### 기본 사용

1. **페이지 로드**: 자동으로 샘플 문제가 로드됩니다
2. **시작 버튼 클릭**: 넓이가 천천히 채워지는 애니메이션이 시작됩니다
3. **애니메이션 완료**: 정답이 자동으로 표시됩니다
4. **새 문제 버튼**: 다른 문제로 변경합니다

### API 사용

#### 샘플 문제 가져오기 (기본값)
```
GET api/get_problem.php?mode=sample
```

#### Moodle에서 특정 문제 가져오기
```
GET api/get_problem.php?mode=moodle&id=123
```

#### Moodle에서 랜덤 넓이 문제 가져오기
```
GET api/get_problem.php?mode=random
```

#### 응답 예시
```json
{
  "success": true,
  "message": "Sample problem loaded",
  "data": {
    "id": "sample_1",
    "name": "직사각형의 넓이",
    "questiontext": "가로 8cm, 세로 5cm인 직사각형의 넓이를 구하세요.",
    "shape": "rectangle",
    "width": 8,
    "height": 5,
    "answer": 40,
    "unit": "cm²"
  },
  "timestamp": 1638000000
}
```

## 커스터마이징

### 애니메이션 속도 조절

`config.php` 파일에서 애니메이션 설정을 변경할 수 있습니다:

```php
// 애니메이션 지속 시간 (밀리초)
define('ANIMATION_DURATION', 3000);  // 3초 (기본값)

// 프레임레이트
define('ANIMATION_FPS', 60);         // 60 FPS (기본값)
```

### 색상 변경

`js/area-fill-animation.js`에서 색상을 변경할 수 있습니다:

```javascript
this.animation = new AreaFillAnimation('animationCanvas', {
    duration: 3000,
    fillColor: '#667eea',      // 채우기 색상
    strokeColor: '#333',        // 테두리 색상
    backgroundColor: '#fafafa'  // 배경 색상
});
```

### 스마트폰 위치 조절

`css/styles.css`에서 위치를 변경할 수 있습니다:

```css
.smartphone-frame {
    bottom: 20px;   /* 하단 여백 */
    right: 20px;    /* 우측 여백 */
}
```

## 지원 브라우저

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 문제 해결

### 문제가 로드되지 않는 경우

1. `config.php`의 데이터베이스 설정 확인
2. PHP 에러 로그 확인: `/var/log/apache2/error.log`
3. 브라우저 콘솔에서 에러 메시지 확인 (F12)

### 애니메이션이 작동하지 않는 경우

1. 브라우저가 Canvas를 지원하는지 확인
2. JavaScript가 활성화되어 있는지 확인
3. 브라우저 콘솔에서 JavaScript 에러 확인

### Moodle 연동이 안 되는 경우

1. Moodle 데이터베이스에 접근 권한이 있는지 확인
2. `mdl_question` 테이블이 존재하는지 확인
3. `mode=sample`로 먼저 테스트해보기

## 보안 권장사항

### 운영 환경 배포 시

1. **디버그 모드 비활성화**
   ```php
   // config.php
   define('APP_DEBUG', false);
   ```

2. **데이터베이스 사용자 권한 최소화**
   - 읽기 전용(SELECT) 권한만 부여
   ```sql
   GRANT SELECT ON moodle.mdl_question TO 'readonly_user'@'localhost';
   GRANT SELECT ON moodle.mdl_question_categories TO 'readonly_user'@'localhost';
   ```

3. **HTTPS 사용**
   - SSL 인증서 설정
   - HTTP → HTTPS 리다이렉트 설정

4. **파일 권한 최소화**
   ```bash
   chmod 644 *.php
   chmod 755 api/
   ```

## 개발 정보

- **버전**: 1.0.0
- **개발 목적**: KAIST Touch Math Academy 교육용
- **라이선스**: MIT
- **문의**: support@kaist.ac.kr

## 향후 개발 계획

- [ ] 원(Circle) 도형 지원
- [ ] 사다리꼴(Trapezoid) 도형 지원
- [ ] 음성 안내 기능
- [ ] 학습 진도 저장 기능
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 터치 제스처 지원
- [ ] 오답 노트 기능

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

---

**KAIST Touch Math Academy** | 2025
