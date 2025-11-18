/**
 * Viewer3D 클래스
 * Three.js 기반 3D 뷰어와 Cross-Section Glow 효과를 관리
 */

class Viewer3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        // Three.js 기본 요소
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // 3D 객체
        this.currentModel = null;
        this.glowMaterial = null;

        // Cross-Section 설정
        this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.clipPlaneHelper = null;

        // 애니메이션
        this.animationId = null;
        this.clock = new THREE.Clock();

        // 초기화
        this.init();
    }

    /**
     * Three.js 환경 초기화
     */
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera 생성
        this.camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer 생성
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.localClippingEnabled = true; // 로컬 클리핑 활성화
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls 추가
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;

        // 조명 추가
        this.addLights();

        // 그리드 헬퍼
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Axes 헬퍼
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Clipping Plane 헬퍼 추가
        this.addClipPlaneHelper();

        // 기본 모델 로드
        this.loadModel('sphere');

        // 리사이즈 이벤트
        window.addEventListener('resize', () => this.onWindowResize());

        // 렌더링 시작
        this.animate();
    }

    /**
     * 조명 추가
     */
    addLights() {
        // 환경광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 디렉셔널 라이트
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 포인트 라이트 (보조)
        const pointLight = new THREE.PointLight(0x4488ff, 0.5);
        pointLight.position.set(-5, 5, -5);
        this.scene.add(pointLight);
    }

    /**
     * Clipping Plane 헬퍼 추가
     */
    addClipPlaneHelper() {
        // Plane Geometry로 시각화
        const planeGeometry = new THREE.PlaneGeometry(8, 8);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2,
            wireframe: false
        });

        this.clipPlaneHelper = new THREE.Mesh(planeGeometry, planeMaterial);
        this.clipPlaneHelper.visible = true;
        this.scene.add(this.clipPlaneHelper);

        // Wireframe 추가
        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(planeGeometry),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
        );
        this.clipPlaneHelper.add(wireframe);
    }

    /**
     * 모델 로드
     */
    loadModel(modelType) {
        // 기존 모델 제거
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            if (this.currentModel.geometry) {
                this.currentModel.geometry.dispose();
            }
            if (this.currentModel.material) {
                this.currentModel.material.dispose();
            }
        }

        // 지오메트리 선택
        let geometry;
        switch (modelType) {
            case 'cube':
                geometry = new THREE.BoxGeometry(3, 3, 3, 10, 10, 10);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(2, 64, 64);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(2, 0.8, 32, 100);
                break;
            case 'knot':
                geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 128, 32);
                break;
            default:
                geometry = new THREE.SphereGeometry(2, 64, 64);
        }

        // Glow Material 생성
        this.glowMaterial = createGlowMaterial({
            baseColor: new THREE.Color(0x4488ff),
            glowColor: new THREE.Color(0x00ffff),
            glowIntensity: 2.0,
            glowThickness: 0.1,
            clipPlaneNormal: this.clipPlane.normal,
            clipPlaneConstant: this.clipPlane.constant,
            enableCrossSection: true,
            useAnimation: true
        });

        // 메시 생성
        this.currentModel = new THREE.Mesh(geometry, this.glowMaterial);
        this.scene.add(this.currentModel);
    }

    /**
     * Cross-Section 설정 업데이트
     */
    updateCrossSection(position, rotationX, rotationY, enabled) {
        if (!this.glowMaterial) return;

        // 평면 회전 적용
        const euler = new THREE.Euler(
            THREE.MathUtils.degToRad(rotationX),
            THREE.MathUtils.degToRad(rotationY),
            0,
            'XYZ'
        );
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
        const normal = new THREE.Vector3(0, 1, 0).applyMatrix4(rotationMatrix).normalize();

        // Clip Plane 업데이트
        this.clipPlane.normal.copy(normal);
        this.clipPlane.constant = -position;

        // Material Uniform 업데이트
        this.glowMaterial.uniforms.clipPlaneNormal.value.copy(normal);
        this.glowMaterial.uniforms.clipPlaneConstant.value = -position;
        this.glowMaterial.uniforms.enableCrossSection.value = enabled;

        // Clip Plane Helper 업데이트
        if (this.clipPlaneHelper) {
            this.clipPlaneHelper.visible = enabled;
            this.clipPlaneHelper.position.set(
                normal.x * position,
                normal.y * position,
                normal.z * position
            );
            this.clipPlaneHelper.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                normal
            );
        }
    }

    /**
     * Glow 효과 설정 업데이트
     */
    updateGlowSettings(intensity, color, thickness) {
        if (!this.glowMaterial) return;

        this.glowMaterial.uniforms.glowIntensity.value = intensity;
        this.glowMaterial.uniforms.glowColor.value.setStyle(color);
        this.glowMaterial.uniforms.glowThickness.value = thickness;
    }

    /**
     * 뷰 리셋
     */
    resetView() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }

    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // 컨트롤 업데이트
        this.controls.update();

        // 시간 업데이트 (애니메이션 셰이더용)
        if (this.glowMaterial && this.glowMaterial.uniforms.time) {
            this.glowMaterial.uniforms.time.value = this.clock.getElapsedTime();
        }

        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 정리
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            if (this.currentModel.geometry) {
                this.currentModel.geometry.dispose();
            }
            if (this.currentModel.material) {
                this.currentModel.material.dispose();
            }
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.controls = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}
