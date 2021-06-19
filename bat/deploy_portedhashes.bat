::Andrew Pratt 2021

@echo off

:: Run clean.js to delete old rpkg files
node %~dp0\..\src\gen.js %~dp0\..\config.json false true

:: Run deploy.js to copy rpkg to Hitman 3 directory
node %~dp0\..\src\deploy.js %~dp0\..\config.json portedhashes.rpkg rpkgPortedHashesName

:: Wait for keypress before closing
pause