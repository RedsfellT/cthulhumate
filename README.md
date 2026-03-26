# 🐙 CthulhuMate V7

Aide de jeu numérique pour **L'Appel de Cthulhu V7** — Éditions Sans Détour.

---

## 🌐 Application en ligne

**https://RedsfellT.github.io/cthulhumate/**

Toutes les données sont stockées **localement sur ton appareil** (rien n'est envoyé en ligne).

---

## 📱 Installation sur chaque appareil

### PC (Windows / Mac)
1. Ouvre **Chrome** ou **Edge**
2. Va sur https://RedsfellT.github.io/cthulhumate/
3. Clique l'icône **📥** dans la barre d'adresse → **Installer**

### Android
1. Ouvre **Chrome**
2. Va sur https://RedsfellT.github.io/cthulhumate/
3. Menu **⋮** → **Ajouter à l'écran d'accueil**

### iPhone / iPad
1. Ouvre **Safari** (obligatoire, pas Chrome)
2. Va sur https://RedsfellT.github.io/cthulhumate/
3. Bouton **Partage** (carré avec flèche ↑) → **Sur l'écran d'accueil**

---

## 🌐 Session LAN (même WiFi, à la table de jeu)

Permet au Gardien de partager handouts, cartes, jets de dés et messages d'ambiance en temps réel sur tous les appareils connectés.

### Démarrer le serveur (PC du Gardien)
```
Double-clic sur start.bat
```
Le terminal affiche l'adresse IP locale et un QR code.

### Première connexion sur chaque appareil (une seule fois)
1. Ouvre l'URL affichée (`https://192.168.x.x:3000`) dans le **navigateur**
2. Clique **Avancé** → **Continuer** (avertissement certificat local, normal)
3. C'est fait, le certificat est accepté pour toujours sur cet appareil

### Se connecter à la session
Dans l'app installée → onglet **Gardien** → **📡 Session** → entre `192.168.x.x:3000` → **Se connecter**

---

## 🔄 Mettre à jour l'application

Après avoir modifié le code :
```
Double-clic sur deploy.bat
```
L'app se met à jour sur tous les appareils en ~2 minutes.

Ou manuellement :
```
npm run build
git add -A
git commit -m "Update"
git push origin main
```

---

## 🛠️ Développement local

```bash
npm install --legacy-peer-deps
npm run dev        # serveur de développement
npm run build      # build de production
node server.js     # serveur LAN local (après build)
```

---

## 📦 Stack technique

- **React + TypeScript + Vite**
- **Tailwind CSS v4**
- **Dexie.js** (IndexedDB — stockage 100% local)
- **vite-plugin-pwa** (PWA installable, fonctionne hors-ligne)
- **pdf.js** (lecture de PDFs)
- **Express + WebSocket** (serveur LAN)
- **Web Audio API** (ambiances sonores procédurales)
