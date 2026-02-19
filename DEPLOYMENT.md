# Guide de déploiement sur Render

## 📋 Prérequis

- Compte GitHub (✅ Vous l'avez)
- Compte Render (gratuit sur https://render.com)
- Code poussé sur GitHub (✅ Fait)

## 🚀 Étapes de déploiement

### 1. Créer un compte Render et connecter GitHub

1. Allez sur **https://render.com**
2. Cliquez **"Sign up"**
3. Choisissez **"Sign up with GitHub"**
4. Autorisez Render à accéder à vos repos
5. Confirmez votre email

### 2. Créer une nouvelle Web Service

1. Dans le dashboard Render, cliquez **"New +"**
2. Sélectionnez **"Web Service"**
3. Cliquez **"Connect a repository"**
4. Recherchez et sélectionnez **`rolk2001/quiz-app`**
5. Cliquez **"Connect"**

### 3. Configurer la Web Service

Remplissez les champs :

| Champ | Valeur |
|-------|--------|
| **Name** | `quiz-app` (ou ce que vous voulez) |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (gratuit) |

### 4. Ajouter les variables d'environnement

1. Descendez jusqu'à **"Environment"**
2. Cliquez **"Add Environment Variable"**
3. Ajoutez ces variables :

```
ADMIN_EMAIL = mbaibem1965@gmail.com
```

4. Cliquez **"Add Environment Variable"** à nouveau
5. Ajoutez :

```
ADMIN_PASS = mb1965
```

⚠️ **Important** : Changez ces valeurs avec des identifiants forts avant d'aller en production réelle !

### 5. Déployer

1. Cliquez **"Create Web Service"**
2. Render va automatiquement :
   - Cloner votre repo
   - Installer les dépendances
   - Démarrer le serveur
3. Attendez la fin du déploiement (2-3 minutes)
4. Une URL sera générée (ex: `https://quiz-app-xyz.onrender.com`)

## ✅ Vérifier le déploiement

1. Accédez à votre URL Render
2. Testez la **page d'accueil** : `https://quiz-app-xyz.onrender.com`
3. Testez l'**admin dashboard** : `https://quiz-app-xyz.onrender.com/admin.html`
4. Connectez-vous avec vos identifiants

## 🔄 Redéploiement automatique

Chaque fois que vous poussez du code sur `main` :
```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Render va **automatiquement** redéployer !

## 📊 Monitorer votre app

Dans le dashboard Render :
- **Logs** : Voir les logs de votre app
- **Metrics** : CPU, RAM, requêtes
- **Deploys** : Historique des déploiements

## 🛠️ Dépannage

### La page blanche / Erreur 502

1. Vérifiez les **logs** dans Render
2. Vérifiez les **variables d'environnement**
3. Vérifiez que `ADMIN_EMAIL` et `ADMIN_PASS` sont configurées

### Mon app s'arrête après 30 minutes

C'est normal sur le plan gratuit de Render. Les apps au repos consomment pas de ressources, mais au premier accès ça redémarre.

### Je veux un domaine personnalisé

1. Dans Render → **Settings** de votre app
2. **Custom Domain**
3. Configurez votre domaine (DNS pointage)

## 🔐 Sécurité en production

Avant de passer en production réelle :

1. **Changez les identifiants par défaut**
   - Dans Render → Settings → Environment
   - Mettez des identifiants forts

2. **Activez HTTPS** (Render le fait automatiquement)

3. **Sauvegardez les résultats**
   - Les fichiers JSON sont stockés dans l'app
   - Sur Render (plan gratuit), ils sont perdus au redéploiement
   - **Solution** : Migrer vers une base de données (MongoDB, Postgres, etc.)

## 💾 Remarque importante : Persistance des données

**Actuellement** : Les quizzes et résultats sont stockés en fichiers JSON
**Problème** : Render détruit les fichiers entre les redéploiements

### Solutions :
1. **Garder les JSON** (pour démo/petit usage)
   - Les données survivront seulement pendant 30 jours sur plan gratuit

2. **Utiliser une base de données** (meilleur)
   - MongoDB Atlas (gratuit)
   - Firebase
   - PostgreSQL

Pour migrer : Créez un issue sur GitHub ou demandez de l'aide !

## ✨ Vous êtes prêt !

Votre app est maintenant en ligne sur Render !

**URL** : `https://quiz-app-xyz.onrender.com`

Partagez-la avec vos participants ! 🎉
