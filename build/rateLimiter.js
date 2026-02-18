/**
 * Priority-based request queue manager for Discord API
 * Helps prevent API overwhelming during high load by managing request priorities
 * and leveraging discord.js's built-in rate limit handling
 */

import config from './config.js';

// Request priority levels
export const Priority = {
    HIGH: 'high',       // Critical operations (login, emergency operations)
    NORMAL: 'normal',   // Standard API operations
    LOW: 'low'          // Bulk operations, non-critical tasks
};

// Priority order for execution (lower value = higher priority)
const PRIORITY_ORDER = {
    [Priority.HIGH]: 0,
    [Priority.NORMAL]: 1,
    [Priority.LOW]: 2
};

// Configuration from centralized config
const CONFIG = {
    maxConcurrent: config.rateLimiter.maxConcurrent,
    highPriorityThreshold: config.rateLimiter.highThreshold,
    queueTimeout: config.rateLimiter.queueTimeout,
};

/**
 * Represents a queued request
 */
class QueuedRequest {
    constructor(fn, priority, options = {}) {
        this.fn = fn;
        this.priority = priority;
        this.options = options;
        this.createdAt = Date.now();
        this.id = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Create a promise that resolves when the request completes
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    /**
     * Execute the queued request
     */
    async execute() {
        try {
            const result = await this.fn();
            this.resolve(result);
            return result;
        } catch (error) {
            this.reject(error);
            throw error;
        }
    }

    /**
     * Check if the request has timed out
     */
    isTimedOut() {
        const timeout = this.options.timeout ?? CONFIG.queueTimeout;
        return (Date.now() - this.createdAt) > timeout;
    }
}

/**
 * Priority-based request queue manager
 */
class RequestQueue {
    constructor() {
        // Separate queues for each priority level
        this.queues = {
            [Priority.HIGH]: [],
            [Priority.NORMAL]: [],
            [Priority.LOW]: []
        };

        this.active = new Set(); // Currently executing requests
        this.maxConcurrent = CONFIG.maxConcurrent;
        this.isProcessing = false;
    }

    /**
     * Add a request to the queue
     * @param {Function} fn - Async function to execute
     * @param {string} priority - Priority level (high, normal, low)
     * @param {Object} options - Additional options
     * @returns {Promise} Promise that resolves when request completes
     */
    enqueue(fn, priority = Priority.NORMAL, options = {}) {
        const request = new QueuedRequest(fn, priority, options);
        this.queues[priority].push(request);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.process();
        }

        return request.promise;
    }

    /**
     * Get the next request to execute based on priority
     * @returns {QueuedRequest|null} The next request or null if all queues are empty
     */
    getNextRequest() {
        // Check high priority first
        if (this.queues[Priority.HIGH].length > 0) {
            return this.queues[Priority.HIGH].shift();
        }

        // If we have many high-priority requests waiting, hold back on low priority
        const highPending = this.queues[Priority.HIGH].length;
        if (highPending > CONFIG.highPriorityThreshold) {
            // Only process normal priority if low active
            if (this.active.size < 2 && this.queues[Priority.NORMAL].length > 0) {
                return this.queues[Priority.NORMAL].shift();
            }
            return null;
        }

        // Check normal priority
        if (this.queues[Priority.NORMAL].length > 0) {
            return this.queues[Priority.NORMAL].shift();
        }

        // Check low priority
        if (this.queues[Priority.LOW].length > 0) {
            return this.queues[Priority.LOW].shift();
        }

        return null;
    }

    /**
     * Process queued requests
     */
    async process() {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        while (true) {
            // Clean up timed out requests
            this.cleanupTimeouts();

            // Wait if we've reached max concurrent requests
            if (this.active.size >= this.maxConcurrent) {
                await this.waitForActiveSlot();
            }

            // Get the next request
            const request = this.getNextRequest();

            if (!request) {
                // No more requests to process
                if (this.active.size === 0) {
                    this.isProcessing = false;
                    break;
                }
                // Wait for active requests to complete
                await this.waitForActiveSlot();
                continue;
            }

            // Execute the request
            this.executeRequest(request);
        }
    }

    /**
     * Execute a single request
     */
    async executeRequest(request) {
        this.active.add(request);

        try {
            await request.execute();
        } catch (error) {
            // Error already handled by the request's promise rejection
        } finally {
            this.active.delete(request);
        }
    }

