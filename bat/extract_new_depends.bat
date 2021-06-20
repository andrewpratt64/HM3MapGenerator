::Andrew Pratt 2021

:: NOTE: This can take a while!

@echo off

:: Run extract_depends.js to extract new depends to portedhashes
node %~dp0\..\src\extract_depends.js %~dp0\..\config.json

:: Wait for keypress before closing
pause