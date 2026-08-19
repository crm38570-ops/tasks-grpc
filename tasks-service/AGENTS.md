# AGENTS.md

Вся документация проекта находится в каталоге [docs/](docs/README.md).

Начни чтение с [docs/README.md](docs/README.md) — это карта документации с порядком чтения и ссылками на разделы. Держи её открытой как основной источник истины о проекте.

## Быстрая навигация

- [docs/README.md](docs/README.md) — карта документации, порядок чтения
- [docs/getting-started.md](docs/getting-started.md) — установка, запуск, Docker
- [docs/architecture.md](docs/architecture.md) — модули, структура кода, поток запроса
- [docs/configuration.md](docs/configuration.md) — переменные окружения
- [docs/api/auth.md](docs/api/auth.md) — эндпоинты авторизации
- [docs/api/tasks.md](docs/api/tasks.md) — эндпоинты задач
- [docs/testing.md](docs/testing.md) — как запускать тесты
- [docs/deployment.md](docs/deployment.md) — деплой

## Правила работы для агентов

1. **Не редактируй docs/ и README.md без необходимости** — они должны отражать реальное состояние кода. Если меняешь код, структуру, конфигурацию или зависимости — обнови соответствующие .md файлы.
2. **Соблюдай Conventional Commits** (например, `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
3. **Не добавляй** в коммиты подписи `Co-Authored-By`, `Signed-off-by` и другие атрибуции.
4. **Смена EOL в рабочем дереве** уже не должна появляться — файлы нормализованы через `.gitattributes` (`* text=auto`). Если `git status` вдруг показывает массовые «фантомные» изменения — запусти `git add --renormalize .`.
5. Проект использует **yarn** (не npm), Node 22, PostgreSQL.
