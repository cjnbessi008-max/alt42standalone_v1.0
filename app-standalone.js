/**
 * ALT42 Standalone Application
 * Main controller for offline-first PWA mode
 */

class StandaloneApp {
  constructor() {
    // Core components
    this.burstEffect = new BurstEffect();
    this.storageManager = storageManager; // From storage-manager.js
    this.graphVisualizer = null;
    this.mobileGraphVisualizer = null;

    // App state
    this.currentProblem = null;
    this.currentGraphId = null;
    this.problems = [];
    this.autoSaveInterval = null;

    this.init();
  }

  async init() {
    console.log('[App] Initializing standalone mode...');

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    try {
      // Initialize storage
      await this.initializeStorage();

      // Initialize graph visualizers
      this.graphVisualizer = new GraphVisualizer('graphCanvas', this.burstEffect);
      this.mobileGraphVisualizer = new GraphVisualizer('mobileGraphCanvas', this.burstEffect);

      // Setup UI controls
      this.setupControls();

      // Load sample problems
      await this.loadProblems();

      // Load random problem
      await this.loadRandomProblem();

      // Setup auto-save
      this.setupAutoSave();

      // Update stats periodically
      this.startStatsUpdate();

      // Request persistent storage
      if (pwaController) {
        await pwaController.requestPersistentStorage();
      }

      // Update status
      this.updateStatus('독립형 모드 준비 완료');

      console.log('[App] Initialization complete');
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      this.showError('초기화 실패: ' + error.message);
    }
  }

  /**
   * Initialize storage and load sample data
   */
  async initializeStorage() {
    console.log('[App] Initializing storage...');

    // Initialize storage manager
    await this.storageManager.init();

    // Initialize sample problems if needed
    const existingProblems = await this.storageManager.getAllProblems();

    if (existingProblems.length === 0) {
      console.log('[App] Loading sample problems...');
      await initializeSampleProblems(this.storageManager);
    }

    console.log('[App] Storage initialized');
  }

  /**
   * Load all problems from storage
   */
  async loadProblems() {
    this.problems = await this.storageManager.getAllProblems();
    console.log('[App] Loaded problems:', this.problems.length);
  }

  /**
   * Load random problem
   */
  async loadRandomProblem() {
    if (this.problems.length === 0) {
      this.showError('문제가 없습니다');
      return;
    }

    const randomProblem = this.problems[Math.floor(Math.random() * this.problems.length)];
    await this.loadProblem(randomProblem);
  }

  /**
   * Load specific problem
   */
  async loadProblem(problem) {
    this.currentProblem = problem;

    // Update problem info UI
    const problemInfo = document.getElementById('problemInfo');
    if (problemInfo) {
      problemInfo.innerHTML = `
        <h4>${problem.title}</h4>
        <p>${problem.description}</p>
        <p><strong>난이도:</strong> ${this.getDifficultyLabel(problem.difficulty)}</p>
        <p><strong>개념:</strong> ${problem.concepts.map(c => this.getConceptLabel(c)).join(', ')}</p>
        ${problem.questions ? `<p><strong>문제 수:</strong> ${problem.questions.length}개</p>` : ''}
      `;
    }

    // Apply graph data
    if (problem.graphData) {
      this.applyProblemGraph(problem.graphData);
    }

    // Save current problem to settings
    await this.storageManager.saveSetting('currentProblemId', problem.id);

    console.log('[App] Loaded problem:', problem.title);
  }

