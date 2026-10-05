@echo off
cd /d "C:\RS-KITS\frontend"
rem Usar o node_modules da pasta do projeto, não o global
call "C:\Program Files\nodejs\node.exe" .\node_modules\.bin\next dev