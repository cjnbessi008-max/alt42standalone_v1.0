/**
 * Three.js 기반 3D 도형 렌더링 모듈
 */

class ShapeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentShape = null;
        this.animationId = null;

        this.initialize();
    }

    /**
     * Three.js 초기화
     */
    initialize() {
        if (!this.container) {
            console.error('Canvas container not found');
            return;
        }

        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Camera 설정
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer 생성
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls 설정
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;

        // 조명 추가
        this.addLights();

        // 그리드 헬퍼 추가 (선택적)
        const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
        this.scene.add(gridHelper);

        // 축 헬퍼 추가 (선택적)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => this.onWindowResize());

        // 애니메이션 시작
        this.animate();
    }

    /**
     * 조명 설정
     */
    addLights() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional Light 1
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(10, 10, 5);
        this.scene.add(directionalLight1);

        // Directional Light 2 (반대편)
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -10, -5);
        this.scene.add(directionalLight2);

        // Point Light (포인트 조명)
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }

    /**
     * 도형 생성
     */
    createShape(shapeData) {
        // 기존 도형 제거
        if (this.currentShape) {
            this.scene.remove(this.currentShape);
            this.currentShape.geometry.dispose();
            this.currentShape.material.dispose();
        }

        let geometry;
        const { type, dimensions, color } = shapeData;

        // 도형 타입에 따라 geometry 생성
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(
                    dimensions.size,
                    dimensions.size,
                    dimensions.size
                );
                break;

            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    dimensions.radius,
                    dimensions.radius,
                    dimensions.height,
                    32
                );
                break;

            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    dimensions.radius,
                    32,
                    32
                );
                break;

            case 'pyramid':
                geometry = new THREE.ConeGeometry(
                    dimensions.baseSize / 2,
                    dimensions.height,
                    4
                );
                break;

            case 'cone':
                geometry = new THREE.ConeGeometry(
                    dimensions.radius,
                    dimensions.height,
                    32
                );
                break;

            default:
                console.warn('Unknown shape type:', type);
                geometry = new THREE.BoxGeometry(5, 5, 5);
        }

        // Material 생성 (기본: 불투명)
        const material = new THREE.MeshPhongMaterial({
            color: color || 0x4CAF50,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            shininess: 100
        });

        // Mesh 생성
        this.currentShape = new THREE.Mesh(geometry, material);

        // 와이어프레임 추가 (내부 구조 파악용)
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe);
        line.material.color.setHex(0x000000);
        line.material.opacity = 0.25;
        line.material.transparent = true;
        this.currentShape.add(line);

        this.scene.add(this.currentShape);

        // 카메라 위치 자동 조정
        this.resetCameraPosition();

        return this.currentShape;
    }

    /**
     * 투명도 설정 (Inner View Mode)
     */
    setTransparency(opacity) {
        if (this.currentShape && this.currentShape.material) {
            // 0-100 범위를 0-1 범위로 변환
            const normalizedOpacity = 1 - (opacity / 100);
            this.currentShape.material.opacity = normalizedOpacity;
            this.currentShape.material.transparent = true;

            // 와이어프레임 가시성 조정
            if (this.currentShape.children.length > 0) {
                this.currentShape.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = Math.max(0.3, normalizedOpacity);
                    }
                });
            }
        }
    }

    /**
     * 카메라 위치 초기화
     */
    resetCameraPosition() {
        if (this.currentShape) {
            // 도형의 크기에 따라 카메라 거리 조정
            const boundingBox = new THREE.Box3().setFromObject(this.currentShape);
            const size = boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const distance = maxDim * 2.5;

            this.camera.position.set(distance, distance, distance);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // 도형 회전 (선택적)
        if (this.currentShape) {
            this.currentShape.rotation.y += 0.005;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * 정리 (메모리 해제)
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.currentShape) {
            this.scene.remove(this.currentShape);
            this.currentShape.geometry.dispose();
            this.currentShape.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        window.removeEventListener('resize', () => this.onWindowResize());
    }
}
