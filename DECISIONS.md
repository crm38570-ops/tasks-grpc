# DECISIONS.md

Журнал архитектурных решений. Новые записи добавляются сверху.

## 04.09.2026 — typeorm объявлен прямой зависимостью `@mcs/shared`

**Решение.** В `shared/package.json` добавлена декларативная зависимость
`typeorm ^1.1.1` (код shared typeorm не импортирует — ни runtime, ни типов).
Shared по-прежнему **не имеет** собственного `node_modules`/`yarn.lock`;
установка — через `yarn upgrade @mcs/shared` в сервисах.

**Причина.** Декларация описывает фактический контракт пакета: фабрика
`createDataSourceOptions()` возвращает опции для `new DataSource()`, то есть
потребитель обязан иметь typeorm. Яр 1 резолвит `typeorm@^1.1.1` из shared в
тот же хоистнутый инстанс, что и прямая dep сервиса (одна запись в lockfile) —
второй копии не возникает. Прошлый риск «утечки» был связан с физическим
`node_modules` внутри папки shared, а не с декларацией в package.json.
Отменяет соответствующие оговорки записи от 04.09.2026 про «никакой
зависимости от typeorm».

## 04.09.2026 — Shared-пакет `@mcs/shared` через `file:`-зависимость, без workspaces

**Решение.** Общая инфраструктура (генератор прото, позднее — фабрика data-source и
grpc-options) переезжает в корневую папку `shared/`. Пакет `@mcs/shared` подключается
в каждый сервис зависимостью `"file:../shared"` (yarn 1 копирует его в `node_modules`
при установке). Workspaces в корне репозитория не вводятся.

**Причина.** Копипаста инфраструктурных файлов по сервисам уже дала дрейф копий
(4 версии `generate-protos.js`, 3 — `data-source.ts`). `file:` делает сервис-копии
невозможными, сохраняя простоту корня: сервисы остаются самостоятельными пакетами.

**Цикл обновления.** Yarn 1 резолвит `file:`-зависимость один раз и копирует папку
ВЕРБАТИМ (`files`, `.yarnignore` игнорируются): локальный `node_modules` shared
утёк бы в сервисы вместе с дубликатом typeorm. Поэтому: shared **не имеет**
`node_modules` (декларативная dep typeorm допустима — см. запись выше). Сборка
shared — tsc из любого сервиса: `& ..\<service>\node_modules\.bin\tsc.cmd -p tsconfig.json`
в `shared/` (dist коммитится). После правки shared — `yarn upgrade @mcs/shared`
в сервисах (обычный install не подхватывает изменения; см. AGENTS.md п.9).

**Декларация прото-модулей.** Скрипт генерации один, в shared. Каждый сервис
объявляет свои proto-модули в собственном `package.json`: `"mcs": { "protos": [...] }`.
Скрипт читает манифест потребителя по `process.cwd()` и генерирует только объявленные
модули — мёртвые копии чужих контрактов (`src/proto/auth` в tasks и т.п.) исчезают.
Альтернатива (CLI-аргумент) отвергнута: декларация — статичное свойство сервиса,
ей место в манифесте, а не в строке вызова.

**data-source как конструктор опций.** Итоговая форма фабрики —
`createDataSourceOptions()` возвращает плоский объект, сервис сам делает
`new DataSource(...)`. Причина: попытка инстанцировать DataSource внутри shared
требует typeorm в зависимости пакета → yarn 1 вербатим-копия тащит второй
инстанс typeorm в сервис → конфликт классов (`EntitySchema` из разных копий
несовместим) и непортируемые декларации (TS2883). Один инстанс typeorm на
сервис — гарантирован отсутствием физического `node_modules` в shared.

**Внедрено.** `chore/shared-package` (auth-service подключён первым).

## 04.09.2026 — `metadata.size` убран из UploadFile-контракта

**Решение.** Поле `size` удалено из `FileMetadataRequest` в
`proto/files/files_service.proto` (номер 3 зарезервирован). Клиентский
заявленный размер никем не использовался: валидация проверяла его только
«не пусто» против серверного лимита, а в БД писался фактический
`totalBytes`. Сервер считает размер сам; в `FileMetadataResponse` поле
остаётся (факт). Gateway больше не шлёт `size: 0`.

**Альтернатива.** Сверять `totalBytes === metadata.size` в конце стрима —
отвергнуто: это защита от клиента, который сам врёт себе; реальный лимит
и так enforced сервером (`validateUploadFileContent`).

**Внедрено.** `service-files/drop-metadata-size` (files-service + gateway).

## 03.09.2026 — Deadline на gRPC-вызовах gateway: частичное покрытие стриминга

**Решение.** Все унарные gRPC-вызовы из gateway обёрнуты в `withDeadline(obs$, GRPC_TIMEOUT_MS)`
(`gateway/src/proxies/shared/with-deadline.ts`): rxjs `timeout()` + конвертация
`TimeoutError` → `RpcException({ code: DEADLINE_EXCEEDED })`, которую
`RpcExceptionFilter` маппит в HTTP 504. `GRPC_TIMEOUT_MS` обязателен в env.

Стриминговые вызовы:
- `downloadFile` — дедлайн только на ожидание метаданных (первого чанка),
  дальше стрим отдаётся клиенту без ограничения;
- `uploadFile` — дедлайн не ставится вовсе: это client-streaming, ответ
  приходит после завершения всей закачки, фиксированный лимит рвал бы
  легитимные медленные закачки.

**Отвергнутая альтернатива.** Idle-таймаут на стримах (перезапуск таймера на
каждый прибывший чанк, например через `switchMap` + `timer`) — корректнее по
смыслу, но требует существенно более сложной rxjs-обвязки. Для масштаба
проекта осознанно отклонено как оверхед; при появлении реальных зависаний
стримов — вернуться к идее.

**Внедрено.** gateway `grpc-deadline` (tasks/auth/files proxy-сервисы).

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
