import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { loadConfig } from "@imizi/config";
import { PlatformStore } from "./store/platform.store";
import { DatabaseService } from "./infra/database.service";
import { RequestIdInterceptor } from "./common/request-id.interceptor";
import { AuthGuard } from "./common/auth.guard";
import { HealthController } from "./modules/health/health.controller";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthService } from "./modules/auth/auth.service";
import { UsersController } from "./modules/users/users.controller";
import { PropertiesController } from "./modules/properties/properties.controller";
import { PropertiesService } from "./modules/properties/properties.service";
import { ListingsController } from "./modules/listings/listings.controller";
import { SearchController } from "./modules/search/search.controller";
import { SearchService } from "./modules/search/search.service";
import { MapsController } from "./modules/maps/maps.controller";
import { FavoritesController } from "./modules/favorites/favorites.controller";
import { BookingsController } from "./modules/bookings/bookings.controller";
import { BookingsService } from "./modules/bookings/bookings.service";
import { PaymentsController } from "./modules/payments/payments.controller";
import { PaymentsService } from "./modules/payments/payments.service";
import { OffersController } from "./modules/offers/offers.controller";
import { MessagesController, MessagesGateway } from "./modules/messages/messages.controller";
import { ReviewsController } from "./modules/reviews/reviews.controller";
import { VerificationController } from "./modules/verification/verification.controller";
import { NotificationsController } from "./modules/notifications/notifications.controller";
import { AgenciesController } from "./modules/agencies/agencies.controller";
import { AdminController } from "./modules/admin/admin.controller";
import { MediaController } from "./modules/media/media.controller";
import { MaintenanceController } from "./modules/maintenance/maintenance.controller";
import { AnalyticsController } from "./modules/analytics/analytics.controller";
import { PrivacyController } from "./modules/privacy/privacy.controller";
import { JobsService } from "./modules/jobs/jobs.service";
import { ViewingsController } from "./modules/viewings/viewings.controller";
import { LeasesController } from "./modules/leases/leases.controller";
import { RecommendationsController } from "./modules/recommendations/recommendations.controller";
import { CatalogController } from "./modules/catalog/catalog.controller";
import { Dependencies } from "./infra/dependencies";

const config = loadConfig();

@Module({
  imports: [
    JwtModule.register({ secret: config.jwtAccessSecret, signOptions: { expiresIn: "15m" } }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "auth", ttl: 60_000, limit: 20 },
      { name: "search", ttl: 60_000, limit: 60 },
      { name: "payments", ttl: 60_000, limit: 10 },
      { name: "upload", ttl: 60_000, limit: 15 },
    ]),
  ],
  controllers: [
    HealthController, AuthController, UsersController, PropertiesController, ListingsController, SearchController,
    MapsController, FavoritesController, BookingsController, PaymentsController, OffersController, MessagesController,
    ReviewsController, VerificationController, NotificationsController, AgenciesController, AdminController, MediaController,
    MaintenanceController, AnalyticsController, PrivacyController, ViewingsController, LeasesController, RecommendationsController, CatalogController,
  ],
  providers: [
    DatabaseService, PlatformStore, Dependencies, AuthService, PropertiesService, SearchService, BookingsService, PaymentsService,
    MessagesGateway, JobsService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class AppModule {}
