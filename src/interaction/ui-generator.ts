/**
 * Adaptive UI Generator
 *
 * Dynamically generates personalized user interfaces
 * based on learning style, preferences, and emotional state.
 */

import { LearnerProfile, EmotionalState, CognitiveStyle } from '../types/index.js';

export interface UILayout {
  id: string;
  type: 'visual' | 'text-heavy' | 'interactive' | 'minimal' | 'game-like';
  components: UIComponent[];
  colorScheme: ColorScheme;
  typography: Typography;
  spacing: 'compact' | 'normal' | 'spacious';
  animations: 'none' | 'subtle' | 'moderate' | 'engaging';
}

export interface UIComponent {
  id: string;
  type: 'text' | 'image' | 'video' | 'interactive' | 'quiz' | 'diagram' | 'game';
  position: { x: number; y: number };
  size: { width: number; height: number };
  priority: number;
  content: any;
  style: Record<string, any>;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  mood: 'calm' | 'energetic' | 'focused' | 'playful';
}

export interface Typography {
  bodySize: number;
  headingSize: number;
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
}

export class AdaptiveUIGenerator {
  private layouts: Map<string, UILayout>;
  private componentLibrary: Map<string, UIComponentTemplate>;

  constructor() {
    this.layouts = new Map();
    this.componentLibrary = new Map();
    this.initializeComponentLibrary();
  }

  /**
   * Initializes UI component templates
   */
  private initializeComponentLibrary(): void {
    this.componentLibrary.set('text-explanation', {
      type: 'text',
      defaultSize: { width: 80, height: 30 },
      adaptations: {
        visual: { fontSize: 16, images: true },
        auditory: { fontSize: 18, audioSupport: true },
        kinesthetic: { fontSize: 16, interactive: true }
      }
    });

    this.componentLibrary.set('interactive-demo', {
      type: 'interactive',
      defaultSize: { width: 60, height: 50 },
      adaptations: {
        visual: { colorful: true, animations: true },
        auditory: { soundEffects: true },
        kinesthetic: { dragDrop: true, clickable: true }
      }
    });

    this.componentLibrary.set('quiz-question', {
      type: 'quiz',
      defaultSize: { width: 70, height: 40 },
      adaptations: {
        visual: { icons: true, colors: true },
        auditory: { readAloud: true },
        kinesthetic: { buttons: 'large', haptic: true }
      }
    });

    this.componentLibrary.set('concept-diagram', {
      type: 'diagram',
      defaultSize: { width: 80, height: 60 },
      adaptations: {
        visual: { detailed: true, colorCoded: true },
        auditory: { labels: true, descriptions: true },
        kinesthetic: { interactive: true, zoomable: true }
      }
    });
  }

  /**
   * Generates adaptive UI based on learner profile
   */
  generateLayout(profile: LearnerProfile, content: any[]): UILayout {
    console.log('🎨 Generating adaptive UI layout...');

    // Determine layout type based on learning style
    const layoutType = this.determineLayoutType(profile.cognitiveStyle);

    // Select color scheme based on emotional state
    const colorScheme = this.selectColorScheme(profile.emotionalState);

    // Generate typography
    const typography = this.generateTypography(profile.cognitiveStyle);

    // Determine spacing
    const spacing = this.determineSpacing(profile.preferences);

    // Determine animation level
    const animations = this.determineAnimations(profile.emotionalState, profile.cognitiveStyle);

    // Generate components
    const components = this.generateComponents(content, profile);

    const layout: UILayout = {
      id: `layout_${Date.now()}`,
      type: layoutType,
      components,
      colorScheme,
      typography,
      spacing,
      animations
    };

    this.layouts.set(layout.id, layout);

    console.log(`✨ UI layout generated: ${layoutType} with ${components.length} components`);

    return layout;
  }

