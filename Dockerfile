# =========================
# Builder
# =========================
FROM node:20-bullseye AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable || true
RUN npm install -g pnpm@10 || true
RUN (pnpm install --frozen-lockfile --no-audit --no-fund 2>/dev/null) || npm install --no-audit --no-fund

COPY . .
RUN npm run build


# =========================
# Runtime — nginx
# =========================
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]