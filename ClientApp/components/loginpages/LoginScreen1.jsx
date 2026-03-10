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
  ScrollView,
  Text as RNText, Alert
} from 'react-native';
import {
  TextInput,
  Provider as PaperProvider,
  DefaultTheme
} from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosClient';
import {saveTokens, saveUserData} from '../../utils/tokenStorage';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';

const { width, height } = Dimensions.get('window');

const theme = {
  ...DefaultTheme,
  roundness: 30,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ff0000',
    accent: '#ff0000',
    background: '#FFFFFF',
    surface: '#FEF2F2',
    text: '#1E293B',
    placeholder: '#94A3B8',
  },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const input1Anim = useRef(new Animated.Value(0)).current;
  const input2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  
  useEffect(() => {
    // Entrance sequence
    Animated.stagger(100, [
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(input1Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(input2Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
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
     const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        "Login failed. Please try again.";

    alert(errorMessage);
    console.error("Login error:", errorMessage, error);
      //   console.error("Login Failed:", error.response?.data?.message || error.message);
      //  const errorMessage = error.response?.data?.message || "Invalid credentials or server error";
      // alert(errorMessage);
    }
    finally{
      setIsLoading(false);
    }
  }

  return (
    <PaperProvider theme={theme}>
      {/* <StatusBar barStyle="light-content" backgroundColor="#ff0000" /> */}

      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* --- HEADER SECTION --- */}
          <View style={{
            height: height * 0.42,
            backgroundColor: '#ed1a3b',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Soft gradient overlay */}
            <View style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(185, 28, 28, 0.3)',
            }} />

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

            {/* Content Container */}
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 40,
              zIndex: 10
            }}>
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center'
              }}>
                <View style={{
                  width: 220,
                  height: 140,
                  backgroundColor: '#ffffff',
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}>
                  <Image
                    source={require('../../assets/morgan__logo-dark.png')}
                    style={{ width: 180, height: 100 }}
                    resizeMode="contain"
                  />
                </View>
                <RNText style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  letterSpacing: 1,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: -1, height: 1 },
                  textShadowRadius: 10
                }}>
                  GA Morgan Dynamics 1
                </RNText >
              </Animated.View>
            </View>

            {/* SVG Wave Bottom */}
            <View style={{
              position: 'absolute',
              bottom: -1,
              left: 0,
              right: 0,
              height: 60,
            }}>
              <Svg viewBox="0 0 1440 320" width={width} height={60} preserveAspectRatio="none">
                <Path
                  fill="#FFFFFF"
                  d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                />
              </Svg>
            </View>
          </View>

          {/* --- FORM SECTION --- */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20 }}
          >
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}>

              {/* Username Input */}
              <Animated.View style={{
                opacity: input1Anim,
                transform: [{
                  translateX: input1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0]
                  })
                }]
              }}>
                <View style={{
                  backgroundColor: '#ffffff',
                  borderTopLeftRadius: 25,
                  borderTopRightRadius: 10,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 25,
                  marginBottom: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  height: 60,
                  borderWidth: 1.5,
                  borderColor: password ? '#ff0000' : '#d8d3d3',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={username ? '#DC2626' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    placeholder="Username or Email"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={setUsername}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 16,
                      color: '#1E293B',
                      height: 60,
                      paddingVertical: 0,
                    }}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    theme={{ colors: { primary: 'transparent' } }}
                  />
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={{
                opacity: input2Anim,
                transform: [{
                  translateX: input2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}>
                <View style={{
                  backgroundColor: '#ffffff',
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 25,
                  borderBottomLeftRadius: 25,
                  borderBottomRightRadius: 10,
                  marginBottom: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  height: 60,
                  borderWidth: 1.5,
                  borderColor: password ? '#DC2626' : '#d8d3d3',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={password ? '#DC2626' : '#9CA3AF'}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 16,
                      color: '#1E293B',
                      height: 60,
                      paddingVertical: 0,
                    }}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    theme={{ colors: { primary: 'transparent' } }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Login Button (Red) */}
              <Animated.View style={{
                opacity: buttonAnim,
                transform: [{
                  scale: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }]
              }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#ed1a3b',
                    borderRadius: 30,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#ff0000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                    marginBottom: 20,
                    borderWidth: 3,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Animated.View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        borderTopColor: 'transparent',
                        marginRight: 10,
                      }} />
                      <RNText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                        Logging in...
                      </RNText>
                    </View>
                  ) : (
                    <RNText style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 }}>
                      Login
                    </RNText>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Footer Divider & Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:5 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              </View>

              <View style={{ alignItems: 'center', marginTop: 70, paddingBottom: 5 }}>
                <RNText style={{ color: '#0b74f5', fontSize: 18, fontWeight: '600', marginBottom: 20 }}>
                  Powered by
                </RNText>
                <Image
                  source={require('../../assets/NewKliedSys.png')}
                  style={{ width: 150, height: 90 }}
                  resizeMode="contain"
                />
                {/* <RNText style={{ color: '#5694e0', fontSize: 12, marginTop: 8 }}>
                  version 1.0.0
                </RNText> */}
              </View>

            </Animated.View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </PaperProvider>
  );
}
