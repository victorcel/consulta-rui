FROM oven/bun:1-slim
WORKDIR /app

COPY relay.js healthcheck.js ./

ENV PORT=3001
EXPOSE 3001
CMD ["bun", "relay.js"]