import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  AuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  };

  const signIn = async (provider: AuthProvider) => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = () => signIn(googleProvider);

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        // Build settings to redirect back to the app after verification
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await firebaseSendEmailVerification(userCredential.user, actionCodeSettings);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await firebaseSendEmailVerification(auth.currentUser, actionCodeSettings);
      } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          // If the login is too old, we might need to re-authenticate
          // For now, we'll just throw the error and let the UI handle it or tell the user
          console.error('User needs to re-authenticate before deleting account');
        }
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signUpWithEmail, 
      signInWithEmail, 
      sendPasswordResetEmail, 
      sendVerificationEmail,
      logout,
      signInAnonymously,
      deleteAccount,
      refreshUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
