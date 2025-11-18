/**
 * Recommendations Module
 * Handles personalized learning recommendations
 */

const Recommendations = {
    apiUrl: '',
    userId: null,

    /**
     * Initialize recommendations module
     */
    init(apiUrl, userId) {
        this.apiUrl = apiUrl.replace('problem_handler.php', 'recommendation_handler.php');
        this.userId = userId;
    },

    /**
     * Get comprehensive recommendations
     */
    async getRecommendations(limit = 5) {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_recommendations?user_id=${this.userId}&limit=${limit}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.recommendations;
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            return null;
        }
    },

    /**
     * Get next recommended problem
     */
    async getNextProblem() {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_next_problem?user_id=${this.userId}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Failed to get next problem:', error);
            return null;
        }
    },

    /**
     * Get performance summary
     */
    async getPerformanceSummary() {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_performance_summary?user_id=${this.userId}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.summary;
        } catch (error) {
            console.error('Failed to get performance summary:', error);
            return null;
        }
    },

    /**
     * Get detailed skill analysis
     */
    async getSkillAnalysis() {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_skill_analysis?user_id=${this.userId}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Failed to get skill analysis:', error);
            return null;
        }
    },

    /**
     * Get learning path
     */
    async getLearningPath() {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_learning_path?user_id=${this.userId}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Failed to get learning path:', error);
            return null;
        }
    },

    /**
     * Create learning path
     */
    async createLearningPath(targetSkills = null, pathName = null) {
        try {
            const response = await fetch(
                `${this.apiUrl}/create_learning_path`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: this.userId,
                        target_skills: targetSkills,
                        path_name: pathName
                    })
                }
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Failed to create learning path:', error);
            return null;
        }
    },

    /**
     * Get recommended difficulty
     */
    async getRecommendedDifficulty() {
        try {
            const response = await fetch(
                `${this.apiUrl}/get_recommended_difficulty?user_id=${this.userId}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.recommended_difficulty;
        } catch (error) {
            console.error('Failed to get recommended difficulty:', error);
            return 'basic';
        }
    },

    /**
     * Display recommendations in UI
     */
    async displayRecommendations(containerElement) {
        const recommendations = await this.getRecommendations();

        if (!recommendations) {
            containerElement.innerHTML = '<p>추천을 불러올 수 없습니다.</p>';
            return;
        }

        const html = this.renderRecommendations(recommendations);
        containerElement.innerHTML = html;

        // Attach event listeners
        this.attachEventListeners(containerElement, recommendations);
    },

    /**
     * Render recommendations HTML
     */
    renderRecommendations(recommendations) {
        const { summary, next_problem, recommended_difficulty, suggestions } = recommendations;

        let html = '<div class="recommendations-container">';

        // Performance overview
        if (summary) {
            html += this.renderPerformanceOverview(summary);
        }

        // Next problem recommendation
        if (next_problem) {
            html += this.renderNextProblem(next_problem);
        }

        // Difficulty recommendation
        if (recommended_difficulty && summary &&
            summary.current_difficulty !== recommended_difficulty) {
            html += this.renderDifficultyRecommendation(
                summary.current_difficulty,
                recommended_difficulty
            );
        }

        // Suggestions
        if (suggestions && suggestions.length > 0) {
            html += this.renderSuggestions(suggestions);
        }

        html += '</div>';

        return html;
    },

    /**
     * Render performance overview
     */
    renderPerformanceOverview(summary) {
        const completionRate = summary.average_completion_rate || 0;
        const skillLevel = (summary.average_skill_level * 100) || 0;

        return `
            <div class="performance-overview">
                <h3>학습 현황</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${summary.total_attempts || 0}</div>
                        <div class="stat-label">총 시도</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.total_completed || 0}</div>
                        <div class="stat-label">완료</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${completionRate.toFixed(0)}%</div>
                        <div class="stat-label">완료율</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${skillLevel.toFixed(0)}%</div>
                        <div class="stat-label">실력</div>
                    </div>
                </div>
                <div class="skill-level-bar">
                    <div class="skill-level-fill" style="width: ${skillLevel}%"></div>
                </div>
                <div class="difficulty-badge-current">
                    현재 난이도: <strong>${this.getDifficultyText(summary.current_difficulty)}</strong>
                </div>
            </div>
        `;
    },

    /**
     * Render next problem recommendation
     */
    renderNextProblem(problem) {
        return `
            <div class="next-problem-card">
                <h3>추천 문제</h3>
                <div class="problem-preview">
                    <div class="problem-expression">d/dx(${problem.expression})</div>
                    <div class="problem-difficulty">
                        난이도: ${this.getDifficultyText(problem.difficulty_level)}
                    </div>
                </div>
                <button class="start-problem-btn" data-problem-id="${problem.id}">
                    문제 시작하기
                </button>
            </div>
        `;
    },

    /**
     * Render difficulty recommendation
     */
    renderDifficultyRecommendation(currentDifficulty, recommendedDifficulty) {
        return `
            <div class="difficulty-recommendation">
                <h3>💡 난이도 조정 제안</h3>
                <p>
                    현재 실력에 맞춰 <strong>${this.getDifficultyText(recommendedDifficulty)}</strong>
                    난이도로 변경하는 것을 권장합니다.
                </p>
                <button class="apply-difficulty-btn" data-difficulty="${recommendedDifficulty}">
                    난이도 변경하기
                </button>
            </div>
        `;
    },

    /**
     * Render suggestions
     */
    renderSuggestions(suggestions) {
        let html = '<div class="suggestions-list"><h3>학습 제안</h3>';

        suggestions.forEach((suggestion, index) => {
            html += this.renderSuggestion(suggestion, index);
        });

        html += '</div>';
        return html;
    },

    /**
     * Render individual suggestion
     */
    renderSuggestion(suggestion, index) {
        const priorityClass = `priority-${suggestion.priority}`;
        const iconMap = {
            'remedial_practice': '📚',
            'difficulty_adjustment': '⚖️',
            'lower_difficulty': '📉',
            'engagement': '🎯',
            'skill_building': '🎓'
        };

        const icon = iconMap[suggestion.type] || '💡';

        return `
            <div class="suggestion-card ${priorityClass}" data-suggestion-index="${index}">
                <div class="suggestion-icon">${icon}</div>
                <div class="suggestion-content">
                    <h4>${suggestion.title}</h4>
                    <p>${suggestion.message}</p>
                    ${suggestion.weak_skills ? `
                        <div class="weak-skills">
                            약점: ${suggestion.weak_skills.map(s => this.getSkillName(s)).join(', ')}
                        </div>
                    ` : ''}
                </div>
                <button class="suggestion-action-btn" data-action="${suggestion.action}">
                    ${suggestion.action}
                </button>
            </div>
        `;
    },

    /**
     * Get difficulty text in Korean
     */
    getDifficultyText(difficulty) {
        const map = {
            'basic': '기본',
            'intermediate': '중급',
            'advanced': '고급'
        };
        return map[difficulty] || difficulty;
    },

    /**
     * Get skill name in Korean
     */
    getSkillName(skillKey) {
        const map = {
            'constant_rule': '상수 미분',
            'power_rule': '거듭제곱 미분',
            'constant_multiple': '상수배 미분',
            'sum_rule': '합/차 미분',
            'product_rule': '곱셈 미분',
            'quotient_rule': '나눗셈 미분',
            'chain_rule': '연쇄 법칙',
            'sin_rule': '사인 미분',
            'cos_rule': '코사인 미분',
            'exponential_rule': '지수 미분',
            'logarithm_rule': '로그 미분'
        };
        return map[skillKey] || skillKey;
    },

    /**
     * Attach event listeners to recommendation UI
     */
    attachEventListeners(container, recommendations) {
        // Start problem button
        const startBtn = container.querySelector('.start-problem-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                const problemId = e.target.dataset.problemId;
                this.onStartProblem(problemId);
            });
        }

        // Apply difficulty button
        const difficultyBtn = container.querySelector('.apply-difficulty-btn');
        if (difficultyBtn) {
            difficultyBtn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                this.onApplyDifficulty(difficulty);
            });
        }

        // Suggestion action buttons
        const actionBtns = container.querySelectorAll('.suggestion-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const index = e.target.closest('.suggestion-card').dataset.suggestionIndex;
                this.onSuggestionAction(action, recommendations.suggestions[index]);
            });
        });
    },

    /**
     * Handle start problem action
     */
    onStartProblem(problemId) {
        console.log('Starting problem:', problemId);
        // Trigger problem load in main app
        if (window.App && window.App.loadSpecificProblem) {
            window.App.loadSpecificProblem(problemId);
        } else {
            window.location.href = `index.html?problem_id=${problemId}`;
        }
    },

    /**
     * Handle apply difficulty action
     */
    onApplyDifficulty(difficulty) {
        console.log('Applying difficulty:', difficulty);
        // Store preference and reload with new difficulty
        localStorage.setItem('preferred_difficulty', difficulty);
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification(`난이도가 ${this.getDifficultyText(difficulty)}로 변경되었습니다.`);
        }
    },

    /**
     * Handle suggestion action
     */
    onSuggestionAction(action, suggestion) {
        console.log('Suggestion action:', action, suggestion);

        switch (suggestion.type) {
            case 'remedial_practice':
                this.startRemedialPractice(suggestion.weak_skills);
                break;

            case 'difficulty_adjustment':
                this.onApplyDifficulty(suggestion.to_difficulty);
                break;

            case 'lower_difficulty':
                this.onApplyDifficulty('basic');
                break;

            case 'engagement':
                // Start review session
                if (window.App && window.App.loadProblem) {
                    window.App.loadProblem();
                }
                break;

            default:
                console.log('Unknown suggestion type:', suggestion.type);
        }
    },

    /**
     * Start remedial practice for weak skills
     */
    async startRemedialPractice(weakSkills) {
        if (!weakSkills || weakSkills.length === 0) return;

        // Create learning path for weak skills
        const result = await this.createLearningPath(
            weakSkills,
            '약점 보강 학습 경로'
        );

        if (result) {
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('맞춤형 학습 경로가 생성되었습니다!');
            }

            // Reload with learning path
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }
};

// Export for use in other modules
window.Recommendations = Recommendations;
