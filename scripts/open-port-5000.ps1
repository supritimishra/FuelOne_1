# Requires running PowerShell as Administrator

Write-Host "Opening Windows Firewall for TCP port 5000..." -ForegroundColor Cyan

try {
  netsh advfirewall firewall add rule name="Node Dev 5000" dir=in action=allow protocol=TCP localport=5000 | Out-Null
  Write-Host "✅ Inbound rule added for TCP 5000" -ForegroundColor Green
} catch {
  Write-Host "❌ Failed to add firewall rule. Please run this script in an elevated PowerShell (Run as Administrator)." -ForegroundColor Red
  throw
}

# Optional: Allow node.exe explicitly (some AV/firewalls block by app path)
$nodePath = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path)
if ($nodePath) {
  Write-Host "Found node at: $nodePath" -ForegroundColor Yellow
  try {
    netsh advfirewall firewall add rule name="Node.exe Allow" dir=in action=allow program="$nodePath" enable=yes | Out-Null
    Write-Host "✅ Program rule added for node.exe" -ForegroundColor Green
  } catch {
    Write-Host "⚠️ Could not add program rule for node.exe (try as Admin)." -ForegroundColor Yellow
  }
} else {
  Write-Host "⚠️ Node.exe path not found in PATH; skipping program rule." -ForegroundColor Yellow
}

Write-Host "Verifying connectivity (when server is listening)..." -ForegroundColor Cyan
Test-NetConnection -ComputerName 127.0.0.1 -Port 5000 -InformationLevel Detailed
