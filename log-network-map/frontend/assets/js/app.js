/**
 * Main Application Logic for Log Network Map
 */

// Global state
let networkViz = null;
let currentStudentId = null;
let refreshTimer = null;

/**
 * Initialize application
 */
async function initApp() {
    debug('Initializing Log Network Map application...');

    // Show loading overlay
    showLoading(true);

    try {
        // Initialize network visualization
        networkViz = new NetworkVisualization('networkContainer');

        // Load initial data
        await loadNetworkData();

        // Load students list
        await loadStudents();

        // Setup event listeners
        setupEventListeners();

        // Setup mobile preview
        setupMobilePreview();

        // Start auto-refresh
        startAutoRefresh();

        debug('Application initialized successfully');
        showNotification('네트워크 맵이 로드되었습니다.', 'success');

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showNotification('애플리케이션 초기화에 실패했습니다.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Load network data
 */
async function loadNetworkData(studentId = null) {
    try {
        debug('Loading network data for student:', studentId);

        const data = await fetchNetworkData(studentId);

        // Initialize network
        networkViz.init(data);

        // Update statistics
        updateStatistics(data.statistics);

        // Store current student
        currentStudentId = studentId;

        // Update mobile preview
        updateMobilePreview();

    } catch (error) {
        console.error('Error loading network data:', error);
        throw error;
    }
}

/**
 * Load students list
 */
async function loadStudents() {
    try {
        const students = await fetchStudents();

        const select = document.getElementById('studentSelect');
        if (select && students.length > 0) {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.firstname} ${student.lastname}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        debug('Could not load students:', error);
    }
}

/**
 * Update statistics panel
 */
function updateStatistics(statistics) {
    const panel = document.getElementById('statisticsPanel');

    if (!panel) return;

    const stats = networkViz.getStatistics();

    panel.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">총 개념 수</div>
            <div class="stat-value">${stats.nodeCount}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">연결 수</div>
            <div class="stat-value">${stats.edgeCount}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">네트워크 밀도</div>
            <div class="stat-value">${stats.density.toFixed(3)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">평균 연결도</div>
            <div class="stat-value">${stats.avgDegree.toFixed(2)}</div>
        </div>
    `;

    // Add concept-specific statistics if available
    if (statistics && Object.keys(statistics).length > 0) {
        let totalInteractions = 0;
        let avgScore = 0;
        let count = 0;

        for (const stat of Object.values(statistics)) {
            totalInteractions += stat.total_interactions || 0;
            avgScore += stat.avg_score || 0;
            count++;
        }

        if (count > 0) {
            avgScore /= count;
            panel.innerHTML += `
                <div class="stat-item">
                    <div class="stat-label">총 학습 활동</div>
                    <div class="stat-value">${totalInteractions}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">평균 점수</div>
                    <div class="stat-value">${avgScore.toFixed(1)}점</div>
                </div>
            `;
        }
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        showLoading(true);
        try {
            await loadNetworkData(currentStudentId);
            showNotification('데이터가 새로고침되었습니다.', 'success');
        } catch (error) {
            showNotification('새로고침에 실패했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    });

    // Moodle sync button
    document.getElementById('moodleSyncBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Moodle에서 사용자 데이터를 동기화하시겠습니까?')) {
            try {
                showLoading(true);
                await api.syncMoodleUsers();
                await loadStudents();
                showNotification('Moodle 데이터가 동기화되었습니다.', 'success');
            } catch (error) {
                showNotification('동기화에 실패했습니다: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }
    });

    // Student selection
    document.getElementById('studentSelect')?.addEventListener('change', async (e) => {
        const studentId = e.target.value || null;
        showLoading(true);
        try {
            await loadNetworkData(studentId);
        } finally {
            showLoading(false);
        }
    });

    // Layout selection
    document.getElementById('layoutSelect')?.addEventListener('change', (e) => {
        const layout = e.target.value;
        networkViz.applyLayout(layout);
        networkViz.fit();
    });

    // Show learning paths toggle
    document.getElementById('showLearningPaths')?.addEventListener('change', (e) => {
        networkViz.toggleLearningPaths(e.target.checked);
    });

    // Apply filters button
    document.getElementById('applyFilters')?.addEventListener('click', () => {
        const difficulties = [];
        if (document.getElementById('filterBeginner')?.checked) difficulties.push('beginner');
        if (document.getElementById('filterIntermediate')?.checked) difficulties.push('intermediate');
        if (document.getElementById('filterAdvanced')?.checked) difficulties.push('advanced');

        networkViz.setDifficultyFilters(difficulties);
    });

    // Fit network button
    document.getElementById('fitNetworkBtn')?.addEventListener('click', () => {
        networkViz.fit();
    });

    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        networkViz.exportAsImage();
        showNotification('네트워크 이미지가 다운로드되었습니다.', 'success');
    });

    // Node selection event
    window.addEventListener('nodeSelected', (e) => {
        const node = e.detail.node;
        showConceptDetails(node);
    });
}

/**
 * Show concept details
 */
function showConceptDetails(node) {
    const card = document.getElementById('conceptDetailsCard');
    const content = document.getElementById('conceptDetails');

    if (!card || !content) return;

    content.innerHTML = `
        <h5 class="mb-3">${node.label}</h5>
        <div class="concept-detail-item">
            <span class="concept-detail-label">설명:</span>
            <span>${node.title || '정보 없음'}</span>
        </div>
        <div class="concept-detail-item">
            <span class="concept-detail-label">난이도:</span>
            <span class="badge bg-${node.group === 'beginner' ? 'primary' : node.group === 'intermediate' ? 'warning' : 'danger'}">
                ${CONFIG.NODE_STYLES[node.group]?.label || node.group}
            </span>
        </div>
        <div class="concept-detail-item">
            <span class="concept-detail-label">활동 수:</span>
            <span>${node.value || 0}</span>
        </div>
        <div class="concept-detail-item">
            <span class="concept-detail-label">노드 크기:</span>
            <span>${node.size}</span>
        </div>
    `;

    card.style.display = 'block';
    card.classList.add('fade-in');
}

/**
 * Setup mobile preview
 */
function setupMobilePreview() {
    const preview = document.getElementById('mobilePreview');
    const toggleBtn = document.getElementById('toggleMobilePreview');
    const closeBtn = document.getElementById('closeMobilePreview');

    if (!preview || !toggleBtn) return;

    // Initially hide preview
    preview.classList.add('hidden');

    // Toggle button
    toggleBtn.addEventListener('click', () => {
        if (preview.classList.contains('hidden')) {
            preview.classList.remove('hidden');
            toggleBtn.classList.add('active');
            document.body.classList.add('mobile-preview-visible');
            updateMobilePreview();
        } else {
            preview.classList.add('hidden');
            toggleBtn.classList.remove('active');
            document.body.classList.remove('mobile-preview-visible');
        }
    });

    // Close button
    closeBtn?.addEventListener('click', () => {
        preview.classList.add('hidden');
        toggleBtn.classList.remove('active');
        document.body.classList.remove('mobile-preview-visible');
    });
}

/**
 * Update mobile preview
 */
function updateMobilePreview() {
    const iframe = document.getElementById('mobilePreviewFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'refreshNetwork',
            studentId: currentStudentId
        }, '*');
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(async () => {
        debug('Auto-refreshing network data...');
        try {
            await loadNetworkData(currentStudentId);
        } catch (error) {
            debug('Auto-refresh failed:', error);
        }
    }, CONFIG.REFRESH_INTERVAL);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
    if (networkViz) {
        networkViz.destroy();
    }
});
