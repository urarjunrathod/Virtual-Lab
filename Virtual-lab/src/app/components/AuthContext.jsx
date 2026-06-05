import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getSupabase } from "../../../utils/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const supabase = getSupabase();

  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session) {
      if (!session) {
        if (mounted) {
          setUser(null);
          setAccessToken(null);
          setLoading(false);
        }
        return;
      }

      const currentUser = session.user;

      if (mounted) {
        setUser(currentUser);
        setAccessToken(session.access_token);
        setLoading(false);
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        handleSession(data.session);
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          handleSession(session);
        }
      );

    return () => {
      mounted = false;

      listener.subscription.unsubscribe();
    };
  }, []);

  // SIGN UP
  const signUp = async (
    email,
    password,
    name
  ) => {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  // SIGN IN
  const signIn = async (
    email,
    password
  ) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  // SIGN OUT
  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}