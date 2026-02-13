import api from '../api/axiosClient';

export const fetchProfileData = async () => {
  try {
    const response = await api.get('/profile/getProfileData');
    // The API returns an array [{...}], we want the first item
    return response.data[0] || null;
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    throw error;
  }
};

export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await api.post('/profile/resetPassword', {
      PrevPwdVal: oldPassword,
      NewPwdVal: newPassword
    });
    return response.data;
  } catch (error) {
    console.error("Password Reset Error:", error);
    throw error;
  }
};