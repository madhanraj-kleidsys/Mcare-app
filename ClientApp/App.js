import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider } from './utils/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { getAccessToken } from './utils/tokenStorage';
import { AuthProvider, useAuth } from './context/AuthContext';

import SplashScreen from './components/SplashScreen';
import LoginScreen1 from './components/loginpages/LoginScreen1';
import LoginScreen2 from './components/loginpages/LoginScreen2';
import LoginScreen3 from './components/loginpages/LoginScreen3';
import MainScreen from './components/MainScreen';

const Stack = createStackNavigator();

const RootNavigation = () => {
  const { userToken, isLoading } = useAuth();

  const [RandomLoginScreen] = useState(() => {
    const screens = [LoginScreen1, LoginScreen2, LoginScreen3];
    return screens[Math.floor(Math.random() * screens.length)];
  });

  if (isLoading) {
    return (
      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color="#ed1a3b" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          <Stack.Screen name="Login" component={RandomLoginScreen} />
        ) : (
          <Stack.Screen name="Home" component={MainScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    async function hideBars() {
      try {
        await NavigationBar.setVisibilityAsync("hidden");
        // await NavigationBar.setBehaviorAsync("overlay-swipe");
        // await NavigationBar.setBackgroundColorAsync("#00000000");
      } catch (e) {
        console.log("Navigation Bar Error:", e);
      }
    }
    hideBars();
  }, []);

  return (
    <>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" barStyle="light-content" hidden={true} />
      <AuthProvider>
        <ThemeProvider>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            < RootNavigation />
          )}
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}