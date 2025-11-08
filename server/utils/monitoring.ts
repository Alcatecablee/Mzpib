interface PerformanceMetrics {
  folderFetchTimes: Map<string, number[]>;
  timeouts: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: Map<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    folderFetchTimes: new Map(),
    timeouts: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: new Map(),
  };

  private resetInterval = 5 * 60 * 1000;
  private lastReset = Date.now();

  private maybeReset() {
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.metrics = {
        folderFetchTimes: new Map(),
        timeouts: 0,
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: new Map(),
      };
      this.lastReset = Date.now();
    }
  }

  recordRequest() {
    this.maybeReset();
    this.metrics.totalRequests++;
  }

  recordCacheHit() {
    this.maybeReset();
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.maybeReset();
    this.metrics.cacheMisses++;
  }

  recordTimeout() {
    this.maybeReset();
    this.metrics.timeouts++;
  }

  recordError(errorType: string) {
    this.maybeReset();
    const current = this.metrics.errors.get(errorType) || 0;
    this.metrics.errors.set(errorType, current + 1);
  }

  recordFolderFetch(folderId: string, folderName: string, durationMs: number) {
    this.maybeReset();
    const key = `${folderId}:${folderName}`;
    const times = this.metrics.folderFetchTimes.get(key) || [];
    times.push(durationMs);
    if (times.length > 100) times.shift();
    this.metrics.folderFetchTimes.set(key, times);
  }

  getStats() {
    this.maybeReset();
    const cacheHitRate =
      this.metrics.totalRequests > 0
        ? ((this.metrics.cacheHits / this.metrics.totalRequests) * 100).toFixed(2)
        : "0.00";

    const timeoutRate =
      this.metrics.totalRequests > 0
        ? ((this.metrics.timeouts / this.metrics.totalRequests) * 100).toFixed(2)
        : "0.00";

    const folderStats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [key, times] of this.metrics.folderFetchTimes.entries()) {
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        folderStats[key] = { avg, min, max, count: times.length };
      }
    }

    return {
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRate: `${cacheHitRate}%`,
      timeouts: this.metrics.timeouts,
      timeoutRate: `${timeoutRate}%`,
      errors: Object.fromEntries(this.metrics.errors),
      folderPerformance: folderStats,
    };
  }

  logStats() {
    const stats = this.getStats();
    console.log("\n📊 Performance Metrics:");
    console.log(`  Total Requests: ${stats.totalRequests}`);
    console.log(`  Cache Hit Rate: ${stats.cacheHitRate} (${stats.cacheHits} hits / ${stats.cacheMisses} misses)`);
    console.log(`  Timeout Rate: ${stats.timeoutRate} (${stats.timeouts} timeouts)`);
    
    if (Object.keys(stats.errors).length > 0) {
      console.log(`  Errors: ${JSON.stringify(stats.errors)}`);
    }

    if (Object.keys(stats.folderPerformance).length > 0) {
      console.log("\n  📁 Folder Performance:");
      for (const [folder, perf] of Object.entries(stats.folderPerformance)) {
        console.log(`    ${folder}:`);
        console.log(`      Avg: ${perf.avg.toFixed(0)}ms | Min: ${perf.min}ms | Max: ${perf.max}ms | Count: ${perf.count}`);
      }
    }
    console.log("");
  }

  shouldAlert(): { alert: boolean; reason?: string } {
    const stats = this.getStats();
    
    if (this.metrics.totalRequests < 5) {
      return { alert: false };
    }

    const cacheHitRate = parseFloat(stats.cacheHitRate);
    if (cacheHitRate < 50) {
      return { alert: true, reason: `Low cache hit rate: ${stats.cacheHitRate}` };
    }

    const timeoutRate = parseFloat(stats.timeoutRate);
    if (timeoutRate > 20) {
      return { alert: true, reason: `High timeout rate: ${stats.timeoutRate}` };
    }

    for (const [folder, perf] of Object.entries(stats.folderPerformance)) {
      if (perf.avg > 5000) {
        return { alert: true, reason: `Slow folder fetch: ${folder} averaging ${perf.avg.toFixed(0)}ms` };
      }
    }

    return { alert: false };
  }
}

export const performanceMonitor = new PerformanceMonitor();
