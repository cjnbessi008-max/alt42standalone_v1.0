/**
 * Chance Mood - Smartphone Display JavaScript
 *
 * Handles interactivity for the virtual smartphone display
 * showing probability problem mood analysis
 *
 * @package    block_chancemood
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChanceMood);
    } else {
        initChanceMood();
    }

    /**
     * Initialize Chance Mood display
     */
    function initChanceMood() {
        console.log('Initializing Chance Mood display...');

        // Add toggle button
        addToggleButton();

        // Apply dynamic colors
        applyMoodColors();

        // Add touch/click interactions
        addInteractions();

        // Animate chart bars
        animateChartBars();

        // Auto-refresh data periodically
        startAutoRefresh();
    }

    /**
     * Add toggle button to show/hide smartphone display
     */
    function addToggleButton() {
        const container = document.getElementById('chancemood-container');
        if (!container) return;

        // Check if toggle already exists
        if (document.querySelector('.chancemood-toggle')) return;

        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'chancemood-toggle chancemood-visible';
        toggle.setAttribute('aria-label', 'Toggle Chance Mood Display');
        toggle.innerHTML = '✕';

        // Add click handler
        toggle.addEventListener('click', function() {
            const isVisible = container.style.display !== 'none';

            if (isVisible) {
                container.style.display = 'none';
                toggle.innerHTML = '📊';
                toggle.className = 'chancemood-toggle chancemood-hidden';
            } else {
                container.style.display = 'block';
                toggle.innerHTML = '✕';
                toggle.className = 'chancemood-toggle chancemood-visible';
                // Animate slide in
                container.style.animation = 'slideInUp 0.5s ease-out';
            }
        });

        // Add to page
        document.body.appendChild(toggle);
    }

    /**
     * Apply dynamic mood colors based on emotion
     */
    function applyMoodColors() {
        const header = document.querySelector('.mood-header');
        if (!header) return;

        const bgColor = header.style.backgroundColor;

        // Set CSS custom properties for consistent theming
        if (bgColor) {
            document.documentElement.style.setProperty('--mood-color', bgColor);

            // Darken color for gradients
            const darkColor = darkenColor(bgColor, 20);
            document.documentElement.style.setProperty('--mood-color-dark', darkColor);
        }

        // Apply colors to chart fills
        const chartFills = document.querySelectorAll('.chart-fill');
        chartFills.forEach(function(fill) {
            const fillColor = fill.style.backgroundColor;
            if (fillColor) {
                fill.style.setProperty('--fill-color', fillColor);
                fill.style.setProperty('--fill-color-light', lightenColor(fillColor, 20));
            }
        });
    }

    /**
     * Add interactive behaviors
     */
    function addInteractions() {
        // Make smartphone draggable
        makeSmartphoneDraggable();

        // Add hover effects to chart bars
        addChartInteractions();

        // Add emoji animation on click
        addEmojiInteraction();
    }

    /**
     * Make smartphone display draggable
     */
    function makeSmartphoneDraggable() {
        const container = document.getElementById('chancemood-container');
        if (!container) return;

        const frame = container.querySelector('.smartphone-frame');
        if (!frame) return;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        frame.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        // Touch support
        frame.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            startDrag({clientX: touch.clientX, clientY: touch.clientY});
            e.preventDefault();
        });

        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            const touch = e.touches[0];
            drag({clientX: touch.clientX, clientY: touch.clientY});
            e.preventDefault();
        });

        document.addEventListener('touchend', stopDrag);

        function startDrag(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            frame.style.cursor = 'grabbing';
        }

        function drag(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            container.style.left = (startLeft + deltaX) + 'px';
            container.style.top = (startTop + deltaY) + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        }

        function stopDrag() {
            isDragging = false;
            frame.style.cursor = '';
        }
    }

    /**
     * Add chart bar interactions
     */
    function addChartInteractions() {
        const chartBars = document.querySelectorAll('.chart-bar-wrapper');

        chartBars.forEach(function(bar) {
            bar.addEventListener('mouseenter', function() {
                const fill = bar.querySelector('.chart-fill');
                if (fill) {
                    fill.style.opacity = '0.8';
                    fill.style.transform = 'scaleY(1.1)';
                }
            });

            bar.addEventListener('mouseleave', function() {
                const fill = bar.querySelector('.chart-fill');
                if (fill) {
                    fill.style.opacity = '1';
                    fill.style.transform = 'scaleY(1)';
                }
            });

            // Show tooltip on click
            bar.addEventListener('click', function() {
                const label = bar.querySelector('.chart-label').textContent;
                const value = bar.querySelector('.chart-value').textContent;
                showTooltip(bar, label + ': ' + value + '개 문제');
            });
        });
    }

    /**
     * Add emoji click animation
     */
    function addEmojiInteraction() {
        const emoji = document.querySelector('.mood-emoji');
        if (!emoji) return;

        emoji.addEventListener('click', function() {
            emoji.style.animation = 'none';
            setTimeout(function() {
                emoji.style.animation = 'pulse 2s ease-in-out infinite';
            }, 10);

            // Add bounce effect
            emoji.style.transform = 'scale(1.3) rotate(10deg)';
            setTimeout(function() {
                emoji.style.transform = 'scale(1) rotate(0deg)';
            }, 300);
        });
    }

    /**
     * Animate chart bars on load
     */
    function animateChartBars() {
        const chartFills = document.querySelectorAll('.chart-fill');

        chartFills.forEach(function(fill, index) {
            const targetWidth = fill.style.width;
            fill.style.width = '0%';

            setTimeout(function() {
                fill.style.transition = 'width 0.8s ease-out';
                fill.style.width = targetWidth;
            }, 100 * (index + 1));
        });
    }

    /**
     * Auto-refresh mood data periodically
     */
    function startAutoRefresh() {
        // Refresh every 5 minutes
        setInterval(function() {
            refreshMoodData();
        }, 5 * 60 * 1000);
    }

    /**
     * Refresh mood data via AJAX
     */
    function refreshMoodData() {
        console.log('Refreshing Chance Mood data...');

        // In a real implementation, this would make an AJAX call to Moodle
        // For now, we'll just log the refresh
        // Example AJAX call (requires Moodle AJAX API):
        /*
        M.util.js_pending('block_chancemood_refresh');
        Y.io(M.cfg.wwwroot + '/blocks/chancemood/ajax.php', {
            method: 'GET',
            context: this,
            on: {
                success: function(id, response) {
                    console.log('Mood data refreshed successfully');
                    updateDisplay(JSON.parse(response.responseText));
                    M.util.js_complete('block_chancemood_refresh');
                },
                failure: function() {
                    console.error('Failed to refresh mood data');
                    M.util.js_complete('block_chancemood_refresh');
                }
            }
        });
        */
    }

    /**
     * Update display with new data
     */
    function updateDisplay(data) {
        // Update emoji
        const emoji = document.querySelector('.mood-emoji');
        if (emoji && data.emoji) {
            emoji.textContent = data.emoji;
        }

        // Update message
        const message = document.querySelector('.mood-message');
        if (message && data.message) {
            message.textContent = data.message;
        }

        // Update stats
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 2 && data.total && data.avg_success_rate) {
            statValues[0].textContent = data.total + '개';
            statValues[1].textContent = data.avg_success_rate + '%';
        }

        // Re-animate
        animateChartBars();
    }

    /**
     * Show tooltip
     */
    function showTooltip(element, text) {
        // Remove existing tooltips
        const existing = document.querySelector('.chancemood-tooltip');
        if (existing) {
            existing.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'chancemood-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); color: white; ' +
            'padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 10000; ' +
            'pointer-events: none; white-space: nowrap;';

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

        setTimeout(function() {
            tooltip.remove();
        }, 2000);
    }

    /**
     * Darken a color by percentage
     */
    function darkenColor(color, percent) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const factor = (100 - percent) / 100;
        return 'rgb(' +
            Math.floor(rgb.r * factor) + ',' +
            Math.floor(rgb.g * factor) + ',' +
            Math.floor(rgb.b * factor) + ')';
    }

    /**
     * Lighten a color by percentage
     */
    function lightenColor(color, percent) {
        const rgb = parseColor(color);
        if (!rgb) return color;

        const factor = percent / 100;
        return 'rgb(' +
            Math.floor(rgb.r + (255 - rgb.r) * factor) + ',' +
            Math.floor(rgb.g + (255 - rgb.g) * factor) + ',' +
            Math.floor(rgb.b + (255 - rgb.b) * factor) + ')';
    }

    /**
     * Parse color string to RGB object
     */
    function parseColor(color) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }

        // Handle rgb/rgba colors
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }

        return null;
    }

})();
