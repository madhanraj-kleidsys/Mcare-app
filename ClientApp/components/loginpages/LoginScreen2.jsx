import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Text as RNText
} from 'react-native';
import { TextInput, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axiosClient';
import {saveTokens, saveUserData} from '../../utils/tokenStorage';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const theme = {
  ...DefaultTheme,
  roundness: 15,
  colors: {
    ...DefaultTheme.colors,
    primary: '#DC2626',
    accent: '#7C3AED',
    background: '#FFFFFF',
    text: '#1E293B',
  },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(height * 0.5)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


  const handleLogin = async () => {
    if(!username || !password) {
      alert("Please enter both username and password...");
      return;
    };
      setIsLoading(true);
    // setTimeout(() => setIsLoading(false), 2000);
    try {
        const res = await api.post('/auth/login', {
            email: username,
            password: password
        });
  
        if (res.data.accessToken) {
            // 1. Save Tokens securely
            // await saveTokens(res.data.accessToken, res.data.refreshToken);
            
            // // 2. Save User Data (Non-sensitive)
            // await saveUserData(res.data.user);

            await login(
              res.data.accessToken,
              res.data.refreshToken,
              res.data.user
            )
            console.log("Login Success!");
        }
    } catch (error) {
        console.error("Login Failed:", error.response?.data?.message || error.message);
       const errorMessage = error.response?.data?.message || "Invalid credentials or server error";
      alert(errorMessage);
    }
    finally{
      setIsLoading(false);
    }
  }

  return (
    <PaperProvider theme={theme}>
      {/* <StatusBar barStyle="light-content" backgroundColor="#ff0000" /> */}

      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <LinearGradient
          colors={['#ed1a3b', '#ed1a3b', '#ed1a3b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: height * 0.5,
          }}
        />
        {/* Decorative circles */}
        <Animated.View style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          top: -50,
          right: -50,
          transform: [{ scale: waveAnim }]
        }} />

        <Animated.View style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          top: 80,
          left: -30,
          transform: [{ scale: waveAnim }]
        }} />
        {/* --- TOP SECTION: LOGO IN WHITE BOX --- */}
        <View style={{
          height: height * 0.45,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: 'rgb(250, 250, 250)',
              borderRadius: 30,
              padding: 20,
              width: 240,
              height: 140,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
              marginBottom: 15
            }}>
              <Image
                source={require('../../assets/morgan__logo-dark.png')}
                style={{ width: 200, height: 100 }}
                resizeMode="contain"
              />
            </View>
            <RNText style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '700',
              letterSpacing: 1,
              textShadowColor: 'rgba(0,0,0,0.2)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4
            }}>
              GA Morgan Dynamics
            </RNText>
          </Animated.View>
        </View>

        {/* --- BOTTOM SECTION: WHITE CURVED SHEET --- */}
        <Animated.View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          marginTop: -60,
          paddingHorizontal: 30,
          paddingTop: 40,
          transform: [{ translateY: slideUpAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
        }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <RNText style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#0b74f5',
              marginBottom: 5,
              textAlign: 'center'
            }}>
              Welcome Back
            </RNText>
            <RNText style={{
              fontSize: 14,
              color: 'rgb(49, 35, 35)',
              marginBottom: 30,
              textAlign: 'center'
            }}>
              Please sign in to continue
            </RNText>

            {/* Username */}
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#3a7ad3" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ colors: { primary: 'transparent' } }}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#3a7ad3" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ colors: { primary: 'transparent' } }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 15 }}>
              <RNText style={{ color: '#DC2626', fontWeight: '600', fontSize: 13 }}>
                Forgot Password ?
              </RNText>
            </TouchableOpacity>

            {/* --- LOGIN BUTTON --- */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#ed1a3b',
                borderRadius: 15,
                height: 55,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#ff0000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
                marginBottom: 20
              }}
            >
              {isLoading ? (
                <RNText style={{ color: 'white', fontWeight: 'bold' }}>Logging in...</RNText>
              ) : (
                <RNText style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Login</RNText>
              )}
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
              <RNText style={{ color: '#0b74f5', fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                Powered by
              </RNText>
              <Image
                source={require('../../assets/NewKliedSys.png')}
                style={{ width: 120, height: 90, }}
                resizeMode="contain"
              />
              {/* <RNText style={{ color: '#5694e0', fontSize: 12, marginTop: 5 }}>
                version 1.0.0
              </RNText> */}
            </View>

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Soft Bento Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 15,
    height: 55,
    paddingHorizontal: 0,
  }
});
