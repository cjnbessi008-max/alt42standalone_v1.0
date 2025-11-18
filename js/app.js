/**
 * Main Application Logic
 * Handles UI interactions and API communication
 */

// Configuration
const API_BASE_URL = './api';

// Global state
let curvyLog = null;
let currentData = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Curvy Log canvas
    curvyLog = new CurvyLog('curvyCanvas', {
        animationSpeed: 2,
        curveIntensity: 0.6,
        colors: {
            primary: '#4ECDC4',
            secondary: '#FF6B6B',
            accent: '#FFE66D'
        }
    });

    // Setup event listeners
    setupEventListeners();

    // Update time display
    updateTime();
    setInterval(updateTime, 1000);

    // Load demo data if available
    loadDemoData();
}

function setupEventListeners() {
    // Load data button
    document.getElementById('loadData').addEventListener('click', loadData);

    // Play animation button
    document.getElementById('playAnimation').addEventListener('click', playAnimation);

    // Animation speed control
    const speedSlider = document.getElementById('animationSpeed');
    speedSlider.addEventListener('input', function() {
        const speed = parseFloat(this.value);
        document.getElementById('speedValue').textContent = speed + 'x';
        if (curvyLog) {
            curvyLog.setSpeed(speed);
        }
    });

    // Curve intensity control
    const curveSlider = document.getElementById('curveIntensity');
    curveSlider.addEventListener('input', function() {
        const intensity = parseFloat(this.value);
        document.getElementById('curveValue').textContent = intensity;
        if (curvyLog) {
            curvyLog.setCurveIntensity(intensity);
        }
    });

    // Setup animation completion callback
    if (curvyLog) {
        curvyLog.onComplete(() => {
            console.log('Animation completed!');
            document.getElementById('playAnimation').textContent = 'Replay Animation';
        });
    }
}

async function loadData() {
    const userId = document.getElementById('userId').value;
    const dataType = document.getElementById('dataType').value;
    const loadBtn = document.getElementById('loadData');

    loadBtn.classList.add('loading');
    loadBtn.disabled = true;

    try {
        let endpoint;
        let params = `user_id=${userId}`;

        if (dataType === 'quiz') {
            endpoint = `${API_BASE_URL}/get_quiz_data.php`;
        } else {
            endpoint = `${API_BASE_URL}/get_log_data.php`;
            params += '&limit=50';
        }

        const response = await fetch(`${endpoint}?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            currentData = result.data;
            displayDataInfo(result);
            curvyLog.setData(result.data);
            updateCurrentPoint(null); // Reset display
            showNotification('Data loaded successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to load data');
        }

    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data: ' + error.message, 'error');

        // Load demo data as fallback
        loadDemoData();
    } finally {
        loadBtn.classList.remove('loading');
        loadBtn.disabled = false;
    }
}

function loadDemoData() {
    // Generate demo data for testing
    const demoData = [];
    const baseValue = 2;

    for (let i = 0; i < 20; i++) {
        const variance = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2;
        demoData.push({
            x: i,
            y: baseValue + variance,
            timestamp: Date.now() - (20 - i) * 3600000,
            event: 'Demo Event ' + (i + 1),
            rawScore: 60 + Math.random() * 40
        });
    }

    currentData = demoData;
    curvyLog.setData(demoData);

    displayDataInfo({
        success: true,
        count: demoData.length,
        data: demoData,
        metadata: {
            userId: 'demo',
            generatedAt: Date.now()
        }
    });

    showNotification('Demo data loaded', 'info');
}

function playAnimation() {
    if (!currentData || currentData.length === 0) {
        showNotification('Please load data first', 'warning');
        return;
    }

    curvyLog.play();
    document.getElementById('playAnimation').textContent = 'Playing...';

    // Update current point display during animation
    const updateInterval = setInterval(() => {
        const currentPoint = curvyLog.getCurrentPoint();
        updateCurrentPoint(currentPoint);

        if (!curvyLog.isAnimating) {
            clearInterval(updateInterval);
        }
    }, 100);
}

function displayDataInfo(result) {
    const infoDiv = document.getElementById('dataInfo');

    const html = `
        <p><strong>Status:</strong> <span style="color: #50c878;">✓ Loaded</span></p>
        <p><strong>Data Points:</strong> ${result.count}</p>
        <p><strong>User ID:</strong> ${result.metadata.userId}</p>
        <p><strong>Type:</strong> ${document.getElementById('dataType').value === 'quiz' ? 'Quiz Attempts' : 'Activity Logs'}</p>
        <p><strong>Generated:</strong> ${new Date(result.metadata.generatedAt * 1000).toLocaleString()}</p>
        ${result.data.length > 0 ? `
        <p><strong>Value Range:</strong> ${Math.min(...result.data.map(d => d.y)).toFixed(2)} - ${Math.max(...result.data.map(d => d.y)).toFixed(2)}</p>
        ` : ''}
    `;

    infoDiv.innerHTML = html;
    infoDiv.classList.add('fade-in');
}

function updateCurrentPoint(point) {
    const pointInfo = document.getElementById('currentPoint');

    if (!point) {
        pointInfo.innerHTML = '<span class="label">Ready to animate</span>';
        return;
    }

    const html = `
        <span class="label">Current Point</span>
        <div style="margin-top: 5px; font-size: 0.9em;">
            ${point.event ? `<div><strong>Event:</strong> ${point.event}</div>` : ''}
            ${point.rawScore ? `<div><strong>Score:</strong> ${point.rawScore.toFixed(1)}%</div>` : ''}
            ${point.quizName ? `<div><strong>Quiz:</strong> ${point.quizName}</div>` : ''}
            <div><strong>Log Value:</strong> ${point.y.toFixed(3)}</div>
            ${point.timestamp ? `<div><strong>Time:</strong> ${new Date(point.timestamp * 1000).toLocaleTimeString()}</div>` : ''}
        </div>
    `;

    pointInfo.innerHTML = html;
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#50c878' : type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffa500' : '#4a90e2'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for debugging
window.curvyLog = curvyLog;
window.loadDemoData = loadDemoData;
