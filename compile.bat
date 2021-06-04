::Andrew Pratt 2021

@echo off
echo Compiling...

:: Run gen.js
node %~dp0js\gen.js %~dp0config.json

:: Wait for keypress before closing
pause