# 도형 보조선 자동 생성기 (Shape Guide Lines Generator)

평행선과 수선이 자동으로 생성되는 기하학 학습 웹앱

## 📱 주요 기능

- **자동 보조선 생성**: 도형의 각 변에 대해 평행선과 수선을 자동으로 생성
- **스마트폰 뷰**: 우측 하단에 고정된 가상 스마트폰 화면으로 실시간 미리보기
- **다양한 도형 지원**: 삼각형, 사각형, 다각형, 자유 그리기
- **Moodle 통합**: Moodle 3.7 LMS와 완벽하게 연동
- **데이터 저장**: MySQL 데이터베이스에 도형과 보조선 정보 저장
- **사용자 설정**: 색상, 라벨 표시, 보조선 타입 등 커스터마이징 가능

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Canvas API)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 (선택사항)
- Apache/Nginx 웹서버
- 모던 웹브라우저 (Chrome, Firefox, Safari, Edge)

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 로드
source database/schema.sql
```

### 2. API 서버 설정

```bash
# API 디렉토리로 이동
cd api

# config.php 파일 수정
nano config.php

# DB 접속 정보 수정
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_guide_lines');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName shapeguide.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /path/to/alt42standalone_v1.0/api
    <Directory /path/to/alt42standalone_v1.0/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 4. Moodle 모듈 설치 (선택사항)

```bash
# Moodle 플러그인 디렉토리로 복사
cp -r moodle/mod/shapeguide /path/to/moodle/mod/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

## 📖 사용 방법

### 웹앱 단독 사용

1. 브라우저에서 `http://localhost/shapeguide` 접속
2. 도형 유형 선택 (삼각형, 사각형, 다각형, 자유 그리기)
3. 캔버스를 클릭하여 도형 그리기
4. 자동으로 평행선(하늘색)과 수선(빨간색)이 생성됨
5. 우측 하단 스마트폰 화면에서 결과 확인
6. "저장" 버튼으로 도형 저장

### Moodle 통합 사용

1. Moodle 코스에서 "활동 추가" 클릭
2. "도형 보조선 생성기" 선택
3. 활동 이름 및 설정 입력
4. 학생들이 활동에 접속하여 도형 그리기 및 학습

## 🎨 주요 컴포넌트

### 프론트엔드 파일

- `public/index.html` - 메인 HTML 페이지
- `public/styles.css` - UI 스타일링
- `public/shape-engine.js` - 도형 그리기 엔진
- `public/app.js` - 애플리케이션 로직

### 백엔드 API

- `api/config.php` - 데이터베이스 설정
- `api/shapes.php` - 도형 CRUD API
- `api/preferences.php` - 사용자 설정 API

### 데이터베이스 스키마

- `shapes` - 도형 정보 저장
- `guide_lines` - 보조선 정보 저장
- `user_preferences` - 사용자 설정
- `activity_logs` - 활동 로그

### Moodle 모듈

- `moodle/mod/shapeguide/` - Moodle 활동 모듈
- `version.php` - 버전 정보
- `mod_form.php` - 설정 폼
- `view.php` - 메인 뷰
- `lib.php` - 핵심 함수
- `db/` - 데이터베이스 정의

## 🎯 도형 보조선 알고리즘

### 평행선 생성

```javascript
// 각 변에 대해 평행한 선을 일정 거리만큼 떨어뜨려 생성
const offset = 40; // 픽셀
const perpX = -uy; // 수직 단위 벡터
const perpY = ux;

parallelStart = {
    x: p1.x + perpX * offset,
    y: p1.y + perpY * offset
};
```

### 수선 생성

```javascript
// 각 꼭짓점에서 변에 수직인 선을 생성
const perpLength = 60; // 픽셀
perpStart = {
    x: vertex.x - perpX * perpLength / 2,
    y: vertex.y - perpY * perpLength / 2
};
```

## 🔧 커스터마이징

### 보조선 색상 변경

```javascript
// shape-engine.js에서
this.settings = {
    parallelColor: '#4ECDC4',      // 평행선 색상
    perpendicularColor: '#FF6B6B',  // 수선 색상
    shapeColor: '#2c3e50',         // 도형 색상
};
```

### 스마트폰 화면 크기 조정

```css
/* styles.css에서 */
.smartphone-frame {
    width: 360px;
    height: 720px;
}
```

## 📊 API 엔드포인트

### GET /api/shapes.php
모든 도형 목록 조회

**Response:**
```json
{
    "success": true,
    "shapes": [...]
}
```

### POST /api/shapes.php
새 도형 생성 및 보조선 자동 생성

**Request:**
```json
{
    "shape_name": "삼각형 1",
    "shape_type": "triangle",
    "vertices": [
        {"x": 100, "y": 100},
        {"x": 200, "y": 100},
        {"x": 150, "y": 200}
    ]
}
```

**Response:**
```json
{
    "success": true,
    "shape_id": 1,
    "guide_lines_generated": 6
}
```

### GET /api/preferences.php
사용자 설정 조회

### PUT /api/preferences.php
사용자 설정 업데이트

## 🎓 교육적 활용

1. **기하학 기본 개념**: 평행선과 수선의 개념 이해
2. **도형 분석**: 다양한 도형의 성질 탐구
3. **시각화 학습**: 추상적 개념을 시각적으로 이해
4. **상호작용**: 직접 도형을 그리며 능동적 학습
5. **협업 학습**: Moodle을 통한 과제 제출 및 공유

## 🐛 문제 해결

### API 연결 오류
- `api/config.php`에서 데이터베이스 접속 정보 확인
- PHP 오류 로그 확인: `/var/log/apache2/error.log`

### 캔버스가 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API 지원 브라우저 사용 확인

### Moodle 통합 오류
- Moodle 버전 확인 (3.7 이상)
- 플러그인 디렉토리 권한 확인
- Moodle 디버그 모드 활성화하여 오류 확인

## 📄 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📧 문의

문제나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for mathematics education**
