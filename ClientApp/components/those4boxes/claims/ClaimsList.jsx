import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api/axiosClient';

const BG_COLOR = '#fcfdfc';
const CARD_BG = '#ffffff';

// --- OPTIMIZATION 1: Extract & Memoize the Card ---
// By using memo, this component ONLY re-renders if 'item' props change.
const ClaimCard = memo(({ item, onPress }) => {
  // Calculate status logic inside the component to keep parent clean
  const itemStatus = item.DocStatus || 'BOOKED';
  let statusColor = '#95a5a6';
  const s = itemStatus.toUpperCase();
  
  if (s === 'BOOKED' || s === 'REGISTERED') statusColor = '#e67e22';
  if (s === 'WAITING' || s === 'PENDING') statusColor = '#f1c40f';
  if (s === 'APPROVED' || s === 'VERIFIED') statusColor = '#27ae60';
  if (s === 'CANCELLED' || s === 'REJECTED') statusColor = '#c0392b';

  const displayDate = item.docDate || (item.DocDate
    ? new Date(item.DocDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '—');

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <View style={[styles.cardStrip, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={styles.cardId}>
              #{item.RefTypePrefix ? `${item.RefTypePrefix}-` : ''}{item.RefDocNo || item.DocNo || '—'}
            </Text>
          </View>
          <Text style={styles.cardDate}>{displayDate}</Text>
        </View>

        <Text style={styles.customerName} numberOfLines={1}>
          {item.CustName || 'Unknown Customer'}
        </Text>

        <View style={styles.detailsRow}>
          <MaterialCommunityIcons name="text-short" size={16} color="#666" />
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.descInfo || item.Comments || 'No description provided'}
          </Text>
        </View>

        {(item.RefTypePrefix || item.RefDocNo) && (
          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="file-document-outline" size={14} color="#048320" />
            <Text style={styles.refText}>
              Ref: {item.RefTypePrefix} {item.RefDocNo}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.userContainer}>
            <MaterialCommunityIcons name="account-circle-outline" size={16} color={statusColor} />
            <Text style={[styles.userName, { color: '#555' }]}>
               {item.CreatedByName || 'Unknown User'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
             <Text style={[styles.statusText, { color: statusColor }]}>
               {itemStatus}
             </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison (Optional): Only re-render if ID or Status changes
  return prevProps.item.ID === nextProps.item.ID && 
         prevProps.item.DocStatus === nextProps.item.DocStatus;
});


export default function ClaimsListScreen({ status = 'Booked', onBack }) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Status Theme (Only for FAB/Global usage)
  const getBrandColor = () => {
     if(status === 'Approved') return '#27ae60';
     if(status === 'Cancelled') return '#c0392b';
     if(status === 'Waiting') return '#f1c40f';
     return '#e67e22'; 
  }
  const brandColor = getBrandColor();

  const fetchClaims = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const params = {
        CLM_Source: query.trim() ? 'Filter' : 'Normal',
        DocStatus: status.toUpperCase(),
        FilterQuery: query.trim() || undefined,
      };
      // Mocking API call for safety in this snippet
      const response = await api.get('/claims/lists', { params }); 
      setData(response.data?.Data || []);
    } catch (err) {
      console.error('Claims fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleSearch = () => fetchClaims(searchText.trim());

  // --- OPTIMIZATION 2: Stable Callback Functions ---
  const handleCardPress = useCallback((item) => {
    // navigation.navigate('ClaimDetail', { claimId: item.ID });
    console.log("Pressed", item.ID);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <ClaimCard item={item} onPress={handleCardPress} />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item) => item.ID?.toString() || Math.random().toString(), []);

  // --- OPTIMIZATION 3: getItemLayout ---
  // If your cards are roughly fixed height (e.g. 160px), this skips measurement entirely.
  // Only enable this if your cards don't vary wildly in height.
  /*
  const getItemLayout = useCallback((data, index) => ({
    length: 160,
    offset: 160 * index,
    index,
  }), []); 
  */

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${status}...`}
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
           {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); fetchClaims(''); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          
          // --- OPTIMIZATION 4: FlatList Performance Props ---
          initialNumToRender={8}       // Render enough to fill the screen first
          maxToRenderPerBatch={10}     // Render next batch in small chunks
          windowSize={5}               // Reduce memory (default is 21 screens worth of data)
          removeClippedSubviews={true} // Unmount views that are off-screen (Android mostly)
          updateCellsBatchingPeriod={50} // Delay in ms between batches
          
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-alert-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No {status} Claims Found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: brandColor }]}
        onPress={() => navigation.navigate('NewClaim', { type: 'NEW' })}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  searchContainer: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }},
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  
  // Card Styles
  card: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  cardStrip: { width: 5, height: '100%' },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  idContainer: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cardId: { fontSize: 12, fontWeight: '700', color: '#555' },
  cardDate: { fontSize: 12, color: '#999', fontWeight: '600' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  descriptionText: { fontSize: 13, color: '#666', marginLeft: 3, flex: 1 },
  refText: { fontSize: 12, color: '#048320', fontWeight: '600', marginLeft: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10, marginTop: 4 },
  userContainer: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, backgroundColor: '#fafafa' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  loader: { marginTop: 50 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }},
});