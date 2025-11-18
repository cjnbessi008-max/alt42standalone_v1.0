# 🎯 Overlap Sync Animation

LMS 연동 도형 겹침 애니메이션 학습 시스템

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6.svg)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [LMS 연동](#lms-연동)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)

---

## 개요

**Overlap Sync Animation**은 Moodle 3.7+ LMS와 연동하여 도형 겹침 학습을 지원하는 인터랙티브 웹 애플리케이션입니다.

우측 하단의 가상 스마트폰 화면에 두 개 이상의 도형이 서서히 겹쳐지는 애니메이션을 표시하여, 학생들이 집합, 분수, 도형 등의 수학 개념을 시각적으로 학습할 수 있도록 돕습니다.

### 🎓 교육 목표

- 집합의 교집합 개념 이해
- 분수의 비교 및 연산 학습
- 도형의 겹침과 넓이 개념 습득
- 시각적 사고력 향상

---

## 주요 기능

### ✨ 핵심 기능

1. **도형 겹침 애니메이션**
   - 원(Circle), 사각형(Square), 삼각형(Triangle) 지원
   - 부드러운 이동 애니메이션 (Framer Motion)
   - 실시간 진행률 및 겹침 비율 표시

2. **가상 스마트폰 시뮬레이션**
   - 실제 스마트폰과 유사한 UI/UX
   - 우측 하단 고정 위치 표시
   - 반응형 디자인 지원

3. **LMS 연동**
   - Moodle 3.7+ 통합
   - PHP 7.1.9 + MySQL 5.7 백엔드 지원
   - 자동 진도 저장 및 관리

4. **다양한 난이도**
   - 쉬움: 기본 도형 2개
   - 보통: 복잡한 도형 2개
   - 어려움: 다중 도형 3개 이상

5. **애니메이션 제어**
   - 재생/일시정지/정지 기능
   - 리셋 및 반복 재생
   - 진행률 추적

---

## 기술 스택

### Frontend

- **React** 18.2 - UI 라이브러리
- **TypeScript** 5.2 - 타입 안정성
- **Vite** 5.0 - 빌드 도구
- **Framer Motion** 10.16 - 애니메이션 라이브러리
- **Zustand** 4.4 - 상태 관리
- **Axios** 1.6 - HTTP 클라이언트

### Backend Integration

- **Moodle** 3.7+
- **PHP** 7.1.9
- **MySQL** 5.7

### Development Tools

- ESLint - 코드 품질 관리
- TypeScript Compiler - 타입 체크

---

## 설치 방법

### 1. 사전 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Git

### 2. 저장소 클론

```bash
git clone https://github.com/your-repo/overlap-sync-animation.git
cd overlap-sync-animation
```

### 3. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 4. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 LMS API 정보를 입력합니다:

```env
VITE_LMS_API_URL=http://your-lms-server.com/api
VITE_MOODLE_URL=https://your-moodle-instance.com
VITE_MOODLE_TOKEN=your_moodle_token_here
VITE_USE_MOCK_DATA=false  # 실제 LMS 사용시 false로 설정
```

### 5. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 `http://localhost:3000` 접속

### 6. 프로덕션 빌드

```bash
npm run build
# 또는
yarn build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 사용 방법

### 기본 사용법

1. **문제 선택**: 왼쪽 패널에서 학습할 문제를 선택합니다.
2. **애니메이션 시작**: 우측 하단 스마트폰 화면의 재생 버튼(▶️)을 클릭합니다.
3. **진행 확인**: 애니메이션이 진행되면서 도형이 서서히 겹쳐집니다.
4. **완료**: 애니메이션이 끝나면 자동으로 진도가 LMS에 저장됩니다.

### 애니메이션 제어

- **▶️ 재생**: 애니메이션 시작/재개
- **⏸️ 일시정지**: 애니메이션 일시 중단
- **⏹️ 정지**: 애니메이션 완전 정지
- **🔄 리셋**: 처음부터 다시 시작

### 문제 네비게이션

- **이전/다음 버튼**: 문제 순차 이동
- **문제 리스트**: 원하는 문제 직접 선택

---

## LMS 연동

### Moodle 3.7+ 연동 가이드

#### 1. Moodle 플러그인 설치

```bash
# Moodle 플러그인 디렉토리로 이동
cd /path/to/moodle/mod/

# 플러그인 복사 (별도 제공)
cp -r overlap_sync_plugin ./overlap_sync
```

#### 2. 데이터베이스 설정

MySQL 5.7 데이터베이스에 다음 테이블을 생성합니다:

```sql
CREATE TABLE `mdl_overlap_sync_problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `shapes` JSON NOT NULL,
  `duration` INT NOT NULL,
  `target_overlap` DECIMAL(3,2) NOT NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL,
  `instruction` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `mdl_overlap_sync_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `problem_id` INT NOT NULL,
  `attempts` INT DEFAULT 0,
  `completed` BOOLEAN DEFAULT FALSE,
  `score` INT,
  `started_at` TIMESTAMP NOT NULL,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `mdl_user`(`id`),
  FOREIGN KEY (`problem_id`) REFERENCES `mdl_overlap_sync_problems`(`id`),
  INDEX `idx_user_problem` (`user_id`, `problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3. PHP API 엔드포인트 (예시)

`/api/problems/:id` 엔드포인트를 구현합니다:

```php
<?php
// api/problems.php
require_once('../config.php');

header('Content-Type: application/json');

$problem_id = required_param('id', PARAM_INT);

$problem = $DB->get_record('overlap_sync_problems', ['id' => $problem_id]);

if (!$problem) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'NOT_FOUND',
            'message' => 'Problem not found'
        ]
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'data' => [
        'id' => $problem->id,
        'title' => $problem->title,
        'type' => $problem->type,
        'shapes' => json_decode($problem->shapes),
        'duration' => (int)$problem->duration,
        'targetOverlap' => (float)$problem->target_overlap,
        'difficulty' => $problem->difficulty,
        'instruction' => $problem->instruction
    ],
    'timestamp' => time()
]);
```

#### 4. 인증 토큰 발급

Moodle 관리자 페이지에서 웹 서비스 토큰을 생성하고 `.env` 파일에 설정합니다.

---

## 프로젝트 구조

```
overlap-sync-animation/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── SmartphoneFrame.tsx    # 가상 스마트폰 프레임
│   │   ├── SmartphoneFrame.css
│   │   ├── OverlapSync.tsx        # 메인 애니메이션 컴포넌트
│   │   ├── OverlapSync.css
│   │   ├── AnimationControls.tsx  # 재생 컨트롤
│   │   └── AnimationControls.css
│   ├── services/             # API 서비스
│   │   └── lmsApi.ts              # LMS API 클라이언트
│   ├── store/                # 상태 관리
│   │   └── animationStore.ts      # Zustand 스토어
│   ├── types/                # TypeScript 타입 정의
│   │   └── index.ts
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx              # 엔트리 포인트
│   └── index.css
├── public/                   # 정적 파일
├── tasks/                    # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
├── .env.example              # 환경 변수 예제
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 개발 가이드

