## 1. Создание пользователя

`POST http://localhost:3000/api/users`

```json
{
  "first_name": "Ааа",
  "last_name": "Ааа",
  "age": 20
}
```

![POST /api/users](images/1.png)

## 2. Получение списка пользователей

`GET http://localhost:3000/api/users`

![GET /api/users](images/2.png)

## 3. Получение пользователя по id

`GET http://localhost:3000/api/users/1`


## 4. Обновление пользователя

`PATCH http://localhost:3000/api/users/1`

```json
{
  "age": 21
}
```

![PATCH /api/users/:id](images/4.png)

## 5. Удаление пользователя

`DELETE http://localhost:3000/api/users/1`

