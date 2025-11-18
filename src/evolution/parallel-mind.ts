/**
 * Parallel Processing Mind
 *
 * Orchestrates Web Workers for parallel thinking,
 * enabling the system to process multiple thoughts simultaneously.
 */

export interface ThoughtProcess {
  id: string;
  type: 'analysis' | 'planning' | 'reflection' | 'generation';
  input: any;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  result?: any;
  startTime: number;
  endTime?: number;
  workerId?: number;
}

export interface WorkerStats {
  workerId: number;
  tasksCompleted: number;
  tasksActive: number;
  averageProcessingTime: number;
  errorCount: number;
}

export class ParallelMind {
  private workers: Worker[];
  private thoughts: Map<string, ThoughtProcess>;
  private workerQueue: Map<number, ThoughtProcess[]>;
  private maxWorkers: number;
  private stats: Map<number, WorkerStats>;

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = navigator.hardwareConcurrency || maxWorkers;
    this.workers = [];
    this.thoughts = new Map();
    this.workerQueue = new Map();
    this.stats = new Map();
  }

  /**
   * Initializes worker threads
   */
  async initialize(): Promise<void> {
    console.log(`🧠 Initializing ${this.maxWorkers} parallel thought processes...`);

    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        // Create worker (in real implementation, this would load actual worker script)
        const worker = this.createWorker(i);

        this.workers.push(worker);
        this.workerQueue.set(i, []);
        this.stats.set(i, {
          workerId: i,
          tasksCompleted: 0,
          tasksActive: 0,
          averageProcessingTime: 0,
          errorCount: 0
        });
      } catch (error) {
        console.warn(`⚠️ Could not create worker ${i}:`, error);
      }
    }

    console.log(`✅ ${this.workers.length} parallel minds ready`);
  }

  /**
   * Creates a worker (mock implementation for demonstration)
   */
  private createWorker(id: number): Worker {
    // In a real implementation, this would create an actual Web Worker
    // For now, we'll use a mock that simulates worker behavior

    const mockWorker = {
      postMessage: (message: any) => {
        // Simulate async processing
        setTimeout(() => {
          this.handleWorkerMessage(id, {
            data: {
              thoughtId: message.thoughtId,
              result: this.processThought(message.thought)
            }
          });
        }, Math.random() * 1000 + 500);
      },
      terminate: () => {
        console.log(`🛑 Worker ${id} terminated`);
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onmessage: null,
      onmessageerror: null,
      onerror: null
    } as unknown as Worker;

    return mockWorker;
  }

  /**
   * Processes a thought (simulated worker logic)
   */
  private processThought(thought: ThoughtProcess): any {
    switch (thought.type) {
      case 'analysis':
        return {
          type: 'analysis-result',
          insights: ['Pattern detected', 'Correlation found'],
          confidence: 0.85
        };

      case 'planning':
        return {
          type: 'plan',
          steps: ['Step 1', 'Step 2', 'Step 3'],
          estimatedDuration: 15
        };

      case 'reflection':
        return {
          type: 'reflection-result',
          insights: ['I could improve X', 'Y worked well'],
          growthAreas: ['Better error handling']
        };

      case 'generation':
        return {
          type: 'generated-content',
          content: 'Generated learning material',
          quality: 0.8
        };

      default:
        return { result: 'processed' };
    }
  }

  /**
   * Handles messages from workers
   */
  private handleWorkerMessage(workerId: number, event: { data: any }): void {
    const { thoughtId, result, error } = event.data;

    const thought = this.thoughts.get(thoughtId);
    if (!thought) return;

    const stats = this.stats.get(workerId)!;

    if (error) {
      thought.status = 'failed';
      thought.result = { error };
      stats.errorCount++;
    } else {
      thought.status = 'complete';
      thought.result = result;
      thought.endTime = Date.now();

      // Update stats
      stats.tasksCompleted++;
      stats.tasksActive--;

      const processingTime = thought.endTime - thought.startTime;
      stats.averageProcessingTime =
        (stats.averageProcessingTime * (stats.tasksCompleted - 1) + processingTime) /
        stats.tasksCompleted;
    }

    // Process next in queue
    this.processQueue(workerId);
  }

  /**
   * Spawns a parallel thought process
   */
  async think(
    type: ThoughtProcess['type'],
    input: any
  ): Promise<ThoughtProcess> {
    const thought: ThoughtProcess = {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      status: 'pending',
      startTime: Date.now()
    };

    this.thoughts.set(thought.id, thought);

    // Assign to least busy worker
    const workerId = this.selectWorker();
    const queue = this.workerQueue.get(workerId)!;

    queue.push(thought);

    // If worker is idle, process immediately
    const stats = this.stats.get(workerId)!;
    if (stats.tasksActive === 0) {
      this.processQueue(workerId);
    }

    return thought;
  }

  /**
   * Selects the least busy worker
   */
  private selectWorker(): number {
    let minLoad = Infinity;
    let selectedWorker = 0;

    this.stats.forEach((stats, workerId) => {
      const load = stats.tasksActive + this.workerQueue.get(workerId)!.length;
      if (load < minLoad) {
        minLoad = load;
        selectedWorker = workerId;
      }
    });

    return selectedWorker;
  }

  /**
   * Processes worker queue
   */
  private processQueue(workerId: number): void {
    const queue = this.workerQueue.get(workerId)!;
    const worker = this.workers[workerId];
    const stats = this.stats.get(workerId)!;

    if (queue.length === 0) return;

    const thought = queue.shift()!;
    thought.status = 'processing';
    thought.workerId = workerId;

    stats.tasksActive++;

    // Send to worker
    worker.postMessage({
      thoughtId: thought.id,
      thought
    });
  }

  /**
   * Waits for a thought to complete
   */
  async awaitThought(thoughtId: string, timeout: number = 10000): Promise<any> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const thought = this.thoughts.get(thoughtId);

        if (!thought) {
          clearInterval(checkInterval);
          reject(new Error('Thought not found'));
          return;
        }

        if (thought.status === 'complete') {
          clearInterval(checkInterval);
          resolve(thought.result);
          return;
        }

        if (thought.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error('Thought processing failed'));
          return;
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Thought processing timeout'));
        }
      }, 100);
    });
  }

  /**
   * Spawns multiple parallel thoughts
   */
  async thinkParallel(thoughts: Array<{ type: ThoughtProcess['type']; input: any }>): Promise<any[]> {
    console.log(`🌟 Spawning ${thoughts.length} parallel thought processes...`);

    const thoughtPromises = thoughts.map(({ type, input }) =>
      this.think(type, input).then(thought => this.awaitThought(thought.id))
    );

    return await Promise.all(thoughtPromises);
  }

  /**
   * Gets statistics for all workers
   */
  getStats(): WorkerStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Gets overall processing metrics
   */
  getMetrics(): {
    totalThoughts: number;
    activeThoughts: number;
    completedThoughts: number;
    failedThoughts: number;
    averageProcessingTime: number;
  } {
    const thoughts = Array.from(this.thoughts.values());

    const totalThoughts = thoughts.length;
    const activeThoughts = thoughts.filter(t => t.status === 'processing').length;
    const completedThoughts = thoughts.filter(t => t.status === 'complete').length;
    const failedThoughts = thoughts.filter(t => t.status === 'failed').length;

    const completedWithTime = thoughts.filter(t => t.endTime !== undefined);
    const averageProcessingTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, t) => sum + (t.endTime! - t.startTime), 0) /
          completedWithTime.length
        : 0;

    return {
      totalThoughts,
      activeThoughts,
      completedThoughts,
      failedThoughts,
      averageProcessingTime
    };
  }

  /**
   * Terminates all workers
   */
  shutdown(): void {
    console.log('🛑 Shutting down parallel minds...');

    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.workerQueue.clear();
    this.thoughts.clear();

    console.log('✅ All parallel minds terminated');
  }

  /**
   * Generates parallel thinking report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const workerStats = this.getStats();

    let report = `
🧠 PARALLEL MIND REPORT
${'═'.repeat(60)}

Total Thoughts Processed: ${metrics.totalThoughts}
Active: ${metrics.activeThoughts}
Completed: ${metrics.completedThoughts}
Failed: ${metrics.failedThoughts}

Average Processing Time: ${metrics.averageProcessingTime.toFixed(0)}ms

Workers: ${this.workers.length}
`;

    workerStats.forEach(stats => {
      report += `\nWorker ${stats.workerId}:
  Tasks Completed: ${stats.tasksCompleted}
  Active Tasks: ${stats.tasksActive}
  Avg Time: ${stats.averageProcessingTime.toFixed(0)}ms
  Errors: ${stats.errorCount}`;
    });

    return report.trim();
  }
}
