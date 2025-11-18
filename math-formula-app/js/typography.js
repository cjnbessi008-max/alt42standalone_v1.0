/**
 * Typography Transformation Engine
 * Provides infinite variations of typography for math formulas
 */

class TypographyEngine {
  constructor() {
    // Font families to cycle through
    this.fonts = [
      'Arial, sans-serif',
      'Times New Roman, serif',
      'Courier New, monospace',
      'Georgia, serif',
      'Verdana, sans-serif',
      'Trebuchet MS, sans-serif',
      'Palatino, serif',
      'Garamond, serif',
      'Monaco, monospace',
      'Helvetica, sans-serif'
    ];

    // Color palettes (high contrast for better visibility)
    this.colors = [
      '#000000', // Black
      '#2c3e50', // Dark Blue
      '#c0392b', // Dark Red
      '#27ae60', // Green
      '#8e44ad', // Purple
      '#d35400', // Orange
      '#16a085', // Teal
      '#2980b9', // Blue
      '#c0392b', // Crimson
      '#7f8c8d'  // Gray
    ];

    // Background colors (light, high contrast with text)
    this.backgrounds = [
      '#ffffff', // White
      '#ecf0f1', // Light Gray
      '#fef5e7', // Light Yellow
      '#ebf5fb', // Light Blue
      '#f4ecf7', // Light Purple
      '#eafaf1', // Light Green
      '#fef9e7', // Cream
      '#fdecea', // Light Pink
      '#e8f8f5', // Mint
      '#fdfefe'  // Off White
    ];

    // Font sizes (in rem for accessibility)
    this.sizes = [1.5, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0];

    // Font weights
    this.weights = [300, 400, 500, 600, 700];

    // Text styles
    this.styles = {
      shadow: [
        'none',
        '2px 2px 4px rgba(0,0,0,0.3)',
        '3px 3px 6px rgba(0,0,0,0.2)',
        '1px 1px 2px rgba(0,0,0,0.5)',
        '0 0 10px rgba(0,0,0,0.2)'
      ],
      transform: [
        'none',
        'scale(1.05)',
        'scale(0.95)',
        'scaleY(1.1)',
        'scaleX(1.1)'
      ],
      letterSpacing: ['normal', '0.05em', '0.1em', '-0.02em'],
      lineHeight: [1.2, 1.4, 1.6, 1.8]
    };

    this.currentVariation = 0;
    this.animationInterval = null;
  }

  /**
   * Generate a random typography variation
   */
  getRandomVariation() {
    const fontIndex = Math.floor(Math.random() * this.fonts.length);
    const colorIndex = Math.floor(Math.random() * this.colors.length);
    const bgIndex = Math.floor(Math.random() * this.backgrounds.length);
    const sizeIndex = Math.floor(Math.random() * this.sizes.length);
    const weightIndex = Math.floor(Math.random() * this.weights.length);
    const shadowIndex = Math.floor(Math.random() * this.styles.shadow.length);
    const transformIndex = Math.floor(Math.random() * this.styles.transform.length);
    const letterSpacingIndex = Math.floor(Math.random() * this.styles.letterSpacing.length);
    const lineHeightIndex = Math.floor(Math.random() * this.styles.lineHeight.length);

    return {
      fontFamily: this.fonts[fontIndex],
      color: this.colors[colorIndex],
      backgroundColor: this.backgrounds[bgIndex],
      fontSize: this.sizes[sizeIndex] + 'rem',
      fontWeight: this.weights[weightIndex],
      textShadow: this.styles.shadow[shadowIndex],
      transform: this.styles.transform[transformIndex],
      letterSpacing: this.styles.letterSpacing[letterSpacingIndex],
      lineHeight: this.styles.lineHeight[lineHeightIndex]
    };
  }

  /**
   * Apply typography styles to an element
   */
  applyVariation(element, variation) {
    if (!element) return;

    element.style.fontFamily = variation.fontFamily;
    element.style.color = variation.color;
    element.style.backgroundColor = variation.backgroundColor;
    element.style.fontSize = variation.fontSize;
    element.style.fontWeight = variation.fontWeight;
    element.style.textShadow = variation.textShadow;
    element.style.transform = variation.transform;
    element.style.letterSpacing = variation.letterSpacing;
    element.style.lineHeight = variation.lineHeight;
    element.style.transition = 'all 0.5s ease-in-out';
    element.style.padding = '20px';
    element.style.borderRadius = '8px';
  }

  /**
   * Start automatic typography animation
   */
  startAnimation(element, intervalMs = 3000) {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    const animate = () => {
      const variation = this.getRandomVariation();
      this.applyVariation(element, variation);
    };

    // Apply first variation immediately
    animate();

    // Continue animating
    this.animationInterval = setInterval(animate, intervalMs);
  }

  /**
   * Stop automatic animation
   */
  stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /**
   * Get a predefined variation by index
   */
  getVariationByIndex(index) {
    const totalVariations = this.fonts.length * this.colors.length;
    const normalizedIndex = index % totalVariations;

    const fontIndex = normalizedIndex % this.fonts.length;
    const colorIndex = Math.floor(normalizedIndex / this.fonts.length) % this.colors.length;

    return {
      fontFamily: this.fonts[fontIndex],
      color: this.colors[colorIndex],
      backgroundColor: this.backgrounds[0],
      fontSize: this.sizes[2] + 'rem', // Default size
      fontWeight: this.weights[2], // Medium weight
      textShadow: this.styles.shadow[1],
      transform: 'none',
      letterSpacing: 'normal',
      lineHeight: 1.4
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TypographyEngine;
}
