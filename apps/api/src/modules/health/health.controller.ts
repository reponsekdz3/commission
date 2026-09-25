import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "../../common/public.decorator";
import { PlatformStore } from "../../store/platform.store";
import { Dependencies } from "../../infra/dependencies";

@Controller()
export class HealthController {
  constructor(
    private readonly store: PlatformStore,
    private readonly deps: Dependencies,
  ) {}

  @Public()
  @Get("/health")
  health() {
    return this.snapshot();
  }

  @Public()
  @Get("/ready")
  ready() {
    const snap = this.snapshot();
    return { ...snap, ready: snap.api && snap.database && snap.redis };
  }

  @Public()
  @Get("/live")
  live() {
    return { status: "ok" };
  }

  @Public()
  @Header("content-type", "text/plain")
  @Get("/metrics")
  metrics() {
    const snap = this.snapshot();
    return [
      `# HELP imizi_users User count`,
      `# TYPE imizi_users gauge`,
      `imizi_users ${snap.users}`,
      `# HELP imizi_properties Property count`,
      `# TYPE imizi_properties gauge`,
      `imizi_properties ${snap.properties}`,
      `# HELP imizi_bookings Booking count`,
      `# TYPE imizi_bookings gauge`,
      `imizi_bookings ${this.store.bookings.size}`,
      `# HELP imizi_redis_up Redis connectivity`,
      `# TYPE imizi_redis_up gauge`,
      `imizi_redis_up ${this.deps.redisOk ? 1 : 0}`,
      `# HELP imizi_search_up OpenSearch connectivity`,
      `# TYPE imizi_search_up gauge`,
      `imizi_search_up ${this.deps.searchOk ? 1 : 0}`,
    ].join("\n");
  }

  private snapshot() {
    return {
      status: "ok",
      api: true,
      database: this.deps.databaseOk,
      redis: this.deps.redisOk,
      search: this.deps.searchOk,
      searchFallback: this.deps.searchOk ? "opensearch" : "postgres_ranked",
      storage: this.deps.storageOk,
      payment: this.deps.paymentOk,
      users: this.store.users.size,
      properties: this.store.properties.size,
      jobs: this.store.jobs.length,
    };
  }
}
