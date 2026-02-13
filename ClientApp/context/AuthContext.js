import React, { createContext, useState, useEffect, useContext } from 'react';
import * as tokenStorage from '../utils/tokenStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // Check for existing token on app launch
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        const user = await tokenStorage.getUserData();
        if (token) {
          setUserToken(token);
          setUserData(user);
        }
      } catch (e) {
        console.error("Failed to load auth data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (accessToken, refreshToken, user) => {
    setIsLoading(true);
    await tokenStorage.saveTokens(accessToken, refreshToken);
    await tokenStorage.saveUserData(user);
    setUserToken(accessToken);
    setUserData(user);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await tokenStorage.clearTokens();
    setUserToken(null);
    setUserData(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);