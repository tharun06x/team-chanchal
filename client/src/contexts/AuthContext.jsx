import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Domain Restriction Check
            if (!user.email.endsWith('@vjcet.org')) {
                await user.delete(); // Or signOut
                throw new Error('Only @vjcet.org emails are allowed.');
            }

            // Sync with MongoDB backend (Create/Update user)
            try {
                // Use config URL if available, else localhost
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                await fetch(`${API_URL}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: user.uid,
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        collegeDomain: 'vjcet.org'
                    })
                });
            } catch (err) {
                console.error("Failed to sync user to backend:", err);
                // We don't block login if sync fails, but might be good to warn
            }

            return user;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
