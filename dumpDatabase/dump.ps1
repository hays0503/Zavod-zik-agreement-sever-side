#Настройки скрипта===============================#
    #каталог куда установден постгрес 
    $catalog = "C:\Program Files\PostgreSQL\14\bin"
    
    #Название БД для бэкапа или обслуживания
    $nameDB = 'agreement'
 
    #Название Бэкапа
    $backupname = 'db.dump'
 
    #Каталог для бэкапа
    $pgbackupdir = 'D:\Project\git\srv\dumpDatabase'
    
    #user. Пользоватлеь по умолчанию postgres
    $user = 'postgres'
    
    #password пароль для БД
    $env:PGPASSWORD = 'zoitib23Gverde'
 
#Настройки скрипта===============================#
 

#Парсим БД на наличие БАЗ
Set-Location $catalog
 
#cd $catalog
cmd /c  $catalog\pg_dump.exe --file $pgbackupdir\$backupname --host "localhost" --port "5432" --username $user --no-password --verbose --format=c --blobs $nameDB