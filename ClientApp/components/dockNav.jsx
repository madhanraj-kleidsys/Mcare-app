import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BRAND_COLOR = '#ed1a3b';
const SHADOQ = '#908a8ba4';
const WHITE = '#ffffff';
const TEXT_GRAY = '#7f8c8d';

const DockItem = ({ icon, label, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(backgroundAnim, {
      toValue: isActive ? 1 : 0,
      tension: 60,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', BRAND_COLOR],
  });

  const iconColor = isActive ? WHITE : TEXT_GRAY;

  return (
    <TouchableOpacity 
      style={styles.dockItem} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
     <Animated.View 
      style={{
        transform: [{ scale: scaleAnim }], // Native animation here
        marginBottom: 4,
      }}
    >
      {/* 2. INNER VIEW: Handles Color (JS Driver) */}
      <Animated.View 
        style={[
          styles.dockIconContainer,
          {
            backgroundColor: backgroundColor, // JS animation here
            marginBottom: 0, // Reset margin since outer view has it
          }
        ]}
      >
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={iconColor} 
        />
      </Animated.View>
    </Animated.View>

      <Text style={[
        styles.dockLabel,
        isActive && styles.dockLabelActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const Dock = ({ activeTab, onTabChange }) => {
  const dockSlideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(dockSlideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const dockItems = [
    { icon: 'home', label: 'Home', key: 'home' },
    { icon: 'calendar', label: 'Calendar', key: 'calendar' },
    { icon: 'clock-check-outline', label: 'Attendance', key: 'attendance' },
    { icon: 'eye-outline', label: 'View', key: 'view' },
    { icon: 'account-circle', label: 'Profile', key: 'profile' },
  ];

  return (
    <Animated.View 
      style={[
        styles.dockContainer,
        {
          transform: [{ translateY: dockSlideAnim }],
        }
      ]}
    >
      <View style={styles.dock}>
        {dockItems.map((item) => (
          <DockItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.key}
            onPress={() => onTabChange(item.key)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 12,
    shadowColor: SHADOQ,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  dockItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 55,
  },
  dockIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dockLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: TEXT_GRAY,
    textAlign: 'center',
  },
  dockLabelActive: {
    color: BRAND_COLOR,
    fontWeight: '700',
  },
});

export default Dock;