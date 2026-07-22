// AuthProvider.jsx — exposes Firebase auth state + actions via React context.
// Uses Firebase's default persistence (do NOT hand-store tokens in localStorage).
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfigured } from "../lib/firebase.js";

const AuthContext = createContext(null);

// Local-only dev bypass, mirroring the server's AUTH_DEV_BYPASS. Set
// VITE_AUTH_DEV_BYPASS=true in client/.env to skip Firebase sign-in entirely
// and use a fixed local dev identity (matches the server's dev-bypass uid so
// the two line up, though the server ignores this value either way once its
// own AUTH_DEV_BYPASS is on). NEVER set this in a real deployment — it must be
// paired with the server also being in dev bypass, or requests will simply
// 401 against a real Firebase-protected server.
const DEV_BYPASS = import.meta.env.VITE_AUTH_DEV_BYPASS === "true";
const DEV_USER = { uid: "dev-local-user", email: "dev@localhost", displayName: "Local Dev (no Firebase)" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_BYPASS ? DEV_USER : null);
  const [loading, setLoading] = useState(!DEV_BYPASS);

  useEffect(() => {
    if (DEV_BYPASS) return; // fixed dev user set above; no Firebase listener
    if (!firebaseConfigured || !auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    configured: firebaseConfigured || DEV_BYPASS,
    devBypass: DEV_BYPASS,
    signInEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUpEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signInGoogle: () => signInWithPopup(auth, googleProvider),
    // In dev bypass there's no real Firebase session to end. Reloading just
    // re-enters the same fixed dev identity, which is the closest sensible
    // behavior to "sign out" when there's no real auth backing this at all.
    signOut: () => (DEV_BYPASS ? Promise.resolve(window.location.reload()) : fbSignOut(auth)),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