  /**
   * Apply problem graph data to visualizers
   */
  applyProblemGraph(graphData) {
    // Clear existing graphs
    this.graphVisualizer.clear();
    this.mobileGraphVisualizer.clear();

    const mainCanvas = this.graphVisualizer.canvas;
    const mobileCanvas = this.mobileGraphVisualizer.canvas;

    // Add nodes in circular layout
    graphData.nodes.forEach((nodeData, index) => {
      const angle = (index / graphData.nodes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(mainCanvas.width, mainCanvas.height) * 0.35;
      const centerX = mainCanvas.width / 2;
      const centerY = mainCanvas.height / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      this.graphVisualizer.addNode(x, y, nodeData.label, nodeData.concept);

      // Mobile graph
      const mobileRadius = Math.min(mobileCanvas.width, mobileCanvas.height) * 0.3;
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

  /**
   * Setup UI controls
   */
  setupControls() {
    // Next problem button
    const nextProblemBtn = document.createElement('button');
    nextProblemBtn.id = 'nextProblemBtn';
    nextProblemBtn.className = 'btn btn-primary';
    nextProblemBtn.textContent = '다음 문제';
    nextProblemBtn.addEventListener('click', () => this.loadRandomProblem());

    const controlGroup = document.querySelector('.control-group');
    if (controlGroup) {
      controlGroup.appendChild(nextProblemBtn);
    }

    // Add node button
    const addNodeBtn = document.getElementById('addNodeBtn');
    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => this.addRandomNode());
    }

    // Add edge button
    const addEdgeBtn = document.getElementById('addEdgeBtn');
    if (addEdgeBtn) {
      addEdgeBtn.addEventListener('click', () => this.addRandomEdge());
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearGraph());
    }

    // Save graph button
    const saveGraphBtn = document.createElement('button');
    saveGraphBtn.id = 'saveGraphBtn';
    saveGraphBtn.className = 'btn btn-primary';
    saveGraphBtn.textContent = '그래프 저장';
    saveGraphBtn.addEventListener('click', () => this.saveCurrentGraph());

    const graphControlGroup = document.querySelectorAll('.control-group')[1];
    if (graphControlGroup) {
      graphControlGroup.appendChild(saveGraphBtn);
    }

    // Burst effect controls
    const burstEnabled = document.getElementById('burstEnabled');
    if (burstEnabled) {
      burstEnabled.addEventListener('change', (e) => {
        this.burstEffect.setEnabled(e.target.checked);
      });
    }

    const particleSlider = document.getElementById('particleSlider');
    const particleCount = document.getElementById('particleCount');
    if (particleSlider && particleCount) {
      particleSlider.addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        particleCount.textContent = count;
        this.burstEffect.setParticleCount(count);
      });
    }

