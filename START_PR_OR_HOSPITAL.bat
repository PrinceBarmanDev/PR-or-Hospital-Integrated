@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo       PR OR HOSPITAL - LOCAL DEVELOPMENT
echo ==============================================
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.10 or newer and try again.
  pause
  exit /b 1
)
echo Starting the API at http://127.0.0.1:8000
start "PR OR HOSPITAL API" /D "%~dp0" cmd /k "python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 3 >nul
echo Starting the website at http://127.0.0.1:5500
start "PR OR HOSPITAL FRONTEND" /D "%~dp0frontend" cmd /k "python -m http.server 5500"
timeout /t 2 >nul
start "" http://127.0.0.1:5500
echo.
echo Website: http://127.0.0.1:5500
echo API docs: http://127.0.0.1:8000/docs
echo Keep both command windows open while using the app.
pause
