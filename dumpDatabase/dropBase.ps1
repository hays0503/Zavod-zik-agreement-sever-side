#Настройки скрипта===============================#
    #каталог куда установден постгрес 
    $catalog = "C:\Program Files\PostgreSQL\14\bin"
    
    #password пароль для БД
    $env:PGPASSWORD = 'zoitib23Gverde'


 
#Настройки скрипта===============================#
 

#Парсим БД на наличие БАЗ
Set-Location $catalog
 
#cd $catalog
.\psql --host=localhost --port=5432 --username=postgres -c 'DROP DATABASE IF EXISTS agreement'