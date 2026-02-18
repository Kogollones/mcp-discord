/**
 * TTL-based in-memory cache for Discord resources
 * Provides caching for guilds, channels, roles, and members with configurable TTL values
 */

import config from './config.js';

// TTL configuration (in milliseconds) - from centralized config
const CACHE_TTL = {
    guilds: config.cache.ttlGuilds,
    channels: config.cache.ttlChannels,
    roles: config.cache.ttlRoles,
    members: config.cache.ttlMembers,
};

// Cache entry structure
class CacheEntry {
    constructor(value, ttl) {
        this.value = value;
        this.expiresAt = Date.now() + ttl;
    }

    isExpired() {
        return Date.now() > this.expiresAt;
    }
}

// Cache namespace management
class CacheNamespace {
    constructor(ttl) {
        this.store = new Map();
        this.ttl = ttl;
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        if (entry.isExpired()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key, value, customTtl) {
        const ttl = customTtl ?? this.ttl;
        this.store.set(key, new CacheEntry(value, ttl));
        return value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    // Get cache statistics
    getStats() {
        let expired = 0;
        const now = Date.now();
        for (const entry of this.store.values()) {
            if (now > entry.expiresAt) {
                expired++;
            }
        }
        return {
            size: this.store.size,
            expired,
            ttl: this.ttl
        };
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
}

// Main cache manager
class DiscordCache {
    constructor() {
        this.namespaces = {
            guilds: new CacheNamespace(CACHE_TTL.guilds),
            channels: new CacheNamespace(CACHE_TTL.channels),
            roles: new CacheNamespace(CACHE_TTL.roles),
            members: new CacheNamespace(CACHE_TTL.members),
        };

        // Start periodic cleanup (every 30 seconds)
        this.cleanupInterval = setInterval(() => this.cleanupAll(), 30000);
    }

    /**
     * Get a value from cache
     * @param {string} namespace - Cache namespace (guilds, channels, roles, members)
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if not found/expired
     */
    get(namespace, key) {
        const ns = this.namespaces[namespace];
        if (!ns) {
            throw new Error(`Unknown cache namespace: ${namespace}`);
        }
        return ns.get(key);
    }

    /**
     * Set a value in cache
     * @param {string} namespace - Cache namespace (guilds, channels, roles, members)
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} customTtl - Optional custom TTL in milliseconds
     * @returns {*} The cached value
     */
    set(namespace, key, value, customTtl) {
        const ns = this.namespaces[namespace];
        if (!ns) {
            throw new Error(`Unknown cache namespace: ${namespace}`);
        }
        return ns.set(key, value, customTtl);
    }

    /**
     * Check if a key exists in cache and is not expired
     * @param {string} namespace - Cache namespace
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is not expired
     */
    has(namespace, key) {
        const ns = this.namespaces[namespace];
        if (!ns) {
            throw new Error(`Unknown cache namespace: ${namespace}`);
        }
        return ns.has(key);
    }

    /**
     * Delete a specific key from cache
     * @param {string} namespace - Cache namespace
     * @param {string} key - Cache key
     * @returns {boolean} True if key was deleted
     */
    delete(namespace, key) {
        const ns = this.namespaces[namespace];
        if (!ns) {
            throw new Error(`Unknown cache namespace: ${namespace}`);
        }
        return ns.delete(key);
    }

    /**
     * Clear all entries in a namespace
     * @param {string} namespace - Cache namespace to clear
     */
    clear(namespace) {
        const ns = this.namespaces[namespace];
        if (!ns) {
            throw new Error(`Unknown cache namespace: ${namespace}`);
        }
        ns.clear();
    }

    /**
     * Clear all cache entries across all namespaces
     */
    clearAll() {
        for (const ns of Object.values(this.namespaces)) {
            ns.clear();
        }
    }

    /**
     * Clean up expired entries in all namespaces
     * @returns {Object} Cleanup statistics per namespace
     */
    cleanupAll() {
        const stats = {};
        for (const [name, ns] of Object.entries(this.namespaces)) {
            stats[name] = ns.cleanup();
        }
        return stats;
    }

    /**
     * Get cache statistics for all namespaces
     * @returns {Object} Statistics per namespace
     */
    getStats() {
        const stats = {};
        for (const [name, ns] of Object.entries(this.namespaces)) {
            stats[name] = ns.getStats();
        }
        return stats;
    }

    /**
     * Invalidate cache for a specific guild (clears related guild, channels, roles, members)
     * @param {string} guildId - Guild ID to invalidate
     */
    invalidateGuild(guildId) {
        // Clear guild entry
        this.namespaces.guilds.delete(guildId);

        // Clear all channels belonging to this guild
        for (const [key, entry] of this.namespaces.channels.store.entries()) {
            if (entry.value?.guildId === guildId) {
                this.namespaces.channels.store.delete(key);
            }
        }

        // Clear all roles belonging to this guild
        for (const [key, entry] of this.namespaces.roles.store.entries()) {
            if (entry.value?.guildId === guildId) {
                this.namespaces.roles.store.delete(key);
            }
        }

        // Clear all members belonging to this guild
        for (const [key, entry] of this.namespaces.members.store.entries()) {
            if (entry.value?.guildId === guildId) {
                this.namespaces.members.store.delete(key);
            }
        }
    }

    /**
     * Stop the cleanup interval (for graceful shutdown)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clearAll();
    }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get or create the singleton cache instance
 * @returns {DiscordCache} Cache instance
 */
export function getCache() {
    if (!cacheInstance) {
        cacheInstance = new DiscordCache();
    }
    return cacheInstance;
}

/**
 * Reset the cache instance (useful for testing)
 */
export function resetCache() {
    if (cacheInstance) {
        cacheInstance.destroy();
        cacheInstance = null;
    }
}

/**
 * Helper function to fetch with cache support
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} customTtl - Optional custom TTL
 * @returns {Promise<*>} Cached or fetched value
 */
export async function fetchWithCache(namespace, key, fetchFn, customTtl) {
    const cache = getCache();

    // Try to get from cache first
    const cached = cache.get(namespace, key);
    if (cached !== null) {
        return cached;
    }

    // Fetch the data
    const data = await fetchFn();

    // Cache the result
    if (data !== null && data !== undefined) {
        cache.set(namespace, key, data, customTtl);
    }

    return data;
}

export { DiscordCache, CacheNamespace, CACHE_TTL };
