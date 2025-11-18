/**
 * ALT42 Storage Manager
 * IndexedDB-based local storage for standalone PWA
 */

class StorageManager {
  constructor() {
    this.dbName = 'alt42-education-db';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[Storage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('[Storage] Database initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('[Storage] Upgrading database schema...');
        const db = event.target.result;

        // Problems store
        if (!db.objectStoreNames.contains('problems')) {
          const problemStore = db.createObjectStore('problems', { keyPath: 'id', autoIncrement: true });
          problemStore.createIndex('type', 'type', { unique: false });
          problemStore.createIndex('difficulty', 'difficulty', { unique: false });
          problemStore.createIndex('concepts', 'concepts', { unique: false, multiEntry: true });
        }

        // Graphs store
        if (!db.objectStoreNames.contains('graphs')) {
          const graphStore = db.createObjectStore('graphs', { keyPath: 'id', autoIncrement: true });
          graphStore.createIndex('problemId', 'problemId', { unique: false });
          graphStore.createIndex('createdAt', 'createdAt', { unique: false });
          graphStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Student progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('studentId', 'studentId', { unique: false });
          progressStore.createIndex('problemId', 'problemId', { unique: false });
          progressStore.createIndex('completedAt', 'completedAt', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        console.log('[Storage] Database schema upgraded');
      };
    });
  }

  /**
   * Save problem data
   */
  async saveProblem(problemData) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['problems'], 'readwrite');
      const store = transaction.objectStore('problems');

      const problem = {
        ...problemData,
        createdAt: problemData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const request = store.add(problem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[Storage] Problem saved:', request.result);
        resolve(request.result);
      };
    });
  }

  /**
   * Get problem by ID
   */
  async getProblem(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['problems'], 'readonly');
      const store = transaction.objectStore('problems');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all problems
   */
  async getAllProblems() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['problems'], 'readonly');
      const store = transaction.objectStore('problems');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get problems by type
   */
  async getProblemsByType(type) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['problems'], 'readonly');
      const store = transaction.objectStore('problems');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Save graph state
   */
  async saveGraph(graphData) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['graphs'], 'readwrite');
      const store = transaction.objectStore('graphs');

      const graph = {
        ...graphData,
        createdAt: graphData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const request = graphData.id ? store.put(graph) : store.add(graph);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[Storage] Graph saved:', request.result);
        resolve(request.result);
      };
    });
  }

  /**
   * Get graph by ID
   */
  async getGraph(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['graphs'], 'readonly');
      const store = transaction.objectStore('graphs');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all graphs
   */
  async getAllGraphs() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['graphs'], 'readonly');
      const store = transaction.objectStore('graphs');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete graph
   */
  async deleteGraph(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['graphs'], 'readwrite');
      const store = transaction.objectStore('graphs');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[Storage] Graph deleted:', id);
        resolve();
      };
    });
  }

  /**
   * Save student progress
   */
  async saveProgress(progressData) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress'], 'readwrite');
      const store = transaction.objectStore('progress');

      const progress = {
        ...progressData,
        completedAt: progressData.completedAt || new Date().toISOString()
      };

      const request = store.add(progress);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[Storage] Progress saved:', request.result);
        resolve(request.result);
      };
    });
  }

  /**
   * Get student progress
   */
  async getProgress(studentId) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress'], 'readonly');
      const store = transaction.objectStore('progress');
      const index = store.index('studentId');
      const request = index.getAll(studentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get setting
   */
  async getSetting(key, defaultValue = null) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
    });
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(data) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const syncItem = {
        data,
        synced: false,
        createdAt: new Date().toISOString()
      };

      const request = store.add(syncItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get unsynced items
   */
  async getUnsyncedItems() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Mark as synced
   */
  async markAsSynced(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all data
   */
  async clearAll() {
    await this.ensureInitialized();

    const stores = ['problems', 'graphs', 'progress', 'settings', 'syncQueue'];

    return Promise.all(
      stores.map(storeName => {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      })
    );
  }

  /**
   * Export all data
   */
  async exportData() {
    await this.ensureInitialized();

    const data = {
      problems: await this.getAllProblems(),
      graphs: await this.getAllGraphs(),
      exportedAt: new Date().toISOString()
    };

    return data;
  }

  /**
   * Import data
   */
  async importData(data) {
    await this.ensureInitialized();

    // Clear existing data
    await this.clearAll();

    // Import problems
    if (data.problems) {
      for (const problem of data.problems) {
        await this.saveProblem(problem);
      }
    }

    // Import graphs
    if (data.graphs) {
      for (const graph of data.graphs) {
        await this.saveGraph(graph);
      }
    }

    console.log('[Storage] Data imported successfully');
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this.ensureInitialized();

    const problems = await this.getAllProblems();
    const graphs = await this.getAllGraphs();
    const unsyncedItems = await this.getUnsyncedItems();

    return {
      problemCount: problems.length,
      graphCount: graphs.length,
      unsyncedCount: unsyncedItems.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
const storageManager = new StorageManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = storageManager;
}
