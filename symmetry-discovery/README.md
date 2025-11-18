# 🔍 대칭 발견기 (Symmetry Discovery)

## 개요

대칭 발견기는 도형을 회전시켜 숨겨진 대칭선을 빛으로 발견하는 교육용 인터랙티브 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에 표시되며, Moodle LMS와 완전히 통합됩니다.

## 주요 기능

### 🎮 인터랙티브 학습
- **도형 회전**: 터치/드래그로 도형을 자유롭게 회전
- **대칭선 발견**: 정확한 대칭 위치에서 빛나는 효과
- **실시간 피드백**: 파티클 효과와 사운드로 즉각적인 반응
- **진행 추적**: 레벨별 진행도와 점수 시스템

### 📱 가상 스마트폰 UI
- **현실적인 스마트폰 디자인**: 노치, 상태바, 홈 버튼 포함
- **우측 하단 고정 위치**: 반응형 디자인
- **부드러운 애니메이션**: 슬라이드 인 효과

### 🎯 다양한 도형
1. 정삼각형 (3개 대칭축)
2. 정사각형 (4개 대칭축)
3. 정오각형 (5개 대칭축)
4. 정육각형 (6개 대칭축)
5. 원 (무한 대칭축)
6. 별 (5개 대칭축)
7. 하트 (1개 대칭축)
8. 나비 (1개 대칭축)

### 💫 시각 효과
- **빛나는 대칭선**: 황금빛 글로우 효과
- **파티클 폭발**: 발견 시 불꽃놀이 효과
- **화면 플래시**: 완성 시 화면 전체 효과
- **부드러운 애니메이션**: 모든 전환에 애니메이션 적용

### 🔊 사운드 효과
- Web Audio API 사용
- 대칭선 발견 시 상승 아르페지오
- 완성 시 축하 코드
- 힌트 사용 시 피드백 사운드

### 🎓 Moodle LMS 통합
- **자동 성적 연동**: Moodle 성적표에 자동 기록
- **진행도 추적**: 학생별 진행 상황 저장
- **리더보드**: 코스별 순위 시스템
- **활동 로깅**: 모든 상호작용 기록

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 그라디언트, 애니메이션, 플렉스박스
- **JavaScript (ES6)**: 모듈형 아키텍처
  - Shape Library
  - Symmetry Detector
  - Particle Effects
  - Moodle Integration
  - Main App Controller

### 백엔드
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 통합

### 데이터베이스
- 8개 주요 테이블
- 저장 프로시저 및 트리거
- 성능 최적화 인덱스
- 뷰를 통한 데이터 접근

## 시스템 요구사항

### 서버
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx
- Moodle 3.7 이상

### 클라이언트
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript 활성화
- 터치 스크린 또는 마우스

## 설치 가이드

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE symmetry_discovery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON symmetry_discovery.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
mysql -u moodle_user -p symmetry_discovery < db/schema.sql
```

### 2. PHP 설정

```bash
# config.php 파일 수정
cd symmetry-discovery/php
nano config.php
```

다음 항목들을 수정하세요:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'symmetry_discovery');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_actual_password');
define('MOODLE_DIR', '/path/to/your/moodle');
define('API_SECRET_KEY', 'generate-random-secret-key');
```

### 3. Moodle 모듈 설치

```bash
# Moodle 모듈 디렉토리로 복사
cp -r moodle/mod_symmetry /path/to/moodle/mod/

# 앱 파일 복사
mkdir /path/to/moodle/mod/symmetry/app
cp -r {index.html,css,js} /path/to/moodle/mod/symmetry/app/

# 권한 설정
chmod -R 755 /path/to/moodle/mod/symmetry
chown -R www-data:www-data /path/to/moodle/mod/symmetry
```

### 4. Moodle에서 모듈 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림** 으로 이동
3. 새 모듈이 감지되면 **데이터베이스 업그레이드** 클릭
4. 설치 완료 확인

### 5. 활동 추가

1. 코스로 이동
2. **편집 모드 켜기**
3. **활동 또는 리소스 추가**
4. **대칭 발견기** 선택
5. 활동 이름 및 설명 입력
6. 저장

## 독립 실행 (Standalone Mode)

Moodle 없이 독립적으로 실행할 수 있습니다:

```bash
# 웹 서버 디렉토리에 파일 복사
cp -r symmetry-discovery /var/www/html/

# 브라우저에서 접속
# http://your-server/symmetry-discovery/index.html
```

독립 실행 모드에서는:
- 로컬 스토리지에 진행도 저장
- Moodle 연동 기능 비활성화
- 모든 게임 기능은 정상 작동

## 디렉토리 구조

```
symmetry-discovery/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css          # 스타일시트
├── js/
│   ├── app.js              # 메인 애플리케이션
│   ├── shapes.js           # 도형 라이브러리
│   ├── symmetry-detector.js    # 대칭 감지 알고리즘
│   ├── particle-effects.js     # 시각 효과
│   └── moodle-integration.js   # Moodle 연동
├── php/
│   ├── api.php             # API 엔드포인트
│   ├── config.php          # 설정 파일
│   ├── database.php        # 데이터베이스 클래스
│   └── moodle-connector.php    # Moodle 커넥터
├── db/
│   └── schema.sql          # 데이터베이스 스키마
├── moodle/
│   └── mod_symmetry/       # Moodle 모듈
│       ├── version.php
│       ├── view.php
│       ├── lib.php
│       ├── db/
│       │   ├── install.xml
│       │   └── access.php
│       └── lang/
│           └── en/
│               └── symmetry.php
└── README.md               # 이 파일
```

