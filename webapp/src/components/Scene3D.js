import * as THREE from 'three';
import { GeometryFactory } from '../utils/GeometryFactory';

/**
 * Scene3D - Main 3D visualization component using Three.js
 * Handles 3D rendering, rotation controls, and interaction
 */
export class Scene3D {
    constructor(container, config, onRotationCallback) {
        this.container = container;
        this.config = config;
        this.onRotationCallback = onRotationCallback;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentMesh = null;
        this.animationId = null;

        // Interaction state
        this.isRotating = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotation = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.autoRotate = false;

        // Touch state
        this.touchStartDistance = 0;
        this.initialScale = 1;

        this.init();
    }

    /**
     * Initialize the 3D scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Create camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        this.setupLights();

        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        // Set up interaction
        this.setupInteraction();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();

        console.log('3D Scene initialized');
    }

    /**
     * Set up scene lighting
     */
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (main)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
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
     * Set up mouse and touch interaction
     */
    setupInteraction() {
        const canvas = this.renderer.domElement;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch events
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', () => this.onTouchEnd());

        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Mouse down handler
     */
    onMouseDown(event) {
        if (!this.config.enable_rotation) return;

        this.isRotating = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
        this.autoRotate = false;
    }

    /**
     * Mouse move handler
     */
    onMouseMove(event) {
        if (!this.isRotating || !this.currentMesh) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.targetRotation.y += deltaX * 0.01;
        this.targetRotation.x += deltaY * 0.01;

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };

        // Notify rotation callback
        if (this.onRotationCallback) {
            this.onRotationCallback();
        }
    }

    /**
     * Mouse up handler
     */
    onMouseUp() {
        this.isRotating = false;
    }

    /**
     * Mouse wheel handler (zoom)
     */
    onWheel(event) {
        event.preventDefault();
        const delta = event.deltaY * 0.01;
        this.camera.position.multiplyScalar(1 + delta * 0.1);
        this.camera.position.clampLength(2, 20);
    }

    /**
     * Touch start handler
     */
    onTouchStart(event) {
        event.preventDefault();

        if (event.touches.length === 1) {
            // Single touch - rotation
            this.isRotating = true;
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            this.autoRotate = false;
        } else if (event.touches.length === 2) {
            // Two finger pinch - zoom
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            this.initialScale = this.camera.position.length();
        }
    }

    /**
     * Touch move handler
     */
    onTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this.isRotating && this.currentMesh) {
            // Single touch - rotation
            const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

            this.targetRotation.y += deltaX * 0.01;
            this.targetRotation.x += deltaY * 0.01;

            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };

            if (this.onRotationCallback) {
                this.onRotationCallback();
            }
        } else if (event.touches.length === 2) {
            // Two finger pinch - zoom
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const scale = distance / this.touchStartDistance;
            const newDistance = this.initialScale / scale;
            const clamped = Math.max(2, Math.min(20, newDistance));

            this.camera.position.setLength(clamped);
        }
    }

    /**
     * Touch end handler
     */
    onTouchEnd() {
        this.isRotating = false;
        this.touchStartDistance = 0;
    }

    /**
     * Load geometry into the scene
     * @param {string} geometryType - Type of geometry (cube, sphere, pyramid, etc.)
     * @param {object} geometryData - Geometry-specific data
     */
    loadGeometry(geometryType, geometryData) {
        // Remove existing mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh.geometry.dispose();
            this.currentMesh.material.dispose();
        }

        // Create new geometry
        const geometry = GeometryFactory.create(geometryType, geometryData);

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: geometryData.color || 0x4488ff,
            shininess: 100,
            flatShading: false,
            side: THREE.DoubleSide
        });

        // Create mesh
        this.currentMesh = new THREE.Mesh(geometry, material);

        // Add wireframe overlay
        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
        );
        this.currentMesh.add(wireframe);

        // Reset rotation
        this.rotation = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };

        // Add to scene
        this.scene.add(this.currentMesh);

        // Set default camera angle
        this.setDefaultCameraAngle();

        console.log(`Loaded ${geometryType} geometry`);
    }

    /**
     * Set default camera angle based on configuration
     */
    setDefaultCameraAngle() {
        const angle = this.config.default_camera_angle || 'isometric';

        switch (angle) {
            case 'front':
                this.camera.position.set(0, 0, 8);
                break;
            case 'top':
                this.camera.position.set(0, 8, 0);
                break;
            case 'side':
                this.camera.position.set(8, 0, 0);
                break;
            case 'isometric':
            default:
                this.camera.position.set(5, 5, 5);
                break;
        }

        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Smooth rotation interpolation
        if (this.currentMesh) {
            this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.1;
            this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.1;

            this.currentMesh.rotation.x = this.rotation.x;
            this.currentMesh.rotation.y = this.rotation.y;

            // Auto-rotate if enabled
            if (this.autoRotate) {
                this.targetRotation.y += 0.005;
            }
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
     * Toggle auto-rotation
     */
    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        return this.autoRotate;
    }

    /**
     * Get current camera state
     * @returns {object}
     */
    getCameraState() {
        return {
            position: this.camera.position.toArray(),
            rotation: this.currentMesh ? {
                x: this.rotation.x,
                y: this.rotation.y
            } : null
        };
    }

    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.rotation = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.setDefaultCameraAngle();
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh.geometry.dispose();
            this.currentMesh.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
    }
}