    const intensitySlider = document.getElementById('intensitySlider');
    const intensityValue = document.getElementById('intensityValue');
    if (intensitySlider && intensityValue) {
      intensitySlider.addEventListener('input', (e) => {
        const intensity = parseFloat(e.target.value);
        intensityValue.textContent = intensity.toFixed(1);
        this.burstEffect.setIntensity(intensity);
      });
    }
  }

  /**
   * Add random node
   */
  addRandomNode() {
    const canvas = this.graphVisualizer.canvas;
    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1;

    const labels = ['개념', '연산', '속성', '관계', '규칙', '방법'];
    const label = labels[Math.floor(Math.random() * labels.length)] + this.graphVisualizer.nodes.length;

    this.graphVisualizer.addNode(x, y, label);

    // Add to mobile view
    const mobileCanvas = this.mobileGraphVisualizer.canvas;
    const mobileX = (x / canvas.width) * mobileCanvas.width;
    const mobileY = (y / canvas.height) * mobileCanvas.height;
    this.mobileGraphVisualizer.addNode(mobileX, mobileY, label);
  }

  /**
   * Add random edge
   */
  addRandomEdge() {
    if (this.graphVisualizer.nodes.length < 2) {
      alert('최소 2개의 노드가 필요합니다');
      return;
    }

    const nodes = this.graphVisualizer.nodes;
    const from = Math.floor(Math.random() * nodes.length);
    let to = Math.floor(Math.random() * nodes.length);

    while (to === from) {
      to = Math.floor(Math.random() * nodes.length);
    }

    const labels = ['포함', '연산', '필요', '관계', '의존', '방법'];
    const label = labels[Math.floor(Math.random() * labels.length)];

    this.graphVisualizer.addEdge(from, to, label);
    this.mobileGraphVisualizer.addEdge(from, to, label);
  }

  /**
   * Clear graph
   */
  async clearGraph() {
    if (confirm('그래프를 초기화하시겠습니까?')) {
      this.graphVisualizer.clear();
      this.mobileGraphVisualizer.clear();
      this.burstEffect.clear();

      // Reload current problem
      if (this.currentProblem) {
        await this.loadProblem(this.currentProblem);
      }
    }
  }

  /**
   * Save current graph
   */
  async saveCurrentGraph() {
    try {
      const graphData = {
        problemId: this.currentProblem ? this.currentProblem.id : null,
        nodes: this.graphVisualizer.nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          label: node.label,
          concept: node.concept
        })),
        edges: this.graphVisualizer.edges.map(edge => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          label: edge.label
        })),
        intersections: this.graphVisualizer.intersections.length,
        name: `그래프 ${new Date().toLocaleString('ko-KR')}`
      };

      const graphId = await this.storageManager.saveGraph(graphData);
      this.currentGraphId = graphId;

      this.showSuccess('그래프가 저장되었습니다');
      console.log('[App] Graph saved:', graphId);
    } catch (error) {
      console.error('[App] Failed to save graph:', error);
      this.showError('그래프 저장 실패: ' + error.message);
    }
  }

  /**
   * Setup auto-save
   */
  setupAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(async () => {
      if (this.graphVisualizer.nodes.length > 0) {
        await this.saveCurrentGraph();
        console.log('[App] Auto-saved graph');
      }
    }, 30000);
  }

  /**
   * Start stats update loop
   */
  startStatsUpdate() {
    setInterval(() => {
      this.updateStats();
    }, 500);
  }

  /**
   * Update statistics
   */
  updateStats() {
    const mainStats = this.graphVisualizer.getStats();
    const mobileStats = this.mobileGraphVisualizer.getStats();

    const nodeCount = document.getElementById('nodeCount');
    const edgeCount = document.getElementById('edgeCount');
    const intersectionCount = document.getElementById('intersectionCount');

    if (nodeCount) nodeCount.textContent = mainStats.nodeCount;
    if (edgeCount) edgeCount.textContent = mainStats.edgeCount;
    if (intersectionCount) intersectionCount.textContent = mainStats.intersectionCount;

    const mobileIntersectionCount = document.getElementById('mobileIntersectionCount');
    if (mobileIntersectionCount) {
      mobileIntersectionCount.textContent = mobileStats.intersectionCount;
    }
  }

  /**
   * Update status text
   */
  updateStatus(text) {
    const statusText = document.getElementById('lmsText');
    if (statusText) {
      statusText.textContent = text;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (pwaController) {
      pwaController.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (pwaController) {
      pwaController.showNotification(message, 'error');
    } else {
      alert('오류: ' + message);
    }
  }

  /**
   * Get difficulty label in Korean
   */
  getDifficultyLabel(difficulty) {
    const labels = {
      'beginner': '초급',
      'easy': '쉬움',
      'medium': '보통',
      'hard': '어려움'
    };
    return labels[difficulty] || difficulty;
  }

  /**
   * Get concept label in Korean
   */
  getConceptLabel(concept) {
    const labels = {
      'fraction': '분수',
      'numerator': '분자',
      'denominator': '분모',
      'addition': '덧셈',
      'subtraction': '뺄셈',
      'multiplication': '곱셈',
      'division': '나눗셈',
      'common_denominator': '통분',
      'lcm': '최소공배수',
      'improper_fraction': '가분수',
      'mixed_number': '대분수',
      'decimal': '소수',
      'comparison': '비교',
      'word_problem': '응용문제'
    };
    return labels[concept] || concept;
  }

  /**
   * Export data
   */
  async exportData() {
    try {
      const data = await this.storageManager.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `alt42-export-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showSuccess('데이터 내보내기 완료');
    } catch (error) {
      console.error('[App] Export failed:', error);
      this.showError('내보내기 실패: ' + error.message);
    }
  }

  /**
   * Import data
   */
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      await this.storageManager.importData(data);

      this.showSuccess('데이터 가져오기 완료');
      window.location.reload();
    } catch (error) {
      console.error('[App] Import failed:', error);
      this.showError('가져오기 실패: ' + error.message);
    }
  }
}

// Initialize app
let app;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new StandaloneApp();
  });
} else {
  app = new StandaloneApp();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StandaloneApp;
}
