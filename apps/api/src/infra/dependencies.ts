import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { loadConfig } from "@imizi/config";

@Injectable()
export class Dependencies implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(Dependencies.name);
  redis?: Redis;
  redisOk = false;
  searchOk = false;
  storageOk = true;
  paymentOk = true;

  async onModuleInit() {
    const config = loadConfig();
    try {
      this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true, enableOfflineQueue: false });
      await this.redis.connect();
      await this.redis.ping();
      this.redisOk = true;
    } catch (err) {
      this.log.warn(`Redis unavailable — using in-process cache. ${(err as Error).message}`);
      this.redisOk = false;
    }
    try {
      const res = await fetch(`${config.opensearchUrl}/_cluster/health`, { signal: AbortSignal.timeout(1500) });
      this.searchOk = res.ok;
    } catch {
      this.log.warn("OpenSearch unavailable — PostgreSQL/in-memory ranked search is the fallback.");
      this.searchOk = false;
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async cacheGet<T>(key: string): Promise<T | undefined> {
    if (!this.redisOk || !this.redis) return undefined;
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }

  async cacheSet(key: string, value: unknown, ttlSeconds = 15) {
    if (!this.redisOk || !this.redis) return;
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async indexListing(doc: Record<string, unknown>) {
    const config = loadConfig();
    if (!this.searchOk) return;
    await fetch(`${config.opensearchUrl}/listings/_doc/${doc.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(doc),
    }).catch(() => {
      this.searchOk = false;
    });
  }
}
