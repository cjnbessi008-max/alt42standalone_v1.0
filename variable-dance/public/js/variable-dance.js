/**
 * Variable Dance - Core Logic
 * 변수가 이동함에 따라 해집합이 춤추듯 바뀌는 핵심 로직
 */

class VariableDance {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.currentProblem = null;
        this.currentVariables = {};
        this.currentSolution = null;
        this.sessionId = null;
        this.studentId = 1; // 데모용 학생 ID
        this.eventHistory = [];
    }

    /**
     * 문제 로드
     */
    async loadProblem(problemId) {
        try {
            this.currentProblem = await API.getProblem(problemId);
            this.initializeVariables();
            await this.createSession();
            this.updateUI();
            await this.calculateAndVisualize();

            return this.currentProblem;
        } catch (error) {
            console.error('Failed to load problem:', error);
            throw error;
        }
    }

    /**
     * 변수 초기화
     */
    initializeVariables() {
        if (!this.currentProblem) return;

        const varDefs = this.currentProblem.variables;

        for (const [name, def] of Object.entries(varDefs)) {
            this.currentVariables[name] = def.initial;
        }
    }

    /**
     * 학습 세션 생성
     */
    async createSession() {
        try {
            const result = await API.createSession(this.studentId, this.currentProblem.id);
            this.sessionId = result.session_id;
            console.log('Session created:', this.sessionId);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    }

    /**
     * 변수 값 변경
     */
    async changeVariable(name, newValue) {
        const oldValue = this.currentVariables[name];

        if (oldValue === newValue) return;

        // 이전 해집합 저장
        const solutionBefore = { ...this.currentSolution };

        // 변수 업데이트
        this.currentVariables[name] = newValue;

        // 새로운 해집합 계산
        await this.calculateAndVisualize();

        // 이벤트 로깅
        if (this.sessionId) {
            await this.logVariableChange(name, oldValue, newValue, solutionBefore, this.currentSolution);
        }

        // 춤추는 애니메이션 트리거
        this.visualizer.triggerDanceEffect();

        // 이벤트 히스토리 저장
        this.eventHistory.push({
            timestamp: new Date(),
            variable: name,
            oldValue: oldValue,
            newValue: newValue,
            solution: { ...this.currentSolution }
        });
    }

    /**
     * 해집합 계산 및 시각화
     */
    async calculateAndVisualize() {
        try {
            this.currentSolution = await API.calculateSolution(
                this.currentProblem.id,
                this.currentVariables
            );

            // 시각화
            this.visualizer.animateSolution(
                null,
                this.currentSolution,
                this.currentProblem.problem_type
            );

            // UI 업데이트
            this.updateSolutionDisplay();

        } catch (error) {
            console.error('Failed to calculate solution:', error);
        }
    }

    /**
     * 변수 변경 이벤트 로깅
     */
    async logVariableChange(name, oldValue, newValue, solutionBefore, solutionAfter) {
        try {
            await API.logEvent(
                this.sessionId,
                name,
                oldValue,
                newValue,
                solutionBefore,
                solutionAfter
            );
        } catch (error) {
            console.error('Failed to log event:', error);
        }
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        if (!this.currentProblem) return;

        // 문제 제목
        document.getElementById('problemTitle').textContent = this.currentProblem.title;

        // 문제 설명
        document.getElementById('problemDescription').textContent = this.currentProblem.description;

        // 방정식 표시
        const equationText = this.formatEquation(this.currentProblem.equation, this.currentVariables);
        document.getElementById('equationText').textContent = equationText;

        // 변수 컨트롤 생성
        this.createVariableControls();
    }

    /**
     * 방정식 포맷팅
     */
    formatEquation(equation, variables) {
        let formatted = equation.equation || '';

        // 변수 값을 대입하여 표시
        for (const [name, value] of Object.entries(variables)) {
            const displayValue = value >= 0 ? value : `(${value})`;
            formatted = formatted.replace(new RegExp(name, 'g'), displayValue);
        }

        return formatted;
    }

    /**
     * 변수 컨트롤 UI 생성
     */
    createVariableControls() {
        const container = document.getElementById('variableControls');
        container.innerHTML = '';

        const varDefs = this.currentProblem.variables;

        for (const [name, def] of Object.entries(varDefs)) {
            const control = document.createElement('div');
            control.className = 'variable-control';

            control.innerHTML = `
                <div class="variable-label">
                    <span class="variable-name">${name}</span>
                    <span class="variable-value" id="value-${name}">${def.initial}</span>
                </div>
                <input
                    type="range"
                    class="variable-slider"
                    id="slider-${name}"
                    min="${def.min}"
                    max="${def.max}"
                    step="${def.step}"
                    value="${def.initial}"
                    data-variable="${name}"
                />
            `;

            container.appendChild(control);

            // 슬라이더 이벤트 리스너
            const slider = control.querySelector(`#slider-${name}`);
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.onSliderChange(name, value);
            });
        }
    }

    /**
     * 슬라이더 변경 핸들러
     */
    async onSliderChange(name, value) {
        // 값 표시 업데이트
        document.getElementById(`value-${name}`).textContent = value;

        // 방정식 표시 업데이트
        this.currentVariables[name] = value;
        const equationText = this.formatEquation(this.currentProblem.equation, this.currentVariables);
        document.getElementById('equationText').textContent = equationText;

        // 변수 변경 처리 (디바운싱)
        if (this.sliderTimeout) {
            clearTimeout(this.sliderTimeout);
        }

        this.sliderTimeout = setTimeout(async () => {
            await this.changeVariable(name, value);
        }, 100); // 100ms 디바운스
    }

    /**
     * 해 표시 업데이트
     */
    updateSolutionDisplay() {
        const solutionTextEl = document.getElementById('solutionText');

        if (!this.currentSolution) {
            solutionTextEl.textContent = '해를 계산할 수 없습니다.';
            return;
        }

        let displayText = '';

        switch (this.currentSolution.type) {
            case 'single':
                displayText = `✅ ${this.currentSolution.description}`;
                break;

            case 'double':
                displayText = `🔄 ${this.currentSolution.description}`;
                break;

            case 'two_real':
                displayText = `✅ ${this.currentSolution.description}`;
                break;

            case 'unique':
                displayText = `✅ ${this.currentSolution.description}`;
                break;

            case 'complex':
                displayText = `❌ ${this.currentSolution.description}`;
                break;

            case 'none':
                displayText = `❌ ${this.currentSolution.description}`;
                break;

            case 'infinite':
                displayText = `♾️ ${this.currentSolution.description}`;
                break;

            default:
                displayText = this.currentSolution.description || '알 수 없는 해';
        }

        // 방정식도 표시
        if (this.currentSolution.equation) {
            displayText += `\n\n📐 ${this.currentSolution.equation}`;
        }

        if (this.currentSolution.equations) {
            displayText += `\n\n📐 ${this.currentSolution.equations.join('\n📐 ')}`;
        }

        // 판별식 표시 (이차방정식)
        if (this.currentSolution.discriminant !== undefined) {
            displayText += `\n\n📊 판별식: ${this.currentSolution.discriminant.toFixed(2)}`;
        }

        solutionTextEl.textContent = displayText;

        // 해 타입에 따라 스타일 변경
        const solutionDisplay = document.getElementById('solutionDisplay');
        solutionDisplay.style.borderLeftColor =
            this.currentSolution.type === 'none' || this.currentSolution.type === 'complex'
                ? '#ef4444'
                : '#10b981';
    }

    /**
     * 세션 완료
     */
    async completeSession(score = 100) {
        if (!this.sessionId) return;

        try {
            await API.completeSession(this.sessionId, score);
            console.log('Session completed with score:', score);
        } catch (error) {
            console.error('Failed to complete session:', error);
        }
    }

    /**
     * 통계 정보
     */
    getStatistics() {
        return {
            totalChanges: this.eventHistory.length,
            problemType: this.currentProblem?.problem_type,
            currentSolution: this.currentSolution,
            sessionId: this.sessionId
        };
    }
}
