
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut, getIdTokenResult } from "firebase/auth";
import { auth } from "../firebase/firebase.config";

const AuthContext = createContext();

const ADMIN_EMAIL = "mehidyrifat794@gmail.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Firebase Token এবং Custom Claim যাচাই
          const tokenResult = await getIdTokenResult(currentUser, true);

          // নির্দিষ্ট Email এবং Admin Claim চেক
          if (
            currentUser.email?.toLowerCase() === ADMIN_EMAIL &&
            tokenResult.claims.admin === true
          ) {
            setUser(currentUser);
            setIsAdmin(true);
          } else {
            // অনুমতি না থাকলে Sign Out
            setUser(null);
            setIsAdmin(false);
            await signOut(auth);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Admin authentication error:", error);
        setUser(null);
        setIsAdmin(false);
        await signOut(auth).catch(() => {});
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
