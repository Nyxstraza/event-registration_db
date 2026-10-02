import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from './types';

interface Ctx { user: User | null; signIn: (token: string, user: User) => void; signOut: () => void; }
const AuthContext = createContext<Ctx>({ user: null, signIn: () => {}, signOut: () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const signIn = (token: string, u: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };
  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}
