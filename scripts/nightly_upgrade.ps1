# Nightly Card Type Upgrade Script for Windows
# This script runs the batch card upgrade API endpoint
# Add this to Windows Task Scheduler to run nightly at 2 AM

param(
    [string]$ApiBaseUrl = "http://localhost:8080",  # Change this to your API URL
    [string]$LogPath = "C:\MainLoyalty\logs\card_upgrades.log"
)

# Create log directory if it doesn't exist
$logDir = Split-Path $LogPath -Parent
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logEntry = "[$timestamp] Starting nightly card type upgrade process..."
Add-Content -Path $LogPath -Value $logEntry
Write-Host $logEntry

try {
    # Make API call to batch upgrade all customers
    $apiUrl = "$ApiBaseUrl/api/admin/card-upgrades/batch"
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -ContentType "application/json" -ErrorAction Stop
    
    $successEntry = "[$timestamp] ✅ Card upgrade batch process completed successfully"
    Add-Content -Path $LogPath -Value $successEntry
    Add-Content -Path $LogPath -Value "[$timestamp] Response: $($response | ConvertTo-Json -Compress)"
    Write-Host $successEntry -ForegroundColor Green
    
} catch {
    $errorEntry = "[$timestamp] ❌ Card upgrade batch process failed: $($_.Exception.Message)"
    Add-Content -Path $LogPath -Value $errorEntry
    Write-Host $errorEntry -ForegroundColor Red
    
    # Optional: Send email notification on failure
    # Send-MailMessage -To "admin@yourcompany.com" -From "loyalty@yourcompany.com" -Subject "Loyalty System Alert" -Body "Card upgrade failed: $($_.Exception.Message)" -SmtpServer "your-smtp-server"
}

$finishEntry = "[$timestamp] Nightly card type upgrade process finished."
Add-Content -Path $LogPath -Value $finishEntry
Add-Content -Path $LogPath -Value ""
Write-Host $finishEntry

# Optional: Clean up old log files (keep only last 30 days)
try {
    Get-ChildItem -Path $logDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
} catch {
    Write-Host "Warning: Could not clean up old log files: $($_.Exception.Message)" -ForegroundColor Yellow
}
