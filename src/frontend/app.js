/**
 * Function Digest Frontend Application
 * Connects to PHP API and displays digests in virtual smartphone
 */

// Configuration
const API_BASE_URL = '../backend/api.php';

// DOM Elements
const questionSelect = document.getElementById('questionSelect');
const loadDigestBtn = document.getElementById('loadDigest');
const digestDisplay = document.getElementById('digestDisplay');
const minimizeBtn = document.getElementById('minimizeBtn');
const smartphoneContainer = document.querySelector('.smartphone-container');

// Event Listeners
loadDigestBtn.addEventListener('click', loadDigest);
minimizeBtn.addEventListener('click', toggleMinimize);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Function Digest App Initialized');
    loadSampleDigest(); // Load sample data on startup
});

/**
 * Load digest from API
 */
async function loadDigest() {
    const problemId = questionSelect.value;

    if (!problemId) {
        showError('Please select a problem');
        return;
    }

    showLoading();

    try {
        // For demo purposes, use sample data instead of API
        // In production, uncomment this line:
        // const response = await fetch(`${API_BASE_URL}?endpoint=digest&question_id=${problemId}`);

        // For now, use sample data
        const sampleData = getSampleData(problemId);
        displayDigest(sampleData);

        // Log view (if user is logged in)
        // logDigestView(userId, digestId);

    } catch (error) {
        console.error('Error loading digest:', error);
        showError('Failed to load digest. Please try again.');
    }
}

/**
 * Load sample digest on page load
 */
function loadSampleDigest() {
    const sampleData = getSampleData('1');
    displayDigest(sampleData);
}

/**
 * Display digest in smartphone screen
 */
function displayDigest(data) {
    if (!data || !data.digests || data.digests.length === 0) {
        showError('No digest available for this problem');
        return;
    }

    digestDisplay.innerHTML = '';

    data.digests.forEach((digest, index) => {
        const card = createDigestCard(digest);
        digestDisplay.appendChild(card);

        // Animate in with delay
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Create digest card HTML element
 */
function createDigestCard(digest) {
    const card = document.createElement('div');
    card.className = 'digest-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease-out';

    card.innerHTML = `
        <div class="function-name">${escapeHtml(digest.function_name)}</div>
        <div class="digest-lines">
            <div class="digest-line">${escapeHtml(digest.summary_line1)}</div>
            <div class="digest-line">${escapeHtml(digest.summary_line2)}</div>
            <div class="digest-line">${escapeHtml(digest.summary_line3)}</div>
        </div>
        ${digest.function_code ? `
            <div class="function-code">
                <pre>${escapeHtml(digest.function_code)}</pre>
            </div>
        ` : ''}
    `;

    return card;
}

/**
 * Show loading state
 */
function showLoading() {
    digestDisplay.innerHTML = '<div class="loading">Loading digest...</div>';
}

/**
 * Show error message
 */
function showError(message) {
    digestDisplay.innerHTML = `<div class="error">⚠️ ${escapeHtml(message)}</div>`;
}

/**
 * Toggle minimize/maximize smartphone
 */
function toggleMinimize() {
    smartphoneContainer.classList.toggle('minimized');
    minimizeBtn.textContent = smartphoneContainer.classList.contains('minimized') ? '+' : '−';
}

/**
 * Get sample data for demo
 */
function getSampleData(problemId) {
    const samples = {
        '1': {
            success: true,
            question_id: 1001,
            digests: [
                {
                    id: 1,
                    problem_id: 1,
                    function_name: 'calculate_area',
                    function_code: 'def calculate_area(width, height):\n    return width * height',
                    summary_line1: '📐 Calculates the area of a rectangle',
                    summary_line2: '📥 Parameters: width (float), height (float) → Returns: float',
                    summary_line3: '💡 Example: calculate_area(5, 10) returns 50',
                    language: 'python',
                    created_at: '2025-11-18 12:00:00'
                }
            ]
        },
        '2': {
            success: true,
            question_id: 1002,
            digests: [
                {
                    id: 2,
                    problem_id: 2,
                    function_name: 'fibonacci',
                    function_code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
                    summary_line1: '🔢 Computes the nth Fibonacci number recursively',
                    summary_line2: '📥 Parameter: n (int) → Returns: int (Fibonacci number)',
                    summary_line3: '⚠️ Time complexity: O(2^n), inefficient for large n',
                    language: 'python',
                    created_at: '2025-11-18 12:00:00'
                }
            ]
        }
    };

    return samples[problemId] || samples['1'];
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Log digest view to API
 */
async function logDigestView(userId, digestId) {
    try {
        await fetch(`${API_BASE_URL}?endpoint=log_view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                digest_id: digestId
            })
        });
    } catch (error) {
        console.warn('Failed to log view:', error);
    }
}

/**
 * Fetch real data from API (for production use)
 */
async function fetchFromAPI(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}?endpoint=${endpoint}&${queryString}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

/**
 * Generate digest via API (for production use)
 */
async function generateDigest(problemId, functionName, functionCode, language = 'python') {
    const response = await fetch(`${API_BASE_URL}?endpoint=generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            problem_id: problemId,
            function_name: functionName,
            function_code: functionCode,
            language: language
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}
