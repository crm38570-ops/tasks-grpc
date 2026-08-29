# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app/tasks-service

COPY tasks-service/package.json tasks-service/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tasks-service/ .
COPY proto/ /app/proto/
RUN yarn build

# Stage 2: production
FROM node:22-alpine
WORKDIR /app/tasks-service
ENV NODE_ENV=production

COPY tasks-service/package.json tasks-service/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/tasks-service/dist ./dist
COPY --from=build /app/proto /app/proto

USER node

EXPOSE 3000
CMD ["sh", "-c", "yarn typeorm:run:prod && node dist/main"]
