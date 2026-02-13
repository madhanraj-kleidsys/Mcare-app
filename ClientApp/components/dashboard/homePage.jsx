 import React, { useState,useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  StatusBar,
  TouchableOpacity,ActivityIndicator,Image,Animated,Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dock from '../dockNav';
import UnifiedSection from '../UnifiedSection';
import api from '../../api/axiosClient';
// import CustomLoader from '../loader/CustomLoader';
import DashboardSkeleton from '../loader/DashboardSkeleton';

const BRAND_COLOR = '#ed1a3b';
const BG_COLOR = '#ffffff4f';

const Dashboard = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading,setLoading] = useState(true);
  const [rawApiData, setRawApiData] = useState([]);
  const [dashboardData,setDashboardData] = useState({
    service:[],
    marketing:[],
    tasks:[],
    claims:[]
  });

  const getVal = (data,key) =>{
    const item = data?.find(obj => obj.hasOwnProperty(key));
    return item ? item[key] : '0';
  }

useEffect(()=>{
  const fetchData = async() =>{
    try{
      const res = await api.get('/home/dashboard');
      const apiData = res.data;

      setRawApiData(apiData);

  const allData = {
    service: [
     { title: 'Registered', count: getVal(apiData, 'SR_Open'), icon: 'clipboard-text-outline' },
            { title: 'Assigned', count: getVal(apiData, 'SR_Assigned'), icon: 'account-check' },
            { title: 'Completed', count: getVal(apiData, 'SR_Completed'), icon: 'check-circle' },
            { title: 'Closed', count: getVal(apiData, 'SR_Closed'), icon: 'lock' },
    ],
    marketing: [
      { title: 'Registered', count: getVal(apiData, 'MC_Open'), icon: 'bullhorn' },
      { title: 'Assigned', count: getVal(apiData, 'MC_Assigned'), icon: 'account-group' },
      { title: 'Completed', count: getVal(apiData, 'MC_Completed'), icon: 'check-decagram' },
      { title: 'Closed', count: getVal(apiData, 'MC_Closed'), icon: 'close-circle' },
    ],
    tasks: [
      { title: 'Registered', count: getVal(apiData, 'TSK_Open'), icon: 'format-list-checks' },
      { title: 'Assigned', count: getVal(apiData, 'TSK_Assigned'), icon: 'calendar-clock' },
      { title: 'Completed', count: getVal(apiData, 'TSK_Completed'), icon: 'checkbox-marked-circle-outline' },
      { title: 'Closed', count: getVal(apiData, 'TSK_Closed'), icon: 'cancel' },
    ],
    claims: [
      { title: 'Booked', count: getVal(apiData, 'CLM_Booked'), icon: 'file-document-edit' },
      { title: 'Waiting', count: getVal(apiData, 'CLM_Waiting'), icon: 'timer-sand' },
      { title: 'Approved', count: getVal(apiData, 'CLM_Approved'), icon: 'thumb-up' },
      { title: 'Paid', count: getVal(apiData, 'CLM_Closed'), icon: 'cash-check' },
    ],
  };
     setDashboardData(allData);
    } catch(error){
      console.error("DaSHbOArD DaTa FeTcH eRRoR",error);
    }
    finally{
      setLoading(false);
    }
  };
  fetchData();
}, []);

  // const pulseAnim = new Animated.Value(1);
  
  // React.useEffect(() => {
  //   Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(pulseAnim, {
  //         toValue: 1.15,
  //         duration: 800,
  //         easing: Easing.inOut(Easing.ease),
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(pulseAnim, {
  //         toValue: 1,
  //         duration: 800,
  //         easing: Easing.inOut(Easing.ease),
  //         useNativeDriver: true,
  //       }),
  //     ])
  //   ).start();
  // }, []);
if(loading){
  return (
    <View style={{ flex: 1 }}>

  {/* <CustomLoader loading={true} /> */}
        <DashboardSkeleton />
    </View>
  );

//     return (
//       // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       //   <ActivityIndicator size="large" color="#ed1a3b" />
//       // </View>
//       <View 
//       style={{
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#fff', // or your screen bg
//       }}
//     >
//       {/* Optional: your company logo or a red icon */}
//       {/* <Image 
//         source={require('../../assets/ic_launcher.png')} // ← add your logo here if you have one
//         style={{ width: 80, height: 80, marginBottom: 20, tintColor: '#ed1a3b' }}
//         resizeMode="contain"
//       />
// */}
//       <Animated.Text
//         style={{
//           color: '#ed1a3b',
//           fontSize: 18,
//           fontWeight: 'bold',
//           marginBottom: 16,
//         }}
//       >
//         Loading Morgan Dynamics...
//       </Animated.Text> 


//       <Animated.Image
//   source={require('../../assets/ic_launcher.png')}
//   style={{
//     width: 80,
//     height: 80,
//     marginBottom: 20,
//     tintColor: '#ed1a3b',
//     transform: [{ scale: pulseAnim }],
//   }}
// />

//       {/* Keep ActivityIndicator but style it bigger + branded color */}
//       <ActivityIndicator size="large" color="#ed1a3b" />
//     </View>
//     );
}

const checkPermission = (data, code) => {
    if (!Array.isArray(data)) return false; // Safety check
    
    // Find object where ScreenCode matches
    // API returns multiple objects with ScreenCode. 
    // look for one that matches the code AND has the ISAllowed flag.
    const perm = data.find(item => item.ScreenCode === code && (item.hasOwnProperty('ISAllowed') || item.hasOwnProperty('HID_ISAllowed')));
    
    if (!perm) return false;

    // Handle the specific keys from your PHP response logic
    const allowed = perm.ISAllowed || perm.HID_ISAllowed;
    return (allowed === true || allowed === "1" || allowed === 1);
  };

   const handleSectionClick = (status) =>{
    if(onNavigate) {
      onNavigate(status);
    }
   }
  // Render content based on active tab
  const renderContent = () => {
    const showTasks = checkPermission(rawApiData, 'TSK') || checkPermission(rawApiData, 'Task'); 
    const showClaims = checkPermission(rawApiData, 'CLM') || checkPermission(rawApiData, 'Claims');
    const showService = checkPermission(rawApiData, 'SR') || checkPermission(rawApiData, 'serv_req');
    const showMarketing = checkPermission(rawApiData, 'MC') || checkPermission(rawApiData, 'mar_call');
   
    const handleServiceClick = (status) => { if(onNavigate) onNavigate(status, 'service'); };
    const handleMarketingClick = (status) => { if(onNavigate) onNavigate(status, 'marketing'); };
    const handleTaskClick = (status) => { if(onNavigate) onNavigate(status, 'tasks'); };
    const handleClaimClick = (status) => { if(onNavigate) onNavigate(status, 'claims'); };

    switch (activeTab) {
      case 'home':
        return (
          <>
        {showService && ( <UnifiedSection type="service" data={dashboardData.service} onCardClick={handleServiceClick}/>) }
        {showMarketing && ( <UnifiedSection type="marketing" data={dashboardData.marketing} onCardClick={handleMarketingClick} /> )}
        {showTasks && ( <UnifiedSection type="tasks" data={dashboardData.tasks} onCardClick={handleTaskClick} /> )}
        {showClaims && ( <UnifiedSection type="claims" data={dashboardData.claims} onCardClick={handleClaimClick} />) }
          </>
        );
      case 'service':
        return <UnifiedSection type="service" data={dashboardData.service} onCardClick={handleServiceClick}/>;
      case 'marketing':
        return <UnifiedSection type="marketing" data={dashboardData.marketing} onCardClick={handleMarketingClick} />;
      case 'tasks':
        return <UnifiedSection type="tasks" data={dashboardData.tasks} onCardClick={handleTaskClick} />;
      case 'claims':
        return <UnifiedSection type="claims" data={dashboardData.claims} onCardClick={handleClaimClick} />;
      default:
        return null;
    }
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <>
      {/* <StatusBar barStyle="light-content" backgroundColor={BRAND_COLOR} /> */}
      
      {/* Header */}
      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>GA Morgan Dynamics</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell" size={22} color="#fff" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>7</Text>
          </View>
        </TouchableOpacity>
      </View> */}

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
        
        {/* Extra space at bottom for dock */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </>

// </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  }
});

export default Dashboard;