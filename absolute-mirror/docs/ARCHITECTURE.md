# Absolute Mirror - Enhanced Architecture (권장 구조)

## 개요 (Overview)

이 문서는 Absolute Mirror 애플리케이션의 권장 아키텍처를 설명합니다.
전문적인 소프트웨어 엔지니어링 패턴과 최신 웹 기술을 적용한 구조입니다.

---

## 아키텍처 원칙 (Architecture Principles)

### 1. **관심사의 분리 (Separation of Concerns)**
- Model-View-Controller (MVC) 패턴
- 비즈니스 로직과 UI 로직 분리
- 데이터 레이어와 프레젠테이션 레이어 분리

### 2. **모듈화 (Modularity)**
- ES6 모듈 시스템
- 독립적이고 재사용 가능한 컴포넌트
- 의존성 주입 (Dependency Injection)

### 3. **확장성 (Scalability)**
- 플러그인 아키텍처
- 이벤트 기반 통신
- 수평적 확장 가능

### 4. **성능 최적화 (Performance)**
- WebGL 기반 렌더링
- 코드 분할 (Code Splitting)
- 지연 로딩 (Lazy Loading)
- 서비스 워커 캐싱

### 5. **접근성 (Accessibility)**
- WCAG 2.1 AA 준수
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드

---

## 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         프론트엔드 레이어                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    프레젠테이션 레이어                        │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │    Views   │  │ Components │  │  Templates │         │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │  │
│  └─────────┼────────────────┼────────────────┼──────────────┘  │
│            │                │                │                  │
│  ┌─────────▼────────────────▼────────────────▼──────────────┐  │
│  │                    컨트롤러 레이어                           │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Router   │  │ Controller │  │  Mediator  │         │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │  │
│  └─────────┼────────────────┼────────────────┼──────────────┘  │
│            │                │                │                  │
│  ┌─────────▼────────────────▼────────────────▼──────────────┐  │
│  │                      서비스 레이어                           │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ API Service│  │  Viz Engine│  │  Analytics │         │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │  │
│  └─────────┼────────────────┼────────────────┼──────────────┘  │
│            │                │                │                  │
│  ┌─────────▼────────────────▼────────────────▼──────────────┐  │
│  │                      모델 레이어                             │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Problem  │  │    User    │  │  Progress  │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          백엔드 레이어                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API Gateway                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Auth     │  │Rate Limiter│  │  Validator │         │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │  │
│  └─────────┼────────────────┼────────────────┼──────────────┘  │
│            │                │                │                  │
│  ┌─────────▼────────────────▼────────────────▼──────────────┐  │
│  │                   비즈니스 로직 레이어                        │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │  Problem   │  │  Progress  │  │   Moodle   │         │  │
│  │  │  Service   │  │  Service   │  │   Sync     │         │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │  │
│  └─────────┼────────────────┼────────────────┼──────────────┘  │
│            │                │                │                  │
│  ┌─────────▼────────────────▼────────────────▼──────────────┐  │
│  │                      데이터 레이어                           │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │  MySQL DB  │  │   Redis    │  │  Moodle DB │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 프론트엔드 아키텍처 (Frontend Architecture)

### 디렉토리 구조 (Directory Structure)

