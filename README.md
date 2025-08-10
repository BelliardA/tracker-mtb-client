# Tracker MTB Client

Application mobile multiplateforme pour suivre et analyser des descentes en VTT. Elle permet aux riders d'enregistrer leurs sessions grâce aux capteurs du smartphone et de visualiser leurs pistes sur une carte interactive.

## Fonctionnalités

- Authentification avec stockage sécurisé du jeton
- Gestion complète du profil du rider
- Affichage de toutes les pistes sur une carte interactive
- Enregistrement d'une descente via GPS, accéléromètre, gyroscope et baromètre
- Sauvegarde hors ligne des données en cas de perte de réseau
- Visualisation des détails d'une piste et navigation vers son départ

## Pile technologique

- [React Native](https://reactnative.dev) 0.79 & [React](https://react.dev) 19
- [Expo](https://expo.dev) 53 et [Expo Router](https://docs.expo.dev/router/introduction)
- [TypeScript](https://www.typescriptlang.org)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) et [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Axios](https://axios-http.com) pour la communication API REST

## Structure du projet

```
app/
  components/    # composants réutilisables
  pages/         # pages routées
  styles/        # thèmes et couleurs
  utils/         # fonctions utilitaires
context/         # AuthContext
hooks/           # hooks personnalisés
types/           # types partagés
```

## Démarrage

1. Installer les dépendances

   ```bash
   npm install
   ```

2. Définir l'URL du serveur API dans la variable d'environnement :
   ```bash
   export EXPO_PUBLIC_URL_SERVEUR_API_DEV=https://mon-api.example
   ```
3. Lancer l'application en mode développement

   ```bash
   npx expo start
   ```

## Scripts utiles

- `npm run android` : build et installation sur Android
- `npm run ios` : build et installation sur iOS
- `npm run web` : lancement dans le navigateur
- `npm run lint` : analyse du code avec ESLint
- `npm run format` : formatage avec Prettier
- `npm run ci-check` : format + lint + vérification Expo + prébuild
