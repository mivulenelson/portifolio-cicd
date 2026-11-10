# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 8 && npm config set fetch-retry-mintimeout 20000
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# Build identifier shown in the site footer (the git commit SHA in CI)
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
# nginx renders this template at startup (BACKEND_HOST: 'backend' in compose, '127.0.0.1' on ECS Fargate)
ENV BACKEND_HOST=backend \
    NGINX_ENVSUBST_FILTER=^BACKEND_
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
