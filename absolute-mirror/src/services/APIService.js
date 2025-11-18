/**
 * APIService - API 통신 서비스
 * Handles all API communication with backend
 */

import { Problem } from '../models/Problem.js';
import { EVENTS } from '../core/EventBus.js';

export class APIService {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;

        this.baseURL = config.api?.baseURL || '/api';
        this.timeout = config.api?.timeout || 10000;
        this.retryAttempts = config.api?.retryAttempts || 3;
        this.retryDelay = config.api?.retryDelay || 1000;

        this.cache = new Map();
        this.cacheEnabled = config.api?.cache !== false;
        this.cacheTTL = config.api?.cacheTTL || 300000; // 5 minutes

        this.requestQueue = [];
        this.activeRequests = 0;
        this.maxConcurrentRequests = config.api?.maxConcurrentRequests || 6;
    }

    /**
     * Initialize service
     */
    async init() {
        console.log('[APIService] Initialized');
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || 'GET';

        // Check cache for GET requests
        if (method === 'GET' && this.cacheEnabled) {
            const cached = this.getFromCache(url);
            if (cached) {
                console.log(`[APIService] Cache hit: ${url}`);
                return cached;
            }
        }

        // Emit request event
        this.eventBus?.emit(EVENTS.API_REQUEST, { url, method, options });

        let lastError;
        let attempt = 0;

        while (attempt < this.retryAttempts) {
            try {
                // Wait for available slot
                await this.waitForSlot();

                this.activeRequests++;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                clearTimeout(timeoutId);
                this.activeRequests--;

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Cache successful GET requests
                if (method === 'GET' && this.cacheEnabled) {
                    this.setCache(url, data);
                }

                // Emit response event
                this.eventBus?.emit(EVENTS.API_RESPONSE, { url, data });

                // Process queue
                this.processQueue();

                return data;

            } catch (error) {
                this.activeRequests--;
                lastError = error;
                attempt++;

                console.warn(`[APIService] Request failed (attempt ${attempt}/${this.retryAttempts}):`, error);

                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        // All retries failed
        console.error(`[APIService] Request failed after ${this.retryAttempts} attempts:`, lastError);

        this.eventBus?.emit(EVENTS.API_ERROR, {
            url,
            error: lastError,
            attempts: this.retryAttempts
        });

        throw lastError;
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Get problems list
     */
    async getProblems(filters = {}) {
        const response = await this.get('/problems.php', filters);

        if (response.success && response.data) {
            response.data = response.data.map(p => Problem.fromAPI(p));
        }

        return response;
    }

    /**
     * Get single problem
     */
    async getProblem(id) {
        const response = await this.get('/problem.php', { id });

        if (response.success && response.data) {
            response.data = Problem.fromAPI(response.data);
        }

        return response;
    }

    /**
     * Get random problem
     */
    async getRandomProblem(difficulty = null) {
        const params = { random: 1 };
        if (difficulty) {
            params.difficulty = difficulty;
        }

        const response = await this.get('/problem.php', params);

        if (response.success && response.data) {
            response.data = Problem.fromAPI(response.data);
        }

        return response;
    }

    /**
     * Submit answer
     */
    async submitAnswer(problemId, answer, studentId = null, timeSpent = null) {
        return this.post('/submit.php', {
            problem_id: problemId,
            answer: answer,
            student_id: studentId,
            time_spent: timeSpent
        });
    }

    /**
     * Get student progress
     */
    async getProgress(studentId) {
        return this.get('/progress.php', { student_id: studentId });
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);

        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Request queue management
     */
    async waitForSlot() {
        while (this.activeRequests >= this.maxConcurrentRequests) {
            await this.delay(100);
        }
    }

    processQueue() {
        if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
            const nextRequest = this.requestQueue.shift();
            if (nextRequest) {
                nextRequest();
            }
        }
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up
     */
    async stop() {
        this.clearCache();
        this.requestQueue = [];
        console.log('[APIService] Stopped');
    }
}
