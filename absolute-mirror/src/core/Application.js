/**
 * Application - 메인 애플리케이션 클래스
 * Orchestrates the entire application lifecycle
 */

import { EventBus, EVENTS } from './EventBus.js';
import { ServiceContainer } from './ServiceContainer.js';

export class Application {
    constructor(config = {}) {
        this.config = {
            debug: false,
            autoStart: true,
            ...config
        };

        this.container = new ServiceContainer();
        this.eventBus = new EventBus();
        this.eventBus.setDebug(this.config.debug);

        this.state = {
            initialized: false,
            ready: false,
            error: null
        };

        console.log('[Application] Created with config:', this.config);
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.state.initialized) {
            console.warn('[Application] Already initialized');
            return;
        }

        try {
            console.log('[Application] Initializing...');

            // Emit init event
            await this.eventBus.emit(EVENTS.APP_INIT);

            // Register core services
            await this.registerCoreServices();

            // Register application services
            await this.registerServices();

            // Setup routes
            await this.setupRoutes();

            // Setup global event listeners
            await this.setupEventListeners();

            // Initialize services
            await this.initializeServices();

            this.state.initialized = true;

            console.log('[Application] Initialized successfully');

            // Auto-start if configured
            if (this.config.autoStart) {
                await this.start();
            }

        } catch (error) {
            this.state.error = error;
            console.error('[Application] Initialization failed:', error);
            await this.eventBus.emit(EVENTS.APP_ERROR, { error, phase: 'init' });
            throw error;
        }
    }

    /**
     * Register core services
     */
    async registerCoreServices() {
        // Event bus (singleton)
        this.container.registerSingleton('eventBus', () => this.eventBus, {
            factory: true
        });

        // Configuration (singleton)
        this.container.registerSingleton('config', () => this.config, {
            factory: true
        });

        console.log('[Application] Core services registered');
    }

    /**
     * Register application services
     * Override in subclass to add your services
     */
    async registerServices() {
        // To be overridden
        console.log('[Application] No additional services to register');
    }

    /**
     * Setup routing
     * Override in subclass
     */
    async setupRoutes() {
        console.log('[Application] No routes to setup');
    }

    /**
     * Setup global event listeners
     */
    async setupEventListeners() {
        // Error handling
        this.eventBus.on(EVENTS.APP_ERROR, async ({ error, phase }) => {
            console.error(`[Application] Error in ${phase}:`, error);
            await this.handleError(error, phase);
        });

        // Window events
        window.addEventListener('error', (event) => {
            this.eventBus.emit(EVENTS.APP_ERROR, {
                error: event.error,
                phase: 'runtime'
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.eventBus.emit(EVENTS.APP_ERROR, {
                error: event.reason,
                phase: 'promise'
            });
        });

        console.log('[Application] Event listeners setup');
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        const serviceNames = this.container.getServiceNames();

        for (const name of serviceNames) {
            try {
                const service = this.container.resolve(name);

                // Call init method if available
                if (service && typeof service.init === 'function') {
                    await service.init();
                    console.log(`[Application] Initialized service "${name}"`);
                }
            } catch (error) {
                console.error(`[Application] Failed to initialize service "${name}":`, error);
                throw error;
            }
        }
    }

    /**
     * Start the application
     */
    async start() {
        if (!this.state.initialized) {
            await this.init();
        }

        if (this.state.ready) {
            console.warn('[Application] Already started');
            return;
        }

        try {
            console.log('[Application] Starting...');

            // Start services
            await this.startServices();

            // Render UI
            await this.render();

            this.state.ready = true;

            console.log('[Application] Started successfully');

            // Emit ready event
            await this.eventBus.emit(EVENTS.APP_READY);

        } catch (error) {
            this.state.error = error;
            console.error('[Application] Start failed:', error);
            await this.eventBus.emit(EVENTS.APP_ERROR, { error, phase: 'start' });
            throw error;
        }
    }

    /**
     * Start services
     */
    async startServices() {
        const serviceNames = this.container.getServiceNames();

        for (const name of serviceNames) {
            try {
                const service = this.container.resolve(name);

                // Call start method if available
                if (service && typeof service.start === 'function') {
                    await service.start();
                    console.log(`[Application] Started service "${name}"`);
                }
            } catch (error) {
                console.error(`[Application] Failed to start service "${name}":`, error);
                throw error;
            }
        }
    }

    /**
     * Render the application
     * Override in subclass
     */
    async render() {
        console.log('[Application] No rendering to do');
    }

    /**
     * Stop the application
     */
    async stop() {
        if (!this.state.ready) {
            console.warn('[Application] Not started');
            return;
        }

        try {
            console.log('[Application] Stopping...');

            // Stop services
            await this.stopServices();

            this.state.ready = false;

            console.log('[Application] Stopped successfully');

        } catch (error) {
            console.error('[Application] Stop failed:', error);
            await this.eventBus.emit(EVENTS.APP_ERROR, { error, phase: 'stop' });
            throw error;
        }
    }

    /**
     * Stop services
     */
    async stopServices() {
        const serviceNames = this.container.getServiceNames();

        for (const name of serviceNames) {
            try {
                const service = this.container.get(name);

                // Call stop method if available
                if (service && typeof service.stop === 'function') {
                    await service.stop();
                    console.log(`[Application] Stopped service "${name}"`);
                }
            } catch (error) {
                console.error(`[Application] Failed to stop service "${name}":`, error);
            }
        }
    }

    /**
     * Handle errors
     */
    async handleError(error, phase) {
        console.error(`[Application] Handling error from ${phase}:`, error);

        // Show user-friendly error message
        if (typeof this.showErrorMessage === 'function') {
            this.showErrorMessage(error, phase);
        }
    }

    /**
     * Get service from container
     */
    service(name) {
        return this.container.resolve(name);
    }

    /**
     * Get application state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Destroy the application
     */
    async destroy() {
        await this.stop();

        // Clear event listeners
        this.eventBus.clear();

        // Clear container
        this.container.clear();

        console.log('[Application] Destroyed');
    }
}
