# API: Задачи

Базовый путь: `/tasks`.

Все эндпоинты защищены `AuthGuard` (JWT). Обязателен заголовок:

```
Authorization: Bearer <accessToken>
```

Пользователь идентифицируется по токену; **пользователь видит и может менять только свои задачи** — обращение к чужой задаче возвращает `404`.

### Модель задачи (`TaskResponseDto`)

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid (string) | идентификатор задачи |
| `title` | string | заголовок |
| `description` | string | описание |
| `status` | enum | `OPEN` \| `IN_PROGRESS` \| `DONE` |

### Ответы

| Код | Описание |
|---|---|
| `400` | Некорректные данные (валидация DTO) |
| `401` | Отсутствует/невалиден JWT-токен |
| `404` | Задача не найдена или не принадлежит пользователю |
| `500` | Ошибка БД (`InternalServerErrorException`) |

---

## POST /tasks

Создание новой задачи. Статус всегда `OPEN`.

### Тело запроса

| Поле | Тип | Правила |
|---|---|---|
| `title` | string | обязателен, не пустой |
| `description` | string | обязателен, не пустой |

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Написать диссертацию","description":"Про капибар"}'
```

**201** — `TaskResponseDto` (задача создана).

---

## GET /tasks

Получение задач с фильтрами (оба параметра необязательны).

### Query-параметры

| Параметр | Тип | Описание |
|---|---|---|
| `status` | enum | фильтр по статусу: `OPEN`, `IN_PROGRESS`, `DONE` |
| `searchQuery` | string | регистронезависимый поиск по `title` или `description` (подстрока) |

```bash
curl "http://localhost:3000/tasks?status=OPEN&searchQuery=капибары" \
  -H "Authorization: Bearer <accessToken>"
```

**200** — массив `TaskResponseDto[]` (может быть пустым).

---

## GET /tasks/:id

Получение задачи по ID.

| Параметр | Тип | Описание |
|---|---|---|
| `id` | uuid | идентификатор задачи |

**200** — `TaskResponseDto`. **404** — задача не найдена или чужая.

---

## DELETE /tasks/:id

Удаление задачи по ID. `id` валидируется как UUID v4.

**200** — задача удалена (тело пустое). **404** — задача не найдена или чужая.

```bash
curl -X DELETE http://localhost:3000/tasks/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Authorization: Bearer <accessToken>"
```

---

## PATCH /tasks/:id/status

Обновление статуса задачи.

### Тело запроса

| Поле | Тип | Правила |
|---|---|---|
| `status` | enum | обязателен: `OPEN` \| `IN_PROGRESS` \| `DONE` |

```bash
curl -X PATCH http://localhost:3000/tasks/f47ac10b-58cc-4372-a567-0e02b2c3d479/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

**200** — `TaskResponseDto` с обновлённым статусом. **400** — невалидный `status`. **404** — задача не найдена или чужая.

---

## Примечания

- Логика владения: сервис (`tasks.service.ts`) фильтрует запросы по `user.id` из токена; `getTaskById` ищет `{ id, user: { id: user.id } }`.
- Фильтрация и поиск реализованы через `QueryBuilder` в `tasks.repository.ts` (LIKE-поиск в нижнем регистре).
- Интерактивная Swagger-документация: `http://localhost:3000/api` (только при `STAGE != prod`).
