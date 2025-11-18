/**
 * Contrapositive Flip App - Main JavaScript
 * @copyright 2025 KAIST Touch Math Academy
 */

// Configuration
const CONFIG = {
    apiBaseUrl: '../api/contrapositive_api.php',
    language: 'ko',
    currentQuestionIndex: 0,
    questions: [],
    currentAttemptId: null,
    startTime: null,
    flipCount: 0,
    timeInterval: null,
};

// DOM Elements
const DOM = {
    instruction: null,
    cardContainer: null,
    loading: null,
    error: null,
    flipCard: null,
    // Elements initialized in init()
};

/**
 * Initialize the app
 */
function init() {
    console.log('Initializing Contrapositive Flip App...');

    // Cache DOM elements
    cacheDOMElements();

    // Attach event listeners
    attachEventListeners();

    // Load initial data (examples)
    loadExamples();
}

/**
 * Cache all DOM elements
 */
function cacheDOMElements() {
    DOM.instruction = document.getElementById('instruction');
    DOM.cardContainer = document.getElementById('card-container');
    DOM.loading = document.getElementById('loading');
    DOM.error = document.getElementById('error');
    DOM.flipCard = document.getElementById('flip-card');
    DOM.startBtn = document.getElementById('start-btn');
    DOM.langKo = document.getElementById('lang-ko');
    DOM.langEn = document.getElementById('lang-en');
    DOM.understandYes = document.getElementById('understand-yes');
    DOM.understandNo = document.getElementById('understand-no');
    DOM.explanationBox = document.getElementById('explanation-box');
    DOM.submitExplanation = document.getElementById('submit-explanation');
    DOM.prevBtn = document.getElementById('prev-btn');
    DOM.nextBtn = document.getElementById('next-btn');
    DOM.retryBtn = document.getElementById('retry-btn');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Start button
    DOM.startBtn.addEventListener('click', startLearning);

    // Language toggle
    DOM.langKo.addEventListener('click', () => switchLanguage('ko'));
    DOM.langEn.addEventListener('click', () => switchLanguage('en'));

    // Flip card
    DOM.flipCard.addEventListener('click', flipCard);

    // Understanding buttons
    DOM.understandYes.addEventListener('click', () => handleUnderstanding(true));
    DOM.understandNo.addEventListener('click', () => handleUnderstanding(false));

    // Submit explanation
    DOM.submitExplanation.addEventListener('click', submitExplanation);

    // Navigation
    DOM.prevBtn.addEventListener('click', previousQuestion);
    DOM.nextBtn.addEventListener('click', nextQuestion);

    // Retry
    DOM.retryBtn.addEventListener('click', () => {
        hideError();
        loadExamples();
    });
}

/**
 * Switch language
 */
function switchLanguage(lang) {
    CONFIG.language = lang;

    // Update active button
    DOM.langKo.classList.toggle('active', lang === 'ko');
    DOM.langEn.classList.toggle('active', lang === 'en');

    // Update UI text
    updateUILanguage(lang);

    // Reload examples
    loadExamples();
}

/**
 * Update UI text based on language
 */
function updateUILanguage(lang) {
    const translations = {
        ko: {
            title: '대우 학습 (Contrapositive)',
            instructionTitle: '💡 대우란?',
            instructionText: '논리학에서 대우(contrapositive)는 명제를 논리적으로 동치인 형태로 변환한 것입니다.',
            startBtn: '학습 시작하기',
            understandQuestion: '이해했나요?',
            understandYes: '✅ 네, 이해했어요',
            understandNo: '❌ 아니요, 더 공부할게요',
            prevBtn: '← 이전 문제',
            nextBtn: '다음 문제 →',
        },
        en: {
            title: 'Contrapositive Learning',
            instructionTitle: '💡 What is a Contrapositive?',
            instructionText: 'In logic, a contrapositive is a logically equivalent transformation of a proposition.',
            startBtn: 'Start Learning',
            understandQuestion: 'Do you understand?',
            understandYes: '✅ Yes, I understand',
            understandNo: '❌ No, I need more practice',
            prevBtn: '← Previous',
            nextBtn: 'Next →',
        },
    };

    const t = translations[lang];

    // Update header
    document.querySelector('.app-header h1').textContent = t.title;

    // Update instruction
    document.querySelector('.instruction-panel h2').textContent = t.instructionTitle;
    document.querySelector('.instruction-panel > p').textContent = t.instructionText;
    DOM.startBtn.textContent = t.startBtn;

    // Update buttons
    if (DOM.cardContainer.style.display !== 'none') {
        document.querySelector('.understanding-panel h3').textContent = t.understandQuestion;
        DOM.understandYes.textContent = t.understandYes;
        DOM.understandNo.textContent = t.understandNo;
        DOM.prevBtn.textContent = t.prevBtn;
        DOM.nextBtn.textContent = t.nextBtn;
    }
}

