import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api.getMe();
      setUser(u);
      connectSocket(token);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    return () => disconnectSocket();
  }, [loadUser]);

  const login = async (email, password) => {
    const { user: u, token } = await api.login({ email, password });
    localStorage.setItem('token', token);
    setUser(u);
    connectSocket(token);
    return u;
  };

  const register = async (email, password, displayName) => {
    const { user: u, token } = await api.register({ email, password, displayName });
    localStorage.setItem('token', token);
    setUser(u);
    connectSocket(token);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
