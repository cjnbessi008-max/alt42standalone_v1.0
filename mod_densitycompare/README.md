# Density Compare - Moodle Activity Plugin

**넓이 비교를 두 색의 밀도 차이로 표현하는 Moodle 학습 활동**

## 개요 (Overview)

Density Compare는 Moodle LMS와 연동되어 학생들이 도형의 넓이를 시각적으로 비교할 수 있도록 도와주는 교육용 플러그인입니다. 우측 하단의 가상 스마트폰 화면에서 색의 밀도(농도)를 통해 넓이 차이를 직관적으로 이해할 수 있습니다.

### 주요 기능

- ✅ **밀도 시각화**: 넓이가 큰 도형은 색이 진하게, 작은 도형은 연하게 표시
- ✅ **인터랙티브 학습**: 학생들이 직접 답을 선택하고 즉시 피드백 제공
- ✅ **스마트폰 시뮬레이터**: 우측 하단에 모바일 화면 시뮬레이션
- ✅ **다양한 도형**: 직사각형, 원, 혼합 도형 지원
- ✅ **Moodle 통합**: 성적, 진행도 자동 추적
- ✅ **반응형 디자인**: 데스크톱, 태블릿, 모바일 지원

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 방법

### 1. 플러그인 다운로드 및 설치

```bash
# Moodle 루트 디렉토리로 이동
cd /path/to/moodle

# mod 디렉토리에 플러그인 복사
cp -r /path/to/mod_densitycompare mod/densitycompare

# 권한 설정
chmod -R 755 mod/densitycompare
chown -R www-data:www-data mod/densitycompare
```

### 2. Moodle 관리자 페이지에서 설치

1. Moodle 사이트 관리자로 로그인
2. **사이트 관리 → 알림** 페이지로 이동
3. Moodle이 새 플러그인을 감지하고 설치 프롬프트 표시
4. **데이터베이스 업그레이드** 버튼 클릭
5. 설치 완료!

### 3. 플러그인 활성화 확인

- **사이트 관리 → 플러그인 → 활동 모듈**에서 "Density Compare" 확인

## 사용 방법

### 교사용 가이드

#### 1. 활동 추가

1. 코스 페이지로 이동
2. **편집 모드 켜기** 클릭
3. **활동 또는 리소스 추가** → **Density Compare** 선택
4. 활동 이름과 설명 입력
5. **저장** 클릭

#### 2. 기본 문제 자동 생성

- 활동을 처음 생성하면 4개의 샘플 문제가 자동으로 생성됩니다:
  - 직사각형 vs 직사각형 (기본)
  - 원 vs 원 (기본)
  - 직사각형 vs 원 (혼합)
  - 같은 넓이 비교 (중급)

#### 3. 학생 진행도 확인

- 활동 페이지에서 **성적** 탭을 통해 학생들의 답안과 정확도 확인 가능

### 학생용 가이드

#### 1. 활동 접속

1. 코스 페이지에서 Density Compare 활동 클릭
2. 우측 하단의 가상 스마트폰 화면에 두 도형이 표시됨

#### 2. 문제 풀이

1. **색의 밀도 비교**: 더 진한 색 = 더 큰 넓이
2. 세 가지 선택지 중 하나 선택:
   - "도형 1이 더 크다"
   - "도형 1이 더 작다"
   - "둘 다 같다"
3. 답안 제출 후 즉시 피드백 확인
4. **다음** 버튼을 클릭하여 새 문제 풀이

## 파일 구조

```
mod_densitycompare/
├── version.php                     # 플러그인 버전 정보
├── lib.php                         # Moodle 필수 함수
├── mod_form.php                    # 활동 설정 폼
├── view.php                        # 학생 뷰 페이지
├── styles.css                      # 스타일시트
├── README.md                       # 이 파일
├── db/
│   ├── install.xml                 # 데이터베이스 스키마
│   └── access.php                  # 권한 설정
├── lang/
│   ├── en/
│   │   └── densitycompare.php      # 영어 언어 파일
│   └── ko/
│       └── densitycompare.php      # 한국어 언어 파일
├── js/
│   └── densitycompare.js           # Canvas 기반 시각화
└── classes/
    └── event/
        └── course_module_viewed.php # 이벤트 추적
```

## 데이터베이스 구조

### densitycompare
메인 활동 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| course | INT | 코스 ID |
| name | VARCHAR(255) | 활동 이름 |
| intro | TEXT | 활동 설명 |

### densitycompare_problems
문제 정보 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| densitycompare_id | INT | 활동 ID |
| problem_type | VARCHAR(50) | 문제 유형 (rectangle, circle, mixed) |
| shape1_data | TEXT | 도형 1 정보 (JSON) |
| shape2_data | TEXT | 도형 2 정보 (JSON) |
| color1 | VARCHAR(20) | 도형 1 색상 |
| color2 | VARCHAR(20) | 도형 2 색상 |
| question_text | TEXT | 질문 텍스트 |
| correct_answer | VARCHAR(50) | 정답 (larger, smaller, equal) |
| difficulty | INT | 난이도 (1-5) |

