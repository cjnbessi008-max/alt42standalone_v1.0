/**
 * Function Live Sync - Main Application
 * 메인 애플리케이션 로직 및 이벤트 핸들링
 */

class FunctionLiveSync {
  constructor() {
    this.parser = new FunctionParser();
    this.graph = null;
    this.currentProblem = null;
    this.sessionToken = null;
    this.syncInterval = null;
    this.lastExpression = '';

    this.config = {
      apiBaseUrl: '/backend/api',
      syncIntervalMs: 2000, // 2초마다 동기화
      debounceMs: 500 // 입력 후 500ms 후 파싱
    };

    this.debounceTimer = null;
  }

  /**
   * 초기화
   */
  async init() {
    try {
      // DOM 요소 가져오기
      this.elements = {
        functionInput: document.getElementById('function-input'),
        parseBtn: document.getElementById('parse-btn'),
        clearBtn: document.getElementById('clear-btn'),
        sampleSelect: document.getElementById('sample-select'),
        statusMessage: document.getElementById('status-message'),
        functionType: document.getElementById('function-type'),
        canvas: document.getElementById('graph-canvas'),
        problemTitle: document.getElementById('problem-title'),
        problemDesc: document.getElementById('problem-desc'),
        submitBtn: document.getElementById('submit-btn'),
        feedbackBox: document.getElementById('feedback-box')
      };

      // 그래프 렌더러 초기화
      this.graph = new GraphRenderer('graph-canvas', {
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
        gridSize: 1,
        animate: true
      });

      // 이벤트 리스너 등록
      this.attachEventListeners();

      // URL에서 문제 ID 가져오기
      const problemId = this.getProblemIdFromUrl();
      if (problemId) {
        await this.loadProblem(problemId);
      }

      // 세션 시작
      await this.startSession();

      this.showStatus('준비 완료! 함수식을 입력하세요.', 'success');
    } catch (error) {
      console.error('초기화 오류:', error);
      this.showStatus('초기화 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  attachEventListeners() {
    // 함수 입력 필드
    this.elements.functionInput.addEventListener('input', () => {
      this.onFunctionInputChange();
    });

    this.elements.functionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.parseAndRender();
      }
    });

    // 버튼들
    this.elements.parseBtn.addEventListener('click', () => {
      this.parseAndRender();
    });

    this.elements.clearBtn.addEventListener('click', () => {
      this.clearGraph();
    });

    this.elements.submitBtn.addEventListener('click', () => {
      this.submitAnswer();
    });

