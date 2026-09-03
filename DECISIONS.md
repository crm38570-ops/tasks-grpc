# DECISIONS.md

Журнал архитектурных решений. Новые записи добавляются сверху.

## 03.09.2026 — Канон команд миграций: `typeorm:*` + `tsconfig.typeorm.json`

**Решение.** Во всех сервисах скрипты миграций называются `typeorm:show`,
`typeorm:generate`, `typeorm:run`, `typeorm:revert`, `typeorm:run:prod`
(и base-скрипты `typeorm` / `typeorm:prod`). Механизм: `ts-node --project
tsconfig.typeorm.json node_modules/typeorm/cli.js -d src/database/data-source.ts`,
где `tsconfig.typeorm.json` переопределяет `module`/`moduleResolution` на
`commonjs`/`node` (основной tsconfig сервисов — `nodenext`, который ломает
ts-node для CLI).

**Причина.** Единообразие между сервисами; prod-скрипты зашиты в Dockerfile
(`yarn typeorm:run:prod && node dist/main`), расхождение имён стреляет на
деплое. Альтернатива `typeorm-ts-node-commonjs` (официальный bin) работала,
но вела к второму способу обхода nodenext в одном сервисе.

**Внедрено.** auth-service (`auth-service/unify-migration-scripts`);
tasks-service и files-service уже соответствовали.

## 03.09.2026 — Baseline-миграции самодостаточны, расширения создаются явно

**Решение.** Baseline-миграция обязана проходить на чистой БД от нуля.
Необходимые расширения создаются в `up()` через
`CREATE EXTENSION IF NOT EXISTS "..."`; `DROP EXTENSION` в `down()` не делается
(расширение — разделяемый ресурс per-database, откат может сломать чужие
объекты; расширение не «создаётся», а «убеждается в наличии»).

**Внедрено.** tasks-service `BaselineTasks`: `CREATE EXTENSION IF NOT EXISTS
"uuid-ossp"` перед `uuid_generate_v4()` (`tasks-service/fix-baseline-uuid-extension`).

## 03.09.2026 — Импорт legacy-юзеров: арбитраж любых unique-конфликтов

**Решение.** `MigrateLegacyUsers` (auth-service) использует `ON CONFLICT
DO NOTHING` без указания цели.

**Причина.** `ON CONFLICT ("id")` арбитрирует только конфликты по `id` и
роняет миграцию при дубликате unique `username`. Компромисс осознан: дубль
`username` в legacy-данных молча пропускается (не переезжает) — для
однократного переноса это предпочтительнее падения всей миграции.

## 02.09.2026 — Ownership проверяет владелец данных

**Решение.** identity выдаёт auth (через gateway); tasks-service фильтрует
данные по `userId` из proto-запроса, files-service — по `file.userId`.
Внутренний транспорт gateway → сервисы — gRPC; внешний REST клиент → gateway
допустим.
