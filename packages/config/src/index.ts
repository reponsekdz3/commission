export function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function loadConfig() {
  const env = process.env.NODE_ENV ?? "development";
  const isProduction = env === "production";
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (isProduction && (!jwtAccessSecret || jwtAccessSecret.length < 32 || !jwtRefreshSecret || jwtRefreshSecret.length < 32)) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must each be at least 32 characters in production");
  }
  return {
    env,
    port: Number(process.env.PORT ?? 4000),
    apiPrefix: process.env.API_PREFIX ?? "/api/v1",
    jwtAccessSecret: jwtAccessSecret ?? "dev-access-secret-change-me-32chars",
    jwtRefreshSecret: jwtRefreshSecret ?? "dev-refresh-secret-change-me-32chars",
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    opensearchUrl: process.env.OPENSEARCH_URL ?? "http://localhost:9200",
    defaultCurrency: process.env.DEFAULT_CURRENCY ?? "RWF",
    defaultCountry: process.env.DEFAULT_COUNTRY ?? "RW",
    commissionBps: Number(process.env.PLATFORM_COMMISSION_BPS ?? 500),
    sentryDsn: process.env.SENTRY_DSN,
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
