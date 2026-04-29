import { createContext, useContext } from 'react';

export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface User {
  id: number;
  role: UserRole;
  name: string;
  username: string;
  agentType?: string;
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
