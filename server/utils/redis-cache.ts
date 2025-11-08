import { Redis } from "@upstash/redis";
import { VideosResponse } from "@shared/api";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn("⚠️  Upstash Redis not configured. Using in-memory cache only.");
    console.warn("   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable persistent caching.");
    return null;
  }
  
  try {
    redisClient = new Redis({
      url,
      token,
    });
    console.log("✅ Upstash Redis connected");
    return redisClient;
  } catch (error) {
    console.error("❌ Failed to connect to Upstash Redis:", error);
    return null;
  }
}

const REDIS_CACHE_KEY = "upnshare:videos:all";
const REDIS_CACHE_TTL = 5 * 60;

export async function getFromRedisCache(): Promise<VideosResponse | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cached = await redis.get(REDIS_CACHE_KEY);
    if (!cached) return null;
    
    console.log("✅ Retrieved data from Redis cache");
    const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
    
    if (parsed && parsed.videos && parsed.folders && typeof parsed.total === 'number') {
      return parsed as VideosResponse;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error reading from Redis:", error);
    return null;
  }
}

export async function setRedisCache(data: VideosResponse): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.setex(REDIS_CACHE_KEY, REDIS_CACHE_TTL, JSON.stringify(data));
    console.log("✅ Cached data in Redis (TTL: 5min)");
  } catch (error) {
    console.error("❌ Error writing to Redis:", error);
  }
}

export async function invalidateRedisCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.del(REDIS_CACHE_KEY);
    console.log("✅ Invalidated Redis cache");
  } catch (error) {
    console.error("❌ Error invalidating Redis cache:", error);
  }
}
