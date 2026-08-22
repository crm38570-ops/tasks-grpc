# TASKS.md

Заметки по доделкам(для каждой своя ветка согласно конвенции в AGENTS.md).

Вынести auth из tasks-service:

- [ ] auth-service: вынести auth из tasks-service (src/auth/*, JWT-конфиг, auth-зависимости)
- [ ] tasks-service: заменить relation User в task.entity на userId (uuid)
- [ ] tasks-service: перевести tasks.repository/service с User на userId
- [ ] tasks-service: files-модуль — заменить GetUser/User на userId
- [ ] tasks-service: определиться с проверкой JWT после выноса (общий JWT_SECRET или verify в auth-service)
