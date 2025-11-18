/**
 * Smartphone Display Component
 * Creates a virtual smartphone interface positioned in the bottom right
 * Displays the Probability Grid app within the smartphone frame
 */

class SmartphoneDisplay {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'bottom-right',
            width: options.width || 375, // iPhone-like width
            height: options.height || 667, // iPhone-like height
            scale: options.scale || 0.7, // Scale for display
            showFrame: options.showFrame !== false,
            frameColor: options.frameColor || '#1A1A1A',
            screenBgColor: options.screenBgColor || '#FFFFFF',
            title: options.title || 'Probability Grid',
            closeable: options.closeable !== false,
            onClose: options.onClose || null
        };

        this.isMinimized = false;
        this.container = null;

        this.init();
    }

    init() {
        this.createContainer();
        this.createFrame();
        this.attachEventListeners();
    }

    createContainer() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'smartphone-display';
        this.container.classList.add('smartphone-display');

        // Position based on options
        this.setPosition();

        document.body.appendChild(this.container);
    }

    setPosition() {
        const positions = {
            'bottom-right': {
                bottom: '20px',
                right: '20px'
            },
            'bottom-left': {
                bottom: '20px',
                left: '20px'
            },
            'top-right': {
                top: '20px',
                right: '20px'
            },
            'top-left': {
                top: '20px',
                left: '20px'
            }
        };

        const pos = positions[this.options.position] || positions['bottom-right'];

        Object.assign(this.container.style, {
            position: 'fixed',
            ...pos,
            zIndex: '9999',
            transform: `scale(${this.options.scale})`,
            transformOrigin: this.options.position.includes('right') ? 'bottom right' : 'bottom left',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        });
    }

    createFrame() {
        if (!this.options.showFrame) {
            this.createScreenOnly();
            return;
        }

        // Create smartphone frame
        const frame = document.createElement('div');
        frame.classList.add('smartphone-frame');

        Object.assign(frame.style, {
            width: `${this.options.width}px`,
            height: `${this.options.height}px`,
            backgroundColor: this.options.frameColor,
            borderRadius: '40px',
            padding: '15px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
            position: 'relative'
        });

        // Create screen area
        const screen = document.createElement('div');
        screen.classList.add('smartphone-screen');
        screen.id = 'smartphone-screen';

        Object.assign(screen.style, {
            width: '100%',
            height: '100%',
            backgroundColor: this.options.screenBgColor,
            borderRadius: '30px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        });

        // Create header bar
        const header = this.createHeader();
        screen.appendChild(header);

        // Create content area
        const content = document.createElement('div');
        content.classList.add('smartphone-content');
        content.id = 'smartphone-content';

        Object.assign(content.style, {
            flex: '1',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '15px',
            backgroundColor: this.options.screenBgColor
        });

        screen.appendChild(content);

        frame.appendChild(screen);
        this.container.appendChild(frame);
    }

    createHeader() {
        const header = document.createElement('div');
        header.classList.add('smartphone-header');

        Object.assign(header.style, {
            height: '60px',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 15px',
            borderBottom: '1px solid #388E3C',
            flexShrink: '0'
        });

        // Title
        const title = document.createElement('h2');
        title.textContent = this.options.title;
        title.style.margin = '0';
        title.style.fontSize = '18px';
        title.style.fontWeight = 'bold';

        // Control buttons
        const controls = document.createElement('div');
        controls.classList.add('smartphone-controls');
        controls.style.display = 'flex';
        controls.style.gap = '10px';

        // Minimize button
        const minimizeBtn = this.createButton('−', () => this.toggleMinimize());
        controls.appendChild(minimizeBtn);

        // Close button (if enabled)
        if (this.options.closeable) {
            const closeBtn = this.createButton('×', () => this.close());
            controls.appendChild(closeBtn);
        }

        header.appendChild(title);
        header.appendChild(controls);

        return header;
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('smartphone-button');

        Object.assign(button.style, {
            width: '30px',
            height: '30px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            transition: 'background-color 0.2s'
        });

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(255,255,255,0.3)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(255,255,255,0.2)';
        });

        button.addEventListener('click', onClick);

        return button;
    }

    createScreenOnly() {
        // Create simple screen without frame
        const screen = document.createElement('div');
        screen.classList.add('smartphone-screen-simple');
        screen.id = 'smartphone-content';

        Object.assign(screen.style, {
            width: `${this.options.width}px`,
            height: `${this.options.height}px`,
            backgroundColor: this.options.screenBgColor,
            borderRadius: '10px',
            overflow: 'auto',
            padding: '15px'
        });

        this.container.appendChild(screen);
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;

        const screen = this.container.querySelector('.smartphone-frame');
        if (this.isMinimized) {
            screen.style.height = '60px';
            screen.style.overflow = 'hidden';
        } else {
            screen.style.height = `${this.options.height}px`;
            screen.style.overflow = 'visible';
        }
    }

    close() {
        if (this.options.onClose) {
            this.options.onClose();
        }
        this.destroy();
    }

    attachEventListeners() {
        // Make draggable
        this.makeDraggable();
    }

    makeDraggable() {
        const header = this.container.querySelector('.smartphone-header');
        if (!header) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.style.cursor = 'move';

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Touch events for mobile
        header.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, this.container);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        const setTranslate = (xPos, yPos, el) => {
            const scale = this.options.scale;
            el.style.transform = `translate(${xPos}px, ${yPos}px) scale(${scale})`;
        };
    }

    // Public methods
    getContentContainer() {
        return document.getElementById('smartphone-content');
    }

    setTitle(title) {
        const titleElement = this.container.querySelector('.smartphone-header h2');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

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
