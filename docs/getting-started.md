# Начало работы

## Требования

- Node.js **22** (см. Dockerfile)
- Пакетный менеджер **yarn** (`npm install -g yarn`)
- PostgreSQL (локально или через Docker)

## Установка

```bash
yarn install
```

## Конфигурация окружения

Приложение загружает переменные из файла `.env.stage.<STAGE>`, где `<STAGE>` — значение переменной окружения `STAGE` (`dev` или `prod`). В репозитории лежат образцы:

- `.env.stage.dev` — для локальной разработки
- `.env.stage.prod` — шаблон для продакшена

Скопируйте образец и подставьте свои значения:

```bash
cp .env.stage.dev .env.stage.dev
```

> Файлы `.env.stage.*` игнорируются git (см. `.gitignore`). Если `STAGE` не задана — приложение не запустится: переменная `STAGE` обязательна (Joi-валидация).

Полный список переменных — в [configuration.md](configuration.md).

## Запуск

### Dev-режим (watch)

```bash
yarn run start:dev
```

Команда сама подставляет `STAGE=dev` (через `cross-env`), поэтому файл `.env.stage.dev` будет найден автоматически.

### Prod-режим

```bash
yarn run build
yarn run start:prod
```

### PostgreSQL через Docker (рекомендуется для локальной разработки)

```bash
# поднять только базу
docker compose up -d postgres
```

По умолчанию compose создаёт БД `task-management` с логином/паролем `postgres`/`postgres` на порту `5432` — совпадает с `.env.stage.dev`. Если ваши локальные параметры БД другие — поправьте `.env.stage.dev`.

### Всё приложение в Docker

```bash
docker compose up --build
```

Поднимет и Postgres, и приложение (порт `3000`). Подробнее — в [deployment.md](deployment.md).

## Проверка работоспособности

1. Откройте Swagger: `http://localhost:3000/api` (доступен, когда `STAGE != prod`).
2. Зарегистрируйтесь через `POST /auth/signup`, затем войдите через `POST /auth/signin` и используйте полученный токен.

Примеры запросов — в [api/auth.md](api/auth.md) и [api/tasks.md](api/tasks.md).

## Полезные команды

```bash
yarn run start:debug  # dev-режим с отладчиком
yarn run lint         # eslint с авто-исправлением
yarn run format       # prettier
yarn run test         # юнит-тесты
```
