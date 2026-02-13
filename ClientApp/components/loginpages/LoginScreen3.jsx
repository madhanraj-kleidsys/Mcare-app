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
  Text as RNText,
  TextInput,
  ScrollView
} from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import api from '../../api/axiosClient';
import { saveTokens, saveUserData } from '../../utils/tokenStorage';
import { useAuth } from '../../context/AuthContext';
const { width, height } = Dimensions.get('window');

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000',
    background: '#ed1a3b',
  },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


  const handleLogin = async () => {
    if (!username || !password) {
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
    finally {
      setIsLoading(false);
    }
  }

  return (
    <PaperProvider theme={theme}>
      {/* <StatusBar barStyle="light-content" backgroundColor="#ed1a3b" /> */}
      <View style={{ flex: 1, backgroundColor: '#ed1a3b' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: 30,
              paddingTop: 80,
              paddingBottom: 20
            }}>

              {/* LOGO SECTION */}
              <Animated.View style={{
                opacity: fadeAnim,
                alignItems: 'center',
                marginBottom: 30,
                transform: [{ translateY: slideAnim }]
              }}>
                <View style={styles.logoBox}>
                  <Image
                    source={require('../../assets/morgan__logo-dark.png')}
                    style={{ width: 180, height: 100 }}
                    resizeMode="contain"
                  />
                </View>
                <RNText style={styles.logoText}>
                  GA Morgan Dynamics
                </RNText>
              </Animated.View>

              {/* INPUTS SECTION */}
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}>
                <View style={styles.popInput}>
                  <Ionicons name="person" size={20} color="#0b74f5c4" style={{ marginRight: 10 }} />
                  {/* 00000050 */}
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.popInput}>
                  <Ionicons name="lock-closed" size={20} color="#0b74f5" style={{ marginRight: 10 }} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#2013138c" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 25 }}>
                  <RNText style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>
                    Forgot Password ?
                  </RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  style={styles.popButton}
                >
                  {isLoading ? (
                    <RNText style={styles.buttonText}>Logging in...</RNText>
                  ) : (
                    <RNText style={styles.buttonText}>Login</RNText>
                  )}
                </TouchableOpacity>

              </Animated.View>
            </View>


          </ScrollView>
        </KeyboardAvoidingView>
        <View style={{ height: 210, justifyContent: 'flex-end' }}>

          {/* THE CURVE SVG */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <Path
                fill="#fcfcfc"
                d="M0,220 Q720,-220 1440,220 L1440,320 L0,320 Z"
              />
            </Svg>
          </View>

          <View style={{ alignItems: 'center', paddingBottom: 30, zIndex: 10 }}>
            <RNText style={{ color: '#0b74f5', fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              {/* 94A3B8 */}
              Powered by
            </RNText>
            <Image
              source={require('../../assets/NewKliedSys.png')}
              style={{ width: 200, height: 100, }}
              resizeMode="contain"
            />
            {/* <RNText style={{ color: '#5694e0', fontSize: 12, marginTop: 10 }}>
                  version 1.0.0
                </RNText> */}
          </View>

        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    width: 220,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 15
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1
  },
  popInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ff0000',
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
    fontWeight: '600',
    padding: 0
  },
  popButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ff0000',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: '800',
  }
});