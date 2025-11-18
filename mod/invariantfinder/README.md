# Invariant Finder - Moodle Activity Module

## 개요 (Overview)

**Invariant Finder**는 학생들이 기하학적 도형을 탐구하고 도형을 확대/축소할 때 변하지 않는 불변 속성(invariants)을 발견할 수 있도록 돕는 Moodle 활동 모듈입니다.

**Invariant Finder** is a Moodle activity module that helps students explore geometric shapes and discover invariant properties that remain constant when shapes are scaled or transformed.

### 주요 특징 (Key Features)

- 📱 **스마트폰 뷰포트**: 우측 하단에 가상 스마트폰 화면으로 표시
- 🔍 **인터랙티브 도형**: 실시간으로 도형을 확대/축소하며 탐구
- 📐 **불변값 감지**: 각도의 합, 비율, 원주율(π) 등 불변값 자동 감지
- 💯 **자동 채점**: 발견한 불변값에 따른 자동 점수 부여
- 📊 **학습 추적**: 학생의 모든 상호작용과 시도 기록
- 🎓 **Moodle 통합**: Moodle 3.7+ 완벽 호환, MySQL 5.7 사용

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.5 or higher (tested on 3.7)
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Modern browsers with HTML5 Canvas support
  - Chrome 60+
  - Firefox 55+
  - Safari 11+
  - Edge 79+

## 설치 방법 (Installation)

### 1. 파일 복사 (Copy Files)

Moodle 설치 디렉토리의 `mod` 폴더에 `invariantfinder` 폴더를 복사합니다:

```bash
cd /path/to/moodle
cp -r /path/to/mod/invariantfinder ./mod/
```

### 2. 권한 설정 (Set Permissions)

```bash
chmod -R 755 mod/invariantfinder
chown -R www-data:www-data mod/invariantfinder
```

### 3. Moodle 업그레이드 (Upgrade Moodle)

웹 브라우저에서 Moodle 사이트에 관리자로 로그인하면 자동으로 업그레이드 화면이 표시됩니다:

```
http://your-moodle-site/admin/index.php
```

또는 CLI를 통해 업그레이드:

```bash
php admin/cli/upgrade.php
```

### 4. 설치 확인 (Verify Installation)

- **Site administration** → **Plugins** → **Activity modules**로 이동
- "Invariant Finder" 모듈이 목록에 표시되는지 확인

## 사용 방법 (Usage Guide)

### 교사용 (For Teachers)

#### 1. 활동 추가하기

1. 코스에 들어가서 **편집 모드 켜기(Turn editing on)** 클릭
2. 원하는 섹션에서 **활동 또는 리소스 추가(Add an activity or resource)** 클릭
3. **Invariant Finder** 선택
4. 다음 설정을 구성:
   - **Activity name**: 활동 이름 입력
   - **Introduction**: 학생들을 위한 설명 입력
   - **Shape type**: 도형 선택 (삼각형, 사각형, 원, 평행사변형)
   - **Difficulty level**: 난이도 설정 (1-5)
   - **Show hints**: 힌트 표시 여부

#### 2. 도형 유형 (Shape Types)

- **Triangle (삼각형)**: 각도의 합(180°), 각도 비율, 변의 비율
- **Rectangle (직사각형)**: 직각(90°), 가로세로 비율, 평행한 변
- **Circle (원)**: 원주율 π (C/D ≈ 3.14159)
- **Parallelogram (평행사변형)**: 평행한 변, 대각의 크기, 변의 비율

#### 3. 난이도 레벨 (Difficulty Levels)

- **Level 1**: 기초 - 모든 힌트 제공
- **Level 2**: 쉬움 - 대부분의 힌트 제공
- **Level 3**: 보통 - 일부 힌트만 제공
- **Level 4**: 어려움 - 최소한의 힌트
- **Level 5**: 전문가 - 힌트 없음

### 학생용 (For Students)

#### 1. 활동 시작하기

1. 코스에서 Invariant Finder 활동 클릭
2. 우측의 스마트폰 화면에 도형이 표시됨

#### 2. 도형 탐구하기

1. **Scale 슬라이더** 사용하여 도형 크기 조절 (50%-200%)
2. 각 측정값 관찰:
   - 변의 길이
   - 각도 크기
   - 비율
   - 면적, 둘레 등

3. 도형을 여러 번 확대/축소하면서 **변하지 않는 값** 찾기

#### 3. 불변값 확인하기

1. 불변값을 발견했다고 생각되면 **Check Invariant** 버튼 클릭
2. 시스템이 자동으로 불변값 감지
3. 발견한 불변값은 좌측의 "Invariants Found" 목록에 추가
4. 측정값 표시 영역에서 불변값은 녹색으로 강조 표시

#### 4. 제출하기

1. 모든 불변값을 찾았다고 생각되면 **Submit Answer** 버튼 클릭
2. 점수 자동 계산:
   - 발견한 불변값 개수에 따라 기본 점수
   - 효율성 보너스 (적은 시도로 발견할수록 높은 점수)
3. 점수는 Moodle 성적부에 자동 기록

## 데이터베이스 구조 (Database Schema)

### 테이블: `mdl_invariantfinder`