```
src/
├── core/                      # 핵심 프레임워크
│   ├── Application.js         # 메인 애플리케이션 클래스
│   ├── EventBus.js           # 이벤트 버스
│   ├── ServiceContainer.js   # DI 컨테이너
│   └── Router.js             # 라우터
│
├── models/                    # 데이터 모델
│   ├── Problem.js
│   ├── User.js
│   ├── Attempt.js
│   └── Progress.js
│
├── services/                  # 비즈니스 로직
│   ├── APIService.js         # API 통신
│   ├── VisualizationEngine.js# 시각화 엔진
│   ├── MoodleService.js      # Moodle 연동
│   ├── AnalyticsService.js   # 분석
│   └── CacheService.js       # 캐싱
│
├── controllers/               # 컨트롤러
│   ├── ProblemController.js
│   ├── ProgressController.js
│   └── VisualizationController.js
│
├── views/                     # 뷰 컴포넌트
│   ├── components/
│   │   ├── SmartphoneFrame.js
│   │   ├── ControlPanel.js
│   │   ├── MirrorCanvas.js
│   │   └── ProgressDashboard.js
│   └── pages/
│       ├── HomePage.js
│       ├── ProblemPage.js
│       └── StatisticsPage.js
│
├── utils/                     # 유틸리티
│   ├── math.js               # 수학 함수
│   ├── validation.js         # 유효성 검사
│   ├── formatting.js         # 포맷팅
│   └── logger.js             # 로깅
│
├── config/                    # 설정
│   ├── app.config.js
│   ├── api.config.js
│   └── visualization.config.js
│
└── assets/                    # 정적 자산
    ├── styles/
    ├── images/
    └── fonts/
```

---

## 핵심 컴포넌트 (Core Components)

### 1. Application (메인 앱)

```javascript
class Application {
    constructor(config) {
        this.container = new ServiceContainer();
        this.eventBus = new EventBus();
        this.router = new Router();
        this.init(config);
    }

    init(config) {
        // 서비스 등록
        this.registerServices();

        // 라우트 설정
        this.setupRoutes();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 앱 시작
        this.boot();
    }

    registerServices() {
        this.container.register('api', APIService);
        this.container.register('visualization', VisualizationEngine);
        this.container.register('moodle', MoodleService);
        this.container.register('analytics', AnalyticsService);
    }
}
```

### 2. Service Container (의존성 주입)

```javascript
class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
    }

    register(name, serviceClass, singleton = true) {
        this.services.set(name, { serviceClass, singleton });
    }

    resolve(name) {
        const service = this.services.get(name);

        if (service.singleton) {
            if (!this.instances.has(name)) {
                this.instances.set(name, new service.serviceClass());
            }
            return this.instances.get(name);
        }

        return new service.serviceClass();
    }
}
```

### 3. Event Bus (이벤트 기반 통신)

```javascript
class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}
```

---

## 시각화 엔진 (Visualization Engine)

### WebGL 기반 렌더링

```javascript
class VisualizationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        this.shaders = new Map();
        this.buffers = new Map();
        this.textures = new Map();

        this.init();
    }

    init() {
        // WebGL 초기화
        this.initWebGL();

        // 셰이더 컴파일
        this.compileShaders();

        // 버퍼 생성
        this.createBuffers();
    }

    render(equation) {
        // 고성능 3D 렌더링
        this.clear();
        this.drawMirrorTunnel(equation);
        this.drawEquationGraph(equation);
        this.drawSolutions(equation);
    }

    // 버텍스 셰이더
    getVertexShaderSource() {
        return `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;

            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying vec2 vTexCoord;

            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix *
                              uModelMatrix * vec4(aPosition, 1.0);
                vTexCoord = aTexCoord;
            }
        `;
    }

    // 프래그먼트 셰이더
    getFragmentShaderSource() {
        return `
            precision mediump float;

            varying vec2 vTexCoord;

            uniform vec3 uColor;
            uniform float uAlpha;
            uniform float uTime;

            void main() {
                // 미러 터널 효과
                float tunnel = sin(vTexCoord.x * 10.0 + uTime) *
                               cos(vTexCoord.y * 10.0 + uTime);

                vec3 finalColor = uColor * (1.0 + tunnel * 0.2);
                gl_FragColor = vec4(finalColor, uAlpha);
            }
        `;
    }
}
```

---

## Progressive Web App (PWA)

### Service Worker

```javascript
// sw.js
const CACHE_NAME = 'absolute-mirror-v1';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/js/visualization.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에 있으면 반환, 없으면 네트워크 요청
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});
```

### Web App Manifest

