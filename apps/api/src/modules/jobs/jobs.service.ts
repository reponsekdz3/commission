import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PlatformStore } from "../../store/platform.store";
import { Dependencies } from "../../infra/dependencies";

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly log = new Logger(JobsService.name);
  constructor(
    private readonly store: PlatformStore,
    private readonly deps: Dependencies,
  ) {}

  onModuleInit() {
    setInterval(() => this.drain(), 2000).unref();
  }

  drain() {
    for (const job of this.store.jobs.filter((j) => !j.done)) {
      job.done = true;
      if (job.name === "search.index") {
        const payload = job.payload as { propertyId?: string; listingId?: string };
        const listing = payload.listingId
          ? this.store.listings.get(payload.listingId)
          : [...this.store.listings.values()].find((l) => l.propertyId === payload.propertyId);
        if (listing) {
          const property = this.store.properties.get(listing.propertyId);
          void this.deps.indexListing({ ...listing, property });
        }
      }
      this.log.debug(`Processed ${job.name}`);
    }
  }
}
