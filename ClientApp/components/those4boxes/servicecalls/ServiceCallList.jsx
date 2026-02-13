import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api/axiosClient';

const BRAND_COLOR = '#ed1a3b';
const BG_COLOR = '#fcfdfc';

export default function ServiceCallList({ status = 'Registered', onBack }) {

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [status]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // API Call with Filters
      const response = await api.get('/service/registered', {
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
    // Determine Color based on Status
    let statusColor = '#95a5a6'; // Default Gray
    if (item.DocStatus === 'REGISTERED') statusColor = '#ed1a3b'; // Red
    if (item.DocStatus === 'ASSIGNED') statusColor = '#3498db';   // Blue
    if (item.DocStatus === 'COMPLETED') statusColor = '#27ae60';  // Green
    if (item.DocStatus === 'CLOSED') statusColor = '#555555';     // Dark Gray (Added this!)

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        <View style={[styles.cardStrip, { backgroundColor: statusColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.idContainer}>
              <Text style={styles.cardId}># {item.DocNo}</Text>
            </View>
            <Text style={styles.cardDate}>{item.DocDate}</Text>
          </View>

          <Text style={styles.customerName} numberOfLines={2}>
            {item.CustomerNameReal || item.CustomerName}
          </Text>


          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#048320" />
            <Text style={styles.detailText} numberOfLines={1}>{item.LocationName || 'Unknown Loc'}</Text>
            <Text style={styles.dot}>•</Text>
            <MaterialCommunityIcons name="account-circle-outline" size={16} color="#ed1a3b" />
            <Text style={styles.userName}> CreatedBy : {item.CreatedBy || 'UnAssigned CreatedBy'}  </Text>
          </View>

          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="cog-outline" size={14} color="#000000" style={{ textShadowColor: '#6666668f', textShadowOffset: { width: 0.1, height: 0.1 }, textShadowRadius: 0.3 }} />
            <Text style={styles.detailTextMachine} numberOfLines={3}>{item.ModelName || 'Unknown Machine'}</Text>
          </View>

          <View style={styles.idContainerApproval}>
            <Text style={styles.cardIdApproval}>  ⚠️ {item.NeedApproval?.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) || 'NO VALUE'}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.userContainer}>
              {/* <MaterialCommunityIcons name="account-circle-outline" size={16} color="#ed1a3b" /> */}
              {/* <Text style={styles.userName}>{ item.DocStatus === "REGISTERED"    ? `Status: ${item.DocStatus}`
                : `Assigned User Name: ${item.AssignedUserName || 'UnAssigned'}`}
              </Text> */}

              {item.DocStatus !== "REGISTERED" && (
                <MaterialCommunityIcons name="account-circle-outline" size={16} color="#ed1a3b" />
              )}

              <Text
                style={[
                  styles.userName,
                  // 2. Apply bold and size 15 only if DocStatus is REGISTERED
                  item.DocStatus === "REGISTERED" && { fontSize: 15, fontWeight: 'bold', textTransform: 'capitalize' }
                ]}
              >
                {item.DocStatus === "REGISTERED"
                  ? item.DocStatus.toLowerCase()
                  : `Assigned User : ${item.AssignedUserName || 'UnAssigned'}`
                }
              </Text>
            </View>

            {item.NeedApproval === 'NEEDS APPROVAL' && (
              <View style={styles.warningBadge}>
                <MaterialCommunityIcons name="alert-circle" size={12} color="#ff0000" />
                <Text style={styles.warningText}>Approval Pending</Text>
              </View>
            )}

          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {/* Back Button (Local navigation) */}
        <TouchableOpacity style={styles.filterBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${status}...`}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={fetchTickets}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Ticket List */}
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
              <MaterialCommunityIcons name="file-search-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No {status} Requests Found</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button - Add new service call */}
<TouchableOpacity
  style={[styles.fab, { backgroundColor: BRAND_COLOR }]}
  onPress={() => {
    // Adjust to your navigation / function
    navigation.navigate('NewServiceCall');
    // or: yourExistingFunction('NEW')
  }}
>
  <MaterialCommunityIcons name="plus" size={28} color="#fff" />
</TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  searchContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterBtn: { width: 46, height: 46, backgroundColor: '#ffffff', elevation: 2, shadowColor: '#000', shadowOpacity: 2, shadowRadius: 5, shadowOffset: { width: 2, height: 2 }, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 110 }, // Extra padding for Dock
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  cardStrip: { width: 5, height: '100%' },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardId: { fontSize: 12, fontWeight: '700', color: '#555' },
  idContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  cardIdApproval: { fontSize: 15, fontWeight: '700', color: '#555' },
  idContainerApproval: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignSelf: 'flex-start'
  },
  cardDate: { fontSize: 12, color: 'rgba(0, 0, 0, 0.66)', fontWeight: '700' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { fontSize: 12, fontWeight: '700', color: '#048320', marginLeft: 4, maxWidth: 120 },
  detailTextMachine: { fontSize: 12, fontWeight: '500', color: '#000000', marginLeft: 4, marginBottom: 4, maxWidth: 300 },
  dot: { marginHorizontal: 6, color: '#ccc' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  userContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 0.5, },
  userName: { fontSize: 12, color: '#df8601', marginLeft: 6, fontWeight: '500' },
  warningBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3cd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  warningText: { fontSize: 10, color: '#856404', marginLeft: 4, fontWeight: '700' },
  loader: { marginTop: 50 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  fab: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.4,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
}
});