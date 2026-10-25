@echo off
REM Doble clic para abrir Gauss-Jordan paso a paso en http://127.0.0.1:8000
cd /d "%~dp0"
if not exist "backend\vendor\autoload.php" (
  echo Primera vez: instalando dependencias...
  call npm run setup || goto :error
)
REM Abre el navegador cuando el servidor ya este arriba.
start "" /b cmd /c "timeout /t 4 >nul & start "" http://127.0.0.1:8000"
call npm start
goto :eof
:error
echo.
echo No se pudo instalar. Revisa que tengas PHP 8.3+ y Node.js 20+ instalados.
pause
