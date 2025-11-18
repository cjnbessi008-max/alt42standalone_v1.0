/**
 * 3D Line Seq Visualization
 * Uses Three.js to render mathematical sequences in 3D space
 */

let scene, camera, renderer, controls;
let sequenceMesh, autoRotate = false;
let currentStyle = 'line';
let sequenceData = null;

/**
 * Initialize 3D visualization
 */
function init3DLineSeq(data) {
    sequenceData = data;

    // Update UI
    if (document.getElementById('seq-type')) {
        document.getElementById('seq-type').textContent = getSequenceTypeName(data.type);
    }
    if (document.getElementById('seq-values')) {
        document.getElementById('seq-values').textContent = data.values.join(', ');
    }

    currentStyle = data.style || 'line';

    // Initialize Three.js scene
    initScene();
    createSequenceVisualization(data.values, currentStyle);
    setupEventListeners();
    animate();

    // Hide loading indicator
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

/**
 * Initialize Three.js scene
 */
function initScene() {
    const container = document.getElementById('smartphone-canvas-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x667eea, 1, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Mouse controls (simple rotation)
    setupMouseControls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

/**
 * Create sequence visualization based on style
 */
function createSequenceVisualization(values, style) {
    // Remove existing sequence mesh
    if (sequenceMesh) {
        scene.remove(sequenceMesh);
    }

    sequenceMesh = new THREE.Group();

    switch (style) {
        case 'line':
            createLineVisualization(values);
            break;
        case 'curve':
            createCurveVisualization(values);
            break;
        case 'spiral':
            createSpiralVisualization(values);
            break;
        case 'bars':
            createBarsVisualization(values);
            break;
        default:
            createLineVisualization(values);
    }

    scene.add(sequenceMesh);
}

/**
 * Create line visualization
 */
function createLineVisualization(values) {
    const points = [];
    const colors = [];

    values.forEach((value, index) => {
        const x = (index - values.length / 2) * 1.5;
        const y = Math.log(Math.abs(value) + 1) * 2;
        const z = 0;

        points.push(new THREE.Vector3(x, y, z));

        // Color gradient
        const color = new THREE.Color();
        color.setHSL(index / values.length, 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
    });

    // Create line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 3
    });

    const line = new THREE.Line(geometry, material);
    sequenceMesh.add(line);

    // Add spheres at each point
    points.forEach((point, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(index / values.length, 1.0, 0.5),
            emissive: new THREE.Color().setHSL(index / values.length, 0.5, 0.2),
            shininess: 100
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(point);
        sequenceMesh.add(sphere);

        // Add value label
        createTextLabel(values[index].toString(), point);
    });
}

/**
 * Create curve visualization
 */
function createCurveVisualization(values) {
    const points = [];

    values.forEach((value, index) => {
        const t = index / (values.length - 1);
        const x = (index - values.length / 2) * 1.5;
        const y = Math.log(Math.abs(value) + 1) * 2;
        const z = Math.sin(t * Math.PI * 2) * 2;

        points.push(new THREE.Vector3(x, y, z));
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x667eea,
        emissive: 0x222244,
        shininess: 100
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    sequenceMesh.add(tube);

    // Add spheres
    points.forEach((point, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(index / values.length, 1.0, 0.5)
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(point);
        sequenceMesh.add(sphere);
    });
}

/**
 * Create spiral visualization
 */
function createSpiralVisualization(values) {
    values.forEach((value, index) => {
        const angle = (index / values.length) * Math.PI * 4;
        const radius = 2 + (index * 0.3);
        const x = Math.cos(angle) * radius;
        const y = index * 0.5;
        const z = Math.sin(angle) * radius;

        const height = Math.log(Math.abs(value) + 1) * 2;

        const geometry = new THREE.CylinderGeometry(0.2, 0.2, height, 16);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(index / values.length, 1.0, 0.5),
            emissive: new THREE.Color().setHSL(index / values.length, 0.5, 0.2)
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(x, y + height / 2, z);

        sequenceMesh.add(cylinder);

        // Add sphere on top
        const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(x, y + height, z);
        sequenceMesh.add(sphere);
    });
}

/**
 * Create 3D bars visualization
 */
function createBarsVisualization(values) {
    const maxValue = Math.max(...values.map(Math.abs));

    values.forEach((value, index) => {
        const x = (index - values.length / 2) * 1.2;
        const height = (Math.abs(value) / maxValue) * 8;
        const z = 0;

        const geometry = new THREE.BoxGeometry(0.8, height, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(index / values.length, 1.0, 0.5),
            emissive: new THREE.Color().setHSL(index / values.length, 0.5, 0.2),
            shininess: 100
        });
        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(x, height / 2, z);

        sequenceMesh.add(bar);

        // Add value label
        createTextLabel(value.toString(), new THREE.Vector3(x, height + 0.5, z));
    });
}

/**
 * Create text label (simplified)
 */
function createTextLabel(text, position) {
    // Using sprite for text (simplified version)
    // In production, use THREE.TextGeometry or texture-based text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;

    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.set(1, 0.5, 1);

    sequenceMesh.add(sprite);
}

/**
 * Setup mouse controls
 */
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function setupMouseControls() {
    const container = document.getElementById('smartphone-canvas-container');

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('mousemove', (e) => {
        if (isDragging && sequenceMesh) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            sequenceMesh.rotation.y += deltaX * 0.01;
            sequenceMesh.rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    container.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch controls for mobile
    let touchStartPos = { x: 0, y: 0 };

    container.addEventListener('touchstart', (e) => {
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    });

    container.addEventListener('touchmove', (e) => {
        if (sequenceMesh) {
            const deltaX = e.touches[0].clientX - touchStartPos.x;
            const deltaY = e.touches[0].clientY - touchStartPos.y;

            sequenceMesh.rotation.y += deltaX * 0.01;
            sequenceMesh.rotation.x += deltaY * 0.01;

            touchStartPos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    });

    // Zoom with mouse wheel
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    });
}

/**
 * Setup event listeners for controls
 */
function setupEventListeners() {
    // Reset view
    const resetBtn = document.getElementById('reset-view');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (sequenceMesh) {
                sequenceMesh.rotation.set(0, 0, 0);
            }
            camera.position.set(0, 5, 10);
            camera.lookAt(0, 0, 0);
        });
    }

    // Toggle rotation
    const rotateBtn = document.getElementById('toggle-rotation');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            autoRotate = !autoRotate;
            rotateBtn.classList.toggle('rotating', autoRotate);
            rotateBtn.textContent = autoRotate ? '⏸ 회전 중지' : '🔁 자동 회전';
        });
    }

    // Change style
    const styleBtn = document.getElementById('change-style');
    if (styleBtn) {
        styleBtn.addEventListener('click', () => {
            const styles = ['line', 'curve', 'spiral', 'bars'];
            const currentIndex = styles.indexOf(currentStyle);
            currentStyle = styles[(currentIndex + 1) % styles.length];

            if (sequenceData) {
                createSequenceVisualization(sequenceData.values, currentStyle);
            }
        });
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            camera.position.z = Math.max(5, camera.position.z - 1);
        });
    }

    const zoomOutBtn = document.getElementById('zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            camera.position.z = Math.min(20, camera.position.z + 1);
        });
    }
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && sequenceMesh) {
        sequenceMesh.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('smartphone-canvas-container');
    if (!container) return;

    const aspect = container.clientWidth / container.clientHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Get sequence type name in Korean
 */
function getSequenceTypeName(type) {
    const names = {
        'arithmetic': '등차수열',
        'geometric': '등비수열',
        'fibonacci': '피보나치',
        'custom': '사용자 정의'
    };
    return names[type] || type;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init3DLineSeq };
}
