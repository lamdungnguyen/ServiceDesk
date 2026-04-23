import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface User {
  id: number;
  role: UserRole;
  name: string;
  username: string;
  agentType?: string; // DEV, TESTER, SUPPORT, etc.
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize admin account if not exists
const initializeMockDB = () => {
  const users = localStorage.getItem('mock_users');
  if (!users) {
    const defaultAdmin = {
      id: 999,
      username: 'admin',
      password: '123456', // Mock password
      name: 'System Administrator',
      role: 'ADMIN' as UserRole
    };
    localStorage.setItem('mock_users', JSON.stringify([defaultAdmin]));
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    initializeMockDB();
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
