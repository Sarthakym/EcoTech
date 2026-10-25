@echo off
setlocal
cd /d "%~dp0"
if not exist "index.html" (
  echo EcoTech index.html was not found. Extract the entire ZIP before starting.
  pause
  exit /b 1
)
echo Opening EcoTech. Click Enter EcoTech for the spoken welcome, or Enter quietly.
start "" "%~dp0index.html"
