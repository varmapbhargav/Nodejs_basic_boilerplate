import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
  // HTTP Metrics
  static readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  });

  static readonly httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
  });

  static readonly httpErrorsTotal = new Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'path', 'status', 'error_type'],
  });

  // Database Metrics
  static readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table', 'status'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1],
  });

  // Cache Metrics
  static readonly cacheHitsTotal = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_name'],
  });

  static readonly cacheMissesTotal = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_name'],
  });

  // Connection Metrics
  static readonly activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['connection_type'],
  });

  static readonly circuitBreakerState = new Gauge({
    name: 'circuit_breaker_state',
    help: 'State of circuit breakers (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
    labelNames: ['breaker_name'],
  });

  // Enterprise Metrics
  private static readonly startupTime = new Histogram({
    name: 'startup_time_seconds',
    help: 'Application startup time in seconds',
    buckets: [1, 2, 5, 10, 30, 60],
  });

  private static readonly serverUptime = new Gauge({
    name: 'server_uptime_seconds',
    help: 'Server uptime in seconds',
  });

  private static readonly memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
  });

  private static readonly eventLoopLag = new Histogram({
    name: 'event_loop_lag_milliseconds',
    help: 'Event loop lag in milliseconds',
    buckets: [1, 5, 10, 50, 100, 500, 1000],
  });

  private static readonly healthStatus = new Gauge({
    name: 'health_status',
    help: 'Application health status (1=healthy, 0=unhealthy)',
  });

  private static readonly customCounters = new Map<string, Counter>();
  private static readonly customGauges = new Map<string, Gauge>();
  private static readonly customHistograms = new Map<string, Histogram>();

  // HTTP Methods
  static recordHttpRequest(method: string, path: string, status: number, duration: number): void {
    this.httpRequestDuration.observe({ method, path, status: status.toString() }, duration / 1000);
    this.httpRequestTotal.inc({ method, path, status: status.toString() });
  }

  static recordHttpError(method: string, path: string, status: number, errorType: string): void {
    this.httpErrorsTotal.inc({ method, path, status: status.toString(), error_type: errorType });
  }

  // Database Methods
  static recordDbQuery(operation: string, table: string, status: string, duration: number): void {
    this.dbQueryDuration.observe({ operation, table, status }, duration / 1000);
  }

  // Cache Methods
  static recordCacheHit(cacheName: string): void {
    this.cacheHitsTotal.inc({ cache_name: cacheName });
  }

  static recordCacheMiss(cacheName: string): void {
    this.cacheMissesTotal.inc({ cache_name: cacheName });
  }

  // Connection Methods
  static setActiveConnections(connectionType: string, count: number): void {
    this.activeConnections.set({ connection_type: connectionType }, count);
  }

  static setCircuitBreakerState(breakerName: string, state: number): void {
    this.circuitBreakerState.set({ breaker_name: breakerName }, state);
  }
  static incrementCounter(name: string, labels?: Record<string, string>): void {
    if (!this.customCounters.has(name)) {
      this.customCounters.set(name, new Counter({
        name,
        help: `Custom counter metric: ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
      }));
    }
    const counter = this.customCounters.get(name)!;
    if (labels) {
      counter.inc(labels);
    } else {
      counter.inc();
    }
  }

  static setGauge(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.customGauges.has(name)) {
      this.customGauges.set(name, new Gauge({
        name,
        help: `Custom gauge metric: ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
      }));
    }
    const gauge = this.customGauges.get(name)!;
    if (labels) {
      gauge.set(labels, value);
    } else {
      gauge.set(value);
    }
  }

  static setHistogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.customHistograms.has(name)) {
      this.customHistograms.set(name, new Histogram({
        name,
        help: `Custom histogram metric: ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
      }));
    }
    const histogram = this.customHistograms.get(name)!;
    if (labels) {
      histogram.observe(labels, value);
    } else {
      histogram.observe(value);
    }
  }

  // Memory monitoring
  static setMemoryUsage(type: string, bytes: number): void {
    this.memoryUsage.set({ type }, bytes);
  }

  // Event loop monitoring
  static setEventLoopLag(lagMs: number): void {
    this.eventLoopLag.observe(lagMs);
  }

  // Health status
  static setHealthStatus(isHealthy: boolean): void {
    this.healthStatus.set(isHealthy ? 1 : 0);
  }

  // Startup and uptime
  static recordStartupTime(durationMs: number): void {
    this.startupTime.observe(durationMs / 1000);
  }

  static setServerUptime(uptimeSeconds: number): void {
    this.serverUptime.set(uptimeSeconds);
  }

  /**
   * Get Prometheus metrics
   */
  static async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
