import NodeCache from "node-cache";
import { logger } from "./logger.js";

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL) || 3600; 
const cache = new NodeCache({ stdTTL: DEFAULT_TTL });

export function getCache(id) {
  const data = cache.get(id);
  if (data) {
    logger.info(`Cache hit for ID: ${id}`);
    return data;
  } else {
    logger.info(`Cache miss for ID: ${id}`);
    return null;
  }
}

export function setCache(id, value, ttl = DEFAULT_TTL) {
  logger.info(`Cache set for ID: ${id}`);
  cache.set(id, value, ttl);

}

export function resetCache(id) {
  logger.info(`Cache reset for ID: ${id}`);
  cache.del(id);

}

