# CthulhuMate V7 Launcher
$host.UI.RawUI.WindowTitle = "CthulhuMate V7"
Set-Location "C:\CthulhuMate"
Write-Host ""
Write-Host "  CthulhuMate V7 - L'Appel de Cthulhu V7" -ForegroundColor DarkYellow
Write-Host "  ========================================" -ForegroundColor DarkRed
Write-Host ""
Write-Host "  Demarrage..." -ForegroundColor DarkYellow

# Start server
$srv = Start-Process -FilePath "npx" -ArgumentList "serve", "dist", "-l", "3000", "--no-clipboard" -WindowStyle Minimized -PassThru

Start-Sleep -Milliseconds 800

# Open browser
Write-Host "  Ouverture de l'application..." -ForegroundColor DarkGreen
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  App disponible sur : http://localhost:3000" -ForegroundColor Green
Write-Host "  Fermez cette fenetre pour arreter le serveur." -ForegroundColor Gray
Write-Host ""

# Wait for key press
Read-Host "  Appuyez sur Entree pour quitter"

# Stop server
Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
Write-Host "  Serveur arrete." -ForegroundColor DarkRed
