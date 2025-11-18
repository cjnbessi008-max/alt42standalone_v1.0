/**
 * Local Storage Manager
 * Manages user progress and settings in browser localStorage
 */

class StorageManager {
  constructor() {
    this.STORAGE_PREFIX = 'mathFormula_';
    this.KEYS = {
      CARDS: this.STORAGE_PREFIX + 'cards',
      SETTINGS: this.STORAGE_PREFIX + 'settings',
      STATISTICS: this.STORAGE_PREFIX + 'statistics',
      FAVORITES: this.STORAGE_PREFIX + 'favorites'
    };

    this.initializeStorage();
  }

  /**
   * Initialize storage with default values if empty
   */
  initializeStorage() {
    if (!this.getCards()) {
      this.saveCards({});
    }

    if (!this.getSettings()) {
      this.saveSettings({
        animationSpeed: 3000, // milliseconds
        autoPlay: true,
        soundEnabled: false,
        theme: 'light',
        dailyGoal: 10
      });
    }

    if (!this.getStatistics()) {
      this.saveStatistics({
        totalStudyTime: 0,
        totalFormulasLearned: 0,
        streak: 0,
        lastStudyDate: null,
        studyHistory: []
      });
    }

    if (!this.getFavorites()) {
      this.saveFavorites([]);
    }
  }

  /**
   * Generic get method
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Generic set method
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      return false;
    }
  }

  /**
   * Get all spaced repetition cards
   */
  getCards() {
    return this.get(this.KEYS.CARDS);
  }

  /**
   * Save all cards
   */
  saveCards(cards) {
    return this.set(this.KEYS.CARDS, cards);
  }

  /**
   * Get a specific card by ID
   */
  getCard(formulaId) {
    const cards = this.getCards() || {};
    return cards[formulaId] || null;
  }

  /**
   * Save a specific card
   */
  saveCard(card) {
    const cards = this.getCards() || {};
    cards[card.id] = card;
    return this.saveCards(cards);
  }

  /**
   * Delete a card
   */
  deleteCard(formulaId) {
    const cards = this.getCards() || {};
    delete cards[formulaId];
    return this.saveCards(cards);
  }

  /**
   * Get user settings
   */
  getSettings() {
    return this.get(this.KEYS.SETTINGS);
  }

  /**
   * Save user settings
   */
  saveSettings(settings) {
    return this.set(this.KEYS.SETTINGS, settings);
  }

  /**
   * Update a specific setting
   */
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return this.get(this.KEYS.STATISTICS);
  }

  /**
   * Save statistics
   */
  saveStatistics(stats) {
    return this.set(this.KEYS.STATISTICS, stats);
  }

  /**
   * Update study session
   */
  updateStudySession(formulasStudied, timeSpent) {
    const stats = this.getStatistics();
    const today = new Date().toISOString().split('T')[0];

    // Update total time and formulas
    stats.totalStudyTime += timeSpent;
    stats.totalFormulasLearned += formulasStudied;

    // Update streak
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (stats.lastStudyDate === yesterdayStr) {
        stats.streak++;
      } else if (stats.lastStudyDate !== today) {
        stats.streak = 1;
      }

      stats.lastStudyDate = today;
    }

    // Add to study history
    const existingEntry = stats.studyHistory.find(entry => entry.date === today);
    if (existingEntry) {
      existingEntry.formulasStudied += formulasStudied;
      existingEntry.timeSpent += timeSpent;
    } else {
      stats.studyHistory.push({
        date: today,
        formulasStudied,
        timeSpent
      });

      // Keep only last 30 days
      if (stats.studyHistory.length > 30) {
        stats.studyHistory = stats.studyHistory.slice(-30);
      }
    }

    return this.saveStatistics(stats);
  }

  /**
   * Get favorites list
   */
  getFavorites() {
    return this.get(this.KEYS.FAVORITES);
  }

  /**
   * Save favorites list
   */
  saveFavorites(favorites) {
    return this.set(this.KEYS.FAVORITES, favorites);
  }

  /**
   * Add formula to favorites
   */
  addFavorite(formulaId) {
    const favorites = this.getFavorites() || [];
    if (!favorites.includes(formulaId)) {
      favorites.push(formulaId);
      return this.saveFavorites(favorites);
    }
    return true;
  }

  /**
   * Remove formula from favorites
   */
  removeFavorite(formulaId) {
    const favorites = this.getFavorites() || [];
    const index = favorites.indexOf(formulaId);
    if (index > -1) {
      favorites.splice(index, 1);
      return this.saveFavorites(favorites);
    }
    return true;
  }

  /**
   * Check if formula is favorite
   */
  isFavorite(formulaId) {
    const favorites = this.getFavorites() || [];
    return favorites.includes(formulaId);
  }

  /**
   * Clear all data (use with caution!)
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeStorage();
  }

  /**
   * Export all data as JSON
   */
  exportData() {
    return {
      cards: this.getCards(),
      settings: this.getSettings(),
      statistics: this.getStatistics(),
      favorites: this.getFavorites(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import data from JSON
   */
  importData(data) {
    try {
      if (data.cards) this.saveCards(data.cards);
      if (data.settings) this.saveSettings(data.settings);
      if (data.statistics) this.saveStatistics(data.statistics);
      if (data.favorites) this.saveFavorites(data.favorites);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo() {
    let totalSize = 0;
    const sizes = {};

    Object.entries(this.KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      const size = item ? new Blob([item]).size : 0;
      sizes[name] = size;
      totalSize += size;
    });

    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      sizes,
      limit: 5 * 1024 * 1024, // 5MB typical limit
      limitMB: '5'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
