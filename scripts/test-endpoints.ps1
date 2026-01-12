param(
  [string]$BaseUrl = "http://127.0.0.1:5000",
  [string]$AdminEmail = "admin@station.local",
  [string]$AdminPassword = "Test123!@#",
  [string]$OrgName = "Station One",
  [string]$FullName = "Station Admin"
)

function Invoke-JsonPost($url, $body) {
  try {
    return Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body ($body | ConvertTo-Json) -TimeoutSec 60
  } catch {
    Write-Host "❌ POST $url failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    return $null
  }
}

function Invoke-JsonGet($url) {
  try {
    return Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 15
  } catch {
    Write-Host "❌ GET $url failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    return $null
  }
}

Write-Host "\n--- Health check ---" -ForegroundColor Cyan
$health = Invoke-JsonGet "$BaseUrl/health"
if ($health) { $health | ConvertTo-Json -Depth 5 }

Write-Host "\n--- Auth test ---" -ForegroundColor Cyan
$ping = Invoke-JsonGet "$BaseUrl/api/auth/test"
if ($ping) { $ping | ConvertTo-Json -Depth 5 }

Write-Host "\n--- Register org/admin ---" -ForegroundColor Cyan
$registerBody = @{ email=$AdminEmail; password=$AdminPassword; fullName=$FullName; organizationName=$OrgName }
$reg = Invoke-JsonPost "$BaseUrl/api/auth/register" $registerBody
if ($reg) { $reg | ConvertTo-Json -Depth 6 }

Start-Sleep -Seconds 1

Write-Host "\n--- Login ---" -ForegroundColor Cyan
$loginBody = @{ email=$AdminEmail; password=$AdminPassword }
$login = Invoke-JsonPost "$BaseUrl/api/auth/login" $loginBody
if ($login) { $login | ConvertTo-Json -Depth 6 }
