::Andrew Pratt 2021

@echo off

:: Run clean.js to delete old rpkg files
node %~dp0\..\src\clean.js %~dp0\..\config.json false true

:: Wait for keypress before closing
pause