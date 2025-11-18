/**
 * Sampling Game JavaScript
 * Interactive game for learning statistical sampling methods
 */

var SamplingGame = (function() {
    'use strict';

    var config = {};
    var gameState = {
        population: [],
        selectedSamples: [],
        startTime: null,
        timerInterval: null,
        timeRemaining: null,
        isGameActive: false
    };

    /**
     * Initialize the game
     */
    function init(gameConfig) {
        config = gameConfig;
        setupEventListeners();
        updateInstructions();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        document.getElementById('start-game-btn').addEventListener('click', startGame);
        document.getElementById('reset-game-btn').addEventListener('click', resetGame);
        document.getElementById('submit-game-btn').addEventListener('click', submitGame);
    }

    /**
     * Update game instructions based on sampling method
     */
    function updateInstructions() {
        var instructionsEl = document.getElementById('game-instructions');
        var methodText = '';

        switch (config.samplingmethod) {
            case 'simple_random':
                methodText = '<h3>단순무작위추출 (Simple Random Sampling)</h3>' +
                           '<p>' + config.samplesize + '개의 항목을 무작위로 선택하세요. ' +
                           '각 항목은 동일한 확률로 선택되어야 합니다.</p>';
                break;
            case 'systematic':
                var interval = Math.floor(config.populationsize / config.samplesize);
                methodText = '<h3>계통추출 (Systematic Sampling)</h3>' +
                           '<p>첫 항목을 무작위로 선택한 후, 매 ' + interval + '번째 항목을 선택하세요.</p>';
                break;
            case 'stratified':
                methodText = '<h3>층화추출 (Stratified Sampling)</h3>' +
                           '<p>모집단을 그룹으로 나누고 각 그룹에서 비례적으로 표본을 선택하세요.</p>';
                break;
            case 'cluster':
                methodText = '<h3>집락추출 (Cluster Sampling)</h3>' +
                           '<p>모집단을 집락으로 나누고 전체 집락을 무작위로 선택하세요.</p>';
                break;
        }

        instructionsEl.innerHTML = methodText;
    }

    /**
     * Start the game
     */
    function startGame() {
        gameState.isGameActive = true;
        gameState.selectedSamples = [];
        gameState.startTime = Date.now();

        // Setup timer if time limit is set
        if (config.timelimit) {
            gameState.timeRemaining = config.timelimit;
            startTimer();
        }

        // Generate population
        generatePopulation();

        // Update UI
        document.getElementById('start-game-btn').style.display = 'none';
        document.getElementById('reset-game-btn').style.display = 'inline-block';
        document.getElementById('submit-game-btn').style.display = 'inline-block';

        hideFeedback();
    }

    /**
     * Generate population items
     */
    function generatePopulation() {
        var canvas = document.getElementById('game-canvas');
        canvas.innerHTML = '';

        // Add sample counter
        var counterDiv = document.createElement('div');
        counterDiv.className = 'sample-counter';
        counterDiv.innerHTML = '<div class="count" id="sample-count">0 / ' + config.samplesize + '</div>' +
                              '<div class="label">선택한 표본 수</div>';
        canvas.appendChild(counterDiv);

        // Create population grid
        var gridDiv = document.createElement('div');
        gridDiv.className = 'population-grid';

        gameState.population = [];

        for (var i = 0; i < config.populationsize; i++) {
            var item = {
                id: i + 1,
                element: null
            };

            var itemEl = document.createElement('div');
            itemEl.className = 'population-item ' + config.gamescenario;
            itemEl.dataset.id = item.id;

            // Add number or icon based on scenario
            if (config.gamescenario === 'students' || config.gamescenario === 'balls') {
                itemEl.textContent = item.id;
            }

            itemEl.addEventListener('click', function(e) {
                toggleSelection(parseInt(e.currentTarget.dataset.id));
            });

            item.element = itemEl;
            gameState.population.push(item);
            gridDiv.appendChild(itemEl);
        }

        canvas.appendChild(gridDiv);
        updateSampleCounter();
    }

    /**
     * Toggle item selection
     */
    function toggleSelection(itemId) {
        if (!gameState.isGameActive) return;

        var index = gameState.selectedSamples.indexOf(itemId);

        if (index > -1) {
            // Deselect
            gameState.selectedSamples.splice(index, 1);
            var item = gameState.population.find(function(p) { return p.id === itemId; });
            if (item) {
                item.element.classList.remove('selected');
            }
        } else {
            // Check if we can select more
            if (gameState.selectedSamples.length >= config.samplesize) {
                showFeedback('error_toomanysamples', 'error');
                return;
            }

            // Select
            gameState.selectedSamples.push(itemId);
            var item = gameState.population.find(function(p) { return p.id === itemId; });
            if (item) {
                item.element.classList.add('selected');
            }
        }

        updateSampleCounter();
    }

    /**
     * Update sample counter
     */
    function updateSampleCounter() {
        var countEl = document.getElementById('sample-count');
        if (countEl) {
            countEl.textContent = gameState.selectedSamples.length + ' / ' + config.samplesize;

            // Update color based on progress
            if (gameState.selectedSamples.length === config.samplesize) {
                countEl.style.color = '#4CAF50';
            } else {
                countEl.style.color = '#ffffff';
            }
        }
    }

    /**
     * Start timer
     */
    function startTimer() {
        var timerEl = document.getElementById('timer-display');
        timerEl.style.display = 'block';

        gameState.timerInterval = setInterval(function() {
            gameState.timeRemaining--;

            var minutes = Math.floor(gameState.timeRemaining / 60);
            var seconds = gameState.timeRemaining % 60;
            timerEl.textContent = '남은 시간: ' +
                                 (minutes < 10 ? '0' : '') + minutes + ':' +
                                 (seconds < 10 ? '0' : '') + seconds;

            // Warning when less than 30 seconds
            if (gameState.timeRemaining <= 30) {
                timerEl.classList.add('warning');
            }

            // Time up
            if (gameState.timeRemaining <= 0) {
                clearInterval(gameState.timerInterval);
                timerEl.textContent = '시간 종료!';
                endGame();
            }
        }, 1000);
    }

    /**
     * Reset game
     */
    function resetGame() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }

        gameState.isGameActive = false;
        gameState.selectedSamples = [];
        gameState.startTime = null;
        gameState.timeRemaining = null;

        document.getElementById('game-canvas').innerHTML = '';
        document.getElementById('timer-display').style.display = 'none';
        document.getElementById('timer-display').classList.remove('warning');
        document.getElementById('start-game-btn').style.display = 'inline-block';
        document.getElementById('reset-game-btn').style.display = 'none';
        document.getElementById('submit-game-btn').style.display = 'none';

        hideFeedback();
    }

    /**
     * Submit game
     */
    function submitGame() {
        if (!gameState.isGameActive) return;

        // Validate selection
        if (gameState.selectedSamples.length < config.samplesize) {
            showFeedback('표본을 ' + config.samplesize + '개 선택해야 합니다.', 'error');
            return;
        }

        // Calculate score
        var score = calculateScore();
        var timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);

        // Stop timer
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }

        // Submit to server
        submitToServer(score, timeSpent);
    }

    /**
     * Calculate score based on sampling method
     */
    function calculateScore() {
        var score = 0;
        var maxScore = 100;

        switch (config.samplingmethod) {
            case 'simple_random':
                // Check randomness distribution
                score = evaluateRandomness(gameState.selectedSamples, config.populationsize);
                break;

            case 'systematic':
                // Check if samples are evenly spaced
                score = evaluateSystematic(gameState.selectedSamples, config.populationsize, config.samplesize);
                break;

            case 'stratified':
                // Check if samples are distributed across strata
                score = evaluateStratified(gameState.selectedSamples, config.populationsize, config.samplesize);
                break;

            case 'cluster':
                // Check if entire clusters are selected
                score = evaluateCluster(gameState.selectedSamples, config.populationsize, config.samplesize);
                break;
        }

        return Math.min(Math.max(score, 0), maxScore);
    }

    /**
     * Evaluate randomness for simple random sampling
     */
    function evaluateRandomness(samples, populationSize) {
        // Check if samples are distributed across the range
        var sorted = samples.slice().sort(function(a, b) { return a - b; });
        var gaps = [];

        for (var i = 0; i < sorted.length - 1; i++) {
            gaps.push(sorted[i + 1] - sorted[i]);
        }

        // Calculate variance of gaps
        var meanGap = populationSize / samples.length;
        var variance = 0;

        for (var i = 0; i < gaps.length; i++) {
            variance += Math.pow(gaps[i] - meanGap, 2);
        }
        variance /= gaps.length;

        // Lower variance means more even distribution (which is good for random sampling)
        // But too perfect distribution might indicate systematic sampling
        var idealVariance = meanGap * meanGap * 0.5;
        var score = 100 - Math.abs(variance - idealVariance) / idealVariance * 100;

        return Math.max(score, 50); // Minimum 50 points for valid selection
    }

    /**
     * Evaluate systematic sampling
     */
    function evaluateSystematic(samples, populationSize, sampleSize) {
        var interval = Math.floor(populationSize / sampleSize);
        var sorted = samples.slice().sort(function(a, b) { return a - b; });

        var score = 100;

        // Check if gaps between samples are close to the interval
        for (var i = 0; i < sorted.length - 1; i++) {
            var gap = sorted[i + 1] - sorted[i];
            var deviation = Math.abs(gap - interval);
            score -= deviation * 2; // Penalize deviation
        }

        return Math.max(score, 0);
    }

    /**
     * Evaluate stratified sampling
     */
    function evaluateStratified(samples, populationSize, sampleSize) {
        var strataSize = Math.floor(populationSize / 4); // Divide into 4 strata
        var strataCounts = [0, 0, 0, 0];

        // Count samples in each stratum
        for (var i = 0; i < samples.length; i++) {
            var stratum = Math.min(Math.floor((samples[i] - 1) / strataSize), 3);
            strataCounts[stratum]++;
        }

        // Expected samples per stratum
        var expectedPerStratum = sampleSize / 4;

        var score = 100;

        // Penalize deviation from expected distribution
        for (var i = 0; i < strataCounts.length; i++) {
            var deviation = Math.abs(strataCounts[i] - expectedPerStratum);
            score -= deviation * 10;
        }

        return Math.max(score, 0);
    }

    /**
     * Evaluate cluster sampling
     */
    function evaluateCluster(samples, populationSize, sampleSize) {
        var clusterSize = Math.floor(populationSize / Math.floor(populationSize / sampleSize));
        var sorted = samples.slice().sort(function(a, b) { return a - b; });

        var score = 100;

        // Check if samples form contiguous clusters
        var clusters = [];
        var currentCluster = [sorted[0]];

        for (var i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] <= clusterSize / 2) {
                currentCluster.push(sorted[i]);
            } else {
                clusters.push(currentCluster);
                currentCluster = [sorted[i]];
            }
        }
        clusters.push(currentCluster);

        // Fewer clusters is better for cluster sampling
        if (clusters.length > sampleSize / clusterSize + 1) {
            score -= (clusters.length - 1) * 15;
        }

        return Math.max(score, 50);
    }

    /**
     * Submit results to server
     */
    function submitToServer(score, timeSpent) {
        var data = {
            samplinggameid: config.samplinggameid,
            userid: config.userid,
            selectedsamples: gameState.selectedSamples,
            score: score,
            timespent: timeSpent,
            sesskey: config.sesskey
        };

        // Show loading
        showFeedback('제출 중...', 'info');

        // AJAX request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.wwwroot + '/mod/samplinggame/submit_attempt.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    showFeedback('제출 완료! 점수: ' + score.toFixed(2) + '<br>' + response.feedback, 'success');
                    endGame();

                    // Reload page after 3 seconds to show new attempt
                    setTimeout(function() {
                        window.location.reload();
                    }, 3000);
                } else {
                    showFeedback('오류: ' + response.message, 'error');
                }
            } else {
                showFeedback('서버 오류가 발생했습니다.', 'error');
            }
        };

        xhr.onerror = function() {
            showFeedback('네트워크 오류가 발생했습니다.', 'error');
        };

        xhr.send(JSON.stringify(data));
    }

    /**
     * End game
     */
    function endGame() {
        gameState.isGameActive = false;

        // Disable all population items
        gameState.population.forEach(function(item) {
            item.element.classList.add('disabled');
        });

        document.getElementById('reset-game-btn').textContent = '다시 시작';
        document.getElementById('submit-game-btn').style.display = 'none';
    }

    /**
     * Show feedback message
     */
    function showFeedback(message, type) {
        var feedbackEl = document.getElementById('game-feedback');
        feedbackEl.innerHTML = message;
        feedbackEl.className = 'show ' + type;
    }

    /**
     * Hide feedback message
     */
    function hideFeedback() {
        var feedbackEl = document.getElementById('game-feedback');
        feedbackEl.className = '';
    }

    // Public API
    return {
        init: init
    };
})();

/**
 * Initialize game when page loads
 */
function initSamplingGame(config) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SamplingGame.init(config);
        });
    } else {
        SamplingGame.init(config);
    }
}
