#Настройки скрипта===============================#
    #каталог куда установден постгрес 
    $catalog = "C:\Program Files\PostgreSQL\14\bin"
    
    #Название БД для бэкапа или обслуживания
    #$nameDB = 'name'
 
    #Название Бэкапа
    $backupname = 'test_db.dump'
 
    #Каталог для бэкапа
    $pgbackupdir = 'D:\Project\dump'
    
    #Имя БД в которую будем востонавливать. Заранее создать в pgAdmin
    $restordb = 'agreement'
    
    #user. Пользоватлеь по умолчанию postgres
    $user = 'postgres'
    
    #password пароль для БД
    $env:PGPASSWORD = 'zoitib23Gverde'


 
#Настройки скрипта===============================#
 

#Парсим БД на наличие БАЗ
Set-Location $catalog
 
#cd $catalog
.\psql --host=localhost --port=5432 --username=postgres -c 'CREATE DATABASE agreement WITH OWNER = postgres ENCODING = "UTF8" TABLESPACE = pg_default CONNECTION LIMIT = -1;'