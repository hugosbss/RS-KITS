@echo off
cd /d "C:\RS-KITS\desktop"
python server.py > server.log 2>&1
echo Servidor iniciado. Verifique server.log.
timeout /t 3 >nul