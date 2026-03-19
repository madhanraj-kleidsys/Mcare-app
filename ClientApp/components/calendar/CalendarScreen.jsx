import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosClient';

const BRAND_COLOR = '#ed1a3b';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const [viewDate, setViewDate] = useState(new Date(2025, 7, 1)); // Start at Aug 2025 based on your data
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [viewDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const monthStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/calendar/events?MonthVal=${monthStr}`);
      
      // Convert Array to Object for easy lookup: { "2025-08-14": 2 }
      const eventMap = {};
      res.data.Data.forEach(item => {
        eventMap[item.EventDate] = item.EventsCount;
      });
      setEvents(eventMap);
    } catch (err) {
      console.error("Fetch Events Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) days.push(<View key={`empty-${i}`} style={styles.dayBox} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvents = events[dateStr];

      days.push(
        <TouchableOpacity 
          key={d} 
          style={[styles.dayBox, hasEvents && styles.eventDay]} 
          onPress={() => navigation.navigate('DayDetail', { selectedDate: dateStr })}
        >
          <Text style={[styles.dayText, hasEvents && styles.eventDayText]}>{d}</Text>
          {hasEvents > 0 && <View style={styles.dot} />}
        </TouchableOpacity>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar Events</Text>
        <TouchableOpacity><Ionicons name="calendar-outline" size={24} color="#b41010" /></TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color="#333" /></TouchableOpacity>
          <Text style={styles.monthTitle}>{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color="#333" /></TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={styles.weekText}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {loading ? <ActivityIndicator color={BRAND_COLOR} /> : renderDays()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff'},
  header: { paddingTop: 50, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#e61919', fontSize: 18, fontWeight: 'bold' },
  calendarCard: { backgroundColor: '#eb212177', margin: 15, borderRadius: 12, padding: 10 },
  monthNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 20 },
  monthTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: '#fff', color: '#333', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 5 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekText: { color: '#3ac0ff', fontSize: 12, fontWeight: 'bold' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayBox: { width: '14.28%', height: 50, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 0.5, borderRightWidth: 0.5, borderColor: '#555' },
  dayText: { color: '#fff', fontSize: 16 },
  eventDay: { backgroundColor: '#3ac0ff' }, // Matches your blue highlight
  eventDayText: { color: '#fff', fontWeight: 'bold' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 2 }
});