#build frontend

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npm run build

#Run frontend
FROM nginx:stable AS runtime

ENV NGINX_ENVSUBST_FILTER=^BACKEND_URL$


COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template