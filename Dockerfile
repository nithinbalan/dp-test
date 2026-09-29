# syntax=docker/dockerfile:1

# ============================================================
# Dependencies
# ============================================================
FROM node:22-bookworm-slim AS dependencies

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# ============================================================
# Builder
# ============================================================
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@9.12.0 --activate

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Build-time environment variables.
# These are supplied by GitHub Actions.
ARG DATABASE_URL
ARG APP_BASE_DOMAIN
ARG AUTH_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV APP_BASE_DOMAIN=$APP_BASE_DOMAIN
ENV AUTH_SECRET=$AUTH_SECRET

RUN pnpm build


# ============================================================
# Production runtime
# ============================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Public assets
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
