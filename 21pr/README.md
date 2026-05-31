# Практическое занятие 21

Redis: в API интернет-магазина из 11 практики добавлено кэширование GET-запросов

## из 11 практики

- массив `products` с полями `title`, `category`, `description`, `price`, `stock`, `rating`, `image`
- массив `users`
- регистрация, вход, refresh token, `GET /api/auth/me`
- JWT-авторизация
- роли `user`, `seller`, `admin`
- CRUD пользователей для администратора
- CRUD товаров с ограничением по ролям

## добавлено

- Redis-кэш для:
  - `GET /api/users`
  - `GET /api/users/:id`
  - `GET /api/products`
  - `GET /api/products/:id`
- время кэша пользователей: 60 секунд
- время кэша товаров: 600 секунд
- сброс кэша при изменении пользователей и товаров

## Запуск Redis


```bash
docker run -d --name redis-cache -p 6379:6379 redis
```

```bash
docker start redis-cache
```

## Запуск сервера

```bash
npm install
npm start
```

## Тесты

[TESTS.md](TESTS.md)
