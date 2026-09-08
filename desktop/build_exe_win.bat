@echo off
REM =========================================================================
REM Compila o backend do RS KITS Desktop para Windows (PyInstaller).
REM Deve ser executado EM UM WINDOWS (PyInstaller nao faz cross-compile).
REM
REM Resultado:
REM   dist\rskits-backend.exe   -> backend headless (FastAPI + SQLite) usado pelo Electron
REM   dist\rskits.exe           -> (legado) prototipo standalone console + navegador
REM =========================================================================
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python nao encontrado no PATH. Instale o Python 3 e marque "Add to PATH".
  exit /b 1
)

REM Se pyinstaller nao estiver instalado, instala junto com as dependencias.
python -m PyInstaller --version >nul 2>nul
if errorlevel 1 (
  echo Instalando dependencias e PyInstaller...
  python -m pip install -r requirements.txt pyinstaller
)

echo ==^> backend (janela oculta, para o Electron)
python -m PyInstaller --noconfirm --clean --onefile --noconsole --name rskits-backend ^
  --distpath dist --workpath "%TEMP%\rskits-build\work" --specpath "%TEMP%\rskits-build" ^
  --collect-all uvicorn --collect-all fastapi ^
  --add-data "%CD%\static;static" ^
  -p . main.py
if errorlevel 1 exit /b 1

echo ==^> legado standalone (console + navegador)
python -m PyInstaller --noconfirm --clean --onefile --console --name rskits ^
  --distpath dist --workpath "%TEMP%\rskits-build\work2" --specpath "%TEMP%\rskits-build" ^
  --collect-all uvicorn --collect-all fastapi ^
  --add-data "%CD%\static;static" ^
  -p . main.py
if errorlevel 1 exit /b 1

echo.
echo Prontos em %CD%\dist:
dir /b dist\rskits-backend.exe dist\rskits.exe
echo.
echo Proximo passo (instalador Windows):
echo   cd electron
echo   npm install
echo   npm run dist:win
echo   ^-^> release\RS-KITS-Setup-0.2.0.exe
endlocal