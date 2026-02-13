import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, SafeAreaView, Dimensions 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, parseISO } from 'date-fns';
import api from '../api/axiosClient';

const BRAND_COLOR = '#ed1a3b';
const BG_COLOR = '#f8f9fa';
const { width } = Dimensions.get('window');

// --- Reusable Card Component ---
const EventCard = ({ item, type }) => {
  let iconName = 'document-text-outline';
  let badgeColor = '#666';

  if (type === 'SR') { iconName = 'construct-outline'; badgeColor = '#23f92e'; } // Service
  if (type === 'MC') { iconName = 'megaphone-outline'; badgeColor = '#3ac0ff'; } // Marketing
  if (type === 'TSK') { iconName = 'checkbox-outline'; badgeColor = '#ff0523'; } // Task

  // Dynamic status color
  const isAssigned = item.Status === 'ASSIGNED';
  const statusColor = isAssigned ? '#333' : '#888';
  const statusBg = isAssigned ? '#e0e0e0' : '#f0f0f0';

  return (
    <View style={styles.card}>
      <View style={[styles.cardLeftStrip, { backgroundColor: type === 'TSK' ? '#ff0523' : type === 'MC' ? '#3ac0ff' : '#23f92e' }]} />
      <View style={styles.cardContent}>
        
        {/* Header: ID and Time */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>{item.SRNo || item.MCNo || item.TSKNo}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.Status}</Text>
          </View>
        </View>

        {/* Schedule Time */}
        <View style={styles.row}>
            <Ionicons name="time-outline" size={14} color="#666" style={{marginRight: 4}} />
            <Text style={styles.cardTime}>{item.Sch}</Text>
        </View>

        {/* Customer / Description */}
        <Text style={styles.cardCustomer} numberOfLines={1}>
          {item.CustName || "No Customer Name"}
        </Text>

        {/* Footer: User */}
        <View style={styles.cardFooter}>
           <Ionicons name="person-circle-outline" size={16} color="#888" />
           <Text style={styles.cardUser}>{item.AssignedUserName || "Unassigned"}</Text>
        </View>
      </View>
    </View>
  );
};

export default function DayDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // State
  const [currentDate, setCurrentDate] = useState(route.params?.selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('SR'); // 'SR', 'MC', 'TSK'
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [srData, setSrData] = useState([]);
  const [mcData, setMcData] = useState([]);
  const [tskData, setTskData] = useState([]);

  useEffect(() => {
    fetchDayData(currentDate);
  }, [currentDate]);

  const fetchDayData = async (date) => {
    setLoading(true);
    try {
      const res = await api.get(`/calendarHighlights?DateVal=${date}`);
      setSrData(res.data.SRData?.Data || []);
      setMcData(res.data.MCData?.Data || []);
      setTskData(res.data.TSKData?.Data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (direction) => {
    const newDate = direction === 'next' 
      ? addDays(parseISO(currentDate), 1) 
      : subDays(parseISO(currentDate), 1);
    setCurrentDate(format(newDate, 'yyyy-MM-dd'));
  };

  // Helper to get current list based on tab
  const getActiveList = () => {
    if (activeTab === 'SR') return srData;
    if (activeTab === 'MC') return mcData;
    if (activeTab === 'TSK') return tskData;
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Date Navigator Header */}
      <View style={styles.dateNavHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.dateControls}>
            <TouchableOpacity onPress={() => changeDate('prev')} style={styles.arrowBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={{alignItems: 'center'}}>
                <Text style={styles.dateText}>{format(parseISO(currentDate), 'dd MMM yyyy')}</Text>
                <Text style={styles.dayText}>{format(parseISO(currentDate), 'EEEE')}</Text>
            </View>

            <TouchableOpacity onPress={() => changeDate('next')} style={styles.arrowBtn}>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
        <View style={{width: 24}} /> 
      </View>

      {/* 2. Custom Tabs with Counters */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'SR' && styles.activeTabItem]} 
          onPress={() => setActiveTab('SR')}
        >
          <Text style={[styles.tabLabel, activeTab === 'SR' && styles.activeTabLabel]}>Service</Text>
          <View style={[styles.badge, { backgroundColor: '#23f92e20' }]}>
            <Text style={{color: '#237a2e', fontSize: 10, fontWeight: 'bold'}}>{srData.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'MC' && styles.activeTabItem]} 
          onPress={() => setActiveTab('MC')}
        >
          <Text style={[styles.tabLabel, activeTab === 'MC' && styles.activeTabLabel]}>Marketing</Text>
          <View style={[styles.badge, { backgroundColor: '#3ac0ff20' }]}>
             <Text style={{color: '#008acc', fontSize: 10, fontWeight: 'bold'}}>{mcData.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'TSK' && styles.activeTabItem]} 
          onPress={() => setActiveTab('TSK')}
        >
          <Text style={[styles.tabLabel, activeTab === 'TSK' && styles.activeTabLabel]}>Tasks</Text>
          <View style={[styles.badge, { backgroundColor: '#ff052320' }]}>
             <Text style={{color: '#cc001a', fontSize: 10, fontWeight: 'bold'}}>{tskData.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. List Content */}
      <View style={styles.contentContainer}>
        {loading ? (
            <ActivityIndicator size="large" color={BRAND_COLOR} style={{marginTop: 50}} />
        ) : (
            <FlatList
                data={getActiveList()}
                keyExtractor={(item) => item.ID.toString()}
                renderItem={({ item }) => <EventCard item={item} type={activeTab} />}
                contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="file-tray-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyText}>No events found</Text>
                    </View>
                }
            />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  
  // Header
  dateNavHeader: {
    backgroundColor: BRAND_COLOR,
    paddingTop: 40, // Status bar space
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  dateControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  dateText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dayText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
  arrowBtn: { padding: 5 },
  backButton: { padding: 5 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: -15, // Overlap header
    borderRadius: 12,
    padding: 5,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6
  },
  activeTabItem: { backgroundColor: '#f0f0f0' },
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#888' },
  activeTabLabel: { color: '#333' },
  badge: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 10, 
    minWidth: 20, 
    alignItems: 'center' 
  },

  // Content
  contentContainer: { flex: 1 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height: 2}
  },
  cardLeftStrip: { width: 5 },
  cardContent: { flex: 1, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardCustomer: { fontSize: 15, color: '#333', fontWeight: '500', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTime: { fontSize: 12, color: '#666' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardUser: { fontSize: 12, color: '#888' }
});