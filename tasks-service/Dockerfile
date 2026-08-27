# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Stage 2: production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000
CMD ["sh", "-c", "yarn typeorm:run:prod && node dist/main"]
