# MCS Monorepo

MCS — монорепозиторий приложения на NestJS. Внешний REST API предоставляет `gateway`, а внутреннее взаимодействие сервисов выполняется по gRPC.

## Состав проекта

- `gateway` — REST-шлюз, Swagger и проверка JWT. Основные маршруты: `/auth`, `/tasks`, `/health`.
- `auth-service` — регистрация, вход и выпуск JWT-токенов.
- `tasks-service` — управление задачами и хранение их в PostgreSQL.
- `postgres` — база данных для сервисов авторизации и задач.
- `proto` — единый источник gRPC-контрактов.
- `docker-compose.yml` — конфигурация запуска всего стека.

## Быстрый запуск

Требования: Docker с поддержкой Compose. Для локальной разработки также понадобятся Node.js 22 и Yarn.

1. Создайте файл окружения из шаблона:

   ```bash
   cp .env.example .env
   ```

   В Windows PowerShell используйте `Copy-Item .env.example .env`. При необходимости измените значения в `.env`, особенно секреты и пароли.

2. Соберите и запустите приложение:

   ```bash
   docker compose up --build
   ```

После запуска:

- REST API доступен по адресу `http://localhost:3000`;
- Swagger — `http://localhost:3000/api`;
- health check — `http://localhost:3000/health`.

Для остановки контейнеров выполните:

```bash
docker compose down
```

Данные PostgreSQL сохраняются в Docker volume `postgres-data`. Чтобы посмотреть логи отдельного сервиса, используйте, например, `docker compose logs -f gateway`.

## Основные сценарии API

Сначала зарегистрируйте пользователя через `POST /auth/signup` или выполните вход через `POST /auth/signin`. Полученный JWT передавайте в заголовке `Authorization: Bearer <token>` при работе с защищёнными маршрутами задач:

- `POST /tasks` — создать задачу;
- `GET /tasks` — получить список задач текущего пользователя;
- `GET /tasks/:id` — получить задачу;
- `PATCH /tasks/:id/status` — изменить статус;
- `DELETE /tasks/:id` — удалить задачу.

Полные схемы запросов и ответов доступны в Swagger.

## Proto-контракты

Все `.proto`-файлы хранятся только в корневой папке `proto/`:

- `proto/auth` — контракт авторизации;
- `proto/tasks` — публичный контракт задач;
- `proto/tasks_internal` — внутренний контракт задач.

Сгенерированные TypeScript-модули находятся в `src/proto/**/generated` соответствующих сервисов и являются производными файлами. После изменения контракта запускайте генерацию в каждом затронутом сервисе:

```bash
cd auth-service     # если затронут auth
yarn proto:gen

cd ../gateway       # если затронут gateway
yarn proto:gen

cd ../tasks-service # если затронут tasks-service
yarn proto:gen
```

Набор proto для генерации задаётся в поле `mcs.protos` в `package.json` каждого сервиса. Копии контрактов внутри `src/proto` вручную не редактируются.

## Локальная разработка

У каждого сервиса собственные `package.json` и `yarn.lock`. Перейдите в каталог нужного сервиса, установите зависимости и используйте его npm-скрипты:

```bash
cd gateway
yarn install
yarn start:dev
```

Аналогичные команды доступны в `auth-service` и `tasks-service`. Для сборки и тестов сервиса используются:

```bash
yarn build
yarn test
```