    // 샘플 함수 선택
    this.elements.sampleSelect.addEventListener('change', (e) => {
      const sample = e.target.value;
      if (sample) {
        this.elements.functionInput.value = sample;
        this.parseAndRender();
      }
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      if (this.graph) {
        this.graph.resize();
      }
    });
  }

  /**
   * 함수 입력 변경 시 (디바운싱 적용)
   */
  onFunctionInputChange() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.parseAndRender();
    }, this.config.debounceMs);
  }

  /**
   * 함수 파싱 및 그래프 렌더링
   */
  parseAndRender() {
    const expression = this.elements.functionInput.value.trim();

    if (!expression) {
      this.showStatus('함수식을 입력하세요.', 'warning');
      return;
    }

    // 이전 표현식과 같으면 무시
    if (expression === this.lastExpression) {
      return;
    }

    // 파싱
    const result = this.parser.parse(expression);

    if (!result.success) {
      this.showStatus(result.error, 'error');
      this.elements.functionType.textContent = '오류';
      return;
    }

    // 함수 타입 표시
    const functionType = this.parser.detectFunctionType(expression);
    const typeNames = {
      linear: '일차함수',
      quadratic: '이차함수',
      cubic: '삼차함수',
      trigonometric: '삼각함수',
      logarithmic: '로그함수',
      exponential: '지수함수',
      custom: '사용자 정의 함수'
    };
    this.elements.functionType.textContent = typeNames[functionType] || '알 수 없음';

    // 포인트 생성
    try {
      const points = this.parser.generatePoints(
        this.graph.options.xMin,
        this.graph.options.xMax,
        0.1
      );

      if (points.length === 0) {
        this.showStatus('유효한 그래프 포인트를 생성할 수 없습니다.', 'error');
        return;
      }

      // 그래프 업데이트 (애니메이션 포함)
      this.graph.updateGraph(points);

      this.showStatus(`함수 그래프가 그려졌습니다! (${points.length}개 포인트)`, 'success');
      this.lastExpression = expression;

      // 서버에 동기화
      this.syncToServer(expression, points);

    } catch (error) {
      console.error('그래프 렌더링 오류:', error);
      this.showStatus('그래프 렌더링 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * 그래프 지우기
   */
  clearGraph() {
    this.elements.functionInput.value = '';
    this.elements.functionType.textContent = '-';
    this.graph.clear();
    this.lastExpression = '';
    this.showStatus('그래프가 지워졌습니다.', 'info');
  }

  /**
   * 상태 메시지 표시
   */
  showStatus(message, type = 'info') {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status-message ${type}`;

    // 3초 후 자동 숨김
    setTimeout(() => {
      this.elements.statusMessage.textContent = '';
      this.elements.statusMessage.className = 'status-message';
    }, 3000);
  }

  /**
   * URL에서 문제 ID 가져오기
   */
  getProblemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('problem_id') || params.get('id') || 1;
  }

  /**
   * 문제 정보 로드 (Moodle/LMS에서)
   */
  async loadProblem(problemId) {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/problems.php?id=${problemId}`);
      const data = await response.json();

      if (data.success) {
        this.currentProblem = data.problem;

        // 문제 정보 표시
        this.elements.problemTitle.textContent = this.currentProblem.title;
        this.elements.problemDesc.textContent = this.currentProblem.description;

        // 초기 함수 설정
        if (this.currentProblem.initial_function) {
          this.elements.functionInput.value = this.currentProblem.initial_function;
          this.parseAndRender();
        }

        // 그래프 범위 설정
        if (this.graph) {
          this.graph.setRange(
            parseFloat(this.currentProblem.x_range_min),
            parseFloat(this.currentProblem.x_range_max),
            parseFloat(this.currentProblem.y_range_min),
            parseFloat(this.currentProblem.y_range_max)
          );
        }
      } else {
        this.showStatus('문제를 불러올 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('문제 로드 오류:', error);
      // 오프라인 모드로 동작
      this.currentProblem = {
        id: problemId,
        title: '오프라인 모드',
        description: '함수 그래프를 자유롭게 그려보세요.',
        initial_function: 'y = x'
      };
    }
  }

  /**
   * 세션 시작
   */
  async startSession() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          problem_id: this.currentProblem?.id || 1,
          student_id: this.getStudentId()
        })
      });

      const data = await response.json();

      if (data.success) {
        this.sessionToken = data.session_token;
        // 주기적 동기화 시작
        this.startSyncInterval();
      }
    } catch (error) {
      console.error('세션 시작 오류:', error);
      // 오프라인 모드로 계속
    }
  }

  /**
   * 서버 동기화
   */
  async syncToServer(expression, points) {
    if (!this.sessionToken) return;

    try {
      await fetch(`${this.config.apiBaseUrl}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_function',
          session_token: this.sessionToken,
          function_expression: expression,
          graph_data: points
        })
      });
    } catch (error) {
      console.error('동기화 오류:', error);
    }
  }

  /**
   * 주기적 동기화 시작
   */
  startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.lastExpression) {
        const points = this.parser.generatePoints(
          this.graph.options.xMin,
          this.graph.options.xMax,
          0.1
        );
        this.syncToServer(this.lastExpression, points);
      }
    }, this.config.syncIntervalMs);
  }

  /**
   * 답안 제출
   */
  async submitAnswer() {
    const expression = this.elements.functionInput.value.trim();

    if (!expression) {
      this.showStatus('답안을 입력하세요.', 'warning');
      return;
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_answer',
          session_token: this.sessionToken,
          submitted_function: expression
        })
      });

      const data = await response.json();

      if (data.success) {
        const feedback = data.is_correct
          ? '정답입니다! 🎉'
          : `아쉽네요. 다시 시도해보세요. (정확도: ${data.correctness_score}%)`;

        this.elements.feedbackBox.innerHTML = `
          <div class="feedback ${data.is_correct ? 'correct' : 'incorrect'}">
            ${feedback}
            ${data.feedback ? `<p>${data.feedback}</p>` : ''}
          </div>
        `;

        this.showStatus(feedback, data.is_correct ? 'success' : 'warning');
      }
    } catch (error) {
      console.error('답안 제출 오류:', error);
      this.showStatus('답안 제출 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * 학생 ID 가져오기 (Moodle 세션에서)
   */
  getStudentId() {
    // Moodle 세션에서 가져오거나, 임시 ID 생성
    const params = new URLSearchParams(window.location.search);
    return params.get('student_id') || 'demo_' + Math.random().toString(36).substr(2, 9);
  }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FunctionLiveSync();
  window.app.init();
});
