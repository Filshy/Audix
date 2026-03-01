$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
Write-Host "Setting JAVA_HOME to: $env:JAVA_HOME" -ForegroundColor Cyan

# Check if ADB is connected to a device
$devices = adb devices | Select-String "device$"
if ($devices) {
    Write-Host "Found devices: $devices" -ForegroundColor Green
    Write-Host "Starting build and install on device..." -ForegroundColor Yellow
    npx expo run:android --device --variant release
} else {
    Write-Host "No connected device found via ADB. Starting standalone APK build..." -ForegroundColor Yellow
    # This will generate the APK but might not install it if no device is found
    npx expo run:android --variant release
}
