import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARDS_PER_ROW = 4;
const CARD_WIDTH = (width - 40 - (CARD_MARGIN * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

const BRAND_COLOR = '#ed1a3b';
const WHITE = '#ffffff';
const TEXT_DARK = '#2c3e50';
const TEXT_LIGHT = '#95a5a6';
const BORDER_COLOR = '#e8e8e8';

const StatCard = ({ title, count, icon, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.card,
      {
        transform: [{ scale: scaleAnim }],
      }
    ]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={22} color={BRAND_COLOR} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </Animated.View>
  );
};

const UnifiedSection = ({ type, data, onCardClick }) => {

  // Config for each section type
  const sectionConfig = {
    service: {
      title: 'Service Calls',
      icon: 'wrench-outline',
      color: BRAND_COLOR,
    },
    marketing: {
      title: 'Marketing Calls',
      icon: 'bullhorn-outline',
      color: '#4a90e2',
    },
    tasks: {
      title: 'Tasks',
      icon: 'check-circle-outline',
      color: '#27ae60',
    },
    claims: {
      title: 'Claims',
      icon: 'hand-coin-outline',
      // icon: 'wallet-plus',
      color: '#e67e22',
    },
  };

  const config = sectionConfig[type] || sectionConfig.service;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <MaterialCommunityIcons name={config.icon} size={24} color="#fff" />
        <Text style={styles.headerTitle}>{config.title}</Text>
      </View>

      {/* Cards Grid */}
      <View style={styles.cardsContainer}>
        <View style={styles.cardsGrid}>
          {data.map((item, index) => (
            <TouchableOpacity
              key={index} onPress={() => onCardClick(item.title)}
              activeOpacity={0.8}
            >
              <StatCard {...item} delay={index * 100} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: WHITE,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cardsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: WHITE,
    width: CARD_WIDTH,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: CARD_MARGIN,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef5f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default UnifiedSection;