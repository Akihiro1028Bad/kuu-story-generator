FROM node:24-bookworm-slim

WORKDIR /app

# pnpm via Corepack
RUN corepack enable
ENV PNPM_STORE_DIR=/pnpm/store

EXPOSE 3000

CMD ["pnpm", "dev"]


