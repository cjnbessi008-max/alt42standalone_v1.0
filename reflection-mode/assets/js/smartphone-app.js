/**
 * Smartphone App Controller
 * Handles UI interactions and connects controls to reflection engine
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize reflection engine
    const reflectionEngine = new ReflectionEngine('reflectionCanvas');

    // Make it globally accessible
    window.reflectionEngine = reflectionEngine;

    // Get control elements
    const showOriginalCheckbox = document.getElementById('showOriginal');
    const showReflectedCheckbox = document.getElementById('showReflected');
    const showOverlapCheckbox = document.getElementById('showOverlap');
    const showAxisCheckbox = document.getElementById('showAxis');
    const showGridCheckbox = document.getElementById('showGrid');
    const overlapOpacitySlider = document.getElementById('overlapOpacity');
    const opacityValueSpan = document.getElementById('opacityValue');
    const shapeTypeSelect = document.getElementById('shapeType');

    const btnDraw = document.getElementById('btnDraw');
    const btnClear = document.getElementById('btnClear');
    const btnReset = document.getElementById('btnReset');
    const btnAnimate = document.getElementById('btnAnimate');
    const btnExport = document.getElementById('btnExport');

    // Checkbox event listeners
    if (showOriginalCheckbox) {
        showOriginalCheckbox.addEventListener('change', function() {
            reflectionEngine.settings.showOriginal = this.checked;
            reflectionEngine.render();
        });
    }

    if (showReflectedCheckbox) {
        showReflectedCheckbox.addEventListener('change', function() {
            reflectionEngine.settings.showReflected = this.checked;
            reflectionEngine.render();
        });
    }

    if (showOverlapCheckbox) {
        showOverlapCheckbox.addEventListener('change', function() {
            reflectionEngine.settings.showOverlap = this.checked;
            reflectionEngine.render();
        });
    }

    if (showAxisCheckbox) {
        showAxisCheckbox.addEventListener('change', function() {
            reflectionEngine.settings.showAxis = this.checked;
            reflectionEngine.render();
        });
    }

    if (showGridCheckbox) {
        showGridCheckbox.addEventListener('change', function() {
            reflectionEngine.settings.showGrid = this.checked;
            reflectionEngine.render();
        });
    }

    // Opacity slider
    if (overlapOpacitySlider && opacityValueSpan) {
        overlapOpacitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            reflectionEngine.settings.overlapOpacity = value / 100;
            opacityValueSpan.textContent = value + '%';
            reflectionEngine.render();
        });
    }

    // Shape type select
    if (shapeTypeSelect) {
        shapeTypeSelect.addEventListener('change', function() {
            reflectionEngine.settings.shapeType = this.value;
        });
    }

    // Button event listeners
    if (btnDraw) {
        btnDraw.addEventListener('click', function() {
            const shapeType = shapeTypeSelect ? shapeTypeSelect.value : 'polygon';
            reflectionEngine.generateShape(shapeType);
            showNotification('도형이 생성되었습니다!', 'success');
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', function() {
            reflectionEngine.clear();
            showNotification('캔버스가 지워졌습니다.', 'info');
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', function() {
            reflectionEngine.reset();

            // Reset UI controls
            if (showOriginalCheckbox) showOriginalCheckbox.checked = true;
            if (showReflectedCheckbox) showReflectedCheckbox.checked = true;
            if (showOverlapCheckbox) showOverlapCheckbox.checked = true;
            if (showAxisCheckbox) showAxisCheckbox.checked = true;
            if (showGridCheckbox) showGridCheckbox.checked = false;
            if (overlapOpacitySlider) {
                overlapOpacitySlider.value = 70;
                if (opacityValueSpan) opacityValueSpan.textContent = '70%';
            }
            if (shapeTypeSelect) shapeTypeSelect.value = 'polygon';

            showNotification('초기 상태로 복원되었습니다.', 'info');
        });
    }

    if (btnAnimate) {
        let isAnimating = false;
        btnAnimate.addEventListener('click', function() {
            isAnimating = !isAnimating;

            if (isAnimating) {
                reflectionEngine.startAnimation();
                this.textContent = '애니메이션 정지';
                this.classList.remove('btn-success');
                this.classList.add('btn-danger');
                showNotification('애니메이션이 시작되었습니다.', 'info');
            } else {
                reflectionEngine.stopAnimation();
                this.textContent = '애니메이션 시작';
                this.classList.remove('btn-danger');
                this.classList.add('btn-success');
                showNotification('애니메이션이 정지되었습니다.', 'info');
            }
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', function() {
            reflectionEngine.exportImage();
            showNotification('이미지가 다운로드되었습니다!', 'success');
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '300px'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.background = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add CSS animation for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .btn-danger {
            background: #dc3545;
            color: white;
        }

        .btn-danger:hover {
            background: #c82333;
        }
    `;
    document.head.appendChild(style);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Z: Clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (btnClear) btnClear.click();
        }

        // Ctrl/Cmd + R: Reset
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (btnReset) btnReset.click();
        }

        // Ctrl/Cmd + D: Draw
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (btnDraw) btnDraw.click();
        }

        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (btnExport) btnExport.click();
        }

        // Space: Toggle animation
        if (e.key === ' ' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (btnAnimate) btnAnimate.click();
        }

        // G: Toggle grid
        if (e.key === 'g' || e.key === 'G') {
            if (showGridCheckbox) {
                showGridCheckbox.checked = !showGridCheckbox.checked;
                showGridCheckbox.dispatchEvent(new Event('change'));
            }
        }

        // A: Toggle axis
        if (e.key === 'a' || e.key === 'A') {
            if (showAxisCheckbox) {
                showAxisCheckbox.checked = !showAxisCheckbox.checked;
                showAxisCheckbox.dispatchEvent(new Event('change'));
            }
        }

        // O: Toggle overlap
        if (e.key === 'o' || e.key === 'O') {
            if (showOverlapCheckbox) {
                showOverlapCheckbox.checked = !showOverlapCheckbox.checked;
                showOverlapCheckbox.dispatchEvent(new Event('change'));
            }
        }
    });

    // Auto-generate initial shape for demonstration
    setTimeout(() => {
        reflectionEngine.generateShape('polygon');
        showNotification('Reflection Mode가 준비되었습니다!', 'success');
    }, 500);

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Redraw canvas on resize
            reflectionEngine.render();
        }, 250);
    });

    // Touch feedback for mobile
    if ('ontouchstart' in window) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    // Help tooltip
    const helpMessages = {
        showOriginal: '원본 도형을 표시하거나 숨깁니다',
        showReflected: 'y=x 축으로 대칭된 도형을 표시하거나 숨깁니다',
        showOverlap: '두 도형이 겹치는 부분을 강조 표시합니다',
        showAxis: 'y=x 대칭축을 표시하거나 숨깁니다',
        showGrid: '좌표 격자를 표시하거나 숨깁니다',
        overlapOpacity: '겹치는 부분의 투명도를 조절합니다',
        shapeType: '생성할 도형의 종류를 선택합니다',
        btnDraw: '선택한 도형을 캔버스에 그립니다',
        btnClear: '캔버스의 모든 도형을 지웁니다',
        btnReset: '모든 설정을 초기 상태로 되돌립니다',
        btnAnimate: '겹치는 부분을 애니메이션으로 표시합니다',
        btnExport: '현재 캔버스를 이미지 파일로 저장합니다'
    };

    // Add tooltips to controls
    Object.keys(helpMessages).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.title = helpMessages[id];
        }
    });

    // Console welcome message
    console.log('%c✨ Reflection Mode v1.0', 'font-size: 20px; font-weight: bold; color: #667eea;');
    console.log('%cKeyboard Shortcuts:', 'font-weight: bold; color: #764ba2;');
    console.log('  Ctrl/Cmd + D: Draw shape');
    console.log('  Ctrl/Cmd + Z: Clear canvas');
    console.log('  Ctrl/Cmd + R: Reset');
    console.log('  Ctrl/Cmd + E: Export image');
    console.log('  Space: Toggle animation');
    console.log('  G: Toggle grid');
    console.log('  A: Toggle axis');
    console.log('  O: Toggle overlap');
});
