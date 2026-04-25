FROM node:20-alpine AS builder
WORKDIR /app

# Copy the full monorepo (needed for workspace packages)
COPY . .

# Install all dependencies
RUN npm ci

# Generate Prisma client for the current OS/arch
RUN cd packages/db && npx prisma generate

# Build the web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@klickkk/web

# ---- Minimal production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_TRUST_HOST=true

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output mirrors monorepo layout (outputFileTracingRoot = repo root)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static

USER nextjs

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
