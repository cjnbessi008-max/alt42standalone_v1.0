/**
 * Solid Spin Viewer - 3D Solid Geometry Viewer
 * Powered by Three.js
 * Compatible with Moodle 3.7
 */

class SolidViewer {
    constructor(config) {
        this.config = config;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.autoRotate = false;
        this.rotationSpeed = 0.01;
        this.wireframeMode = false;
        this.currentShape = null;
        this.shapes = [];
        this.startTime = Date.now();
        this.interactionCount = 0;

        this.init();
    }

    /**
     * Initialize the 3D viewer
     */
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupEventListeners();
        this.animate();

        // Load data
        if (this.config.questionId) {
            this.loadQuestion(this.config.questionId);
        } else {
            this.loadAllShapes();
        }
    }

    /**
     * Setup Three.js scene
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xeeeeee);
        gridHelper.position.y = -2;
        this.scene.add(gridHelper);

        // Add axes helper (for debugging)
        if (this.config.debugMode) {
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);
        }
    }

    /**
     * Setup camera
     */
    setupCamera() {
        const container = document.getElementById('canvas-container');
        const aspect = container.clientWidth / container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Setup WebGL renderer
     */
    setupRenderer() {
        const canvas = document.getElementById('viewer-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });

        const container = document.getElementById('canvas-container');
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    /**
     * Setup orbit controls for smooth rotation
     */
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;

        // Track user interactions
        this.controls.addEventListener('change', () => {
            this.interactionCount++;
            this.updateRotationInfo();
        });

        this.controls.addEventListener('end', () => {
            this.trackInteraction('rotate');
        });
    }

    /**
     * Setup lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (main)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Auto rotate toggle
        document.getElementById('btn-rotate-toggle').addEventListener('click', () => {
            this.toggleAutoRotate();
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.resetView();
        });

        // Wireframe toggle
        document.getElementById('btn-wireframe').addEventListener('click', () => {
            this.toggleWireframe();
        });

        // Rotation speed slider
        const speedSlider = document.getElementById('rotation-speed');
        speedSlider.addEventListener('input', (e) => {
            this.rotationSpeed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent =
                (this.rotationSpeed / 0.01).toFixed(1) + 'x';
        });

        // Shape selector
        document.getElementById('shape-selector').addEventListener('change', (e) => {
            const shapeId = parseInt(e.target.value);
            if (shapeId) {
                const shape = this.shapes.find(s => s.id === shapeId);
                if (shape) {
                    this.loadShape(shape);
                }
            }
        });
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const container = document.getElementById('canvas-container');
        const aspect = container.clientWidth / container.clientHeight;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate if enabled
        if (this.autoRotate && this.currentMesh) {
            this.currentMesh.rotation.y += this.rotationSpeed;
            this.currentMesh.rotation.x += this.rotationSpeed * 0.5;
            this.updateRotationInfo();
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Load question data from API
     */
    async loadQuestion(questionId) {
        this.showLoading(true);

        try {
            const url = new URL(`${this.config.apiBaseUrl}/get_question.php`, window.location.origin);
            url.searchParams.append('question_id', questionId);

            if (this.config.userId) {
                url.searchParams.append('user_id', this.config.userId);
            }
            if (this.config.sessionToken) {
                url.searchParams.append('session_token', this.config.sessionToken);
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load question');
            }

            // Update UI with question info
            document.getElementById('question-name').textContent = data.data.question.name;
            document.getElementById('shape-title').textContent =
                data.data.solid_shape.name_kr || data.data.solid_shape.name;

            // Apply viewer settings
            const settings = data.data.viewer_settings;
            this.autoRotate = settings.auto_rotate;
            this.rotationSpeed = settings.rotation_speed;
            this.controls.enableRotate = settings.rotation_enabled;

            // Update UI
            document.getElementById('rotation-speed').value = this.rotationSpeed;
            document.getElementById('speed-value').textContent =
                (this.rotationSpeed / 0.01).toFixed(1) + 'x';

            if (this.autoRotate) {
                document.getElementById('btn-rotate-toggle').classList.add('active');
            }

            // Load the shape
            this.loadShape(data.data.solid_shape);

            // Apply initial rotation
            if (this.currentMesh) {
                this.currentMesh.rotation.set(
                    settings.initial_rotation.x,
                    settings.initial_rotation.y,
                    settings.initial_rotation.z
                );
            }

            this.showLoading(false);

        } catch (error) {
            console.error('Error loading question:', error);
            this.showError(error.message);
        }
    }

    /**
     * Load all available shapes for selector
     */
    async loadAllShapes() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/get_shapes.php`);
            const data = await response.json();

            if (data.success) {
                this.shapes = data.data.shapes;
                this.populateShapeSelector();

                // Load first shape by default
                if (this.shapes.length > 0) {
                    this.loadShape(this.shapes[0]);
                }
            }
        } catch (error) {
            console.error('Error loading shapes:', error);
        }
    }

    /**
     * Populate shape selector dropdown
     */
    populateShapeSelector() {
        const selector = document.getElementById('shape-selector');
        selector.innerHTML = '<option value="">입체도형 선택...</option>';

        this.shapes.forEach(shape => {
            const option = document.createElement('option');
            option.value = shape.id;
            option.textContent = `${shape.name_kr} (${shape.name})`;
            selector.appendChild(option);
        });
    }

    /**
     * Load and display a 3D shape
     */
    loadShape(shapeData) {
        // Remove current mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh.geometry.dispose();
            this.currentMesh.material.dispose();
        }

        this.currentShape = shapeData;

        // Create geometry
        let geometry;
        const vertices = shapeData.geometry.vertices;

        // Check if vertices is a parametric definition (for curved shapes)
        if (typeof vertices === 'object' && vertices.type) {
            switch (vertices.type) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(
                        vertices.radius || 1,
                        vertices.widthSegments || 32,
                        vertices.heightSegments || 32
                    );
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(
                        vertices.radius || 1,
                        vertices.height || 2,
                        vertices.radialSegments || 32
                    );
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(
                        vertices.radiusTop || 1,
                        vertices.radiusBottom || 1,
                        vertices.height || 2,
                        vertices.radialSegments || 32
                    );
                    break;
                case 'torus':
                    geometry = new THREE.TorusGeometry(
                        vertices.radius || 1,
                        vertices.tube || 0.4,
                        vertices.radialSegments || 16,
                        vertices.tubularSegments || 32
                    );
                    break;
                case 'dodecahedron':
                    geometry = new THREE.DodecahedronGeometry(vertices.radius || 1);
                    break;
                default:
                    geometry = new THREE.BoxGeometry(2, 2, 2);
            }
        } else if (Array.isArray(vertices) && vertices.length > 0) {
            // Custom geometry from vertices and faces
            geometry = this.createCustomGeometry(vertices, shapeData.geometry.faces);
        } else {
            // Default to cube
            geometry = new THREE.BoxGeometry(2, 2, 2);
        }

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: shapeData.color || '#3498db',
            shininess: 100,
            specular: 0x444444,
            flatShading: false,
            side: THREE.DoubleSide
        });

        // Create mesh
        this.currentMesh = new THREE.Mesh(geometry, material);
        this.currentMesh.castShadow = true;
        this.currentMesh.receiveShadow = true;

        // Add to scene
        this.scene.add(this.currentMesh);

        // Update info panel
        this.updateShapeInfo();
        this.updateRotationInfo();
    }

    /**
     * Create custom geometry from vertices and faces
     */
    createCustomGeometry(vertices, faces) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const indices = [];

        // Add vertices
        vertices.forEach(v => {
            positions.push(v[0], v[1], v[2]);
        });

        // Add faces
        faces.forEach(face => {
            if (face.length === 3) {
                // Triangle
                indices.push(face[0], face[1], face[2]);
            } else if (face.length === 4) {
                // Quad - split into two triangles
                indices.push(face[0], face[1], face[2]);
                indices.push(face[0], face[2], face[3]);
            }
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Update shape information panel
     */
    updateShapeInfo() {
        if (!this.currentShape) return;

        document.getElementById('info-name').textContent = this.currentShape.name;
        document.getElementById('info-name-kr').textContent = this.currentShape.name_kr;
        document.getElementById('info-category').textContent = this.currentShape.category;
    }

    /**
     * Update rotation information
     */
    updateRotationInfo() {
        if (!this.currentMesh) return;

        const rotation = this.currentMesh.rotation;
        const toDegrees = (rad) => Math.round(rad * 180 / Math.PI);

        document.getElementById('info-rotation').textContent =
            `X: ${toDegrees(rotation.x)}° Y: ${toDegrees(rotation.y)}° Z: ${toDegrees(rotation.z)}°`;
    }

    /**
     * Toggle auto-rotation
     */
    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        const btn = document.getElementById('btn-rotate-toggle');

        if (this.autoRotate) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        this.trackInteraction('rotate');
    }

    /**
     * Reset camera view
     */
    resetView() {
        // Reset camera position
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Reset controls
        this.controls.reset();

        // Reset mesh rotation
        if (this.currentMesh) {
            this.currentMesh.rotation.set(0, 0, 0);
        }

        this.trackInteraction('reset');
    }

    /**
     * Toggle wireframe mode
     */
    toggleWireframe() {
        if (!this.currentMesh) return;

        this.wireframeMode = !this.wireframeMode;
        this.currentMesh.material.wireframe = this.wireframeMode;

        const btn = document.getElementById('btn-wireframe');
        if (this.wireframeMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    /**
     * Track user interaction
     */
    async trackInteraction(type) {
        if (!this.config.userId || !this.currentShape) return;

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        const data = {
            moodle_user_id: this.config.userId,
            question_id: this.currentShape.id,
            interaction_type: type,
            time_spent_seconds: timeSpent,
            session_id: this.getSessionId()
        };

        if (this.currentMesh) {
            data.rotation_x = this.currentMesh.rotation.x;
            data.rotation_y = this.currentMesh.rotation.y;
            data.rotation_z = this.currentMesh.rotation.z;
        }

        try {
            await fetch(`${this.config.apiBaseUrl}/track_interaction.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('solid_viewer_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('solid_viewer_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showLoading(false);
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');

        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const viewer = new SolidViewer(window.SOLID_VIEWER_CONFIG);
    window.solidViewer = viewer; // Make available globally for debugging
});
