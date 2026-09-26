FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
RUN npm run build -w @imizi/web

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S imizi && adduser -S imizi -G imizi
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER imizi
EXPOSE 3000
CMD ["node","apps/web/server.js"]
