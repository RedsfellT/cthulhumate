@echo off
title CthulhuMate — Deploiement GitHub Pages
echo.
echo  Deploiement de CthulhuMate sur GitHub Pages...
echo  ================================================
echo.

cd /d "C:\CthulhuMate"

:: Verifie que git est installe
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERREUR : Git n'est pas installe.
    echo  Installez Git depuis https://git-scm.com/download/win
    pause
    exit /b 1
)

:: Build de production
echo  [1/3] Construction de l'application...
npm run build --if-present
if %ERRORLEVEL% NEQ 0 (
    echo  ERREUR lors du build.
    pause
    exit /b 1
)

:: Commit et push
echo.
echo  [2/3] Envoi vers GitHub...
git add -A
git commit -m "Update CthulhuMate" 2>nul || echo  (pas de changements a committer)
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERREUR : impossible de pousser vers GitHub.
    echo  Verifiez votre connexion et que le repo est configure.
    pause
    exit /b 1
)

echo.
echo  [3/3] Deploiement lance !
echo.
echo  GitHub Actions va construire et publier l'app automatiquement.
echo  Suivi : https://github.com/RedsfellT/cthulhumate/actions
echo.
echo  L'app sera disponible dans ~2 minutes sur :
echo  https://RedsfellT.github.io/cthulhumate/
echo.
pause