/**
 * Load example questions
 */
async function loadExamples() {
    showLoading();

    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}?action=get_examples&language=${CONFIG.language}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load examples');
        }

        // Generate questions from examples
        CONFIG.questions = [];
        for (const example of data.data) {
            const question = await generateQuestion(example);
            if (question) {
                CONFIG.questions.push(question);
            }
        }

        if (CONFIG.questions.length === 0) {
            throw new Error('No questions available');
        }

        console.log(`Loaded ${CONFIG.questions.length} questions`);
        hideLoading();

    } catch (error) {
        console.error('Error loading examples:', error);
        showError(error.message);
    }
}

/**
 * Generate a question from example data
 */
async function generateQuestion(example) {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}?action=generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_antecedent: example.original_antecedent,
                original_consequent: example.original_consequent,
                language: CONFIG.language,
                difficulty_level: example.difficulty || 1,
                course_id: 1,
                moodle_question_id: 0,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to generate question');
        }

        return data.data;

    } catch (error) {
        console.error('Error generating question:', error);
        return null;
    }
}

/**
 * Start learning
 */
function startLearning() {
    if (CONFIG.questions.length === 0) {
        alert('문제를 먼저 불러와주세요.');
        return;
    }

    CONFIG.currentQuestionIndex = 0;
    hideInstruction();
    showQuestion();
}

/**
 * Show a question
 */
function showQuestion() {
    const question = CONFIG.questions[CONFIG.currentQuestionIndex];

    if (!question) {
        console.error('No question at index:', CONFIG.currentQuestionIndex);
        return;
    }

    // Reset state
    CONFIG.flipCount = 0;
    CONFIG.startTime = Date.now();
    DOM.flipCard.classList.remove('flipped');
    DOM.explanationBox.style.display = 'none';

    // Start timer
    if (CONFIG.timeInterval) {
        clearInterval(CONFIG.timeInterval);
    }
    CONFIG.timeInterval = setInterval(updateTimer, 1000);

    // Populate question data
    document.getElementById('difficulty').textContent =
        `${CONFIG.language === 'ko' ? '난이도' : 'Difficulty'}: ${question.difficulty_level || 1}`;

    // Original (Front)
    document.getElementById('original-antecedent').textContent = question.original_antecedent;
    document.getElementById('original-consequent').textContent = question.original_consequent;
    document.getElementById('original-statement').textContent = question.original_statement;

    // Contrapositive (Back)
    document.getElementById('contra-antecedent').textContent = question.contrapositive_antecedent;
    document.getElementById('contra-consequent').textContent = question.contrapositive_consequent;
    document.getElementById('contra-statement').textContent = question.contrapositive_statement;

    // Update stats
    updateStats();

    // Show card container
    DOM.cardContainer.style.display = 'block';

    // Record attempt start
    recordAttemptStart(question.id);
}

/**
 * Flip the card
 */
function flipCard() {
    DOM.flipCard.classList.toggle('flipped');
    CONFIG.flipCount++;
    updateStats();

    // Update attempt
    if (CONFIG.currentAttemptId) {
        updateAttempt({
            flip_count: CONFIG.flipCount,
            time_spent: getTimeSpent(),
        });
    }
}

/**
 * Update stats display
 */
function updateStats() {
    document.getElementById('flip-count').textContent = CONFIG.flipCount;
}

/**
 * Update timer display
 */
