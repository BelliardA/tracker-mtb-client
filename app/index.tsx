import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import DataSender from './pages/DataSender';
import Login from './pages/Login';
import Map from './pages/Map';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 20,
          height: 60,
          elevation: 5,
          zIndex: 2,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 20,
            }}
          />
        ),
      }}
    >
      <Tab.Screen name="Map" component={Map} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen
        name="DataSender"
        component={DataSender}
        options={{ tabBarLabel: 'Data' }}
      />
    </Tab.Navigator>
  );
}

function AppContainer() {
  const { authState } = useAuth();
  return authState?.authenticated ? <MainTabs /> : <Login />;
}

export default function App() {
  return (
      <AuthProvider>
        <AppContainer />
      </AuthProvider>
  );
}
