# Stage 1: build
FROM node:22-alpine AS build

WORKDIR /app/gateway

COPY gateway/package.json gateway/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY gateway/ .
COPY proto/ /app/proto/

RUN yarn proto:gen
RUN yarn build

# Stage 2: production
FROM node:22-alpine AS production

WORKDIR /app/gateway

ENV NODE_ENV=production

COPY gateway/package.json gateway/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/gateway/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
