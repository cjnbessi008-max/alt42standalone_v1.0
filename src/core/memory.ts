/**
 * Memory & Growth System
 *
 * Manages:
 * - Experience storage in IndexedDB
 * - Memory consolidation
 * - Growth pattern recognition
 * - Knowledge evolution
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Memory, LearningEvent, Pattern, Evolution } from '../types/index.js';

interface MemoryDB extends DBSchema {
  memories: {
    key: string;
    value: Memory;
    indexes: {
      'by-type': string;
      'by-importance': number;
      'by-created': number;
    };
  };
  learningEvents: {
    key: number;
    value: LearningEvent;
    indexes: {
      'by-topic': string;
      'by-timestamp': number;
    };
  };
  patterns: {
    key: string;
    value: Pattern;
    indexes: {
      'by-type': string;
      'by-strength': number;
    };
  };
  evolutions: {
    key: string;
    value: Evolution;
    indexes: {
      'by-timestamp': number;
    };
  };
}

export class MemorySystem {
  private db: IDBPDatabase<MemoryDB> | null = null;
  private consolidationThreshold: number = 0.7;
  private forgettingCurve: number = 0.85; // 15% decay per time unit

  /**
   * Initializes the memory database
   */
  async initialize(): Promise<void> {
    this.db = await openDB<MemoryDB>('ai-teacher-memory', 1, {
      upgrade(db) {
        // Memories store
        const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
        memoryStore.createIndex('by-type', 'type');
        memoryStore.createIndex('by-importance', 'importance');
        memoryStore.createIndex('by-created', 'created');

        // Learning events store
        const eventStore = db.createObjectStore('learningEvents', {
          keyPath: 'timestamp'
        });
        eventStore.createIndex('by-topic', 'topic');
        eventStore.createIndex('by-timestamp', 'timestamp');

        // Patterns store
        const patternStore = db.createObjectStore('patterns', { keyPath: 'id' });
        patternStore.createIndex('by-type', 'type');
        patternStore.createIndex('by-strength', 'strength');

        // Evolution history store
        const evolutionStore = db.createObjectStore('evolutions', {
          keyPath: 'timestamp'
        });
        evolutionStore.createIndex('by-timestamp', 'timestamp');
      }
    });

    console.log('🧠 Memory system initialized');
  }

  /**
   * Stores a new memory
   */
  async remember(
    type: Memory['type'],
    content: any,
    importance: number = 0.5,
    emotionalValence: number = 0.0
  ): Promise<Memory> {
    if (!this.db) throw new Error('Memory system not initialized');

    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      emotionalValence,
      importance,
      accessCount: 0,
      lastAccessed: Date.now(),
      created: Date.now(),
      associations: [],
      consolidationLevel: 0.0
    };

    await this.db.add('memories', memory);
    console.log(`💾 Memory stored: ${type} (importance: ${importance.toFixed(2)})`);

    return memory;
  }

  /**
   * Recalls a memory by ID
   */
  async recall(memoryId: string): Promise<Memory | null> {
    if (!this.db) throw new Error('Memory system not initialized');

    const memory = await this.db.get('memories', memoryId);

    if (memory) {
      // Update access metadata
      memory.accessCount++;
      memory.lastAccessed = Date.now();
      await this.db.put('memories', memory);

      console.log(`🔍 Memory recalled: ${memoryId} (${memory.accessCount} accesses)`);
    }

    return memory || null;
  }

  /**
   * Searches memories by type
   */
  async searchByType(type: Memory['type'], limit: number = 10): Promise<Memory[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    return await this.db.getAllFromIndex('memories', 'by-type', type, limit);
  }

  /**
   * Gets most important memories
   */
  async getMostImportant(limit: number = 10): Promise<Memory[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    const all = await this.db.getAllFromIndex('memories', 'by-importance');
    return all.reverse().slice(0, limit);
  }

  /**
   * Records a learning event
   */
  async recordLearningEvent(event: LearningEvent): Promise<void> {
    if (!this.db) throw new Error('Memory system not initialized');

    await this.db.add('learningEvents', event);

    // Create associated memory
    await this.remember(
      'experience',
      event,
      this.calculateImportance(event),
      this.calculateEmotionalValence(event)
    );

    console.log(`📝 Learning event recorded: ${event.topic}`);
  }

  /**
   * Calculates importance of a learning event
   */
  private calculateImportance(event: LearningEvent): number {
    // Higher importance for:
    // - High mastery gain
    // - High performance
    // - Strong emotional response
    const masteryWeight = event.masteryGain * 0.4;
    const performanceWeight = event.performance * 0.3;
    const emotionalWeight = Math.abs(event.emotionalResponse.satisfaction - 0.5) * 0.3;

    return Math.min(1.0, masteryWeight + performanceWeight + emotionalWeight);
  }

  /**
   * Calculates emotional valence of a learning event
   */
  private calculateEmotionalValence(event: LearningEvent): number {
    const { emotionalResponse } = event;

    // Positive emotions
    const positive = (
      emotionalResponse.curiosity +
      emotionalResponse.confidence +
      emotionalResponse.satisfaction +
      emotionalResponse.engagement
    ) / 4;

    // Negative emotions
    const negative = (emotionalResponse.frustration + emotionalResponse.anxiety) / 2;

    return positive - negative; // Range: -1.0 to 1.0
  }

  /**
   * Gets recent learning events
   */
  async getRecentEvents(limit: number = 20): Promise<LearningEvent[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    const all = await this.db.getAllFromIndex('learningEvents', 'by-timestamp');
    return all.reverse().slice(0, limit);
  }

  /**
   * Gets learning events for a specific topic
   */
  async getEventsByTopic(topic: string): Promise<LearningEvent[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    return await this.db.getAllFromIndex('learningEvents', 'by-topic', topic);
  }

  /**
   * Stores a pattern
   */
  async storePattern(pattern: Pattern): Promise<void> {
    if (!this.db) throw new Error('Memory system not initialized');

    await this.db.put('patterns', pattern);
    console.log(`🔮 Pattern stored: ${pattern.type} (strength: ${pattern.strength.toFixed(2)})`);
  }

  /**
   * Gets patterns by type
   */
  async getPatternsByType(type: Pattern['type']): Promise<Pattern[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    return await this.db.getAllFromIndex('patterns', 'by-type', type);
  }

  /**
   * Gets strongest patterns
   */
  async getStrongestPatterns(limit: number = 10): Promise<Pattern[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    const all = await this.db.getAllFromIndex('patterns', 'by-strength');
    return all.reverse().slice(0, limit);
  }

  /**
   * Records an evolution event
   */
  async recordEvolution(evolution: Evolution): Promise<void> {
    if (!this.db) throw new Error('Memory system not initialized');

    await this.db.add('evolutions', evolution);
    console.log(`🧬 Evolution recorded: ${evolution.mutation}`);
  }

  /**
   * Gets evolution history
   */
  async getEvolutionHistory(limit: number = 50): Promise<Evolution[]> {
    if (!this.db) throw new Error('Memory system not initialized');

    const all = await this.db.getAllFromIndex('evolutions', 'by-timestamp');
    return all.reverse().slice(0, limit);
  }

  /**
   * Consolidates memories during sleep/dream phase
   */
  async consolidateMemories(): Promise<{
    consolidated: number;
    forgotten: number;
    strengthened: number;
  }> {
    if (!this.db) throw new Error('Memory system not initialized');

    console.log('😴 Beginning memory consolidation...');

    const allMemories = await this.db.getAll('memories');
    let consolidated = 0;
    let forgotten = 0;
    let strengthened = 0;

    for (const memory of allMemories) {
      const timeSinceAccess = Date.now() - memory.lastAccessed;
      const daysSinceAccess = timeSinceAccess / (1000 * 60 * 60 * 24);

      // Apply forgetting curve
      const decay = Math.pow(this.forgettingCurve, daysSinceAccess);
      const newImportance = memory.importance * decay;

      if (newImportance < 0.1 && memory.accessCount < 2) {
        // Forget unimportant, rarely accessed memories
        await this.db.delete('memories', memory.id);
        forgotten++;
      } else {
        // Update importance
        memory.importance = newImportance;

        // Strengthen consolidation for frequently accessed memories
        if (memory.accessCount > 3) {
          memory.consolidationLevel = Math.min(
            1.0,
            memory.consolidationLevel + 0.1
          );
          strengthened++;
        }

        // Consolidate memories above threshold
        if (memory.consolidationLevel >= this.consolidationThreshold) {
          memory.importance = Math.min(1.0, memory.importance * 1.2);
          consolidated++;
        }

        await this.db.put('memories', memory);
      }
    }

    console.log(`
💤 Consolidation complete:
  • ${consolidated} memories consolidated
  • ${strengthened} memories strengthened
  • ${forgotten} memories forgotten
    `);

    return { consolidated, forgotten, strengthened };
  }

  /**
   * Finds growth patterns from learning history
   */
  async analyzeGrowthPatterns(): Promise<{
    topics: Map<string, { count: number; avgPerformance: number; trend: string }>;
    overallTrend: string;
    insights: string[];
  }> {
    if (!this.db) throw new Error('Memory system not initialized');

    const events = await this.getRecentEvents(100);

    // Analyze by topic
    const topics = new Map<string, { count: number; avgPerformance: number; trend: string }>();

    events.forEach(event => {
      const existing = topics.get(event.topic) || {
        count: 0,
        avgPerformance: 0,
        trend: 'stable'
      };

      existing.count++;
      existing.avgPerformance =
        (existing.avgPerformance * (existing.count - 1) + event.performance) / existing.count;

      topics.set(event.topic, existing);
    });

    // Calculate trends
    topics.forEach((data, topic) => {
      const topicEvents = events.filter(e => e.topic === topic);
      if (topicEvents.length >= 3) {
        const recent = topicEvents.slice(0, 3);
        const older = topicEvents.slice(-3);

        const recentAvg = recent.reduce((sum, e) => sum + e.performance, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.performance, 0) / older.length;

        if (recentAvg > olderAvg * 1.1) {
          data.trend = 'improving';
        } else if (recentAvg < olderAvg * 0.9) {
          data.trend = 'declining';
        }
      }
    });

    // Overall trend
    const recentPerformance =
      events.slice(0, 10).reduce((sum, e) => sum + e.performance, 0) / 10;
    const olderPerformance =
      events.slice(-10).reduce((sum, e) => sum + e.performance, 0) / 10;

    let overallTrend = 'stable';
    if (recentPerformance > olderPerformance * 1.15) {
      overallTrend = 'strong growth';
    } else if (recentPerformance > olderPerformance * 1.05) {
      overallTrend = 'moderate growth';
    } else if (recentPerformance < olderPerformance * 0.95) {
      overallTrend = 'declining';
    }

    // Generate insights
    const insights: string[] = [];

    topics.forEach((data, topic) => {
      if (data.trend === 'improving' && data.avgPerformance > 0.8) {
        insights.push(`Mastery achieved in ${topic}`);
      } else if (data.trend === 'declining') {
        insights.push(`Need to revisit fundamentals in ${topic}`);
      }
    });

    if (overallTrend === 'strong growth') {
      insights.push('Learning acceleration detected - learner is thriving');
    }

    return { topics, overallTrend, insights };
  }

  /**
   * Gets memory statistics
   */
  async getStatistics(): Promise<{
    totalMemories: number;
    byType: Map<string, number>;
    avgConsolidation: number;
    totalEvents: number;
    totalPatterns: number;
  }> {
    if (!this.db) throw new Error('Memory system not initialized');

    const memories = await this.db.getAll('memories');
    const events = await this.db.getAll('learningEvents');
    const patterns = await this.db.getAll('patterns');

    const byType = new Map<string, number>();
    memories.forEach(m => {
      byType.set(m.type, (byType.get(m.type) || 0) + 1);
    });

    const avgConsolidation =
      memories.reduce((sum, m) => sum + m.consolidationLevel, 0) / memories.length;

    return {
      totalMemories: memories.length,
      byType,
      avgConsolidation,
      totalEvents: events.length,
      totalPatterns: patterns.length
    };
  }

  /**
   * Exports all memories for backup
   */
  async exportMemories(): Promise<any> {
    if (!this.db) throw new Error('Memory system not initialized');

    return {
      memories: await this.db.getAll('memories'),
      events: await this.db.getAll('learningEvents'),
      patterns: await this.db.getAll('patterns'),
      evolutions: await this.db.getAll('evolutions'),
      exportedAt: Date.now()
    };
  }

  /**
   * Imports memories from backup
   */
  async importMemories(data: any): Promise<void> {
    if (!this.db) throw new Error('Memory system not initialized');

    const tx = this.db.transaction(
      ['memories', 'learningEvents', 'patterns', 'evolutions'],
      'readwrite'
    );

    for (const memory of data.memories || []) {
      await tx.objectStore('memories').put(memory);
    }

    for (const event of data.events || []) {
      await tx.objectStore('learningEvents').put(event);
    }

    for (const pattern of data.patterns || []) {
      await tx.objectStore('patterns').put(pattern);
    }

    for (const evolution of data.evolutions || []) {
      await tx.objectStore('evolutions').put(evolution);
    }

    await tx.done;

    console.log('📥 Memories imported successfully');
  }

  /**
   * Clears all memories (use with caution!)
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Memory system not initialized');

    const tx = this.db.transaction(
      ['memories', 'learningEvents', 'patterns', 'evolutions'],
      'readwrite'
    );

    await tx.objectStore('memories').clear();
    await tx.objectStore('learningEvents').clear();
    await tx.objectStore('patterns').clear();
    await tx.objectStore('evolutions').clear();

    await tx.done;

    console.log('🗑️ All memories cleared');
  }
}
