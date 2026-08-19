# Документация проекта Task Management API

Эта документация — единый источник истины о проекте. Она рассчитана и на людей, и на ИИ-агентов: каждая тема разбита на отдельный файл, внутри файлов — только существенная информация.

## О проекте

REST API на NestJS для управления личными задачами: JWT-авторизация, CRUD задач, изоляция данных между пользователями. Подробнее — в [README.md](../README.md).

## Порядок чтения

Для быстрого погружения читай в таком порядке:

1. [getting-started.md](getting-started.md) — как установить и запустить проект
2. [architecture.md](architecture.md) — как устроен код: модули и поток запроса
3. [configuration.md](configuration.md) — переменные окружения
4. [api/auth.md](api/auth.md) и [api/tasks.md](api/tasks.md) — REST API
5. [testing.md](testing.md) — тесты
6. [deployment.md](deployment.md) — продакшен

## Карта документации

| Файл | Для кого | Содержание |
|---|---|---|
| [getting-started.md](getting-started.md) | Все | Установка, конфигурация окружения, запуск, Docker, Swagger |
| [architecture.md](architecture.md) | Разработчики, агенты | Модули, структура папок, поток запроса, сущности, безопасность |
| [configuration.md](configuration.md) | Все | Все переменные окружения, файлы `.env.stage.*`, Joi-валидация |
| [api/auth.md](api/auth.md) | Клиенты API | Эндпоинты регистрации и входа |
| [api/tasks.md](api/tasks.md) | Клиенты API | Эндпоинты работы с задачами |
| [testing.md](testing.md) | Разработчики | Команды запуска тестов, как писать тесты |
| [deployment.md](deployment.md) | DevOps | Docker-сборка, продакшен-запуск |

## Соглашения

- Пакетный менеджер — **yarn** (не npm).
- Node.js **22**, PostgreSQL.
- Коммиты — [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Вся документация должна оставаться актуальной: **любое изменение кода, структуры, конфигурации или зависимостей требует обновления этих файлов**.
- Язык документации — русский; названия эндпоинтов и переменных — как в коде.
