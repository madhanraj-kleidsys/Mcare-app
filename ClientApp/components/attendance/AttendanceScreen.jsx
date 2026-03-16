import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, Alert, Modal, ActivityIndicator, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/axiosClient';

const { width } = Dimensions.get('window');
const BRAND_COLOR = '#ed1a3b';
const BASE_URL = 'http://192.168.0.117:3000/uploads/attendance/';

export default function AttendanceScreen() {
  const [logs, setLogs] = useState([]);
  const [lastImage, setLastImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Toggle Logic
  const nextPunchType = logs.length === 0 || logs[0].type === 'PO' ? 'PI' : 'PO';

  useEffect(() => {
    fetchLogs();
    (async () => { await Location.requestForegroundPermissionsAsync(); })();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/attendance/logs');
      const responseArr = res.data.JSONResponse.Response;

      const tableObj = responseArr.find(r => r.Type === "TABULAR");
      if (tableObj && tableObj.Data) {
        const formatted = tableObj.Data.PunchTime.map((time, i) => ({
          id: i,
          time,
          device: tableObj.Data.Device[i] === 'M' ? 'Mobile' : 'Web',
          type: tableObj.Data.PunchType[i],
          lat: tableObj.Data.PunchLat[i],
          long: tableObj.Data.PunchLong[i]
        })).reverse();
        setLogs(formatted);
      }

      const linearObj = responseArr.find(r => r.Type === "LINEAR");
      if (linearObj && linearObj.Data.myImage[0]) {
        setLastImage(`${BASE_URL}${linearObj.Data.myImage[0]}`);
      }
    } catch (e) { console.log(e); }
  };

  const takePictureAndPunch = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });
      const location = await Location.getCurrentPositionAsync({});

      const formData = new FormData();
      formData.append('PunchLat', location.coords.latitude.toString());
      formData.append('PunchLong', location.coords.longitude.toString());
      formData.append('IsPunchValue', nextPunchType);
      formData.append('image', {
        uri: photo.uri,
        name: 'attendance.jpg',
        type: 'image/jpeg',
      });

      await api.post('/attendance/punch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowCamera(false);
      fetchLogs();
    } catch (e) {
      Alert.alert("Error", "Could not save punch. Ensure folder 'public/uploads/attendance' exists on server.");
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={[styles.statusIndicator, { backgroundColor: item.type === 'PI' ? '#2ecc71' : '#e62222' }]} />
      <View style={styles.logMain}>
        <View style={styles.logRow}>
          <Text style={styles.logTime}>{item.time}</Text>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name={item.device === 'Mobile' ? "cellphone" : "laptop"} size={14} color="#888" />
            <Text style={styles.infoText}>{item.device}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: item.type === 'PI' ? '#2ecc71' : '#e62222' }]}>
              {item.type === 'PI' ? 'PUNCH IN' : 'PUNCH OUT'}
            </Text>
          </View>
        </View>
        <View style={styles.logFooter}>
          {/* <View style={styles.infoItem}>
            <MaterialCommunityIcons name={item.device === 'Mobile' ? "cellphone" : "laptop"} size={14} color="#888" />
            <Text style={styles.infoText}>{item.device}</Text>
          </View> */}
          <View style={styles.infoItem}>
            <Ionicons name="location" size={14} color="#888" />
            {/* parseFloat(item.lat).toFixed(3) */}
            <Text style={styles.infoText}>Latitude : {item.lat}</Text>
            {/* <Ionicons name="location" size={14} color="#888" /> */}
            {/* parseFloat(item.long).toFixed(3) */}
            <Text style={styles.infoText}> \`~`/  Longitude : {item.long}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 1. Header Area (Unified) */}
      <View style={styles.header}>
        <View style={styles.profileWrapper}>
          <Image source={lastImage ? { uri: lastImage } : require('../../assets/default-user.jpg')} style={styles.avatar} />
          {/* <View style={styles.presenceBadge}><Text style={styles.presenceText}>ACTIVE</Text></View> */}
          <View style={[
            styles.presenceBadge,
            { backgroundColor: nextPunchType === 'PI' ? '#95a5a6' : '#2ecc71' }
          ]}>
            <Text style={styles.presenceText}>
              {nextPunchType === 'PI' ? 'OFFLINE' : 'ACTIVE'}
            </Text>
          </View>
        </View>
        <Text style={styles.greetText}>Daily Attendance</Text>
        <Text style={styles.dateSubtext}>{new Date().toDateString()}</Text>
      </View>

      {/* 2. History List */}
      <FlatList
        data={logs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.listHeaderTitle}>Punch History</Text>}
      />

      {/* 3. Action Button (Scanner Style) */}
      {/* <TouchableOpacity
        style={[styles.scanBtn, { shadowColor: nextPunchType === 'PI' ? '#2ecc71' : BRAND_COLOR }]}
        onPress={() => setShowCamera(true)}
      >
        <View style={[styles.scanBtnInner, { backgroundColor: nextPunchType === 'PI' ? '#2ecc71' : BRAND_COLOR }]}>
          <MaterialCommunityIcons name="fingerprint" size={38} color="#fff" />
        </View>
        <Text style={styles.scanBtnLabel}>{nextPunchType === 'PI' ? 'PUNCH IN' : 'PUNCH OUT'}</Text>
      </TouchableOpacity> */}

        <TouchableOpacity style={[styles.punchBtn, { backgroundColor: nextPunchType === 'PI' ? '#2ecc71' : BRAND_COLOR }]} onPress={() => setShowCamera(true)}>
             <MaterialCommunityIcons name="fingerprint" size={32} color="#fff" />
             <Text style={styles.punchBtnText}>{nextPunchType === 'PI' ? 'PUNCH IN' : 'PUNCH OUT'}</Text>
           </TouchableOpacity>

      {/* Camera */}
      <Modal visible={showCamera} animationType="slide">
        <CameraView style={styles.camera} ref={cameraRef} facing="front">
          <View style={styles.camOverlay}>
            <TouchableOpacity style={styles.closeCam} onPress={() => setShowCamera(false)}>
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePictureAndPunch}>
              {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  profileWrapper: { marginBottom: 15 },
  avatar: { width: 160, height: 160, borderRadius: 45, overflow: 'hidden', borderWidth: 3, borderColor: BRAND_COLOR },
  presenceBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#2ecc71', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  presenceText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  greetText: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  dateSubtext: { fontSize: 12, color: '#888', marginTop: 4 },

  listContent: { padding: 20, paddingBottom: 180 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 15, letterSpacing: 1 },

  logCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  statusIndicator: { width: 6 },
  logMain: { flex: 1, padding: 16 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logTime: { fontSize: 18, fontWeight: '800', color: '#333' },
  badge: { backgroundColor: '#f8f8f8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900' },
  logFooter: { flexDirection: 'row', gap: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: '#999', fontWeight: '500' },

  // scanBtn: { position: 'absolute', bottom: 100, alignSelf: 'center', alignItems: 'center', elevation: 10 },
  // scanBtnInner: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWeight: 4, borderColor: '#fff' },
  // scanBtnLabel: { marginTop: 8, fontSize: 11, fontWeight: '900', color: '#444', letterSpacing: 1 },

  punchBtn: { position: 'absolute', bottom: 130, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 5 },
  punchBtnText: { color: '#fff', fontWeight: '900', marginLeft: 10, letterSpacing: 1 },

  camera: { flex: 1 },
  camOverlay: { flex: 1, justifyContent: 'space-between', padding: 40, alignItems: 'center' },
  closeCam: { alignSelf: 'flex-start' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 55, height: 55, borderRadius: 30, backgroundColor: '#fff' }
});