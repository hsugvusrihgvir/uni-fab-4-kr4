## 1. Регистрация пользователя

`POST http://localhost:3000/api/auth/register`

```json
{
  "email": "seller@example.com",
  "first_name": "Seller",
  "last_name": "User",
  "password": "1234",
  "role": "seller"
}
```

## 2. Вход пользователя

`POST http://localhost:3000/api/auth/login`

```json
{
  "email": "seller@example.com",
  "password": "1234"
}
```

![POST /api/auth/login](images/2.png)

## 3. Получение текущего пользователя

`GET http://localhost:3000/api/auth/me`

```text
Authorization: Bearer <accessToken>
```

![GET /api/auth/me](images/3.png)

## 4. Регистрация администратора

`POST http://localhost:3000/api/auth/register`

```json
{
  "email": "admin2@example.com",
  "first_name": "Admin",
  "last_name": "Two",
  "password": "1234",
  "role": "admin"
}
```

![POST /api/auth/register admin](images/4.png)

## 5. Вход администратора

`POST http://localhost:3000/api/auth/login`

```json
{
  "email": "admin2@example.com",
  "password": "1234"
}
```

## 6. Получение списка пользователей

`GET http://localhost:3000/api/users`

```text
Authorization: Bearer <adminAccessToken>
```

![GET /api/users](images/6.png)

## 7. Повторное получение списка пользователей из Redis

`GET http://localhost:3000/api/users`

```text
Authorization: Bearer <adminAccessToken>
```

![GET /api/users cache](images/7.png)

## 8. Получение пользователя по id

`GET http://localhost:3000/api/users/<userId>`

```text
Authorization: Bearer <adminAccessToken>
```

![GET /api/users/:id](images/8.png)

![GET /api/users/:id](images/82.png)


## 11. Получение списка товаров

`GET http://localhost:3000/api/products`

```text
Authorization: Bearer <sellerAccessToken>
```

![GET /api/products](images/11.png)



## 13. Получение товара по id

`GET http://localhost:3000/api/products/<productId>`

```text
Authorization: Bearer <sellerAccessToken>
```

![GET /api/products/:id](images/12.png)

![GET /api/products/:id](images/13.png)

## 14. Обновление товара

`PUT http://localhost:3000/api/products/<productId>`

```text
Authorization: Bearer <sellerAccessToken>
```

```json
{
  "title": "Товар 4 обновленный",
  "category": "Категория 3",
  "description": "Новое описание",
  "price": 1290,
  "stock": 10,
  "rating": 4.5,
  "image": "https://example.com/new-image.jpg"
}
```

![PUT /api/products/:id](images/14.png)

После этого

![PUT /api/products/:id](images/15.png)