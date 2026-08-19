# Архитектура

## Обзор

NestJS-приложение в классической модульной структуре. Два функциональных модуля — `Auth` и `Tasks` — используют TypeORM-репозитории поверх PostgreSQL. Вся бизнес-логика находится в сервисах; контроллеры отвечают только за HTTP-слой и документацию Swagger.

## Структура папок

```
src/
├── main.ts                  # точка входа: bootstrap, ValidationPipe, интерцептор, Swagger
├── app.module.ts            # корневой модуль: ConfigModule, TypeOrmModule, TasksModule, AuthModule
├── config.chema.ts          # Joi-схема валидации переменных окружения
├── swagger-config.ts        # конфигурация Swagger-документа
├── auth/                    # модуль авторизации
│   ├── auth.module.ts       # регистрирует AuthController, AuthService, UsersRepository, JwtStrategy
│   ├── auth.controller.ts   # POST /auth/signup, POST /auth/signin
│   ├── auth.service.ts      # логика регистрации и входа (bcrypt, JWT)
│   ├── jwt.strategy.ts      # Passport JWT-стратегия: валидация токена из заголовка Bearer
│   ├── get-user.decorator.ts # декоратор @GetUser() — достаёт пользователя из request
│   ├── user.entity.ts       # сущность User (id, username, password, tasks)
│   ├── users.repository.ts  # репозиторий: создание пользователя с bcrypt-хэшем
│   ├── dto/                 # AuthCredentialsDto, UserResponseDto, JwtAccessTokenDto
│   └── types/               # JwtPayload, JwtAccessToken — интерфейсы
├── tasks/                   # модуль задач
│   ├── tasks.module.ts
│   ├── tasks.controller.ts  # CRUD-эндпоинты (все под AuthGuard)
│   ├── tasks.service.ts     # бизнес-логика: владелец задачи, NotFound, смена статуса
│   ├── tasks.repository.ts  # TypeORM-запросы: создание, фильтрация, поиск, обновление
│   ├── task.entity.ts       # сущность Task (id, title, description, status, user)
│   ├── task-status.enum.ts  # OPEN | IN_PROGRESS | DONE
│   └── dto/                 # CreateTaskDto, UpdateTaskStatusDto, DeleteTaskDto,
│                            # GetTasksFilterDto, TaskResponseDto
└── interceptors/
    └── transform.interceptor.ts  # глобальная сериализация ответов (class-transformer)
```

## Поток запроса

```
HTTP-запрос
  → NestJS: global ValidationPipe (transform: true) — валидация DTO
  → Контроллер (Tasks/Auth)
      → AuthGuard (Passport JWT) — только для /tasks/*
          → JwtStrategy.validate() — расшифровка токена, загрузка User
      → Сервис — бизнес-логика
      → Репозиторий — TypeORM-запросы к PostgreSQL
  → TransformInterceptor — instanceToPlain(данные) (убирает поля @Exclude)
  → HTTP-ответ
```

## Ключевые решения

### Модули и DI

- `AppModule` подключает `ConfigModule.forRoot()` с `envFilePath: .env.stage.${STAGE}` и Joi-валидацией (см. [configuration.md](configuration.md)). Порядок импортов в `AppModule`: ConfigModule, TasksModule, TypeOrmModule, AuthModule.
- `TypeOrmModule.forRootAsync` настраивается через `ConfigService`; `synchronize: true` — схема БД создаётся автоматически (подходит для разработки).
- Репозитории (`UsersRepository`, `TasksRepository`) расширяют `Repository<T>` TypeORM — сложные запросы собраны в репозиториях; часть простых операций (поиск по id, удаление) сервис выполняет напрямую через стандартные методы репозитория.

### Безопасность

- Пароли хэшируются **bcrypt** (соль генерируется на каждого пользователя) — `UsersRepository.createUser`.
- JWT-токен подписывается секретом из окружения (`JWT_SECRET`), срок жизни — `JWT_EXPIRES_IN`.
- Все эндпоинты `/tasks/*` защищены `@UseGuards(AuthGuard())` + `@ApiBearerAuth()`.
- **Изоляция данных**: каждый запрос к задачам фильтруется по владельцу (`user` из токена). `getTaskById` ищет `{ id, user: { id } }` — чужая задача отдаёт 404.
- Идентификатор пользователя достаётся из токена декоратором `@GetUser()` (заполняется `JwtStrategy.validate`).

### Сериализация ответов

Глобальный `TransformInterceptor` прогоняет ответы через `instanceToPlain()` (class-transformer). Это исключает из JSON поля, помеченные `@Exclude({ toPlainOnly: true })`:
- `password` у `User`,
- `user` (связь) у `Task`.

Ответы обёрнуты в response-DTO (`UserResponseDto`, `TaskResponseDto`, `JwtAccessTokenDto`), которые и документируются в Swagger.

### Валидация DTO

`ValidationPipe({ transform: true })` на уровне приложения: все входящие данные валидируются class-validator'ом по DTO контроллера. Неверные данные → `400 Bad Request` с текстом ошибок валидации.

### Логирование

В сервисах, репозиториях и контроллерах используется `Logger` из `@nestjs/common`:
- `log` — обычные операции (создание, вход);
- `verbose` — детали запросов контроллера;
- `warn` — подозрительное (неудачный вход, обращение к чужой/несуществующей задаче);
- `error` — сбои БД (оборачиваются в `InternalServerErrorException`).

## Сущности и связи

### User (`user.entity.ts`)

| Поле | Тип | Примечание |
|---|---|---|
| `id` | uuid (PK) | генерируется БД |
| `username` | string, unique | |
| `password` | string | bcrypt-хэш, `@Exclude` из JSON |
| `tasks` | OneToMany → Task | не eager (загружается только по запросу) |

### Task (`task.entity.ts`)

| Поле | Тип | Примечание |
|---|---|---|
| `id` | uuid (PK) | |
| `title` | string | |
| `description` | string | |
| `status` | enum `TaskStatus` | `OPEN` \| `IN_PROGRESS` \| `DONE` |
| `user` | ManyToOne → User | `@Exclude` из JSON |

Связь «многие к одному»: у пользователя много задач, задача принадлежит ровно одному пользователю.
