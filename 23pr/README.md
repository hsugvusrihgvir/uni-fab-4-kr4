# Практическое занятие 23

Docker Compose: backend-серверы и Nginx запускаются вместе одной командой


## Запуск

```bash
docker compose up --build
```

## Проверка балансировки

```bash
curl http://localhost/
curl http://localhost/
curl http://localhost/
```


## Проверка отказоустойчивости

Остановить один backend:

```bash
docker compose stop backend1
```

Повторить запросы:

```bash
curl http://localhost/
```

Nginx перестанет направлять запросы на остановленный контейнер и продолжит обслуживать трафик через оставшиеся.

## Тесты

[TESTS.md](TESTS.md)
