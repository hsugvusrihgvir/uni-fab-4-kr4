
## Проверка Nginx

```powershell
C:\nginx\nginx.exe -c C:\Users\daria\WebstormProjects\uni-fab-4-kr4\22pr\nginx.conf -p C:\nginx\
```

`GET http://localhost/`


![Nginx balance](images/1.png)

![Nginx balance](images/2.png)

## Проверка отказоустойчивости 

Остановить один сервер и снова выполнить запросы


![Nginx failover](images/3.png)

Остановить два

![Nginx failover](images/4.png)