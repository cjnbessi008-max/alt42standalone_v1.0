# ⭐ Number Constellation (수의 별자리)

**수학 교육을 위한 인터랙티브 숫자 패턴 시각화 앱**

Number Constellation은 수학적 숫자 패턴(소수, 배수, 자연수)을 가상 스마트폰 화면에 아름다운 별자리로 표시하는 웹 애플리케이션입니다. Moodle LMS와 원활하게 통합되어 흥미로운 학습 경험을 제공합니다.

---

## 🌟 주요 기능

- **🎨 아름다운 별자리 시각화**: 나선형 별자리 패턴으로 숫자를 별처럼 표시
- **📱 가상 스마트폰 UI**: 우측 하단에 고정된 스마트폰 프레임으로 몰입형 경험 제공
- **🔗 Moodle LMS 연동**: Moodle 코스에서 문제 데이터를 원활하게 수신
- **🎯 다양한 문제 유형**:
  - 소수 찾기
  - 배수 찾기
  - 자연수 패턴 (피보나치, 제곱수 등)
  - 합성수 찾기
  - 맞춤 패턴
- **📊 실시간 진행 상황 추적**: 학생 성과 저장 및 추적
- **🎮 인터랙티브 학습**: 별을 클릭하여 숫자 선택
- **✅ 즉각적인 피드백**: 정답/오답 시각적 표시
- **🌐 한영 지원**: 한국어 및 영어 인터페이스

---

## 🚀 빠른 시작

### 방법 1: Docker 배포 (권장)

1. **레포지토리 이동**:
   ```bash
   cd number-constellation-app
   ```

2. **환경 설정**:
   ```bash
   cd docker
   cp .env.example .env
   # .env 파일을 편집하여 설정 변경
   ```

3. **애플리케이션 시작**:
   ```bash
   docker-compose up -d
   ```

4. **애플리케이션 접속**:
   - 앱: http://localhost:8080
   - PHPMyAdmin: http://localhost:8081

### 방법 2: 수동 설치

#### 필수 요구사항
- PHP 7.1.9
- MySQL 5.7
- Apache 2.4
- Moodle 3.7

#### 설치 단계

1. **데이터베이스 설정**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. **백엔드 설정**:
   ```bash
   cd backend/config
   # database.php와 config.php를 편집하여 설정 변경
   ```

3. **Apache 설정**:
   ```apache
   DocumentRoot /path/to/number-constellation-app/frontend/public
   Alias /api /path/to/number-constellation-app/backend/api
   ```

4. **Moodle 플러그인 설치**:
   ```bash
   cp -r moodle-plugin /path/to/moodle/local/numconstellation
   # Moodle 관리자 페이지에서 설치 완료
   ```

---

## 📖 사용 방법

### 1. Moodle 플러그인 설정

Moodle 관리자 → 플러그인 → 로컬 플러그인 → Number Constellation:

- **API URL**: `http://localhost:8080/api/problem.php`
- **App URL**: `http://localhost:8080`
- **API Key**: `your-secret-api-key-here`

### 2. Moodle에서 문제 생성

```php
<?php
require_once($CFG->dirroot . '/local/numconstellation/lib.php');

// 예시: 소수 찾기 문제
$response = local_numconstellation_send_problem(
    $courseid,      // Moodle 코스 ID
    $userid,        // Moodle 사용자 ID
    'prime',        // 문제 유형
    1,              // 범위 시작
    50,             // 범위 끝
    'easy',         // 난이도
    array(          // 추가 데이터
        'instruction' => '별자리에서 소수를 모두 찾으세요',
        'targets' => [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
    )
);

// 앱 URL 가져오기
$app_url = local_numconstellation_get_app_url(
    $response->problem_id,
    $userid
);

// 가상 스마트폰에 표시 (우측 하단)
echo '<iframe src="' . $app_url . '" style="position:fixed; bottom:20px; right:20px; width:375px; height:667px;"></iframe>';
```

### 3. 문제 유형

#### 소수 (Prime Numbers)
```php
local_numconstellation_send_problem($cid, $uid, 'prime', 1, 100, 'medium');
```

#### 배수 (Multiples)
```php
local_numconstellation_send_problem($cid, $uid, 'multiple', 1, 100, 'easy', [
    'multiple_of' => 3  // 3의 배수
]);
```

#### 사용자 정의 패턴 (피보나치 등)
```php
local_numconstellation_send_problem($cid, $uid, 'natural', 1, 50, 'hard', [
    'instruction' => '피보나치 수열을 찾으세요',
    'targets' => [1, 1, 2, 3, 5, 8, 13, 21, 34],
    'pattern_type' => 'fibonacci'
]);
```

---

## 🎯 문제 유형 참조

| 유형 | 설명 | 예시 |
|------|------|------|
| `prime` | 소수 | 2, 3, 5, 7, 11, 13... |
| `multiple` | 특정 수의 배수 | 3의 배수: 3, 6, 9, 12... |
| `natural` | 자연수 패턴 | 피보나치, 제곱수 등 |
| `composite` | 합성수 | 4, 6, 8, 9, 10, 12... |
| `mixed` | 사용자 정의 조합 | 교사가 정의한 대상 |

---

## 🧪 테스트

### 문제 생성 테스트

```bash
curl -X POST http://localhost:8080/api/problem.php \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "moodle_problem_id": "TEST_001",
    "moodle_course_id": 1,
    "moodle_user_id": 1,
    "problem_type": "prime",
    "number_range_start": 1,
    "number_range_end": 50,
    "difficulty_level": "easy"
  }'
```

### 테스트 앱 접속

```
http://localhost:8080?problem_id=TEST_001&user_id=1
```

---

## 🎨 사용자 정의

### 별자리 색상 변경

`constellation_configs` 테이블 편집:

```sql
UPDATE constellation_configs SET
  prime_color = '#FF4444',      -- 소수 색상
  multiple_color = '#4444FF',   -- 배수 색상
  natural_color = '#44FF44'     -- 자연수 색상
WHERE config_name = 'default';
```

### 스마트폰 프레임 위치 조정

`frontend/src/styles/main.css` 수정:

```css
#smartphone-container {
    position: fixed;
    bottom: 20px;   /* 하단 여백 */
    right: 20px;    /* 우측 여백 */
}
```

---

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Deployment**: Docker, Apache 2.4

---

## 📊 데이터베이스 스키마

### 테이블

1. **problems**: Moodle에서 받은 문제 데이터 저장
2. **student_progress**: 학생 상호작용 추적
3. **constellation_configs**: 시각화 설정
4. **analytics**: 코스 레벨 분석

---

## 🎓 교육적 활용

다음 용도에 적합:
- 초등/중등 수학 교육
- 정수론 개념 학습
- 패턴 인식 훈련
- 인터랙티브 문제 해결
- Moodle 통합 코스

---

## 🛠️ 개발

### 로컬 개발

```bash
# 백엔드 (PHP 내장 서버)
cd backend
php -S localhost:8000

# 프론트엔드 (정적 서버)
cd frontend/public
python3 -m http.server 8080
```

---

## 📈 향후 계획

- [ ] 추가 패턴 유형 (삼각수, 완전제곱수)
- [ ] 멀티플레이어 모드
- [ ] 리더보드
- [ ] 사운드 효과
- [ ] 태블릿/데스크톱 최적화 뷰
- [ ] PDF 결과 내보내기
- [ ] 다른 LMS 플랫폼 통합

---

**수의 별자리와 함께 즐거운 수학 학습 되세요! ⭐✨**
