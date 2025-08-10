# Tracker MTB Client

Application mobile multiplateforme (iOS, Android et Web) pour enregistrer et analyser des descentes en VTT. Les riders peuvent suivre leurs sessions grâce aux capteurs du smartphone et visualiser toutes leurs pistes sur une carte interactive.

## Fonctionnalités

- Authentification par jeton et stockage sécurisé avec SecureStore
- Inscription et édition du profil du rider
- Carte interactive avec localisation en temps réel et affichage des pistes
- Enregistrement d'une descente via GPS, accéléromètre, gyroscope et baromètre
- Sauvegarde hors ligne des sessions et envoi différé à la reconnexion
- Détails d'une piste : statistiques, navigation vers le départ, suppression
- Tableau de bord personnel avec statistiques globales

## Pile technologique

- [React Native](https://reactnative.dev) 0.79 & [React](https://react.dev) 19
- [Expo](https://expo.dev) 53 et [Expo Router](https://docs.expo.dev/router/introduction)
- [TypeScript](https://www.typescriptlang.org)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/), [Location](https://docs.expo.dev/versions/latest/sdk/location/) et [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Axios](https://axios-http.com) pour la communication API
- [EAS Build](https://docs.expo.dev/build/introduction/) pour la distribution

## Structure du projet

```
app/
  components/   # composants réutilisables (TrackDetails, formulaires...)
  pages/        # pages routées (Login, Map, Profile, DataSender...)
  styles/       # thèmes et couleurs
  utils/        # fonctions utilitaires
assets/         # images et polices
context/        # AuthContext pour l'authentification
hooks/          # hooks personnalisés
types/          # définitions de types partagés
```

## Configuration et démarrage

1. Installer les dépendances

   ```bash
   npm install
   ```

2. Définir l'URL du serveur API dans une variable d'environnement
   ```bash
   export EXPO_PUBLIC_URL_SERVEUR_API_DEV=https://mon-api.example
   ```
3. Lancer l'application en mode développement

   ```bash
   npx expo start
   ```

   Ouvrez l'application sur un appareil, un émulateur ou via Expo Go.

## Scripts utiles

- `npm run android` : build et installation Android
- `npm run ios` : build et installation iOS
- `npm run web` : lancement dans le navigateur
- `npm run lint` : analyse du code avec ESLint
- `npm run format` : formatage avec Prettier
- `npm run build` : build via EAS (profil preview)
- `npm run ci-check` : format + lint + doctor + prébuild
