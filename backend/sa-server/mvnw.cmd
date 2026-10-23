@echo off
setlocal
set "DIRNAME=%~dp0"
if "%DIRNAME:~-1%"=="\" set "DIRNAME=%DIRNAME:~0,-1%"
set "MAVEN_PROJECTBASEDIR=%DIRNAME%"

if not exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" (
    echo Error: Could not find maven-wrapper.jar
    exit /b 1
)

java "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -cp "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
