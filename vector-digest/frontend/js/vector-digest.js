/**
 * Vector Digest JavaScript Controller
 * Handles API communication and UI updates
 */

class VectorDigest {
    constructor(options = {}) {
        this.config = {
            apiUrl: options.apiUrl || '/vector-digest/api/VectorDigestAPI.php',
            questionId: options.questionId || null,
            autoLoad: options.autoLoad !== false,
            position: options.position || 'bottom-right',
            refreshInterval: options.refreshInterval || null
        };

        this.state = {
            isMinimized: false,
            isLoading: false,
            currentDigest: null,
            viewStartTime: null
        };

        this.elements = {
            container: document.getElementById('vector-digest-smartphone'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            digestCard: document.getElementById('digestCard'),
            noContent: document.getElementById('noContent'),
            errorMessage: document.getElementById('errorMessage'),
            line1: document.querySelector('#line1 .line-text'),
            line2: document.querySelector('#line2 .line-text'),
            line3: document.querySelector('#line3 .line-text'),
            conceptBadge: document.getElementById('conceptBadge'),
            confidenceFill: document.getElementById('confidenceFill'),
            confidenceValue: document.getElementById('confidenceValue'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            minimizedBtn: document.getElementById('minimizedBtn'),
            btnHelpful: document.getElementById('btnHelpful'),
            btnRefresh: document.getElementById('btnRefresh'),
            btnExpand: document.getElementById('btnExpand')
        };

        this.init();
    }

    init() {
        this.attachEventListeners();

        if (this.config.autoLoad && this.config.questionId) {
            this.loadDigest(this.config.questionId);
        }

        if (this.config.refreshInterval) {
            this.startAutoRefresh();
        }
    }

    attachEventListeners() {
        // Minimize/Maximize
        if (this.elements.minimizeBtn) {
            this.elements.minimizeBtn.addEventListener('click', () => this.minimize());
        }

        if (this.elements.minimizedBtn) {
            this.elements.minimizedBtn.addEventListener('click', () => this.maximize());
        }

        // Action buttons
        if (this.elements.btnHelpful) {
            this.elements.btnHelpful.addEventListener('click', () => this.markHelpful());
        }

        if (this.elements.btnRefresh) {
            this.elements.btnRefresh.addEventListener('click', () => this.refresh());
        }

        if (this.elements.btnExpand) {
            this.elements.btnExpand.addEventListener('click', () => this.expandDigest());
        }

        // Track view time
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logViewDuration();
            } else {
                this.state.viewStartTime = Date.now();
            }
        });
    }

    async loadDigest(questionId) {
        this.showLoading();

        try {
            const response = await fetch(
                `${this.config.apiUrl}?action=get_digest&questionid=${questionId}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            if (data.success) {
                this.displayDigest(data);
                this.state.currentDigest = data;
                this.state.viewStartTime = Date.now();
            } else {
                this.showNoContent();
            }

        } catch (error) {
            console.error('Vector Digest Error:', error);
            this.showError('네트워크 오류가 발생했습니다.');
        }
    }

    showLoading() {
        this.state.isLoading = true;
        this.hideAllStates();
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }
    }

    hideAllStates() {
        const states = [
            this.elements.loadingIndicator,
            this.elements.digestCard,
            this.elements.noContent,
            this.elements.errorMessage
        ];

        states.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }

    displayDigest(data) {
        this.hideAllStates();

        // Set lines
        if (this.elements.line1) this.elements.line1.textContent = data.line1;
        if (this.elements.line2) this.elements.line2.textContent = data.line2;
        if (this.elements.line3) this.elements.line3.textContent = data.line3;

        // Set concept badge
        if (this.elements.conceptBadge && data.concepts && data.concepts.length > 0) {
            const conceptLabels = {
                'basics': '기본 개념',
                'addition': '벡터 덧셈',
                'products': '내적/외적',
                'components': '성분 분해',
                'unit_vectors': '단위벡터',
                'applications': '응용'
            };
            this.elements.conceptBadge.textContent =
                conceptLabels[data.concepts[0]] || 'Vector Concepts';
        }

        // Set confidence
        const confidence = Math.round(data.confidence * 100);
        if (this.elements.confidenceFill) {
            this.elements.confidenceFill.style.width = `${confidence}%`;
        }
        if (this.elements.confidenceValue) {
            this.elements.confidenceValue.textContent = `${confidence}%`;
        }

        // Show digest card
        if (this.elements.digestCard) {
            this.elements.digestCard.style.display = 'block';
        }

        this.state.isLoading = false;

        // Log view
        this.logInteraction('viewed');
    }

    showNoContent() {
        this.hideAllStates();
        if (this.elements.noContent) {
            this.elements.noContent.style.display = 'block';
        }
        this.state.isLoading = false;
    }

    showError(message) {
        this.hideAllStates();

        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'block';
            const errorText = this.elements.errorMessage.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message || '오류가 발생했습니다.';
            }
        }

        this.state.isLoading = false;
    }

    minimize() {
        if (this.elements.container) {
            this.elements.container.classList.add('minimized');
        }
        this.state.isMinimized = true;
        this.logViewDuration();
    }

    maximize() {
        if (this.elements.container) {
            this.elements.container.classList.remove('minimized');
        }
        this.state.isMinimized = false;
        this.state.viewStartTime = Date.now();
    }

    async markHelpful() {
        if (this.elements.btnHelpful) {
            this.elements.btnHelpful.textContent = '✅';
            setTimeout(() => {
                this.elements.btnHelpful.textContent = '👍';
            }, 2000);
        }

        await this.logInteraction('helpful');
    }

    refresh() {
        if (this.config.questionId) {
            // Force regenerate
            this.generateNewDigest(this.config.questionId);
        }
    }

    async generateNewDigest(questionId) {
        this.showLoading();

        try {
            const response = await fetch(
                `${this.config.apiUrl}?action=generate&questionid=${questionId}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.displayDigest(data);
                this.state.currentDigest = data;
            } else {
                this.showError(data.error || '생성 실패');
            }

        } catch (error) {
            console.error('Vector Digest Generation Error:', error);
            this.showError('생성 중 오류가 발생했습니다.');
        }
    }

    expandDigest() {
        // Create modal or expanded view
        const modal = this.createExpandedModal();
        document.body.appendChild(modal);

        this.logInteraction('expanded');
    }

    createExpandedModal() {
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

        const digest = this.state.currentDigest;
        content.innerHTML = `
            <h2 style="margin-top: 0; color: #667eea;">📐 Vector Digest - 상세보기</h2>
            <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <h3 style="margin-top: 0;">핵심 요약 (3줄)</h3>
                <ol style="line-height: 2;">
                    <li>${digest.line1}</li>
                    <li>${digest.line2}</li>
                    <li>${digest.line3}</li>
                </ol>
            </div>
            <div style="margin: 20px 0;">
                <strong>감지된 개념:</strong> ${digest.concepts ? digest.concepts.join(', ') : 'N/A'}
            </div>
            <div style="margin: 20px 0;">
                <strong>신뢰도:</strong> ${Math.round(digest.confidence * 100)}%
            </div>
            <button id="closeModal" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
            ">닫기</button>
        `;

        modal.appendChild(content);

        // Close on click
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'closeModal') {
                modal.remove();
            }
        });

        return modal;
    }

    async logInteraction(action) {
        if (!this.state.currentDigest) return;

        try {
            const formData = new FormData();
            formData.append('action', 'log');
            formData.append('questionid', this.config.questionId);
            formData.append('digestid', this.state.currentDigest.digest_id);
            formData.append('log_action', action);
            formData.append('userid', this.getUserId());

            if (action === 'viewed' && this.state.viewStartTime) {
                const duration = Math.round((Date.now() - this.state.viewStartTime) / 1000);
                formData.append('duration', duration);
            }

            await fetch(this.config.apiUrl, {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    logViewDuration() {
        if (this.state.viewStartTime) {
            const duration = Math.round((Date.now() - this.state.viewStartTime) / 1000);
            if (duration > 0) {
                this.logInteraction('viewed');
            }
        }
    }

    getUserId() {
        // Try to get Moodle user ID
        if (typeof M !== 'undefined' && M.cfg && M.cfg.sesskey) {
            // Moodle is available
            return M.cfg.userid || 0;
        }

        // Fallback to session storage
        let userId = sessionStorage.getItem('vector_digest_user_id');
        if (!userId) {
            userId = 'guest_' + Date.now();
            sessionStorage.setItem('vector_digest_user_id', userId);
        }
        return userId;
    }

    startAutoRefresh() {
        setInterval(() => {
            if (!this.state.isMinimized && this.config.questionId) {
                this.loadDigest(this.config.questionId);
            }
        }, this.config.refreshInterval);
    }

    // Public API
    setQuestionId(questionId) {
        this.config.questionId = questionId;
        this.loadDigest(questionId);
    }

    destroy() {
        if (this.elements.container) {
            this.elements.container.remove();
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VectorDigest;
}
