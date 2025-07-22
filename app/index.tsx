import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button } from 'react-native';
import MapView from 'react-native-maps';
import DataSender from './pages/DataSender';
import Login from './pages/Login';
import { AuthProvider, useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }: { navigation: any }) {  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Use Data Sender"
        onPress={() => navigation.navigate('DataSender')}
      />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
      {/* <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 45.8745058,
          longitude: 6.0014561,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}></MapView> */}
    </AuthProvider>
  );
}

function Navigator() {
  const { authState, onLogout } = useAuth();

  return (
    <Stack.Navigator>
      {authState?.authenticated ? (
        <>  
          <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerRight: () => <Button onPress={onLogout} title="Logout" />,
          }}
        />
        <Stack.Screen name="DataSender" component={DataSender} />
        </>
        
      ) : (
        <Stack.Screen name="Login" component={Login} />
      )}
    </Stack.Navigator>
  );
}