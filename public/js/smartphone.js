/**
 * Virtual Smartphone Display
 * Shows problems on a virtual mobile device
 */

// Smartphone State
const SmartphoneState = {
    currentSet: null,
    problems: [],
    currentIndex: 0,
    isVisible: true
};

// DOM Elements
const SmartphoneDOM = {
    smartphone: null,
    toggleBtn: null,
    currentProblem: null,
    prevBtn: null,
    nextBtn: null,
    progressBar: null
};

/**
 * Initialize Smartphone
 */
function initSmartphone() {
    // Get DOM elements
    SmartphoneDOM.smartphone = document.getElementById('smartphone');
    SmartphoneDOM.toggleBtn = document.getElementById('toggleSmartphone');
    SmartphoneDOM.currentProblem = document.getElementById('currentProblem');
    SmartphoneDOM.prevBtn = document.getElementById('prevProblem');
    SmartphoneDOM.nextBtn = document.getElementById('nextProblem');
    SmartphoneDOM.progressBar = document.querySelector('.progress-fill');

    // Attach event listeners
    SmartphoneDOM.toggleBtn.addEventListener('click', toggleSmartphone);
    SmartphoneDOM.prevBtn.addEventListener('click', showPreviousProblem);
    SmartphoneDOM.nextBtn.addEventListener('click', showNextProblem);

    // Show toggle button
    SmartphoneDOM.toggleBtn.classList.add('show');

    console.log('Smartphone initialized');
}

/**
 * Toggle Smartphone Visibility
 */
function toggleSmartphone() {
    SmartphoneState.isVisible = !SmartphoneState.isVisible;

    if (SmartphoneState.isVisible) {
        SmartphoneDOM.smartphone.classList.remove('hidden');
        SmartphoneDOM.toggleBtn.textContent = '✖️';
    } else {
        SmartphoneDOM.smartphone.classList.add('hidden');
        SmartphoneDOM.toggleBtn.textContent = '📱';
    }
}

/**
 * Update Smartphone with Selected Set
 */
function updateSmartphoneSet(set) {
    SmartphoneState.currentSet = set;
    SmartphoneState.currentIndex = 0;

    // Fetch problems for this set
    fetchSetProblems(set.id);
}

/**
 * Fetch problems for a set
 */
async function fetchSetProblems(setId) {
    try {
        const response = await fetch(`../api/endpoints/get_problems.php?set_id=${setId}`);
        const data = await response.json();

        if (data.success) {
            SmartphoneState.problems = data.data.problems;
            SmartphoneState.currentIndex = 0;

            if (SmartphoneState.problems.length > 0) {
                displayCurrentProblem();
                updateNavigationButtons();
                updateProgressBar();
            } else {
                showNoProblemMessage();
            }
        }
    } catch (error) {
        console.error('Error fetching set problems:', error);
        showErrorMessage('문제를 불러오는데 실패했습니다.');
    }
}

/**
 * Display current problem
 */
function displayCurrentProblem() {
    const problem = SmartphoneState.problems[SmartphoneState.currentIndex];

    if (!problem) {
        showNoProblemMessage();
        return;
    }

    const difficultyStars = '⭐'.repeat(problem.difficulty_level);

    SmartphoneDOM.currentProblem.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <span style="background: ${problem.set_color || '#3498db'};
                         color: white;
                         padding: 0.3rem 0.6rem;
                         border-radius: 5px;
                         font-size: 0.8rem;">
                ${problem.set_name || ''}
            </span>
        </div>
        <div style="font-size: 1rem; margin-bottom: 1rem; line-height: 1.6;">
            ${problem.question_text}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #7f8c8d;">
            <span>${difficultyStars}</span>
            <span>문제 ${SmartphoneState.currentIndex + 1} / ${SmartphoneState.problems.length}</span>
        </div>
    `;
}

/**
 * Display single problem on smartphone
 */
function displayProblemOnSmartphone(problem) {
    const difficultyStars = '⭐'.repeat(problem.difficulty_level);

    SmartphoneDOM.currentProblem.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <span style="background: #2ecc71;
                         color: white;
                         padding: 0.3rem 0.6rem;
                         border-radius: 5px;
                         font-size: 0.8rem;">
                선택된 문제
            </span>
        </div>
        <div style="font-size: 1rem; margin-bottom: 1rem; line-height: 1.6;">
            ${problem.question_text}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #7f8c8d;">
            <span>${difficultyStars}</span>
            <span>난이도: ${problem.difficulty_level}</span>
        </div>
        <div style="margin-top: 1rem; padding: 0.8rem; background: #ecf0f1; border-radius: 5px; font-size: 0.85rem;">
            <strong>유형:</strong> ${problem.question_type}<br>
            <strong>태그:</strong> ${problem.tags || '없음'}
        </div>
    `;

    // Disable navigation buttons for single problem view
    SmartphoneDOM.prevBtn.disabled = true;
    SmartphoneDOM.nextBtn.disabled = true;
    SmartphoneDOM.progressBar.style.width = '100%';
}

