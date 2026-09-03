# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app/auth-service

COPY auth-service/package.json auth-service/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY auth-service/ .
COPY proto/ /app/proto/

RUN yarn proto:gen
RUN yarn build

# Stage 2: production
FROM node:22-alpine
WORKDIR /app/auth-service
ENV NODE_ENV=production

COPY auth-service/package.json auth-service/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/auth-service/dist ./dist
COPY --from=build /app/proto /app/proto

USER node

EXPOSE 3001
CMD ["sh", "-c", "yarn migration:run:prod && node dist/main.js"]
