FROM node:22-alpine AS build

WORKDIR /app/files-service

COPY shared/ /app/shared/
COPY files-service/package.json files-service/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY files-service/ .
COPY proto/ /app/proto/

RUN yarn proto:gen
RUN yarn build

FROM node:22-alpine AS production

WORKDIR /app/files-service

ENV NODE_ENV=production

COPY shared/ /app/shared/
COPY files-service/package.json files-service/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/files-service/dist ./dist
COPY --from=build /app/proto /app/proto

RUN mkdir -p /app/storage
RUN chown -R node:node /app

USER node

EXPOSE 50051
CMD ["sh", "-c", "yarn typeorm:run:prod && node dist/main.js"]
