/**
 * ServiceContainer - 의존성 주입 컨테이너
 * Manages service lifecycle and dependencies
 */

export class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.factories = new Map();
        this.resolving = new Set();
    }

    /**
     * Register a service
     * @param {string} name - Service name
     * @param {Function|Object} service - Service class or factory function
     * @param {Object} options - Options (singleton, dependencies, factory)
     */
    register(name, service, options = {}) {
        const {
            singleton = true,
            dependencies = [],
            factory = false,
            lazy = false
        } = options;

        this.services.set(name, {
            service,
            singleton,
            dependencies,
            factory,
            lazy
        });

        console.log(`[ServiceContainer] Registered service "${name}"`, { singleton, dependencies, factory, lazy });

        // Initialize non-lazy singletons immediately
        if (singleton && !lazy) {
            this.resolve(name);
        }

        return this;
    }

    /**
     * Register a factory function
     */
    registerFactory(name, factoryFn, options = {}) {
        return this.register(name, factoryFn, {
            ...options,
            factory: true
        });
    }

    /**
     * Register a singleton
     */
    registerSingleton(name, serviceClass, options = {}) {
        return this.register(name, serviceClass, {
            ...options,
            singleton: true
        });
    }

    /**
     * Register a transient (new instance each time)
     */
    registerTransient(name, serviceClass, options = {}) {
        return this.register(name, serviceClass, {
            ...options,
            singleton: false
        });
    }

    /**
     * Resolve a service
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    resolve(name) {
        // Check for circular dependencies
        if (this.resolving.has(name)) {
            throw new Error(`Circular dependency detected: ${name}`);
        }

        // Return cached singleton instance
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        // Get service definition
        const serviceDef = this.services.get(name);
        if (!serviceDef) {
            throw new Error(`Service "${name}" not registered`);
        }

        // Mark as resolving
        this.resolving.add(name);

        try {
            // Resolve dependencies
            const deps = serviceDef.dependencies.map(dep => this.resolve(dep));

            // Create instance
            let instance;

            if (serviceDef.factory) {
                // Call factory function
                instance = serviceDef.service(...deps);
            } else {
                // Instantiate class
                instance = new serviceDef.service(...deps);
            }

            // Cache if singleton
            if (serviceDef.singleton) {
                this.instances.set(name, instance);
            }

            // Unmark as resolving
            this.resolving.delete(name);

            console.log(`[ServiceContainer] Resolved service "${name}"`);

            return instance;

        } catch (error) {
            this.resolving.delete(name);
            console.error(`[ServiceContainer] Failed to resolve "${name}":`, error);
            throw error;
        }
    }

    /**
     * Check if service exists
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Get service without resolving
     */
    get(name) {
        return this.instances.get(name);
    }

    /**
     * Unregister a service
     */
    unregister(name) {
        this.services.delete(name);
        this.instances.delete(name);
        console.log(`[ServiceContainer] Unregistered service "${name}"`);
    }

    /**
     * Clear all services
     */
    clear() {
        this.services.clear();
        this.instances.clear();
        this.factories.clear();
        console.log('[ServiceContainer] Cleared all services');
    }

    /**
     * Get all registered service names
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Get service info
     */
    getServiceInfo(name) {
        const serviceDef = this.services.get(name);
        if (!serviceDef) return null;

        return {
            name,
            singleton: serviceDef.singleton,
            dependencies: serviceDef.dependencies,
            factory: serviceDef.factory,
            instantiated: this.instances.has(name)
        };
    }

    /**
     * Get all services info
     */
    getAllServicesInfo() {
        return this.getServiceNames().map(name => this.getServiceInfo(name));
    }
}

// Create singleton container
export const container = new ServiceContainer();
