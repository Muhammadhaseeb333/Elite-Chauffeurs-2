import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBP3DwlTHli19zhQWZ0mgViq06APEd90Jk',
  authDomain: 'elitechauffeurs-7840a.firebaseapp.com',
  projectId: 'elitechauffeurs-7840a',
  storageBucket: 'elitechauffeurs-7840a.appspot.com',
  messagingSenderId: '962290238047',
  appId: '1:962290238047:android:d4c53123c4d65b9134d1ea',
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };