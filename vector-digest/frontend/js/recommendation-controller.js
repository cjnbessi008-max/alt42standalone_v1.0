/**
 * Recommendation Controller
 * Handles recommendation system UI and interactions
 */

class RecommendationController {
    constructor(options = {}) {
        this.config = {
            apiUrl: options.apiUrl || '/local/vector-digest/recommendation/RecommendationAPI.php',
            userId: options.userId || null,
            autoLoad: options.autoLoad !== false,
            refreshInterval: options.refreshInterval || null
        };

        this.state = {
            recommendations: [],
            profile: null,
            learningPath: null,
            isLoading: false
        };

        this.elements = {
            recommendationsList: document.getElementById('recommendationsList'),
            profileSummary: document.getElementById('profileSummary'),
            learningPathSection: document.getElementById('learningPathSection'),
            refreshBtn: document.getElementById('refreshRecommendationsBtn')
        };

        this.init();
    }

    init() {
        this.attachEventListeners();

        if (this.config.autoLoad && this.config.userId) {
            this.loadRecommendations();
            this.loadProfile();
            this.loadLearningPath();
        }

        if (this.config.refreshInterval) {
            this.startAutoRefresh();
        }
    }

    attachEventListeners() {
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshRecommendations();
            });
        }
    }

    async loadRecommendations(count = 3) {
        if (!this.config.userId) return;

        this.showLoading();

        try {
            const response = await fetch(
                `${this.config.apiUrl}?action=get_recommendations&userid=${this.config.userId}&count=${count}`
            );

            const data = await response.json();

            if (data.success) {
                this.state.recommendations = data.recommendations;
                this.displayRecommendations();
            } else {
                this.showError(data.error || '추천을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Recommendation loading error:', error);
            this.showError('네트워크 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async loadProfile() {
        if (!this.config.userId) return;

        try {
            const response = await fetch(
                `${this.config.apiUrl}?action=get_profile&userid=${this.config.userId}`
            );

            const data = await response.json();

            if (data.success) {
                this.state.profile = data.profile;
                this.displayProfileSummary(data);
            }
        } catch (error) {
            console.error('Profile loading error:', error);
        }
    }

    async loadLearningPath() {
        if (!this.config.userId) return;

        try {
            const response = await fetch(
                `${this.config.apiUrl}?action=get_learning_path&userid=${this.config.userId}`
            );

            const data = await response.json();

            if (data.success && data.has_active_path) {
                this.state.learningPath = data;
                this.displayLearningPath();
            }
        } catch (error) {
            console.error('Learning path loading error:', error);
        }
    }

    displayRecommendations() {
        if (!this.elements.recommendationsList) return;

        if (this.state.recommendations.length === 0) {
            this.elements.recommendationsList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        const html = this.state.recommendations.map((rec, index) =>
            this.getRecommendationCardHTML(rec, index)
        ).join('');

        this.elements.recommendationsList.innerHTML = html;

        // Attach click handlers
        this.state.recommendations.forEach((rec, index) => {
            const card = document.getElementById(`rec-card-${index}`);
            const acceptBtn = document.getElementById(`rec-accept-${index}`);
            const dismissBtn = document.getElementById(`rec-dismiss-${index}`);

            if (card) {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('rec-action-btn')) {
                        this.showRecommendationDetail(rec);
                    }
                });
            }

            if (acceptBtn) {
                acceptBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.acceptRecommendation(rec);
                });
            }

            if (dismissBtn) {
                dismissBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.dismissRecommendation(index);
                });
            }
        });
    }

    getRecommendationCardHTML(rec, index) {
        const typeBadgeText = {
            'next_topic': '다음 주제',
            'review': '복습',
            'practice': '연습',
            'challenge': '도전'
        };

        const priorityClass = rec.priority >= 8 ? 'high' : (rec.priority >= 5 ? 'medium' : 'low');
        const difficultyDots = this.getDifficultyDotsHTML(rec.difficulty);

        return `
            <div class="recommendation-card type-${rec.recommendation_type}" id="rec-card-${index}">
                <span class="priority-indicator ${priorityClass}"></span>
                <span class="rec-type-badge ${rec.recommendation_type}">
                    ${typeBadgeText[rec.recommendation_type] || rec.recommendation_type}
                </span>
                <h4 class="rec-title">${rec.title}</h4>
                <p class="rec-description">${rec.description}</p>
                <div class="rec-meta">
                    <div class="rec-meta-item">
                        <span class="icon">⏱️</span>
                        <span>${this.formatTime(rec.estimated_time)}</span>
                    </div>
                    <div class="rec-meta-item">
                        <span class="icon">📊</span>
                        <div class="difficulty-indicator">${difficultyDots}</div>
                    </div>
                    <div class="rec-meta-item">
                        <span class="icon">🎯</span>
                        <span>${Math.round(rec.confidence * 100)}%</span>
                    </div>
                </div>
                <div class="rec-actions">
                    <button class="rec-action-btn primary" id="rec-accept-${index}">
                        시작하기
                    </button>
                    <button class="rec-action-btn secondary" id="rec-dismiss-${index}">
                        나중에
                    </button>
                </div>
            </div>
        `;
    }

    getDifficultyDotsHTML(difficulty) {
        const dots = 5;
        const filledDots = Math.round(difficulty * dots);
        let html = '';

        for (let i = 0; i < dots; i++) {
            html += `<span class="difficulty-dot ${i < filledDots ? 'filled' : ''}"></span>`;
        }

        return html;
    }

    getEmptyStateHTML() {
        return `
            <div class="recommendations-empty">
                <div class="icon">📚</div>
                <p>현재 추천할 학습 자료가 없습니다.<br>문제를 더 풀면 맞춤 추천을 받을 수 있어요!</p>
            </div>
        `;
    }

    displayProfileSummary(data) {
        if (!this.elements.profileSummary) return;

        const profile = data.profile;
        const accuracy = Math.round(profile.accuracy_rate * 100);
        const avgMastery = data.concept_masteries.length > 0
            ? Math.round(
                data.concept_masteries.reduce((sum, c) => sum + parseFloat(c.mastery_score), 0) /
                data.concept_masteries.length * 100
              )
            : 0;

        const html = `
            <div class="profile-stats">
                <div class="profile-stat">
                    <span class="profile-stat-value">${profile.total_problems_attempted}</span>
                    <span class="profile-stat-label">문제 풀이</span>
                </div>
                <div class="profile-stat">
                    <span class="profile-stat-value">${accuracy}%</span>
                    <span class="profile-stat-label">정확도</span>
                </div>
                <div class="profile-stat">
                    <span class="profile-stat-value">${avgMastery}%</span>
                    <span class="profile-stat-label">평균 숙련도</span>
                </div>
            </div>
            <div class="concept-mastery-grid">
                ${this.getConceptMasteryHTML(data.concept_masteries)}
            </div>
        `;

        this.elements.profileSummary.innerHTML = html;
    }

    getConceptMasteryHTML(masteries) {
        const conceptNames = {
            'basics': '기초',
            'components': '성분',
            'addition': '덧셈',
            'products': '연산',
            'unit_vectors': '단위벡터',
            'applications': '응용'
        };

        return masteries.slice(0, 6).map(mastery => {
            const score = Math.round(mastery.mastery_score * 100);
            const scoreClass = score >= 75 ? 'high' : (score >= 50 ? 'medium' : 'low');

            return `
                <div class="concept-mastery-item">
                    <div class="concept-name">${conceptNames[mastery.concept] || mastery.concept}</div>
                    <div class="concept-score-circle ${scoreClass}">
                        ${score}%
                    </div>
                </div>
            `;
        }).join('');
    }

    displayLearningPath() {
        if (!this.elements.learningPathSection || !this.state.learningPath) return;

        const path = this.state.learningPath;
        const progress = Math.round(path.overall_progress * 100);

        const conceptNames = {
            'basics': '벡터 기초',
            'components': '벡터 성분',
            'addition': '벡터 덧셈',
            'products': '내적과 외적',
            'unit_vectors': '단위 벡터',
            'applications': '벡터 응용'
        };

        const html = `
            <div class="learning-path-header">
                <span class="icon">🗺️</span>
                <h4>${path.path_name}</h4>
            </div>
            <div class="path-progress-bar">
                <div class="path-progress-fill" style="width: ${progress}%"></div>
            </div>
            <p class="path-progress-text">
                ${path.completed_concepts} / ${path.total_concepts} 개념 완료 (${progress}%)
            </p>
            ${path.current_concept ? `
                <div class="current-concept">
                    <span class="icon">👉</span>
                    <span>현재: ${conceptNames[path.current_concept] || path.current_concept}</span>
                </div>
            ` : ''}
        `;

        this.elements.learningPathSection.innerHTML = html;
    }

    async acceptRecommendation(rec) {
        try {
            // Mark as accepted
            const formData = new FormData();
            formData.append('action', 'accept_recommendation');
            formData.append('userid', this.config.userId);
            formData.append('recommendation_id', rec.id);

            await fetch(this.config.apiUrl, {
                method: 'POST',
                body: formData
            });

            // Navigate to the recommended resource
            window.location.href = this.getResourceURL(rec);
        } catch (error) {
            console.error('Error accepting recommendation:', error);
        }
    }

    getResourceURL(rec) {
        // Build URL to the recommended question/quiz
        if (rec.recommended_item_type === 'question') {
            return `/mod/quiz/attempt.php?q=${rec.recommended_item_id}`;
        }
        return '#';
    }

    dismissRecommendation(index) {
        this.state.recommendations.splice(index, 1);
        this.displayRecommendations();
    }

    showRecommendationDetail(rec) {
        // Create modal with detailed information
        const modal = this.createDetailModal(rec);
        document.body.appendChild(modal);
    }

    createDetailModal(rec) {
        const modal = document.createElement('div');
        modal.className = 'vector-digest-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        content.innerHTML = `
            <h2 style="margin-top: 0; color: #667eea;">📚 ${rec.title}</h2>
            <p style="font-size: 16px; line-height: 1.6;">${rec.description}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4 style="margin-top: 0;">추천 이유</h4>
                <p>${rec.reasoning}</p>
            </div>
            <div style="display: flex; gap: 20px; margin: 20px 0;">
                <div style="flex: 1; text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 700; color: #667eea;">
                        ${this.formatTime(rec.estimated_time)}
                    </div>
                    <div style="font-size: 12px; color: #6c757d;">예상 소요 시간</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: 700; color: #667eea;">
                        ${Math.round(rec.confidence * 100)}%
                    </div>
                    <div style="font-size: 12px; color: #6c757d;">추천 신뢰도</div>
                </div>
            </div>
            <div style="display: flex; gap: 12px;">
                <button id="modalAcceptBtn" style="
                    flex: 1;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                ">시작하기</button>
                <button id="closeModal" style="
                    flex: 1;
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 1px solid #dee2e6;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                ">닫기</button>
            </div>
        `;

        modal.appendChild(content);

        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'closeModal') {
                modal.remove();
            } else if (e.target.id === 'modalAcceptBtn') {
                this.acceptRecommendation(rec);
                modal.remove();
            }
        });

        return modal;
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}초`;
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}분`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.round((seconds % 3600) / 60);
            return `${hours}시간 ${mins}분`;
        }
    }

    showLoading() {
        this.state.isLoading = true;
        if (this.elements.recommendationsList) {
            this.elements.recommendationsList.innerHTML = `
                <div class="recommendations-loading">
                    <div class="spinner"></div>
                    <p>추천 생성 중...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        this.state.isLoading = false;
    }

    showError(message) {
        if (this.elements.recommendationsList) {
            this.elements.recommendationsList.innerHTML = `
                <div class="recommendations-empty">
                    <div class="icon">⚠️</div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    refreshRecommendations() {
        this.loadRecommendations();
        this.loadProfile();
        this.loadLearningPath();
    }

    startAutoRefresh() {
        setInterval(() => {
            this.refreshRecommendations();
        }, this.config.refreshInterval);
    }

    // Record learning activity (to be called after problem completion)
    async recordActivity(questionId, isCorrect, timeSpent, score, concepts, digestViewed) {
        try {
            const formData = new FormData();
            formData.append('action', 'record_activity');
            formData.append('userid', this.config.userId);
            formData.append('questionid', questionId);
            formData.append('is_correct', isCorrect ? '1' : '0');
            formData.append('time_spent', timeSpent);
            formData.append('score', score);
            formData.append('concepts', JSON.stringify(concepts));
            formData.append('digest_viewed', digestViewed ? '1' : '0');

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Refresh recommendations after activity
                this.refreshRecommendations();
            }

            return data;
        } catch (error) {
            console.error('Error recording activity:', error);
            return { success: false };
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationController;
}
