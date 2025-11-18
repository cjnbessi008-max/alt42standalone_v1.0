/**
 * Rule Patternizer - Main Application Logic
 */

(function() {
    'use strict';

    // Application state
    const App = {
        instanceId: null,
        cmId: null,
        userId: null,
        wwwroot: null,
        currentRule: null,
        currentProblem: null,
        startTime: null,
        rules: []
    };

    /**
     * Initialize the application
     */
    function init() {
        // Get configuration from window object
        if (window.RulePatternizer) {
            App.instanceId = window.RulePatternizer.instanceId;
            App.cmId = window.RulePatternizer.cmId;
            App.userId = window.RulePatternizer.userId;
            App.wwwroot = window.RulePatternizer.wwwroot;
        }

        // Set up event listeners
        setupEventListeners();

        // Load initial data
        loadRules();
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Welcome screen buttons
        document.getElementById('start-btn')?.addEventListener('click', showRuleSelection);
        document.getElementById('progress-btn')?.addEventListener('click', showProgress);

        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', showWelcome);
        });

        // Practice screen buttons
        document.getElementById('submit-answer-btn')?.addEventListener('click', submitAnswer);
        document.getElementById('hint-btn')?.addEventListener('click', showHint);
        document.getElementById('next-problem-btn')?.addEventListener('click', loadNextProblem);

        // Enter key to submit
        document.getElementById('user-answer')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitAnswer();
            }
        });
    }

    /**
     * Show a specific screen
     */
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
    }

    /**
     * Show welcome screen
     */
    function showWelcome() {
        showScreen('welcome-screen');
        updateMasteryDisplay();
    }

    /**
     * Load all rules from API
     */
    function loadRules() {
        apiCall('get_rules')
            .then(response => {
                if (response.success && response.data.rules) {
                    App.rules = response.data.rules;
                }
            })
            .catch(error => {
                console.error('Error loading rules:', error);
            });
    }

    /**
     * Show rule selection screen
     */
    function showRuleSelection() {
        const ruleList = document.getElementById('rule-list');
        ruleList.innerHTML = '';

        if (App.rules.length === 0) {
            ruleList.innerHTML = '<p>No rules available. Please contact your instructor.</p>';
        } else {
            App.rules.forEach(rule => {
                const ruleItem = document.createElement('div');
                ruleItem.className = 'rule-item';
                ruleItem.innerHTML = `
                    <h4>${escapeHtml(rule.name)}</h4>
                    <span class="difficulty difficulty-${rule.difficulty}">Level ${rule.difficulty}</span>
                    <p style="font-size: 14px; color: #666; margin-top: 5px;">${escapeHtml(rule.description || '')}</p>
                `;
                ruleItem.addEventListener('click', () => startPractice(rule));
                ruleList.appendChild(ruleItem);
            });
        }

        showScreen('rule-selection-screen');
    }

    /**
     * Start practice with selected rule
     */
    function startPractice(rule) {
        App.currentRule = rule;

        // Display rule information
        document.getElementById('rule-name').textContent = rule.name;
        document.getElementById('rule-formula').innerHTML = formatLatex(rule.formula);

        // Load first problem
        loadProblem(rule.id);

        // Show practice screen
        showScreen('practice-screen');
    }

    /**
     * Load a problem for the current rule
     */
    function loadProblem(ruleId) {
        apiCall('get_random_problem', { ruleid: ruleId })
            .then(response => {
                if (response.success && response.data) {
                    if (response.data.error) {
                        alert(response.data.error);
                        showRuleSelection();
                    } else {
                        displayProblem(response.data);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading problem:', error);
                alert('Error loading problem. Please try again.');
            });
    }

    /**
     * Display a problem
     */
    function displayProblem(problem) {
        App.currentProblem = problem;
        App.startTime = Date.now();

        // Display problem
        document.getElementById('problem-display').innerHTML = formatLatex(problem.problem_latex);

        // Reset UI
        document.getElementById('user-answer').value = '';
        document.getElementById('user-answer').disabled = false;
        document.getElementById('feedback-area').innerHTML = '';
        document.getElementById('feedback-area').className = '';
        document.getElementById('hint-area').style.display = 'none';
        document.getElementById('submit-answer-btn').style.display = 'inline-block';
        document.getElementById('next-problem-btn').style.display = 'none';

        // Render MathJax if available
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    }

    /**
     * Submit answer
     */
    function submitAnswer() {
        const userAnswer = document.getElementById('user-answer').value.trim();

        if (!userAnswer) {
            alert('Please enter an answer.');
            return;
        }

        if (!App.currentProblem) {
            alert('No problem loaded.');
            return;
        }

        const timeTaken = Math.floor((Date.now() - App.startTime) / 1000);

        apiCall('submit_answer', {
            problemid: App.currentProblem.id,
            answer: userAnswer,
            timetaken: timeTaken
        })
        .then(response => {
            if (response.success && response.data) {
                displayFeedback(response.data);
            }
        })
        .catch(error => {
            console.error('Error submitting answer:', error);
            alert('Error submitting answer. Please try again.');
        });
    }

    /**
     * Display feedback after answer submission
     */
    function displayFeedback(data) {
        const feedbackArea = document.getElementById('feedback-area');

        if (data.correct) {
            feedbackArea.className = 'correct';
            feedbackArea.innerHTML = '✓ Correct! Well done!';
        } else {
            feedbackArea.className = 'incorrect';
            feedbackArea.innerHTML = `✗ Incorrect. The correct answer is: ${formatLatex(data.correct_answer)}`;
        }

        // Update mastery display
        if (data.mastery_level !== undefined) {
            updateMasteryDisplay(data.mastery_level);
        }

        // Show next problem button
        document.getElementById('submit-answer-btn').style.display = 'none';
        document.getElementById('next-problem-btn').style.display = 'inline-block';
        document.getElementById('user-answer').disabled = true;

        // Render MathJax if available
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    }

    /**
     * Show hint
     */
    function showHint() {
        if (!App.currentProblem || !App.currentProblem.hint) {
            alert('No hint available for this problem.');
            return;
        }

        const hintArea = document.getElementById('hint-area');
        hintArea.innerHTML = `<strong>Hint:</strong> ${escapeHtml(App.currentProblem.hint)}`;
        hintArea.style.display = 'block';
    }

    /**
     * Load next problem
     */
    function loadNextProblem() {
        if (App.currentRule) {
            loadProblem(App.currentRule.id);
        }
    }

    /**
     * Show progress screen
     */
    function showProgress() {
        apiCall('get_progress')
            .then(response => {
                if (response.success && response.data) {
                    displayProgress(response.data);
                }
            })
            .catch(error => {
                console.error('Error loading progress:', error);
                alert('Error loading progress. Please try again.');
            });
    }

    /**
     * Display progress data
     */
    function displayProgress(data) {
        // Display overall stats
        const statsContainer = document.getElementById('overall-stats');
        if (data.stats) {
            statsContainer.innerHTML = `
                <h4>Overall Statistics</h4>
                <div class="stat-item">
                    <span class="stat-label">Rules Attempted:</span>
                    <span class="stat-value">${data.stats.rules_attempted}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Attempts:</span>
                    <span class="stat-value">${data.stats.total_attempts}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Correct Answers:</span>
                    <span class="stat-value">${data.stats.total_correct}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average Mastery:</span>
                    <span class="stat-value">${data.stats.avg_mastery}%</span>
                </div>
            `;
        }

        // Display progress by rule
        const progressList = document.getElementById('progress-list');
        progressList.innerHTML = '';

        if (data.progress && data.progress.length > 0) {
            data.progress.forEach(item => {
                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                progressItem.innerHTML = `
                    <h5>${escapeHtml(item.rule_name)} <span class="difficulty difficulty-${item.difficulty}">Level ${item.difficulty}</span></h5>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${item.mastery_level}%"></div>
                    </div>
                    <div class="progress-details">
                        <span>Mastery: ${item.mastery_level}%</span>
                        <span>Attempts: ${item.attempts} | Correct: ${item.correct_count}</span>
                    </div>
                `;
                progressList.appendChild(progressItem);
            });
        } else {
            progressList.innerHTML = '<p>No progress yet. Start practicing to see your progress!</p>';
        }

        showScreen('progress-screen');
    }

    /**
     * Update mastery display in header
     */
    function updateMasteryDisplay(level) {
        if (level !== undefined) {
            document.getElementById('mastery-display').textContent = `Mastery: ${Math.round(level)}%`;
        } else {
            // Load from API
            apiCall('get_progress')
                .then(response => {
                    if (response.success && response.data && response.data.stats) {
                        const avgMastery = response.data.stats.avg_mastery || 0;
                        document.getElementById('mastery-display').textContent = `Mastery: ${Math.round(avgMastery)}%`;
                    }
                })
                .catch(error => {
                    console.error('Error updating mastery:', error);
                });
        }
    }

    /**
     * Make API call
     */
    function apiCall(action, params = {}) {
        const url = `${App.wwwroot}/mod/rulepatternizer/ajax.php`;

        const formData = new FormData();
        formData.append('action', action);
        formData.append('instanceid', App.instanceId);

        for (const key in params) {
            formData.append(key, params[key]);
        }

        return fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json());
    }

    /**
     * Format LaTeX for display
     */
    function formatLatex(latex) {
        if (!latex) return '';

        // Wrap in LaTeX delimiters if not already wrapped
        if (!latex.includes('$$') && !latex.includes('\\(')) {
            return `\\(${latex}\\)`;
        }
        return latex;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