```json
{
    "name": "Absolute Mirror",
    "short_name": "AbsMirror",
    "description": "절댓값 방정식 시각화 앱",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#764ba2",
    "orientation": "portrait",
    "icons": [
        {
            "src": "/assets/icons/icon-72.png",
            "sizes": "72x72",
            "type": "image/png"
        },
        {
            "src": "/assets/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/assets/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

---

## 상태 관리 (State Management)

### Store Pattern

```javascript
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            this.listeners.splice(index, 1);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// 사용 예시
const store = new Store({
    currentProblem: null,
    userProgress: null,
    visualizationState: {
        xValue: 0,
        animationSpeed: 5
    }
});

store.subscribe(state => {
    console.log('State changed:', state);
});
```

---

## 성능 최적화 (Performance Optimization)

### 1. 코드 분할 (Code Splitting)

```javascript
// 동적 임포트
const loadVisualizationModule = async () => {
    const module = await import('./modules/visualization.js');
    return module.default;
};

// 사용 시에만 로드
document.getElementById('startVisualization').addEventListener('click', async () => {
    const VisualizationEngine = await loadVisualizationModule();
    const engine = new VisualizationEngine(canvas);
    engine.start();
});
```

### 2. 가상 스크롤링 (Virtual Scrolling)

```javascript
class VirtualScroller {
    constructor(container, items, itemHeight) {
        this.container = container;
        this.items = items;
        this.itemHeight = itemHeight;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight);

        this.init();
    }

    init() {
        this.container.addEventListener('scroll', () => {
            this.render();
        });
        this.render();
    }

    render() {
        const scrollTop = this.container.scrollTop;
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = startIndex + this.visibleItems;

        // 보이는 아이템만 렌더링
        const visibleItems = this.items.slice(startIndex, endIndex);
        this.renderItems(visibleItems, startIndex);
    }
}
```

### 3. 메모이제이션 (Memoization)

```javascript
function memoize(fn) {
    const cache = new Map();

    return function(...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    };
}

// 사용 예시
const calculateSolutions = memoize((axis, target) => {
    return [axis - target, axis + target];
});
```

---

## 테스트 전략 (Testing Strategy)

### 1. 단위 테스트 (Unit Tests)

```javascript
// tests/unit/Problem.test.js
import { Problem } from '../../src/models/Problem.js';

describe('Problem Model', () => {
    test('should parse equation correctly', () => {
        const problem = new Problem({
            equation: '|x - 3| = 5'
        });

        expect(problem.axis).toBe(3);
        expect(problem.target).toBe(5);
    });

    test('should calculate solutions correctly', () => {
        const problem = new Problem({
            equation: '|x - 3| = 5'
        });

        const solutions = problem.getSolutions();
        expect(solutions).toEqual([-2, 8]);
    });
});
```

### 2. 통합 테스트 (Integration Tests)

```javascript
// tests/integration/api.test.js
import { APIService } from '../../src/services/APIService.js';

describe('API Service Integration', () => {
    let apiService;

    beforeEach(() => {
        apiService = new APIService();
    });

    test('should fetch problems from API', async () => {
        const problems = await apiService.getProblems();

        expect(problems).toBeInstanceOf(Array);
        expect(problems.length).toBeGreaterThan(0);
    });

    test('should submit answer successfully', async () => {
        const result = await apiService.submitAnswer(1, [8, -2]);

        expect(result.success).toBe(true);
        expect(result.is_correct).toBe(true);
    });
});
```

### 3. E2E 테스트 (End-to-End Tests)

```javascript
// tests/e2e/problem-solving.test.js
import { test, expect } from '@playwright/test';

