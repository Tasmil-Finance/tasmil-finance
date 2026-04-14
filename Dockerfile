# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install Python and build dependencies for native modules (usb, tiny-secp256k1)
RUN apk add --no-cache python3 make g++ git

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile --ignore-scripts

WORKDIR /app/apps/frontend
RUN pnpm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public

WORKDIR /app/apps/frontend

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=https://backend.tasmil-finance.xyz

CMD ["pnpm", "exec", "next", "start"]
