/**
 * Vector 3D Sense - 3D Visualization Engine
 * Uses Three.js for 3D vector rendering
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class Vector3DEngine {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            gridSize: options.gridSize || 10,
            showGrid: options.showGrid !== false,
            showAxes: options.showAxes !== false,
            showLabels: options.showLabels !== false,
            cameraPosition: options.cameraPosition || { x: 10, y: 10, z: 10 },
            backgroundColor: options.backgroundColor || 0xf0f0f0,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.vectors = [];
        this.resultVector = null;
        this.animationId = null;

        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Create camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(
            this.options.cameraPosition.x,
            this.options.cameraPosition.y,
            this.options.cameraPosition.z
        );
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;

        // Add lighting
        this.addLights();

        // Add grid and axes
        if (this.options.showGrid) {
            this.addGrid();
        }

        if (this.options.showAxes) {
            this.addAxes();
        }

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    /**
     * Add lighting to scene
     */
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Additional directional light from opposite side
        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-10, -10, -10);
        this.scene.add(backLight);
    }

    /**
     * Add grid helper
     */
    addGrid() {
        const gridSize = this.options.gridSize;
        const gridHelper = new THREE.GridHelper(gridSize * 2, gridSize * 2, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);
    }

    /**
     * Add 3D axes
     */
    addAxes() {
        const axesHelper = new THREE.AxesHelper(this.options.gridSize);
        this.scene.add(axesHelper);

        // Add axis labels
        if (this.options.showLabels) {
            this.addAxisLabels();
        }
    }

    /**
     * Add labels for X, Y, Z axes
     */
    addAxisLabels() {
        const createTextSprite = (text, color) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;

            context.fillStyle = color;
            context.font = 'Bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 64, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(1, 1, 1);

            return sprite;
        };

        const size = this.options.gridSize;

        // X axis label (red)
        const xLabel = createTextSprite('X', '#ff0000');
        xLabel.position.set(size + 1, 0, 0);
        this.scene.add(xLabel);

        // Y axis label (green)
        const yLabel = createTextSprite('Y', '#00ff00');
        yLabel.position.set(0, size + 1, 0);
        this.scene.add(yLabel);

        // Z axis label (blue)
        const zLabel = createTextSprite('Z', '#0000ff');
        zLabel.position.set(0, 0, size + 1);
        this.scene.add(zLabel);
    }

    /**
     * Add a vector to the scene
     *
     * @param {Object} vectorData - {name, x, y, z, color}
     * @param {Object} options - Additional options
     * @return {Object} Vector object
     */
    addVector(vectorData, options = {}) {
        const {
            name = 'V',
            x = 0,
            y = 0,
            z = 0,
            color = '#FF6B6B',
            originX = 0,
            originY = 0,
            originZ = 0,
            showLabel = true,
            lineWidth = 3
        } = { ...vectorData, ...options };

        // Create arrow
        const origin = new THREE.Vector3(originX, originY, originZ);
        const direction = new THREE.Vector3(x, y, z).normalize();
        const length = Math.sqrt(x * x + y * y + z * z);
        const colorObj = new THREE.Color(color);

        const arrowHelper = new THREE.ArrowHelper(
            direction,
            origin,
            length,
            colorObj,
            length * 0.2, // Head length
            length * 0.15  // Head width
        );

        arrowHelper.userData = {
            name: name,
            vector: { x, y, z },
            origin: { x: originX, y: originY, z: originZ }
        };

        this.scene.add(arrowHelper);

        // Add vector label
        if (showLabel && this.options.showLabels) {
            const label = this.createVectorLabel(name, x, y, z, color);
            label.position.set(originX + x * 1.1, originY + y * 1.1, originZ + z * 1.1);
            this.scene.add(label);
            arrowHelper.userData.label = label;
        }

        const vectorObj = {
            name,
            arrow: arrowHelper,
            data: vectorData
        };

        this.vectors.push(vectorObj);
        return vectorObj;
    }

    /**
     * Create vector label sprite
     */
    createVectorLabel(name, x, y, z, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        // Background
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.roundRect(0, 0, 256, 128, 10);
        context.fill();

        // Border
        context.strokeStyle = color;
        context.lineWidth = 4;
        context.roundRect(0, 0, 256, 128, 10);
        context.stroke();

        // Text
        context.fillStyle = '#333';
        context.font = 'Bold 32px Arial';
        context.textAlign = 'center';
        context.fillText(name, 128, 40);

        context.font = '24px Arial';
        context.fillText(`(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`, 128, 80);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 1, 1);

        return sprite;
    }

    /**
     * Clear all vectors from scene
     */
    clearVectors() {
        this.vectors.forEach(vectorObj => {
            this.scene.remove(vectorObj.arrow);
            if (vectorObj.arrow.userData.label) {
                this.scene.remove(vectorObj.arrow.userData.label);
            }
        });
        this.vectors = [];

        if (this.resultVector) {
            this.scene.remove(this.resultVector.arrow);
            if (this.resultVector.arrow.userData.label) {
                this.scene.remove(this.resultVector.arrow.userData.label);
            }
            this.resultVector = null;
        }
    }

    /**
     * Show vector addition result
     */
    showVectorAddition(vectors) {
        let resultX = 0, resultY = 0, resultZ = 0;

        vectors.forEach(v => {
            resultX += v.x;
            resultY += v.y;
            resultZ += v.z;
        });

        this.resultVector = this.addVector({
            name: 'R = A + B',
            x: resultX,
            y: resultY,
            z: resultZ,
            color: '#9B59B6'
        }, {
            showLabel: true,
            lineWidth: 4
        });

        return { x: resultX, y: resultY, z: resultZ };
    }

    /**
     * Animate camera to focus on vectors
     */
    focusOnVectors() {
        if (this.vectors.length === 0) return;

        // Calculate bounding box
        const box = new THREE.Box3();
        this.vectors.forEach(v => {
            box.expandByPoint(new THREE.Vector3(
                v.data.x || 0,
                v.data.y || 0,
                v.data.z || 0
            ));
        });

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;

        // Smooth camera transition (simplified)
        this.camera.position.set(
            center.x + distance,
            center.y + distance,
            center.z + distance
        );
        this.controls.target.copy(center);
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
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get camera position
     */
    getCameraPosition() {
        return {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.clearVectors();
        this.renderer.dispose();
        this.controls.dispose();

        if (this.container && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

// Add roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}
