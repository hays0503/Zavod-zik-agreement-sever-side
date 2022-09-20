#Настройки скрипта===============================#
    #каталог куда установден постгрес 
    $catalog = "C:\Program Files\PostgreSQL\14\bin"
    
    #Название БД для бэкапа или обслуживания
    #$nameDB = 'name'
 
    #Название Бэкапа
    $backupname = '20.09'
 
    #Каталог для бэкапа
    $pgbackupdir = 'D:\Project\git\srv\dumpDatabase'
    
    #Имя БД в которую будем востонавливать
    $restordb = 'agreement'
    
    #user. Пользоватлеь по умолчанию postgres
    $user = 'postgres'
    
    #password пароль для БД
    $env:PGPASSWORD = 'zoitib23Gverde'
 
#Настройки скрипта===============================#
 

#Парсим БД на наличие БАЗ
Set-Location $catalog
 
#cd $catalog
cmd /c  $catalog\pg_restore.exe --host "localhost" --port "5432" --username $user --no-password --dbname $restordb --verbose $pgbackupdir\$backupname