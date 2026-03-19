import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, Animated, Dimensions 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import api from '../../api/axiosClient';

const { width, height } = Dimensions.get('window');
const BRAND_COLOR = '#ed1a3b';

export default function CalendarHub() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('SR');
  const [data, setData] = useState({ SR: [], MC: [], TSK: [] });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState({}); // Dots for calendar

  // 1. Fetch Monthly Dots for the Calendar Popup
  useEffect(() => {
    const fetchMonthlyDots = async () => {
      try {
        const monthStr = format(viewMonth, 'yyyy-MM');
        const res = await api.get(`/calendar/events?MonthVal=${monthStr}`);
        const map = {};
        res.data.Data.forEach(item => map[item.EventDate] = item.EventsCount);
        setEvents(map);
      } catch (err) { console.log("Dots error", err); }
    };
    fetchMonthlyDots();
  }, [viewMonth]);

  // 2. Fetch Daily Details
  useEffect(() => {
    const fetchDayData = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await api.get(`/calendar/highlights?DateVal=${dateStr}`);
        setData({
          SR: res.data.SRData.Data,
          MC: res.data.MCData.Data,
          TSK: res.data.TSKData.Data
        });
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };
    fetchDayData();
  }, [selectedDate]);

  const changeDate = (direction) => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const renderCalendarDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasEvents = events[dateStr];
    const isSelected = isSameDay(date, selectedDate);

    return (
      <TouchableOpacity 
        key={dateStr}
        onPress={() => {
          setSelectedDate(date);
          setPickerVisible(false);
        }}
        style={[styles.calDay, isSelected && styles.selectedCalDay]}
      >
        <Text style={[styles.calDayText, isSelected && styles.whiteText]}>{format(date, 'd')}</Text>
        {hasEvents > 0 && <View style={[styles.dot, isSelected && {backgroundColor: '#fff'}]} />}
      </TouchableOpacity>
    );
  };

  const calendarGrid = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <View style={styles.container}>
      {/* HEADER NAVIGATOR */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate('prev')}><Ionicons name="chevron-back" size={28} color={BRAND_COLOR} /></TouchableOpacity>
        
        <TouchableOpacity style={styles.currentDateDisplay} onPress={() => setPickerVisible(true)}>
          <Ionicons name="calendar-outline" size={20} color={BRAND_COLOR} />
          <Text style={styles.dateText}>{format(selectedDate, 'dd MMM yyyy')}</Text>
          <Ionicons name="chevron-down" size={16} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeDate('next')}><Ionicons name="chevron-forward" size={28} color={BRAND_COLOR} /></TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        {['SR', 'MC', 'TSK'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
              {tab === 'SR' ? 'Service' : tab === 'MC' ? 'Marketing' : 'Tasks'}
            </Text>
            <View style={[styles.tabBadge, {backgroundColor: activeTab === tab ? BRAND_COLOR : '#eee'}]}>
              <Text style={[styles.tabCount, activeTab === tab && styles.whiteText]}>{data[tab].length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <ActivityIndicator color={BRAND_COLOR} size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data[activeTab]}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardId}>#{item.SRNo || item.MCNo || item.TSKNo}</Text>
                  <Text style={styles.cardStatus}>{item.Status}</Text>
                </View>
                <Text style={styles.cardUser}>{item.AssignedUserName}</Text>
                <View style={styles.timeBox}>
                   <Ionicons name="time-outline" size={14} color={BRAND_COLOR} />
                   <Text style={styles.cardTime}>{item.Sch}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* CALENDAR PICKER MODAL */}
      <Modal visible={isPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>{format(viewMonth, 'MMMM yyyy')}</Text>
               <TouchableOpacity onPress={() => setPickerVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            
            <View style={styles.monthSwitch}>
               <TouchableOpacity onPress={() => setViewMonth(subDays(startOfMonth(viewMonth), 1))}><Ionicons name="arrow-back" size={20} color={BRAND_COLOR} /></TouchableOpacity>
               <Text style={styles.monthSwitchText}>Swipe or use arrows</Text>
               <TouchableOpacity onPress={() => setViewMonth(addDays(endOfMonth(viewMonth), 1))}><Ionicons name="arrow-forward" size={20} color={BRAND_COLOR} /></TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {calendarGrid.map(renderCalendarDay)}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfdfc' },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  currentDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#eee'
  },
  dateText: { fontSize: 16, fontWeight: '700', color: '#333' },
  tabBar: { flexDirection: 'row', padding: 10, gap: 10 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, backgroundColor: '#fff', borderRadius: 15,
    elevation: 2, gap: 5
  },
  activeTab: { backgroundColor: BRAND_COLOR + '10', borderColor: BRAND_COLOR, borderWidth: 1 },
  tabLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  activeTabLabel: { color: BRAND_COLOR },
  tabBadge: { borderRadius: 10, minWidth: 20, paddingHorizontal: 5, alignItems: 'center' },
  tabCount: { fontSize: 10, fontWeight: 'bold' },
  listContainer: { padding: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  cardAccent: { width: 6, backgroundColor: BRAND_COLOR },
  cardBody: { flex: 1, padding: 15 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardId: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  cardStatus: { fontSize: 10, color: BRAND_COLOR, fontWeight: '700', textTransform: 'uppercase' },
  cardUser: { color: '#666', fontSize: 13, marginBottom: 8 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardTime: { fontSize: 11, color: '#888' },
  whiteText: { color: '#fff' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  calendarModal: { width: width * 0.9, backgroundColor: '#fff', borderRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  calDay: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  selectedCalDay: { backgroundColor: BRAND_COLOR },
  calDayText: { fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BRAND_COLOR, marginTop: 2 },
  monthSwitch: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  monthSwitchText: { fontSize: 12, color: '#aaa' }
});