import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../api/axiosClient'; // Ensure this path is correct

const BRAND_COLOR = '#ed1a3b';
const BG_COLOR = '#f8f9fa';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthlyData(currentMonth);
  }, [currentMonth]);

  const fetchMonthlyData = async (month) => {
    setLoading(true);
    try {
      // API call: /calendarEvents?MonthVal=2025-08
      const res = await api.get(`/calendarEvents?MonthVal=${month}`);
      const events = res.data.Data || [];

      const newMarked = {};
      
      // Map API data to Calendar markings
      events.forEach((item) => {
        const date = item.EventDate;
        const count = item.EventsCount;

        // Visual logic: Higher count = Darker/Solid color, Low count = Dot or Lighter
        newMarked[date] = {
          marked: true,
          // Custom properties to use in formatting
          customStyles: {
            container: {
              backgroundColor: BRAND_COLOR,
              borderRadius: 8,
              elevation: 2
            },
            text: {
              color: 'white',
              fontWeight: 'bold'
            }
          }
        };
      });
      setMarkedDates(newMarked);
    } catch (err) {
      console.error("Calendar Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day) => {
    navigation.navigate('DayDetail', { selectedDate: day.dateString });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Schedule</Text>
            <Text style={styles.headerSubtitle}>Select a date to view details</Text>
        </View>
        <TouchableOpacity style={styles.todayBtn} onPress={() => setCurrentMonth(format(new Date(), 'yyyy-MM'))}>
            <Ionicons name="calendar" size={20} color={BRAND_COLOR} />
            <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        {loading && <ActivityIndicator size="small" color={BRAND_COLOR} style={styles.loader} />}
        
        <Calendar
          // Key helps force re-render if needed
          key={currentMonth}
          current={`${currentMonth}-01`}
          onDayPress={onDayPress}
          onMonthChange={(month) => setCurrentMonth(month.dateString.slice(0, 7))}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: BRAND_COLOR,
            selectedDayTextColor: '#ffffff',
            todayTextColor: BRAND_COLOR,
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: BRAND_COLOR,
            selectedDotColor: '#ffffff',
            arrowColor: BRAND_COLOR,
            monthTextColor: '#2d4150',
            indicatorColor: BRAND_COLOR,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13
          }}
          style={styles.calendar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  todayBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: `${BRAND_COLOR}15`, 
    padding: 8, 
    borderRadius: 20 
  },
  todayText: { color: BRAND_COLOR, fontWeight: '600', marginLeft: 4, fontSize: 12 },
  calendarContainer: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  loader: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  calendar: { borderRadius: 10 },
});