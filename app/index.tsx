import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button } from 'react-native';
import Barometre from './components/dataGetter/Barometre';
import DataSender from './pages/DataSender';

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
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name='Home' component={HomeScreen}/>
        <Stack.Screen name='DataSender' component={DataSender}/>
      </Stack.Navigator>
  );
}