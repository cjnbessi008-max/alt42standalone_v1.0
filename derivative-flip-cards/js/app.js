// Derivative Flip Cards App
// Moodle LMS Integration

// Global State
let currentCardIndex = 0;
let cards = [];
let studentData = null;
let isFlipped = false;

// API Configuration
const API_BASE_URL = './php/api.php';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Derivative Flip Cards App Initialized');
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        showStatus('앱을 초기화하는 중...', 'info');

        // Load student data from Moodle
        await loadStudentData();

        // Load derivative rules cards
        await loadCards();

        // Display first card
        if (cards.length > 0) {
            displayCard(0);
            updateProgress();
            showStatus('준비 완료!', 'success');
        } else {
            showStatus('카드를 불러올 수 없습니다.', 'error');
        }

    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('초기화 중 오류가 발생했습니다.', 'error');

        // Fallback to default cards if API fails
        loadDefaultCards();
        if (cards.length > 0) {
            displayCard(0);
            updateProgress();
        }
    }
}

/**
 * Load student data from Moodle LMS
 */
async function loadStudentData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('student_id') || null;
        const courseId = urlParams.get('course_id') || null;

        if (studentId && courseId) {
            const response = await fetch(`${API_BASE_URL}?action=getStudent&student_id=${studentId}&course_id=${courseId}`);
            const data = await response.json();

            if (data.success) {
                studentData = data.student;
                displayStudentInfo();
            } else {
                console.warn('Student data not found:', data.message);
            }
        } else {
            console.log('Running in standalone mode (no student_id or course_id)');
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

/**
 * Display student information
 */
function displayStudentInfo() {
    if (studentData) {
        const studentNameEl = document.getElementById('student-name');
        const progressInfoEl = document.getElementById('progress-info');

        if (studentNameEl) {
            studentNameEl.textContent = `학생: ${studentData.name}`;
        }

        if (progressInfoEl && studentData.progress) {
            progressInfoEl.textContent = `진행률: ${studentData.progress}%`;
        }
    }
}

/**
 * Load cards from Moodle database
 */
async function loadCards() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course_id') || null;

        const response = await fetch(`${API_BASE_URL}?action=getCards&course_id=${courseId || ''}`);
        const data = await response.json();

        if (data.success && data.cards && data.cards.length > 0) {
            cards = data.cards;
            updateCardCounter();
        } else {
            console.warn('No cards from API, loading defaults');
            loadDefaultCards();
        }
    } catch (error) {
        console.error('Error loading cards:', error);
        loadDefaultCards();
    }
}

/**
 * Load default derivative rules (fallback)
 */
function loadDefaultCards() {
    cards = [
        {
            id: 1,
            rule_name: '상수 함수의 미분',
            formula: '$$\\frac{d}{dx}(c) = 0$$',
            example: '예: $$\\frac{d}{dx}(5) = 0$$',
            description: '상수의 미분은 항상 0입니다.'
        },
        {
            id: 2,
            rule_name: '거듭제곱 법칙',
            formula: '$$\\frac{d}{dx}(x^n) = nx^{n-1}$$',
            example: '예: $$\\frac{d}{dx}(x^3) = 3x^2$$',
            description: '지수를 앞으로 내리고 지수에서 1을 뺍니다.'
        },
        {
            id: 3,
            rule_name: '상수배 법칙',
            formula: '$$\\frac{d}{dx}[cf(x)] = c\\frac{d}{dx}f(x)$$',
            example: '예: $$\\frac{d}{dx}(5x^2) = 5 \\cdot 2x = 10x$$',
            description: '상수는 미분 기호 밖으로 꺼낼 수 있습니다.'
        },
        {
            id: 4,
            rule_name: '합의 법칙',
            formula: '$$\\frac{d}{dx}[f(x) + g(x)] = f\'(x) + g\'(x)$$',
            example: '예: $$\\frac{d}{dx}(x^2 + x^3) = 2x + 3x^2$$',
            description: '함수의 합의 미분은 각 함수를 따로 미분한 것의 합입니다.'
        },
        {
            id: 5,
            rule_name: '차의 법칙',
            formula: '$$\\frac{d}{dx}[f(x) - g(x)] = f\'(x) - g\'(x)$$',
            example: '예: $$\\frac{d}{dx}(x^3 - x^2) = 3x^2 - 2x$$',
            description: '함수의 차의 미분은 각 함수를 따로 미분한 것의 차입니다.'
        },
        {
            id: 6,
            rule_name: '곱의 법칙 (Product Rule)',
            formula: '$$\\frac{d}{dx}[f(x)g(x)] = f\'(x)g(x) + f(x)g\'(x)$$',
            example: '예: $$\\frac{d}{dx}(x^2 \\cdot x^3) = 2x \\cdot x^3 + x^2 \\cdot 3x^2$$',
            description: '첫 번째 함수의 미분 × 두 번째 + 첫 번째 × 두 번째의 미분'
        },
        {
            id: 7,
            rule_name: '몫의 법칙 (Quotient Rule)',
            formula: '$$\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f\'(x)g(x) - f(x)g\'(x)}{[g(x)]^2}$$',
            example: '예: $$\\frac{d}{dx}\\left(\\frac{x^2}{x}\\right) = \\frac{2x \\cdot x - x^2 \\cdot 1}{x^2}$$',
            description: '(분자의 미분 × 분모 - 분자 × 분모의 미분) / 분모²'
        },
        {
            id: 8,
            rule_name: '연쇄 법칙 (Chain Rule)',
            formula: '$$\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$$',
            example: '예: $$\\frac{d}{dx}[(x^2 + 1)^3] = 3(x^2 + 1)^2 \\cdot 2x$$',
            description: '합성함수의 미분: 바깥 함수의 미분 × 안쪽 함수의 미분'
        },
        {
            id: 9,
            rule_name: '지수함수의 미분',
            formula: '$$\\frac{d}{dx}(e^x) = e^x$$',
            example: '예: $$\\frac{d}{dx}(e^{2x}) = 2e^{2x}$$',
            description: 'e^x의 미분은 자기 자신입니다.'
        },
        {
            id: 10,
            rule_name: '자연로그의 미분',
            formula: '$$\\frac{d}{dx}(\\ln x) = \\frac{1}{x}$$',
            example: '예: $$\\frac{d}{dx}(\\ln(x^2)) = \\frac{2x}{x^2} = \\frac{2}{x}$$',
            description: '자연로그 ln(x)의 미분은 1/x입니다.'
        },
        {
            id: 11,
            rule_name: 'sin 함수의 미분',
            formula: '$$\\frac{d}{dx}(\\sin x) = \\cos x$$',
            example: '예: $$\\frac{d}{dx}(\\sin 2x) = 2\\cos 2x$$',
            description: 'sin(x)를 미분하면 cos(x)입니다.'
        },
        {
            id: 12,
            rule_name: 'cos 함수의 미분',
            formula: '$$\\frac{d}{dx}(\\cos x) = -\\sin x$$',
            example: '예: $$\\frac{d}{dx}(\\cos 3x) = -3\\sin 3x$$',
            description: 'cos(x)를 미분하면 -sin(x)입니다.'
        }
    ];

    updateCardCounter();
}

