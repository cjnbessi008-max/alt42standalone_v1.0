/**
 * Set MiniMap - Main Application Logic
 */

// Configuration
const CONFIG = {
    API_BASE: '../api/endpoints/',
    TOAST_DURATION: 3000
};

// Application State
const AppState = {
    sets: [],
    relationships: [],
    problems: [],
    currentSet: null,
    currentProblem: null,
    layoutType: 'tree',
    zoomLevel: 1.0
};

// DOM Elements
const DOM = {
    setList: null,
    problemList: null,
    syncBtn: null,
    layoutSelector: null,
    zoomInBtn: null,
    zoomOutBtn: null,
    resetViewBtn: null,
    toast: null,
    loading: null
};

/**
 * Initialize Application
 */
async function init() {
    // Get DOM elements
    DOM.setList = document.getElementById('setList');
    DOM.problemList = document.getElementById('problemList');
    DOM.syncBtn = document.getElementById('syncBtn');
    DOM.layoutSelector = document.getElementById('layoutSelector');
    DOM.zoomInBtn = document.getElementById('zoomInBtn');
    DOM.zoomOutBtn = document.getElementById('zoomOutBtn');
    DOM.resetViewBtn = document.getElementById('resetViewBtn');
    DOM.toast = document.getElementById('toast');
    DOM.loading = document.getElementById('loading');

    // Attach event listeners
    attachEventListeners();

    // Load initial data
    await loadSets();
    await loadProblems();

    // Initialize MiniMap
    if (typeof initMiniMap === 'function') {
        initMiniMap(AppState.sets, AppState.relationships);
    }

    // Initialize Smartphone
    if (typeof initSmartphone === 'function') {
        initSmartphone();
    }

    console.log('Set MiniMap initialized');
}

/**
 * Attach Event Listeners
 */
function attachEventListeners() {
    DOM.syncBtn.addEventListener('click', syncMoodle);
    DOM.layoutSelector.addEventListener('change', handleLayoutChange);
    DOM.zoomInBtn.addEventListener('click', () => handleZoom(0.1));
    DOM.zoomOutBtn.addEventListener('click', () => handleZoom(-0.1));
    DOM.resetViewBtn.addEventListener('click', resetView);
}

/**
 * Load Sets from API
 */
