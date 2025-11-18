# 3D Line Seq - 수열 3D 시각화

수열 항 배열을 3D 느낌으로 표현하는 Moodle LMS 플러그인 및 웹앱입니다.

![3D Line Seq Preview](https://via.placeholder.com/800x400?text=3D+Line+Seq+Preview)

## 📋 목차

- [기능](#기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [프로젝트 구조](#프로젝트-구조)
- [기술 스택](#기술-스택)
- [개발자 가이드](#개발자-가이드)

---

## ✨ 기능

### 🎯 핵심 기능

1. **Moodle LMS 연동**
   - Moodle 3.7과 완벽하게 통합
   - 코스 내 활동으로 추가 가능
   - 학생 진도 및 시도 추적

2. **3D 수열 시각화**
   - Four.js 기반의 실시간 3D 렌더링
   - 4가지 시각화 스타일:
     - 📈 **Line**: 선형 연결
     - 🌊 **Curve**: 곡선 연결
     - 🌀 **Spiral**: 나선형 배치
     - 📊 **Bars**: 3D 막대 그래프

3. **수열 유형 지원**
   - 등차수열 (Arithmetic)
   - 등비수열 (Geometric)
   - 피보나치 (Fibonacci)
   - 사용자 정의 (Custom)

4. **스마트폰 시뮬레이션**
   - 우측 하단에 가상 스마트폰 화면 표시
   - 실제 모바일 디바이스를 시뮬레이션
   - 반응형 디자인으로 실제 모바일에서도 동작

5. **인터랙티브 컨트롤**
   - 마우스/터치 드래그로 회전
   - 마우스 휠로 확대/축소
   - 자동 회전 토글
   - 시각화 스타일 변경

---

## 💻 시스템 요구사항

### Moodle 서버
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 최신 버전

### 클라이언트 (웹 브라우저)
- **Chrome**: 최신 버전 (권장)
- **Firefox**: 최신 버전
- **Safari**: 최신 버전
- **Edge**: 최신 버전
- **WebGL 지원 필수**

---

## 🚀 설치 방법

### 1. Moodle 플러그인 설치

#### 방법 A: ZIP 파일 업로드
```bash
# 1. 플러그인 디렉토리를 ZIP으로 압축
cd moodle-plugin
zip -r 3dlineseq.zip 3dlineseq/

# 2. Moodle 관리자 페이지에서 업로드
# 사이트 관리 > 플러그인 > 플러그인 설치
```

#### 방법 B: 직접 복사
```bash
# Moodle 루트 디렉토리에서 실행
cp -r moodle-plugin/3dlineseq /path/to/moodle/mod/3dlineseq

# 권한 설정
chown -R www-data:www-data /path/to/moodle/mod/3dlineseq
chmod -R 755 /path/to/moodle/mod/3dlineseq
```

### 2. 데이터베이스 업데이트

```bash
# Moodle 관리자 페이지 접속
# 알림 페이지에서 "데이터베이스 업그레이드" 실행
```

또는 CLI 사용:
```bash
cd /path/to/moodle
php admin/cli/upgrade.php
```

### 3. Three.js 라이브러리 다운로드

```bash
# webapp/lib 디렉토리에 Three.js 다운로드
cd webapp/lib
wget https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

# 또는 CDN 사용 (index.html에서 이미 설정됨)
```

### 4. 웹앱 파일 복사 (선택사항)

독립형 웹앱으로 사용하려면:
```bash
# 웹 서버 문서 루트에 복사
cp -r webapp /var/www/html/3dlineseq

# 권한 설정
chown -R www-data:www-data /var/www/html/3dlineseq
chmod -R 755 /var/www/html/3dlineseq
```

### 5. 플러그인 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** > **플러그인** > **활동 모듈**
3. **3D Line Seq** 활성화 확인

---

## 📖 사용 방법

### 교사용

#### 1. 활동 추가

1. 코스 편집 모드 활성화
2. 원하는 섹션에서 **활동 또는 리소스 추가**
3. **3D Line Seq** 선택
4. 활동 설정:
   - **이름**: 활동 이름 입력
   - **설명**: 활동 설명 입력
   - **수열 유형**: 등차수열, 등비수열, 피보나치, 사용자 정의 중 선택
   - **수열 데이터**: 쉼표로 구분된 숫자 입력 (예: `1, 2, 3, 5, 8, 13`)
   - **시각화 스타일**: Line, Curve, Spiral, Bars 중 선택

#### 2. 예제 설정

**피보나치 수열**
```
이름: 피보나치 수열 탐구
수열 유형: Fibonacci
수열 데이터: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55
시각화 스타일: Spiral
```

**등차수열**
```
이름: 등차수열 학습
수열 유형: Arithmetic
수열 데이터: 2, 4, 6, 8, 10, 12, 14, 16
시각화 스타일: Bars
```

### 학생용

#### 1. 활동 보기

1. 코스 페이지에서 3D Line Seq 활동 클릭
2. 우측 하단 스마트폰 화면에서 3D 시각화 확인
3. 인터랙티브 컨트롤 사용:
   - **🔄 뷰 초기화**: 카메라 위치 초기화
   - **🔁 자동 회전**: 자동 회전 시작/중지
   - **🎨 스타일 변경**: 시각화 스타일 전환
   - **➕ 확대 / ➖ 축소**: 줌 인/아웃

#### 2. 상호작용

- **마우스 드래그**: 3D 뷰 회전
- **마우스 휠**: 확대/축소
- **터치 드래그** (모바일): 회전
- **핀치 줌** (모바일): 확대/축소

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── moodle-plugin/
│   └── 3dlineseq/                    # Moodle 플러그인
│       ├── version.php               # 플러그인 버전 정보
│       ├── lib.php                   # 핵심 함수
│       ├── mod_form.php              # 활동 설정 폼
│       ├── view.php                  # 메인 뷰
│       ├── index.php                 # 코스 인덱스
│       ├── api.php                   # REST API 엔드포인트
│       ├── externallib.php           # 웹 서비스 구현
│       ├── db/
│       │   ├── install.xml           # 데이터베이스 스키마
│       │   ├── access.php            # 권한 정의
│       │   └── services.php          # 웹 서비스 정의
│       ├── lang/
│       │   ├── en/
│       │   │   └── 3dlineseq.php     # 영어 언어 파일
│       │   └── ko/
│       │       └── 3dlineseq.php     # 한국어 언어 파일
│       └── classes/
│           └── event/                # 이벤트 클래스
│               ├── course_module_viewed.php
│               └── course_module_instance_list_viewed.php
│
├── webapp/                           # 독립형 웹앱
│   ├── index.html                    # 메인 HTML
│   ├── css/
│   │   └── style.css                 # 스타일시트
│   ├── js/
│   │   ├── 3dlineseq.js              # 3D 시각화 로직
│   │   └── moodle-api.js             # Moodle API 통신
│   └── lib/
│       └── three.min.js              # Three.js 라이브러리 (다운로드 필요)
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # 프로젝트 요구사항 문서
│
└── README.md                         # 이 파일
```

---

## 🛠 기술 스택

### 백엔드
- **PHP** 7.1.9+
- **MySQL** 5.7+
- **Moodle** 3.7+

### 프론트엔드
- **HTML5**
- **CSS3** (Flexbox, Grid, Animations)
- **JavaScript** (ES6+)
- **Three.js** r128+ (3D 렌더링)

### 아키텍처
```
┌─────────────────┐
│  Moodle LMS     │
│  (PHP + MySQL)  │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│  3D Line Seq    │
│  Plugin         │
└────────┬────────┘
         │
         │ Web Services
         │
┌────────▼────────┐       ┌──────────────┐
│  Webapp         │◄──────┤  Three.js    │
│  (HTML/CSS/JS)  │       │  (3D Engine) │
└─────────────────┘       └──────────────┘
```

---

## 👨‍💻 개발자 가이드

### API 엔드포인트

#### 1. Get Sequence Data
```javascript
POST /mod/3dlineseq/api.php
Content-Type: application/json

{
  "action": "get_sequence",
  "id": 123
}

// Response
{
  "id": 123,
  "name": "피보나치 수열",
  "type": "fibonacci",
  "style": "spiral",
  "values": [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
}
```

#### 2. Submit Attempt
```javascript
POST /mod/3dlineseq/api.php
Content-Type: application/json

{
  "action": "submit_attempt",
  "id": 123,
  "answer": {"next_value": 89},
  "score": 100
}

// Response
{
  "success": true,
  "attemptid": 456
}
```

#### 3. Get User Attempts
```javascript
POST /mod/3dlineseq/api.php
Content-Type: application/json

{
  "action": "get_attempts",
  "id": 123
}

// Response
[
  {
    "id": 456,
    "attempt": 1,
    "answer": {"next_value": 89},
    "score": 100,
    "completed": 1,
    "timecreated": 1700000000
  }
]
```

### 새로운 시각화 스타일 추가

`webapp/js/3dlineseq.js`에서:

```javascript
function createCustomVisualization(values) {
    values.forEach((value, index) => {
        // 커스텀 3D 오브젝트 생성
        const geometry = new THREE.BoxGeometry(1, value, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        const mesh = new THREE.Mesh(geometry, material);

        // 위치 설정
        mesh.position.set(index * 2, 0, 0);

        sequenceMesh.add(mesh);
    });
}
```

### 데이터베이스 스키마

#### `mdl_3dlineseq` 테이블
```sql
CREATE TABLE mdl_3dlineseq (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    course BIGINT(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    intro TEXT NOT NULL,
    introformat INT(4) DEFAULT 0,
    sequencedata TEXT,
    sequencetype VARCHAR(50) DEFAULT 'arithmetic',
    visualstyle VARCHAR(50) DEFAULT 'line',
    timecreated BIGINT(10) DEFAULT 0,
    timemodified BIGINT(10) DEFAULT 0
);
```

#### `mdl_3dlineseq_attempts` 테이블
```sql
CREATE TABLE mdl_3dlineseq_attempts (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    3dlineseqid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    attempt INT(6) DEFAULT 1,
    answer TEXT,
    score DECIMAL(10,5),
    completed INT(1) DEFAULT 0,
    timecreated BIGINT(10) DEFAULT 0,
    timemodified BIGINT(10) DEFAULT 0
);
```

---

## 🐛 문제 해결

### Three.js가 로드되지 않음
```bash
# 직접 다운로드
cd webapp/lib
wget https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
```

### 스마트폰 화면이 표시되지 않음
- 브라우저에서 WebGL이 활성화되어 있는지 확인
- 브라우저 콘솔에서 JavaScript 오류 확인

### 데이터베이스 오류
```bash
# Moodle CLI로 데이터베이스 재설치
php admin/cli/uninstall_plugins.php --plugins=mod_3dlineseq --run
php admin/cli/upgrade.php
```

---

## 📄 라이선스

이 프로젝트는 GNU General Public License v3.0을 따릅니다.

---

## 👥 기여자

- **KAIST Touch Math Academy** - 초기 개발

---

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문서**: [Moodle Docs](https://docs.moodle.org)
- **Three.js 문서**: [Three.js Documentation](https://threejs.org/docs/)

---

## 🗺 로드맵

- [ ] VR 지원 (WebXR)
- [ ] 더 많은 수열 유형
- [ ] 애니메이션 효과
- [ ] 학생 퀴즈 기능
- [ ] 실시간 협업 모드

---

**Made with ❤️ for Mathematics Education**
