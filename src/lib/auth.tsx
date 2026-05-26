import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const SESSION_KEY = "jobtrack_session";
const USERS_KEY = "jobtrack_users";

export const HARDCODED_USER = {
  email: "mbmaryambashir1999@gmail.com",
  password: "Maryam@123",
};

type User = { email: string };

type AuthContextType = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUsers(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login: AuthContextType["login"] = async (email, password, remember = true) => {
    await new Promise((r) => setTimeout(r, 500));
    const e = email.trim().toLowerCase();
    const users = getStoredUsers();
    const ok = (e === HARDCODED_USER.email.toLowerCase() && password === HARDCODED_USER.password) || (users[e] && users[e] === password);
    if (!ok) throw new Error("Invalid email or password");
    const u = { email: e };
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signup: AuthContextType["signup"] = async (email, password) => {
    await new Promise((r) => setTimeout(r, 500));
    const e = email.trim().toLowerCase();
    if (!e || !password) throw new Error("Email and password are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    const users = getStoredUsers();
    if (users[e] || e === HARDCODED_USER.email.toLowerCase()) throw new Error("Account already exists");
    users[e] = password;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const u = { email: e };
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
