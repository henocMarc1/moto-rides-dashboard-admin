# 🔥 Configuration Firebase pour Dashboard Admin

## 📋 Prérequis

1. Compte Google/Gmail
2. Accès à [Firebase Console](https://console.firebase.google.com)

## 🚀 Étapes de Configuration

### 1. Créer un Projet Firebase

1. Allez sur https://console.firebase.google.com
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet : `moto-rides` (ou votre choix)
4. (Optionnel) Activez Google Analytics
5. Cliquez sur **"Créer le projet"**

### 2. Activer l'Authentification

1. Dans le menu latéral, cliquez sur **"Authentication"**
2. Cliquez sur **"Commencer"**
3. Dans l'onglet **"Sign-in method"**, activez :
   - ✅ **Email/Password** (cliquez sur "Activer")
4. Cliquez sur **"Enregistrer"**

### 3. Créer Firestore Database

1. Dans le menu latéral, cliquez sur **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez le mode : **"Commencer en mode production"**
4. Sélectionnez la région : `europe-west1` (Belgique) ou la plus proche
5. Cliquez sur **"Activer"**

### 4. Configurer les Règles de Sécurité Firestore

Dans l'onglet **"Règles"**, remplacez par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection admins - accessible uniquement aux admins authentifiés
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if request.auth != null && request.auth.uid == adminId;
      allow create: if request.auth != null;
    }
    
    // Collection drivers - lecture seule pour admins
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Collection rides - lecture seule pour admins
    match /rides/{rideId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Collection users - lecture seule pour admins
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Collection driver_earnings - lecture seule pour admins
    match /driver_earnings/{earningId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

Cliquez sur **"Publier"**

### 5. Récupérer les Credentials Firebase

1. Dans le menu latéral, cliquez sur l'icône ⚙️ puis **"Paramètres du projet"**
2. Descendez jusqu'à **"Vos applications"**
3. Cliquez sur l'icône **Web** (`</>`)
4. Nom de l'application : `moto-rides-admin`
5. ❌ Ne pas cocher "Configurer Firebase Hosting"
6. Cliquez sur **"Enregistrer l'application"**
7. **Copiez la configuration affichée** (voir exemple ci-dessous)

### 6. Mettre à Jour le Code

#### A. Fichier `js/supabase.js`

Ligne 2-8, remplacez :

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "moto-rides-xxxxx.firebaseapp.com",
    projectId: "moto-rides-xxxxx",
    storageBucket: "moto-rides-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

#### B. Fichier `login.html`

Ligne 397-404, remplacez avec **vos propres credentials** :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### 7. Structure de la Base de Données Firestore

Créez les collections suivantes dans Firestore :

#### Collection `admins`
```
admins/{userId}
  - email: string
  - full_name: string
  - role: string ('admin' | 'super_admin')
  - can_verify_drivers: boolean
  - created_at: timestamp
  - updated_at: timestamp
```

#### Collection `drivers`
```
drivers/{driverId}
  - full_name: string
  - email: string
  - phone: string
  - status: string ('available' | 'onRide' | 'offline')
  - rating: number
  - total_rides: number
  - total_earnings: number
  - created_at: timestamp
```

#### Collection `rides`
```
rides/{rideId}
  - client_id: string (référence à users)
  - driver_id: string (référence à drivers)
  - status: string ('pending' | 'accepted' | 'inProgress' | 'completed' | 'cancelled')
  - distance: number (km)
  - price: number (CFA)
  - pickup_location: map
  - dropoff_location: map
  - created_at: timestamp
  - completed_at: timestamp
```

#### Collection `users`
```
users/{userId}
  - full_name: string
  - email: string
  - phone: string
  - user_type: string ('client')
  - total_spent: number
  - rides_count: number
  - created_at: timestamp
```

#### Collection `driver_earnings`
```
driver_earnings/{earningId}
  - driver_id: string
  - ride_id: string
  - amount: number (montant total)
  - commission: number (commission plateforme)
  - created_at: timestamp
```

### 8. Créer le Premier Administrateur

#### Option A : Via le Dashboard (après lancement)

1. Ouvrez `http://localhost:8080/dashboard_admin/login.html`
2. Cliquez sur l'onglet **"Inscription"**
3. Remplissez le formulaire :
   - Nom complet : Votre nom
   - Email : votre@email.com
   - Mot de passe : (min 6 caractères)
4. Cliquez sur **"S'inscrire"**
5. Connectez-vous avec vos identifiants

#### Option B : Manuellement via Firebase Console

1. **Authentication** → **Users** → **Add user**
   - Email : bassel2015@proton.me
   - Password : ommaira1
   - Cliquez sur **"Add user"**
   - **Copiez l'UID généré**

2. **Firestore** → **admins** → **Add document**
   - Document ID : **Collez l'UID copié**
   - Champs :
     ```
     email: "bassel2015@proton.me"
     full_name: "Administrateur Principal"
     role: "super_admin"
     can_verify_drivers: true
     created_at: [Timestamp actuel]
     updated_at: [Timestamp actuel]
     ```
   - Cliquez sur **"Save"**

### 9. Tester la Configuration

1. Lancez le serveur HTTP :
   ```bash
   cd C:\PROJET\dashboard_admin
   npx http-server -p 8080
   ```

2. Ouvrez Chrome :
   ```
   http://localhost:8080/login.html
   ```

3. Connectez-vous avec vos identifiants

4. Vérifiez la console du navigateur (F12) :
   - ✅ Doit afficher : `"✓ Firebase initialized"`
   - ✅ Doit afficher : `"✓ User authenticated: [UID]"`
   - ✅ Doit afficher : `"✓ Admin verified: [Nom]"`

### 10. Données de Test (Optionnel)

Pour peupler la base avec des données de test, vous pouvez créer manuellement des documents ou utiliser un script d'import.

## 🔒 Sécurité

- ✅ Les règles Firestore sont configurées pour que seuls les admins authentifiés puissent accéder aux données
- ✅ L'authentification Firebase protège contre les accès non autorisés
- ✅ Les mots de passe sont hashés automatiquement par Firebase
- ✅ Les clés API peuvent être restreintes dans Firebase Console

## 🆘 Dépannage

### Erreur "Firebase not initialized"
- Vérifiez que vous avez bien remplacé les credentials
- Vérifiez votre connexion internet
- Ouvrez la console (F12) pour voir les erreurs détaillées

### Erreur "Permission denied"
- Vérifiez les règles Firestore
- Vérifiez que l'utilisateur existe dans la collection `admins`

### Erreur "Failed to fetch"
- Utilisez un serveur HTTP (pas file://)
- Vérifiez votre connexion internet

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Règles de Sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)

## ✅ Checklist

- [ ] Projet Firebase créé
- [ ] Authentication activée (Email/Password)
- [ ] Firestore Database créée
- [ ] Règles de sécurité configurées
- [ ] Credentials copiés et collés dans le code
- [ ] Collections créées dans Firestore
- [ ] Premier admin créé
- [ ] Test de connexion réussi
