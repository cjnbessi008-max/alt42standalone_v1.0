/**
 * Perm-Comb Rhythm App - Main Application Logic
 *
 * @copyright 2025 KAIST Touch Math Academy
 */

// Configuration
const CONFIG = {
    PERM_COLOR: '#667eea',
    PERM_COLOR_LIGHT: '#8b9df7',
    COMB_COLOR: '#f5576c',
    COMB_COLOR_LIGHT: '#ff8fa3',
    BEAT_DURATION: 400, // milliseconds per beat
    ANIMATION_FPS: 60
};

// Global state
let currentProblem = null;
let isPlaying = false;
let startTime = null;
let activityId = null;

// Audio context for sound
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Initialize the app
 */
function init() {
    // Get activity ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    activityId = urlParams.get('id');

    if (!activityId) {
        console.error('No activity ID provided');
        return;
    }

    // Setup event listeners
    document.getElementById('playButton').addEventListener('click', playRhythm);
    document.getElementById('submitButton').addEventListener('click', submitAnswer);
    document.getElementById('nextButton').addEventListener('click', loadNextProblem);

    // Load initial problem
    loadNextProblem();

    // Load statistics
    loadStatistics();
}

/**
 * Load a new problem from the API
 */
async function loadNextProblem() {
    showLoading(true);
    startTime = Date.now();

    try {
        const response = await fetch(`../api.php?action=getproblem&id=${activityId}`);
        const data = await response.json();

        if (data.success) {
            currentProblem = data.problem;
            displayProblem(currentProblem);
            drawRhythmPattern(currentProblem);
        } else {
            showError('문제를 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('Error loading problem:', error);
        showError('네트워크 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
}

/**
 * Display the problem on screen
 */
function displayProblem(problem) {
    // Update problem display
    document.getElementById('problemN').textContent = problem.n;
    document.getElementById('problemR').textContent = problem.r;

    // Update problem type badge (without revealing the answer)
    const badge = document.getElementById('problemTypeBadge');
    badge.className = 'problem-type-badge';
    document.getElementById('problemTypeText').textContent = '?????';

    // Reset input and feedback
    document.getElementById('answerInput').value = '';
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('submitButton').disabled = false;

    // Update hint
    document.getElementById('problemHint').textContent =
        '리듬의 패턴을 보고 경우의 수를 계산하세요!';
}

/**
 * Draw the rhythm pattern on canvas
 */
function drawRhythmPattern(problem) {
    const canvas = document.getElementById('rhythmCanvas');
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate rhythm parameters
    const n = problem.n;
    const r = problem.r;
    const isPermutation = (problem.type === 'permutation');

    // Draw title
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('리듬 패턴', canvas.width / 2, 20);

    // Draw rhythm visualization
    const centerY = canvas.height / 2;
    const spacing = canvas.width / (r + 1);

    if (isPermutation) {
        // Permutation: Different heights and colors showing order matters
        ctx.fillStyle = CONFIG.PERM_COLOR;

        for (let i = 0; i < r; i++) {
            const x = spacing * (i + 1);
            const height = 30 + (i * 15) % 50; // Varying heights
            const width = 20;

            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x - width/2, centerY - height, x - width/2, centerY);
            gradient.addColorStop(0, CONFIG.PERM_COLOR);
            gradient.addColorStop(1, CONFIG.PERM_COLOR_LIGHT);
            ctx.fillStyle = gradient;

            ctx.fillRect(x - width/2, centerY - height, width, height);

            // Draw number label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`#${i + 1}`, x, centerY + 20);
        }
    } else {
        // Combination: Same heights showing order doesn't matter
        ctx.fillStyle = CONFIG.COMB_COLOR;
        const uniformHeight = 40;

        for (let i = 0; i < r; i++) {
            const x = spacing * (i + 1);
            const width = 20;

            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x - width/2, centerY - uniformHeight, x - width/2, centerY);
            gradient.addColorStop(0, CONFIG.COMB_COLOR);
            gradient.addColorStop(1, CONFIG.COMB_COLOR_LIGHT);
            ctx.fillStyle = gradient;

            ctx.fillRect(x - width/2, centerY - uniformHeight, width, uniformHeight);

            // Draw circle instead of number
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, centerY - uniformHeight / 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw legend
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666';
    ctx.fillText(`총 ${n}개 중 ${r}개 선택`, 10, canvas.height - 10);
}

/**
 * Play rhythm animation and sound
 */
async function playRhythm() {
    if (isPlaying || !currentProblem) return;

    isPlaying = true;
    const button = document.getElementById('playButton');
    button.textContent = '⏸ 재생중...';
    button.classList.add('playing');

    const canvas = document.getElementById('rhythmCanvas');
    const ctx = canvas.getContext('2d');
    const r = currentProblem.r;
    const isPermutation = (currentProblem.type === 'permutation');

    // Play animation
    for (let i = 0; i < r; i++) {
        // Highlight current beat
        await highlightBeat(ctx, i, isPermutation);

        // Play sound
        playBeatSound(i, r, isPermutation);

        // Wait for beat duration
        await sleep(CONFIG.BEAT_DURATION);
    }

    // Reset button
    isPlaying = false;
    button.textContent = '▶ 리듬 재생';
    button.classList.remove('playing');

    // Redraw original pattern
    drawRhythmPattern(currentProblem);
}

/**
 * Highlight a specific beat
 */
function highlightBeat(ctx, index, isPermutation) {
    return new Promise((resolve) => {
        // Redraw pattern
        drawRhythmPattern(currentProblem);

        // Add highlight
        const canvas = document.getElementById('rhythmCanvas');
        const r = currentProblem.r;
        const spacing = canvas.width / (r + 1);
        const x = spacing * (index + 1);
        const centerY = canvas.height / 2;

        // Draw highlight circle
        ctx.strokeStyle = isPermutation ? CONFIG.PERM_COLOR : CONFIG.COMB_COLOR;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, centerY - 20, 25, 0, Math.PI * 2);
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = isPermutation ? CONFIG.PERM_COLOR : CONFIG.COMB_COLOR;
        ctx.stroke();
        ctx.shadowBlur = 0;

        resolve();
    });
}

/**
 * Play beat sound
 */
function playBeatSound(index, total, isPermutation) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for permutation vs combination
    if (isPermutation) {
        // Permutation: ascending scale (order matters)
        oscillator.frequency.value = 440 + (index * 100);
    } else {
        // Combination: same frequency (order doesn't matter)
        oscillator.frequency.value = 523.25; // C5
    }

    oscillator.type = isPermutation ? 'square' : 'sine';

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

/**
 * Submit answer
 */
async function submitAnswer() {
    const answer = parseInt(document.getElementById('answerInput').value);

    if (!answer || answer <= 0) {
        alert('답을 입력해주세요!');
        return;
    }

    if (!currentProblem) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    showLoading(true);

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'submit');
        formData.append('id', activityId);
        formData.append('answer', answer);
        formData.append('problemdata', JSON.stringify(currentProblem));
        formData.append('timespent', timeSpent);

        const response = await fetch('../api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showFeedback(data.correct, data.correctanswer);
            loadStatistics();
        } else {
            showError('제출에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        showError('네트워크 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
}

/**
 * Show feedback
 */
function showFeedback(isCorrect, correctAnswer) {
    const section = document.getElementById('feedbackSection');
    const content = document.getElementById('feedbackContent');

    // Reveal problem type
    const badge = document.getElementById('problemTypeBadge');
    badge.className = 'problem-type-badge ' + currentProblem.type;
    document.getElementById('problemTypeText').textContent =
        currentProblem.type === 'permutation' ? '순열 (Permutation)' : '조합 (Combination)';

    if (isCorrect) {
        content.className = 'feedback-content correct';
        content.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">🎉</div>
            <div><strong>정답입니다!</strong></div>
            <div style="margin-top: 10px;">답: ${correctAnswer}</div>
        `;
    } else {
        content.className = 'feedback-content incorrect';
        content.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">😢</div>
            <div><strong>틀렸습니다.</strong></div>
            <div style="margin-top: 10px;">정답: ${correctAnswer}</div>
            <div style="margin-top: 5px; font-size: 0.9em;">
                ${getExplanation(currentProblem)}
            </div>
        `;
    }

    section.style.display = 'block';
    document.getElementById('submitButton').disabled = true;
}

/**
 * Get explanation for the problem
 */
function getExplanation(problem) {
    const n = problem.n;
    const r = problem.r;

    if (problem.type === 'permutation') {
        return `순열 P(${n},${r}) = ${n}×${n-1}×...×${n-r+1} = ${problem.answer}`;
    } else {
        return `조합 C(${n},${r}) = P(${n},${r}) ÷ ${r}! = ${problem.answer}`;
    }
}

/**
 * Load user statistics
 */
async function loadStatistics() {
    try {
        const response = await fetch(`../api.php?action=getstats&id=${activityId}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('accuracy').textContent = data.stats.accuracy + '%';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
