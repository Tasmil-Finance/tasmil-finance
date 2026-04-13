# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/frontend
RUN pnpm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/apps/frontend/next.config.ts ./next.config.ts
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=https://backend.tasmil-finance.xyz

CMD ["pnpm", "run", "start"]
