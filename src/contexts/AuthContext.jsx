import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const activeRequestRef = useRef(0);

  const fetchUserDocument = useCallback(async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid);
    let snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await setDoc(ref, {
        email: firebaseUser.email,
        mainGoal: { text: '', deadline: '' },
        shutdownList: [],
        dailyTasks: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      snapshot = await getDoc(ref);
    }

    return snapshot.exists() ? snapshot.data() : null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      activeRequestRef.current += 1;
      const requestId = activeRequestRef.current;

      if (!isMounted) {
        return;
      }

      if (firebaseUser) {
        setLoading(true);
        setUser(firebaseUser);
        setUserDoc(null);

        try {
          const data = await fetchUserDocument(firebaseUser);
          if (isMounted && requestId === activeRequestRef.current) {
            setUserDoc(data);
          }
        } catch (error) {
          console.error('Failed to load user document', error);
          if (isMounted && requestId === activeRequestRef.current) {
            setUserDoc(null);
          }
        } finally {
          if (isMounted && requestId === activeRequestRef.current) {
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchUserDocument]);

  const refreshUserDoc = useCallback(async () => {
    if (!user) return null;
    try {
      const data = await fetchUserDocument(user);
      setUserDoc(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh user document', error);
      return null;
    }
  }, [user, fetchUserDocument]);

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
