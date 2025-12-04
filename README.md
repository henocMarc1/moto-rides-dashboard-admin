# Moto Rides - Dashboard Admin

Dashboard admin premium pour la gestion de l'application de ridesharing Moto Rides.

## 📋 Fonctionnalités

- **Dashboard** : Vue d'ensemble avec statistiques temps réel
- **Gestion Clients** : Liste complète des clients avec actions
- **Gestion Conducteurs** : Suivi des conducteurs et leurs performances
- **Historique Courses** : Visualisation de toutes les courses
- **Vérification Documents** : Approbation des documents conducteurs
- **Paramètres** : Configuration de l'application

## 🎨 Design Premium

- Thème noir/jaune/or professionnel
- Icônes SVG modernes (Material Design)
- Animations fluides et transitions élégantes
- Responsive sur tous les appareils
- Interface sombre pour réduire la fatigue oculaire

## 🚀 Démarrage Rapide

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Pas de serveur backend requis (données mockées)

### Installation

1. Clonez ou téléchargez le projet
2. Ouvrez `index.html` dans un navigateur
3. Naviguez en utilisant le menu latéral

### Structure des Fichiers

```
dashboard_admin/
├── index.html          # Page principale
├── css/
│   └── style.css       # Styles premium (1600+ lignes)
├── js/
│   └── script.js       # Logique interactive
└── assets/             # Images et ressources
```

## 📊 Pages Disponibles

### 1. Dashboard
- Statistiques clés (clients, conducteurs, courses, revenus)
- Graphiques interactifs (courses/jour, revenus/semaine)
- Courses récentes avec détails

### 2. Clients
- Tableau de tous les clients
- Nombre de trajets et montants dépensés
- Statut actif/inactif
- Actions (modification)

### 3. Conducteurs
- Liste des conducteurs actifs
- Rating et performance
- Revenus générés
- Statut en ligne/hors ligne

### 4. Courses
- Historique complet des trajets
- Filtrage par date
- Statuts (complété, en cours, annulé)
- Détails complets du trajet

### 5. Documents
- Vérification des permis et assurances
- Approbation/Rejet de documents
- Suivi des validations
- Cartes visuelles par conducteur

### 6. Paramètres
- Configuration de l'application
- Taux de commission
- Délais système
- Informations de support

## 🎯 Fonctionnalités JavaScript

### Recherche
- Recherche en temps réel dans les tableaux
- Raccourci: `Ctrl/Cmd + K`

### Navigation
- Menu latéral avec icônes SVG
- Navigation fluide entre les pages
- Indicateur d'activité

### Graphiques
- Chart.js pour les visualisations
- Graphiques interactifs et responsives
- Légendes personnalisées

### Notifications
- Notifications toast pour les actions
- Succès, erreur, info
- Disparition automatique

## 📱 Responsive Design

- **Desktop**: Layout complet avec sidebar
- **Tablet**: Sidebar réduite, contenu optimisé
- **Mobile**: Sidebar collapsible, affichage empilé

## 🎨 Couleurs Premium

- **Primaire**: `#FFD700` (Or/Jaune)
- **Fond**: `#1A1A1A` (Noir très foncé)
- **Secondaire**: `#252525` (Gris très foncé)
- **Texte**: `#E0E0E0` (Gris clair)
- **Succès**: `#4CAF50` (Vert)
- **Erreur**: `#F44336` (Rouge)
- **Alerte**: `#FF9800` (Orange)

## 💾 Mock Data

Les données affichées sont mockées pour démonstration:
- **Clients**: Jean Dupont, Marie Dubois, Pierre Martin, etc.
- **Conducteurs**: Ahmed K., Mamadou D., Kofi M.
- **Trajets**: Données d'exemple avec tarifs
- **Statistiques**: Chiffres réalistes pour présentation

## 🔐 Authentification

Pour ajouter l'authentification:
1. Créer une page `login.html`
2. Implémenter la vérification d'accès
3. Stocker les données utilisateur (localStorage ou API)

## 🔗 Intégration Backend

Pour connecter un backend:

```javascript
// Remplacer les données mockées par des API calls
fetch('/api/clients')
    .then(res => res.json())
    .then(data => updateTable(data));
```

## ⌨️ Raccourcis Clavier

- `Ctrl/Cmd + K` : Focus sur la recherche
- `Escape` : Effacer la recherche

## 📈 Graphiques Disponibles

- **Trajets par Jour** : Ligne avec aire remplie
- **Revenus par Semaine** : Histogramme

## 🎬 Animations

- Fade-in sur les pages
- Hover effects sur les éléments
- Slide-in pour les notifications
- Bounce animation du logo

## 🌐 Navigateurs Supportés

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 Licences

Gratuit pour usage personnel et commercial.

## 🤝 Support

Pour des questions ou bugs, contactez: support@motorides.com

## 📝 Améliorations Futures

- [ ] Authentification réelle
- [ ] Connexion API backend
- [ ] Export PDF des rapports
- [ ] Mode clair
- [ ] Notifications push
- [ ] Chat support admin
- [ ] Analytics avancées
- [ ] Multi-langue

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2 Décembre 2025  
**Développeur**: Moto Rides Team
