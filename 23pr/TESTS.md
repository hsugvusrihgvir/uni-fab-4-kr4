## Запуск Docker Compose

```bash
docker compose up --build
```

![docker compose up](images/1.png)

![docker compose up](images/2.png)


## Проверка балансировки через Nginx

`GET http://localhost/`


![Nginx Docker balance](images/31.png)


![Nginx Docker balance](images/32.png)



## Проверка отказоустойчивости после остановки backend1

```bash
docker compose stop backend1
```

![docker stop backend1](images/5.png)



![docker stop backend1](images/4.png)


## настройки max_fails и fail_timeout


![Nginx config](images/7.png)