function updateTimer() {
    const timeSpent = getTimeSpent();
    document.getElementById('time-spent').textContent = `${timeSpent}s`;
}

/**
 * Get time spent in seconds
 */
function getTimeSpent() {
    if (!CONFIG.startTime) return 0;
    return Math.floor((Date.now() - CONFIG.startTime) / 1000);
}

/**
 * Handle understanding response
 */
function handleUnderstanding(understood) {
    if (understood) {
        // Show explanation box
        DOM.explanationBox.style.display = 'block';
    } else {
        // Mark as not understood and move to next
        updateAttempt({
            understood: 0,
            flip_count: CONFIG.flipCount,
            time_spent: getTimeSpent(),
        });

        // Suggest reviewing again
        alert(CONFIG.language === 'ko'
            ? '괜찮습니다! 카드를 여러 번 뒤집어보며 다시 학습해보세요.'
            : 'That\'s okay! Flip the card several times to review again.');
    }
}

/**
 * Submit explanation
 */
function submitExplanation() {
    const explanation = document.getElementById('user-explanation').value.trim();

    if (!explanation) {
        alert(CONFIG.language === 'ko'
            ? '설명을 입력해주세요.'
            : 'Please enter your explanation.');
        return;
    }

    // Update attempt with understanding
    updateAttempt({
        understood: 1,
        user_answer: explanation,
        flip_count: CONFIG.flipCount,
        time_spent: getTimeSpent(),
    });

    // Show success message
    alert(CONFIG.language === 'ko'
        ? '훌륭합니다! 다음 문제로 이동합니다.'
        : 'Great! Moving to the next question.');

    // Clear explanation
    document.getElementById('user-explanation').value = '';
    DOM.explanationBox.style.display = 'none';

    // Move to next question
    setTimeout(nextQuestion, 500);
}

/**
 * Previous question
 */
function previousQuestion() {
    if (CONFIG.currentQuestionIndex > 0) {
        CONFIG.currentQuestionIndex--;
        showQuestion();
    } else {
        alert(CONFIG.language === 'ko'
            ? '첫 번째 문제입니다.'
            : 'This is the first question.');
    }
}

/**
 * Next question
 */
function nextQuestion() {
    if (CONFIG.currentQuestionIndex < CONFIG.questions.length - 1) {
        CONFIG.currentQuestionIndex++;
        showQuestion();
    } else {
        alert(CONFIG.language === 'ko'
            ? '모든 문제를 완료했습니다! 🎉'
            : 'You\'ve completed all questions! 🎉');

        // Reset to first question
        CONFIG.currentQuestionIndex = 0;
        showQuestion();
    }
}

/**
 * Record attempt start
 */
async function recordAttemptStart(questionId) {
    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}?action=record_attempt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question_id: questionId,
                flip_count: 0,
                time_spent: 0,
            }),
        });

        const data = await response.json();

        if (data.success) {
            CONFIG.currentAttemptId = data.data.attempt_id;
            console.log('Attempt recorded:', CONFIG.currentAttemptId);
        }

    } catch (error) {
        console.error('Error recording attempt:', error);
    }
}

/**
 * Update attempt
 */
async function updateAttempt(updates) {
    if (!CONFIG.currentAttemptId) return;

    try {
        await fetch(`${CONFIG.apiBaseUrl}?action=update_attempt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                attempt_id: CONFIG.currentAttemptId,
                ...updates,
            }),
        });

    } catch (error) {
        console.error('Error updating attempt:', error);
    }
}

/**
 * UI State Management
 */
function showLoading() {
    DOM.instruction.style.display = 'none';
    DOM.cardContainer.style.display = 'none';
    DOM.error.style.display = 'none';
    DOM.loading.style.display = 'block';
}

function hideLoading() {
    DOM.loading.style.display = 'none';
    DOM.instruction.style.display = 'block';
}

function hideInstruction() {
    DOM.instruction.style.display = 'none';
}

function showError(message) {
    DOM.loading.style.display = 'none';
    DOM.instruction.style.display = 'none';
    DOM.cardContainer.style.display = 'none';
    DOM.error.style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

function hideError() {
    DOM.error.style.display = 'none';
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
