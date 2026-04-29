import { useState, type ReactNode } from 'react';
import { AuthContext, type User } from './auth';

const getSavedUser = (): User | null => {
  const savedUser = localStorage.getItem('auth_user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem('auth_user');
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getSavedUser);

  const login = (newUser: User) => {
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
