import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from './pages/Login';
import Map from './pages/Map';

function AppContainer() {
  const { authState } = useAuth();
  return authState?.authenticated ? <Map /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContainer />
    </AuthProvider>
  );
}
