# 3D Cross-Section Viewer with Glow Effect

LMS(Moodle 3.7)와 연동하여 3D 모델의 단면을 빛나는 효과와 함께 표시하는 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 3D 뷰어가 표시됩니다.

## 주요 기능

### 1. Cross-Section Glow 효과
- **단면 절단**: 3D 모델을 평면으로 절단하여 내부 구조를 확인
- **Glow 효과**: 절단면이 네온처럼 빛나는 시각적 효과
- **실시간 조절**: 위치, 각도, 빛의 강도와 색상을 실시간으로 조절 가능

### 2. 스마트폰 시뮬레이터
- 실제 스마트폰 화면과 유사한 UI
- 375x812px (iPhone X 스타일) 프레임
- 우측 하단에 배치된 가상 디바이스

### 3. Moodle LMS 연동
- Moodle 3.7 Web Services API 지원
- 퀴즈 문제에서 3D 모델 정보 자동 로드
- PHP 7.1.9, MySQL 5.7 환경 호환

### 4. 3D 뷰어 기능
- **지원 모델**: Cube, Sphere, Torus, Torus Knot
- **인터랙티브 컨트롤**: 마우스로 회전, 줌, 팬 가능
- **다양한 셰이더 효과**: 기본, 단순, 애니메이션 Glow 효과

## 기술 스택

- **3D 렌더링**: Three.js r152
- **언어**: HTML5, CSS3, JavaScript (ES6+)
- **LMS**: Moodle 3.7 Web Services API
- **셰이더**: GLSL (Custom Vertex/Fragment Shaders)

## 파일 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트 (스마트폰 UI 포함)
├── js/
│   ├── main.js            # 메인 애플리케이션 로직
│   ├── viewer3d.js        # 3D 뷰어 클래스
│   ├── shaders.js         # Cross-Section Glow 셰이더
│   └── moodleAPI.js       # Moodle LMS 연동 API
└── README.md              # 이 파일
```

## 설치 및 실행

### 1. 로컬 환경에서 실행

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 웹 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js
npx serve

# 브라우저에서 열기
open http://localhost:8000
```

### 2. Moodle 서버 연동 (선택)

#### Moodle 설정
1. Moodle 관리자 패널 접속
2. **Site administration > Plugins > Web services > Manage protocols**
   - REST protocol 활성화
3. **Site administration > Plugins > Web services > External services**
   - 새 서비스 생성 및 필요한 함수 추가:
     - `core_webservice_get_site_info`
     - `mod_quiz_get_quiz_by_instance`
     - `mod_quiz_process_attempt`
4. **사용자에게 Web Service Token 발급**

#### 애플리케이션 설정
```javascript
// js/main.js에서 Moodle 연동 활성화
// "Load from Moodle" 버튼 클릭 시 URL과 Token 입력
```

## 사용 방법

### 기본 조작

1. **모델 선택**: 좌측 패널에서 3D 모델 선택 (Cube, Sphere, Torus, Knot)
2. **Cross-Section 조절**:
   - Position: 절단 평면의 위치 (-5 ~ 5)
   - Rotation X/Y: 절단 평면의 각도 (0° ~ 360°)
   - Enable Cross-Section: 체크박스로 on/off
3. **Glow 효과 조절**:
   - Intensity: 빛의 강도 (0 ~ 5)
   - Color: 빛의 색상 (컬러 피커)
   - Thickness: 빛나는 영역의 두께 (0.01 ~ 0.5)
4. **뷰 조작**:
   - 마우스 왼쪽 버튼: 회전
   - 마우스 휠: 줌
   - 마우스 오른쪽 버튼: 팬

### 키보드 단축키

- `R`: 뷰 리셋
- `C`: Cross-Section on/off 토글
- `1`: Cube 모델
- `2`: Sphere 모델
- `3`: Torus 모델
- `4`: Torus Knot 모델

### Moodle 연동

1. **"Load from Moodle" 버튼 클릭**
2. **데모 모드**: URL 파라미터로 퀴즈 선택
   ```
   http://localhost:8000?quizId=quiz1
   http://localhost:8000?quizId=quiz2
   http://localhost:8000?quizId=quiz3
   ```
3. **실제 연동**: js/main.js의 주석 처리된 코드 활성화

## Cross-Section Glow 구현 상세

### 셰이더 원리

#### Vertex Shader
```glsl
// 정점의 월드 위치와 노멀 벡터를 Fragment Shader로 전달
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

#### Fragment Shader
```glsl
// 클리핑 평면과의 거리 계산
float distance = dot(vWorldPosition, clipPlaneNormal) + clipPlaneConstant;

// 뒤쪽 픽셀 버림
if (distance < 0.0) discard;

// Glow 효과 계산 (거리가 가까울수록 밝게)
float glowFactor = smoothstep(glowThickness, 0.0, distance);
vec3 glow = glowColor * glowIntensity * glowFactor;

// 최종 색상
finalColor = mix(baseColor, glowColor, glowFactor * 0.8) + glow;
```

### 3가지 Glow 모드

1. **기본 모드** (`fragmentShader`):
   - 펄스 효과 포함
   - 단면에서 부드럽게 빛남

2. **단순 모드** (`simpleGlowFragmentShader`):
   - 단면 가장자리만 빛남
   - 성능 최적화

3. **애니메이션 모드** (`animatedGlowFragmentShader`):
   - 시간에 따라 변하는 효과
   - 파동 효과 포함

## Moodle 퀴즈 데이터 형식

Moodle 퀴즈의 커스텀 데이터 필드에 JSON 형식으로 저장:

```json
{
  "modelType": "sphere",
  "clipPosition": 0.5,
  "clipRotationX": 45,
  "clipRotationY": 0,
  "glowColor": "#00ffff",
  "glowIntensity": 2.5,
  "glowThickness": 0.15
}
```

## 브라우저 요구사항

- **Chrome** 90+ (권장)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

WebGL 2.0 지원 필요

## 개발 가이드

### 새로운 3D 모델 추가

```javascript
// js/viewer3d.js의 loadModel() 메서드에 추가
case 'newModel':
    geometry = new THREE.YourGeometry(...);
    break;
```

### 셰이더 커스터마이징

```javascript
// js/shaders.js에서 새로운 셰이더 정의
const MyCustomShader = {
    vertexShader: `...`,
    fragmentShader: `...`
};
```

### Moodle API 함수 추가

```javascript
// js/moodleAPI.js의 MoodleAPI 클래스에 메서드 추가
async getCustomData(params) {
    return await this.callWebService('your_function', params);
}
```

## 성능 최적화

- **지오메트리 세그먼트 수 조절**: 복잡한 모델은 세그먼트 수를 줄여 성능 향상
- **셰이더 단순화**: 필요에 따라 `simpleGlowFragmentShader` 사용
- **애니메이션 비활성화**: `useAnimation: false` 옵션

## 문제 해결

### 3D 뷰어가 표시되지 않는 경우
- 브라우저 콘솔에서 에러 확인
- WebGL 지원 확인: https://get.webgl.org/
- CORS 문제: 로컬 웹 서버 사용

### Glow 효과가 작동하지 않는 경우
- `enableCrossSection` 체크박스 확인
- `glowIntensity` 값 증가
- `glowThickness` 값 조절

### Moodle 연결 실패
- Moodle URL이 올바른지 확인
- Web Service Token이 유효한지 확인
- CORS 설정 확인 (Moodle 서버)

## 라이선스

MIT License

## 기여

버그 리포트, 기능 제안, PR 환영합니다!

## 연락처

문의사항은 이슈를 통해 남겨주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
