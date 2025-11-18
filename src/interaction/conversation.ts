/**
 * Living Conversation Engine
 *
 * Natural language understanding and generation
 * with contextual awareness and empathy.
 */

import { EmotionalState, LearnerProfile } from '../types/index.js';

export interface Message {
  id: string;
  role: 'system' | 'teacher' | 'learner';
  content: string;
  timestamp: number;
  emotionalTone?: EmotionalState;
  intent?: MessageIntent;
  context?: any;
}

export interface MessageIntent {
  type: 'question' | 'answer' | 'explanation' | 'feedback' | 'encouragement' | 'confusion' | 'frustration' | 'achievement';
  confidence: number;
  keywords: string[];
}

export interface ConversationContext {
  threadId: string;
  topic: string;
  messages: Message[];
  learnerProfile: LearnerProfile;
  currentEmotion: EmotionalState;
  startTime: number;
  lastActivity: number;
}

export class ConversationEngine {
  private activeThreads: Map<string, ConversationContext>;
  private intentPatterns: Map<string, RegExp[]>;
  private responseTemplates: Map<string, ResponseTemplate>;

  constructor() {
    this.activeThreads = new Map();
    this.intentPatterns = new Map();
    this.responseTemplates = new Map();
    this.initializePatterns();
    this.initializeTemplates();
  }

