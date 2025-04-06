type Task<R> = {
  execute: () => Promise<R>;
  onComplete: (result: R) => void;
  onError: (error: Error) => void;
};

/**
 * A service for queuing tasks with a limit on concurrent execution
 */
export class ProcessQueue<R> {
  private queue: Task<R>[] = [];
  private processing = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a task to the queue
   * @param task The task to execute
   * @param onComplete Callback when task completes successfully
   * @param onError Callback when task errors
   */
  enqueue(
    task: () => Promise<R>,
    onComplete: (result: R) => void,
    onError: (error: Error) => void
  ): void {
    this.queue.push({
      execute: task,
      onComplete,
      onError,
    });

    this.processNext();
  }

  /**
   * Process the next task in the queue if not at maximum concurrent limit
   */
  private processNext(): void {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.processing++;

    task
      .execute()
      .then((result) => {
        task.onComplete(result);
      })
      .catch((error) => {
        task.onError(error);
      })
      .finally(() => {
        this.processing--;
        this.processNext();
      });
  }

  /**
   * Get the number of tasks waiting to be processed
   */
  get waiting(): number {
    return this.queue.length;
  }

  /**
   * Get the number of tasks currently being processed
   */
  get active(): number {
    return this.processing;
  }

  /**
   * Clear all pending tasks from the queue
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Create an image processing queue with a limit of 3 concurrent operations
 * @param maxConcurrent Maximum number of concurrent operations (default: 3)
 */
export const createImageProcessingQueue = <R>(maxConcurrent = 3) => {
  return new ProcessQueue<R>(maxConcurrent);
};
