FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S imizi && adduser -S imizi -G imizi
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages ./packages
USER imizi
EXPOSE 4000
CMD ["node","apps/api/dist/main.js"]
