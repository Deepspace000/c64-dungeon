@echo off
echo ==============================================
echo Starting Local Web Server for C64 Dungeon
echo ==============================================
echo Please keep this black window open while you play!
echo Press CTRL+C to stop the server when you are done.
echo.
echo Opening your browser now...
start http://localhost:8000
python -m http.server 8000
