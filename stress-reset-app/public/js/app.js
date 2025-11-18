/**
 * Main Application Logic
 */

// Configuration
const API_BASE_URL = window.location.origin;

// Application state
let monitor = null;
let statsUpdateInterval = null;

// DOM Elements
const moodleForm = document.getElementById('moodle-form');
const moodleUserIdInput = document.getElementById('moodle-user-id');
const moodleCourseIdInput = document.getElementById('moodle-course-id');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const testEffectBtn = document.getElementById('test-effect-btn');
const testStressBtn = document.getElementById('test-stress-btn');
const monitorStatus = document.getElementById('monitor-status');
const studyTime = document.getElementById('study-time');
const stressScore = document.getElementById('stress-score');
const resetCount = document.getElementById('reset-count');
const activityLog = document.getElementById('activity-log');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadSavedSettings();
    addLog('시스템 준비 완료 / System ready', 'info');
});

// Setup Event Listeners
function setupEventListeners() {
    moodleForm.addEventListener('submit', handleStart);
    stopBtn.addEventListener('click', handleStop);
    testEffectBtn.addEventListener('click', testLightEffect);
    testStressBtn.addEventListener('click', testStressCheck);
}

// Handle Start Monitoring
async function handleStart(e) {
    e.preventDefault();

    const moodleUserId = parseInt(moodleUserIdInput.value);
    const moodleCourseId = moodleCourseIdInput.value
        ? parseInt(moodleCourseIdInput.value)
        : null;

    if (!moodleUserId) {
        addLog('Moodle User ID가 필요합니다 / Moodle User ID required', 'error');
        return;
    }

    try {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="spinner"></span> 시작 중...';

        // Create monitor
        monitor = new StressMonitor(API_BASE_URL, moodleUserId, moodleCourseId);

        // Setup event listeners
        monitor.on('started', handleMonitorStarted);
        monitor.on('stopped', handleMonitorStopped);
        monitor.on('stress_checked', handleStressChecked);
        monitor.on('reset_triggered', handleResetTriggered);
        monitor.on('reset_completed', handleResetCompleted);
        monitor.on('error', handleMonitorError);

        // Start monitoring
        await monitor.start();

        // Save settings
        saveSettings(moodleUserId, moodleCourseId);

        // Update UI
        moodleUserIdInput.disabled = true;
        moodleCourseIdInput.disabled = true;
        stopBtn.disabled = false;
        testStressBtn.disabled = false;

        // Start stats update
        statsUpdateInterval = setInterval(updateStats, 5000);
    } catch (error) {
        addLog(`시작 실패 / Start failed: ${error.message}`, 'error');
        startBtn.disabled = false;
        startBtn.textContent = '모니터링 시작 / Start Monitoring';
    }
}

// Handle Stop Monitoring
async function handleStop() {
    try {
        stopBtn.disabled = true;

        if (monitor) {
            await monitor.stop();
            monitor = null;
        }

        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            statsUpdateInterval = null;
        }

        // Reset UI
        startBtn.disabled = false;
        startBtn.textContent = '모니터링 시작 / Start Monitoring';
        moodleUserIdInput.disabled = false;
        moodleCourseIdInput.disabled = false;
        testStressBtn.disabled = true;

        monitorStatus.textContent = '비활성 / Inactive';
        monitorStatus.className = 'value inactive';
        studyTime.textContent = '0분';
        stressScore.textContent = '-';

        addLog('모니터링 중지됨 / Monitoring stopped', 'info');
    } catch (error) {
        addLog(`중지 실패 / Stop failed: ${error.message}`, 'error');
        stopBtn.disabled = false;
    }
}

// Monitor Event Handlers
function handleMonitorStarted(data) {
    monitorStatus.textContent = '활성 / Active';
    monitorStatus.className = 'value active';
    addLog(`모니터링 시작 (세션: ${data.sessionId}) / Monitoring started`, 'success');
}

function handleMonitorStopped() {
    monitorStatus.textContent = '비활성 / Inactive';
    monitorStatus.className = 'value inactive';
}

function handleStressChecked(data) {
    if (data.stress_score) {
        const score = Math.round(data.stress_score.combined_score);
        stressScore.textContent = `${score}/100`;

        // Color based on score
        stressScore.className = 'value';
        if (score < 40) {
            stressScore.classList.add('stress-low');
        } else if (score < 70) {
            stressScore.classList.add('stress-medium');
        } else {
            stressScore.classList.add('stress-high');
        }
    }
}

function handleResetTriggered(data) {
    addLog('⚡ 리셋 효과 실행 / Reset effect triggered', 'warning');

    // Update reset count
    const currentCount = parseInt(resetCount.textContent) || 0;
    resetCount.textContent = `${currentCount + 1}회`;
}

function handleResetCompleted(data) {
    addLog('✓ 리셋 완료 / Reset completed', 'success');
}

function handleMonitorError(error) {
    addLog(`오류 / Error: ${error.message}`, 'error');
}

// Update Statistics
async function updateStats() {
    if (!monitor) return;

    try {
        const stats = await monitor.getStats();

        // Update study time
        studyTime.textContent = `${Math.round(stats.duration_minutes)}분`;

        // Update reset count
        if (stats.reset_count !== undefined) {
            resetCount.textContent = `${stats.reset_count}회`;
        }

        // Update stress score
        if (stats.latest_stress_score) {
            const score = Math.round(stats.latest_stress_score.combined_score);
            stressScore.textContent = `${score}/100`;

            stressScore.className = 'value';
            if (score < 40) {
                stressScore.classList.add('stress-low');
            } else if (score < 70) {
                stressScore.classList.add('stress-medium');
            } else {
                stressScore.classList.add('stress-high');
            }
        }
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Test Light Effect
function testLightEffect() {
    addLog('광효과 테스트 실행 / Testing light effect', 'info');

    const effect = new LightEffect();
    effect.play(() => {
        addLog('광효과 테스트 완료 / Light effect test completed', 'success');
    });
}

// Test Stress Check
async function testStressCheck() {
    if (!monitor || !monitor.sessionId) {
        addLog('활성 세션이 없습니다 / No active session', 'error');
        return;
    }

    addLog('스트레스 체크 실행 / Checking stress level', 'info');

    try {
        await monitor.checkStress();
    } catch (error) {
        addLog(`스트레스 체크 실패 / Stress check failed: ${error.message}`, 'error');
    }
}

// Add Log Entry
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const timestamp = new Date().toLocaleTimeString('ko-KR');
    entry.innerHTML = `<span class="timestamp">${timestamp}</span>${message}`;

    activityLog.insertBefore(entry, activityLog.firstChild);

    // Limit log entries
    while (activityLog.children.length > 50) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

// Save Settings to LocalStorage
function saveSettings(userId, courseId) {
    localStorage.setItem('moodle_user_id', userId);
    if (courseId) {
        localStorage.setItem('moodle_course_id', courseId);
    }
}

// Load Saved Settings
function loadSavedSettings() {
    const savedUserId = localStorage.getItem('moodle_user_id');
    const savedCourseId = localStorage.getItem('moodle_course_id');

    if (savedUserId) {
        moodleUserIdInput.value = savedUserId;
    }

    if (savedCourseId) {
        moodleCourseIdInput.value = savedCourseId;
    }
}

// Handle Page Unload
window.addEventListener('beforeunload', (e) => {
    if (monitor && monitor.isActive) {
        e.preventDefault();
        e.returnValue = '';
        return '모니터링이 활성화되어 있습니다. 종료하시겠습니까?';
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (monitor) {
        monitor.stop();
    }
});
