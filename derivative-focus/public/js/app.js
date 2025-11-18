/**
 * Derivative Focus - Frontend Application
 * Handles UI interactions and API communication
 */

const API_BASE_URL = '../api';

/**
 * Load problem from Moodle by question ID
 */
async function loadProblemFromMoodle() {
    const questionId = document.getElementById('questionId').value;

    if (!questionId) {
        showError('문제 ID를 입력해주세요');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/problem_handler.php/fetch-from-moodle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question_id: questionId
            })
        });

        const data = await response.json();

        if (data.success) {
            displayProblem(data);
        } else {
            showError(data.error || '문제를 불러오는데 실패했습니다');
        }

    } catch (error) {
        console.error('Error:', error);
        showError('서버 연결에 실패했습니다');
    }
}

/**
 * Analyze directly entered problem
 */
async function analyzeDirect() {
    const problemText = document.getElementById('directInput').value;

    if (!problemText.trim()) {
        showError('문제를 입력해주세요');
        return;
    }

    showLoading();

    // For demo purposes, simulate analysis
    // In production, this would call a backend endpoint
    const simulatedData = {
        success: true,
        problem_text: problemText,
        problem_latex: problemText,
        detected_rules: analyzeRulesLocally(problemText)
    };

    displayProblem(simulatedData);
}

/**
 * Local rule detection (frontend fallback)
 */
function analyzeRulesLocally(text) {
    const rules = [];

    // Power Rule detection
    if (/x\s*\^|x\^{|\^[\d\-]/.test(text)) {
        rules.push({
            rule_name: 'Power Rule',
            rule_type: 'power_rule',
            rule_formula: 'd/dx[x^n] = n·x^(n-1)',
            description: 'The power rule: derivative of x to the power n is n times x to the power (n-1)',
            matched_expression: text.match(/x\s*\^[\d\-]+/)?.[0] || 'x^n'
        });
    }

    // Chain Rule detection
    if (/\([^\)]+\)\s*\^|sin\(|cos\(|tan\(|ln\(|log\(|e\^|sqrt\(/.test(text)) {
        rules.push({
            rule_name: 'Chain Rule',
            rule_type: 'chain_rule',
            rule_formula: 'd/dx[f(g(x))] = f\'(g(x))·g\'(x)',
            description: 'The chain rule: derivative of composite function f(g(x)) is f\'(g(x)) times g\'(x)',
            matched_expression: text.match(/\([^\)]+\)\s*\^[\d\-]+|sin\([^\)]+\)|cos\([^\)]+\)/)?.[0] || 'f(g(x))'
        });
    }

    // Product Rule detection
    if (/\([^\)]+\)\s*\*\s*\([^\)]+\)|[a-z]\s*\*\s*[a-z]/.test(text)) {
        rules.push({
            rule_name: 'Product Rule',
            rule_type: 'product_rule',
            rule_formula: 'd/dx[f·g] = f\'·g + f·g\'',
            description: 'The product rule: derivative of f times g is f\' times g plus f times g\'',
            matched_expression: text.match(/\([^\)]+\)\s*\*\s*\([^\)]+\)/)?.[0] || 'f(x)·g(x)'
        });
    }

    // Return only the first 3 rules
    return rules.slice(0, 3);
}

/**
 * Display problem and detected rules
 */
function displayProblem(data) {
    const problemDisplay = document.getElementById('problemDisplay');
    const rulesPanel = document.getElementById('rulesList');

    // Display problem
    let problemHTML = `
        <div class="problem-content">
            <div class="problem-title">미분 문제</div>
            <div class="problem-text">
                ${highlightExpression(data.problem_latex || data.problem_text, data.detected_rules)}
            </div>
        </div>
    `;

    problemDisplay.innerHTML = problemHTML;

    // Display detected rules
    if (data.detected_rules && data.detected_rules.length > 0) {
        let rulesHTML = '';
        data.detected_rules.forEach(rule => {
            const ruleClass = rule.rule_type.replace('_', '-');
            rulesHTML += `
                <div class="rule-card ${ruleClass}">
                    <div class="rule-name">${rule.rule_name}</div>
                    <div class="rule-formula">${escapeHtml(rule.rule_formula)}</div>
                    <div class="rule-description">${rule.description}</div>
                </div>
            `;
        });
        rulesPanel.innerHTML = rulesHTML;
    } else {
        rulesPanel.innerHTML = '<p class="no-rules">규칙이 검출되지 않았습니다</p>';
    }

    // Render MathJax if available
    if (window.MathJax) {
        MathJax.typesetPromise([problemDisplay]);
    }
}

/**
 * Highlight expressions based on detected rules
 */
function highlightExpression(text, rules) {
    if (!rules || rules.length === 0) {
        return escapeHtml(text);
    }

    let highlightedText = escapeHtml(text);

    rules.forEach(rule => {
        if (rule.matched_expression) {
            const escapedMatch = escapeHtml(rule.matched_expression);
            const highlightClass = rule.rule_type.replace('_', '-');
            const regex = new RegExp(escapedMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            highlightedText = highlightedText.replace(
                regex,
                `<span class="highlight-${highlightClass.split('-')[0]}">${escapedMatch}</span>`
            );
        }
    });

    return highlightedText;
}

/**
 * Show loading state
 */
function showLoading() {
    const problemDisplay = document.getElementById('problemDisplay');
    problemDisplay.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>분석 중...</p>
        </div>
    `;
}

/**
 * Show error message
 */
function showError(message) {
    const problemDisplay = document.getElementById('problemDisplay');
    problemDisplay.innerHTML = `
        <div class="error-message">
            <strong>오류:</strong> ${escapeHtml(message)}
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Demo mode - load sample problem
 */
function loadDemoProblem() {
    const demoData = {
        success: true,
        problem_text: 'Find the derivative of f(x) = x^3 + sin(2x) + x*ln(x)',
        problem_latex: '$$f(x) = x^3 + \\sin(2x) + x\\ln(x)$$',
        detected_rules: [
            {
                rule_name: 'Power Rule',
                rule_type: 'power_rule',
                rule_formula: 'd/dx[x^n] = n·x^(n-1)',
                description: 'x^3에 적용되는 거듭제곱 법칙',
                matched_expression: 'x^3'
            },
            {
                rule_name: 'Chain Rule',
                rule_type: 'chain_rule',
                rule_formula: 'd/dx[f(g(x))] = f\'(g(x))·g\'(x)',
                description: 'sin(2x)에 적용되는 연쇄 법칙',
                matched_expression: 'sin(2x)'
            },
            {
                rule_name: 'Product Rule',
                rule_type: 'product_rule',
                rule_formula: 'd/dx[f·g] = f\'·g + f·g\'',
                description: 'x·ln(x)에 적용되는 곱셈 법칙',
                matched_expression: 'x*ln(x)'
            }
        ]
    };

    displayProblem(demoData);
}

// Load demo on page load
window.addEventListener('DOMContentLoaded', () => {
    // Optionally load demo problem
    // loadDemoProblem();
});
