::Andrew Pratt 2021

@echo off
echo BAT: EasyBuild starting

:: Run clean.js to delete old rpkg files
node %~dp0\..\src\clean.js %~dp0\..\config.json false true

:: Run gen.js to generate base files
node %~dp0\..\src\gen.js %~dp0\..\config.json

:: Run build.js to build rpkg
node %~dp0\..\src\build.js %~dp0\..\config.json test.entity

:: Run deploy.js to copy rpkg to Hitman 3 directory
node %~dp0\..\src\deploy.js %~dp0\..\config.json test.entity.rpkg

:: Wait for keypress before closing
echo BAT: EasyBuild finished
pause