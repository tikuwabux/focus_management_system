import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserDocument = useCallback(async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await setDoc(ref, {
        email: firebaseUser.email,
        mainGoal: { text: '', deadline: '' },
        shutdownList: [],
        dailyTasks: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const newSnapshot = await getDoc(ref);
      setUserDoc(newSnapshot.data());
    } else {
      setUserDoc(snapshot.data());
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserDocument(firebaseUser);
      } else {
        setUser(null);
        setUserDoc(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserDocument]);

  const refreshUserDoc = useCallback(async () => {
    if (!user) return null;
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    if (snapshot.exists()) {
      const data = snapshot.data();
      setUserDoc(data);
      return data;
    }
    return null;
  }, [user]);

  const logout = useCallback(() => signOut(auth), []);

  const value = {
    user,
    userDoc,
    setUserDoc,
    loading,
    refreshUserDoc,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
