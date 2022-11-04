#��������� �������===============================#
#������� ���� ���������� �������� 
$catalog = "C:\Program Files\PostgreSQL\13\bin"
    
#�������� �� ��� ������ ��� ������������
$nameDB = 'agreement'
 
#�������� ������
$backupname = 'db.dump'

$dir = '\dumpDatabase'
 
#������� ��� ������
$pgbackupdir = $PSScriptRoot
    
#user. ������������ �� ��������� postgres
$user = 'postgres'
    
#password ������ ��� ��
$env:PGPASSWORD = 'zoitib23Gverde'
 
#��������� �������===============================#
 

#������ �� �� ������� ���
Set-Location $catalog
 
#cd $catalog
cmd /c  $catalog\pg_dump.exe --file $pgbackupdir\$backupname --host "localhost" --port "5432" --username $user --no-password --verbose --format=c --blobs $nameDB