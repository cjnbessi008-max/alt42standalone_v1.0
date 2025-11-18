<?php
/**
 * Simple File-Based Cache Service
 *
 * Provides efficient caching to minimize database queries
 * "과한 계산 없이" - Avoiding excessive computation
 */

namespace MoodleIntegration\Services;

class CacheService
{
    private $enabled;
    private $cachePath;
    private $ttl;

    public function __construct(array $config)
    {
        $this->enabled = $config['cache']['enabled'] ?? true;
        $this->cachePath = $config['cache']['path'] ?? sys_get_temp_dir() . '/moodle_cache';
        $this->ttl = $config['cache']['ttl'] ?? 3600;

        // Create cache directory if it doesn't exist
        if ($this->enabled && !is_dir($this->cachePath)) {
            mkdir($this->cachePath, 0755, true);
        }
    }

    /**
     * Generate cache key from parameters
     */
    private function getCacheKey($key)
    {
        return $this->cachePath . '/' . md5($key) . '.cache';
    }

    /**
     * Get cached data
     *
     * @param string $key Cache key
     * @return mixed|null Cached data or null if not found/expired
     */
    public function get($key)
    {
        if (!$this->enabled) {
            return null;
        }

        $cacheFile = $this->getCacheKey($key);

        if (!file_exists($cacheFile)) {
            return null;
        }

        // Check if cache is expired
        if (time() - filemtime($cacheFile) > $this->ttl) {
            unlink($cacheFile);
            return null;
        }

        $data = file_get_contents($cacheFile);
        return unserialize($data);
    }

    /**
     * Store data in cache
     *
     * @param string $key Cache key
     * @param mixed $data Data to cache
     * @return bool Success status
     */
    public function set($key, $data)
    {
        if (!$this->enabled) {
            return false;
        }

        $cacheFile = $this->getCacheKey($key);
        $serialized = serialize($data);

        return file_put_contents($cacheFile, $serialized) !== false;
    }

    /**
     * Delete cached data
     */
    public function delete($key)
    {
        if (!$this->enabled) {
            return false;
        }

        $cacheFile = $this->getCacheKey($key);

        if (file_exists($cacheFile)) {
            return unlink($cacheFile);
        }

        return false;
    }

    /**
     * Clear all cache
     */
    public function clear()
    {
        if (!$this->enabled) {
            return false;
        }

        $files = glob($this->cachePath . '/*.cache');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        return true;
    }

    /**
     * Get or set cache with callback
     *
     * @param string $key Cache key
     * @param callable $callback Function to generate data if cache miss
     * @return mixed Cached or generated data
     */
    public function remember($key, callable $callback)
    {
        $cached = $this->get($key);

        if ($cached !== null) {
            return $cached;
        }

        $data = $callback();
        $this->set($key, $data);

        return $data;
    }
}
