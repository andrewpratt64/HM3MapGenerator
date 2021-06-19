::Andrew Pratt 2021

@echo off
echo BAT: Compiling

:: Run gen.js
node %~dp0\..\src\gen.js %~dp0\..\config.json

:: Wait for keypress before closing
pause