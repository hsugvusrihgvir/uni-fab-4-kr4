# Практическое занятие 22

Балансировка нагрузки в веб приложениях.

## Подготовка


```powershell
npm install
```

## Запуск backend-серверов


Терминал 1:

```powershell
npm run start:1
```

Терминал 2:

```powershell
npm run start:2
```

Терминал 3:

```powershell
npm run start:3
```


## Запуск Nginx


```powershell
C:\nginx\nginx.exe -c C:\Users\daria\WebstormProjects\uni-fab-4-kr4\22pr\nginx.conf -p C:\nginx\
```

## Остановка Nginx

```powershell
C:\nginx\nginx.exe -s stop -p C:\nginx\
```

## HAProxy


```powershell
haproxy -f haproxy.cfg
```


## Тесты

[TESTS.md](TESTS.md)
