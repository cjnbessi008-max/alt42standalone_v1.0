/**
 * ALT42 Main Application
 * Initializes and coordinates all components
 */

class App {
    constructor() {
        // Initialize components
        this.burstEffect = new BurstEffect();
        this.meltEffect = new MeltIntersectionEffect();
        this.lmsConnector = new LMSConnector();
        this.graphVisualizer = null;
        this.mobileGraphVisualizer = null;

        this.problemData = null;
        this.intersectionDetailsModal = null;

        this.init();
    }

    async init() {
        console.log('[App] Initializing ALT42 Intersection Burst Visualizer...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        // Initialize graph visualizers with both burst and melt effects
        this.graphVisualizer = new GraphVisualizer('graphCanvas', this.burstEffect, this.meltEffect);
        this.mobileGraphVisualizer = new GraphVisualizer('mobileGraphCanvas', this.burstEffect, this.meltEffect);

        // Setup UI controls
        this.setupControls();

        // Connect to LMS
        await this.connectToLMS();

        // Load problem data
        await this.loadProblemData();

        // Setup modal
        this.setupModal();

        // Start update loop
        this.updateStats();
        setInterval(() => this.updateStats(), 500);

        console.log('[App] Initialization complete');
    }

    async connectToLMS() {
        this.lmsConnector.updateStatus('connecting');

        try {
            await this.lmsConnector.connect();
            console.log('[App] LMS connected successfully');

            // Track session start
            await this.lmsConnector.trackInteraction('session_start', {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[App] LMS connection failed:', error);
        }
    }

    async loadProblemData() {
        try {
            this.problemData = await this.lmsConnector.fetchProblemData();

            // Update problem info display
            const problemInfo = document.getElementById('problemInfo');
            if (problemInfo && this.problemData) {
                problemInfo.innerHTML = `
                    <h4>${this.problemData.title}</h4>
                    <p>${this.problemData.description}</p>
                    <p><strong>난이도:</strong> ${this.problemData.difficulty}</p>
                    <p><strong>개념:</strong> ${this.problemData.concepts.join(', ')}</p>
                `;
            }

            // Apply graph data if available
            if (this.problemData.graphData) {
                this.applyProblemGraph(this.problemData.graphData);
            }
        } catch (error) {
            console.error('[App] Failed to load problem data:', error);
        }
    }

    applyProblemGraph(graphData) {
        // Clear existing graphs
        this.graphVisualizer.clear();
        this.mobileGraphVisualizer.clear();

        const mainCanvas = this.graphVisualizer.canvas;
        const mobileCanvas = this.mobileGraphVisualizer.canvas;

        // Add nodes to both visualizers
        graphData.nodes.forEach((nodeData, index) => {
            // Position nodes in a circle for main graph
            const angle = (index / graphData.nodes.length) * Math.PI * 2;
            const radius = Math.min(mainCanvas.width, mainCanvas.height) * 0.3;
            const centerX = mainCanvas.width / 2;
            const centerY = mainCanvas.height / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            this.graphVisualizer.addNode(x, y, nodeData.label, nodeData.concept);

            // Mobile graph (smaller, centered)
            const mobileRadius = Math.min(mobileCanvas.width, mobileCanvas.height) * 0.25;
            const mobileCenterX = mobileCanvas.width / 2;
            const mobileCenterY = mobileCanvas.height / 2;
            const mobileX = mobileCenterX + Math.cos(angle) * mobileRadius;
            const mobileY = mobileCenterY + Math.sin(angle) * mobileRadius;

            this.mobileGraphVisualizer.addNode(mobileX, mobileY, nodeData.label, nodeData.concept);
        });

        // Add edges
        graphData.edges.forEach(edgeData => {
            this.graphVisualizer.addEdge(edgeData.from, edgeData.to, edgeData.label);
            this.mobileGraphVisualizer.addEdge(edgeData.from, edgeData.to, edgeData.label);
        });
    }

    setupControls() {
        // Add Node button
        const addNodeBtn = document.getElementById('addNodeBtn');
        if (addNodeBtn) {
            addNodeBtn.addEventListener('click', () => this.addRandomNode());
        }

        // Add Edge button
        const addEdgeBtn = document.getElementById('addEdgeBtn');
        if (addEdgeBtn) {
            addEdgeBtn.addEventListener('click', () => this.addRandomEdge());
        }

        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearGraph());
        }

        // Burst enabled checkbox
        const burstEnabled = document.getElementById('burstEnabled');
        if (burstEnabled) {
            burstEnabled.addEventListener('change', (e) => {
                this.burstEffect.setEnabled(e.target.checked);
            });
        }

        // Melt enabled checkbox
        const meltEnabled = document.getElementById('meltEnabled');
        if (meltEnabled) {
            meltEnabled.addEventListener('change', (e) => {
                this.meltEffect.setEnabled(e.target.checked);
            });
        }

        // Particle count slider (Burst)
        const particleSlider = document.getElementById('particleSlider');
        const particleCount = document.getElementById('particleCount');
        if (particleSlider && particleCount) {
            particleSlider.addEventListener('input', (e) => {
                const count = parseInt(e.target.value);
                particleCount.textContent = count;
                this.burstEffect.setParticleCount(count);
            });
        }

        // Melt particle count slider
        const meltParticleSlider = document.getElementById('meltParticleSlider');
        const meltParticleCount = document.getElementById('meltParticleCount');
        if (meltParticleSlider && meltParticleCount) {
            meltParticleSlider.addEventListener('input', (e) => {
                const count = parseInt(e.target.value);
                meltParticleCount.textContent = count;
                this.meltEffect.setParticleCount(count);
            });
        }

        // Intensity slider (applies to both effects)
        const intensitySlider = document.getElementById('intensitySlider');
        const intensityValue = document.getElementById('intensityValue');
        if (intensitySlider && intensityValue) {
            intensitySlider.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                intensityValue.textContent = intensity.toFixed(1);
                this.burstEffect.setIntensity(intensity);
                this.meltEffect.setIntensity(intensity);
            });
        }
    }

    setupModal() {
        this.intersectionDetailsModal = document.getElementById('intersectionModal');
        const closeBtn = this.intersectionDetailsModal?.querySelector('.modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.intersectionDetailsModal) {
            this.intersectionDetailsModal.addEventListener('click', (e) => {
                if (e.target === this.intersectionDetailsModal) {
                    this.closeModal();
                }
            });
        }
    }

    showIntersectionDetails(intersection) {
        if (!this.intersectionDetailsModal) return;

        const detailsDiv = document.getElementById('intersectionDetails');
        if (detailsDiv) {
            detailsDiv.innerHTML = `
                <p><strong>교점 좌표:</strong> (${Math.round(intersection.x)}, ${Math.round(intersection.y)})</p>
                <p><strong>연결된 개념:</strong></p>
                <ul>
                    <li>엣지 1: ${intersection.edge1.label || '연결'}</li>
                    <li>엣지 2: ${intersection.edge2.label || '연결'}</li>
                </ul>
                <p>이 교점은 두 개념 간의 관계를 나타냅니다.</p>
            `;
        }

        this.intersectionDetailsModal.classList.add('active');

        // Track interaction
        this.lmsConnector.trackInteraction('intersection_viewed', {
            x: intersection.x,
            y: intersection.y
        });
    }

    closeModal() {
        if (this.intersectionDetailsModal) {
            this.intersectionDetailsModal.classList.remove('active');
        }
    }

    addRandomNode() {
        const canvas = this.graphVisualizer.canvas;
        const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        const y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1;

        const labels = ['개념', '연산', '속성', '관계', '규칙'];
        const label = labels[Math.floor(Math.random() * labels.length)];

        this.graphVisualizer.addNode(x, y, label + this.graphVisualizer.nodes.length);

        // Add to mobile view with scaled coordinates
        const mobileCanvas = this.mobileGraphVisualizer.canvas;
        const mobileX = (x / canvas.width) * mobileCanvas.width;
        const mobileY = (y / canvas.height) * mobileCanvas.height;
        this.mobileGraphVisualizer.addNode(mobileX, mobileY, label + this.mobileGraphVisualizer.nodes.length);

        // Track interaction
        this.lmsConnector.trackInteraction('node_added', { label, x, y });
    }

    addRandomEdge() {
        if (this.graphVisualizer.nodes.length < 2) {
            alert('최소 2개의 노드가 필요합니다');
            return;
        }

        const nodes = this.graphVisualizer.nodes;
        const from = Math.floor(Math.random() * nodes.length);
        let to = Math.floor(Math.random() * nodes.length);

        // Ensure different nodes
        while (to === from) {
            to = Math.floor(Math.random() * nodes.length);
        }

        const labels = ['포함', '연산', '필요', '관계', '의존'];
        const label = labels[Math.floor(Math.random() * labels.length)];

        this.graphVisualizer.addEdge(from, to, label);
        this.mobileGraphVisualizer.addEdge(from, to, label);

        // Track interaction
        this.lmsConnector.trackInteraction('edge_added', { from, to, label });
    }

    clearGraph() {
        this.graphVisualizer.clear();
        this.mobileGraphVisualizer.clear();
        this.burstEffect.clear();
        this.meltEffect.clear();

        // Reload problem data
        this.loadProblemData();

        // Track interaction
        this.lmsConnector.trackInteraction('graph_cleared', {});
    }

    updateStats() {
        const mainStats = this.graphVisualizer.getStats();
        const mobileStats = this.mobileGraphVisualizer.getStats();

        // Update main stats
        const nodeCount = document.getElementById('nodeCount');
        const edgeCount = document.getElementById('edgeCount');
        const intersectionCount = document.getElementById('intersectionCount');

        if (nodeCount) nodeCount.textContent = mainStats.nodeCount;
        if (edgeCount) edgeCount.textContent = mainStats.edgeCount;
        if (intersectionCount) intersectionCount.textContent = mainStats.intersectionCount;

        // Update mobile stats
        const mobileIntersectionCount = document.getElementById('mobileIntersectionCount');
        if (mobileIntersectionCount) {
            mobileIntersectionCount.textContent = mobileStats.intersectionCount;
        }
    }
}

// Initialize app when script loads
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
    });
} else {
    app = new App();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
