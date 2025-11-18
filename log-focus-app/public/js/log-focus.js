/**
 * Log Focus - Automatic Keyword Highlighting System
 */

class LogFocus {
    constructor() {
        this.keywords = {};
        this.logs = [];
        this.apiBase = 'api/log_api.php';
        this.autoRefresh = false;
        this.refreshInterval = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Log Focus...');

        // Load highlight keywords
        await this.loadKeywords();

        // Load initial logs
        await this.loadLogs();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Log Focus initialized successfully');
    }

    /**
     * Load highlight keywords from API
     */
    async loadKeywords() {
        try {
            const response = await fetch(`${this.apiBase}?action=get_keywords`);
            const data = await response.json();

            if (data.success) {
                this.keywords = data.data;
                console.log('Loaded keywords:', this.keywords);
                this.updateKeywordLegend();
            }
        } catch (error) {
            console.error('Error loading keywords:', error);
        }
    }

    /**
     * Load logs from API
     */
    async loadLogs(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            params.append('action', 'get_logs');

            const response = await fetch(`${this.apiBase}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.logs = data.data;
                this.displayLogs();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Failed to load logs');
        }
    }

    /**
     * Display logs in smartphone screen
     */
    displayLogs() {
        const container = document.getElementById('log-container');

        if (!container) {
            console.error('Log container not found');
            return;
        }

        if (this.logs.length === 0) {
            container.innerHTML = '<div class="status-message">No logs available</div>';
            return;
        }

        container.innerHTML = '';

        this.logs.forEach(log => {
            const logEntry = this.createLogEntry(log);
            container.appendChild(logEntry);
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Create log entry element with highlighted keywords
     */
    createLogEntry(log) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${this.getLogClass(log)}`;

        // Create timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = this.formatTimestamp(log.created_at);

        // Create message with highlighting
        const message = document.createElement('div');
        message.className = 'log-message';
        message.innerHTML = this.highlightKeywords(log.log_message);

        entry.appendChild(timestamp);
        entry.appendChild(message);

        return entry;
    }

    /**
     * Highlight keywords in text
     */
    highlightKeywords(text) {
        if (!text) return '';

        let highlightedText = text;

        // Sort keywords by length (longest first) to avoid partial matches
        const allKeywords = [];
        Object.keys(this.keywords).forEach(category => {
            this.keywords[category].forEach(kw => {
                allKeywords.push({
                    keyword: kw.keyword,
                    category: kw.category,
                    color: kw.color
                });
            });
        });

        // Sort by length descending
        allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

        // Replace each keyword with highlighted version
        allKeywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw.keyword})\\b`, 'gi');
            highlightedText = highlightedText.replace(regex, (match) => {
                return `<span class="highlight highlight-${kw.category}" style="color: ${kw.color};">${match}</span>`;
            });
        });

        return highlightedText;
    }

    /**
     * Get log entry class based on content
     */
    getLogClass(log) {
        const msg = log.log_message.toLowerCase();

        if (msg.includes('error') || msg.includes('fail')) {
            return 'error';
        } else if (msg.includes('success') || msg.includes('pass')) {
            return 'success';
        } else if (msg.includes('warning') || msg.includes('timeout')) {
            return 'warning';
        }

        return '';
    }

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // If less than 1 minute ago
        if (diff < 60000) {
            return 'Just now';
        }

        // If less than 1 hour ago
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }

        // If today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        // Otherwise show date and time
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Update keyword legend
     */
    updateKeywordLegend() {
        const legendContainer = document.getElementById('keyword-legend');

        if (!legendContainer) return;

        legendContainer.innerHTML = '';

        Object.keys(this.keywords).forEach(category => {
            const keywords = this.keywords[category];

            if (keywords.length > 0) {
                const sampleKeyword = keywords[0];
                const legendItem = document.createElement('span');
                legendItem.className = `legend-item highlight-${category}`;
                legendItem.textContent = category.toUpperCase();
                legendItem.style.color = sampleKeyword.color;

                legendContainer.appendChild(legendItem);
            }
        });
    }

    /**
     * Update statistics
     */
    updateStatistics() {
        // Total logs
        document.getElementById('stat-total').textContent = this.logs.length;

        // Count by result type
        const success = this.logs.filter(log =>
            log.result === 'PASS' || log.log_message.includes('SUCCESS')
        ).length;

        const errors = this.logs.filter(log =>
            log.log_message.includes('ERROR') || log.log_message.includes('FAIL')
        ).length;

        const warnings = this.logs.filter(log =>
            log.log_message.includes('WARNING') || log.log_message.includes('TIMEOUT')
        ).length;

        document.getElementById('stat-success').textContent = success;
        document.getElementById('stat-errors').textContent = errors;
        document.getElementById('stat-warnings').textContent = warnings;
    }

    /**
     * Sync with Moodle
     */
    async syncWithMoodle() {
        const quizId = document.getElementById('quiz-id').value;
        const userId = document.getElementById('user-id').value;

        if (!quizId) {
            alert('Please enter a Quiz ID');
            return;
        }

        this.showLoading('Syncing with Moodle...');

        try {
            const params = new URLSearchParams({
                action: 'sync_moodle',
                quiz_id: quizId,
                user_id: userId || 0
            });

            const response = await fetch(`${this.apiBase}?${params}`);
            const data = await response.json();

            if (data.success) {
                alert(`Successfully synced ${data.synced} logs from Moodle`);
                await this.loadLogs();
            } else {
                alert('Sync failed: ' + data.error);
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Sync failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Apply filters
     */
    applyFilters() {
        const filters = {
            user_id: document.getElementById('filter-user-id').value,
            activity_type: document.getElementById('filter-activity-type').value,
            from_date: document.getElementById('filter-from-date').value,
            to_date: document.getElementById('filter-to-date').value
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        this.loadLogs(filters);
    }

    /**
     * Clear filters
     */
    clearFilters() {
        document.getElementById('filter-user-id').value = '';
        document.getElementById('filter-activity-type').value = '';
        document.getElementById('filter-from-date').value = '';
        document.getElementById('filter-to-date').value = '';

        this.loadLogs();
    }

    /**
     * Toggle auto-refresh
     */
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;

        const btn = document.getElementById('btn-auto-refresh');

        if (this.autoRefresh) {
            btn.textContent = 'Stop Auto-Refresh';
            btn.classList.remove('btn-info');
            btn.classList.add('btn-warning');

            // Refresh every 5 seconds
            this.refreshInterval = setInterval(() => {
                this.loadLogs();
            }, 5000);
        } else {
            btn.textContent = 'Auto-Refresh';
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-info');

            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }
    }

    /**
     * Show loading message
     */
    showLoading(message = 'Loading...') {
        const container = document.getElementById('log-container');
        if (container) {
            container.innerHTML = `<div class="loading">${message}</div>`;
        }
    }

    /**
     * Hide loading message
     */
    hideLoading() {
        // Will be replaced by displayLogs()
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('log-container');
        if (container) {
            container.innerHTML = `<div class="status-message" style="color: #f44336;">${message}</div>`;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sync button
        const syncBtn = document.getElementById('btn-sync');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncWithMoodle());
        }

        // Refresh button
        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLogs());
        }

        // Auto-refresh button
        const autoRefreshBtn = document.getElementById('btn-auto-refresh');
        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => this.toggleAutoRefresh());
        }

        // Apply filters button
        const applyFiltersBtn = document.getElementById('btn-apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('btn-clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.logFocus = new LogFocus();
    window.logFocus.init();
});
