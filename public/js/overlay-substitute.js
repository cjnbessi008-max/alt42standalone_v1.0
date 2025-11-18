/**
 * Overlay Substitute Logic
 * 치환 전/후 코드 비교 및 전환 (겹침 방지)
 */

let currentView = 'before';
let overlayMode = 'toggle'; // 'toggle' or 'slider'

/**
 * Switch between before/after views
 * 겹침 없이 명확하게 전환
 */
function switchView(view) {
    if (view !== 'before' && view !== 'after') {
        console.error('Invalid view:', view);
        return;
    }

    currentView = view;

    // Update panels
    const beforePanel = document.getElementById('before-panel');
    const afterPanel = document.getElementById('after-panel');

    if (view === 'before') {
        beforePanel.classList.add('active');
        afterPanel.classList.remove('active');
    } else {
        beforePanel.classList.remove('active');
        afterPanel.classList.add('active');
    }

    // Update toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    console.log('Switched to view:', view);
}

/**
 * Toggle between overlay modes (toggle/slider)
 */
function toggleOverlayMode() {
    overlayMode = overlayMode === 'toggle' ? 'slider' : 'toggle';

    const codeDisplayWrapper = document.querySelector('.code-display-wrapper');
    const sliderView = document.querySelector('.slider-view');
    const overlayToggle = document.querySelector('.overlay-toggle');

    if (overlayMode === 'slider') {
        codeDisplayWrapper.style.display = 'none';
        overlayToggle.style.display = 'none';
        sliderView.style.display = 'flex';
        updateOverlaySlider(50); // Reset to middle
    } else {
        codeDisplayWrapper.style.display = 'block';
        overlayToggle.style.display = 'flex';
        sliderView.style.display = 'none';
    }

    console.log('Overlay mode:', overlayMode);
}

/**
 * Update overlay slider position
 * 슬라이더로 치환 전/후 비율 조절
 */
function updateOverlaySlider(value) {
    const sliderBefore = document.getElementById('slider-before');
    const sliderAfter = document.getElementById('slider-after');

    if (!sliderBefore || !sliderAfter) return;

    // Calculate clip-path based on slider value
    const percentage = parseInt(value);

    // Before code shows from left
    sliderBefore.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    sliderBefore.style.opacity = percentage / 100;

    // After code shows from right
    sliderAfter.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    sliderAfter.style.opacity = (100 - percentage) / 100;
}

/**
 * Compare and highlight differences between original and substituted code
 */
function highlightDifferences() {
    if (!AppState.currentProblem) return;

    const originalCode = AppState.currentProblem.original_code || '';
    const substitutedCode = AppState.currentProblem.substituted_code || '';

    const originalLines = originalCode.split('\n');
    const substitutedLines = substitutedCode.split('\n');

    // Simple line-by-line comparison
    const maxLines = Math.max(originalLines.length, substitutedLines.length);
    const diffResults = {
        before: [],
        after: []
    };

    for (let i = 0; i < maxLines; i++) {
        const originalLine = originalLines[i] || '';
        const substitutedLine = substitutedLines[i] || '';

        if (originalLine === substitutedLine) {
            diffResults.before.push(originalLine);
            diffResults.after.push(substitutedLine);
        } else {
            // Highlight differences
            const beforeDiff = highlightLineDiff(originalLine, substitutedLine, 'remove');
            const afterDiff = highlightLineDiff(substitutedLine, originalLine, 'add');

            diffResults.before.push(beforeDiff);
            diffResults.after.push(afterDiff);
        }
    }

    return diffResults;
}

/**
 * Highlight differences in a single line
 */
function highlightLineDiff(line, compareLine, type) {
    if (line === compareLine) return line;

    // Simple word-level diff
    const words = line.split(/(\s+)/);
    const compareWords = compareLine.split(/(\s+)/);

    const highlighted = words.map((word, idx) => {
        if (word !== compareWords[idx]) {
            const className = type === 'add' ? 'code-diff-add' : 'code-diff-remove';
            return `<span class="${className}">${escapeHtml(word)}</span>`;
        }
        return escapeHtml(word);
    });

    return highlighted.join('');
}

/**
 * Escape HTML entities
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
 * Auto-advance feature - automatically show before -> after
 */
let autoAdvanceInterval = null;

function startAutoAdvance(delayMs = 3000) {
    stopAutoAdvance();

    autoAdvanceInterval = setInterval(() => {
        if (currentView === 'before') {
            switchView('after');
        } else {
            switchView('before');
        }
    }, delayMs);
}

function stopAutoAdvance() {
    if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
    }
}

/**
 * Side-by-side comparison mode
 */
function enableSideBySideMode() {
    const beforePanel = document.getElementById('before-panel');
    const afterPanel = document.getElementById('after-panel');
    const wrapper = document.querySelector('.code-display-wrapper');

    // Show both panels side by side
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';

    beforePanel.style.position = 'relative';
    afterPanel.style.position = 'relative';
    beforePanel.style.width = '50%';
    afterPanel.style.width = '50%';
    beforePanel.style.opacity = '1';
    afterPanel.style.opacity = '1';
    beforePanel.style.visibility = 'visible';
    afterPanel.style.visibility = 'visible';

    beforePanel.classList.add('active');
    afterPanel.classList.add('active');
}

/**
 * Reset to default overlay mode
 */
function resetOverlayMode() {
    const beforePanel = document.getElementById('before-panel');
    const afterPanel = document.getElementById('after-panel');
    const wrapper = document.querySelector('.code-display-wrapper');

    wrapper.style.display = 'block';
    wrapper.style.flexDirection = '';

    beforePanel.style.position = '';
    afterPanel.style.position = '';
    beforePanel.style.width = '';
    afterPanel.style.width = '';

    switchView('before');
}

/**
 * Initialize overlay controls
 */
function initializeOverlayControls() {
    // Add keyboard shortcuts for overlay
    document.addEventListener('keydown', (e) => {
        // Arrow keys to switch views
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            switchView('before');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            switchView('after');
        }

        // Space to toggle auto-advance
        if (e.key === ' ' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (autoAdvanceInterval) {
                stopAutoAdvance();
            } else {
                startAutoAdvance();
            }
        }
    });

    console.log('Overlay controls initialized');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initializeOverlayControls();
});