### 새로운 문제 추가하기

`src/services/lmsApi.ts` 파일의 `mockProblems` 배열에 새로운 문제를 추가합니다:

```typescript
{
  id: 'overlap-004',
  title: '새로운 문제',
  type: 'overlap-sync',
  duration: 4000,
  targetOverlap: 0.6,
  difficulty: 'medium',
  instruction: '설명 텍스트',
  shapes: [
    {
      id: 'shape-1',
      type: 'circle',
      color: '#FF6B6B',
      size: 100,
      startPosition: { x: 20, y: 50 },
      endPosition: { x: 50, y: 50 },
      opacity: 0.7,
      label: 'A'
    },
    // 추가 도형...
  ]
}
```

### 새로운 도형 타입 추가하기

1. `src/types/index.ts`에서 타입 정의 확장:

```typescript
export type ShapeType = 'circle' | 'square' | 'triangle' | 'rectangle' | 'pentagon';
```

2. `src/components/OverlapSync.css`에 스타일 추가:

```css
.shape-pentagon {
  /* 펜타곤 스타일 */
}
```

### 커스텀 애니메이션 곡선

Framer Motion의 `easing` 함수를 사용하여 커스텀 애니메이션을 적용할 수 있습니다:

```typescript
transition={{
  duration: 0.5,
  ease: [0.43, 0.13, 0.23, 0.96] // 커스텀 cubic-bezier
}}
```

---

## API 문서

### 문제 정보 가져오기

**GET** `/api/problems/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "overlap-001",
    "title": "원 겹치기 - 기초",
    "type": "overlap-sync",
    "duration": 3000,
    "targetOverlap": 0.5,
    "difficulty": "easy",
    "instruction": "두 원이 50% 겹칠 때까지 기다려주세요.",
    "shapes": [
      {
        "id": "shape-1",
        "type": "circle",
        "color": "#FF6B6B",
        "size": 100,
        "startPosition": { "x": 20, "y": 50 },
        "endPosition": { "x": 45, "y": 50 },
        "opacity": 0.7,
        "label": "A"
      }
    ]
  },
  "timestamp": 1234567890
}
```

### 진행 상태 저장

**POST** `/api/progress`

**Request Body:**

```json
{
  "userId": "user-123",
  "problemId": "overlap-001",
  "attempts": 1,
  "completed": true,
  "score": 100,
  "startedAt": 1234567890,
  "completedAt": 1234567990
}
```

**Response:**

```json
{
  "success": true,
  "timestamp": 1234567890
}
```

---

## 문제 해결

### 일반적인 문제

#### 1. 애니메이션이 작동하지 않음

**원인**: Framer Motion 설치 누락

**해결**:
```bash
npm install framer-motion
```

#### 2. LMS API 연결 실패

**원인**: 환경 변수 미설정 또는 CORS 문제

**해결**:
- `.env` 파일에서 `VITE_LMS_API_URL` 확인
- 백엔드 서버에 CORS 설정 추가:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

#### 3. 스마트폰 화면이 표시되지 않음

**원인**: CSS 충돌 또는 z-index 문제

**해결**:
- 브라우저 콘솔에서 에러 확인
- `SmartphoneFrame.css`의 `z-index` 값 조정

#### 4. TypeScript 타입 에러

**원인**: 타입 정의 불일치

**해결**:
```bash
npm run build  # 타입 체크 실행
```

### 디버깅 팁

1. **개발자 도구 콘솔 확인**: 브라우저 F12 → Console 탭
2. **React DevTools 사용**: React 컴포넌트 상태 확인
3. **Network 탭**: API 호출 상태 확인
4. **Mock 데이터 사용**: `.env`에서 `VITE_USE_MOCK_DATA=true` 설정

---

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

---

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 문의

프로젝트 관련 문의: [your-email@example.com](mailto:your-email@example.com)

프로젝트 링크: [https://github.com/your-repo/overlap-sync-animation](https://github.com/your-repo/overlap-sync-animation)

---

## 업데이트 로그

### v1.0.0 (2025-01-18)

- ✨ 초기 릴리스
- 🎨 가상 스마트폰 프레임 구현
- 🎯 Overlap Sync 애니메이션 기능
- 🔗 Moodle 3.7+ LMS 연동
- 📱 반응형 디자인 지원
- 🎮 애니메이션 컨트롤 패널

---

**Made with ❤️ for better education**