  /**
   * Determines best layout type for cognitive style
   */
  private determineLayoutType(style: CognitiveStyle): UILayout['type'] {
    // Visual learners
    if (style.visualPreference > 0.7) {
      return 'visual';
    }

    // Kinesthetic learners
    if (style.kinestheticPreference > 0.7) {
      return style.analyticalVsIntuitive > 0 ? 'game-like' : 'interactive';
    }

    // Analytical learners
    if (style.analyticalVsIntuitive < -0.5) {
      return 'text-heavy';
    }

    // High abstraction level
    if (style.abstractionLevel > 0.7) {
      return 'minimal';
    }

    return 'interactive';
  }

  /**
   * Selects appropriate color scheme
   */
  private selectColorScheme(emotion: EmotionalState): ColorScheme {
    // High anxiety - calm colors
    if (emotion.anxiety > 0.7) {
      return {
        primary: '#6B9AC4',
        secondary: '#97C4B8',
        background: '#F5F7FA',
        text: '#2C3E50',
        accent: '#88B7D5',
        mood: 'calm'
      };
    }

    // Low engagement - energetic colors
    if (emotion.engagement < 0.4) {
      return {
        primary: '#FF6B6B',
        secondary: '#FFA500',
        background: '#FFF9E6',
        text: '#333333',
        accent: '#FFD700',
        mood: 'energetic'
      };
    }

    // High confidence - focused colors
    if (emotion.confidence > 0.7) {
      return {
        primary: '#4A90E2',
        secondary: '#7B68EE',
        background: '#FFFFFF',
        text: '#1A1A1A',
        accent: '#50C878',
        mood: 'focused'
      };
    }

    // Default - playful but balanced
    return {
      primary: '#5C6AC4',
      secondary: '#47C1BF',
      background: '#F9FAFB',
      text: '#212B36',
      accent: '#F49342',
      mood: 'playful'
    };
  }

  /**
   * Generates typography settings
   */
  private generateTypography(style: CognitiveStyle): Typography {
    // Base sizes
    let bodySize = 16;
    let headingSize = 24;

    // Adjust for processing speed
    if (style.processingSpeed < 0.5) {
      bodySize = 18;
      headingSize = 28;
    }

    // Adjust for abstraction level
    if (style.abstractionLevel > 0.8) {
      bodySize = 14;
      headingSize = 20;
    }

    return {
      bodySize,
      headingSize,
      fontFamily:
        style.analyticalVsIntuitive < 0
          ? "'Roboto Mono', monospace"
          : "'Inter', sans-serif",
      lineHeight: style.sequentialVsRandom < 0 ? 1.6 : 1.8,
      letterSpacing: 0.5
    };
  }

  /**
   * Determines spacing preference
   */
  private determineSpacing(preferences: any): 'compact' | 'normal' | 'spacious' {
    if (preferences.sessionLength < 15) {
      return 'compact'; // Quick sessions need density
    } else if (preferences.sessionLength > 45) {
      return 'spacious'; // Long sessions need breathing room
    }

    return 'normal';
  }

  /**
   * Determines animation level
   */
  private determineAnimations(
    emotion: EmotionalState,
    style: CognitiveStyle
  ): UILayout['animations'] {
    // High anxiety - minimal animations
    if (emotion.anxiety > 0.7) {
      return 'none';
    }

    // Kinesthetic learners - engaging animations
    if (style.kinestheticPreference > 0.7) {
      return 'engaging';
    }

    // Visual learners - moderate animations
    if (style.visualPreference > 0.6) {
      return 'moderate';
    }

    return 'subtle';
  }

  /**
   * Generates UI components from content
   */
  private generateComponents(content: any[], profile: LearnerProfile): UIComponent[] {
    const components: UIComponent[] = [];
    let yOffset = 0;

    content.forEach((item, index) => {
      const component = this.createComponent(item, profile, yOffset, index);

      if (component) {
        components.push(component);
        yOffset += component.size.height + 20; // Add gap
      }
    });

    return components;
  }

  /**
   * Creates a single UI component
   */
  private createComponent(
    content: any,
    profile: LearnerProfile,
    yOffset: number,
    priority: number
  ): UIComponent | null {
    const type = this.mapContentToComponentType(content);
    const template = this.componentLibrary.get(type);

    if (!template) return null;

    // Adapt based on learning style
    const adaptations = this.getAdaptations(template, profile.cognitiveStyle);

    return {
      id: `component_${Date.now()}_${priority}`,
      type: template.type,
      position: { x: 10, y: yOffset },
      size: template.defaultSize,
      priority,
      content,
      style: {
        ...adaptations,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }
    };
  }