## API 엔드포인트

### POST /php/api.php

모든 API 요청은 JSON 형식으로 전송됩니다.

#### 1. 세션 검증
```json
{
  "action": "verify_session",
  "session_id": "session_token",
  "user_id": 123
}
```

#### 2. 진행도 저장
```json
{
  "action": "save_progress",
  "user_id": 123,
  "course_id": 1,
  "activity_id": 1,
  "data": {
    "score": 1500,
    "highScore": 2000,
    "level": 3
  }
}
```

#### 3. 진행도 로드
```json
{
  "action": "load_progress",
  "user_id": 123,
  "course_id": 1,
  "activity_id": 1
}
```

#### 4. 점수 제출
```json
{
  "action": "submit_score",
  "user_id": 123,
  "course_id": 1,
  "activity_id": 1,
  "score": 1500,
  "completed": true
}
```

#### 5. 리더보드 조회
```json
{
  "action": "get_leaderboard",
  "course_id": 1,
  "activity_id": 1,
  "limit": 10
}
```

#### 6. 이벤트 로깅
```json
{
  "action": "log_event",
  "user_id": 123,
  "event_type": "symmetry_discovered",
  "event_data": {
    "shape_id": 1,
    "symmetry_angle": 90
  }
}
```

## 데이터베이스 스키마

### 주요 테이블

1. **sym_users**: 사용자 정보
2. **sym_sessions**: 세션 관리
3. **sym_progress**: 도형별 진행도
4. **sym_scores**: 전체 점수 및 성적
5. **sym_events**: 활동 로그
6. **sym_leaderboard**: 리더보드 캐시
7. **sym_achievements**: 업적 시스템
8. **sym_settings**: 설정 값

### 저장 프로시저

- `update_leaderboard_rankings()`: 순위 업데이트
- `get_user_stats()`: 사용자 통계 조회
- `clean_expired_sessions()`: 만료된 세션 정리

### 트리거

- `after_score_update`: 점수 업데이트 시 리더보드 갱신
- `after_progress_complete`: 진행도 완료 시 업적 부여

## 커스터마이징

### 점수 시스템 변경

`php/config.php`에서 수정:
```php
define('BASE_SCORE_PER_SYMMETRY', 100);  // 기본 점수
define('COMPLETION_BONUS', 500);          // 완성 보너스
```

### 도형 추가

`js/shapes.js`의 `initializeShapes()` 메서드에 새 도형 추가:
```javascript
{
    id: 9,
    name: '새 도형',
    symmetryLines: [
        { angle: 0, tolerance: 5 }
    ],
    draw: function(ctx, centerX, centerY, size, rotation) {
        // 도형 그리기 로직
    }
}
```

### 스타일 변경

`css/styles.css`에서 색상 및 스타일 커스터마이징 가능:
- 그라디언트 색상
- 애니메이션 속도
- UI 크기 및 위치

## 문제 해결

### 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u moodle_user -p symmetry_discovery
```

### Moodle 통합 문제
1. Moodle 경로 확인: `php/config.php`의 `MOODLE_DIR`
2. 파일 권한 확인: `ls -la /path/to/moodle/mod/symmetry`
3. Moodle 로그 확인: 사이트 관리 > 보고서 > 로그

### 성적이 기록되지 않음
1. API 엔드포인트 확인: 브라우저 콘솔에서 네트워크 탭 확인
2. 데이터베이스 권한 확인
3. PHP 오류 로그 확인: `/var/log/apache2/error.log`

### 스마트폰 화면이 표시되지 않음
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일 로드 확인
3. 캐시 클리어 후 새로고침

## 성능 최적화

### 데이터베이스
- 적절한 인덱스 사용
- 주기적인 세션 정리
- 리더보드 캐싱

### 프론트엔드
- 이미지 최적화
- JavaScript 번들링 고려
- CDN 사용 권장

### 서버
- gzip 압축 활성화
- 브라우저 캐싱 설정
- PHP opcache 활성화

## 보안 고려사항

1. **SQL Injection 방지**: Prepared Statements 사용
2. **XSS 방지**: 입력 검증 및 이스케이프
3. **CSRF 방지**: Moodle 세션 토큰 사용
4. **API 보안**: 세션 검증 필수
5. **데이터베이스**: 최소 권한 원칙

## 브라우저 호환성

| 브라우저 | 최소 버전 |
|---------|----------|
| Chrome  | 60+      |
| Firefox | 55+      |
| Safari  | 11+      |
| Edge    | 79+      |

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원 및 문의

- 이슈 리포트: GitHub Issues
- 문서: 이 README 파일

## 버전 기록

### v1.0.0 (2025-01-18)
- 초기 릴리스
- 8개 도형 지원
- Moodle 3.7 통합
- 완전한 기능의 인터랙티브 UI
- 점수 및 리더보드 시스템
- 실시간 대칭선 감지
- 파티클 및 사운드 효과

## 향후 계획

- [ ] 더 많은 도형 추가
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 모바일 앱 버전
- [ ] AI 기반 난이도 조절
- [ ] 멀티플레이어 모드
- [ ] 상세한 분석 대시보드
