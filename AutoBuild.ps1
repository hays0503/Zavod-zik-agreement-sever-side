$Server_folder = $pwd.Path
$Server_folder_build = $Server_folder + '\build\'
# echo 'Текущая деректория' $Server_folder

Clear-Host

if (Test-Path -Path 'build') {
    # echo 'Папка build существует удаляю cодержимое...'
    Remove-Item -Recurse -Force $Server_folder_build
}
 
cd ../client

$Client_folder = $pwd.Path

# echo 'Сборка клиента...'
npm run build

# echo 'Копирую клиент...'
xcopy build\*.* $Server_folder_build /E /K /D /H /Y

cd $Server_folder
# echo 'Запуск...'
#start chrome https://192.168.0.138:8445/
npm start
