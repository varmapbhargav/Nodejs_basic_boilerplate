import CircuitBreaker from 'opossum';
import { logger } from './logger';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  keyGenerator: (_req: any) => string;
  name: string;
}

export class CircuitBreakerManager {
  private static breakers = new Map<string, CircuitBreaker>();

  /**
   * Create or get a circuit breaker
   */
  static createBreaker<T extends (..._args: any[]) => Promise<any>>(
    name: string,
    fn: T,
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const breaker = new CircuitBreaker(fn, {
      timeout: options.timeout || 10000,
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      resetTimeout: options.resetTimeout || 30000,
      name,
    });

    // Event listeners
    breaker.on('open', () => {
      logger.warn({ breaker: name }, 'Circuit breaker OPEN');
    });

    breaker.on('halfOpen', () => {
      logger.info({ breaker: name }, 'Circuit breaker HALF_OPEN');
    });

    breaker.on('close', () => {
      logger.info({ breaker: name }, 'Circuit breaker CLOSED');
    });

    breaker.on('failure', (_error) => {
      logger.error({ breaker: name, _error }, 'Circuit breaker failure');
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get existing breaker
   */
  static getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Execute function with circuit breaker
   */
  static async execute<T>(
    name: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const breaker = this.createBreaker(name, fn, {
      name,
    });

    try {
      return await breaker.fire() as Promise<T>;
    } catch (error) {
      if (fallback) {
        logger.warn({ breaker: name }, 'Using fallback response');
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Get all breakers status
   */
  static getStatus(): Record<
    string,
    {
      state: string;
      stats: {
        fires: number;
        successes: number;
        failures: number;
        rejects: number;
      };
    }
  > {
    const status: any = {};

    this.breakers.forEach((breaker, name) => {
      status[name] = {
        state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        stats: breaker.stats,
      };
    });

    return status;
  }

  /**
   * Reset all breakers
   */
  static resetAll(): void {
    this.breakers.forEach((breaker) => {
      breaker.close();
    });
    logger.info('All circuit breakers reset');
  }
}
