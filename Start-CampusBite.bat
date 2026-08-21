@echo off
set "ROOT=%~dp0"

start "CampusBite API" cmd /k "pushd ""%ROOT%backend"" && npm.cmd run dev"
timeout /t 4 /nobreak >nul
start "CampusBite Web" cmd /k "pushd ""%ROOT%frontend"" && npm.cmd run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
