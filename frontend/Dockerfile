FROM node:20.16.0 AS builder

WORKDIR /app

COPY . .
RUN npm install -g pnpm@9.7.1
RUN pnpm install

COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html