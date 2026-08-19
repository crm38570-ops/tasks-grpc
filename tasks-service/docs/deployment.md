# Деплой

## Docker-образ

[Dockerfile](../Dockerfile) — мультистейджинговая сборка:

1. **build** — `node:22-alpine`, установка зависимостей через `yarn install --frozen-lockfile`, сборка `yarn build` → `dist/`.
2. **production** — чистый `node:22-alpine`, только production-зависимости (`yarn install --production`), копируется `dist/`. Приложение запускается под пользователем `node` (не root). Порт: `3000`.

```bash
# сборка и запуск вручную
docker build -t task-api .
docker run -p 3000:3000 \
  -e STAGE=prod \
  -e DB_HOST=... -e DB_PORT=5432 -e DB_USERNAME=... -e DB_PASSWORD=... -e DB_DATABASE=... \
  -e JWT_SECRET=... -e JWT_EXPIRES_IN=3600s \
  task-api
```

## Docker Compose

[docker-compose.yml](../docker-compose.yml) поднимает два сервиса:

| Сервис | Что делает |
|---|---|
| `postgres` | PostgreSQL 18, БД `task-management`, healthcheck `pg_isready`; данные в volume `pgdata` |
| `app` | сборка из Dockerfile, ждёт готовности postgres (`depends_on.condition: service_healthy`), пробрасывает порт `3000` |

```bash
docker compose up --build     # полный запуск
docker compose up -d postgres # только БД (для локальной разработки)
```

## Продакшен-заметки

- **`STAGE=prod`**: выключается Swagger (`main.ts` проверяет `process.env.STAGE !== 'prod'`), приложение стартует из `dist/` через `start:prod` (или `node dist/main` в контейнере).
- **`JWT_SECRET`** — обязательно надёжный секрет, не из дефолтов compose.
- **`synchronize: true`** в конфигурации TypeORM автоматически синхронизирует схему БД с сущностями. Для продакшена стоит рассмотреть миграции (TypeORM миграции в проекте пока не настроены).
- Переменные окружения для контейнера задаются в `environment` сервиса или через файл `env_file` — в любом случае за пределами репозитория (`.env.stage.*` игнорируется git).
