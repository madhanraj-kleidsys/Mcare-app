import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 1. Animate Logo Scale Up
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

    // 2. Wait 1 seconds, then Fade Out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Callback to tell App we are done
        onFinish();
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <View style={styles.centerContent}>
        <Animated.Image
        //   source={require('../assets/morgan__logo-dark.png')} 
          source={require('../assets/ic_launcher.png')} 
          style={[styles.splashLogo, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />
        <Text style={styles.splashText}>GA Morgan Dynamics</Text>
      </View>
    </Animated.View>
  );
};


const styles = StyleSheet.create({
    splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 300,
    height: 170,
    marginBottom: 50,
  },
  splashText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#ff0000',
    letterSpacing: 1,
    // textTransform: 'uppercase',
  }
});

export default SplashScreen;
