::Andrew Pratt 2021

@echo off

:: Run clean.js to delete old rpkg files
node %~dp0\..\src\clean.js %~dp0\..\config.json true false

:: Wait for keypress before closing
pause