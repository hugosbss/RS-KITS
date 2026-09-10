@echo off
REM =============================================================================
REM Build WINDOWS do RS KITS Desktop.
REM DEVE ser executado EM UMA MÁQUINA WINDOWS (PyInstaller nao faz cross-compile;
REM nao use WSL para gerar o executavel Windows).
REM
REM Pipeline:
REM   Next.js (NEXT_DESKTOP=1) -> frontend\out
REM       -> build\static (copiado)
REM       -> PyInstaller (erro se PyWebView nao estiver instalado)
REM       -> dist\RS-KITS.exe (executavel unico, janela nativa, sem console)
REM       -> Instalador Inno Setup -> release\windows\RS-KITS-Setup-<versao>.exe
REM
REM Uso:
REM   build_windows.bat
REM   set RSKITS_VERSION=1.1.0 && build_windows.bat
REM =============================================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "VERSION=%RSKITS_VERSION%"
if "%VERSION%"=="" set "VERSION=1.0.0"

echo ==^> 1. dependencias (pywebview NAO pode faltar - o build falha sem ele)
python -m pip install -r requirements.txt pyinstaller pywebview
if errorlevel 1 exit /b 1

echo ==^> 2. icones (ICO/PNG)
python scripts\gen-icon.py --out build\assets
if errorlevel 1 exit /b 1

echo ==^> 3. build estatico do Next.js =^> frontend\out
pushd ..\frontend
set "NEXT_DESKTOP=1"
set "NEXT_PUBLIC_API_URL=http://127.0.0.1:19090/api"
call npm run build
if errorlevel 1 exit /b 1
popd

echo ==^> 4. copiando frontend\out =^> build\static
if exist build\static rmdir /s /q build\static
xcopy /e /i /q /y ..\frontend\out build\static >nul
if errorlevel 1 exit /b 1

echo ==^> 5. PyInstaller (onefile, janela nativa, sem console)
if exist dist rmdir /s /q dist
if exist build\pyi-work rmdir /s /q build\pyi-work
python -m PyInstaller --noconfirm --clean --log-level=WARN --workpath build\pyi-work --distpath dist rskits.spec
if errorlevel 1 exit /b 1

if not exist "dist\RS-KITS.exe" (
  echo ERRO: PyInstaller nao gerou dist\RS-KITS.exe
  exit /b 1
)

mkdir release\windows 2>nul
copy /y "dist\RS-KITS.exe" "release\windows\RS-KITS-%VERSION%.exe" >nul

echo ==^> 6. Instalador (Inno Setup 6, se iscc estiver no PATH)
where iscc >nul 2>nul
if errorlevel 1 (
  echo AVISO: Inno Setup (iscc.exe) nao encontrado.
  echo   Instale o Inno Setup 6 em https://jrsoftware.org/isdl.php e rode de novo.
  echo   Enquanto isso, o executavel esta em: release\windows\RS-KITS-%VERSION%.exe
) else (
  set "RSKITS_VERSION=%VERSION%"
  iscc /DAppVersion=%VERSION% installer_windows.iss
  if errorlevel 1 exit /b 1
)

echo.
echo Pronto! Artefatos em desktop\release\windows\: %VERSION%
dir /b release\windows