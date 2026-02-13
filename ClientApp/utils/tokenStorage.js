import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

export const saveTokens = async (accessToken, refreshToken) => {
    try {
        if (accessToken) await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (err) {
        console.error('Error saving tokens:', err);
    }
};

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

// user data functions { async storage}
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (err) {
    console.error('Error saving user data:', err);
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (err) {
    console.error('Error getting user data:', err);
    return null;
  }
};

export const clearTokens = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (err) {
        console.error('Error clearing tokens:', err);
    }
};