### densitycompare_attempts
학생 답안 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| problem_id | INT | 문제 ID |
| userid | INT | 학생 ID |
| answer | VARCHAR(50) | 학생 답안 |
| is_correct | INT | 정답 여부 (0/1) |
| time_spent | INT | 소요 시간 (초) |

## 기술 스택

### 백엔드
- **PHP 7.1.9**: Moodle 플러그인 로직
- **MySQL 5.7**: 데이터 저장소
- **Moodle API**: 활동 통합, 권한 관리

### 프론트엔드
- **HTML5 Canvas**: 도형 및 밀도 시각화
- **Vanilla JavaScript**: 인터랙티브 기능
- **CSS3**: 스마트폰 시뮬레이터 및 반응형 디자인

## 주요 기능 설명

### 1. 밀도 시각화 알고리즘

```javascript
// 넓이 계산
area1 = width1 × height1  (직사각형)
area1 = π × radius1²      (원)

// 밀도 계산 (0.0 ~ 1.0)
maxArea = max(area1, area2)
density1 = area1 / maxArea
density2 = area2 / maxArea

// 색상 적용
color1 = rgba(R, G, B, density1)
color2 = rgba(R, G, B, density2)
```

### 2. 스마트폰 시뮬레이터

- **위치**: 우측 하단 고정 (데스크톱)
- **크기**: 340px × 680px (iPhone 크기 시뮬레이션)
- **디자인**: 베젤, 홈 버튼, 상단 노치 재현
- **반응형**: 모바일에서는 중앙 배치

### 3. 실시간 피드백

- ✅ **정답**: 초록색 배경 + 체크마크 애니메이션
- ❌ **오답**: 빨간색 배경 + X 표시 애니메이션
- ⏱️ **소요 시간**: 자동 측정 및 저장

## 커스터마이징

### 색상 변경

`styles.css`에서 다음 변수를 수정:

```css
/* 도형 기본 색상 */
--color1: #FF6B6B;  /* 빨간색 계열 */
--color2: #4ECDC4;  /* 청록색 계열 */

/* 스마트폰 프레임 색상 */
--frame-color: #2c3e50;
```

### 새 문제 추가

`lib.php`의 `densitycompare_create_default_problems()` 함수를 수정하여 새로운 문제 추가:

```php
array(
    'problem_type' => 'triangle',
    'shape1_data' => json_encode(array('base' => 80, 'height' => 60)),
    'shape2_data' => json_encode(array('base' => 70, 'height' => 70)),
    'question_text' => 'Which triangle has a larger area?',
    'correct_answer' => 'smaller',
    'difficulty' => 3
)
```

## 문제 해결 (Troubleshooting)

### 문제: 스마트폰 화면이 표시되지 않음

**해결책**:
1. 브라우저 콘솔(F12)에서 JavaScript 오류 확인
2. `styles.css`와 `densitycompare.js`가 올바르게 로드되었는지 확인
3. 캐시 삭제: **사이트 관리 → 개발 → 캐시 제거**

### 문제: 문제가 로드되지 않음

**해결책**:
1. 데이터베이스 테이블 확인: `densitycompare_problems`에 레코드가 있는지 확인
2. PHP 오류 로그 확인: `/var/log/apache2/error.log`
3. Moodle 디버그 모드 활성화: **사이트 관리 → 개발 → 디버깅**

### 문제: 답안 제출이 작동하지 않음

**해결책**:
1. 학생이 `mod/densitycompare:submit` 권한을 가지고 있는지 확인
2. AJAX 요청 오류 확인 (브라우저 네트워크 탭)
3. PHP 세션이 올바르게 작동하는지 확인

## 라이선스

GNU General Public License v3.0

## 개발자 정보

- **개발**: AI Education System Pipeline
- **버전**: 1.0
- **호환**: Moodle 3.7+
- **언어**: 한국어, 영어

## 업데이트 내역

### v1.0 (2025-11-18)
- ✨ 초기 릴리스
- ✅ 기본 밀도 비교 기능
- ✅ 스마트폰 시뮬레이터 UI
- ✅ Canvas 기반 시각화
- ✅ Moodle 3.7 통합
- ✅ 한국어/영어 지원

## 향후 계획

- [ ] 삼각형, 사다리꼴 등 추가 도형 지원
- [ ] 교사가 직접 문제를 생성할 수 있는 UI
- [ ] 학생별 성과 분석 대시보드
- [ ] 애니메이션 효과 개선
- [ ] 음성 피드백 지원
- [ ] AI 기반 난이도 자동 조정

## 지원 및 문의

문제 발생 시 다음 정보를 포함하여 문의해주세요:
- Moodle 버전
- PHP 버전
- 브라우저 및 버전
- 오류 메시지 스크린샷
- PHP/Moodle 오류 로그

---

**Made with ❤️ for KAIST Touch Math Academy**
