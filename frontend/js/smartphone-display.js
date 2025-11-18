/**
 * Smartphone Display Component
 *
 * Creates a virtual smartphone frame in the lower right corner
 * of the page to display the Shift Trail app
 */

class SmartphoneDisplay {
    constructor(options = {}) {
        this.config = {
            width: options.width || 375,  // iPhone X width
            height: options.height || 667, // iPhone X height
            position: options.position || 'bottom-right',
            scale: options.scale || 0.8,
            showFrame: options.showFrame !== false,
            deviceType: options.deviceType || 'iphone', // 'iphone' or 'android'
            backgroundColor: options.backgroundColor || '#fff',
            frameColor: options.frameColor || '#1a1a1a',
            onReady: options.onReady || null
        };

        this.container = null;
        this.frame = null;
        this.screen = null;
        this.contentArea = null;

        this.init();
    }

    /**
     * Initialize smartphone display
     */
    init() {
        this.createContainer();
        this.createFrame();
        this.createScreen();
        this.positionDisplay();

        // Call ready callback
        if (this.config.onReady) {
            this.config.onReady(this.contentArea);
        }
    }

    /**
     * Create main container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'smartphone-display-container';
        this.container.style.cssText = `
            position: fixed;
            z-index: 1000;
            transform: scale(${this.config.scale});
            transform-origin: bottom right;
        `;

        document.body.appendChild(this.container);
    }

    /**
     * Create smartphone frame
     */
    createFrame() {
        if (!this.config.showFrame) return;

        this.frame = document.createElement('div');
        this.frame.className = 'smartphone-frame';

        const frameStyle = `
            position: relative;
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: ${this.config.frameColor};
            border-radius: 36px;
            padding: 12px;
            box-shadow:
                0 0 0 2px rgba(0,0,0,0.1),
                0 20px 60px rgba(0,0,0,0.3),
                inset 0 0 6px rgba(255,255,255,0.1);
        `;

        this.frame.style.cssText = frameStyle;

        // Add notch for iPhone style
        if (this.config.deviceType === 'iphone') {
            const notch = document.createElement('div');
            notch.className = 'smartphone-notch';
            notch.style.cssText = `
                position: absolute;
                top: 12px;
                left: 50%;
                transform: translateX(-50%);
                width: 150px;
                height: 24px;
                background: ${this.config.frameColor};
                border-radius: 0 0 20px 20px;
                z-index: 10;
            `;

            // Add speaker grille
            const speaker = document.createElement('div');
            speaker.style.cssText = `
                position: absolute;
                top: 6px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
            `;
            notch.appendChild(speaker);

            this.frame.appendChild(notch);
        }

        // Add home indicator for modern iPhones
        if (this.config.deviceType === 'iphone') {
            const homeIndicator = document.createElement('div');
            homeIndicator.className = 'smartphone-home-indicator';
            homeIndicator.style.cssText = `
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: 120px;
                height: 4px;
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
                z-index: 10;
            `;
            this.frame.appendChild(homeIndicator);
        }

        // Add power button
        const powerButton = document.createElement('div');
        powerButton.className = 'smartphone-button-power';
        powerButton.style.cssText = `
            position: absolute;
            right: -3px;
            top: 100px;
            width: 3px;
            height: 60px;
            background: ${this.config.frameColor};
            border-radius: 0 2px 2px 0;
        `;
        this.frame.appendChild(powerButton);

        // Add volume buttons
        const volumeUp = document.createElement('div');
        volumeUp.className = 'smartphone-button-volume-up';
        volumeUp.style.cssText = `
            position: absolute;
            left: -3px;
            top: 100px;
            width: 3px;
            height: 40px;
            background: ${this.config.frameColor};
            border-radius: 2px 0 0 2px;
        `;
        this.frame.appendChild(volumeUp);

        const volumeDown = document.createElement('div');
        volumeDown.className = 'smartphone-button-volume-down';
        volumeDown.style.cssText = `
            position: absolute;
            left: -3px;
            top: 150px;
            width: 3px;
            height: 40px;
            background: ${this.config.frameColor};
            border-radius: 2px 0 0 2px;
        `;
        this.frame.appendChild(volumeDown);

        this.container.appendChild(this.frame);
    }