    /**
     * Wait for an active slot to become available
     */
    async waitForActiveSlot() {
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (this.active.size < this.maxConcurrent) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * Remove timed out requests from queues
     */
    cleanupTimeouts() {
        const now = Date.now();

        for (const priority of Object.keys(this.queues)) {
            this.queues[priority] = this.queues[priority].filter(request => {
                if (request.isTimedOut()) {
                    request.reject(new Error(`Request timed out after ${CONFIG.queueTimeout}ms`));
                    return false;
                }
                return true;
            });
        }
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            pending: {
                [Priority.HIGH]: this.queues[Priority.HIGH].length,
                [Priority.NORMAL]: this.queues[Priority.NORMAL].length,
                [Priority.LOW]: this.queues[Priority.LOW].length,
                total: this.queues[Priority.HIGH].length +
                       this.queues[Priority.NORMAL].length +
                       this.queues[Priority.LOW].length
            },
            active: this.active.size,
            maxConcurrent: this.maxConcurrent,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Clear all queued requests (reject them)
     */
    clear() {
        for (const priority of Object.keys(this.queues)) {
            for (const request of this.queues[priority]) {
                request.reject(new Error('Queue cleared'));
            }
            this.queues[priority] = [];
        }
    }

    /**
     * Wait for all active requests to complete
     */
    async drain() {
        while (this.active.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        // Also clear pending requests
        this.clear();
    }
}

/**
 * Rate limit-aware request executor
 * Wraps discord.js operations with proper queueing and rate limit awareness
 */
class RateLimiter {
    constructor() {
        this.queue = new RequestQueue();
        this.bucketLimits = new Map(); // Track rate limit buckets
    }

    /**
     * Execute a function with rate limit awareness
     * @param {Function} fn - Async function to execute
     * @param {string} priority - Request priority
     * @param {Object} options - Additional options
     * @returns {Promise} Result of the function
     */
    async execute(fn, priority = Priority.NORMAL, options = {}) {
        // Check if this is a bulk operation that should use lower priority
        if (options.isBulk) {
            priority = Priority.LOW;
        }

        return this.queue.enqueue(fn, priority, options);
    }

    /**
     * Execute multiple operations in parallel with proper batching
     * @param {Array<Function>} fns - Array of async functions to execute
     * @param {Object} options - Options including batchSize
     * @returns {Promise<Array>} Results of all functions
     */
    async executeBatch(fns, options = {}) {
        const { batchSize = 5, priority = Priority.NORMAL } = options;
        const results = [];

        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < fns.length; i += batchSize) {
            const batch = fns.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(
                batch.map(fn => this.execute(fn, priority, options))
            );

            // Extract results or errors
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push({ success: true, value: result.value });
                } else {
                    results.push({ success: false, error: result.reason });
                }
            }

            // Small delay between batches if there are more
            if (i + batchSize < fns.length) {
                await this.delay(100);
            }
        }

        return results;
    }

    /**
     * Execute a series of operations sequentially but with improved rate limit handling
     * @param {Array<Function>} fns - Array of async functions to execute
     * @param {Object} options - Options including delayMs
     * @returns {Promise<Array>} Results of all functions
     */
    async executeSequential(fns, options = {}) {
        const { delayMs = 250, priority = Priority.NORMAL, useBackoff = true } = options;
        const results = [];
        let consecutiveRateLimits = 0;

        for (const fn of fns) {
            try {
                const result = await this.execute(fn, priority, options);
                results.push({ success: true, value: result });
                consecutiveRateLimits = 0; // Reset on success

                // Dynamic delay based on rate limit history
                let actualDelay = delayMs;
                if (useBackoff && consecutiveRateLimits > 0) {
                    actualDelay = delayMs * Math.pow(2, consecutiveRateLimits);
                }

                if (actualDelay > 0) {
                    await this.delay(Math.min(actualDelay, 2000)); // Cap at 2 seconds
                }
            } catch (error) {
                results.push({ success: false, error });

                // Check for rate limit errors
                if (this.isRateLimitError(error)) {
                    consecutiveRateLimits++;
                    const retryAfter = this.extractRetryAfter(error);
                    if (retryAfter) {
                        await this.delay(retryAfter * 1000);
                    }
                } else {
                    consecutiveRateLimits = 0;
                }
            }
        }

        return results;
    }

    /**
     * Check if an error is a rate limit error
     */
    isRateLimitError(error) {
        if (!error) return false;
        const status = error.status || error.httpStatus || error.code;
        return status === 429;
    }

    /**
     * Extract retry-after from rate limit error
     */
    extractRetryAfter(error) {
        if (error.retry_after) {
            return error.retry_after;
        }
        // discord.js RateLimitError has retryAfter property
        if (error.retryAfter) {
            return error.retryAfter / 1000; // Convert to seconds
        }
        return null;
    }

    /**
     * Simple delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get rate limiter statistics
     */
    getStats() {
        return {
            queue: this.queue.getStats(),
            bucketLimits: this.bucketLimits.size
        };
    }

    /**
     * Clear all queued requests
     */
    clear() {
        this.queue.clear();
    }

    /**
     * Drain all active requests
     */
    async drain() {
        await this.queue.drain();
    }
}

// Singleton instance
let rateLimiterInstance = null;

/**
 * Get or create the singleton rate limiter instance
 * @returns {RateLimiter} Rate limiter instance
 */
export function getRateLimiter() {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiter();
    }
    return rateLimiterInstance;
}

/**
 * Reset the rate limiter instance (useful for testing)
 */
export function resetRateLimiter() {
    if (rateLimiterInstance) {
        rateLimiterInstance.clear();
        rateLimiterInstance = null;
    }
}

/**
 * Execute a function with rate limiting
 * Convenience wrapper for getRateLimiter().execute()
 * @param {Function} fn - Async function to execute
 * @param {string} priority - Request priority
 * @param {Object} options - Additional options
 * @returns {Promise} Result of the function
 */
export async function withRateLimit(fn, priority = Priority.NORMAL, options = {}) {
    const limiter = getRateLimiter();
    return limiter.execute(fn, priority, options);
}

/**
 * Execute multiple operations with rate limiting in batch
 * @param {Array<Function>} fns - Array of async functions
 * @param {Object} options - Options
 * @returns {Promise<Array>} Results
 */
export async function withRateLimitBatch(fns, options = {}) {
    const limiter = getRateLimiter();
    return limiter.executeBatch(fns, options);
}

/**
 * Execute operations sequentially with rate limiting
 * @param {Array<Function>} fns - Array of async functions
 * @param {Object} options - Options
 * @returns {Promise<Array>} Results
 */
export async function withRateLimitSequential(fns, options = {}) {
    const limiter = getRateLimiter();
    return limiter.executeSequential(fns, options);
}

export { RequestQueue, RateLimiter, CONFIG };
