# Конфигурация

Приложение конфигурируется через переменные окружения. Загрузка выполняется `ConfigModule.forRoot()` в [app.module.ts](../src/app.module.ts) из файла `.env.stage.<STAGE>`, где `STAGE` — имя стадии (`dev`, `prod`). Все переменные проходят валидацию Joi-схемой из [config.chema.ts](../src/config.chema.ts).

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `STAGE` | да | — | Стадия (`dev` / `prod`). Определяет, какой `.env.stage.*` загружать; при `prod` отключается Swagger |
| `PORT` | нет | `3000` | HTTP-порт приложения (читается в `main.ts`, в `.env.stage.dev` есть свой `PORT`) |
| `DB_HOST` | да | — | Хост PostgreSQL |
| `DB_PORT` | да | `5432` | Порт PostgreSQL |
| `DB_USERNAME` | да | — | Пользователь БД |
| `DB_PASSWORD` | да | — | Пароль пользователя БД |
| `DB_DATABASE` | да | — | Имя базы данных |
| `JWT_SECRET` | да | — | Секрет для подписи JWT-токенов. В продакшене — обязательно сгенерируйте надёжный секрет |
| `JWT_EXPIRES_IN` | да | — | Срок жизни токена, например `3600` (секунд) или `1d` |

Если обязательная переменная отсутствует или не проходит валидацию — приложение не запустится с ошибкой Joi.

## Файлы `.env.stage.*`

- Файлы игнорируются git (правило `.env.stage.*` в `.gitignore`) — содержимое не должно попадать в репозиторий.
- Образцы: `.env.stage.dev` (локальная разработка), `.env.stage.prod` (шаблон продакшена).
- При добавлении новой стадии `STAGE=<name>` создайте файл `.env.stage.<name>`.

## Как STAGE попадает в приложение

- `yarn run start:dev` / `start:debug` / `test` — `cross-env STAGE=dev ...` (задаётся в `package.json`).
- `yarn run start:prod` — `cross-env STAGE=prod ...`.
- Docker: `STAGE` задаётся в `environment` сервиса в [docker-compose.yml](../docker-compose.yml).

## Docker Compose

[docker-compose.yml](../docker-compose.yml) переопределяет переменные для сервиса `app` напрямую (без файлов `.env.stage.*`): `DB_HOST=postgres`, порт `5432`, `postgres`/`postgres`, БД `task-management`, `JWT_SECRET=dev-secret-change-me`, `JWT_EXPIRES_IN=3600s`.

> Для продакшена в docker-compose обязательно замените `JWT_SECRET` на надёжный.

## Пример `.env.stage.dev`

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_DATABASE=task-management

JWT_SECRET=47f62c5095696de914a1eca0cef2a393
JWT_EXPIRES_IN=3600
```
