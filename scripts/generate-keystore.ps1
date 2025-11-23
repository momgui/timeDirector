$ErrorActionPreference = "Stop"

$keystoreName = "upload-keystore.jks"
$alias = "my-key-alias"
$password = "your_strong_password" # Change this!

Write-Host "Generating Keystore: $keystoreName"
Write-Host "Alias: $alias"

# Check if keytool is available
if (-not (Get-Command "keytool" -ErrorAction SilentlyContinue)) {
    Write-Error "keytool not found. Please ensure Java Development Kit (JDK) is installed and in your PATH."
}

# Generate keystore
keytool -genkeypair -v `
  -storetype PKCS12 `
  -keystore $keystoreName `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $password `
  -keypass $password `
  -dname "CN=TimeDirector, OU=Engineering, O=TimeDirector, L=Paris, S=IDF, C=FR"

Write-Host "---------------------------------------------------"
Write-Host "Keystore generated successfully: $keystoreName"
Write-Host "Password: $password"
Write-Host "Alias: $alias"
Write-Host "---------------------------------------------------"
Write-Host "IMPORTANT: Keep this file safe. Do not commit it to git."
Write-Host "You will need to upload this file to GitHub Secrets as a Base64 string."
Write-Host "To get Base64 string, run:"
Write-Host "[Convert]::ToBase64String([IO.File]::ReadAllBytes('$keystoreName')) | Set-Clipboard"
