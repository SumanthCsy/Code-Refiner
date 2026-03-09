import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app;
try {
    if (isConfigValid) {
        app = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase configuration is missing or invalid. Authentication features will be disabled.");
        // Initialize with a dummy app to prevent crashes if other parts of the code call it
        // However, initializeApp needs a valid config. 
        // Better: export null or a dummy object and check for it in AuthContext.
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

