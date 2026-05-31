# Практическое занятие 19


## Поля пользователя

- `id`
- `first_name`
- `last_name`
- `age`
- `created_at`
- `updated_at`

## Маршруты

- `POST /api/users` - создание пользователя
- `GET /api/users` - список пользователей
- `GET /api/users/:id` - один пользователь
- `PATCH /api/users/:id` - обновление пользователя
- `DELETE /api/users/:id` - удаление пользователя

## Запуск

```bash
npm install
npm start
```

Базу данных нужно создать заранее:

```sql
CREATE DATABASE fab_pr19;
```

## Тесты

[TESTS.md](TESTS.md)
