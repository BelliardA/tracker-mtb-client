// Importation des modules nécessaires
import * as Location from 'expo-location'; // pour accéder à la localisation
import { Stack } from 'expo-router'; // gestion de la navigation avec expo-router
import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps'; // composants de carte


export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // État pour vérifier si l'utilisateur a donné la permission d'accès à sa position
  const [isTracking, setIsTracking] = useState(false);
  const [route, setRoute] = useState<LatLng[]>([]); // Liste des positions GPS enregistrées (le "trajet")
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null); // Dernière position connue de l'utilisateur
  const watchId = useRef<Location.LocationSubscription | null>(null); // Référence pour pouvoir stopper le suivi GPS (watchPositionAsync retourne une souscription)
  const mapRef = useRef<MapView | null>(null); // Référence à la carte pour pouvoir l’animer (centrer la caméra)

  // useEffect appelé au premier rendu pour demander la permission GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync(); // demande permission
      setHasPermission(status === 'granted'); // met à jour l’état
    })();
  }, []);

  // Fonction pour commencer le suivi GPS
  const startTracking = async () => {
    setIsTracking(true); // on indique que le suivi est actif

    // watchPositionAsync permet d’écouter les changements de position
    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High, // meilleure précision possible
        timeInterval: 1000, // toutes les 1 seconde
        distanceInterval: 1, // ou tous les 1 mètre
      },
      (loc) => {
        // À chaque nouvelle position :
        const { latitude, longitude } = loc.coords;
        setLocation(loc.coords); // met à jour la position actuelle
        setRoute((prev) => [...prev, { latitude, longitude }]); // ajoute à la route
        // déplace la caméra sur la carte vers la nouvelle position
        mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration: 500 });
      }
    );
  };

  // Fonction pour arrêter le suivi GPS
  const stopTracking = () => {
    setIsTracking(false); // on désactive le suivi
    watchId.current?.remove(); // on arrête l'écoute de la position
    watchId.current = null;
  };

  // Gestion des permissions
  if (hasPermission === null) return <Text>Demande de permission...</Text>;
  if (!hasPermission) return <Text>Permission refusée</Text>;

  return (
    <View style={styles.container}>
      {/* Titre de la page avec expo-router */}
      <Stack.Screen options={{ title: 'Suivi GPS' }} />

      {/* Affichage de la carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude ?? 46.2044, // position par défaut : Genève
          longitude: location?.longitude ?? 6.1432,
          latitudeDelta: 0.01, // zoom vertical
          longitudeDelta: 0.01, // zoom horizontal
        }}
      >
        {/* Si un trajet existe, on affiche la ligne + les marqueurs */}
        {route.length > 0 && (
          <>
            <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" /> {/* Trajet */}
            <Marker coordinate={route[0]} title="Départ" /> {/* Début */}
            <Marker coordinate={route[route.length - 1]} title="Position actuelle" /> {/* Fin */}
          </>
        )}
      </MapView>

      {/* Zone de boutons et infos */}
      <View style={styles.controls}>
        <Button
          title={isTracking ? 'Arrêter' : 'Démarrer'}
          onPress={isTracking ? stopTracking : startTracking}
        />
        {location && (
          <View style={styles.info}>
            <Text>location : {JSON.stringify(location)}</Text>
            <Text>Latitude : {location.latitude.toFixed(5)}</Text>
            <Text>Longitude : {location.longitude.toFixed(5)}</Text>
            {/* <Text>Vitesse : {(location.speed * 3.6).toFixed(2)} km/h</Text> */}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    padding: 10,
    backgroundColor: 'white',
  },
  info: {
    marginTop: 10,
  },
});