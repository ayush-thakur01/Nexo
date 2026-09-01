cd /d "C:\Users\ayush\OneDrive\Documents\Default Project\Nexo"
call node_modules\.bin\electron-builder.cmd --win --x64 > dist_build2.log 2>&1
echo DONE:%ERRORLEVEL% >> dist_build2.log
