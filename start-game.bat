@echo off 
echo. 
echo ================================================ 
echo    POKRETANJE MAFIJA ONLINE IGRE 
echo ================================================ 
echo. 
echo [1/3] Pokrecem Backend Server... 
start cmd /k "cd C:\Users\Zeka\Desktop\mafia-game\backend && npm run dev" 
timeout /t 5 /nobreak >nul 
echo. 
echo [2/3] Pokrecem Frontend... 
start cmd /k "cd C:\Users\Zeka\Desktop\mafia-game\frontend && npm run dev" 
timeout /t 8 /nobreak >nul 
echo. 
echo [3/3] Otvaram Browser... 
start http://localhost:5173 
echo. 
echo ================================================ 
echo    IGRA JE POKRENUTA! 
echo    Backend: http://localhost:3001 
echo    Frontend: http://localhost:5173 
echo ================================================ 
pause
