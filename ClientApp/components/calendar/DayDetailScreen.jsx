import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosClient';

export default function DayDetailScreen() {
  const route = useRoute();
  const selectedDate = route.params?.selectedDate || "2025-08-14";
  
  const [activeTab, setActiveTab] = useState('SR'); // SR, MC, TSK
  const [data, setData] = useState({ SR: [], MC: [], TSK: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, [selectedDate]);

  const fetchHighlights = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/calendar/highlights?DateVal=${selectedDate}`);
      setData({
        SR: res.data.SRData.Data,
        MC: res.data.MCData.Data,
        TSK: res.data.TSKData.Data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>#{item.SRNo || item.MCNo || item.TSKNo}</Text>
        <View style={styles.timeBadge}><Text style={styles.timeText}>{item.Sch}</Text></View>
        <View style={styles.statusBadge}><Text style={styles.statusText}>{item.Status}</Text></View>
      </View>
      <Text style={styles.cardUser}>{item.AssignedUserName}</Text>
      {item.CustName && <Text style={styles.cardCust}>{item.CustName}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Text style={styles.dateLabel}>{selectedDate}</Text>
      </View>

      <View style={styles.tabBar}>
        {['SR', 'MC', 'TSK'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'SR' ? 'SERVICE' : tab === 'MC' ? 'MARKETING' : 'TASKS'}
            </Text>
            <Text style={styles.count}>({data[tab].length})</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ed1a3b" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data[activeTab]}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No data available for this date</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333' },
  topNav: { paddingTop: 50, padding: 20, alignItems: 'center' },
  dateLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: '#444', padding: 10, borderRadius: 5 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#555' },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#ed1a3b' },
  tabText: { color: '#aaa', fontSize: 12 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  count: { color: '#23f92e', fontSize: 10 },
  card: { backgroundColor: '#444', padding: 15, borderRadius: 8, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardId: { color: '#fff', fontWeight: 'bold' },
  timeBadge: { backgroundColor: '#ed1a3b', padding: 4, borderRadius: 4 },
  timeText: { color: '#fff', fontSize: 10 },
  statusBadge: { backgroundColor: '#222', padding: 4, borderRadius: 4 },
  statusText: { color: '#aaa', fontSize: 10 },
  cardUser: { color: '#ccc', fontSize: 14 },
  cardCust: { color: '#888', fontSize: 12, marginTop: 5 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 100 }
});