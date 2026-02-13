import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchDashboardNotifications } from '../services/dashboardService';

const BRAND_COLOR = '#ed1a3b';
const { width } = Dimensions.get('window');

const NOTIFICATIONS = {
  service: [
    { id: '1', title: 'New Service Request', desc: 'AC Repair at Downtown branch', time: '10 min ago', icon: 'wrench' },
    { id: '5', title: 'New Service Request', desc: 'AC Repair at Downtown branch', time: '10 min ago', icon: 'wrench' },
    { id: '2', title: 'New Service Request', desc: 'AC Repair at Downtown branch', time: '10 min ago', icon: 'wrench' },
    { id: '6', title: 'New Service Request', desc: 'AC Repair at Downtown branch', time: '10 min ago', icon: 'wrench' },
    { id: '3', title: 'New 333333 Request', desc: 'AC Repair at Downtown branch', time: '10 min ago', icon: 'wrench' },
  ],
  marketing: [
    { id: '2', title: 'Campaign Started', desc: 'Summer Sale 2026 is live', time: '1 hr ago', icon: 'bullhorn' },
    { id: '3', title: 'Lead Generated', desc: 'New lead from website form', time: '2 hrs ago', icon: 'account-group' },
  ],
  tasks: [
    { id: '4', title: 'Meeting Reminder', desc: 'Team sync at 4:00 PM', time: '30 min ago', icon: 'calendar-clock' },
    { id: '5', title: 'Report Due', desc: 'Submit monthly expense report', time: 'Yesterday', icon: 'file-document-outline' },
    { id: '6', title: 'Follow up', desc: 'Call Mr. John regarding quote', time: '2 days ago', icon: 'phone-outgoing' },
  ]
};

// Add this before your main function
const CATEGORY_CONFIG = {
  service: {
    icon: 'wrench',
    color: '#2e7d32', // Darker green for text/icon
    bg: '#e8f5e9',    // Light green for background
    label: 'Service'
  },
  marketing: {
    icon: 'bullhorn',
    color: '#0277bd', // Darker blue
    bg: '#e1f5fe',    // Light blue
    label: 'Marketing'
  },
  tasks: {
    icon: 'calendar-clock',
    color: '#c62828', // Darker red
    bg: '#ffebee',    // Light red
    label: 'Task'
  }
};

export default function NotificationScreen() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    service: [],
    marketing: [],
    tasks: []
  });

  const [counts, setCounts] = useState({ sr: 0, mc: 0, tsk: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDashboardNotifications();
    if (data) {
      setNotifications({
        service: data.service,
        marketing: data.marketing,
        tasks: data.tasks
      });
      setCounts(data.counts);
    }
    setLoading(false);
  };

  // Tab Config
  const tabs = [
    { id: 'service', label: 'Service', count: counts.sr, color: '#009b08' },   // Green
    { id: 'marketing', label: 'Marketing', count: counts.mc, color: '#3ac0ff' }, // Blue
    { id: 'tasks', label: 'Tasks', count: counts.tsk, color: '#ff0523' }       // Red
  ];

  const renderItem = ({ item }) => {
    if (!item) {
      return null;
    }

    const theme = CATEGORY_CONFIG[activeTab];

    return (
      <View style={styles.card}>
        {/* 1. Left Icon Box: Dynamic Color based on Category */}
        <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
          <MaterialCommunityIcons name={theme.icon} size={24} color={theme.color} />
        </View>

        {/* 2. Middle Content */}
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {/* Show Status Badge if it exists */}
            {item.status && (
              <View style={[styles.statusBadge, { borderColor: theme.color }]}>
                <Text style={[styles.statusText, { color: theme.color }]}>
                  {item.status}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDesc} numberOfLines={1}>{item.desc}</Text>

          {/* Handle empty time gracefully */}
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#999" />
            <Text style={styles.cardTime}>
              {item.time ? item.time : 'Date Pending'}
            </Text>
          </View>
        </View>
      </View>
    );
    
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Custom Tab Bar */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.badge, { backgroundColor: tab.color }]}>
                    <Text style={styles.badgeText}>{tab.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Area with Curved Top Effect */}
        <View style={styles.contentArea}>
          {notifications[activeTab].length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-sleep" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No new notifications</Text>
            </View>
          ) : (
            <FlatList
              // data={NOTIFICATIONS[activeTab]}
              // renderItem={renderItem}
              // keyExtractor={item => item.id}
              // contentContainerStyle={styles.listContent}
              // showsVerticalScrollIndicator={false}

              data={notifications[activeTab]} // Uses the state from your API fetch
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()} // Ensure ID is string
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              // Add this to handle empty lists gracefully
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="bell-sleep" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No {activeTab} notifications found</Text>
                </View>
              }
            />
          )}
          <View style={{ height: 100 }} />
        </View>
      </View>
    </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light gray background
  },
  /* Tab Bar Styling */
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginRight: 6,
  },
  tabTextActive: {
    color: '#333',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* List Content Styling */
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30, // The Curved Top Design
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
    elevation: 4, // Shadow to pop it out
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  listContent: {
    paddingBottom: 20,
  },

  /* Card Styling */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },

  /* Empty State */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
});