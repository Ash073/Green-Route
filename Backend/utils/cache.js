import { LRUCache } from 'lru-cache';

const options = {
  max: 500,
  ttl: 60 * 1000, // default TTL 60 seconds
};

const cache = new LRUCache(options);

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value, ttlMs = 60 * 1000) {
  cache.set(key, value, { ttl: ttlMs });
}

export function delCache(key) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}
