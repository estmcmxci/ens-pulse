/**
 * Simple in-memory cache utility with TTL
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const feedCache = new SimpleCache();

// TTL constants
export const CACHE_TTL = {
  DISCOURSE_TOPICS: 15 * 60 * 1000,    // 15 minutes
  DISCOURSE_CONTENT: 15 * 60 * 1000,   // 15 minutes
  SOCIAL_POSTS: 5 * 60 * 1000,         // 5 minutes
  SUMMARIES: 24 * 60 * 60 * 1000,      // 24 hours
} as const;
