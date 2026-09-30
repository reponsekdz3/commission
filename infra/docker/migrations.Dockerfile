FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/database/package.json packages/database/package.json
RUN npm install --omit=dev

COPY packages/database ./packages/database

ENV DATABASE_URL=postgresql://imizi:[REDACTED]@postgres:5432/imizi?schema=public

ENTRYPOINT ["sh", "-c"]
CMD ["npm run migrate -w @imizi/database && npm run seed -w @imizi/database"]
