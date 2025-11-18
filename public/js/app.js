/**
 * Alt42 Standalone v1.0 - Main Application Logic
 * Moodle LMS Integration
 */

// Global state
const AppState = {
    currentProblem: null,
    sessionId: 1, // Mock session ID
    overlayMode: 'toggle' // 'toggle' or 'slider'
};

/**
 * Load problem from API
 */
async function loadProblem(problemId) {
    try {
        showLoading(true);

        const response = await fetch(`../api/get_problem.php?id=${problemId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load problem');
        }

        AppState.currentProblem = result.data;
        displayProblem(result.data);
        showMessage('문제를 불러왔습니다!', 'success');

    } catch (error) {
        console.error('Load problem error:', error);
        showMessage('문제 불러오기 실패: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Display problem in UI
 */
function displayProblem(problem) {
    // Update problem info
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-description').textContent = problem.description || '';

    // Update code displays
    const originalCode = problem.original_code || '// 코드 없음';
    const substitutedCode = problem.substituted_code || '// 코드 없음';

    // Update toggle view
    document.getElementById('original-code').textContent = originalCode;
    document.getElementById('substituted-code').textContent = substitutedCode;

    // Update slider view
    document.getElementById('slider-original').textContent = originalCode;
    document.getElementById('slider-substituted').textContent = substitutedCode;

    // Apply syntax highlighting
    highlightCode();

    // Clear previous answer
    document.getElementById('user-answer').value = '';
    document.getElementById('result-message').textContent = '';
    document.getElementById('result-message').className = 'result-message';
}

/**
 * Submit user answer
 */
async function submitAnswer() {
    if (!AppState.currentProblem) {
        showMessage('먼저 문제를 불러주세요!', 'error');
        return;
    }

    const userAnswer = document.getElementById('user-answer').value.trim();

    if (!userAnswer) {
        showMessage('답을 입력해주세요!', 'error');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch('../api/submit_answer.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: AppState.sessionId,
                problem_id: AppState.currentProblem.id,
                answer: userAnswer
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to submit answer');
        }

        if (result.data.is_correct) {
            showMessage('정답입니다! 🎉', 'success');
        } else {
            showMessage('오답입니다. 다시 시도해보세요!', 'error');
        }

    } catch (error) {
        console.error('Submit answer error:', error);
        showMessage('제출 실패: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Show loading state
 */
function showLoading(isLoading) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = isLoading;
    });

    if (isLoading) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('result-message');
    messageEl.textContent = message;
    messageEl.className = 'result-message ' + type;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageEl.textContent === message) {
            messageEl.textContent = '';
            messageEl.className = 'result-message';
        }
    }, 5000);
}

/**
 * Simple syntax highlighting
 */
function highlightCode() {
    const codeBlocks = document.querySelectorAll('.code-block');

    codeBlocks.forEach(block => {
        let code = block.textContent;

        // Highlight keywords
        code = code.replace(/\b(function|const|let|var|return|if|else|for|while|class)\b/g,
            '<span class="keyword">$1</span>');

        // Highlight function names
        code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
            '<span class="function">$1</span>(');

        // Highlight strings
        code = code.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        code = code.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');

        // Highlight comments
        code = code.replace(/\/\/(.*?)$/gm, '<span class="comment">//$1</span>');
        code = code.replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>');

        block.innerHTML = code;
    });
}

/**
 * Initialize app on page load
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('Alt42 Standalone v1.0 initialized');

    // Set default view
    switchView('before');

    // Load first problem by default
    setTimeout(() => {
        loadProblem(1);
    }, 500);
});

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
    }

    // Ctrl/Cmd + 1/2 to switch views
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        switchView('before');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        switchView('after');
    }
});
