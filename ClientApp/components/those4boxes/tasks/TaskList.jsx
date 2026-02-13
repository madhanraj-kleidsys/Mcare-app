import React, { useState, useEffect, useCallback } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../../api/axiosClient';

// Status → visual theme mapping
const STATUS_THEMES = {
  Registered: {
    title: 'Registered Tasks',
    accent: '#ed1a3b',           // red
    strip: '#ed1a3b',
    bgLight: '#fff5f5',
  },
  Assigned: {
    title: 'Assigned Tasks',
    accent: '#3498db',           // blue
    strip: '#3498db',
    bgLight: '#f0f8ff',
  },
  Completed: {
    title: 'Completed Tasks',
    accent: '#27ae60',           // green
    strip: '#27ae60',
    bgLight: '#f5fff5',
  },
  Closed: {
    title: 'Closed Tasks',
    accent: '#7f8c8d',           // cool gray
    strip: '#555555',
    bgLight: '#f8f9fa',
  },
};

export default function TaskListScreen({ status = 'Registered', onBack }) {
//  route, navigation
  // const { status = 'Registered' } = route.params || {}; // passed from parent / tab
const navigation = useNavigation();
  const theme = STATUS_THEMES[status] || STATUS_THEMES.Registered;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');

  const fetchTasks = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const params = {
        TSK_Source: query ? 'Filter' : 'Normal', // important!
        DocStatus: status,                       // single status (from Option 2)
        FilterQuery: query || undefined,
        // Optional: add date filters, category etc later
      };

      const response = await api.get('/tasks/lists', { params });

      // Adjust according to your real response shape
      setData(response.data?.Data || []);
    } catch (err) {
      console.error('Task fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchTasks(); // initial load
  }, [fetchTasks]);

  // Search on submit (Enter) or after small delay
  const handleSearch = () => {
    fetchTasks(searchText.trim());
  };

  const renderCard = ({ item }) => {
    const taskStatus = item.DocStatus || 'REGISTERED';

    // You can override accent per card if you want multi-status view later
    const cardStripColor = STATUS_THEMES[taskStatus]?.strip || '#95a5a6';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88}>
        <View style={[styles.cardStrip, { backgroundColor: cardStripColor }]} />

        <View style={styles.cardContent}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.idContainer}>
              <Text style={styles.cardId}>#{item.TaskID || item.DocNo || '—'}</Text>
            </View>
            <Text style={styles.cardDate}>
              {item.DocDate
                ? new Date(item.DocDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>

          {/* Category / Title */}
          <Text style={styles.categoryTitle} numberOfLines={1}>
            {item.CategoryName || 'No Category'}
          </Text>

          {/* Description / Comments */}
          <Text style={styles.description} numberOfLines={2}>
            {item.Comments || item.Description || 'No details provided'}
          </Text>

          {/* People & meta */}
          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={16} color={theme.accent} />
            <Text style={styles.userText}>
              {taskStatus === 'REGISTERED'
                ? `Created: ${item.CreatedBy || '—'}`
                : `Assigned: ${item.AssignedUserName || item.AssignedUserID || 'Unassigned'}`}
            </Text>
          </View>

          {/* Target / Schedule date */}
          {item.ScheduleDateTime || item.TargetDateTime ? (
            <View style={styles.detailsRow}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={16} color="#666" />
              <Text style={styles.dateText}>
                Target: {new Date(item.ScheduleDateTime || item.TargetDateTime).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {/* Footer tags / status pill */}
          <View style={styles.statusPillContainer}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: cardStripColor + '22', borderColor: cardStripColor },
              ]}
            >
              <Text style={[styles.statusText, { color: cardStripColor }]}>
                {taskStatus}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgLight }]}>
      {/* Header / Search */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}> */}
         <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>

        {/* <Text style={styles.screenTitle}>{theme.title}</Text> */}

        <View style={styles.placeholder} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${status.toLowerCase()} tasks...`}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(''); fetchTasks(''); }}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderCard}
          keyExtractor={(item) => item.ID?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-search-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No {status} tasks found</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button – Add new task */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('AddTask')} // ← adjust route name
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  screenTitle: { flex: 1, fontSize: 19, fontWeight: '700', textAlign: 'center', color: '#111' },
  placeholder: { width: 40 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardStrip: { width: 6 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  idContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardId: { fontSize: 13, fontWeight: '700', color: '#444' },
  cardDate: { fontSize: 13, color: '#666', fontWeight: '600' },
  categoryTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 4 },
  description: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 10 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  userText: { fontSize: 13, color: '#444', marginLeft: 6 },
  dateText: { fontSize: 13, color: '#666', marginLeft: 6 },
  statusPillContainer: { alignItems: 'flex-start', marginTop: 6 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#aaa' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});