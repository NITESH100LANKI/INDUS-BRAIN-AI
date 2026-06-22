@echo off
echo =====================================================================
echo    INDUS BRAIN AI - Unified Asset ^& Operations Brain Startup
echo =====================================================================
echo.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 was not found in your PATH.
    echo Please install Python 3.9 or higher and make sure it is in PATH.
    pause
    exit /b
)

:: Install python requirements
echo [1/2] Installing backend python requirements...
python -m pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b
)
echo.

:: Start server
echo [2/2] Launching INDUS BRAIN AI server on http://localhost:8000
echo.
echo =====================================================================
echo NOTE: Access http://localhost:8000 in your browser to view dashboard.
echo =====================================================================
echo.
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
