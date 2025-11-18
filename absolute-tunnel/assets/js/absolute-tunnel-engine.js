/**
 * Absolute Tunnel 3D Visualization Engine
 * 절댓값 부등식을 3D 터널로 시각화
 * Three.js 기반
 */

class AbsoluteTunnelEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tunnel = null;
        this.animationId = null;
        this.currentEquation = null;
        this.solutionRange = null;
        this.speed = 1.0;
        this.interactionCount = 0;

        this.init();
    }

    /**
     * Three.js 초기화
     */
    init() {
        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);

        // Camera 설정
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer 설정
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 조명 설정
        this.setupLights();

        // 이벤트 리스너
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', () => this.onInteraction());

        // 격자 추가
        this.addGrid();

        // 애니메이션 시작
        this.animate();
    }

    /**
     * 조명 설정
     */
    setupLights() {
        // 주변광
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        // 방향광
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // 포인트 라이트 (터널 안쪽)
        const pointLight1 = new THREE.PointLight(0x00ffff, 2, 50);
        pointLight1.position.set(0, 0, -20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff00ff, 2, 50);
        pointLight2.position.set(0, 0, 20);
        this.scene.add(pointLight2);
    }

    /**
     * 격자 추가
     */
    addGrid() {
        const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x004444);
        gridHelper.position.y = -3;
        this.scene.add(gridHelper);
    }

    /**
     * 절댓값 부등식 파싱
     */
    parseEquation(equation) {
        // 예: |x - 2| < 3
        // 예: |2x + 1| >= 5
        // 예: |x| <= 4

        const match = equation.match(/\|([^|]+)\|\s*([<>=]+)\s*(\d+)/);

        if (!match) {
            console.error('Invalid equation format:', equation);
            return null;
        }

        const [, expression, operator, value] = match;

        return {
            expression: expression.trim(),
            operator: operator,
            value: parseFloat(value),
            originalEquation: equation
        };
    }

    /**
     * 해의 범위로 터널 생성
     */
    createTunnel(equation, solutionRange) {
        // 기존 터널 제거
        if (this.tunnel) {
            this.scene.remove(this.tunnel);
        }

        this.currentEquation = this.parseEquation(equation);
        this.solutionRange = solutionRange;

        // 터널 그룹 생성
        this.tunnel = new THREE.Group();

        // 단일 범위 처리
        if (solutionRange.min !== undefined && solutionRange.max !== undefined) {
            this.createTunnelSegment(solutionRange.min, solutionRange.max, solutionRange.type === 'closed');
        }
        // 다중 범위 처리 (예: x < -1 또는 x > 5)
        else if (solutionRange.ranges) {
            solutionRange.ranges.forEach(range => {
                this.createTunnelSegment(
                    range.min === -Infinity ? -20 : range.min,
                    range.max === Infinity ? 20 : range.max,
                    range.type === 'closed'
                );
            });
        }

        // 수직선 추가
        this.addNumberLine();

        // 해 영역 표시
        this.addSolutionRegion();

        this.scene.add(this.tunnel);
        this.interactionCount++;
    }

    /**
     * 터널 세그먼트 생성
     */
    createTunnelSegment(start, end, isClosed) {
        const segments = 50;
        const radius = 2;
        const length = Math.abs(end - start);

        // 터널 지오메트리
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(start, 0, 0),
            new THREE.Vector3(end, 0, 0)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, 16, false);

        // 그라데이션 재질
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.tunnel.add(tube);

        // 와이어프레임 추가 (공간감 강화)
        const wireframeGeometry = new THREE.EdgesGeometry(tubeGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        this.tunnel.add(wireframe);

        // 경계 표시 (열린/닫힌 구간)
        this.addBoundaryMarkers(start, end, radius, isClosed);
    }

    /**
     * 경계 마커 추가
     */
    addBoundaryMarkers(start, end, radius, isClosed) {
        const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);

        // 시작점
        const startMaterial = new THREE.MeshPhongMaterial({
            color: isClosed ? 0x00ff00 : 0xff0000,
            emissive: isClosed ? 0x00ff00 : 0xff0000,
            emissiveIntensity: 0.5
        });
        const startMarker = new THREE.Mesh(markerGeometry, startMaterial);
        startMarker.position.set(start, 0, 0);
        this.tunnel.add(startMarker);

        // 끝점
        const endMaterial = new THREE.MeshPhongMaterial({
            color: isClosed ? 0x00ff00 : 0xff0000,
            emissive: isClosed ? 0x00ff00 : 0xff0000,
            emissiveIntensity: 0.5
        });
        const endMarker = new THREE.Mesh(markerGeometry, endMaterial);
        endMarker.position.set(end, 0, 0);
        this.tunnel.add(endMarker);
    }

    /**
     * 수직선 추가
     */
    addNumberLine() {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-20, -2, 0),
            new THREE.Vector3(20, -2, 0)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const numberLine = new THREE.Line(lineGeometry, lineMaterial);
        this.tunnel.add(numberLine);

        // 눈금 추가
        for (let i = -10; i <= 10; i += 2) {
            const tickGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(i, -2.2, 0),
                new THREE.Vector3(i, -1.8, 0)
            ]);
            const tick = new THREE.Line(tickGeometry, lineMaterial);
            this.tunnel.add(tick);

            // 숫자 레이블 (Three.js TextGeometry 필요)
            this.addTextLabel(i.toString(), i, -2.5, 0);
        }
    }

    /**
     * 텍스트 레이블 추가 (간단한 구현)
     */
    addTextLabel(text, x, y, z) {
        // 실제 구현 시 THREE.TextGeometry 또는 Canvas 텍스처 사용
        // 여기서는 스프라이트로 간단히 구현
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = 'Bold 32px Arial';
        context.textAlign = 'center';
        context.fillText(text, 64, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, y, z);
        sprite.scale.set(1, 0.5, 1);
        this.tunnel.add(sprite);
    }

    /**
     * 해 영역 표시
     */
    addSolutionRegion() {
        if (!this.solutionRange) return;

        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2
        });

        if (this.solutionRange.min !== undefined && this.solutionRange.max !== undefined) {
            const width = Math.abs(this.solutionRange.max - this.solutionRange.min);
            const center = (this.solutionRange.min + this.solutionRange.max) / 2;

            const planeGeometry = new THREE.PlaneGeometry(width, 1);
            const plane = new THREE.Mesh(planeGeometry, highlightMaterial);
            plane.position.set(center, -2, 0.1);
            this.tunnel.add(plane);
        } else if (this.solutionRange.ranges) {
            this.solutionRange.ranges.forEach(range => {
                const min = range.min === -Infinity ? -20 : range.min;
                const max = range.max === Infinity ? 20 : range.max;
                const width = Math.abs(max - min);
                const center = (min + max) / 2;

                const planeGeometry = new THREE.PlaneGeometry(width, 1);
                const plane = new THREE.Mesh(planeGeometry, highlightMaterial);
                plane.position.set(center, -2, 0.1);
                this.tunnel.add(plane);
            });
        }
    }

    /**
     * 애니메이션
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // 터널 회전 (부드러운 움직임)
        if (this.tunnel) {
            this.tunnel.rotation.z += 0.001 * this.speed;

            // 카메라 흔들림 효과 (미세)
            this.camera.position.x = Math.sin(Date.now() * 0.0001) * 0.1;
            this.camera.position.y = Math.cos(Date.now() * 0.0001) * 0.1;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 창 크기 변경 처리
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * 사용자 상호작용 추적
     */
    onInteraction() {
        this.interactionCount++;
    }

    /**
     * 속도 조절
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(3.0, speed));
    }

    /**
     * 카메라 리셋
     */
    resetCamera() {
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 정리
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }

    /**
     * 상호작용 횟수 반환
     */
    getInteractionCount() {
        return this.interactionCount;
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AbsoluteTunnelEngine;
}
