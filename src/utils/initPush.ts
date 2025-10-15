import { auth, db } from '@/config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications'; // Import Expo Notifications

export async function initPushToken() {
  try {
    // Request notification permission from the user
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Push notifications are disabled');
      return;
    }

    // Get the Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const user = auth.currentUser;

    if (user && token) {
      // Save the device token in Firestore for the current user
      await setDoc(doc(db, 'customers', user.uid), { deviceToken: token }, { merge: true });
      console.log('Device token saved:', token);
    }

    // Handle token refresh
    Notifications.addPushTokenListener(async (newToken) => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, 'customers', currentUser.uid), { deviceToken: newToken }, { merge: true });
        console.log('Device token refreshed:', newToken);
      }
    });
  } catch (err) {
    console.error('initPushToken error:', err);
  }
}