/**
 * Display a specific card
 */
function displayCard(index) {
    if (index < 0 || index >= cards.length) return;

    currentCardIndex = index;
    const card = cards[index];

    // Reset flip state
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.remove('flipped');
    isFlipped = false;

    // Update card content
    document.getElementById('rule-name').textContent = card.rule_name;
    document.getElementById('formula').innerHTML = card.formula;
    document.getElementById('example').innerHTML = card.example || '';

    // Update counter
    document.getElementById('current-card').textContent = index + 1;

    // Update navigation buttons
    updateNavigationButtons();

    // Update progress bar
    updateProgress();

    // Animate card entrance
    flipCard.classList.add('animate');
    setTimeout(() => flipCard.classList.remove('animate'), 300);

    // Render MathJax
    if (window.MathJax) {
        MathJax.typesetPromise([
            document.getElementById('formula'),
            document.getElementById('example')
        ]).catch((err) => console.log('MathJax error:', err));
    }

    // Track view (send to Moodle)
    trackCardView(card.id);
}

/**
 * Flip the current card
 */
function flipCard() {
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.toggle('flipped');
    isFlipped = !isFlipped;

    // Track flip event
    if (isFlipped) {
        trackCardFlip(cards[currentCardIndex].id);
    }
}

/**
 * Go to next card
 */
function nextCard() {
    if (currentCardIndex < cards.length - 1) {
        displayCard(currentCardIndex + 1);
    }
}

/**
 * Go to previous card
 */
function previousCard() {
    if (currentCardIndex > 0) {
        displayCard(currentCardIndex - 1);
    }
}

/**
 * Update navigation buttons state
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === cards.length - 1;
}

/**
 * Update card counter display
 */
function updateCardCounter() {
    document.getElementById('total-cards').textContent = cards.length;
}

/**
 * Update progress bar
 */
function updateProgress() {
    const progressBar = document.getElementById('progress-bar');
    const progress = ((currentCardIndex + 1) / cards.length) * 100;
    progressBar.style.width = `${progress}%`;
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'status-message';
    }, 3000);
}

/**
 * Track card view event (send to Moodle)
 */
async function trackCardView(cardId) {
    if (!studentData) return;

    try {
        await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'trackEvent',
                student_id: studentData.id,
                card_id: cardId,
                event_type: 'view',
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

/**
 * Track card flip event (send to Moodle)
 */
async function trackCardFlip(cardId) {
    if (!studentData) return;

    try {
        await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'trackEvent',
                student_id: studentData.id,
                card_id: cardId,
                event_type: 'flip',
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error tracking flip:', error);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowLeft':
            previousCard();
            break;
        case 'ArrowRight':
            nextCard();
            break;
        case ' ':
        case 'Enter':
            event.preventDefault();
            flipCard();
            break;
    }
});

// Touch events for mobile
let touchStartX = 0;
let touchEndX = 0;

document.getElementById('flip-card').addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
});

document.getElementById('flip-card').addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next card
            nextCard();
        } else {
            // Swipe right - previous card
            previousCard();
        }
    }
}

// Click to flip
document.getElementById('flip-card').addEventListener('click', function(event) {
    // Don't flip if clicking on a button
    if (!event.target.closest('button')) {
        flipCard();
    }
});
