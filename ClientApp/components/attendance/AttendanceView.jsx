import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, TextInput, Alert, Modal, TouchableWithoutFeedback
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/axiosClient';

const BRAND_COLOR = '#ed1a3b';

export default function ViewAttendanceRecord({ onBack }) {
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const [showEmpModal, setShowEmpModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/attendanceview/employeeslists');
            setEmployees(res.data.Data || []);
            if (res.data.Data && res.data.Data.length > 0) {
                setSelectedEmp(res.data.Data[0].ID.toString());
            }
        } catch (error) {
            console.log("Error fetching employees", error);
        }
    };

    const fetchRecords = async () => {
        setLoading(true);
        setHasFetched(true);
        try {
            const empName = employees.find(e => e.ID.toString() === selectedEmp)?.Name || '';

            const res = await api.get('/attendanceview/records', {
                params: {
                    AttnFromDate: fromDate,
                    AttnToDate: toDate,
                    AttnEmpID: selectedEmp,
                    AttnEmpName: empName
                }
            });
            setRecords(res.data.Data || []);
        } catch (error) {
            console.log(" fetching records :::::::::::::::", error);
            Alert.alert("Error", "Failed to fetch records.");
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.ID.toString().includes(searchQuery)
    );

    // Helper to colorize status badges
    const getStatusColor = (status) => {
        switch (status) {
            case 'PR': return '#2ecc71'; // Present (Green)
            case 'AB': return '#ed1a3b'; // Absent (Red)
            case 'EX': return '#f39c12'; // Exception/Missing Out (Orange)
            case 'WO': return '#3498db'; // Weekly Off (Blue)
            default: return '#95a5a6';
        }
    };

    const onDateChange = (event, selectedDate, type) => {
        if (type === 'from') {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(selectedDate.toISOString().split('T')[0]);
        } else {
            setShowToPicker(false);
            if (selectedDate) setToDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const renderCard = ({ item }) => {
        const date = item.isDummy ? '--' : item.AttnDate;
        const attn = item.isDummy ? '--' : item.Attn;
        const punchIn = item.isDummy ? '--' : item.PI;
        const punchOut = item.isDummy ? '--' : item.PO;
        const device = item.isDummy ? '--' : item.Device;
        const latLong = item.isDummy ? '--' : item.PunchLatLong;

        return (

            <>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.dateWrap}>
                            <Ionicons name="calendar" size={16} color={BRAND_COLOR} />
                            <Text style={styles.dateText}>{date}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.Attn) }]}>
                            <Text style={styles.statusText}>{attn || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.timeCol}>
                            <Text style={styles.timeLabel}>PUNCH IN</Text>
                            <Text style={styles.timeValue}>{punchIn}</Text>
                        </View>
                        <View style={styles.timeDivider} />
                        <View style={styles.timeCol}>
                            <Text style={styles.timeLabel}>PUNCH OUT</Text>
                            <Text style={styles.timeValue}>{punchOut}</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <MaterialCommunityIcons name={device === 'M' ? 'cellphone' : 'laptop'} size={14} color="#888" />
                        <Text style={styles.footerText} numberOfLines={1}>
                            Lat/Long: {latLong}
                        </Text>
                    </View>
                </View>
            </>
        )

    };

    return (
        <View style={styles.container}>

            {/* Filters Section */}
            <View style={styles.filterSection}>
                <View style={styles.row}>

                    <View style={styles.inputWrap}>
                        <Text style={styles.label}>From Date</Text>
                        <TouchableOpacity
                            style={[styles.textInput, { justifyContent: 'center' }]}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text style={{ color: '#333', fontWeight: '600' }}>{fromDate}</Text>
                        </TouchableOpacity>
                        {showFromPicker && (
                            <DateTimePicker
                                value={new Date(fromDate)}
                                mode="date"
                                display="default"
                                onChange={(event, date) => onDateChange(event, date, 'from')}
                            />
                        )}
                    </View>

                    <View style={styles.inputWrap}>
                        <Text style={styles.label}>To Date</Text>
                        <TouchableOpacity
                            style={[styles.textInput, { justifyContent: 'center' }]}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text style={{ color: '#333', fontWeight: '600' }}>{toDate}</Text>
                        </TouchableOpacity>
                        {showToPicker && (
                            <DateTimePicker
                                value={new Date(toDate)}
                                mode="date"
                                display="default"
                                onChange={(event, date) => onDateChange(event, date, 'to')}
                            />
                        )}
                    </View>

                </View>

                <View style={styles.pickerWrap}>
                    <Text style={styles.label}>Employee</Text>
                    <View style={styles.pickerContainer}>
                        {/* <Picker
                            selectedValue={selectedEmp}
                            onValueChange={(itemValue) => setSelectedEmp(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Employees" value="ALL" />
                            {employees.map(emp => (
                                <Picker.Item key={emp.ID} label={emp.Name} value={emp.ID.toString()} />
                            ))}
                        </Picker> */}
                        <TouchableOpacity
                            style={[styles.textInput, { justifyContent: 'center', height: 40 }]}
                            onPress={() => setShowEmpModal(true)}
                        >
                            <Text style={{ color: '#333', fontWeight: '600' }}>
                                {selectedEmp === 'ALL'
                                    ? 'All Employees'
                                    : employees.find(e => e.ID.toString() === selectedEmp)?.Name || 'Select Employee'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.fetchBtn} onPress={fetchRecords}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.fetchBtnText}>FETCH RECORDS</Text>}
                </TouchableOpacity>
            </View>

            {/* Results List */}
            <FlatList
                // If not fetched yet, pass an array with one empty object to trigger renderCard once
                data={!hasFetched ? [{ isDummy: true }] : records}

                keyExtractor={(item, index) => index.toString()}
                renderItem={renderCard}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    // Only show "No records found" if we HAVE fetched, but records are empty
                    hasFetched ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={50} color="#ddd" />
                            <Text style={styles.emptyText}>No records found.</Text>
                        </View>
                    ) : null
                }
            />

            {/* Bottom Floating Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.leaveBtn}>
                    <Ionicons name="exit-outline" size={20} color={BRAND_COLOR} />
                    <Text style={styles.leaveBtnText}>APPLY / VIEW LEAVE</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showEmpModal} animationType="fade" transparent={true} onRequestClose={() => setShowEmpModal(false)}>
                {/* <View style={styles.modalOverlay}> */}
                <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPressOut={() => setShowEmpModal(false)} // Closes when clicking outside
    >
        <TouchableWithoutFeedback>

                    <View style={styles.modalContent}>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by ID or Name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />

                        <FlatList
                            data={filteredEmployees}
                            keyExtractor={item => item.ID.toString()}
                            renderItem={({ item }) => {
                                const isSelected = item.ID.toString() === selectedEmp;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.empListItem,
                                            // item.ID.toString() === selectedEmp && styles.empListItemSelected
                                            !isSelected && styles.empListItemDefault, // 2. Only add bottom border if NOT selected
                                            isSelected && styles.empListItemSelected  // 3. Only add full red border if SELECTED
                                        ]}
                                        onPress={() => {
                                            setSelectedEmp(item.ID.toString());
                                            setShowEmpModal(false);
                                            setSearchQuery(''); // Clear search when done
                                        }}
                                    >
                                        <Text style={[
                                            styles.empListItemText,
                                            item.ID.toString() === selectedEmp && styles.empListItemTextSelected
                                        ]}>
                                            {item.ID} - {item.Name}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            }}
                            ListHeaderComponent={
                                <TouchableOpacity
                                    style={[styles.empListItem, selectedEmp === 'ALL' && styles.empListItemSelected]}
                                    onPress={() => { setSelectedEmp('ALL'); setShowEmpModal(false); }}
                                >
                                    <Text style={[styles.empListItemText, selectedEmp === 'ALL' && styles.empListItemTextSelected]}>
                                        ALL - All Employees
                                    </Text>
                                </TouchableOpacity>
                            }
                        />

                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowEmpModal(false)}>
                            <Text style={styles.closeModalText}>Close</Text>
                        </TouchableOpacity>
                    </View>

        </TouchableWithoutFeedback>
    </TouchableOpacity>
                {/* </View> */}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfdfc' },

    // Filters
    filterSection: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    inputWrap: { width: '48%' },
    label: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 2, marginLeft: 2 },
    textInput: { backgroundColor: '#f5f6f8', borderRadius: 10, paddingHorizontal: 15, height: 38, color: '#333', fontWeight: '600' },
    pickerWrap: { marginBottom: 8 },
    pickerContainer: { backgroundColor: '#f5f6f8', borderRadius: 10, overflow: 'hidden' },
    picker: { height: 52, color: '#333' },
    fetchBtn: { backgroundColor: BRAND_COLOR, borderRadius: 12, height: 38, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
    fetchBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },

    // List
    listContent: { padding: 15, paddingBottom: 180 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10 },
    dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 14, fontWeight: '800', color: '#333' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    timeCol: { flex: 1, alignItems: 'center' },
    timeLabel: { fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 4 },
    timeValue: { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },
    timeDivider: { width: 1, height: 30, backgroundColor: '#eee' },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8 },
    footerText: { fontSize: 11, color: '#666', flex: 1 },

    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#aaa', marginTop: 10, fontWeight: '500' },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 120, width: '100%', backgroundColor: '#ffffff00', padding: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BRAND_COLOR + '15', padding: 15, borderRadius: 12 },
    leaveBtnText: { color: BRAND_COLOR, fontWeight: '800', letterSpacing: 0.5 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
        // alignItems: 'center' ,
         padding: 30 
        },
    modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '80%',
        // width: '80%'
     },
    searchInput: { backgroundColor: '#f5f6f8', borderRadius: 10, paddingHorizontal: 15, height: 45, marginBottom: 15, color: '#333', borderWidth: 1, borderColor: '#eee' },

    // Base style (padding and radius only)
    empListItem: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 4, // Add tiny space between items
    },
    // Style for NOT selected (Grey Bottom Border)
    empListItemDefault: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    // Style for SELECTED (Full Red Border & Background)
    empListItemSelected: {
        backgroundColor: '#ed1a3b15',
        borderColor: BRAND_COLOR,
        borderWidth: 1.5, // Slightly thicker for better visibility
    },

    empListItemText: { fontSize: 14, color: '#444', fontWeight: '500' },
    empListItemTextSelected: { fontWeight: '800', color: BRAND_COLOR },
    closeModalBtn: { marginTop: 15, padding: 15, backgroundColor: '#f5f6f8', borderRadius: 10, alignItems: 'center' },
    closeModalText: { fontWeight: 'bold', color: '#333' }

});