async function loadSets() {
    try {
        showLoading(true);
        const response = await fetch(CONFIG.API_BASE + 'get_sets.php');
        const data = await response.json();

        if (data.success) {
            AppState.sets = data.data.sets;
            AppState.relationships = data.data.relationships;
            renderSetList(data.data.tree);
            showToast('집합 데이터 로드 완료', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading sets:', error);
        showToast('집합 데이터 로드 실패: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Load Problems from API
 */
async function loadProblems(setId = null) {
    try {
        const url = setId
            ? `${CONFIG.API_BASE}get_problems.php?set_id=${setId}`
            : `${CONFIG.API_BASE}get_problems.php`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            AppState.problems = data.data.problems;
            renderProblemList(data.data.problems);

            if (setId) {
                showToast(`${data.data.total}개의 문제 로드 완료`, 'success');
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading problems:', error);
        showToast('문제 데이터 로드 실패: ' + error.message, 'error');
    }
}

/**
 * Render Set List
 */
function renderSetList(sets) {
    DOM.setList.innerHTML = '';

    if (sets.length === 0) {
        DOM.setList.innerHTML = '<p style="color: #95a5a6;">집합이 없습니다.</p>';
        return;
    }

    sets.forEach(set => {
        const setItem = createSetItem(set);
        DOM.setList.appendChild(setItem);

        // Render children if any
        if (set.children && set.children.length > 0) {
            set.children.forEach(child => {
                const childItem = createSetItem(child, true);
                DOM.setList.appendChild(childItem);
            });
        }
    });
}

/**
 * Create Set Item Element
 */
function createSetItem(set, isChild = false) {
    const div = document.createElement('div');
    div.className = 'set-item';
    div.dataset.setId = set.id;
    div.style.borderLeftColor = set.color;

    if (isChild) {
        div.style.marginLeft = '20px';
        div.style.fontSize = '0.9rem';
    }

    div.innerHTML = `
        <div class="set-item-name">${set.name}</div>
        <div class="set-item-count">${set.problems_count || 0}개 문제</div>
    `;

    div.addEventListener('click', () => selectSet(set));

    return div;
}

/**
 * Render Problem List
 */
function renderProblemList(problems) {
    DOM.problemList.innerHTML = '';

    if (problems.length === 0) {
        DOM.problemList.innerHTML = '<p style="color: #95a5a6;">문제가 없습니다.</p>';
        return;
    }

    problems.forEach(problem => {
        const problemItem = createProblemItem(problem);
        DOM.problemList.appendChild(problemItem);
    });
}

/**
 * Create Problem Item Element
 */
function createProblemItem(problem) {
    const div = document.createElement('div');
    div.className = 'problem-item';
    div.dataset.problemId = problem.id;

    const difficultyText = '⭐'.repeat(problem.difficulty_level);

    div.innerHTML = `
        <div>${problem.question_text}</div>
        <span class="problem-difficulty">${difficultyText} Lv.${problem.difficulty_level}</span>
    `;

    div.addEventListener('click', () => selectProblem(problem));

    return div;
}

/**
 * Select Set
 */
function selectSet(set) {
    AppState.currentSet = set;

    // Update UI
    document.querySelectorAll('.set-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load problems for this set
    loadProblems(set.id);

    // Update MiniMap highlight
    if (typeof highlightSetInMiniMap === 'function') {
        highlightSetInMiniMap(set.id);
    }

    // Update smartphone display
    if (typeof updateSmartphoneSet === 'function') {
        updateSmartphoneSet(set);
    }

    showToast(`"${set.name}" 집합 선택됨`, 'success');
}

/**
 * Select Problem
 */
function selectProblem(problem) {
    AppState.currentProblem = problem;

    // Update UI
    document.querySelectorAll('.problem-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update smartphone display
    if (typeof displayProblemOnSmartphone === 'function') {
        displayProblemOnSmartphone(problem);
    }

    showToast('문제 선택됨', 'success');
}

/**
 * Sync with Moodle
 */
async function syncMoodle() {
    try {
        showLoading(true);
        DOM.syncBtn.disabled = true;
        DOM.syncBtn.innerHTML = '<span class="icon">⏳</span> 동기화 중...';

        const response = await fetch(CONFIG.API_BASE + 'sync_moodle.php', {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            await loadProblems();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error syncing Moodle:', error);
        showToast('Moodle 동기화 실패: ' + error.message, 'error');
    } finally {
        showLoading(false);
        DOM.syncBtn.disabled = false;
        DOM.syncBtn.innerHTML = '<span class="icon">🔄</span> Moodle 동기화';
    }
}

/**
 * Handle Layout Change
 */
function handleLayoutChange(event) {
    AppState.layoutType = event.target.value;

    if (typeof updateMiniMapLayout === 'function') {
        updateMiniMapLayout(AppState.layoutType);
    }

    showToast(`레이아웃 변경: ${event.target.options[event.target.selectedIndex].text}`, 'success');
}

/**
 * Handle Zoom
 */
function handleZoom(delta) {
    AppState.zoomLevel = Math.max(0.5, Math.min(2.0, AppState.zoomLevel + delta));

    if (typeof zoomMiniMap === 'function') {
        zoomMiniMap(AppState.zoomLevel);
    }

    showToast(`확대/축소: ${Math.round(AppState.zoomLevel * 100)}%`, 'success');
}

/**
 * Reset View
 */
function resetView() {
    AppState.zoomLevel = 1.0;

    if (typeof resetMiniMapView === 'function') {
        resetMiniMapView();
    }

    showToast('뷰 초기화 완료', 'success');
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'info') {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;

    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

/**
 * Show/Hide Loading Indicator
 */
function showLoading(show) {
    if (show) {
        DOM.loading.classList.add('show');
    } else {
        DOM.loading.classList.remove('show');
    }
}

/**
 * Get Current State (for other modules)
 */
function getAppState() {
    return AppState;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