  /**
   * Maps content type to component type
   */
  private mapContentToComponentType(content: any): string {
    if (content.type === 'text') return 'text-explanation';
    if (content.type === 'interactive') return 'interactive-demo';
    if (content.type === 'quiz') return 'quiz-question';
    if (content.type === 'diagram') return 'concept-diagram';

    return 'text-explanation';
  }

  /**
   * Gets adaptations for cognitive style
   */
  private getAdaptations(
    template: UIComponentTemplate,
    style: CognitiveStyle
  ): Record<string, any> {
    // Determine dominant modality
    const modalities = [
      { name: 'visual', value: style.visualPreference },
      { name: 'auditory', value: style.auditoryPreference },
      { name: 'kinesthetic', value: style.kinestheticPreference }
    ];

    modalities.sort((a, b) => b.value - a.value);
    const dominant = modalities[0].name as keyof UIComponentTemplate['adaptations'];

    return template.adaptations[dominant] || {};
  }

  /**
   * Updates layout based on feedback
   */
  updateLayout(layoutId: string, feedback: LayoutFeedback): UILayout | null {
    const layout = this.layouts.get(layoutId);

    if (!layout) return null;

    // Adjust based on feedback
    if (feedback.tooComplex) {
      layout.components = layout.components.slice(0, Math.ceil(layout.components.length * 0.7));
      layout.spacing = 'spacious';
    }

    if (feedback.tooSimple) {
      layout.animations =
        layout.animations === 'none' ? 'subtle' : layout.animations === 'subtle' ? 'moderate' : 'engaging';
    }

    if (feedback.hardToRead) {
      layout.typography.bodySize += 2;
      layout.typography.lineHeight += 0.2;
      layout.spacing = layout.spacing === 'compact' ? 'normal' : 'spacious';
    }

    if (feedback.colorsDistracting) {
      layout.colorScheme.mood = 'calm';
      layout.animations = layout.animations === 'engaging' ? 'moderate' : 'subtle';
    }

    console.log(`🔄 Layout updated based on feedback`);

    return layout;
  }

  /**
   * Exports layout as HTML/CSS
   */
  exportAsHTML(layoutId: string): string {
    const layout = this.layouts.get(layoutId);

    if (!layout) return '';

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Teacher - Adaptive Learning Interface</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: ${layout.typography.fontFamily};
      font-size: ${layout.typography.bodySize}px;
      line-height: ${layout.typography.lineHeight};
      background-color: ${layout.colorScheme.background};
      color: ${layout.colorScheme.text};
      padding: ${layout.spacing === 'compact' ? '10px' : layout.spacing === 'spacious' ? '40px' : '20px'};
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .component {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ${layout.animations !== 'none' ? 'transition: all 0.3s ease;' : ''}
    }

    ${layout.animations === 'engaging' ? '.component:hover { transform: translateY(-4px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }' : ''}

    h1, h2 {
      color: ${layout.colorScheme.primary};
      font-size: ${layout.typography.headingSize}px;
      margin-bottom: 16px;
    }

    .accent {
      color: ${layout.colorScheme.accent};
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌱 AI Teacher Living System</h1>
    ${layout.components
      .map(
        component => `
      <div class="component" id="${component.id}">
        ${this.renderComponent(component)}
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Renders a component to HTML
   */
  private renderComponent(component: UIComponent): string {
    // Simplified rendering
    return `<div>${JSON.stringify(component.content, null, 2)}</div>`;
  }
}

interface UIComponentTemplate {
  type: UIComponent['type'];
  defaultSize: { width: number; height: number };
  adaptations: {
    visual: Record<string, any>;
    auditory: Record<string, any>;
    kinesthetic: Record<string, any>;
  };
}

interface LayoutFeedback {
  tooComplex?: boolean;
  tooSimple?: boolean;
  hardToRead?: boolean;
  colorsDistracting?: boolean;
  perfectAsIs?: boolean;
}
