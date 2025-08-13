Write-Host "========================================"
Write-Host "  Bahr El Ghazal Clinic Management System"
Write-Host "========================================"
Write-Host ""
Write-Host "Starting the clinic system..."
Write-Host "Access at: http://localhost:5000"
Write-Host ""
Write-Host "Press Ctrl+C to stop the system when done"
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion"
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed"
}

# Set environment and start
$env:NODE_ENV = "development"
npx tsx server/index.ts

Write-Host ""
Write-Host "System stopped. Press Enter to close."
Read-Host