/**
 * Rotational Sweep Animation with Spiral Effect
 * Creates 3D visualization of rotational solids using Three.js
 */

class RotationalSweep {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sweepMesh = null;
        this.wireMesh = null;
        this.animationFrame = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.showWireframe = false;

        // Animation parameters
        this.params = {
            rotationSpeed: 2.0,
            spiralPitch: 0.5,
            segments: 64,
            radialSegments: 32
        };

        this.initScene();
        this.animate();
    }

    /**
     * Initialize Three.js scene
     */
    initScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Setup camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 10, 5);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0x667eea, 0.4);
        directionalLight2.position.set(-5, -5, -5);
        this.scene.add(directionalLight2);

        // Add coordinate axes
        this.addAxes();

        // Add grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Add coordinate axes
     */
    addAxes() {
        const axesGroup = new THREE.Group();

        // X-axis (Red)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(5, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        axesGroup.add(xAxis);

        // Y-axis (Green)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 5, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        axesGroup.add(yAxis);

        // Z-axis (Blue)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 5)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        axesGroup.add(zAxis);

        this.scene.add(axesGroup);
    }

    /**
     * Create parametric surface for rotational sweep
     */
    createParametricSurface(func, uMin, uMax, progress = 1.0) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        const uSegments = this.params.segments;
        const vSegments = this.params.radialSegments;

        // Calculate vertices
        for (let i = 0; i <= uSegments; i++) {
            const u = uMin + (uMax - uMin) * (i / uSegments);
            const radius = func(u);

            for (let j = 0; j <= vSegments; j++) {
                const v = (j / vSegments) * Math.PI * 2 * progress;

                // Add spiral effect
                const spiralOffset = this.params.spiralPitch * (j / vSegments) * progress;

                const x = u + spiralOffset;
                const y = radius * Math.sin(v);
                const z = radius * Math.cos(v);

                vertices.push(x, y, z);

                // Calculate normals (simplified)
                const normal = new THREE.Vector3(0, Math.sin(v), Math.cos(v));
                normal.normalize();
                normals.push(normal.x, normal.y, normal.z);

                // UV coordinates
                uvs.push(i / uSegments, j / vSegments);
            }
        }

        // Create indices for triangles
        for (let i = 0; i < uSegments; i++) {
            for (let j = 0; j < vSegments; j++) {
                const a = i * (vSegments + 1) + j;
                const b = a + vSegments + 1;
                const c = a + 1;
                const d = b + 1;

                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Start rotational sweep animation
     */
    startAnimation(curveFunction = 'x^2', bounds = { start: 0, end: 2 }) {
        // Parse curve function (simple implementation)
        const func = this.parseCurveFunction(curveFunction);

        // Clear existing mesh
        if (this.sweepMesh) {
            this.scene.remove(this.sweepMesh);
            this.sweepMesh.geometry.dispose();
            this.sweepMesh.material.dispose();
        }
        if (this.wireMesh) {
            this.scene.remove(this.wireMesh);
            this.wireMesh.geometry.dispose();
            this.wireMesh.material.dispose();
        }

        this.isAnimating = true;
        this.animationProgress = 0;

        const animate = () => {
            if (!this.isAnimating) return;

            this.animationProgress += 0.01 * this.params.rotationSpeed;

            if (this.animationProgress >= 1.0) {
                this.animationProgress = 1.0;
                this.isAnimating = false;
                this.onAnimationComplete();
            }

            // Update geometry
            const geometry = this.createParametricSurface(
                func,
                bounds.start,
                bounds.end,
                this.animationProgress
            );

            // Remove old mesh
            if (this.sweepMesh) {
                this.scene.remove(this.sweepMesh);
                this.sweepMesh.geometry.dispose();
            }

            // Create new mesh with gradient material
            const material = new THREE.MeshPhongMaterial({
                color: 0x667eea,
                shininess: 100,
                flatShading: false,
                side: THREE.DoubleSide,
                vertexColors: false
            });

            this.sweepMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.sweepMesh);

            // Create wireframe if enabled
            if (this.showWireframe) {
                const wireGeometry = new THREE.WireframeGeometry(geometry);
                const wireMaterial = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3,
                    transparent: true
                });
                this.wireMesh = new THREE.LineSegments(wireGeometry, wireMaterial);
                this.scene.add(this.wireMesh);
            }

            // Update progress bar
            this.updateProgressBar(this.animationProgress);

            if (this.isAnimating) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Parse mathematical curve function
     */
    parseCurveFunction(funcString) {
        // Simple parser for common functions
        // In production, use a proper math parser library

        if (funcString === 'x^2' || funcString === 'x**2') {
            return (x) => x * x;
        } else if (funcString === 'sqrt(x)') {
            return (x) => Math.sqrt(Math.abs(x));
        } else if (funcString === 'sin(x)') {
            return (x) => Math.abs(Math.sin(x)) + 0.5;
        } else if (funcString === 'x') {
            return (x) => x;
        } else if (funcString.match(/^[\d.]+$/)) {
            const constant = parseFloat(funcString);
            return (x) => constant;
        }

        // Default: quadratic function
        return (x) => x * x;
    }

    /**
     * Reset animation
     */
    resetAnimation() {
        this.isAnimating = false;
        this.animationProgress = 0;

        if (this.sweepMesh) {
            this.scene.remove(this.sweepMesh);
            this.sweepMesh.geometry.dispose();
            this.sweepMesh.material.dispose();
            this.sweepMesh = null;
        }

        if (this.wireMesh) {
            this.scene.remove(this.wireMesh);
            this.wireMesh.geometry.dispose();
            this.wireMesh.material.dispose();
            this.wireMesh = null;
        }

        this.updateProgressBar(0);
        this.updateStatus('준비됨');
    }

    /**
     * Toggle wireframe display
     */
    toggleWireframe() {
        this.showWireframe = !this.showWireframe;

        if (this.wireMesh) {
            this.scene.remove(this.wireMesh);
            this.wireMesh.geometry.dispose();
            this.wireMesh.material.dispose();
            this.wireMesh = null;
        }

        return this.showWireframe;
    }

    /**
     * Update animation parameters
     */
    updateParameters(params) {
        this.params = { ...this.params, ...params };
    }

    /**
     * Update progress bar
     */
    updateProgressBar(progress) {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress * 100}%`;
        }

        if (progress > 0 && progress < 1) {
            this.updateStatus(`애니메이션 진행 중... ${Math.round(progress * 100)}%`);
        }
    }

    /**
     * Update status text
     */
    updateStatus(text) {
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = text;
        }
    }

    /**
     * Animation complete callback
     */
    onAnimationComplete() {
        this.updateStatus('애니메이션 완료!');
        console.log('Rotational sweep animation completed');

        // Trigger event for LMS progress tracking
        const event = new CustomEvent('animationComplete', {
            detail: {
                timestamp: Date.now(),
                progress: 1.0
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate camera slowly
        if (this.sweepMesh) {
            this.sweepMesh.rotation.x += 0.002;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.sweepMesh) {
            this.sweepMesh.geometry.dispose();
            this.sweepMesh.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        window.removeEventListener('resize', () => this.onWindowResize());
    }
}

// Export for use in other modules
window.RotationalSweep = RotationalSweep;
