/**
 * IndexedDB Storage Manager
 * Manages all local data storage for the standalone app
 */

class StorageManager {
    constructor() {
        this.dbName = 'ColorUnionDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
                    sessionStore.createIndex('userId', 'userId', { unique: false });
                    sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
                    sessionStore.createIndex('isCompleted', 'isCompleted', { unique: false });
                }

                // Problems store
                if (!db.objectStoreNames.contains('problems')) {
                    const problemStore = db.createObjectStore('problems', { keyPath: 'id', autoIncrement: true });
                    problemStore.createIndex('sessionId', 'sessionId', { unique: false });
                    problemStore.createIndex('problemNumber', 'problemNumber', { unique: false });
                }

                // Attempts store
                if (!db.objectStoreNames.contains('attempts')) {
                    const attemptStore = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
                    attemptStore.createIndex('problemId', 'problemId', { unique: false });
                    attemptStore.createIndex('userId', 'userId', { unique: false });
                    attemptStore.createIndex('isCorrect', 'isCorrect', { unique: false });
                    attemptStore.createIndex('attemptedAt', 'attemptedAt', { unique: false });
                }

                // User progress store
                if (!db.objectStoreNames.contains('userProgress')) {
                    const progressStore = db.createObjectStore('userProgress', { keyPath: 'userId' });
                    progressStore.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
                }

                // Recommendations store
                if (!db.objectStoreNames.contains('recommendations')) {
                    const recStore = db.createObjectStore('recommendations', { keyPath: 'id', autoIncrement: true });
                    recStore.createIndex('userId', 'userId', { unique: false });
                    recStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'userId' });
                }

                console.log('Database schema created');
            };
        });
    }

    /**
     * Generic method to add data to a store
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result); // Returns the key of the added item
            };

            request.onerror = () => {
                reject(new Error(`Failed to add data to ${storeName}`));
            };
        });
    }

    /**
     * Generic method to get data by key
     */
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to get data from ${storeName}`));
            };
        });
    }

    /**
     * Generic method to get data by index
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to get data from ${storeName} by index ${indexName}`));
            };
        });
    }

    /**
     * Get all items from a store
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to get all data from ${storeName}`));
            };
        });
    }

    /**
     * Get all items matching an index value
     */
    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to get data from ${storeName} by index ${indexName}`));
            };
        });
    }

    /**
     * Update data in a store
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to update data in ${storeName}`));
            };
        });
    }

    /**
     * Delete data from a store
     */
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to delete data from ${storeName}`));
            };
        });
    }

    /**
     * Clear all data from a store
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to clear ${storeName}`));
            };
        });
    }

    /**
     * Count items in a store
     */
    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Failed to count items in ${storeName}`));
            };
        });
    }

    /**
     * Export all data (for backup)
     */
    async exportData() {
        const data = {};
        const storeNames = ['users', 'sessions', 'problems', 'attempts', 'userProgress', 'recommendations', 'settings'];

        for (const storeName of storeNames) {
            data[storeName] = await this.getAll(storeName);
        }

        return data;
    }

    /**
     * Import data (for restore)
     */
    async importData(data) {
        for (const [storeName, items] of Object.entries(data)) {
            await this.clear(storeName);

            for (const item of items) {
                await this.add(storeName, item);
            }
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        const stats = {};
        const storeNames = ['users', 'sessions', 'problems', 'attempts', 'userProgress', 'recommendations', 'settings'];

        for (const storeName of storeNames) {
            stats[storeName] = await this.count(storeName);
        }

        return stats;
    }
}

// Create singleton instance
const storageManager = new StorageManager();

// Initialize on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await storageManager.init();
            console.log('Storage Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Storage Manager:', error);
        }
    });
}