    /**
     * Create screen area
     */
    createScreen() {
        this.screen = document.createElement('div');
        this.screen.className = 'smartphone-screen';

        const screenStyle = `
            position: relative;
            width: 100%;
            height: 100%;
            background: ${this.config.backgroundColor};
            border-radius: 24px;
            overflow: hidden;
            box-shadow: inset 0 0 8px rgba(0,0,0,0.1);
        `;

        this.screen.style.cssText = screenStyle;

        // Create content area (safe area excluding notch)
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'smartphone-content';
        this.contentArea.style.cssText = `
            width: 100%;
            height: 100%;
            padding: ${this.config.deviceType === 'iphone' ? '30px 0 20px 0' : '10px 0'};
            box-sizing: border-box;
            overflow: hidden;
        `;

        this.screen.appendChild(this.contentArea);

        if (this.config.showFrame && this.frame) {
            this.frame.appendChild(this.screen);
        } else {
            this.container.appendChild(this.screen);
        }
    }

    /**
     * Position display on screen
     */
    positionDisplay() {
        const positions = {
            'bottom-right': {
                bottom: '20px',
                right: '20px'
            },
            'bottom-left': {
                bottom: '20px',
                left: '20px',
                transformOrigin: 'bottom left'
            },
            'top-right': {
                top: '20px',
                right: '20px',
                transformOrigin: 'top right'
            },
            'top-left': {
                top: '20px',
                left: '20px',
                transformOrigin: 'top left'
            },
            'center': {
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${this.config.scale})`,
                transformOrigin: 'center'
            }
        };

        const pos = positions[this.config.position] || positions['bottom-right'];

        Object.keys(pos).forEach(key => {
            this.container.style[key] = pos[key];
        });
    }

    /**
     * Get content area element
     */
    getContentArea() {
        return this.contentArea;
    }

    /**
     * Set content HTML
     */
    setContent(html) {
        this.contentArea.innerHTML = html;
    }

    /**
     * Append element to content area
     */
    appendChild(element) {
        this.contentArea.appendChild(element);
    }

    /**
     * Show display
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Hide display
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Toggle display visibility
     */
    toggle() {
        const isVisible = this.container.style.display !== 'none';
        if (isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update scale
     */
    setScale(scale) {
        this.config.scale = scale;
        const currentTransform = this.container.style.transform;
        this.container.style.transform = currentTransform.replace(
            /scale\([^)]+\)/,
            `scale(${scale})`
        );
    }

    /**
     * Update position
     */
    setPosition(position) {
        this.config.position = position;

        // Reset position styles
        ['top', 'right', 'bottom', 'left', 'transform', 'transformOrigin'].forEach(prop => {
            this.container.style[prop] = '';
        });

        this.positionDisplay();
    }

    /**
     * Add status bar
     */
    addStatusBar(options = {}) {
        const statusBar = document.createElement('div');
        statusBar.className = 'smartphone-status-bar';
        statusBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: rgba(0,0,0,0.02);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #333;
            z-index: 100;
        `;

        const time = options.time || new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        statusBar.innerHTML = `
            <div class="status-left">
                <span class="status-time">${time}</span>
            </div>
            <div class="status-right" style="display: flex; gap: 8px; align-items: center;">
                <span class="status-signal">📶</span>
                <span class="status-wifi">📡</span>
                <span class="status-battery">🔋</span>
            </div>
        `;

        this.contentArea.insertBefore(statusBar, this.contentArea.firstChild);

        // Update time every minute
        setInterval(() => {
            const timeEl = statusBar.querySelector('.status-time');
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
        }, 60000);

        return statusBar;
    }

    /**
     * Add app header
     */
    addAppHeader(title, options = {}) {
        const header = document.createElement('div');
        header.className = 'smartphone-app-header';
        header.style.cssText = `
            background: ${options.backgroundColor || '#3498db'};
            color: ${options.textColor || '#fff'};
            padding: 15px 20px;
            font-size: 18px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const titleEl = document.createElement('div');
        titleEl.textContent = title;

        header.appendChild(titleEl);

        if (options.showBackButton) {
            const backButton = document.createElement('button');
            backButton.textContent = '← Back';
            backButton.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                font-size: 16px;
                cursor: pointer;
                padding: 5px 10px;
            `;

            if (options.onBackClick) {
                backButton.addEventListener('click', options.onBackClick);
            }

            header.insertBefore(backButton, titleEl);
        }

        this.contentArea.appendChild(header);

        return header;
    }

    /**
     * Destroy display
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartphoneDisplay;
}
