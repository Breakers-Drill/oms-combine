@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Starting OMS Application (Host-based)
echo ========================================

:: Конфигурируемые порты (можно изменить здесь)
set ENGINE_PORT=8989
set SHOWCASE_PORT=8988

echo Using ports:
echo Engine: %ENGINE_PORT%
echo Showcase: %SHOWCASE_PORT%
echo.

:: Проверяем наличие Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Создаем/обновляем .env файлы
echo Creating/updating .env files...

:: Engine .env
echo PORT=%ENGINE_PORT% > engine\.env

:: Showcase .env
echo VITE_ENGINE_URL=http://localhost:%ENGINE_PORT%/ > showcase\.env
echo PORT=%SHOWCASE_PORT% >> showcase\.env

echo .env files updated successfully!
echo.

echo [1/2] Installing engine dependencies...
cd engine
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install engine dependencies
        pause
        exit /b 1
    )
)
echo Starting engine on port %ENGINE_PORT%...
start "OMS Engine" npm start
cd ..

echo.
echo [2/2] Installing showcase dependencies...
cd showcase
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install showcase dependencies
        pause
        exit /b 1
    )
)
echo Starting showcase on port %SHOWCASE_PORT%...
start "OMS Showcase" npm start
cd ..

echo.
echo ========================================
echo Application started successfully!
echo ========================================
echo Engine: http://localhost:%ENGINE_PORT%
echo Showcase: http://localhost:%SHOWCASE_PORT%
echo.
