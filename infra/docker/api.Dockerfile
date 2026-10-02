FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/validation/package.json packages/validation/package.json
COPY packages/maps/package.json packages/maps/package.json
COPY packages/payments/package.json packages/payments/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm install --omit=dev=false

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:packages && npm run build -w @imizi/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/domain/dist ./packages/domain/dist
COPY --from=build /app/packages ./packages
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "apps/api/dist/main.js"]
