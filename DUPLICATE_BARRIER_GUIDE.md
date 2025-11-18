# Duplicate Barrier 기능 가이드

## 개요

**Duplicate Barrier**는 LMS 문제 표시 시스템에서 사용자가 이미 본 문제를 다시 클릭할 때 시각적 차단 애니메이션을 표시하는 기능입니다.

## 주요 기능

### 1. 가상 스마트폰 화면 (Virtual Smartphone Screen)

- **위치**: 화면 우측 하단
- **크기**: 320x640px (모바일 디바이스 비율)
- **기능**:
  - 문제 클릭 시 가상 스마트폰에 문제 내용 표시
  - 스크롤 가능한 콘텐츠 영역
  - 최소화/펼치기 토글 버튼

### 2. 중복 감지 시스템 (Duplicate Detection)

#### 2.1 세션 기반 추적
- PHP 세션을 사용하여 현재 사용자가 본 문제 추적
- 빠른 응답 속도 (메모리 기반)
- 브라우저 세션이 유지되는 동안 지속

#### 2.2 데이터베이스 영구 추적
- MySQL 데이터베이스에 조회 기록 저장
- 다중 조회 횟수 기록
- 마지막 조회 시간 타임스탬프
- 세션 간 지속성

### 3. Duplicate Barrier 애니메이션

중복된 문제를 클릭하면 다음 애니메이션이 실행됩니다:

- **배경 효과**: 빨간색 펄스 애니메이션 (0.6초)
- **아이콘**: 회전하며 나타나는 차단 아이콘 🚫
- **메시지 박스**: 흔들리는 애니메이션과 함께 경고 메시지
- **자동 종료**: 2초 후 자동으로 사라짐

## 기술 스택

### Frontend
- **HTML5**: 가상 스마트폰 구조
- **CSS3**:
  - Flexbox 레이아웃
  - CSS Animations (keyframes)
  - Fixed positioning
  - Responsive design
- **JavaScript (ES6)**:
  - Fetch API
  - Set 자료구조
  - DOM 조작
  - 이벤트 리스너

### Backend
- **PHP 7.1.9+**: 서버사이드 로직
- **MySQL 5.7**: 데이터 영구 저장
- **PDO**: 데이터베이스 연결 (Prepared Statements)

## 사용 방법

### 기본 사용

1. 메인 페이지에서 문제 카드를 클릭
2. 우측 하단 가상 스마트폰에 문제 내용이 표시됨
3. 같은 문제를 다시 클릭하면 Duplicate Barrier 애니메이션 실행

### API 엔드포인트

#### 1. 문제 조회 기록 (Mark as Viewed)
```javascript
POST /api.php?action=mark_viewed
Content-Type: application/json

{
  "question_id": 123
}
```

**응답:**
```json
{
  "success": true,
  "message": "Question marked as viewed",
  "question_id": 123
}
```

#### 2. 중복 확인 (Check Duplicate)
```
GET /api.php?action=check_duplicate&id=123
```

**응답:**
```json
{
  "success": true,
  "data": {
    "is_duplicate": true,
    "view_count": 2,
    "last_viewed": "2024-11-18 12:30:45",
    "session_viewed": true,
    "db_viewed": true
  }
}
```

#### 3. 조회 기록 초기화 (Clear Viewed)
```
POST /api.php?action=clear_viewed&clear_db=true
```

**응답:**
```json
{
  "success": true,
  "message": "Viewed questions cleared"
}
```

#### 4. 통계 조회 (Get Statistics)
```
GET /api.php?action=get_statistics
```

**응답:**
```json
{
  "success": true,
  "data": {
    "session_viewed_count": 5,
    "db_unique_questions": 5,
    "db_total_views": 8,
    "db_max_views_single": 3,
    "db_avg_views": 1.6
  }
}
```

#### 5. 오래된 기록 정리 (Cleanup)
```
GET /api.php?action=cleanup_old_records&days=30
```

**응답:**
```json
{
  "success": true,
  "message": "Deleted 42 old records",
  "deleted_count": 42
}
```

## 데이터베이스 스키마

### mdl_question_views 테이블

