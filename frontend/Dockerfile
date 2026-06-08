# ==========================================
# STAGE 1: Install dependencies
# ==========================================
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Install dependencies exclusively using bun
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ==========================================
# STAGE 2: Rebuild the source code
# ==========================================
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# The build command using bun
RUN bun run build

# ==========================================
# STAGE 3: Production runner
# ==========================================
# We use node for the runner because Next.js standalone server output natively runs on Node
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
