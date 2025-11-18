/**
 * Statistics Service
 * Provides methods for calculating mean, median, and mode
 */

class StatsService {
  /**
   * Calculate mean (average)
   * @param {number[]} values - Array of numeric values
   * @returns {number} Mean value
   */
  calculateMean(values) {
    if (!values || values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate median (middle value)
   * @param {number[]} values - Array of numeric values
   * @returns {number} Median value
   */
  calculateMedian(values) {
    if (!values || values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      // Even number of values: average of two middle values
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      // Odd number of values: middle value
      return sorted[mid];
    }
  }

  /**
   * Calculate mode (most frequent value)
   * @param {number[]} values - Array of numeric values
   * @returns {number} Mode value
   */
  calculateMode(values) {
    if (!values || values.length === 0) return 0;

    // Count frequency of each value
    const frequency = {};
    let maxFreq = 0;
    let modes = [];

    values.forEach(value => {
      // Round to 1 decimal place to group similar scores
      const rounded = Math.round(value * 10) / 10;
      frequency[rounded] = (frequency[rounded] || 0) + 1;

      if (frequency[rounded] > maxFreq) {
        maxFreq = frequency[rounded];
        modes = [rounded];
      } else if (frequency[rounded] === maxFreq && !modes.includes(rounded)) {
        modes.push(rounded);
      }
    });

    // If all values appear once, return median
    if (maxFreq === 1) {
      return this.calculateMedian(values);
    }

    // If multiple modes, return the highest
    return Math.max(...modes);
  }

  /**
   * Normalize value to 0-100 scale for light brightness
   * @param {number} value - Value to normalize
   * @param {number} min - Minimum value in dataset
   * @param {number} max - Maximum value in dataset
   * @returns {number} Normalized value (0-100)
   */
  normalizeToScale(value, min, max) {
    if (max === min) return 50; // Default to mid-brightness

    const normalized = ((value - min) / (max - min)) * 100;
    return Math.round(normalized * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate all statistics for a dataset
   * @param {number[]} values - Array of numeric values
   * @returns {object} Statistics object
   */
  calculateAll(values) {
    if (!values || values.length === 0) {
      return {
        mean: 0,
        median: 0,
        mode: 0,
        count: 0,
        min: 0,
        max: 0,
        normalized: {
          mean: 50,
          median: 50,
          mode: 50
        }
      };
    }

    const mean = this.calculateMean(values);
    const median = this.calculateMedian(values);
    const mode = this.calculateMode(values);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      mean: Math.round(mean * 10) / 10,
      median: Math.round(median * 10) / 10,
      mode: Math.round(mode * 10) / 10,
      count: values.length,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      normalized: {
        mean: this.normalizeToScale(mean, min, max),
        median: this.normalizeToScale(median, min, max),
        mode: this.normalizeToScale(mode, min, max)
      }
    };
  }
}

module.exports = new StatsService();
