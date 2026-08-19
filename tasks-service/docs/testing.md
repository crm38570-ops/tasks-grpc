# Тестирование

Проект использует **Jest** (через `ts-jest`). Конфигурация встроена в `package.json`: тесты ищутся в `src/` по маске `*.spec.ts`, окружение — node.

## Команды

| Команда | Что делает |
|---|---|
| `yarn run test` | юнит-тесты (однократно, `STAGE=dev`) |
| `yarn run test:watch` | тесты в watch-режиме |
| `yarn run test:cov` | тесты с отчётом о покрытии (отчёт в `coverage/`) |
| `yarn run test:debug` | тесты под отладчиком (`--inspect-brk`) |

## Существующие тесты

- `src/tasks/tasks.service.spec.ts` — юнит-тесты `TasksService` с моком `TasksRepository`.

## Как писать тесты

- Файлы тестов кладите рядом с кодом: `*.spec.ts` (например, `auth.service.spec.ts`).
- Тестируйте сервисы с замоканными репозиториями (через `@nestjs/testing` `Test.createTestingModule`): бизнес-логика тестируется изолированно от БД.
- `STAGE=dev` задаётся только в команде `yarn run test` (через `cross-env`); `test:watch`, `test:cov` и `test:debug` его не подставляют.
