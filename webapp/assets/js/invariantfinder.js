/**
 * JavaScript for the Invariant Finder activity module
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

var InvariantFinder = (function() {
    'use strict';

    var config = {};
    var canvas, ctx;
    var currentScale = 1.0;
    var shape = null;
    var foundInvariants = [];
    var startTime;
    var scaleCount = 0;

    // Shape definitions with their invariant properties
    var shapeDefinitions = {
        triangle: {
            name: 'Triangle',
            initialPoints: [
                {x: 150, y: 100},
                {x: 100, y: 200},
                {x: 200, y: 200}
            ],
            invariants: ['angleSum', 'angleRatios', 'sideRatios'],
            color: '#3498db'
        },
        rectangle: {
            name: 'Rectangle',
            initialPoints: [
                {x: 100, y: 120},
                {x: 200, y: 120},
                {x: 200, y: 220},
                {x: 100, y: 220}
            ],
            invariants: ['rightAngles', 'aspectRatio', 'parallelSides'],
            color: '#e74c3c'
        },
        circle: {
            name: 'Circle',
            center: {x: 150, y: 200},
            radius: 60,
            invariants: ['pi', 'circleRatio'],
            color: '#2ecc71'
        },
        parallelogram: {
            name: 'Parallelogram',
            initialPoints: [
                {x: 100, y: 150},
                {x: 180, y: 150},
                {x: 220, y: 230},
                {x: 140, y: 230}
            ],
            invariants: ['parallelSides', 'oppositeAngles', 'sideRatios'],
            color: '#9b59b6'
        }
    };

    /**
     * Initialize the application
     */
    function init(userConfig) {
        config = userConfig;
        canvas = document.getElementById('shape-canvas');
        ctx = canvas.getContext('2d');

        // Initialize shape based on config
        shape = createShape(config.shapeType);

        // Set up event listeners
        setupEventListeners();

        // Start timing
        startTime = Date.now();

        // Initial draw
        drawShape();
        updateMeasurements();

        // Load hints if enabled
        if (config.showHints) {
            loadHints();
        }

        // Load existing progress
        loadProgress();
    }

    /**
     * Create a shape object
     */
    function createShape(type) {
        var def = shapeDefinitions[type];
        return {
            type: type,
            definition: def,
            scale: 1.0,
            rotation: 0
        };
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Scale slider
        var slider = document.getElementById('scale-slider');
        slider.addEventListener('input', function(e) {
            var newScale = e.target.value / 100;
            currentScale = newScale;
            shape.scale = newScale;
            document.getElementById('scale-value').textContent = e.target.value + '%';
            scaleCount++;
            drawShape();
            updateMeasurements();
            logInteraction('scale', {scale: newScale});
        });

        // Control buttons
        document.getElementById('zoom-in').addEventListener('click', function() {
            var slider = document.getElementById('scale-slider');
            var newValue = Math.min(200, parseInt(slider.value) + 10);
            slider.value = newValue;
            slider.dispatchEvent(new Event('input'));
        });

        document.getElementById('zoom-out').addEventListener('click', function() {
            var slider = document.getElementById('scale-slider');
            var newValue = Math.max(50, parseInt(slider.value) - 10);
            slider.value = newValue;
            slider.dispatchEvent(new Event('input'));
        });

        document.getElementById('reset').addEventListener('click', function() {
            var slider = document.getElementById('scale-slider');
            slider.value = 100;
            slider.dispatchEvent(new Event('input'));
        });

        // Check invariant button
        document.getElementById('check-invariant').addEventListener('click', checkForInvariants);

        // Submit button
        document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    }

    /**
     * Draw the shape on the canvas
     */
    function drawShape() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set styles
        ctx.strokeStyle = shape.definition.color;
        ctx.lineWidth = 3;
        ctx.fillStyle = shape.definition.color + '33'; // Add transparency

        if (shape.type === 'circle') {
            drawCircle();
        } else {
            drawPolygon();
        }

        // Draw measurements on shape
        drawMeasurementLabels();
    }

    /**
     * Draw a circle
     */
    function drawCircle() {
        var center = shape.definition.center;
        var radius = shape.definition.radius * shape.scale;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius, center.y);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Draw a polygon
     */
    function drawPolygon() {
        var points = getScaledPoints();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw vertices
        points.forEach(function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#333';
            ctx.fill();
        });
    }

    /**
     * Get scaled points for polygon
     */
    function getScaledPoints() {
        var points = shape.definition.initialPoints;
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        return points.map(function(p) {
            var dx = p.x - centerX;
            var dy = p.y - centerY;
            return {
                x: centerX + dx * shape.scale,
                y: centerY + dy * shape.scale
            };
        });
    }

    /**
     * Draw measurement labels on the shape
     */
    function drawMeasurementLabels() {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';

        if (shape.type === 'circle') {
            var center = shape.definition.center;
            var radius = shape.definition.radius * shape.scale;
            ctx.fillText('r = ' + radius.toFixed(1), center.x + radius/2 - 15, center.y - 5);
        } else {
            var points = getScaledPoints();
            // Draw side lengths
            for (var i = 0; i < points.length; i++) {
                var p1 = points[i];
                var p2 = points[(i + 1) % points.length];
                var midX = (p1.x + p2.x) / 2;
                var midY = (p1.y + p2.y) / 2;
                var length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                ctx.fillText(length.toFixed(0), midX - 10, midY - 5);
            }
        }
    }

    /**
     * Update measurements display
     */
    function updateMeasurements() {
        var measurements = calculateMeasurements();
        var html = '';

        for (var key in measurements) {
            var isInvariant = foundInvariants.indexOf(key) !== -1;
            var cssClass = isInvariant ? 'measurement invariant' : 'measurement';
            html += '<div class="' + cssClass + '">';
            html += '<strong>' + formatMeasurementName(key) + '</strong><br>';
            html += measurements[key];
            html += '</div>';
        }

        document.getElementById('measurements').innerHTML = html;
    }

    /**
     * Calculate all measurements for the current shape
     */
    function calculateMeasurements() {
        var measurements = {};

        if (shape.type === 'circle') {
            var radius = shape.definition.radius * shape.scale;
            measurements.radius = radius.toFixed(2);
            measurements.diameter = (radius * 2).toFixed(2);
            measurements.circumference = (2 * Math.PI * radius).toFixed(2);
            measurements.area = (Math.PI * radius * radius).toFixed(2);
            measurements.pi = (parseFloat(measurements.circumference) / parseFloat(measurements.diameter)).toFixed(4);
        } else {
            var points = getScaledPoints();
            var sides = [];

            // Calculate side lengths
            for (var i = 0; i < points.length; i++) {
                var p1 = points[i];
                var p2 = points[(i + 1) % points.length];
                var length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                sides.push(length);
                measurements['side' + (i + 1)] = length.toFixed(2);
            }

            // Calculate angles
            var angles = calculateAngles(points);
            angles.forEach(function(angle, idx) {
                measurements['angle' + (idx + 1)] = angle.toFixed(2) + '°';
            });

            // Calculate ratios if triangle
            if (shape.type === 'triangle') {
                measurements.angleSum = angles.reduce(function(a, b) { return a + b; }, 0).toFixed(2) + '°';
                measurements.ratio12 = (sides[0] / sides[1]).toFixed(3);
                measurements.ratio23 = (sides[1] / sides[2]).toFixed(3);
            }

            // Calculate aspect ratio for rectangle
            if (shape.type === 'rectangle' || shape.type === 'parallelogram') {
                measurements.aspectRatio = (sides[0] / sides[1]).toFixed(3);
            }
        }

        return measurements;
    }

    /**
     * Calculate angles for a polygon
     */
    function calculateAngles(points) {
        var angles = [];

        for (var i = 0; i < points.length; i++) {
            var p0 = points[(i - 1 + points.length) % points.length];
            var p1 = points[i];
            var p2 = points[(i + 1) % points.length];

            var v1 = {x: p0.x - p1.x, y: p0.y - p1.y};
            var v2 = {x: p2.x - p1.x, y: p2.y - p1.y};

            var dot = v1.x * v2.x + v1.y * v2.y;
            var det = v1.x * v2.y - v1.y * v2.x;
            var angle = Math.atan2(det, dot);

            angles.push(Math.abs(angle * 180 / Math.PI));
        }

        return angles;
    }

    /**
     * Format measurement name for display
     */
    function formatMeasurementName(key) {
        var names = {
            radius: 'Radius',
            diameter: 'Diameter',
            circumference: 'Circumference',
            area: 'Area',
            pi: 'π (C/D)',
            side1: 'Side 1',
            side2: 'Side 2',
            side3: 'Side 3',
            side4: 'Side 4',
            angle1: 'Angle 1',
            angle2: 'Angle 2',
            angle3: 'Angle 3',
            angle4: 'Angle 4',
            angleSum: 'Angle Sum',
            ratio12: 'Ratio 1:2',
            ratio23: 'Ratio 2:3',
            aspectRatio: 'Aspect Ratio'
        };
        return names[key] || key;
    }

    /**
     * Check for invariants
     */
    function checkForInvariants() {
        if (scaleCount < 2) {
            showToast('Try scaling the shape multiple times first!', 'info');
            return;
        }

        var measurements = calculateMeasurements();
        var newInvariants = detectInvariants(measurements);

        newInvariants.forEach(function(inv) {
            if (foundInvariants.indexOf(inv) === -1) {
                foundInvariants.push(inv);
                addInvariantToList(inv, measurements[inv]);
                showToast('Found invariant: ' + formatMeasurementName(inv), 'success');
            }
        });

        if (newInvariants.length === 0) {
            showToast('No new invariants detected. Keep exploring!', 'info');
        }

        updateMeasurements();
        logInteraction('check_invariant', {found: newInvariants});
    }

    /**
     * Detect which measurements are invariants
     */
    function detectInvariants(measurements) {
        var invariants = [];

        // Shape-specific invariant detection
        if (shape.type === 'circle') {
            if (Math.abs(parseFloat(measurements.pi) - Math.PI) < 0.01) {
                invariants.push('pi');
            }
        } else if (shape.type === 'triangle') {
            // Angle sum should be ~180°
            var angleSum = parseFloat(measurements.angleSum);
            if (Math.abs(angleSum - 180) < 2) {
                invariants.push('angleSum');
            }
            // Ratios remain constant
            invariants.push('ratio12');
            invariants.push('ratio23');
        } else if (shape.type === 'rectangle') {
            // Aspect ratio
            invariants.push('aspectRatio');
            // All angles are 90°
            for (var i = 1; i <= 4; i++) {
                var angle = parseFloat(measurements['angle' + i]);
                if (Math.abs(angle - 90) < 5) {
                    invariants.push('angle' + i);
                }
            }
        } else if (shape.type === 'parallelogram') {
            invariants.push('aspectRatio');
        }

        return invariants;
    }

    /**
     * Add invariant to the list
     */
    function addInvariantToList(invariant, value) {
        var html = '<div class="invariant-item">';
        html += '<strong>' + formatMeasurementName(invariant) + '</strong>: ' + value;
        html += '</div>';
        document.getElementById('found-invariants').innerHTML += html;
    }

    /**
     * Load hints for the current shape
     */
    function loadHints() {
        var hints = {
            triangle: [
                'Try measuring the angles. Do they change when you scale?',
                'Look at the sum of all angles.',
                'Check the ratios between different sides.'
            ],
            rectangle: [
                'What can you say about the angles?',
                'Look at the ratio of width to height.',
                'Are opposite sides always parallel?'
            ],
            circle: [
                'Measure the circumference and diameter.',
                'Calculate the ratio of circumference to diameter.',
                'This ratio is a famous mathematical constant!'
            ],
            parallelogram: [
                'Check the opposite angles.',
                'Are opposite sides always parallel?',
                'Look at the ratio of adjacent sides.'
            ]
        };

        var shapeHints = hints[shape.type] || [];
        var html = '<ul>';
        shapeHints.forEach(function(hint) {
            html += '<li>' + hint + '</li>';
        });
        html += '</ul>';

        document.getElementById('hints-content').innerHTML = html;
    }

    /**
     * Show toast notification
     */
    function showToast(message, type) {
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 3000);
    }

    /**
     * Log interaction to server
     */
    function logInteraction(actionType, actionData) {
        // Send AJAX request to log interaction
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.wwwroot + '/mod/invariantfinder/ajax.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send('action=log_interaction&sesskey=' + config.sesskey +
                 '&attempt_id=' + config.attemptId +
                 '&action_type=' + actionType +
                 '&action_data=' + encodeURIComponent(JSON.stringify(actionData)));
    }

    /**
     * Submit the answer
     */
    function submitAnswer() {
        if (foundInvariants.length === 0) {
            showToast('Find at least one invariant before submitting!', 'error');
            return;
        }

        var timeSpent = Math.floor((Date.now() - startTime) / 1000);
        var score = calculateScore();

        // Send AJAX request to save attempt
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.wwwroot + '/mod/invariantfinder/ajax.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (xhr.status === 200) {
                showToast('Submitted successfully! Score: ' + score, 'success');
                document.getElementById('current-score').textContent = score;
            }
        };
        xhr.send('action=submit_attempt&sesskey=' + config.sesskey +
                 '&attempt_id=' + config.attemptId +
                 '&invariants_found=' + encodeURIComponent(JSON.stringify(foundInvariants)) +
                 '&scale_actions=' + scaleCount +
                 '&time_spent=' + timeSpent +
                 '&score=' + score);

        logInteraction('submit', {score: score, time_spent: timeSpent});
    }

    /**
     * Calculate score based on invariants found
     */
    function calculateScore() {
        var possibleInvariants = shape.definition.invariants.length;
        var foundCount = 0;

        shape.definition.invariants.forEach(function(inv) {
            if (foundInvariants.indexOf(inv) !== -1 ||
                foundInvariants.some(function(f) { return f.startsWith(inv); })) {
                foundCount++;
            }
        });

        var baseScore = (foundCount / possibleInvariants) * 100;

        // Bonus for efficiency (fewer scale actions)
        var efficiencyBonus = Math.max(0, 10 - scaleCount / 2);

        return Math.min(100, Math.round(baseScore + efficiencyBonus));
    }

    /**
     * Load existing progress
     */
    function loadProgress() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', config.wwwroot + '/mod/invariantfinder/ajax.php?action=get_progress&attempt_id=' + config.attemptId, true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.invariants_found) {
                        var loaded = JSON.parse(data.invariants_found);
                        loaded.forEach(function(inv) {
                            foundInvariants.push(inv);
                            var measurements = calculateMeasurements();
                            addInvariantToList(inv, measurements[inv] || 'N/A');
                        });
                        updateMeasurements();
                    }
                    if (data.score) {
                        document.getElementById('current-score').textContent = Math.round(data.score);
                    }
                } catch (e) {
                    console.error('Error loading progress:', e);
                }
            }
        };
        xhr.send();
    }

    // Public API
    return {
        init: init
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.APP_CONFIG !== 'undefined') {
        // Update API URLs for standalone version
        window.APP_CONFIG.apiUrl = 'api/ajax.php';
        InvariantFinder.init(window.APP_CONFIG);
    }
});

// Override AJAX functions for standalone version
(function() {
    var originalLogInteraction = InvariantFinder.logInteraction;
    
    // Update XHR request to use new API structure
    if (typeof InvariantFinder.logInteraction === 'undefined') {
        // Add method to InvariantFinder object
    }
})();