활동 인스턴스 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT(10) | 고유 ID |
| course | INT(10) | 코스 ID |
| name | VARCHAR(255) | 활동 이름 |
| intro | TEXT | 소개 텍스트 |
| shape_type | VARCHAR(50) | 도형 유형 |
| difficulty | INT(2) | 난이도 (1-5) |
| show_hints | INT(1) | 힌트 표시 여부 |
| timecreated | INT(10) | 생성 시간 |
| timemodified | INT(10) | 수정 시간 |

### 테이블: `mdl_invariantfinder_attempts`

학생 시도 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT(10) | 고유 ID |
| invariantfinder | INT(10) | 활동 ID |
| userid | INT(10) | 사용자 ID |
| invariants_found | TEXT | 발견한 불변값 (JSON) |
| scale_actions | INT(10) | 확대/축소 횟수 |
| time_spent | INT(10) | 소요 시간 (초) |
| completed | INT(1) | 완료 여부 |
| score | DECIMAL(10,2) | 점수 (0-100) |
| timecreated | INT(10) | 생성 시간 |
| timemodified | INT(10) | 수정 시간 |

### 테이블: `mdl_invariantfinder_interactions`

상호작용 로그 저장

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT(10) | 고유 ID |
| attempt_id | INT(10) | 시도 ID |
| action_type | VARCHAR(50) | 액션 유형 |
| action_data | TEXT | 액션 데이터 (JSON) |
| timestamp | INT(10) | 타임스탬프 |

## 개발자 정보 (Developer Information)

### 파일 구조 (File Structure)

```
mod/invariantfinder/
├── db/
│   ├── access.php              # 권한 정의
│   └── install.xml             # 데이터베이스 스키마
├── lang/
│   └── en/
│       └── invariantfinder.php # 영어 언어 문자열
├── pix/
│   └── icon.svg                # 모듈 아이콘
├── classes/
│   ├── event/                  # 이벤트 클래스
│   │   ├── course_module_viewed.php
│   │   └── course_module_instance_list_viewed.php
│   └── privacy/
│       └── provider.php        # GDPR 개인정보 보호
├── ajax.php                    # AJAX 요청 처리
├── index.php                   # 코스 내 활동 목록
├── lib.php                     # 핵심 라이브러리 함수
├── mod_form.php                # 활동 설정 폼
├── view.php                    # 메인 뷰 페이지
├── invariantfinder.js          # JavaScript 로직
├── styles.css                  # 스타일시트
├── version.php                 # 버전 정보
└── README.md                   # 이 문서
```

### API 엔드포인트 (API Endpoints)

#### POST `/mod/invariantfinder/ajax.php`

**액션: log_interaction**
```javascript
{
  action: 'log_interaction',
  sesskey: 'abc123',
  attempt_id: 42,
  action_type: 'scale',
  action_data: '{"scale": 1.5}'
}
```

**액션: submit_attempt**
```javascript
{
  action: 'submit_attempt',
  sesskey: 'abc123',
  attempt_id: 42,
  invariants_found: '["angleSum","ratio12"]',
  scale_actions: 15,
  time_spent: 180,
  score: 85.5
}
```

**액션: get_progress**
```javascript
{
  action: 'get_progress',
  attempt_id: 42
}
```

## 문제 해결 (Troubleshooting)

### 캔버스가 표시되지 않음

- 브라우저가 HTML5 Canvas를 지원하는지 확인
- JavaScript가 활성화되어 있는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 불변값이 감지되지 않음

- 도형을 최소 2회 이상 확대/축소했는지 확인
- "Check Invariant" 버튼 클릭
- 난이도가 너무 높지 않은지 확인

### 데이터베이스 오류

```bash
# Moodle 데이터베이스 재구성
php admin/cli/uninstall_plugins.php --plugins=mod_invariantfinder
php admin/cli/upgrade.php
```

### 권한 오류

```bash
# 파일 권한 재설정
chmod -R 755 mod/invariantfinder
chown -R www-data:www-data mod/invariantfinder
```

## 라이선스 (License)

GNU General Public License v3.0 or later

## 제작자 (Credits)

**Package**: mod_invariantfinder
**Copyright**: 2025 KAIST Touch Math Academy
**License**: http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

## 지원 (Support)

문제 발생 시:
1. Moodle 로그 확인: **Site administration** → **Reports** → **Logs**
2. 브라우저 개발자 도구 콘솔 확인
3. PHP 에러 로그 확인

## 버전 히스토리 (Version History)

### v1.0 (2025-01-18)
- 초기 릴리스
- 4가지 도형 유형 지원 (삼각형, 사각형, 원, 평행사변형)
- 스마트폰 뷰포트 UI
- 자동 불변값 감지
- Moodle 3.7 호환
- MySQL 5.7 지원
- PHP 7.1.9 호환

## 향후 계획 (Roadmap)

- [ ] 추가 도형 유형 (오각형, 육각형, 타원)
- [ ] 회전 기능 추가
- [ ] 다중 언어 지원 (한국어, 일본어 등)
- [ ] 모바일 반응형 개선
- [ ] 교사용 리포트 대시보드
- [ ] 학생 간 경쟁 모드
- [ ] 커스텀 도형 생성 기능
