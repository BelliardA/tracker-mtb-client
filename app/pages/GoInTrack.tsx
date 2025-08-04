import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GoInTrack() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🏁 Vous êtes sur le bon chemin !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#283618',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#FEFAE0',
    textAlign: 'center',
    padding: 20,
  },
});