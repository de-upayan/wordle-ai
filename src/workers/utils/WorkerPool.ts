/**
 * Worker pool for parallel computation
 * Manages a pool of workers and distributes tasks
 * Automatically sizes pool based on available CPU cores
 */

export interface WorkerTask<T, R> {
  id: string
  data: T
}

export interface WorkerResult<R> {
  id: string
  result: R
  error?: string
}

export class WorkerPool<T, R> {
  private workers: Worker[] = []
  private taskQueue: WorkerTask<T, R>[] = []
  private activeWorkers: Set<number> = new Set()
  private pendingTasks: Map<
    string,
    {
      resolve: (result: R) => void
      reject: (error: Error) => void
    }
  > = new Map()
  private poolSize: number

  constructor(
    private workerScript: string,
    poolSize?: number
  ) {
    // Use provided pool size or auto-detect based on CPU cores
    this.poolSize =
      poolSize || this.getOptimalPoolSize()
    this.initializeWorkers()
  }

  /**
   * Determine optimal pool size based on available CPU cores
   * Leaves 1 core for main thread, caps at 8 to avoid memory overhead
   */
  private getOptimalPoolSize(): number {
    const cores = navigator.hardwareConcurrency || 4
    // Leave 1 core for main thread, cap at 8
    const optimalSize = Math.min(
      Math.max(cores - 1, 1),
      8
    )
    console.log(
      `[WorkerPool] Detected ${cores} CPU cores, ` +
        `using ${optimalSize} workers`
    )
    return optimalSize
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      // Resolve worker path relative to src/workers directory
      const workerUrl = new URL(
        `../${this.workerScript}`,
        import.meta.url
      )
      const worker = new Worker(workerUrl, { type: 'module' })

      worker.onmessage = (event: MessageEvent<WorkerResult<R>>) => {
        this.handleWorkerResult(i, event.data)
      }

      worker.onerror = (error: ErrorEvent) => {
        this.handleWorkerError(i, error)
      }

      this.workers.push(worker)
    }
  }

  /**
   * Submit a task to the worker pool
   */
  async execute(id: string, data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject })
      this.taskQueue.push({ id, data })
      this.processTasks()
    })
  }

  /**
   * Process queued tasks
   */
  private processTasks(): void {
    while (
      this.taskQueue.length > 0 &&
      this.activeWorkers.size < this.poolSize
    ) {
      const task = this.taskQueue.shift()
      if (!task) break

      // Find an available worker
      for (let i = 0; i < this.poolSize; i++) {
        if (!this.activeWorkers.has(i)) {
          this.activeWorkers.add(i)
          this.workers[i].postMessage({
            id: task.id,
            data: task.data,
          })
          break
        }
      }
    }
  }

  /**
   * Handle worker result
   */
  private handleWorkerResult(
    workerIndex: number,
    result: WorkerResult<R>
  ): void {
    this.activeWorkers.delete(workerIndex)

    const pending = this.pendingTasks.get(result.id)
    if (pending) {
      if (result.error) {
        pending.reject(new Error(result.error))
      } else {
        pending.resolve(result.result)
      }
      this.pendingTasks.delete(result.id)
    }

    // Process next task
    this.processTasks()
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(
    workerIndex: number,
    error: ErrorEvent
  ): void {
    this.activeWorkers.delete(workerIndex)
    console.error(`Worker ${workerIndex} error:`, error)
    this.processTasks()
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.pendingTasks.clear()
    this.taskQueue = []
  }
}

