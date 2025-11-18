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
        document.getElementById('smart-practice-btn')?.addEventListener('click', startSmartPractice);
        document.getElementById('progress-btn')?.addEventListener('click', showProgress);
        document.getElementById('insights-btn')?.addEventListener('click', showInsights);

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
        loadRecommendation();
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
     * Load recommendation for welcome screen
     */
    function loadRecommendation() {
        apiCall('get_next_problem')
            .then(response => {
                if (response.success && response.data && !response.data.error) {
                    displayRecommendation(response.data);
                }
            })
            .catch(error => {
                console.error('Error loading recommendation:', error);
            });
    }

    /**
     * Display recommendation on welcome screen
     */
    function displayRecommendation(problem) {
        const recommendationBox = document.getElementById('recommendation-box');
        const recommendationText = document.getElementById('recommendation-text');
        const smartPracticeBtn = document.getElementById('smart-practice-btn');
        const insightsBtn = document.getElementById('insights-btn');

        if (problem.recommendation) {
            const rec = problem.recommendation;
            recommendationText.innerHTML = `
                <strong>${escapeHtml(rec.rule_name)}</strong><br>
                ${escapeHtml(rec.reason)}<br>
                <small>Current mastery: <span class="mastery-${getMasteryClass(rec.current_mastery)}">${rec.current_mastery}%</span></small>
            `;
            recommendationBox.style.display = 'block';
            smartPracticeBtn.style.display = 'inline-block';
            insightsBtn.style.display = 'inline-block';
        }
    }

    /**
     * Get mastery class for styling
     */
    function getMasteryClass(mastery) {
        if (mastery >= 70) return 'high';
        if (mastery >= 40) return 'medium';
        return 'low';
    }

    /**
     * Start smart practice with recommended problem
     */
    function startSmartPractice() {
        apiCall('get_next_problem')
            .then(response => {
                if (response.success && response.data && !response.data.error) {
                    const problem = response.data;

                    // Get rule information
                    const rule = App.rules.find(r => r.id === problem.rule_id);
                    if (rule) {
                        App.currentRule = rule;
                        document.getElementById('rule-name').textContent = rule.name;
                        document.getElementById('rule-formula').innerHTML = formatLatex(rule.formula);
                    }

                    // Display problem with recommendation info
                    displayProblemWithRecommendation(problem);
                    showScreen('practice-screen');
                }
            })
            .catch(error => {
                console.error('Error starting smart practice:', error);
                alert('Error loading recommended problem. Please try again.');
            });
    }

    /**
     * Display problem with recommendation information
     */
    function displayProblemWithRecommendation(problem) {
        // Display problem normally
        displayProblem(problem);

        // Show recommendation badge if available
        if (problem.recommendation) {
            const badge = document.getElementById('practice-recommendation');
            const badgeText = document.getElementById('practice-recommendation-text');
            badgeText.textContent = `🎯 ${problem.recommendation.reason}`;
            badge.style.display = 'block';
        }
    }

    /**
     * Show learning insights screen
     */
    function showInsights() {
        apiCall('get_learning_insights')
            .then(response => {
                if (response.success && response.data) {
                    displayInsights(response.data);
                    showScreen('insights-screen');
                }
            })
            .catch(error => {
                console.error('Error loading insights:', error);
                alert('Error loading insights. Please try again.');
            });
    }

    /**
     * Display learning insights
     */
    function displayInsights(insights) {
        const overviewContainer = document.getElementById('insights-overview');
        const strengthsContainer = document.getElementById('insights-strengths');
        const weaknessesContainer = document.getElementById('insights-weaknesses');
        const reviewContainer = document.getElementById('insights-review');

        // Overview
        overviewContainer.innerHTML = `
            <h4>📊 Overview</h4>
            <div class="stat-card">
                <span class="label">Rules Started</span>
                <span class="value">${insights.rules_started} / ${insights.total_rules}</span>
            </div>
            <div class="stat-card">
                <span class="label">Rules Mastered</span>
                <span class="value">${insights.rules_mastered}</span>
            </div>
            <div class="stat-card">
                <span class="label">Average Mastery</span>
                <span class="value class="mastery-${getMasteryClass(insights.average_mastery)}">${insights.average_mastery}%</span>
            </div>
        `;

        // Strengths
        if (insights.strongest_areas && insights.strongest_areas.length > 0) {
            strengthsContainer.innerHTML = `
                <h4>💪 Strengths</h4>
                <ul class="insights-list">
                    ${insights.strongest_areas.map(area =>
                        `<li class="strength">${escapeHtml(area)}</li>`
                    ).join('')}
                </ul>
            `;
            strengthsContainer.style.display = 'block';
        }

        // Weaknesses
        if (insights.weakest_areas && insights.weakest_areas.length > 0) {
            weaknessesContainer.innerHTML = `
                <h4>🎯 Focus Areas</h4>
                <p>These areas need more practice:</p>
                <ul class="insights-list">
                    ${insights.weakest_areas.map(area =>
                        `<li class="weakness">${escapeHtml(area)}</li>`
                    ).join('')}
                </ul>
            `;
            weaknessesContainer.style.display = 'block';
        }

        // Review needed (spaced repetition)
        if (insights.needs_review && insights.needs_review.length > 0) {
            reviewContainer.innerHTML = `
                <h4>🔄 Review Recommended</h4>
                <p>Time to review these topics:</p>
                <ul class="insights-list">
                    ${insights.needs_review.map(area =>
                        `<li class="review">${escapeHtml(area)} <span class="spaced-repetition-badge">REVIEW</span></li>`
                    ).join('')}
                </ul>
            `;
            reviewContainer.style.display = 'block';
        }
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
