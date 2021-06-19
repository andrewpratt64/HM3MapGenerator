::Andrew Pratt 2021

@echo off

:: Run build.js to build rpkg
node %~dp0\..\src\build.js %~dp0\..\config.json test.entity/base
node %~dp0\..\src\build.js %~dp0\..\config.json test.entity/portedhashes

:: Wait for keypress before closing
pause