/**
 * Storage Module
 * Handles LocalStorage operations for persisting game progress
 */

const STORAGE_KEY = 'exponentialBurst';
const VERSION = '1.0.0';

class Storage {
    constructor() {
        this.data = this.load();
    }

    /**
     * Load data from LocalStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Validate version
                if (data.version === VERSION) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }

        // Return default data
        return this.getDefaultData();
    }

    /**
     * Get default data structure
     */
    getDefaultData() {
        return {
            version: VERSION,
            player: {
                score: 0,
                level: 1,
                totalBursts: 0,
                streak: 0,
                bestStreak: 0,
                correctAnswers: 0,
                totalAnswers: 0,
                accuracy: 0
            },
            settings: {
                difficulty: 2,
                soundEnabled: true,
                particleDensity: 'medium'
            },
            statistics: {
                sessionCount: 0,
                totalPlayTime: 0,
                lastPlayed: null,
                questionsAnswered: 0,
                averageTime: 0
            },
            leaderboard: [],
            achievements: []
        };
    }

    /**
     * Save data to LocalStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    /**
     * Get player data
     */
    getPlayer() {
        return this.data.player;
    }

    /**
     * Update player data
     */
    updatePlayer(updates) {
        this.data.player = { ...this.data.player, ...updates };
        this.save();
    }

    /**
     * Increment player stat
     */
    incrementStat(stat, amount = 1) {
        if (this.data.player[stat] !== undefined) {
            this.data.player[stat] += amount;
            this.save();
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.data.settings;
    }

    /**
     * Update settings
     */
    updateSettings(updates) {
        this.data.settings = { ...this.data.settings, ...updates };
        this.save();
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return this.data.statistics;
    }

    /**
     * Update statistics
     */
    updateStatistics(updates) {
        this.data.statistics = { ...this.data.statistics, ...updates };
        this.save();
    }

    /**
     * Add leaderboard entry
     */
    addLeaderboardEntry(score) {
        this.data.leaderboard.push({
            score,
            date: new Date().toISOString(),
            level: this.data.player.level
        });

        // Sort by score descending
        this.data.leaderboard.sort((a, b) => b.score - a.score);

        // Keep only top 10
        this.data.leaderboard = this.data.leaderboard.slice(0, 10);

        this.save();
    }

    /**
     * Get leaderboard
     */
    getLeaderboard() {
        return this.data.leaderboard;
    }

    /**
     * Record game session
     */
    recordSession(duration) {
        this.data.statistics.sessionCount++;
        this.data.statistics.totalPlayTime += duration;
        this.data.statistics.lastPlayed = new Date().toISOString();
        this.save();
    }

    /**
     * Reset all data
     */
    reset() {
        this.data = this.getDefaultData();
        this.save();
    }

    /**
     * Reset only player progress (keep settings)
     */
    resetProgress() {
        const settings = this.data.settings;
        this.data = this.getDefaultData();
        this.data.settings = settings;
        this.save();
    }

    /**
     * Export data as JSON
     */
    export() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Import data from JSON
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.version === VERSION) {
                this.data = data;
                this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Calculate accuracy
     */
    calculateAccuracy() {
        const { correctAnswers, totalAnswers } = this.data.player;
        if (totalAnswers === 0) return 0;
        return Math.round((correctAnswers / totalAnswers) * 100);
    }

    /**
     * Update accuracy
     */
    updateAccuracy() {
        this.data.player.accuracy = this.calculateAccuracy();
        this.save();
    }
}

// Create and export singleton instance
const storage = new Storage();
export default storage;
