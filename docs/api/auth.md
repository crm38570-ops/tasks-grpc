# API: Авторизация

Базовый путь: `/auth`. Ответы сериализуются глобальным интерцептором (см. [architecture.md](../architecture.md)).

---

## POST /auth/signup

Регистрация нового пользователя. Пароль хэшируется bcrypt; username должен быть уникален.

### Тело запроса

| Поле | Тип | Правила валидации |
|---|---|---|
| `username` | string | 2–40 символов, минимум одна заглавная и одна строчная буква, запрещены точки и переводы строк |
| `password` | string | 8–40 символов, обязательна цифра или специальный символ |

```json
{
  "username": "Marsianin",
  "password": "M@k@rony404!"
}
```

### Ответы

| Код | Описание | Тело |
|---|---|---|
| `201` | Пользователь создан | `UserResponseDto` — `{ "id": "<uuid>", "username": "Marsianin" }` |
| `400` | Не прошла валидация (нарушены правила выше) | сообщение об ошибках валидации |
| `409` | Username уже занят | `{ "message": "Username already exists", ... }` |

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"Marsianin","password":"M@k@rony404!"}'
```

---

## POST /auth/signin

Вход по username/password. При успехе возвращает JWT-токен для доступа к `/tasks/*`.

### Тело запроса

То же, что у `signup` (`AuthCredentialsDto`): `username`, `password`.

### Ответы

| Код | Описание | Тело |
|---|---|---|
| `201` | Успешный вход | `{ "accessToken": "<jwt>" }` |
| `400` | Не прошла валидация (нарушены правила username/password) | сообщение об ошибках валидации |
| `401` | Неверный логин или пароль | `{ "message": "Please check your login credentials", ... }` |

Полученный токен передавайте в заголовке:

```
Authorization: Bearer <accessToken>
```

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"Marsianin","password":"M@k@rony404!"}'
```

---

## Особенности

- Срок жизни токена задаётся `JWT_EXPIRES_IN` (см. [configuration.md](../configuration.md)).
- Токен содержит `{ username, iat, exp }`, подписан `JWT_SECRET`. Валидацию выполняет `JwtStrategy` (Passport): при каждом запросе к защищённым эндпоинтам пользователь загружается из БД по `username`.
- Ошибка с кодом PostgreSQL `23505` (unique violation) преобразуется в `409 Conflict` — `UsersRepository.createUser`.
