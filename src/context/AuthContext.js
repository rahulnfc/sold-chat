import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('id');
    if (token) {
      // Verify token and set user
      // You would typically verify the token with your backend here
      setUser({ token, id });
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('id', data.user.id);
    setUser({ token:  data.accessToken, id: data.user.id });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);