  /**
   * Initializes intent recognition patterns
   */
  private initializePatterns(): void {
    this.intentPatterns.set('question', [
      /\?$/,
      /^(what|why|how|when|where|who)/i,
      /^(can|could|would|should|do|does|is|are)\s/i,
      /(explain|tell me|help|understand)/i
    ]);

    this.intentPatterns.set('confusion', [
      /(confused|don't understand|unclear|lost)/i,
      /(what do you mean|i don't get it)/i,
      /^(huh|what)\??$/i
    ]);

    this.intentPatterns.set('frustration', [
      /(difficult|hard|impossible|can't do|give up)/i,
      /(frustrated|annoyed|stuck)/i,
      /(this is stupid|doesn't make sense)/i
    ]);

    this.intentPatterns.set('achievement', [
      /(got it|understand now|makes sense|i see)/i,
      /(yes|correct|right|exactly)/i,
      /(thanks|thank you|helpful)/i
    ]);

    this.intentPatterns.set('answer', [
      /^(the answer is|i think|maybe|probably)/i,
      /^\d+$/,
      /^(yes|no)$/i
    ]);
  }

  /**
   * Initializes response templates
   */
  private initializeTemplates(): void {
    // Encouragement templates
    this.responseTemplates.set('encouragement-general', {
      variants: [
        "You're making great progress! Keep going.",
        "I can see you're putting in the effort. That's what matters most.",
        "Every step forward is a victory. You're doing well.",
        "Learning is a journey, and you're moving forward beautifully."
      ],
      emotionalTone: { curiosity: 0.6, confidence: 0.8, engagement: 0.9, satisfaction: 0.8, frustration: 0.1, anxiety: 0.2, timestamp: Date.now() }
    });

    this.responseTemplates.set('encouragement-after-mistake', {
      variants: [
        "Mistakes are how we learn! Let's look at this together.",
        "That's not quite right, but you're thinking in the right direction.",
        "Good try! Every attempt teaches us something new.",
        "I can see your reasoning. Let me help you adjust it slightly."
      ],
      emotionalTone: { curiosity: 0.7, confidence: 0.6, engagement: 0.8, satisfaction: 0.5, frustration: 0.2, anxiety: 0.3, timestamp: Date.now() }
    });

    this.responseTemplates.set('celebration', {
      variants: [
        "Excellent! You've got it! 🎉",
        "Perfect! That's exactly right!",
        "Yes! You understand it completely!",
        "Brilliant! You're mastering this!"
      ],
      emotionalTone: { curiosity: 0.8, confidence: 0.9, engagement: 1.0, satisfaction: 1.0, frustration: 0.0, anxiety: 0.0, timestamp: Date.now() }
    });

    this.responseTemplates.set('clarification', {
      variants: [
        "Let me explain that in a different way...",
        "I can see that wasn't clear. Here's another approach...",
        "Think of it like this...",
        "Let me break that down step by step..."
      ],
      emotionalTone: { curiosity: 0.8, confidence: 0.7, engagement: 0.8, satisfaction: 0.6, frustration: 0.2, anxiety: 0.3, timestamp: Date.now() }
    });

    this.responseTemplates.set('empathy-frustration', {
      variants: [
        "I understand this is challenging. Let's take it one step at a time.",
        "It's okay to find this difficult. That means you're pushing yourself to grow.",
        "I hear you. This is a tough concept. We'll work through it together.",
        "Frustration is part of learning. You're not alone in finding this hard."
      ],
      emotionalTone: { curiosity: 0.5, confidence: 0.6, engagement: 0.7, satisfaction: 0.4, frustration: 0.4, anxiety: 0.5, timestamp: Date.now() }
    });
  }

  /**
   * Starts a new conversation thread
   */
  startThread(topic: string, learnerProfile: LearnerProfile): string {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const context: ConversationContext = {
      threadId,
      topic,
      messages: [],
      learnerProfile,
      currentEmotion: learnerProfile.emotionalState,
      startTime: Date.now(),
      lastActivity: Date.now()
    };

    this.activeThreads.set(threadId, context);

    // Send opening message
    this.sendMessage(threadId, 'teacher', this.generateOpening(topic, learnerProfile));

    console.log(`💬 New conversation started: ${topic}`);

    return threadId;
  }

  /**
   * Generates an opening message
   */
  private generateOpening(topic: string, profile: LearnerProfile): string {
    const greetings = [
      `Hello! I'm excited to explore ${topic} with you.`,
      `Welcome! Let's dive into ${topic} together.`,
      `Hi there! Ready to learn about ${topic}?`,
      `Great to see you! Today we're exploring ${topic}.`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Personalize based on profile
    if (profile.learningHistory.length === 0) {
      return `${greeting} I'll adapt to your learning style as we go.`;
    } else {
      return `${greeting} Based on what I've learned about you, I think you'll find this fascinating.`;
    }
  }

  /**
   * Processes a message from the learner
   */
  async processMessage(threadId: string, message: string): Promise<Message> {
    const context = this.activeThreads.get(threadId);

    if (!context) {
      throw new Error(`Thread ${threadId} not found`);
    }

    // Create learner message
    const learnerMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'learner',
      content: message,
      timestamp: Date.now(),
      intent: this.detectIntent(message),
      context: { threadId }
    };

    context.messages.push(learnerMsg);

    // Analyze emotional state from message
    const detectedEmotion = this.analyzeEmotionalContent(message, context);
    context.currentEmotion = detectedEmotion;

    // Generate appropriate response
    const response = await this.generateResponse(learnerMsg, context);

    // Send response
    this.sendMessage(threadId, 'teacher', response);

    context.lastActivity = Date.now();

    return context.messages[context.messages.length - 1];
  }

  /**
   * Detects intent from message
   */
  private detectIntent(message: string): MessageIntent {
    const detected: Array<{ type: string; confidence: number }> = [];

    this.intentPatterns.forEach((patterns, type) => {
      let matches = 0;
      patterns.forEach(pattern => {
        if (pattern.test(message)) matches++;
      });

      if (matches > 0) {
        detected.push({
          type,
          confidence: Math.min(1.0, matches / patterns.length)
        });
      }
    });

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);

    // Extract keywords (simple)
    const keywords = message
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    return {
      type: (detected[0]?.type as any) || 'question',
      confidence: detected[0]?.confidence || 0.5,
      keywords
    };
  }

  /**
   * Analyzes emotional content of message
   */
  private analyzeEmotionalContent(message: string, context: ConversationContext): EmotionalState {
    const lower = message.toLowerCase();
    const emotion = { ...context.currentEmotion };

    // Positive indicators
    if (/(great|awesome|cool|yes|got it|understand)/i.test(lower)) {
      emotion.satisfaction += 0.2;
      emotion.confidence += 0.15;
      emotion.engagement += 0.1;
      emotion.frustration = Math.max(0, emotion.frustration - 0.2);
    }

    // Negative indicators
    if (/(confused|lost|don't understand|difficult|hard)/i.test(lower)) {
      emotion.frustration += 0.2;
      emotion.confidence = Math.max(0, emotion.confidence - 0.15);
      emotion.anxiety += 0.1;
    }

    // Question indicators
    if (/\?/.test(message)) {
      emotion.curiosity += 0.15;
      emotion.engagement += 0.1;
    }

    // Clamp values
    Object.keys(emotion).forEach(key => {
      if (key !== 'timestamp' && typeof emotion[key as keyof EmotionalState] === 'number') {
        (emotion as any)[key] = Math.max(0, Math.min(1, (emotion as any)[key]));
      }
    });

    emotion.timestamp = Date.now();

    return emotion;
  }

  /**
   * Generates an appropriate response
   */
  private async generateResponse(message: Message, context: ConversationContext): Promise<string> {
    const { intent } = message;
    const { currentEmotion } = context;

    // Handle based on intent and emotion
    if (intent?.type === 'frustration' || currentEmotion.frustration > 0.7) {
      return this.selectResponse('empathy-frustration');
    }

    if (intent?.type === 'confusion' || currentEmotion.anxiety > 0.6) {
      return this.selectResponse('clarification');
    }

    if (intent?.type === 'achievement' || currentEmotion.satisfaction > 0.8) {
      return this.selectResponse('celebration');
    }

    if (intent?.type === 'answer') {
      // Evaluate answer (simplified)
      const isCorrect = Math.random() > 0.5; // Placeholder

      if (isCorrect) {
        return this.selectResponse('celebration');
      } else {
        return this.selectResponse('encouragement-after-mistake');
      }
    }

    if (intent?.type === 'question') {
      return this.answerQuestion(message.content, context);
    }

    // Default: provide encouragement and continue
    return this.selectResponse('encouragement-general');
  }

  /**
   * Selects a response from template
   */
  private selectResponse(templateKey: string): string {
    const template = this.responseTemplates.get(templateKey);

    if (!template) {
      return "I'm here to help you learn and grow.";
    }

    const variant = template.variants[Math.floor(Math.random() * template.variants.length)];

    return variant;
  }

  /**
   * Answers a question (simplified)
   */
  private answerQuestion(question: string, context: ConversationContext): string {
    // In real implementation, this would use RAG, knowledge graph, or LLM

    const { topic } = context;

    return `That's a great question about ${topic}! ${this.selectResponse('clarification')}`;
  }

  /**
   * Sends a message in the thread
   */
  private sendMessage(threadId: string, role: Message['role'], content: string): void {
    const context = this.activeThreads.get(threadId);

    if (!context) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: Date.now(),
      context: { threadId }
    };

    context.messages.push(message);
  }

  /**
   * Gets conversation context
   */
  getContext(threadId: string): ConversationContext | undefined {
    return this.activeThreads.get(threadId);
  }

  /**
   * Gets recent messages
   */
  getRecentMessages(threadId: string, count: number = 10): Message[] {
    const context = this.activeThreads.get(threadId);

    if (!context) return [];

    return context.messages.slice(-count);
  }

  /**
   * Exports conversation history
   */
  exportConversation(threadId: string): any {
    const context = this.activeThreads.get(threadId);

    if (!context) return null;

    return {
      threadId,
      topic: context.topic,
      messages: context.messages,
      duration: Date.now() - context.startTime,
      messageCount: context.messages.length
    };
  }

  /**
   * Ends a conversation thread
   */
  endThread(threadId: string): void {
    const context = this.activeThreads.get(threadId);

    if (context) {
      this.sendMessage(
        threadId,
        'teacher',
        "Great work today! I'm proud of your effort and growth. See you next time!"
      );

      this.activeThreads.delete(threadId);
      console.log(`💬 Conversation ended: ${context.topic}`);
    }
  }
}

interface ResponseTemplate {
  variants: string[];
  emotionalTone: EmotionalState;
}
