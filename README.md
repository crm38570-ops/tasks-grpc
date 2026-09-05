# MCS Monorepo

Монорепозиторий микросервисов на NestJS: gateway (REST) + три gRPC-сервиса (auth, tasks, files).

## Структура

- `gateway` — REST-шлюз для внешних клиентов, проксирует запросы в сервисы по gRPC; Swagger на `/api`.
- `auth-service` — регистрация/аутентификация (JWT), выдаёт и валидирует identity.
- `tasks-service` — gRPC-сервис управления задачами.
- `files-service` — gRPC-сервис хранения и управления файлами; проверяет владение задачей через tasks-service.
- `proto` — единственный источник gRPC-контрактов (`auth`, `tasks`, `files`, `tasks_internal`). Правки вносятся только здесь, затем генерируются в сервисы скриптом `scripts/generate-protos.js`.
- `postgres` — инициализация баз данных PostgreSQL.
- `docker-compose.yml` — подъём всего стека.

Внутренний транспорт (gateway → сервисы, files → tasks) — только gRPC. Ownership данных проверяет владелец: tasks-service фильтрует по `userId` из proto-запроса, files-service — по `file.userId`.

## Запуск

1. Скопируйте `.env.example` в `.env` и при необходимости измените значения.
2. Запустите все сервисы:

   ```bash
   docker compose up --build
   ```

После запуска REST API доступен на `http://localhost:3000`, а Swagger — на `http://localhost:3000/api`.

Остановить сервисы можно командой:

```bash
docker compose down
```

## Локальная разработка

Для запуска сервисов отдельно перейдите в нужный каталог, установите зависимости и используйте команды из его `package.json`.

Проект использует Node.js 22, Yarn и PostgreSQL.

## Проверки

В каждом сервисе доступны команды сборки и тестирования:

```bash
yarn build
yarn test
```
