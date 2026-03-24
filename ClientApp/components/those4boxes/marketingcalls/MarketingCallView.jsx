import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Linking, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../api/axiosClient';

const BRAND_RED = '#ed1a3b';

export default function MarketingCallView({ markCallID, onBack, cameFrom, onStatusChange }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);


    const fetchDetails = async () => {
        try {
            setLoading(true);
            // Endpoint adjusted to your requirement
            const response = await api.get(`/marketing/callview/${markCallID}`
                // , { params: { MarkCallsID: markCallID } }
            );
            // API returns an array, we need the first object
            setData(response.data[0] || null);

            if (onStatusChange && mktData.DocStatus) {
          onStatusChange(mktData.DocStatus);
        }
        
        } catch (error) {
            console.error("View Fetch Error:", error);
            Alert.alert("Error", "Failed to load marketing call details.");
        } finally {
            setLoading(false);
        }
    };
    // console.log("Mark Call ID in View:", markCallID);

    useEffect(() => {
        fetchDetails();
    }, [markCallID]);


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={BRAND_RED} />
            </View>
        );
    }

    if (!data) return null;

    // Status mapping for colors and icons
    const status = data['mc-doc-status'];
    const getStatusTheme = () => {
        switch (status) {
            case 'REGISTERED': return { color: '#c62828', bg: '#ffebee', icon: 'alert-decagram' };
            case 'ASSIGNED': return { color: '#1565c0', bg: '#e3f2fd', icon: 'account-clock' };
            case 'COMPLETED': return { color: '#2e7d32', bg: '#e8f5e9', icon: 'check-circle' };
            case 'CLOSED': return { color: '#424242', bg: '#f5f5f5', icon: 'lock' };
            default: return { color: '#757575', bg: '#fafafa', icon: 'help-circle' };
        }
    };

    const theme = getStatusTheme();
    const isFromClaim = cameFrom === 'claim';

    return (
        <View style={styles.container}>
            {/* Action Header Button (Floating Style Back) */}
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

                {/* Header Section */}
                <View style={styles.headerCard}>
                    <View style={styles.rowBetween}>
                        <View style={styles.idBadge}><Text style={styles.idText}>#{data['mc-doc-no']}</Text></View>
                        <Text style={styles.dateText}>{data['mc-doc-date']}</Text>
                    </View>

                    <Text style={styles.customerName}>{data['mc-cust-name']}</Text>
                    <Text style={styles.custType}>{data['mc-cust-type']}</Text>

                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={BRAND_RED} />
                        <View style={styles.infoCol}>
                            <Text style={styles.valueSmallR}>Location</Text>
                            <Text style={styles.valueSmall}>{data['mc-cust-loc'] || 'Location Not Found'}</Text>
                        </View>
                    </View>


                    <View style={[styles.statusBanner, { backgroundColor: theme.bg }]}>
                        <MaterialCommunityIcons name={theme.icon} size={18} color={theme.color} />
                        <Text style={[styles.statusText, { color: theme.color }]}>{status}</Text>
                    </View>
                </View>

                {/* Contact Info Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account-outline" size={20} color="#1995e7" />
                        <View style={styles.infoCol}>
                            <Text style={[styles.label, { color: '#1565c0' }]}>Person Name</Text>
                            <Text style={styles.value}>{data['mc-person-name-disp'] || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="phone-outline" size={20} color="#ff0000" />
                        <View style={styles.infoCol}>
                            <Text style={[styles.label, { color: '#ff0000' }]}>Contact Number</Text>
                            <TouchableOpacity onPress={() => data['mc-cont-no'] && Linking.openURL(`tel:${data['mc-cont-no']}`)}>
                                <Text style={styles.value}>{data['mc-cont-no'] || 'Not Found'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {data['mc-email'] ? (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>Email Address</Text>
                                <Text style={styles.value}>{data['mc-email']}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Schedule & Location Section */}
                {status !== 'REGISTERED' && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Visit Details</Text>
                        <View style={styles.visitGrid}>
                            <View style={styles.visitItem}>
                                <Text style={styles.label}>Schedule On</Text>
                                <Text style={styles.valueSmall}>{data['mc-schedule']}</Text>
                            </View>
                            <View style={styles.visitItem}>
                                <Text style={styles.label}>Target Completion</Text>
                                <Text style={styles.valueSmall}>{data['mc-target-schedule']}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={BRAND_RED} />
                            <View style={styles.infoCol}>
                                <Text style={styles.valueSmallR}>Location</Text>
                                <Text style={styles.valueSmall}>{data['mc-city'] || `city`}, {data['mc-state'] || 'state'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Assigned Details */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Assignment & Task</Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account-tie" size={20} color="#444" />
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Assigned Executive</Text>
                            <Text style={styles.value}>{data['mc-assigned-username'] || 'Unassigned'}</Text>
                        </View>
                    </View>

                    <Text style={styles.value}>Description</Text>
                    <Text style={styles.longDesc}>{data['mc-cust-desc']}</Text>

                    {data['mc-assign-comm'] && (
                        <>
                            <Text style={[styles.value, { marginTop: 10 }]}>Assign Comments</Text>
                            <Text style={styles.longDesc}>{data['mc-assign-comm']}</Text>
                        </>
                    )}
                </View>

                {/* Outcome Section (Only if Completed/Closed) */}
                {(status === 'COMPLETED' || status === 'CLOSED') && (
                    <View style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: '#2e7d32' }]}>
                        <Text style={styles.sectionTitle}>Closure Details</Text>
                        {/* <Text style={styles.label}>Completed On</Text>
                        <Text style={styles.value}>{data['mc-completed-on']}</Text> */}

                        {/*  <Text style={styles.label}>Closure Status</Text>
            <Text style={styles.value}>{data['mc-closureApprovalStatus']}</Text> */}

                        <View style={styles.visitGrid}>
                            <View style={styles.visitItem}>
                                <Text style={styles.value}>Completed On</Text>
                                <Text style={styles.valueSmallG}>{data['mc-completed-on']}</Text>
                            </View>
                            <View style={styles.visitItem}>
                                <Text style={styles.value}>Closure Status</Text>
                                <Text style={styles.valueSmallG}>{data['mc-closureApprovalStatus'] || 'status Not found'}</Text>
                            </View>
                        </View>


                        {data['mc-clouser-comments'] && (
                            <>
                                <Text style={[styles.value, { marginTop: 10 }]}>Closing Comments</Text>
                                <Text style={styles.longDesc}>{data['mc-clouser-comments']}</Text>
                            </>
                        )}
                    </View>
                )}

                {/* Action Button Row - Logic based on status */}
                <View style={styles.buttonGrid}>
                    {/* Always show Edit for non-closed */}
                    {status !== 'CLOSED' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00ade2' }]}>
                            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                            <Text style={styles.btnText}>Edit</Text>
                        </TouchableOpacity>
                    )}

                    {status === 'REGISTERED' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1565c0' }]}>
                            <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                            <Text style={styles.btnText}>Assign</Text>
                        </TouchableOpacity>
                    )}

                    {status === 'ASSIGNED' && (
                        <>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1d75da' }]}>
                                <MaterialCommunityIcons name="account-tie" size={18} color="#fff" />
                                <Text style={styles.btnText}>Re - Assign</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ff6600' }]}>
                                <MaterialCommunityIcons name="map-marker-path" size={18} color="#fff" />
                                <Text style={styles.btnText}>Record Loc</Text>
                            </TouchableOpacity>
                            {/* <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2e7d32' }]}>
                                <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
                                <Text style={styles.btnText}>Complete</Text>
                            </TouchableOpacity> */}
                        </>
                    )}

                    {status === 'COMPLETED' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#333', width: '100%' }]}>
                            <MaterialCommunityIcons name="lock-check" size={18} color="#fff" />
                            <Text style={styles.btnText}>Close Request</Text>
                        </TouchableOpacity>
                    )}

                    {/* {status !== 'CLOSED' && status !== 'COMPLETED' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: BRAND_RED }]}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                    )} */}
                </View>

                <View style={styles.buttonGrid}>

                    {status === 'ASSIGNED' && (
                        <>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#673ab7' }]}>
                                <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
                                <Text style={styles.btnText}>Executive</Text>
                            </TouchableOpacity>

                            {/* <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2e7d32' }]}>
                                <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
                                <Text style={styles.btnText}>Complete</Text>
                            </TouchableOpacity> */}
                        </>
                    )}

                    {status !== 'CLOSED' && status !== 'COMPLETED' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: BRAND_RED }]}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                    )}

                </View>

                <View style={styles.buttonGrid}>
                    {status === 'ASSIGNED' && (
                        <>

                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2e7d32' }]}>
                                <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
                                <Text style={styles.btnText}>Complete</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

            </ScrollView>

            <View style={{ height: 100 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    scrollPadding: { padding: 16, paddingTop: 70, paddingBottom: 30 },
    headerCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    idText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    dateText: { color: '#888', fontSize: 13 },
    customerName: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 4 },
    custType: { fontSize: 14, color: '#1565c0', fontWeight: '600', marginBottom: 15 },
    statusBanner: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
    },
    statusText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
    sectionCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
    },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#444', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    infoCol: { marginLeft: 12, flex: 1 },
    label: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
    value: { fontSize: 15, color: '#333', fontWeight: '500' },
    visitGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    visitItem: { flex: 0.48 },
    valueSmall: { fontSize: 13, color: '#333', fontWeight: '600' },
    valueSmallG: { fontSize: 13, color: '#00832c', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    valueSmallR: { fontSize: 12, color: '#ed1a3b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
    longDesc: { fontSize: 14, color: '#555', lineHeight: 20, backgroundColor: '#fdfdfd', padding: 8, borderRadius: 8 },
    buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    actionBtn: {
        backgroundColor: '#555', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 12, borderRadius: 12, flex: 1, minWidth: '45%'
    },
    btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 14 }
});