test('complete problem solving flow', async ({ page }) => {
    // 페이지 로드
    await page.goto('http://localhost:8080');

    // 문제 로드 버튼 클릭
    await page.click('#loadProblem');

    // 문제가 표시될 때까지 대기
    await page.waitForSelector('#equationText');

    // x 값 슬라이더 조작
    await page.fill('#xValue', '8');

    // 해설 보기
    await page.click('#showSolution');

    // 해설이 표시되는지 확인
    const solutionVisible = await page.isVisible('#solutionPanel');
    expect(solutionVisible).toBe(true);
});
```

---

## 보안 (Security)

### 1. XSS 방지

```javascript
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
```

### 2. CSRF 토큰

```javascript
class CSRFProtection {
    constructor() {
        this.token = this.generateToken();
    }

    generateToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    getToken() {
        return this.token;
    }

    validateToken(token) {
        return token === this.token;
    }
}
```

### 3. Rate Limiting (클라이언트측)

```javascript
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    async checkLimit() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);

        if (this.requests.length >= this.maxRequests) {
            throw new Error('Rate limit exceeded');
        }

        this.requests.push(now);
        return true;
    }
}
```

---

## 접근성 (Accessibility)

### ARIA 속성

```html
<div role="application" aria-label="Absolute Mirror Visualization">
    <canvas
        id="mirrorCanvas"
        role="img"
        aria-label="Mirror tunnel visualization of absolute value equation"
        tabindex="0">
    </canvas>

    <div role="region" aria-label="Problem controls">
        <button
            aria-label="Load new problem"
            aria-describedby="problem-hint">
            새 문제 불러오기
        </button>

        <div id="problem-hint" class="sr-only">
            Click to load a new absolute value equation problem
        </div>
    </div>
</div>
```

### 키보드 네비게이션

```javascript
class KeyboardNavigationController {
    constructor() {
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in input
            if (e.target.tagName === 'INPUT') return;

            switch(e.key) {
                case 'n':
                case 'N':
                    this.loadNewProblem();
                    break;
                case 's':
                case 'S':
                    this.toggleSolution();
                    break;
                case 'r':
                case 'R':
                    this.resetVisualization();
                    break;
                case 'ArrowLeft':
                    this.decrementXValue();
                    break;
                case 'ArrowRight':
                    this.incrementXValue();
                    break;
                case '?':
                    this.showKeyboardHelp();
                    break;
            }
        });
    }
}
```

---

## 모니터링 & 로깅 (Monitoring & Logging)

### 에러 트래킹

```javascript
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.setupGlobalErrorHandler();
    }

    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.logError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                message: 'Unhandled Promise Rejection',
                reason: event.reason
            });
        });
    }

    logError(error) {
        console.error('Error tracked:', error);
        this.errors.push({
            ...error,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // 서버로 전송
        this.sendToServer(error);
    }

    async sendToServer(error) {
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(error)
            });
        } catch (e) {
            console.error('Failed to send error to server:', e);
        }
    }
}
```

### 성능 모니터링

```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    startMeasure(name) {
        performance.mark(`${name}-start`);
    }

    endMeasure(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const measure = performance.getEntriesByName(name)[0];
        this.metrics.set(name, measure.duration);

        console.log(`${name}: ${measure.duration}ms`);
    }

    getMetric(name) {
        return this.metrics.get(name);
    }

    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }
}
```

---

## 배포 전략 (Deployment Strategy)

### CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy Absolute Mirror

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: npm run build
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v2
        with:
          name: dist
      - name: Deploy to server
        run: |
          scp -r dist/* user@server:/var/www/html/absolute-mirror/
```

---

## 결론 (Conclusion)

이 권장 아키텍처는:

✅ **확장 가능**: 새로운 기능 추가가 쉬움
✅ **유지보수 가능**: 모듈화되고 테스트 가능한 코드
✅ **성능 최적화**: WebGL, 코드 분할, 캐싱
✅ **접근성**: WCAG 2.1 AA 준수
✅ **보안**: XSS, CSRF 방지, Rate Limiting
✅ **PWA**: 오프라인 지원, 앱과 같은 경험
✅ **모니터링**: 에러 추적, 성능 측정

---

**다음 단계**: 이 아키텍처를 기반으로 실제 구현 시작