/**
 * Show previous problem
 */
function showPreviousProblem() {
    if (SmartphoneState.currentIndex > 0) {
        SmartphoneState.currentIndex--;
        displayCurrentProblem();
        updateNavigationButtons();
        updateProgressBar();
    }
}

/**
 * Show next problem
 */
function showNextProblem() {
    if (SmartphoneState.currentIndex < SmartphoneState.problems.length - 1) {
        SmartphoneState.currentIndex++;
        displayCurrentProblem();
        updateNavigationButtons();
        updateProgressBar();
    }
}

/**
 * Update navigation buttons state
 */
function updateNavigationButtons() {
    SmartphoneDOM.prevBtn.disabled = SmartphoneState.currentIndex === 0;
    SmartphoneDOM.nextBtn.disabled = SmartphoneState.currentIndex === SmartphoneState.problems.length - 1;
}

/**
 * Update progress bar
 */
function updateProgressBar() {
    const total = SmartphoneState.problems.length;
    const current = SmartphoneState.currentIndex + 1;
    const percentage = (current / total) * 100;

    SmartphoneDOM.progressBar.style.width = `${percentage}%`;
}

/**
 * Show no problem message
 */
function showNoProblemMessage() {
    SmartphoneDOM.currentProblem.innerHTML = `
        <div style="text-align: center; color: #95a5a6;">
            <p style="font-size: 2rem; margin-bottom: 0.5rem;">📚</p>
            <p>이 집합에는 문제가 없습니다.</p>
        </div>
    `;

    SmartphoneDOM.prevBtn.disabled = true;
    SmartphoneDOM.nextBtn.disabled = true;
    SmartphoneDOM.progressBar.style.width = '0%';
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    SmartphoneDOM.currentProblem.innerHTML = `
        <div style="text-align: center; color: #e74c3c;">
            <p style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</p>
            <p>${message}</p>
        </div>
    `;

    SmartphoneDOM.prevBtn.disabled = true;
    SmartphoneDOM.nextBtn.disabled = true;
    SmartphoneDOM.progressBar.style.width = '0%';
}

/**
 * Keyboard navigation
 */
document.addEventListener('keydown', (e) => {
    if (!SmartphoneState.isVisible) return;

    switch (e.key) {
        case 'ArrowLeft':
            if (!SmartphoneDOM.prevBtn.disabled) {
                showPreviousProblem();
            }
            break;
        case 'ArrowRight':
            if (!SmartphoneDOM.nextBtn.disabled) {
                showNextProblem();
            }
            break;
    }
});

/**
 * Touch gestures for mobile
 */
let touchStartX = 0;
let touchEndX = 0;

SmartphoneDOM.smartphone?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

SmartphoneDOM.smartphone?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50;

    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left - next problem
        if (!SmartphoneDOM.nextBtn.disabled) {
            showNextProblem();
        }
    }

    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right - previous problem
        if (!SmartphoneDOM.prevBtn.disabled) {
            showPreviousProblem();
        }
    }
}
