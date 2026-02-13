import api from '../api/axiosClient';

// Fetch all notification data (Service, Marketing, Tasks)
export const fetchDashboardNotifications = async () => {
  try {
    const response = await api.get('/home/notifications');
    return response.data;
  } catch (error) {
    console.error("Notification Fetch Error:", error);
    // Return empty structure on error to prevent UI crash
    return { service: [], marketing: [], tasks: [], counts: { sr: 0, mc: 0, tsk: 0 } };
  }
};