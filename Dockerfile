# syntax=docker/dockerfile:1
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ git

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

WORKDIR /app/apps/frontend

# Build workspace packages first (needed as dependencies)
RUN pnpm --filter @tasmil/adapter-sdk run build

ARG NEXT_PUBLIC_AI_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_STELLAR_NETWORK
ARG AI_INTERNAL_URL
ARG BACKEND_INTERNAL_URL
ENV NEXT_PUBLIC_AI_URL=$NEXT_PUBLIC_AI_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK
ENV AI_INTERNAL_URL=$AI_INTERNAL_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
# Allow Next.js compiler to use up to 4 GB RAM
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN --mount=type=cache,target=/app/apps/frontend/.next/cache \
    pnpm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

# ARG must be declared in THIS stage too — docker-compose passes --build-arg to all stages
ARG NEXT_PUBLIC_AI_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_STELLAR_NETWORK
ARG AI_INTERNAL_URL
ARG BACKEND_INTERNAL_URL

# Create non-root user early so COPY --chown can reference it
RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 --ingroup app app

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm

COPY --chown=app:app pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --chown=app:app apps/frontend ./apps/frontend
COPY --chown=app:app packages ./packages

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

WORKDIR /app/apps/frontend

COPY --from=builder --chown=app:app /app/apps/frontend/.next ./.next
COPY --from=builder --chown=app:app /app/apps/frontend/public ./public

EXPOSE 3000

ENV NEXT_PUBLIC_AI_URL=$NEXT_PUBLIC_AI_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK
ENV AI_INTERNAL_URL=$AI_INTERNAL_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
ENV NODE_ENV=production
ENV PORT=3000

# pnpm exec writes temp shim scripts to the working directory; the app user
# needs write access to /app (node_modules installed as root by pnpm).
RUN chown -R app:app /app
USER app

CMD ["pnpm", "exec", "next", "start"]
