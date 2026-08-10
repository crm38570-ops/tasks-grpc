# Task Management API

REST API для управления задачами с JWT-авторизацией. Каждый пользователь видит только свои задачи.

Стек: **NestJS 11** · **TypeORM** · **PostgreSQL** · **Passport/JWT** · **bcrypt** · **Swagger**

## Возможности

- Регистрация и вход по username/password (пароли хэшируются bcrypt)
- JWT-авторизация через Bearer-токен
- CRUD задач: создание, получение (с фильтрами и поиском), обновление статуса, удаление
- Статусы задач: `OPEN`, `IN_PROGRESS`, `DONE`
- Изоляция данных: пользователь видит только свои задачи
- Swagger-документация по адресу `/api` (в dev-режиме)
- Готовый Docker (мультистейджинг-сборка + docker-compose с PostgreSQL)

## Быстрый старт

```bash
# 1. Установка зависимостей
yarn install

# 2. Подготовка окружения (см. docs/configuration.md)
#    скопируйте .env.stage.dev и подставьте свои значения

# 3. Запуск в dev-режиме (с Postgres в Docker)
docker compose up -d postgres
yarn run start:dev
```

Сервер поднимется на `http://localhost:3000`, Swagger — на `http://localhost:3000/api`.

Полная настройка — в [docs/getting-started.md](docs/getting-started.md).

## Документация

| Раздел | Содержание |
|---|---|
| [Начало работы](docs/getting-started.md) | Установка, запуск, Docker, Swagger |
| [Архитектура](docs/architecture.md) | Модули, структура кода, поток запроса |
| [Конфигурация](docs/configuration.md) | Переменные окружения и валидация |
| [API: Auth](docs/api/auth.md) | Регистрация и вход |
| [API: Tasks](docs/api/tasks.md) | Работа с задачами |
| [Тестирование](docs/testing.md) | Юнит-тесты и покрытие |
| [Деплой](docs/deployment.md) | Продакшен-сборка |

## Структура репозитория

```
├── src/
│   ├── auth/      # регистрация, вход, JWT-стратегия, пользователи
│   ├── tasks/     # задачи: контроллер, сервис, репозиторий, DTO
│   ├── interceptors/  # глобальный интерцептор сериализации
│   ├── app.module.ts  # корневой модуль
│   ├── config.chema.ts # Joi-схема валидации окружения
│   └── main.ts    # точка входа
├── docs/          # документация проекта
├── Dockerfile     # мультистейджинг-сборка
└── docker-compose.yml  # Postgres + приложение
```

## Скрипты

```bash
yarn run start:dev   # dev-режим с watch
yarn run start:prod  # прод-режим (собранный dist)
yarn run build       # сборка в dist/
yarn run lint        # линтер
yarn run test        # юнит-тесты
yarn run test:cov    # юнит-тесты с покрытием
```
