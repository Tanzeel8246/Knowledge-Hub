import { Alert } from 'react-native';

if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      'Fatal JS Error Caught!',
      `${error.name}: ${error.message}\n\nPlease take a screenshot of this and send it to the developer.`
    );
  });
}

// Start Expo Router
import 'expo-router/entry';