```sql
CREATE TABLE mdl_question_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_session VARCHAR(255) NOT NULL,
    view_count INT DEFAULT 1,
    first_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_session (question_id, user_session),
    INDEX idx_last_viewed (last_viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 필드 설명

- **id**: 고유 식별자
- **question_id**: Moodle 문제 ID (mdl_question.id와 연결)
- **user_session**: PHP 세션 ID
- **view_count**: 조회 횟수
- **first_viewed_at**: 최초 조회 시간
- **last_viewed_at**: 마지막 조회 시간

## JavaScript API

### DuplicateBarrier 객체

```javascript
// 초기화
DuplicateBarrier.init();

// 중복 확인
if (DuplicateBarrier.isDuplicate(questionId)) {
    console.log('Already viewed!');
}

// 문제 로드
DuplicateBarrier.loadQuestion({
    id: 123,
    name: "문제 제목",
    text: "<p>문제 내용</p>",
    type: "multichoice",
    mark: "10"
});

// 조회 기록으로 표시
DuplicateBarrier.markViewed(questionId);

// 배리어 표시
DuplicateBarrier.showBarrier(viewCount);

// 초기화
DuplicateBarrier.clearViewed();
```

## CSS 커스터마이징

### 가상 스마트폰 위치 변경

```css
.virtual-phone {
    right: 20px;  /* 우측 여백 */
    bottom: 20px; /* 하단 여백 */
}
```

### 배리어 색상 변경

```css
.barrier-content {
    background: rgba(220, 53, 69, 0.95); /* 빨간색 */
}

/* 파란색으로 변경 */
.barrier-content {
    background: rgba(13, 110, 253, 0.95);
}
```

### 애니메이션 속도 조절

```css
@keyframes barrierPulse {
    /* 0.6초 → 1초로 변경 */
}

.barrier-content {
    animation: barrierShake 1s ease-in-out; /* 0.5초 → 1초 */
}
```

## 반응형 디자인

### 데스크톱 (1024px 이상)
- 전체 크기 가상 스마트폰 (320x640px)
- 완전한 기능

### 태블릿 (768px - 1024px)
- 축소된 스마트폰 (280x560px)
- 모든 기능 유지

### 모바일 (768px 미만)
- 가상 스마트폰 숨김
- 기본 문제 카드만 표시
- 중복 감지는 백그라운드에서 계속 작동

## 브라우저 호환성

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 47+

## 성능 최적화

### 1. 세션 우선 확인
- 메모리 기반 세션 체크가 DB보다 빠름
- DB는 영구 저장용으로만 사용

### 2. 인덱스 활용
- `idx_question_session`: 빠른 중복 조회
- `idx_last_viewed`: 정리 작업 최적화

### 3. 비동기 처리
- Fetch API로 비블로킹 통신
- 사용자 경험 향상

## 보안 고려사항

### 1. SQL Injection 방지
- PDO Prepared Statements 사용
- 모든 입력값 타입 검증

### 2. XSS 방지
- `htmlspecialchars()` 사용
- JavaScript `textContent` 활용

### 3. CSRF 방지 (향후 추가 권장)
- CSRF 토큰 구현
- 세션 검증 강화

## 문제 해결

### 가상 스마트폰이 보이지 않을 때

1. 브라우저 크기 확인 (768px 이상이어야 함)
2. JavaScript 콘솔 오류 확인
3. CSS 파일 로드 확인

### 중복 감지가 작동하지 않을 때

1. PHP 세션 시작 확인
2. 데이터베이스 연결 확인
3. 브라우저 콘솔에서 네트워크 탭 확인

### 애니메이션이 재생되지 않을 때

1. CSS3 애니메이션 지원 브라우저 확인
2. `duplicate-barrier` 클래스 확인
3. JavaScript 이벤트 리스너 확인

## 향후 개선 사항

### Phase 2
- [ ] 사용자별 통계 대시보드
- [ ] 문제 난이도별 필터링
- [ ] 복습 추천 시스템

### Phase 3
- [ ] 다국어 지원
- [ ] 테마 커스터마이징
- [ ] 모바일 앱 연동

## 라이선스

이 프로젝트는 Moodle 3.7 LMS 연동 시스템의 일부입니다.

## 지원

문제가 발생하거나 질문이 있으시면 개발팀에 문의하세요.

---

**버전**: 1.0.0
**마지막 업데이트**: 2024-11-18
**호환성**: PHP 7.1.9+, MySQL 5.7, Moodle 3.7
