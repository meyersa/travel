import NodeCache from "node-cache";

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL) || 3600; 
const cache = new NodeCache({ stdTTL: DEFAULT_TTL });

export function getCache(id) {
  const data = cache.get(id);
  if (data) {
    console.log(`Cache hit for ID: ${id}`);
    return data;
  } else {
    console.log(`Cache miss for ID: ${id}`);
    return null;
  }
}

export function setCache(id, value, ttl = DEFAULT_TTL) {
  console.log(`Cache set for ID: ${id}`);
  cache.set(id, value, ttl);

}

export function resetCache(id) {
  console.log(`Cache reset for ID: ${id}`);
  cache.del(id);

}

