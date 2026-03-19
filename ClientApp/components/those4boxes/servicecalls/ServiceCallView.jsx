import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Linking, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api/axiosClient';

const { width } = Dimensions.get('window');
const BRAND_RED = '#ed1a3b';
const LIGHT_BG = '#f8f9fa';

const ServiceCallView = ({ servReqID, onBack, cameFrom }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceCall = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/service/callview/${servReqID}`);
        setData(res.data);
      } catch (err) {
        console.error('service call view Fetch error:', err);
        Alert.alert('Error', 'Could not load service call details');
      } finally {
        setLoading(false);
      }
    };
    fetchServiceCall();
  }, [servReqID]);

  // useEffect(() => {
  //   if (cameFrom === 'claim') {
  //     console.log("Opened from claim → maybe track analytics or something");
  //   }
  // }, [cameFrom]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND_RED} />
      </View>
    );
  }

  if (!data) return null;

  const status = data['sr-doc-status'];

  // Status Theme Logic
  const getStatusTheme = () => {
    switch (status) {
      case 'REGISTERED': return { color: '#c62828', bg: '#ffebee', icon: 'alert-circle-outline' };
      case 'ASSIGNED': return { color: '#1565c0', bg: '#e3f2fd', icon: 'account-clock-outline' };
      case 'COMPLETED': return { color: '#2e7d32', bg: '#e8f5e9', icon: 'check-circle-outline' };
      case 'CLOSED': return { color: '#424242', bg: '#f5f5f5', icon: 'lock-outline' };
      default: return { color: '#757575', bg: '#eee', icon: 'help-circle-outline' };
    }
  };

  const theme = getStatusTheme();
  const hasImage = data.MacImg && data.MacImg !== '_NO_IMAGE_';
  const imageUri = hasImage ? { uri: `http://192.168.0.117:3000/uploads/${data.MacImg}` } : null;

  const isFromClaim = cameFrom === 'claim';

  return (
    <View style={styles.container}>
      {/* Top Floating Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backFab}>
        <MaterialCommunityIcons 
        name={isFromClaim ? "arrow-left-thick" : "arrow-left-thick"} 
          size={isFromClaim ? 28 : 24} 
          color={isFromClaim ? "#0077ff" : BRAND_RED}
        />
      </TouchableOpacity>

      {isFromClaim && (
        <View style={styles.fromClaimsBadge}>
          <Text style={styles.fromClaimsText}>From Claims</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.rowBetween}>
            <View style={styles.idBadge}><Text style={styles.idText}>#{data['sr-doc-no']}</Text></View>
            <Text style={styles.dateText}>{data['sr-doc-date']}</Text>
          </View>

          <Text style={styles.custName}>{data['sr-cust-name']}</Text>
          <View style={styles.locRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
            <Text style={styles.custLoc}>{data['sr-cust-loc']}</Text>
          </View>

          <View style={styles.rowBetween}>
          <View style={[styles.statusBanner, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons name={theme.icon} size={18} color={theme.color} />
            <Text style={[styles.statusText, { color: theme.color }]}>{status}</Text>
          </View>

{data['HidSR_CompletedOn'] && (
           <View style={[styles.statusBanner, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons name={theme.icon} size={18} color={theme.color} />
            <Text style={[styles.statusText, { color: theme.color }]}>{data['HidSR_CompletedOn']}</Text>
          </View>
        )}
          </View>
          
        </View>

        {/* Personnel Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          <View style={styles.userRow}>
            <MaterialCommunityIcons name="account-edit-outline" size={20} color="#666" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.label}>Created By</Text>
              <Text style={styles.value}>{data['sr-FullName']}</Text>
            </View>
          </View>
          {data['sr-assigned-username'] && (
            <View style={[styles.userRow, { marginTop: 15 }]}>
              <MaterialCommunityIcons name="account-tie-outline" size={20} color={BRAND_RED} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.label}>Assigned Executive</Text>
                <Text style={styles.value}>{data['sr-assigned-username']}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Call Now Action */}
        <TouchableOpacity
          style={styles.callStrip}
          onPress={() => data['sr-cont-no'] && Linking.openURL(`tel:${data['sr-cont-no']}`)}
        >
          <View style={styles.callLeft}>
            <MaterialCommunityIcons name="phone" size={20} color="#fff" />
            <Text style={styles.callName}>{data['sr-person-name']}</Text>
          </View>
          <Text style={styles.callNumber}>{data['sr-cont-no']}</Text>
        </TouchableOpacity>

        {/* Machine Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Machine Information</Text>
          <View style={styles.machineLayout}>
            <View style={styles.imageBox}>
              {hasImage ? (
                <Image source={imageUri} style={styles.machineImg} resizeMode="cover" />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <MaterialCommunityIcons name="image-off" size={30} color="#ccc" />
                </View>
              )}
            </View>
            <View style={styles.machineDetails}>
              <Text style={styles.machName} numberOfLines={2}>{data['sr-mach-name']}</Text>
              <Text style={styles.serialNo}>SN: {data['sr-mach-serialNo']}</Text>
              <View style={[styles.warrantyBadge, { backgroundColor: data.HidSR_IsUnderWarranty ? '#e8f5e9' : '#ffebee' }]}>
                <Text style={{ color: data.HidSR_IsUnderWarranty ? '#2e7d32' : '#c62828', fontSize: 10, fontWeight: 'bold' }}>
                  {data.HidSR_IsUnderWarranty ? 'UNDER WARRANTY' : 'OUT OF WARRANTY'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.miniLabel}>Installed On</Text>
              <Text style={styles.miniValue}>{data['sr-mach-InstDate'] || '—'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.miniLabel}>Warranty Ends</Text>
              <Text style={styles.miniValue}>{data['sr-mach-WarrDate'] || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Service Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Service Details</Text>

          <Text style={styles.label}>Service Type</Text>
          <Text style={styles.valueBold}>{data['sr-type-value']}</Text>

          <Text style={styles.label}>Problem Description</Text>
          <Text style={styles.longText}>{data['sr-cust-desc'] || 'No details provided'}</Text>

          {data['sr-assign-comm'] && (
            <>
              <Text style={styles.label}>Internal Instructions</Text>
              <Text style={styles.longText}>{data['sr-assign-comm']}</Text>
            </>
          )}
        </View>

        {/* Dynamic Action Buttons */}
        <View style={styles.buttonContainer}>
          {status === 'REGISTERED' && (
            <>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#333' }]}><Text style={styles.btnText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#1565c0' }]}><Text style={styles.btnText}>Assign</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: BRAND_RED }]}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
            </>
          )}

          {status === 'ASSIGNED' && (
            <>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#673ab7' }]}><MaterialCommunityIcons name="map-marker" size={16} color="#fff" /><Text style={styles.btnText}>Track</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#2e7d32' }]}><Text style={styles.btnText}>Start Service</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#333' }]}><Text style={styles.btnText}>Re-Assign</Text></TouchableOpacity>
            </>
          )}

          {status === 'COMPLETED' && (
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#333', width: '100%' }]}><Text style={styles.btnText}>Close Request</Text></TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <View style={{ height: 50 }} />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backFab: {
    position: 'absolute', top: 15, left: 15, zIndex: 10,
    backgroundColor: '#fff', padding: 8, borderRadius: 12,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },

  fromClaimsBadge: {
    position: 'absolute',
    top: 18,
    left: 160,
    // zIndex: 99,
    backgroundColor: '#0077ff93', 
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(53, 159, 220, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fromClaimsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  scrollContent: { padding: 16, paddingTop: 70, paddingBottom: 100 },
  headerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  idBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  idText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  dateText: { color: '#888', fontSize: 13 },
  custName: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 15 },
  custLoc: { color: '#666', fontSize: 14, marginLeft: 4 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  statusText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  callStrip: {
    backgroundColor: BRAND_RED, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 16,
    elevation: 3, shadowColor: BRAND_RED, shadowOpacity: 0.3
  },
  callLeft: { flexDirection: 'row', alignItems: 'center' },
  callName: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
  callNumber: { color: '#fff', fontSize: 14, opacity: 0.9 },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.02
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 },
  machineLayout: { flexDirection: 'row', marginBottom: 15 },
  imageBox: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  machineImg: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  machineDetails: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  machName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  serialNo: { fontSize: 13, color: '#777', marginTop: 2 },
  warrantyBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 5 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  gridItem: { flex: 1 },
  miniLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  miniValue: { fontSize: 13, color: '#333', fontWeight: '600' },
  label: { fontSize: 11, color: '#aaa', textTransform: 'uppercase', marginTop: 12 },
  valueBold: { fontSize: 16, fontWeight: 'bold', color: BRAND_RED, marginTop: 2 },
  longText: { fontSize: 14, color: '#555', lineHeight: 20, marginTop: 4, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  buttonContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  btn: { flex: 1, minWidth: '30%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 5 }
});

export default ServiceCallView;

