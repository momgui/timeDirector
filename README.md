# timeDirector — Eos

**Transforme tes objectifs en actions concrètes.**
Application mobile qui utilise un LLM pour découper automatiquement un objectif en tâches jalonnées, planifie ces tâches dans ton calendrier et t'aide à rester concentré pendant les sessions de travail.

<!-- Ajouter capture ou GIF ici -->

## Fonctionnalités

- 🎯 **Décomposition intelligente d'objectifs** : entre un objectif en langage naturel → l'app génère jalons, tâches, et sous-tâches avec Gemini
- 📅 **Planning hebdomadaire** avec suggestions automatiques de créneaux
- 🧘 **Sessions de focus** avec suivi et statistiques
- 🧠 **Brain dump** : capture rapide d'idées à trier plus tard
- ✂️ **Smart Split** : découpage assisté par IA d'une grosse tâche
- 🔐 **Auth Google / Apple** + synchro Supabase
- 🎨 **Design system maison** avec thème clair/sombre

## Stack

- **React Native + Expo 54**
- **TypeScript**
- **Supabase** — auth + persistance cloud
- **Google Gemini API** — décomposition intelligente
- **@react-native-google-signin/google-signin** + `expo-apple-authentication`
- **@react-navigation** — navigation stack
- **GitHub Actions** — build Android automatisé (keystore chiffré)

## Structure

```
src/
├── screens/
│   ├── DashboardScreen.tsx
│   ├── GoalInputScreen.tsx    # Saisie d'objectif + génération IA
│   ├── GoalDetailsScreen.tsx
│   ├── FocusSessionScreen.tsx # Timer de focus
│   ├── SettingsScreen.tsx
│   └── ...
├── components/                # Modals & UI atomiques
├── context/                   # Auth, Theme, Focus
├── navigation/AppNavigator.tsx
├── design-system/             # Tokens + composants primitifs
└── theme/
```

## Installation

Prérequis : Node.js ≥ 20, Expo CLI, un compte Supabase, une clé Gemini API.

```bash
cp .env.example .env
# → remplir GEMINI_API_KEY, GOOGLE_WEB_CLIENT_ID, etc.

npm install
npm start
```

## Build Android

Le workflow GitHub Actions [`android_build.yml`](.github/workflows/android_build.yml) construit un APK signé à chaque push sur `master`. Il utilise les secrets suivants (à configurer dans les settings du repo) :

- `ANDROID_KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

Un workflow séparé [`generate_keystore.yml`](.github/workflows/generate_keystore.yml) génère le keystore initial.

## Prompts / agents

Le fichier [`PROMPTS.md`](PROMPTS.md) contient les prompts affinés utilisés dans les différentes fonctionnalités IA (décomposition d'objectifs, smart split, brain dump).

## Roadmap

Voir [`ROADMAP.md`](ROADMAP.md).

## Statut

En développement actif. Beta interne.
