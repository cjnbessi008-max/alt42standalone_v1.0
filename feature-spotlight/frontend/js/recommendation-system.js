/**
 * AI Recommendation System - Frontend Module
 *
 * Handles fetching and displaying personalized function recommendations
 */

class RecommendationSystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '../backend/recommendation_api.php';
        this.userId = options.userId || 1; // Default test user
        this.language = options.language || 'ko';
        this.containerEl = null;

        this.currentRecommendations = [];
        this.studentProfile = null;

        // Recommendation strategy
        this.strategy = options.strategy || 'hybrid';
    }

    /**
     * Initialize the recommendation system
     */
    async init(containerId) {
        this.containerEl = document.getElementById(containerId);

        if (!this.containerEl) {
            console.error('Recommendation container not found:', containerId);
            return;
        }

        // Load student profile
        await this.loadStudentProfile();

        // Load initial recommendations
        await this.loadRecommendations();

        console.log('Recommendation system initialized');
    }

    /**
     * Load student learning profile
     */
    async loadStudentProfile() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}?action=get_student_profile&user_id=${this.userId}`
            );

            const data = await response.json();

            if (data.success) {
                this.studentProfile = data.profile;
                console.log('Student profile loaded:', this.studentProfile);
            } else {
                console.error('Failed to load profile:', data.error);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    /**
     * Load personalized recommendations
     */
    async loadRecommendations(count = 5, strategy = null) {
        const strategyParam = strategy || this.strategy;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}?action=get_recommendations&user_id=${this.userId}&count=${count}&strategy=${strategyParam}`
            );

            const data = await response.json();

            if (data.success) {
                this.currentRecommendations = data.data;
                this.renderRecommendations();
                console.log('Recommendations loaded:', this.currentRecommendations);
            } else {
                console.error('Failed to load recommendations:', data.error);
                this.showError('추천을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.showError('서버 연결 오류');
        }
    }

    /**
     * Render recommendations in the UI
     */
    renderRecommendations() {
        if (!this.containerEl || !this.currentRecommendations.length) {
            return;
        }

        let html = '<div class="recommendations-container">';

        // Header
        html += `
            <div class="recommendations-header">
                <h3>
                    ${this.language === 'ko' ? '🎯 맞춤 추천 함수' : '🎯 Recommended Functions'}
                </h3>
                <div class="strategy-selector">
                    <select id="strategy-select" class="strategy-dropdown">
                        <option value="hybrid" ${this.strategy === 'hybrid' ? 'selected' : ''}>
                            ${this.language === 'ko' ? '통합 추천' : 'Hybrid'}
                        </option>
                        <option value="skill_based" ${this.strategy === 'skill_based' ? 'selected' : ''}>
                            ${this.language === 'ko' ? '실력 기반' : 'Skill-Based'}
                        </option>
                        <option value="collaborative" ${this.strategy === 'collaborative' ? 'selected' : ''}>
                            ${this.language === 'ko' ? '협업 필터링' : 'Collaborative'}
                        </option>
                        <option value="sequential" ${this.strategy === 'sequential' ? 'selected' : ''}>
                            ${this.language === 'ko' ? '학습 경로' : 'Learning Path'}
                        </option>
                    </select>
                </div>
            </div>
        `;

        // Student profile summary
        if (this.studentProfile) {
            html += this.renderProfileSummary();
        }

        // Recommendations list
        html += '<div class="recommendations-list">';

        this.currentRecommendations.forEach((rec, index) => {
            html += this.renderRecommendationCard(rec, index);
        });

        html += '</div>'; // .recommendations-list
        html += '</div>'; // .recommendations-container

        this.containerEl.innerHTML = html;

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Render student profile summary
     */
    renderProfileSummary() {
        const profile = this.studentProfile;

        const skillLevelLabels = {
            beginner: '초급',
            intermediate: '중급',
            advanced: '고급',
            expert: '전문가'
        };

        const successRate = profile.total_problems_attempted > 0
            ? ((profile.total_problems_correct / profile.total_problems_attempted) * 100).toFixed(1)
            : 0;

        return `
            <div class="profile-summary">
                <div class="profile-item">
                    <span class="profile-label">학습 레벨:</span>
                    <span class="profile-value skill-level-${profile.skill_level}">
                        ${skillLevelLabels[profile.skill_level] || profile.skill_level}
                    </span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">성공률:</span>
                    <span class="profile-value">${successRate}%</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">도전 문제:</span>
                    <span class="profile-value">${profile.total_problems_attempted}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">해결 문제:</span>
                    <span class="profile-value">${profile.total_problems_correct}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render individual recommendation card
     */
    renderRecommendationCard(rec, index) {
        const func = rec.function;
        const score = rec.score || 0;
        const reasoning = rec.reasoning || '';

        const difficultyColors = {
            easy: '#4CAF50',
            medium: '#FF9800',
            hard: '#F44336',
            expert: '#9C27B0'
        };

        const difficultyLabels = {
            easy: '쉬움',
            medium: '보통',
            hard: '어려움',
            expert: '전문가'
        };

        // Generate feature badges
        let featureBadges = '';
        if (func.has_maxima) featureBadges += '<span class="feature-badge badge-maxima">극대</span>';
        if (func.has_minima) featureBadges += '<span class="feature-badge badge-minima">극소</span>';
        if (func.has_inflection) featureBadges += '<span class="feature-badge badge-inflection">변곡</span>';

        const confidenceWidth = Math.min(100, Math.max(0, score));

        return `
            <div class="recommendation-card" data-function-id="${func.id}" data-index="${index}">
                <div class="card-header">
                    <div class="card-rank">#{index + 1}</div>
                    <div class="card-difficulty"
                         style="background-color: ${difficultyColors[func.difficulty_level]}">
                        ${difficultyLabels[func.difficulty_level]}
                    </div>
                </div>

                <div class="card-body">
                    <h4 class="function-name">${func.display_name || func.function_type}</h4>
                    <div class="function-expression">
                        <code>f(x) = ${func.function_expression}</code>
                    </div>

                    <div class="function-features">
                        ${featureBadges}
                        <span class="feature-count">${func.number_of_features || 0} features</span>
                    </div>

                    ${func.description ? `
                        <p class="function-description">${func.description}</p>
                    ` : ''}

                    <div class="recommendation-meta">
                        <div class="confidence-bar">
                            <div class="confidence-label">추천 신뢰도:</div>
                            <div class="confidence-track">
                                <div class="confidence-fill" style="width: ${confidenceWidth}%"></div>
                            </div>
                            <div class="confidence-value">${score.toFixed(1)}%</div>
                        </div>

                        ${reasoning ? `
                            <div class="reasoning">
                                <strong>왜 이 함수?</strong> ${reasoning}
                            </div>
                        ` : ''}
                    </div>

                    ${rec.breakdown ? `
                        <div class="score-breakdown">
                            <details>
                                <summary>점수 상세</summary>
                                <ul>
                                    ${Object.entries(rec.breakdown).map(([key, value]) => `
                                        <li>${this.getBreakdownLabel(key)}: ${value.toFixed(1)}</li>
                                    `).join('')}
                                </ul>
                            </details>
                        </div>
                    ` : ''}
                </div>

                <div class="card-actions">
                    <button class="btn btn-primary try-function-btn"
                            data-function-id="${func.id}"
                            data-function-expr="${func.function_expression}">
                        <span>📊</span> 분석하기
                    </button>
                    <button class="btn btn-secondary view-details-btn"
                            data-function-id="${func.id}">
                        <span>📖</span> 상세보기
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get label for score breakdown
     */
    getBreakdownLabel(key) {
        const labels = {
            skill_match: '실력 매칭',
            success_rate: '성공률',
            collaborative: '협업 점수',
            diversity: '다양성',
            recency: '최신성'
        };
        return labels[key] || key;
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Strategy selector
        const strategySelect = document.getElementById('strategy-select');
        if (strategySelect) {
            strategySelect.addEventListener('change', (e) => {
                this.strategy = e.target.value;
                this.loadRecommendations(5, this.strategy);
            });
        }

        // Try function buttons
        document.querySelectorAll('.try-function-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const functionId = parseInt(btn.getAttribute('data-function-id'));
                const functionExpr = btn.getAttribute('data-function-expr');
                this.tryFunction(functionId, functionExpr);
            });
        });

        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const functionId = parseInt(btn.getAttribute('data-function-id'));
                this.viewFunctionDetails(functionId);
            });
        });
    }

    /**
     * Try a recommended function
     */
    async tryFunction(functionId, functionExpr) {
        console.log('Trying function:', functionId, functionExpr);

        // Trigger function analysis (integrate with FeatureSpotlight)
        if (typeof window.analyzeFunction === 'function') {
            document.getElementById('function-input').value = functionExpr;
            window.analyzeFunction();

            // Record that recommendation was attempted
            await this.recordRecommendationAttempt(functionId);
        } else {
            alert('분석 기능을 초기화 중입니다...');
        }
    }

    /**
     * View function details
     */
    async viewFunctionDetails(functionId) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}?action=get_function_details&id=${functionId}`
            );

            const data = await response.json();

            if (data.success) {
                this.showFunctionDetailsModal(data.function, data.statistics);
            } else {
                alert('함수 정보를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading function details:', error);
            alert('서버 연결 오류');
        }
    }

    /**
     * Show function details in a modal
     */
    showFunctionDetailsModal(func, stats) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'function-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${func.display_name || func.function_type}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="function-info">
                        <h3>함수 표현식</h3>
                        <code class="large-code">f(x) = ${func.function_expression}</code>

                        <h3>난이도</h3>
                        <p>${func.difficulty_level} (복잡도: ${func.complexity_score})</p>

                        <h3>특징</h3>
                        <ul>
                            ${func.has_maxima ? '<li>극대값 포함</li>' : ''}
                            ${func.has_minima ? '<li>극소값 포함</li>' : ''}
                            ${func.has_inflection ? '<li>변곡점 포함</li>' : ''}
                            <li>총 ${func.number_of_features}개의 특징</li>
                        </ul>

                        ${func.description ? `
                            <h3>설명</h3>
                            <p>${func.description}</p>
                        ` : ''}

                        ${func.learning_objectives ? `
                            <h3>학습 목표</h3>
                            <p>${func.learning_objectives}</p>
                        ` : ''}

                        ${func.hint ? `
                            <h3>힌트</h3>
                            <p class="hint">${func.hint}</p>
                        ` : ''}

                        ${stats ? `
                            <h3>통계</h3>
                            <ul>
                                <li>시도한 학생: ${stats.unique_users || 0}명</li>
                                <li>전체 시도: ${stats.total_attempts || 0}회</li>
                                <li>평균 성공률: ${parseFloat(stats.success_rate || 0).toFixed(1)}%</li>
                                <li>평균 소요 시간: ${Math.round(stats.avg_time_spent || 0)}초</li>
                            </ul>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-try-btn"
                            data-function-id="${func.id}"
                            data-function-expr="${func.function_expression}">
                        지금 시도하기
                    </button>
                    <button class="btn btn-secondary modal-close">닫기</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('.modal-try-btn')?.addEventListener('click', () => {
            this.tryFunction(func.id, func.function_expression);
            document.body.removeChild(modal);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Record that a recommendation was attempted
     */
    async recordRecommendationAttempt(functionId) {
        // This would be called when the student actually starts working on the function
        console.log('Recording recommendation attempt:', functionId);
    }

    /**
     * Record an attempt after completion
     */
    async recordAttempt(functionId, isCorrect, timeSpent, additionalData = {}) {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_attempt',
                    user_id: this.userId,
                    function_id: functionId,
                    is_correct: isCorrect,
                    time_spent: timeSpent,
                    ...additionalData
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('Attempt recorded successfully');
                // Refresh profile and recommendations
                await this.loadStudentProfile();
                await this.loadRecommendations();
            } else {
                console.error('Failed to record attempt:', data.error);
            }
        } catch (error) {
            console.error('Error recording attempt:', error);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Refresh recommendations
     */
    async refresh() {
        await this.loadStudentProfile();
        await this.loadRecommendations();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationSystem;
}
