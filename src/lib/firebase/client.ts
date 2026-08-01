import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDti-Da0DyrfEWE-fV9SResBdA8f-LYGe0',
  authDomain: 'ship7-a8c70.firebaseapp.com',
  projectId: 'ship7-a8c70',
  storageBucket: 'ship7-a8c70.firebasestorage.app',
  messagingSenderId: '581992169215',
  appId: '1:581992169215:web:777d40d06a470570a8d6ca',
  measurementId: 'G-8Q7M14XLTW',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
