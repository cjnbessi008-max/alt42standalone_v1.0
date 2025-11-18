/**
 * Main Application Logic
 * Coordinates typography engine, spaced repetition, and storage
 */

class MathFormulaApp {
  constructor() {
    this.typography = new TypographyEngine();
    this.srs = new SpacedRepetitionSystem();
    this.storage = new StorageManager();

    this.formulas = [];
    this.currentFormula = null;
    this.currentFormulaIndex = 0;
    this.isAnimating = false;
    this.studyStartTime = null;
    this.formulasStudiedToday = 0;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.loadFormulas();
      this.setupEventListeners();
      this.updateUI();
      this.showNextFormula();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('앱을 초기화하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * Load all formulas from JSON files
   */
  async loadFormulas() {
    try {
      // Load index
      const indexResponse = await fetch('./data/formulas/index.json');
      const index = await indexResponse.json();

      // Load all formula files
      const promises = index.categories.map(async category => {
        const response = await fetch(`./data/formulas/${category.file}`);
        const data = await response.json();
        return data.formulas || [];
      });

      const results = await Promise.all(promises);
      this.formulas = results.flat();

      console.log(`Loaded ${this.formulas.length} formulas`);

      // Initialize cards for new formulas
      this.initializeNewCards();

    } catch (error) {
      console.error('Error loading formulas:', error);
      throw error;
    }
  }

  /**
   * Initialize SRS cards for formulas that don't have them yet
   */
  initializeNewCards() {
    this.formulas.forEach(formula => {
      let card = this.storage.getCard(formula.id);
      if (!card) {
        card = this.srs.initializeCard(formula.id);
        this.storage.saveCard(card);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Navigation buttons
    document.getElementById('prevBtn')?.addEventListener('click', () => this.previousFormula());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextFormula());
    document.getElementById('randomBtn')?.addEventListener('click', () => this.randomFormula());

    // Quality rating buttons (0-5)
    for (let i = 0; i <= 5; i++) {
      document.getElementById(`quality${i}`)?.addEventListener('click', () => this.rateFormula(i));
    }

    // Animation toggle
    document.getElementById('toggleAnimation')?.addEventListener('click', () => this.toggleAnimation());

    // Filter buttons
    document.getElementById('filterAll')?.addEventListener('click', () => this.filterFormulas('all'));
    document.getElementById('filterDue')?.addEventListener('click', () => this.filterFormulas('due'));
    document.getElementById('filterFavorites')?.addEventListener('click', () => this.filterFormulas('favorites'));

    // Favorite button
    document.getElementById('favoriteBtn')?.addEventListener('click', () => this.toggleFavorite());

    // Category selector
    document.getElementById('categorySelect')?.addEventListener('change', (e) => {
      this.filterByCategory(e.target.value);
    });

    // Settings
    document.getElementById('animationSpeed')?.addEventListener('change', (e) => {
      this.updateAnimationSpeed(parseInt(e.target.value));
    });
  }

  /**
   * Show next formula
   */
  nextFormula() {
    if (this.formulas.length === 0) return;

    this.currentFormulaIndex = (this.currentFormulaIndex + 1) % this.formulas.length;
    this.showCurrentFormula();
  }

  /**
   * Show previous formula
   */
  previousFormula() {
    if (this.formulas.length === 0) return;

    this.currentFormulaIndex = (this.currentFormulaIndex - 1 + this.formulas.length) % this.formulas.length;
    this.showCurrentFormula();
  }

  /**
   * Show random formula
   */
  randomFormula() {
    if (this.formulas.length === 0) return;

    this.currentFormulaIndex = Math.floor(Math.random() * this.formulas.length);
    this.showCurrentFormula();
  }

  /**
   * Show the current formula
   */
  showCurrentFormula() {
    this.currentFormula = this.formulas[this.currentFormulaIndex];
    this.displayFormula(this.currentFormula);
    this.updateFormulaInfo();

    if (this.isAnimating) {
      this.startTypographyAnimation();
    }
  }

  /**
   * Display formula with KaTeX
   */
  displayFormula(formula) {
    const formulaElement = document.getElementById('formulaDisplay');
    if (!formulaElement) return;

    try {
      // Render LaTeX with KaTeX
      katex.render(formula.formula, formulaElement, {
        throwOnError: false,
        displayMode: true
      });

      // Apply initial typography
      const variation = this.typography.getRandomVariation();
      this.typography.applyVariation(formulaElement, variation);

    } catch (error) {
      console.error('Error rendering formula:', error);
      formulaElement.textContent = formula.formula;
    }
  }

  /**
   * Update formula information display
   */
  updateFormulaInfo() {
    if (!this.currentFormula) return;

    document.getElementById('formulaName').textContent = this.currentFormula.name;
    document.getElementById('formulaCategory').textContent = this.currentFormula.category;
    document.getElementById('formulaDescription').textContent = this.currentFormula.description;
    document.getElementById('formulaDifficulty').textContent = this.currentFormula.difficulty;
    document.getElementById('formulaGrade').textContent = this.currentFormula.grade;

    // Update progress
    const card = this.storage.getCard(this.currentFormula.id);
    if (card) {
      const stats = this.srs.getCardStats(card);
      document.getElementById('masteryLevel').textContent = stats.masteryLevel;
      document.getElementById('nextReview').textContent = stats.nextReview;
      document.getElementById('successRate').textContent = stats.successRate;
    }

    // Update favorite button
    const isFavorite = this.storage.isFavorite(this.currentFormula.id);
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
      favoriteBtn.textContent = isFavorite ? '★' : '☆';
    }
  }

  /**
   * Rate formula quality (0-5)
   */
  rateFormula(quality) {
    if (!this.currentFormula) return;

    const card = this.storage.getCard(this.currentFormula.id) ||
                 this.srs.initializeCard(this.currentFormula.id);

    const updatedCard = this.srs.review(card, quality);
    this.storage.saveCard(updatedCard);

    // Update study session
    this.formulasStudiedToday++;
    const timeSpent = this.studyStartTime ?
      (Date.now() - this.studyStartTime) / 1000 : 0;
    this.storage.updateStudySession(1, timeSpent);
    this.studyStartTime = Date.now();

    // Show feedback
    this.showFeedback(quality);

    // Move to next formula
    setTimeout(() => {
      this.nextFormula();
    }, 1000);
  }

  /**
   * Show feedback based on quality rating
   */
  showFeedback(quality) {
    const messages = [
      '다시 복습이 필요해요!',
      '조금 더 연습해봐요!',
      '잘 기억하고 있어요!',
      '좋아요! 계속해봐요!',
      '훌륭해요!',
      '완벽해요! 🎉'
    ];

    const feedbackEl = document.getElementById('feedback');
    if (feedbackEl) {
      feedbackEl.textContent = messages[quality];
      feedbackEl.style.display = 'block';

      setTimeout(() => {
        feedbackEl.style.display = 'none';
      }, 2000);
    }
  }

  /**
   * Toggle typography animation
   */
  toggleAnimation() {
    this.isAnimating = !this.isAnimating;

    const toggleBtn = document.getElementById('toggleAnimation');
    if (toggleBtn) {
      toggleBtn.textContent = this.isAnimating ? '⏸ 애니메이션 중지' : '▶ 애니메이션 시작';
    }

    if (this.isAnimating) {
      this.startTypographyAnimation();
    } else {
      this.typography.stopAnimation();
    }
  }

  /**
   * Start typography animation
   */
  startTypographyAnimation() {
    const formulaElement = document.getElementById('formulaDisplay');
    const settings = this.storage.getSettings();

    if (formulaElement && settings) {
      this.typography.startAnimation(formulaElement, settings.animationSpeed);
    }
  }

  /**
   * Update animation speed
   */
  updateAnimationSpeed(speed) {
    this.storage.updateSetting('animationSpeed', speed);

    if (this.isAnimating) {
      this.typography.stopAnimation();
      this.startTypographyAnimation();
    }
  }

  /**
   * Filter formulas by type
   */
  filterFormulas(type) {
    let filteredFormulas;

    switch (type) {
      case 'due':
        const cards = this.formulas.map(f => this.storage.getCard(f.id)).filter(c => c);
        const dueCards = this.srs.getDueCards(cards);
        const dueIds = dueCards.map(c => c.id);
        filteredFormulas = this.formulas.filter(f => dueIds.includes(f.id));
        break;

      case 'favorites':
        const favorites = this.storage.getFavorites();
        filteredFormulas = this.formulas.filter(f => favorites.includes(f.id));
        break;

      case 'all':
      default:
        filteredFormulas = this.formulas;
        break;
    }

    // Update display
    this.formulas = filteredFormulas;
    this.currentFormulaIndex = 0;
    this.showCurrentFormula();
  }

  /**
   * Filter by category
   */
  filterByCategory(category) {
    if (category === 'all') {
      this.loadFormulas(); // Reload all
    } else {
      this.formulas = this.formulas.filter(f => f.category === category);
      this.currentFormulaIndex = 0;
      this.showCurrentFormula();
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite() {
    if (!this.currentFormula) return;

    const isFavorite = this.storage.isFavorite(this.currentFormula.id);

    if (isFavorite) {
      this.storage.removeFavorite(this.currentFormula.id);
    } else {
      this.storage.addFavorite(this.currentFormula.id);
    }

    this.updateFormulaInfo();
  }

  /**
   * Show next formula (used as entry point)
   */
  showNextFormula() {
    if (this.formulas.length > 0) {
      this.studyStartTime = Date.now();
      this.showCurrentFormula();
    }
  }

  /**
   * Update UI with statistics
   */
  updateUI() {
    const stats = this.storage.getStatistics();

    document.getElementById('totalFormulas').textContent = this.formulas.length;
    document.getElementById('studyStreak').textContent = stats.streak + '일';
    document.getElementById('totalStudied').textContent = stats.totalFormulasLearned;
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorEl = document.getElementById('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mathFormulaApp = new MathFormulaApp();
});
