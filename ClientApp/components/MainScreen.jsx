import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dashboard from './dashboard/homePage.jsx';
import ProfileScreen from './ProfileScreen.jsx';
import Dock from './dockNav.jsx';
import NotificationScreen from './NotificationScreen.jsx';
import ServiceCallList from './those4boxes/servicecalls/ServiceCallList.jsx';
import MarketingCallList from './those4boxes/marketingcalls/MarketingCallList.jsx';
import TaskList from './those4boxes/tasks/TaskList.jsx';
import ClaimsList from './those4boxes/claims/ClaimsList.jsx';


const BRAND_COLOR = '#ed1a3b';

const PlaceholderScreen = ({ title }) => (
  <View style={styles.center}><Text>{title} Coming AsAp</Text></View>
);

export default function MainScreen() {
  const [currentTab, setCurrentTab] = useState('home');
  const [subView, setSubView] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Registered');

  const getHeaderTitle = () => {
    if (!subView) return 'GA Morgan Dynamics';
    if (subView === 'service_list') return `Service Call List - ${selectedStatus}`;
    if (subView === 'marketing_list') return `Marketing Call List - ${selectedStatus}`;
    if (subView === 'tasks_list') return `Tasks List - ${selectedStatus}`;
    if (subView === 'claims_list') return `Claims List - ${selectedStatus}`;

    switch (currentTab) {
      case 'home': return 'GA Morgan Dynamics';
      case 'calendar': return 'Calendar';
      case 'attendance': return 'Attendance';
      case 'view': return 'Views';
      default: return 'GA Morgan Dynamics';
    }
  };

  const handleDashboardNavigation = (status,type) => {
    setSelectedStatus(status);
    // setSubView('service_list');
    if (type === 'service') {
        setSubView('service_list');
    } else if (type === 'marketing') {
        setSubView('marketing_list');
    } else if (type === 'tasks') {
        setSubView('tasks_list');
    } else if (type === 'claims') {
        setSubView('claims_list');
    }
  };

  const handleBack = () => {
    setSubView(null);
  };

  const renderContent = () => {

    if (subView === 'service_list') {
      return (
        <ServiceCallList 
          status={selectedStatus} 
          onBack={() => setSubView(null)}
        />
      );
    }

    if (subView === 'marketing_list') {
      return (
        <MarketingCallList
        status={selectedStatus}
        onBack={() => setSubView(null)}
        />
      )
    }

    if (subView === 'tasks_list'){
      return (
        <TaskList 
        status={selectedStatus}
        onBack={() => setSubView(null)}
        />
      )
    }

    if (subView === 'claims_list'){
      return (
        <ClaimsList 
        status={selectedStatus}
        onBack={() => setSubView(null)}
        />
      )
    }

    switch (currentTab) {
      case 'home': return <Dashboard onNavigate={handleDashboardNavigation} />;
      case 'notifications': return <NotificationScreen />;
      case 'calendar': return <PlaceholderScreen title="Calendar" />;
      case 'attendance': return <PlaceholderScreen title="Attendance" />;
      case 'view': return <PlaceholderScreen title="Views" />;
      case 'profile': return <ProfileScreen />;
      default: return <Dashboard />;
    }
  };

  return (
    <View style={styles.container}>
      {currentTab !== 'profile' && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <TouchableOpacity style={styles.notificationButton}
          onPress={() => setCurrentTab('notifications')}
          activeOpacity={0.7}>
            <MaterialCommunityIcons
             name={currentTab === 'notifications' ? "bell-ring" : "bell-outline"}
             size={24} color="#fff" />
             {currentTab !== 'notifications' && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>!</Text>
            </View>
          )}
          </TouchableOpacity>
        </View>
      )}
      {/* 1. Main Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 2. Dock Fixed at Bottom                 setCurrentTab */}
      <Dock activeTab={currentTab} onTabChange={(tab) => {
        setCurrentTab(tab);
        setSubView(null);
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 60,
    marginBottom: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  notificationButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
    padding: 8,
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top:-2,
    right:0,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '900',
  },

  container: { flex: 1, backgroundColor: '#fcfdfc' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

