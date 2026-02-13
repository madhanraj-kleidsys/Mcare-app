import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // Adjusted for padding/gap

// Simple Native Skeleton Component
const SkeletonItem = ({ style, circle }) => (
  <View 
    style={[
      { backgroundColor: '#F0F0F0', borderRadius: circle ? 100 : 4 }, 
      style
    ]} 
  />
);

const DashboardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Service Calls Section */}
      <View style={styles.section}>
        <SkeletonItem style={{ width: 140, height: 24, marginBottom: 12 }} />
        <View style={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.card}>
              <SkeletonItem circle style={{ width: 50, height: 50 }} />
              <SkeletonItem style={{ width: 60, height: 16, marginTop: 12 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Tasks Section */}
      <View style={styles.section}>
        <SkeletonItem style={{ width: 100, height: 24, marginBottom: 12 }} />
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.taskItem}>
            <SkeletonItem circle style={{ width: 40, height: 40 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonItem style={{ height: 16, width: '90%' }} />
              <SkeletonItem style={{ height: 12, width: '60%', marginTop: 8 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  section: { marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
});

export default DashboardSkeleton;