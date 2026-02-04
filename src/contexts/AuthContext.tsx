import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: 'admin' | 'moderator' | 'user';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  role: 'admin' | 'moderator' | 'user' | null;
  setRole: (role: 'admin' | 'moderator' | 'user' | null) => void;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error reading user from localStorage", error);
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(() => {
    try {
      const storedProfile = localStorage.getItem("profile");
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (error) {
      console.error("Error reading profile from localStorage", error);
      return null;
    }
  });
  const [role, setRoleState] = useState<'admin' | 'moderator' | 'user' | null>(() => {
    try {
      const storedRole = localStorage.getItem("role");
      return storedRole ? JSON.parse(storedRole) : null;
    } catch (error) {
      console.error("Error reading role from localStorage", error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem("user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error saving user to localStorage", error);
    }
  };

  const setProfile = (newProfile: Profile | null) => {
    setProfileState(newProfile);
    try {
      if (newProfile) {
        localStorage.setItem("profile", JSON.stringify(newProfile));
      } else {
        localStorage.removeItem("profile");
      }
    } catch (error) {
      console.error("Error saving profile to localStorage", error);
    }
  };

  const setRole = (newRole: 'admin' | 'moderator' | 'user' | null) => {
    setRoleState(newRole);
    try {
      if (newRole) {
        localStorage.setItem("role", JSON.stringify(newRole));
      } else {
        localStorage.removeItem("role");
      }
    } catch (error) {
      console.error("Error saving role to localStorage", error);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  };

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching role:", error);
      setRole(null);
      return null;
    }
    const newRole = data?.role || 'user';
    setRole(newRole);
    return newRole;
  };

  useEffect(() => {
    setLoading(true);
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchRole(session.user.id);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          fetchProfile(session.user.id);
          fetchRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: username || email.split("@")[0],
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        setProfile,
        role,
        setRole,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
