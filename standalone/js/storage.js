/**
 * LocalStorage Manager for Shape Guide Lines Generator
 * Standalone PWA - No server required
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'shapeguide_data';
        this.SETTINGS_KEY = 'shapeguide_settings';
        this.VERSION = '1.0.0';
    }

    /**
     * Initialize storage with default data
     */
    init() {
        if (!this.getData()) {
            this.setData({
                shapes: [],
                version: this.VERSION,
                createdAt: new Date().toISOString()
            });
        }

        if (!this.getSettings()) {
            this.setSettings({
                showParallel: true,
                showPerpendicular: true,
                showLabels: true,
                parallelColor: '#4ECDC4',
                perpendicularColor: '#FF6B6B',
                shapeColor: '#2c3e50',
                vertexColor: '#667eea',
                lineThickness: 2,
                autoSave: true
            });
        }
    }

    /**
     * Get all data from storage
     */
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    /**
     * Set data to storage
     */
    setData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    }

    /**
     * Get user settings
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error reading settings:', error);
            return null;
        }
    }

    /**
     * Update user settings
     */
    setSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error writing settings:', error);
            return false;
        }
    }

    /**
     * Update specific setting
     */
    updateSetting(key, value) {
        const settings = this.getSettings();
        if (settings) {
            settings[key] = value;
            return this.setSettings(settings);
        }
        return false;
    }

    /**
     * Get all shapes
     */
    getAllShapes() {
        const data = this.getData();
        return data ? data.shapes : [];
    }

    /**
     * Get shape by ID
     */
    getShape(id) {
        const shapes = this.getAllShapes();
        return shapes.find(shape => shape.id === id);
    }

    /**
     * Save new shape
     */
    saveShape(shapeData) {
        const data = this.getData();
        if (!data) return null;

        const newShape = {
            id: this.generateId(),
            name: shapeData.name || `도형 ${data.shapes.length + 1}`,
            type: shapeData.type,
            vertices: shapeData.vertices,
            guideLines: shapeData.guideLines,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.shapes.push(newShape);
        this.setData(data);

        return newShape;
    }

    /**
     * Update existing shape
     */
    updateShape(id, updates) {
        const data = this.getData();
        if (!data) return false;

        const index = data.shapes.findIndex(shape => shape.id === id);
        if (index === -1) return false;

        data.shapes[index] = {
            ...data.shapes[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.setData(data);
        return true;
    }

    /**
     * Delete shape
     */
    deleteShape(id) {
        const data = this.getData();
        if (!data) return false;

        const initialLength = data.shapes.length;
        data.shapes = data.shapes.filter(shape => shape.id !== id);

        if (data.shapes.length < initialLength) {
            this.setData(data);
            return true;
        }

        return false;
    }

    /**
     * Clear all shapes
     */
    clearAllShapes() {
        const data = this.getData();
        if (data) {
            data.shapes = [];
            return this.setData(data);
        }
        return false;
    }

    /**
     * Export all data as JSON
     */
    exportData() {
        const data = this.getData();
        const settings = this.getSettings();

        return {
            ...data,
            settings: settings,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import data from JSON
     */
    importData(jsonData) {
        try {
            // Validate data structure
            if (!jsonData.shapes || !Array.isArray(jsonData.shapes)) {
                throw new Error('Invalid data format');
            }

            // Merge with existing data
            const currentData = this.getData();
            const importedShapes = jsonData.shapes.map(shape => ({
                ...shape,
                id: this.generateId(), // Generate new IDs to avoid conflicts
                importedAt: new Date().toISOString()
            }));

            currentData.shapes.push(...importedShapes);
            this.setData(currentData);

            // Import settings if available
            if (jsonData.settings) {
                this.setSettings(jsonData.settings);
            }

            return {
                success: true,
                imported: importedShapes.length
            };
        } catch (error) {
            console.error('Error importing data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get storage statistics
     */
    getStats() {
        const data = this.getData();
        if (!data) return null;

        const storageUsed = new Blob([JSON.stringify(data)]).size;
        const storageLimit = 5 * 1024 * 1024; // 5MB typical limit

        return {
            totalShapes: data.shapes.length,
            storageUsed: storageUsed,
            storageLimit: storageLimit,
            storagePercent: ((storageUsed / storageLimit) * 100).toFixed(2),
            oldestShape: data.shapes[0]?.createdAt,
            newestShape: data.shapes[data.shapes.length - 1]?.createdAt
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if storage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage quota (if available)
     */
    async getQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
                };
            } catch (error) {
                console.error('Error getting storage quota:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Search shapes by name or type
     */
    searchShapes(query) {
        const shapes = this.getAllShapes();
        const lowerQuery = query.toLowerCase();

        return shapes.filter(shape =>
            shape.name.toLowerCase().includes(lowerQuery) ||
            shape.type.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Sort shapes
     */
    sortShapes(sortBy = 'date', order = 'desc') {
        const shapes = this.getAllShapes();

        return shapes.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'type':
                    comparison = a.type.localeCompare(b.type);
                    break;
                case 'date':
                default:
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
            }

            return order === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Backup data to download
     */
    backup() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shapeguide_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Reset all data (caution!)
     */
    reset() {
        if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.SETTINGS_KEY);
            this.init();
            return true;
        }
        return false;
    }
}

// Create global instance
const storage = new StorageManager();
storage.init();

// Log storage availability
console.log('💾 Storage available:', storage.isAvailable());
if (storage.isAvailable()) {
    storage.getQuota().then(quota => {
        if (quota) {
            console.log(`💾 Storage usage: ${quota.percent}% (${(quota.usage / 1024 / 1024).toFixed(2)} MB / ${(quota.quota / 1024 / 1024).toFixed(2)} MB)`);
        }
    });
}
