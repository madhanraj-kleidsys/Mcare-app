import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchProfileData, changePassword } from '../services/profileService';

const { width, height } = Dimensions.get('window');
const BASE_IMAGE_URL = 'http://192.168.0.117:3000/uploads/';

// --- Constants & Colors ---
const COLORS = {
  primary: '#ed1a3b',
  secondary: '#ed1a3b',
  lightBg: '#f8f4fc',
  darkBg: '#1a1a1a',
  cardLight: '#ffffff',
  cardDark: '#252540',
  textDark: '#333333',
  textLight: '#ffffff',
  textMuted: '#8e8e9a',
  borderLight: '#d3d1d1b6',
  borderDark: '#444460',
  inputBgLight: '#F3F4F6',
  inputBgDark: '#374151',
};

// --- Custom Alert Component ---
const StyledConfirmAlert = ({ visible, title, message, confirmText, cancelText, onConfirm, onCancel, isDarkMode }) => {
  const modalBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const titleColor = isDarkMode ? '#F9FAFB' : '#111827';
  const messageColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cancelBtnBg = isDarkMode ? '#374151' : '#F3F4F6';
  const cancelBtnText = isDarkMode ? '#E5E7EB' : '#374151';

  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={alertStyles.modalOverlay}>
        <View style={[alertStyles.alertContainer, { backgroundColor: modalBg }]}>
          <View style={alertStyles.alertHeader}>
            <View style={[alertStyles.alertIconContainer, { backgroundColor: isDarkMode ? 'rgba(237, 26, 59, 0.2)' : 'rgba(237, 26, 59, 0.1)' }]}>
              <Ionicons name="log-out-outline" size={32} color={COLORS.primary} />
            </View>
          </View>
          <Text style={[alertStyles.alertTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[alertStyles.alertMessage, { color: messageColor }]}>{message}</Text>
          <View style={alertStyles.alertBtnGroup}>
            <TouchableOpacity style={[alertStyles.btnCancel, { backgroundColor: cancelBtnBg }]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={[alertStyles.btnCancelText, { color: cancelBtnText }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={alertStyles.btnConfirm} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={alertStyles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Reset Password Modal ---
const ResetPasswordModal = ({ visible, onClose, isDarkMode }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPass || !newPass) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword(oldPass, newPass);
      setLoading(false);
      if (res.status === 'SUCCESS') {
        Alert.alert("Success", "Password updated successfully!");
        onClose();
        setOldPass(''); setNewPass('');
      } else if (res.status === 'OLD_PW_WRONG') {
        Alert.alert("Error", "Old password is incorrect");
      } else {
        Alert.alert("Error", "Failed to update password");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Network request failed");
    }
  };

  const modalBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const inputBg = isDarkMode ? COLORS.inputBgDark : COLORS.inputBgLight;
  const placeholderColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <Modal transparent={true} visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={alertStyles.modalOverlay}>
        <View style={[alertStyles.alertContainer, { backgroundColor: modalBg, width: width * 0.9 }]}>
          <Text style={[alertStyles.alertTitle, { color: textColor, marginBottom: 20 }]}>Reset Password</Text>

          <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
            <Ionicons name="key-outline" size={20} color={placeholderColor} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Current Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              style={{ flex: 1, color: textColor }}
              value={oldPass}
              onChangeText={setOldPass}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBg, marginTop: 15 }]}>
            <Ionicons name="lock-closed-outline" size={20} color={placeholderColor} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="New Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              style={{ flex: 1, color: textColor }}
              value={newPass}
              onChangeText={setNewPass}
            />
          </View>

          <View style={[alertStyles.alertBtnGroup, { marginTop: 25 }]}>
            <TouchableOpacity style={[alertStyles.btnCancel, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]} onPress={onClose}>
              <Text style={[alertStyles.btnCancelText, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={alertStyles.btnConfirm} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={alertStyles.btnConfirmText}>Update</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Reusable Menu Item Component ---
const MenuItem = ({ icon, label, onPress, isDarkMode, showChevron = true, iconColor, textColor, customRightElement, isLast }) => {
  const displayTextColor = textColor || (isDarkMode ? COLORS.textLight : COLORS.textDark);
  const chevronColor = isDarkMode ? '#666' : '#ccc';
  const boxBg = COLORS.primary;

  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.menuLeft}>
          <View style={[styles.iconBox, { backgroundColor: boxBg }]}>
            <Ionicons name={icon} size={24} color={COLORS.textLight} />
          </View>
          <Text style={[styles.menuLabel, { color: displayTextColor }]}>{label}</Text>
        </View>

        {customRightElement ? (
          customRightElement
        ) : (
          showChevron && <Ionicons name="chevron-forward" size={20} color={chevronColor} />
        )}
      </TouchableOpacity>
      {!isLast && <View style={[styles.separator, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />}
    </>
  );
};

// --- Main Profile Screen ---
export default function ProfileScreen() {
  const { userData, logout } = useAuth(); // userData is backup
  const [profileData, setProfileData] = useState(null); // LIVE DATA

  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const [resetPwdVisible, setResetPwdVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfileData();
        setProfileData(data);
      } catch (e) {
        console.log("Failed to load profile, using fallback.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Merged Data: Prefer API data, fallback to Login data
  const displayData = profileData || userData || {};

  // Image Source Logic

    const profileImageSource = { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face" };
    
  // const profileImageSource = displayData.side_panel_userprof
  //   ? { uri: `${BASE_IMAGE_URL}${displayData.side_panel_userprof}` }
  //   : { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face" };

  const bgStyle = { backgroundColor: isDarkMode ? COLORS.darkBg : COLORS.lightBg };
  const cardStyle = { backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight };
  const textStyle = { color: isDarkMode ? COLORS.textLight : COLORS.textDark };

  return (
    <>
    <View style={[styles.container, bgStyle]}>
      <StyledConfirmAlert
        visible={logoutAlertVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        isDarkMode={isDarkMode}
        onConfirm={() => { setLogoutAlertVisible(false); logout(); }}
        onCancel={() => setLogoutAlertVisible(false)}
      />

      <ResetPasswordModal
        visible={resetPwdVisible}
        onClose={() => setResetPwdVisible(false)}
        isDarkMode={isDarkMode}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={24} color={isDarkMode ? COLORS.textLight : COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image source={profileImageSource} style={styles.profileImage} />
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="camera-outline" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, textStyle]}>
            {displayData.Prof_Name || displayData.Name || "Loading..."}
          </Text>
          <Text style={styles.profileRole}>
            {displayData.Prof_Desg || displayData.Designation || "Designation"}
          </Text>
        </View>

        {/* Bottom Section (Curved) */}
        <View style={[styles.bottomSection, cardStyle]}>

          {/* Info Card */}
          <View style={[styles.infoCard, { borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]}>
            {/* Staff Code */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="id-card" size={16} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Staff Code</Text>
              </View>
              <Text style={styles.infoValue}>{userData?.Code || "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />

            {/* Date of Birth */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="gift-outline" size={16} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Date Of Birth</Text>
              </View>
              <Text style={styles.infoValue}>{displayData.Prof_DOB || displayData.DOB || "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />

            {/* Email */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="mail" size={16} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{userData?.EmailID || "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />

            {/* Reporting To */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="people-outline" size={19} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Reporting To</Text>
              </View>
              <Text style={styles.infoValue}>{displayData.Prof_Reporting || "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />

            {/* Zone */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="map-outline" size={20} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Zone</Text>
              </View>
              <Text style={styles.infoValue}>{displayData.Prof_Zone || "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]} />

            {/* Team */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="people-circle-outline" size={20} color={COLORS.secondary} />
                <Text style={[styles.infoLabelText, textStyle]}>Team</Text>
              </View>
              <Text style={styles.infoValue}>{displayData.Prof_Team || "N/A"}</Text>
            </View>
          </View>

          {/* Menu List */}
          <View style={styles.menuListContainer}>
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => { }} isDarkMode={isDarkMode} />
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => { }} isDarkMode={isDarkMode} />

            {/* Reset Password Trigger */}
            <MenuItem
              icon="key-outline"
              label="Reset Password"
              onPress={() => setResetPwdVisible(true)}
              isDarkMode={isDarkMode}
            />

            <MenuItem
              icon={isDarkMode ? "sunny" : "moon"}
              label={isDarkMode ? "Light Mode" : "Dark Mode"}
              isDarkMode={isDarkMode}
              onPress={() => setIsDarkMode(!isDarkMode)}
              customRightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: '#767577', true: COLORS.primary }}
                  thumbColor={'#f4f3f4'}
                />
              }
            />

            {/* Logout */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setLogoutAlertVisible(true)} activeOpacity={0.6}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}20` }]}>
                  <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: COLORS.primary }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>
    </View>
    </>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 10 },
  headerIcon: { padding: 8 },
  profileSection: { alignItems: 'center', marginBottom: 5, paddingHorizontal: 20 },
  profileImageContainer: {
    width: 110, height: 110, borderRadius: 24, marginBottom: 16,
    backgroundColor: '#fff', padding: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  profileImage: { width: '100%', height: '100%', borderRadius: 20 },
  editBadge: {
    position: 'absolute', bottom: -5, right: -5,
    backgroundColor: COLORS.primary, width: 32, height: 32,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff'
  },
  profileName: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  profileRole: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 10 },
  bottomSection: {
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    padding: 24, flex: 1, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 10,
    minHeight: height * 0.6,
  },
  infoCard: { borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabelText: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  divider: { height: 1, opacity: 0.5 },
  menuListContainer: { marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 16, fontWeight: '500' },
  separator: { height: 1, marginLeft: 58, marginVertical: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 15, height: 50,
  },
});

const alertStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  alertContainer: { width: width * 0.85, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  alertHeader: { marginBottom: 16 },
  alertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertBtnGroup: { flexDirection: 'row', width: '100%', gap: 12 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnCancelText: { fontWeight: '600', fontSize: 15 },
  btnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
  btnConfirmText: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
});