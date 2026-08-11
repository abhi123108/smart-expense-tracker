import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    // Login ke time userInfo save hoga
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);

    return data;
  };

  const register = async (name, email, password) => {
    // Sirf account create hoga
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    // YAHAN localStorage.setItem nahi karna hai
    // YAHAN setUser(data) nahi karna hai

    return data;
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}