import redis
import os
import json
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Create Redis client (lazy initialization)
_redis_client = None

def get_redis_client():
    """Get or create Redis client singleton"""
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            logger.warning("REDIS_URL not configured, caching disabled")
            return None
        
        try:
            _redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Don't test connection here - it blocks requests if Redis is down
            # Connection will be tested on first use
            logger.info("Redis client initialized (connection will be tested on first use)")
        except Exception as e:
            logger.error(f"Failed to create Redis client: {e}")
            _redis_client = None
    
    return _redis_client

# Dashboard caching
def get_dashboard_cache(org_id: str) -> Optional[dict]:
    """Get cached dashboard data for an organization"""
    client = get_redis_client()
    if not client:
        return None
    
    try:
        key = f"dashboard:{org_id}"
        data = client.get(key)
        if data:
            logger.info(f"Cache HIT for dashboard:{org_id}")
            return json.loads(data)
        logger.info(f"Cache MISS for dashboard:{org_id}")
        return None
    except Exception as e:
        logger.error(f"Cache read error for {org_id}: {e}")
        return None

def set_dashboard_cache(org_id: str, data: dict, ttl: int = 300):
    """
    Cache dashboard data for an organization
    Default TTL: 5 minutes (300 seconds)
    """
    client = get_redis_client()
    if not client:
        return
    
    try:
        key = f"dashboard:{org_id}"
        client.setex(key, ttl, json.dumps(data))
        logger.info(f"Cached dashboard data for {org_id} (TTL: {ttl}s)")
    except Exception as e:
        logger.error(f"Cache write error for {org_id}: {e}")

def invalidate_dashboard_cache(org_id: str):
    """Clear dashboard cache when data changes"""
    client = get_redis_client()
    if not client:
        return
    
    try:
        key = f"dashboard:{org_id}"
        deleted = client.delete(key)
        if deleted:
            logger.info(f"Invalidated dashboard cache for {org_id}")
    except Exception as e:
        logger.error(f"Cache invalidation error for {org_id}: {e}")

# Generic caching utilities
def cache_set(key: str, value: dict, ttl: int = 300):
    """Set a cache key with TTL"""
    client = get_redis_client()
    if not client:
        return
    
    try:
        client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        logger.error(f"Cache set error for {key}: {e}")

def cache_get(key: str) -> Optional[dict]:
    """Get a cache key"""
    client = get_redis_client()
    if not client:
        return None
    
    try:
        data = client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.error(f"Cache get error for {key}: {e}")
        return None

def cache_delete(key: str):
    """Delete a cache key"""
    client = get_redis_client()
    if not client:
        return
    
    try:
        client.delete(key)
    except Exception as e:
        logger.error(f"Cache delete error for {key}: {e}")
