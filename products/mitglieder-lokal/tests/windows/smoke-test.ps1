# Smoke Tests fuer MitgliederSimple Windows Installer
# Wird von Azure DevOps Pipeline nach dem Build ausgefuehrt

$ErrorActionPreference = "Stop"

$bundleDir = "src-tauri\target\release\bundle\nsis"
$installDir = "$env:LOCALAPPDATA\MitgliederSimple"
$resultDir = "test-results"
$reportFile = "$resultDir\report.json"

New-Item -ItemType Directory -Force -Path $resultDir | Out-Null

$results = @()
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Add-Result {
    param($name, $passed, $detail)
    $script:totalTests++
    if ($passed) { $script:passedTests++ } else { $script:failedTests++ }
    $script:results += @{
        name = $name
        passed = $passed
        detail = $detail
    }
    $status = if ($passed) { "PASS" } else { "FAIL" }
    Write-Host "[$status] $name - $detail"
}

# --- Test 1: Installer existiert und ist > 5 MB ---
$installerExe = Get-ChildItem -Path $bundleDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($installerExe -and $installerExe.Length -gt 5MB) {
    Add-Result "Installer vorhanden" $true "Groesse: $([math]::Round($installerExe.Length / 1MB, 1)) MB"
} elseif ($installerExe) {
    Add-Result "Installer vorhanden" $false "Zu klein: $([math]::Round($installerExe.Length / 1MB, 1)) MB (erwartet > 5 MB)"
} else {
    Add-Result "Installer vorhanden" $false "Keine .exe in $bundleDir gefunden"
    # Ohne Installer koennen die weiteren Tests nicht laufen
    $report = @{
        product_id = "mitglieder-lokal"
        platform = "windows"
        version = $env:BUILD_SOURCEBRANCHNAME
        total_tests = $totalTests
        passed_tests = $passedTests
        failed_tests = $failedTests
        test_details = $results
        created_at = (Get-Date -Format "o")
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportFile -Encoding UTF8
    Write-Host "`nErgebnis: $passedTests/$totalTests bestanden"
    exit 1
}

$installerPath = $installerExe.FullName

# --- Test 2: Silent Install mit ExitCode 0 ---
$installProcess = Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -PassThru
if ($installProcess.ExitCode -eq 0) {
    Add-Result "Silent Install" $true "ExitCode: 0"
} else {
    Add-Result "Silent Install" $false "ExitCode: $($installProcess.ExitCode)"
}

# --- Test 3: MitgliederSimple.exe im Install-Verzeichnis ---
$appExe = Join-Path $installDir "MitgliederSimple.exe"
if (Test-Path $appExe) {
    Add-Result "App installiert" $true "$appExe vorhanden"
} else {
    Add-Result "App installiert" $false "$appExe nicht gefunden"
}

# --- Test 4: App-Prozess startet und laeuft mindestens 5 Sekunden ---
if (Test-Path $appExe) {
    try {
        $appProcess = Start-Process -FilePath $appExe -PassThru
        Start-Sleep -Seconds 5
        if (!$appProcess.HasExited) {
            Add-Result "App startet" $true "Prozess laeuft nach 5 Sekunden (PID: $($appProcess.Id))"
            Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        } else {
            Add-Result "App startet" $false "Prozess beendet nach $([math]::Round(($appProcess.ExitTime - $appProcess.StartTime).TotalSeconds, 1))s"
        }
    } catch {
        Add-Result "App startet" $false "Fehler beim Starten: $_"
    }
} else {
    Add-Result "App startet" $false "App-EXE nicht vorhanden, Test uebersprungen"
}

# --- Test 5: SQLite-Datenbank wird beim Start erstellt ---
$dbPath = Join-Path $env:APPDATA "de.detmers-publish.mitglieder-lokal\mitglieder.db"
# Alternativ-Pfade pruefen
$dbPaths = @(
    $dbPath,
    (Join-Path $env:LOCALAPPDATA "de.detmers-publish.mitglieder-lokal\mitglieder.db"),
    (Join-Path $env:APPDATA "MitgliederSimple\mitglieder.db")
)
$dbFound = $false
foreach ($dp in $dbPaths) {
    if (Test-Path $dp) {
        Add-Result "SQLite-DB erstellt" $true "Datenbank gefunden: $dp"
        $dbFound = $true
        break
    }
}
if (-not $dbFound) {
    Add-Result "SQLite-DB erstellt" $false "Datenbank nicht gefunden in erwarteten Pfaden"
}

# --- Test 6: Silent Uninstall funktioniert ---
$uninstaller = Join-Path $installDir "uninstall.exe"
# NSIS-Uninstaller kann auch unter anderem Namen liegen
$uninstallerPaths = @(
    $uninstaller,
    (Join-Path $installDir "Uninstall MitgliederSimple.exe")
)
$uninstallerPath = $null
foreach ($up in $uninstallerPaths) {
    if (Test-Path $up) {
        $uninstallerPath = $up
        break
    }
}
if ($uninstallerPath) {
    $uninstallProcess = Start-Process -FilePath $uninstallerPath -ArgumentList "/S" -Wait -PassThru
    Start-Sleep -Seconds 2
    if ($uninstallProcess.ExitCode -eq 0 -and !(Test-Path $appExe)) {
        Add-Result "Silent Uninstall" $true "ExitCode: 0, App entfernt"
    } elseif ($uninstallProcess.ExitCode -eq 0) {
        Add-Result "Silent Uninstall" $true "ExitCode: 0"
    } else {
        Add-Result "Silent Uninstall" $false "ExitCode: $($uninstallProcess.ExitCode)"
    }
} else {
    Add-Result "Silent Uninstall" $false "Kein Uninstaller gefunden"
}

# --- Report erstellen ---
$report = @{
    product_id = "mitglieder-lokal"
    platform = "windows"
    version = $env:BUILD_SOURCEBRANCHNAME
    total_tests = $totalTests
    passed_tests = $passedTests
    failed_tests = $failedTests
    test_details = $results
    created_at = (Get-Date -Format "o")
}
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportFile -Encoding UTF8

Write-Host "`nErgebnis: $passedTests/$totalTests bestanden"

if ($failedTests -gt 0) {
    exit 1
}
