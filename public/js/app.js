/**
 * Stat Digest Frontend Application
 * Handles UI interactions and API calls
 */

// Configuration
const API_BASE_URL = 'api.php';

// Update clock
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}

// Show status message
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;

    setTimeout(() => {
        element.textContent = '';
        element.className = 'status-message';
    }, 5000);
}

// API call helper
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let url = `${API_BASE_URL}${endpoint}`;

        if (method === 'GET' && data) {
            const params = new URLSearchParams(data);
            url += `?${params}`;
        } else if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Sync quiz from Moodle
async function syncQuiz() {
    const quizId = document.getElementById('quiz-id').value;

    if (!quizId) {
        showStatus('sync-status', '퀴즈 ID를 입력해주세요', 'error');
        return;
    }

    showStatus('sync-status', '동기화 중...', 'info');

    try {
        const result = await apiCall('/sync/quiz', 'POST', { quiz_id: quizId });

        if (result.success) {
            showStatus('sync-status', result.message, 'success');
            // Auto-refresh stats after sync
            setTimeout(loadDigestSummary, 1000);
        } else {
            showStatus('sync-status', result.message || '동기화 실패', 'error');
        }
    } catch (error) {
        showStatus('sync-status', '오류: ' + error.message, 'error');
    }
}

// Compute statistics
async function computeStats() {
    showStatus('compute-status', '통계 계산 중...', 'info');

    try {
        const result = await apiCall('/stats/compute', 'POST');

        if (result.success || result.computed !== undefined) {
            showStatus('compute-status',
                `${result.computed}개 문제의 통계가 계산되었습니다`,
                'success'
            );
            // Refresh display
            loadDigestSummary();
        } else {
            showStatus('compute-status', '통계 계산 실패', 'error');
        }
    } catch (error) {
        showStatus('compute-status', '오류: ' + error.message, 'error');
    }
}

// Test database connection
async function testConnection() {
    showStatus('db-status', '연결 테스트 중...', 'info');

    try {
        const result = await apiCall('/test-db');

        if (result.status === 'ok') {
            showStatus('db-status', result.message, 'success');
        } else {
            showStatus('db-status', '연결 실패', 'error');
        }
    } catch (error) {
        showStatus('db-status', '오류: ' + error.message, 'error');
    }
}

// Load digest summary for smartphone display
async function loadDigestSummary() {
    const summaryCard = document.getElementById('summary-card');
    const statsGrid = document.getElementById('stats-grid');
    const insightsSection = document.getElementById('insights-section');
    const categoryBreakdown = document.getElementById('category-breakdown');

    // Show loading state
    summaryCard.style.display = 'flex';
    summaryCard.className = 'summary-card loading';
    statsGrid.style.display = 'none';
    insightsSection.style.display = 'none';
    categoryBreakdown.style.display = 'none';

    try {
        const data = await apiCall('/digest/summary', 'GET');

        // Hide loading, show content
        summaryCard.style.display = 'none';
        statsGrid.style.display = 'grid';
        insightsSection.style.display = 'block';
        categoryBreakdown.style.display = 'block';

        // Update stats
        document.getElementById('total-problems').textContent = data.total_problems || 0;
        document.getElementById('total-attempts').textContent = data.total_attempts || 0;
        document.getElementById('avg-accuracy').textContent =
            data.average_accuracy ? `${data.average_accuracy}%` : '-';
        document.getElementById('avg-difficulty').textContent =
            data.average_difficulty ? data.average_difficulty.toFixed(1) : '-';

        // Update insights
        document.getElementById('difficult-topic').textContent =
            data.most_difficult_topic || 'N/A';

        const trendElement = document.getElementById('trend');
        const trendText = {
            'improving': '📈 향상 중',
            'declining': '📉 하락 중',
            'stable': '➡️ 안정적'
        };
        trendElement.textContent = trendText[data.improvement_trend] || '-';
        trendElement.className = `insight-value trend ${data.improvement_trend || ''}`;

        // Update category breakdown
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        if (data.category_breakdown && data.category_breakdown.length > 0) {
            data.category_breakdown.forEach(cat => {
                if (!cat.category) return;

                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                categoryItem.innerHTML = `
                    <div class="category-name">${cat.category}</div>
                    <div class="category-stats">
                        <span>
                            문제 수
                            <strong>${cat.problem_count}</strong>
                        </span>
                        <span>
                            정확도
                            <strong>${cat.avg_accuracy ? cat.avg_accuracy.toFixed(1) : 0}%</strong>
                        </span>
                        <span>
                            난이도
                            <strong>${cat.avg_difficulty ? cat.avg_difficulty.toFixed(1) : 0}</strong>
                        </span>
                    </div>
                `;
                categoryList.appendChild(categoryItem);
            });
        } else {
            categoryList.innerHTML = '<p style="text-align: center; color: #999;">데이터가 없습니다</p>';
        }

    } catch (error) {
        summaryCard.className = 'summary-card';
        summaryCard.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                <div>데이터를 불러올 수 없습니다</div>
                <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">
                    ${error.message}
                </div>
            </div>
        `;
    }
}

// Refresh button handler
document.addEventListener('DOMContentLoaded', () => {
    // Update clock every second
    updateClock();
    setInterval(updateClock, 1000);

    // Load initial data
    loadDigestSummary();

    // Auto-refresh every 30 seconds
    setInterval(loadDigestSummary, 30000);

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadDigestSummary();
    });

    // Test database connection on load
    testConnection();
});
