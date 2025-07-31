// Color palette - Natural Adventure (Palette 1)
// Used across the app for consistent theming
export const colors = {
  primary: '#606C38',       // Forest Green – used for main CTAs or headers
  secondary: '#283618',     // Dark Olive – used for backgrounds or text
  background: '#FEFAE0',    // Cream – main app background
  accent: '#DDA15E',        // Sand – highlights, icons
  warning: '#BC6C25',       // Burnt Orange – alerts or important actions      // Alerts, strong accents
};


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
