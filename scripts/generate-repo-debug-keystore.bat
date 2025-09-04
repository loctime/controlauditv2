@echo off
setlocal

set KEYSTORE_PATH=android\debug.keystore
set STOREPASS=android
set KEYPASS=android
set ALIAS=androiddebugkey

REM Resolver keytool
set KEYTOOL=keytool
if defined JAVA_HOME (
  if exist "%JAVA_HOME%\bin\keytool.exe" (
    set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
  )
)

echo 🔍 Usando keytool: %KEYTOOL%

if exist "%KEYSTORE_PATH%" (
  echo ✅ Keystore ya existe en %KEYSTORE_PATH%
) else (
  echo 🔑 Generando keystore fijo en %KEYSTORE_PATH% ...
  "%KEYTOOL%" -genkey -v -keystore "%KEYSTORE_PATH%" -storepass %STOREPASS% -alias %ALIAS% -keypass %KEYPASS% -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" -noprompt
  if errorlevel 1 (
    echo ❌ Error al generar el keystore. Asegura JAVA_HOME o que keytool esté en PATH.
    exit /b 1
  ) else (
    echo ✅ Keystore generado.
  )
)

echo.
echo 📋 Huellas del keystore (registra en Firebase):
"%KEYTOOL%" -list -v -keystore "%KEYSTORE_PATH%" -alias %ALIAS% -storepass %STOREPASS% -keypass %KEYPASS%

echo.
echo ✅ Listo. Usa estas huellas (SHA1 y SHA256) en Firebase para la app com.controlaudit.app.
endlocal
