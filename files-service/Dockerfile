FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn proto:gen
RUN yarn build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/storage
RUN chown -R node:node /app

USER node

EXPOSE 50051

CMD ["node", "dist/main.js"]