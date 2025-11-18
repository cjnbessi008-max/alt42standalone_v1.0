/**
 * Ancient Mathematics Explorer
 *
 * Journey through ancient civilizations and discover how they
 * developed mathematical concepts independently.
 */

import { MathApp, AppMetadata, PlanetType } from '../framework/app-framework.js';

export class AncientMathematicsApp extends MathApp {
  private currentCivilization: number = 0;
  private civilizations = [
    {
      name: 'Babylonian',
      period: '2000-500 BCE',
      contributions: [
        'Base-60 number system (still used in time!)',
        'Pythagorean theorem (before Pythagoras!)',
        'Quadratic equations',
        'Astronomical calculations'
      ],
      famousProblems: [
        {
          problem: 'Find the side of a square with area 1800',
          solution: '√1800 ≈ 42.43',
          babylonianMethod: 'Used successive approximations'
        }
      ],
      artifacts: ['Plimpton 322 tablet', 'YBC 7289']
    },
    {
      name: 'Egyptian',
      period: '3000-300 BCE',
      contributions: [
        'Practical geometry for land surveying',
        'Fraction system',
        'π approximation (256/81 ≈ 3.16)',
        'Volume calculations for pyramids'
      ],
      famousProblems: [
        {
          problem: 'Rhind Papyrus Problem 50: Circle area',
          solution: 'A = (8/9 × d)²',
          egyptianMethod: 'Empirical approximation'
        }
      ],
      artifacts: ['Rhind Papyrus', 'Moscow Papyrus']
    },
    {
      name: 'Greek',
      period: '600 BCE - 600 CE',
      contributions: [
        'Axiomatic approach to geometry',
        'Proof-based mathematics',
        'Number theory',
        'Irrational numbers discovery'
      ],
      famousProblems: [
        {
          problem: 'Prove √2 is irrational',
          solution: 'Proof by contradiction',
          method: 'Assume √2 = p/q in lowest terms, derive contradiction'
        }
      ],
      artifacts: ['Euclid\'s Elements', 'Archimedes\' works']
    },
    {
      name: 'Chinese',
      period: '1000 BCE - 1300 CE',
      contributions: [
        'Negative numbers',
        'Decimal system',
        'Chinese Remainder Theorem',
        'Pascal\'s triangle (600 years before Pascal!)'
      ],
      famousProblems: [
        {
          problem: 'Nine Chapters: 100 birds problem',
          solution: 'System of linear equations',
          method: 'Fangcheng (rectangular arrays) - ancient matrix methods!'
        }
      ],
      artifacts: ['Nine Chapters on Mathematical Art']
    },
    {
      name: 'Indian',
      period: '500 BCE - 1200 CE',
      contributions: [
        'Zero as a number',
        'Decimal place-value system',
        'Trigonometry',
        'Infinite series'
      ],
      famousProblems: [
        {
          problem: 'Brahmagupta: Pell\'s equation x² - 61y² = 1',
          solution: 'Chakravala method (cyclic method)',
          impact: 'Solved centuries before European mathematicians'
        }
      ],
      artifacts: ['Bakhshali Manuscript', 'Brahmasphutasiddhanta']
    },
    {
      name: 'Islamic Golden Age',
      period: '800 - 1400 CE',
      contributions: [
        'Algebra as a discipline',
        'Algebraic notation',
        'Cubic equations',
        'Spherical trigonometry'
      ],
      famousProblems: [
        {
          problem: 'Al-Khwarizmi: x² + 10x = 39',
          solution: 'Complete the square method',
          impact: 'Foundation of modern algebra'
        }
      ],
      artifacts: ['Al-Khwarizmi\'s "Al-Jabr"', 'Omar Khayyam\'s geometric solutions']
    }
  ];

  async initialize(): Promise<void> {
    console.log('🏛️ Ancient Mathematics Explorer initializing...');
  }

