import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface ApiKey {
    id: string;
    provider: string;
    key: string;
    label: string;
    customModel?: string;
    customEndpoint?: string;
    active: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    apiKeys: ApiKey[];
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserName: (name: string) => Promise<void>;
    logout: () => Promise<void>;
    syncApiKeys: (keys: ApiKey[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
        const stored = localStorage.getItem('coderefiner_keys') || localStorage.getItem('code_refiner_all_keys');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        // Safety timeout: ensure app loads even if Firebase hangs
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("Auth listener timed out. Proceeding and disabling auth features.");
                setLoading(false);
            }
        }, 5000);

        if (!auth || !db) {
            setLoading(false);
            clearTimeout(safetyTimer);
            return;
        }

        const firebaseAuth = auth;
        const firestore = db;

        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (currentUser) => {
            setUser(currentUser);

            try {
                if (currentUser) {
                    // Initial fetch from Firestore
                    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                    if (userDoc.exists() && userDoc.data().keys) {
                        const cloudKeys = userDoc.data().keys;
                        setApiKeys(cloudKeys);
                        updateLocalCache(cloudKeys);
                    }

                    // Setup listener for real-time updates
                    unsubscribeFirestore = onSnapshot(doc(firestore, 'users', currentUser.uid), (doc) => {
                        if (doc.exists() && doc.data().keys) {
                            const cloudKeys = doc.data().keys;
                            setApiKeys(cloudKeys);
                            updateLocalCache(cloudKeys);
                        }
                    });
                } else {
                    if (unsubscribeFirestore) {
                        unsubscribeFirestore();
                        unsubscribeFirestore = null;
                    }
                }
            } catch (error) {
                console.error("Firestore sync error:", error);
            } finally {
                setLoading(false);
                clearTimeout(safetyTimer);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
            clearTimeout(safetyTimer);
        };
    }, []);

    const updateLocalCache = (keys: ApiKey[]) => {
        localStorage.setItem('coderefiner_keys', JSON.stringify(keys));
        localStorage.setItem('code_refiner_all_keys', JSON.stringify(keys));

        // Update active key for legacy logic
        const active = keys.find(k => k.active);
        if (active) {
            localStorage.setItem('code_refiner_api_key', active.key);
            localStorage.setItem('code_refiner_provider', active.provider);
            localStorage.setItem('code_refiner_use_custom', 'true');
            if (active.customModel) localStorage.setItem('code_refiner_custom_model', active.customModel);
            else localStorage.removeItem('code_refiner_custom_model');
            if (active.customEndpoint) localStorage.setItem('code_refiner_custom_endpoint', active.customEndpoint);
            else localStorage.removeItem('code_refiner_custom_endpoint');
        } else {
            localStorage.setItem('code_refiner_use_custom', 'false');
        }
    };

    const syncApiKeys = async (newKeys: ApiKey[]) => {
        setApiKeys(newKeys);
        updateLocalCache(newKeys);

        if (user && db) {
            try {
                await setDoc(doc(db, 'users', user.uid), { keys: newKeys }, { merge: true });
            } catch (error) {
                console.error("Firestore sync failed:", error);
                throw error;
            }
        }
    };

    const loginWithGoogle = async () => {
        if (!auth) throw new Error("Authentication is not configured.");
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        if (!auth) throw new Error("Authentication is not configured.");
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Login with email failed:", error);
            throw error;
        }
    };

    const signupWithEmail = async (email: string, pass: string, name: string) => {
        if (!auth) throw new Error("Authentication is not configured.");
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            if (res.user) {
                await updateProfile(res.user, { displayName: name });
            }
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        if (!auth) throw new Error("Authentication is not configured.");
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Password reset failed:", error);
            throw error;
        }
    };

    const updateUserName = async (name: string) => {
        if (!user || !auth) return;
        try {
            await updateProfile(user, { displayName: name });
            // Refresh local user state
            setUser({ ...auth.currentUser! } as User);
        } catch (error) {
            console.error("Name update failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            apiKeys,
            loginWithGoogle,
            loginWithEmail,
            signupWithEmail,
            resetPassword,
            updateUserName,
            logout,
            syncApiKeys
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
