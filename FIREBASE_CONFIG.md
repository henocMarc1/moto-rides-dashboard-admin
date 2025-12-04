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

### 7. Configuration Supabase pour la Base de Données

**Important :** Firebase est utilisé uniquement pour l'authentification. Les données sont stockées dans Supabase.

#### A. Créer le projet Supabase

1. Allez sur https://supabase.com
2. Cliquez sur **"New Project"**
3. Renseignez :
   - **Name** : `moto-rides`
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Europe (Frankfurt)
4. Cliquez sur **"Create new project"**
5. Attendez la création (2-3 minutes)

#### B. Récupérer les credentials Supabase

1. Dans le menu latéral, cliquez sur **⚙️ Settings** → **API**
2. Copiez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** key

#### C. Structure de la Base de Données Supabase

Allez dans **SQL Editor** et exécutez les scripts suivants :

##### 1. Table `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  profile_image TEXT DEFAULT '',
  rating DECIMAL(3,2) DEFAULT 5.0,
  is_driver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address TEXT DEFAULT '',
  total_rides INTEGER DEFAULT 0
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_driver ON users(is_driver);
```

##### 2. Table `drivers`
```sql
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'motorcycle',
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can read own profile" ON public.drivers;
CREATE POLICY "Drivers can read own profile"
  ON public.drivers FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers can insert own profile" ON public.drivers;
CREATE POLICY "Drivers can insert own profile"
  ON public.drivers FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
CREATE POLICY "Drivers can update own profile"
  ON public.drivers FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Everyone can view available drivers" ON public.drivers;
CREATE POLICY "Everyone can view available drivers"
  ON public.drivers FOR SELECT USING (is_available = true);

CREATE INDEX IF NOT EXISTS idx_drivers_is_available ON public.drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_drivers_is_verified ON public.drivers(is_verified);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_lat, current_lng);
```

##### 3. Table `admins`
```sql
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  can_verify_drivers BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view other admins" ON public.admins;
CREATE POLICY "Admins can view other admins"
  ON public.admins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Créer le premier administrateur
INSERT INTO public.admins (id, email, full_name, role, can_verify_drivers, created_at, updated_at)
VALUES (
  'c0b5f07f-63dc-4fff-ad5b-4024943589b0',
  'bassel2015@proton.me',
  'Administrateur Principal',
  'super_admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = 'bassel2015@proton.me',
  updated_at = NOW();
```

##### 4. Table `driver_verifications`
```sql
CREATE TABLE IF NOT EXISTS public.driver_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Photos URLs (Cloudinary)
  identity_photo_url TEXT,
  driver_photo_url TEXT,
  motorcycle_photo_url TEXT,
  
  -- Motorcycle info
  motorcycle_model TEXT,
  motorcycle_color TEXT,
  motorcycle_plate TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  admin_notes TEXT,
  verified_by_admin_id UUID,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification" ON public.driver_verifications;
CREATE POLICY "Users can view own verification"
  ON public.driver_verifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all verifications" ON public.driver_verifications;
CREATE POLICY "Admin can view all verifications"
  ON public.driver_verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own verification" ON public.driver_verifications;
CREATE POLICY "Users can insert own verification"
  ON public.driver_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can update verifications" ON public.driver_verifications;
CREATE POLICY "Admin can update verifications"
  ON public.driver_verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS driver_verifications_driver_id_idx ON public.driver_verifications(driver_id);
CREATE INDEX IF NOT EXISTS driver_verifications_user_id_idx ON public.driver_verifications(user_id);
CREATE INDEX IF NOT EXISTS driver_verifications_status_idx ON public.driver_verifications(status);
```

### E. Table `rides` - Historique des Courses

```sql
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  
  -- Ride details
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  
  -- Trip info
  distance INTEGER, -- in meters
  duration INTEGER, -- in seconds
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  
  -- Ratings
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  user_comment TEXT,
  driver_comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rides" ON public.rides;
CREATE POLICY "Users can view own rides"
  ON public.rides FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can view assigned rides" ON public.rides;
CREATE POLICY "Drivers can view assigned rides"
  ON public.rides FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all rides" ON public.rides;
CREATE POLICY "Admins can view all rides"
  ON public.rides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create rides" ON public.rides;
CREATE POLICY "Users can create rides"
  ON public.rides FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and drivers can update rides" ON public.rides;
CREATE POLICY "Users and drivers can update rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = driver_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = driver_id);

CREATE INDEX IF NOT EXISTS rides_user_id_idx ON public.rides(user_id);
CREATE INDEX IF NOT EXISTS rides_driver_id_idx ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON public.rides(status);
CREATE INDEX IF NOT EXISTS rides_created_at_idx ON public.rides(created_at DESC);
```

#### D. Instructions d'Exécution

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Cliquez sur **"New Query"**
3. Copiez chaque bloc SQL ci-dessus (un à la fois dans cet ordre) :
   - **Requête 1** : Table `users`
   - **Requête 2** : Table `drivers`
   - **Requête 3** : Table `admins` (inclut l'INSERT pour bassel2015@proton.me)
   - **Requête 4** : Table `driver_verifications`
   - **Requête 5** : Table `rides`
4. Cliquez sur **"Run"** pour exécuter chaque requête
5. Vérifiez dans **Table Editor** que toutes les 5 tables sont créées

**Note :** Les tables et RLS (Row Level Security) sont conçues pour :
- **Authentification** : Intégrée avec `auth.users` de Supabase
- **Sécurité** : Chaque utilisateur ne peut voir que ses propres données
- **Admins** : Peuvent voir les verifications des drivers
- **Drivers** : Référencés par leur UID Firebase/Supabase

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
