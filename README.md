# Quiz Application - Platform de Formation

Une application web complète pour créer et gérer des quizzes de formation avec un tableau de bord admin.

## 📋 Fonctionnalités

### Pour les participants
- Accès aux quizzes disponibles
- Réponses aux questions (QCM et texte libre)
- Navigation question par question
- Résultats instantanés avec score détaillé

### Pour l'administrateur
- Authentification sécurisée
- Création et édition de quizzes
- Questions multiples (QCM et texte)
- Points personnalisés par question
- Vue des résultats des participants
- Suppression de quizzes

## 🚀 Installation locale

### Prérequis
- Node.js (v14+)
- npm

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/rolk2001/quiz-app.git
cd quiz-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer .env avec vos identifiants
# ADMIN_EMAIL=votre_email@example.com
# ADMIN_PASS=votre_mot_de_passe_fort
```

4. **Lancer le serveur**
```bash
npm start
```

L'application est accessible sur **http://localhost:3000**

## 📱 Accès

- **Quiz participants** : http://localhost:3000
- **Admin dashboard** : http://localhost:3000/admin.html

Identifiants admin (par défaut) :
- Email : `mbaibem1965@gmail.com`
- Mot de passe : `mb1965`

## 🔐 Variables d'environnement

**CRITICAL**: En production, vous DEVEZ configurer ces variables :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ADMIN_EMAIL` | Email de l'administrateur | mbaibem1965@gmail.com |
| `ADMIN_PASS` | Mot de passe de l'administrateur | MonMotDePasseFort123! |
| `PORT` | Port du serveur (optionnel) | 3000 |

### Render (Production)
1. Allez dans **Settings** de votre app Render
2. Allez dans **Environment**
3. Ajoutez les variables d'environnement

**⚠️ IMPORTANT**: Ne commitez JAMAIS le fichier `.env` en production. Utilisez uniquement les variables d'environnement du service d'hébergement.

## 📂 Structure du projet

```
quiz-app/
├── server.js              # Serveur Express + APIs
├── public/
│   ├── index.html         # Page d'accueil (quizzes)
│   ├── admin.html         # Dashboard admin
│   ├── app.js            # Logique quizzes participant
│   ├── admin.js          # Logique admin
│   ├── style.css         # Styles responsifs
│   └── quizzes.json      # Quizzes publiés
├── data/
│   └── results.json      # Résultats des participants
├── .env                  # Variables d'environnement (LOCAL ONLY)
├── .env.example          # Template pour variables
├── .gitignore            # Fichiers ignorés par Git
└── package.json          # Dépendances Node
```

## 🛠️ Technologie utilisée

- **Backend** : Node.js + Express
- **Frontend** : HTML5 + CSS3 + JavaScript vanilla
- **Stockage** : Fichiers JSON
- **Authentification** : Token-based (localStorage)

## 📊 API Endpoints

### Public
- `GET /` - Page d'accueil
- `POST /api/submit` - Soumettre un résultat

### Admin (Token requis)
- `POST /api/login` - Connexion
- `POST /api/logout` - Déconnexion
- `GET /api/admin/quizzes` - Lister les quizzes
- `POST /api/admin/quizzes` - Créer un quiz
- `PUT /api/admin/quizzes/:id` - Modifier un quiz
- `DELETE /api/admin/quizzes/:id` - Supprimer un quiz
- `GET /api/admin/results` - Voir les résultats

## 🌐 Déploiement sur Render

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour les instructions détaillées.

## 📝 License

Propriétaire - Quiz Application 2026

## 👤 Auteur

QUIZZ Application
