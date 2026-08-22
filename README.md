# 🌙 Coalition Mondiale Occulte - Site 42

Un site communautaire avec un système avancé de rôles, permissions, chat en temps réel, salons et vocal.

## 🚀 Démarrage rapide

### Prérequis
- Node.js (v14+)
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

1. **Cloner le repo**
```bash
git clone https://github.com/nono1111111/CoalitionMondialOcculteSite42.git
cd CoalitionMondialOcculteSite42
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres (MongoDB URI, JWT_SECRET, etc.)
```

4. **Lancer MongoDB** (si local)
```bash
mongod
```

5. **Lancer le serveur**
```bash
npm start
# ou en développement avec nodemon
npm run dev
```

6. **Accéder au site**
Ouvert votre navigateur et accédez à:
```
http://localhost:5000
```

## 📋 Structure du projet

```
📁 models/              # Schémas Mongoose (User, Role, Channel, Message)
📁 routes/              # Routes API (auth, users, roles, channels, messages)
📁 public/              # Frontend (HTML, CSS, JS)
  📁 css/
    📄 style.css
  📁 js/
    📄 app.js
  📄 index.html
📄 server.js            # Serveur principal Express
📄 package.json         # Dépendances
📄 .env                 # Variables d'environnement
```

## 🔐 Système de rôles

### Rôles disponibles

- **Owner** 👑
  - Accès total au site
  - Créer/modifier/supprimer des rôles
  - Gérer tous les utilisateurs
  - Créer des salons
  - **Email**: noebuttetferey@gmail.com

- **Admin** ⚙️
  - Créer/modifier les rôles et permissions
  - Créer des salons
  - Modérer les utilisateurs

- **Modérateur** 🛡️
  - Créer des salons
  - Modérer les messages
  - Gérer les membres des salons

- **Utilisateur** 👤
  - Accès basique
  - Lire et écrire dans les salons

## ✨ Fonctionnalités

### Authentification
- ✅ Inscription/Connexion sécurisée (JWT)
- ✅ Auto-attribution du rôle Owner pour noebuttetferey@gmail.com
- ✅ Hachage des mots de passe (bcryptjs)

### Gestion des Rôles & Permissions
- ✅ Créer/modifier/supprimer des rôles
- ✅ Assigner des permissions détaillées par rôle
- ✅ Système de couleurs personnalisées pour les rôles
- ✅ Permissions hiérarchiques

### Salons
- ✅ Créer des salons (texte, vocal, annonces)
- ✅ Salons publics et privés
- ✅ Gestion des membres
- ✅ Permissions par salon
- ✅ Rejoindre/quitter les salons

### Chat en temps réel
- ✅ Messages instantanés via Socket.io
- ✅ Support des réactions aux messages
- ✅ Édition et suppression des messages
- ✅ Historique des messages

### Gestion des utilisateurs
- ✅ Profils utilisateurs
- ✅ Statut (en ligne/hors ligne/absent)
- ✅ Attribution de rôles
- ✅ Suppression d'utilisateurs (Owner)

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil actuel

### Utilisateurs
- `GET /api/users/` - Tous les utilisateurs
- `GET /api/users/:id` - Détail utilisateur
- `PUT /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur (Owner)

### Rôles
- `GET /api/roles/` - Tous les rôles
- `POST /api/roles/` - Créer un rôle (Owner/Admin)
- `PUT /api/roles/:id` - Modifier rôle
- `DELETE /api/roles/:id` - Supprimer rôle (Owner)
- `POST /api/roles/:id/permissions` - Ajouter permission
- `DELETE /api/roles/:id/permissions` - Supprimer permission

### Salons
- `GET /api/channels/` - Tous les salons
- `POST /api/channels/` - Créer un salon
- `GET /api/channels/:id` - Détail salon
- `PUT /api/channels/:id` - Modifier salon
- `DELETE /api/channels/:id` - Supprimer salon
- `POST /api/channels/:id/join` - Rejoindre
- `POST /api/channels/:id/leave` - Quitter

### Messages
- `GET /api/messages/channel/:channelId` - Messages du salon
- `POST /api/messages/` - Envoyer message
- `PUT /api/messages/:id` - Modifier message
- `DELETE /api/messages/:id` - Supprimer message
- `POST /api/messages/:id/reaction` - Ajouter réaction

## 🎨 Design

- **Thème**: Sombre avec accent violet/cyan
- **Couleurs principales**:
  - Fond primaire: `#1a1a2e`
  - Fond secondaire: `#16213e`
  - Accent: `#0f3460`
  - Succès/Accentue: `#00d4aa`
  - Danger: `#e94560`

## 🔧 Configuration

### MongoDB
Pour utiliser MongoDB localement:
```bash
# Sur macOS avec Homebrew
brew install mongodb-community
brew services start mongodb-community

# Sur Linux
sudo apt-get install mongodb
sudo systemctl start mongod

# Ou utiliser MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Variables d'environnement
```env
MONGODB_URI=mongodb://localhost:27017/coalition-mondiale-occulte
JWT_SECRET=your_super_secret_key_min_32_chars
PORT=5000
NODE_ENV=development
OWNER_EMAIL=noebuttetferey@gmail.com
```

## 🚀 Déploiement

### Heroku
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your_secret_key
heroku addons:create mongolab:sandbox
git push heroku main
```

### Docker
```bash
docker build -t coalition-site .
docker run -p 5000:5000 coalition-site
```

## 📝 License

MIT - Voir LICENSE.md

## 👨‍💻 Author

nono1111111 (noebuttetferey@gmail.com)

## 🆘 Support

Pour les problèmes, ouvrez une issue sur GitHub ou contactez-moi directement.

---

**🌙 Coalition Mondiale Occulte - Site 42** | Construire une communauté sécurisée et contrôlée
