import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api/axiosClient';

const BRAND_COLOR = '#ed1a3b';
const BG_COLOR = '#f5f7fa'; // Slightly different background tone

export default function MarketingCallList({ status = 'Registered', onBack }) {

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchCalls();
  }, [status]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      // API Call
      const response = await api.get(`/marketing/calls`, {
        params: {
          DocStatus: status,
          FilterQuery: searchText
        }
      });
      setData(response.data.Data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item }) => {
    // Status Badge Color Logic
    let badgeBg = '#e0e0e0';
    let badgeText = '#555';

    if (item.DocStatus === 'REGISTERED') { badgeBg = '#ffebee'; badgeText = '#c62828'; } // Light Red
    if (item.DocStatus === 'ASSIGNED') { badgeBg = '#e3f2fd'; badgeText = '#1565c0'; }   // Light Blue
    if (item.DocStatus === 'COMPLETED') { badgeBg = '#e8f5e9'; badgeText = '#2e7d32'; } // Light Green
    if (item.DocStatus === 'CLOSED') { badgeBg = '#eeeeee'; badgeText = '#616161'; }     // Grey

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>

        {/* HEADER: Customer & Location */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1}>
              Customer Name : {item.CustomerName || item.NewCustomerName || 'Unknown Customer'}
            </Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#888" />
              <Text style={styles.locationText}>
                {item.CustomerLocation || item.NewAddress || 'No Location'}
              </Text>
            </View>
          </View>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.statusText, { color: badgeText }]}>{item.DocStatus}</Text>
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* BODY: Description */}
        <View style={styles.bodySection}>
          <Text style={styles.label}>Purpose / Description</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.MCDesc || 'No Description Provided'}
          </Text>
        </View>

        <View style={styles.bodySection}>
          <Text style={styles.description} numberOfLines={2}>
            {item.ScheduleDateTime || 'No Schedule Date Time Provided'}
          </Text>
        </View>

        {/* FOOTER: Exec Info & Date/ID Pills */}
        <View style={styles.cardFooter}>

          {/* Executive Info */}
          <View style={styles.execInfo}>
            <MaterialCommunityIcons name="account-tie" size={16} color="#555" />
            <Text style={styles.execName} numberOfLines={1}>
              {item.CreatedByOrExecName || item.Executive}
            </Text>
          </View>

          {/* Right Side Pills */}
          <View style={styles.pillsContainer}>
            {/* Date Pill */}
            <View style={styles.pill}>
              <MaterialCommunityIcons name="calendar-month" size={12} color="#666" />
              <Text style={styles.pillText}>{item.DocDate}</Text>
            </View>

            {/* ID Pill */}
            <View style={[styles.pill, { backgroundColor: '#333' }]}>
              <Text style={[styles.pillText, { color: '#fff' }]}>{item.DocNo}</Text>
            </View>
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${status} calls...`}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={fetchCalls}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderCard}
          keyExtractor={(item) => item.ID.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bullhorn-outline" size={50} color="#ddd" />
              <Text style={styles.emptyText}>No Marketing Calls Found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },

  // Search Styles
  searchContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
  backBtn: { width: 44, height: 44, backgroundColor: '#333', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  // Header
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 16, fontWeight: '800', color: '#2c3e50', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#7f8c8d', marginLeft: 2 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },

  // Body
  bodySection: { marginBottom: 12 },
  label: { fontSize: 10, color: '#95a5a6', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  description: { fontSize: 13, color: '#34495e', lineHeight: 18 },

  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  execInfo: { flexDirection: 'row', alignItems: 'center' },
  execName: { fontSize: 12, fontWeight: '600', color: '#555', marginLeft: 6 },

  pillsContainer: { flexDirection: 'row', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 10, fontWeight: '600', color: '#555', marginLeft: 4 },

  // Loading/Empty
  loader: { marginTop: 50 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#aaa', marginTop: 10, fontSize: 14 },
});