  render(container: HTMLElement): void {
    const civ = this.civilizations[this.currentCivilization];

    container.innerHTML = `
      <div class="ancient-math-app">
        <div class="timeline-header">
          <h1>🏛️ Ancient Mathematics Explorer</h1>
          <div class="progress">${this.currentCivilization + 1} / ${this.civilizations.length}</div>
        </div>

        <div class="civilization-card">
          <div class="civ-header">
            <h2>${civ.name} Mathematics</h2>
            <span class="period">${civ.period}</span>
          </div>

          <div class="contributions">
            <h3>🌟 Major Contributions</h3>
            <ul>
              ${civ.contributions.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>

          <div class="famous-problems">
            <h3>💡 Famous Problems</h3>
            ${civ.famousProblems.map(p => `
              <div class="problem-card">
                <div class="problem-text"><strong>Problem:</strong> ${p.problem}</div>
                <div class="solution"><strong>Solution:</strong> ${p.solution}</div>
                <div class="method"><strong>Method:</strong> ${p.babylonianMethod || p.egyptianMethod || p.method}</div>
                ${p.impact ? `<div class="impact"><strong>Impact:</strong> ${p.impact}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="artifacts">
            <h3>📜 Historical Artifacts</h3>
            <ul>
              ${civ.artifacts.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>

          <div class="try-it">
            <h3>🎮 Try It Yourself!</h3>
            <p>Solve a problem using ${civ.name} methods</p>
            <button class="btn-try">Start Challenge</button>
          </div>
        </div>

        <div class="navigation">
          <button id="btn-prev" ${this.currentCivilization === 0 ? 'disabled' : ''}>
            ← Previous Civilization
          </button>
          <button id="btn-next" ${this.currentCivilization === this.civilizations.length - 1 ? 'disabled' : ''}>
            Next Civilization →
          </button>
        </div>

        <div class="mastery">
          <div class="mastery-bar">
            <div class="mastery-fill" style="width: ${this.state.masteryLevel * 100}%"></div>
          </div>
          <div class="mastery-text">Mastery: ${(this.state.masteryLevel * 100).toFixed(0)}%</div>
        </div>
      </div>

      <style>
        .ancient-math-app {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%);
          min-height: 100vh;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .timeline-header h1 {
          margin: 0;
          color: #8b4513;
        }

        .progress {
          font-size: 1.2em;
          font-weight: bold;
          color: #d4a574;
        }

        .civilization-card {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          margin-bottom: 20px;
        }

        .civ-header {
          border-bottom: 3px solid #d4a574;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .civ-header h2 {
          margin: 0;
          color: #8b4513;
        }

        .period {
          background: #d4a574;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9em;
        }

        .contributions, .famous-problems, .artifacts, .try-it {
          margin: 25px 0;
        }

        .contributions h3, .famous-problems h3, .artifacts h3, .try-it h3 {
          color: #8b4513;
          margin-bottom: 15px;
        }

        .contributions ul, .artifacts ul {
          list-style: none;
          padding: 0;
        }

        .contributions li, .artifacts li {
          padding: 10px;
          margin: 8px 0;
          background: #f5e6d3;
          border-left: 4px solid #d4a574;
          border-radius: 5px;
        }

        .problem-card {
          background: #fef8f0;
          padding: 20px;
          margin: 15px 0;
          border-radius: 10px;
          border: 2px solid #d4a574;
        }

        .problem-card div {
          margin: 10px 0;
          line-height: 1.6;
        }

        .impact {
          background: #e8f4f8;
          padding: 10px;
          border-radius: 5px;
          border-left: 4px solid #4a90e2;
        }

        .btn-try {
          background: linear-gradient(135deg, #d4a574 0%, #8b4513 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 1.1em;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-try:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(139, 69, 19, 0.3);
        }

        .navigation {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin: 20px 0;
        }

        .navigation button {
          flex: 1;
          padding: 15px 30px;
          background: white;
          border: 2px solid #d4a574;
          border-radius: 10px;
          font-size: 1.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .navigation button:not(:disabled):hover {
          background: #d4a574;
          color: white;
          transform: scale(1.05);
        }

        .navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mastery {
          margin-top: 30px;
        }

        .mastery-bar {
          height: 30px;
          background: #e0e0e0;
          border-radius: 15px;
          overflow: hidden;
        }

        .mastery-fill {
          height: 100%;
          background: linear-gradient(90deg, #d4a574 0%, #8b4513 100%);
          transition: width 0.5s ease;
        }

        .mastery-text {
          text-align: center;
          margin-top: 10px;
          font-weight: bold;
          color: #8b4513;
        }
      </style>
    `;

    // Attach event listeners
    const btnPrev = container.querySelector('#btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#btn-next') as HTMLButtonElement;
    const btnTry = container.querySelector('.btn-try') as HTMLButtonElement;

    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.previousCivilization());
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextCivilization());
    }

    if (btnTry) {
      btnTry.addEventListener('click', () => this.startChallenge());
    }
  }

  start(): void {
    console.log('🏛️ Ancient Mathematics Explorer started');
  }

  pause(): void {}

  resume(): void {}

  reset(): void {
    this.currentCivilization = 0;
    this.updateState({ currentLevel: 1, score: 0 });
    if (this.container) this.render(this.container);
  }

  destroy(): void {
    console.log('🏛️ Ancient Mathematics Explorer destroyed');
  }

  processInput(input: any): void {}

  checkAnswer(answer: any): boolean {
    return false;
  }

  provideHint(): string {
    return "Think about how ancient mathematicians approached problems without modern notation!";
  }

  private previousCivilization(): void {
    if (this.currentCivilization > 0) {
      this.currentCivilization--;
      if (this.container) this.render(this.container);
    }
  }

  private nextCivilization(): void {
    if (this.currentCivilization < this.civilizations.length - 1) {
      this.currentCivilization++;
      this.updateState({ masteryLevel: this.currentCivilization / this.civilizations.length });
      if (this.container) this.render(this.container);
    }
  }

  private startChallenge(): void {
    alert('🎮 Challenge mode coming soon! You\'ll solve authentic ancient mathematical problems.');
    this.recordAttempt(true);
  }
}

// App metadata
export const metadata: AppMetadata = {
  id: 'history-ancient-math',
  name: 'Ancient Mathematics Explorer',
  description: 'Journey through ancient civilizations and discover their mathematical innovations',
  planet: 'history',
  category: 'history',
  version: '1.0.0',
  author: 'KTM Universe',

  difficulty: 0.3,
  estimatedTime: 20,
  concepts: [
    {
      id: 'ancient-math',
      name: 'Ancient Mathematics',
      planet: 'history',
      prerequisites: [],
      relatedConcepts: ['number-systems', 'geometry', 'algebra-origins']
    }
  ],
  learningObjectives: [
    'Understand how mathematics developed independently across civilizations',
    'Recognize contributions from non-European cultures',
    'Appreciate the evolution of mathematical thinking',
    'Connect ancient methods to modern mathematics'
  ],
  prerequisites: [],

  adaptiveDifficulty: false,
  emotionalAwareness: true,
  progressTracking: true,

  fullscreen: false,
  responsive: true,
  theme: 'planet-themed',

  hasAchievements: true,
  hasLeaderboard: false,
  pointsAwarded: 100,

  tags: ['history', 'culture', 'ancient', 'timeline'],
  keywords: ['babylonian', 'egyptian', 'greek', 'chinese', 'indian', 'islamic', 'ancient math']
};
