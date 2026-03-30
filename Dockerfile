FROM oven/bun:1.3 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3

LABEL fly_launch_runtime="bun"

WORKDIR /app
ENV NODE_ENV=production
ENV BUN_ENV=production

COPY --from=builder /app /app

EXPOSE 8080

CMD ["bun", "run", "start"]
