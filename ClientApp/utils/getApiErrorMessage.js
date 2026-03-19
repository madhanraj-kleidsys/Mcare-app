// utils/getApiErrorMessage.js
export const getApiErrorMessage = (error) => {
  if (!error) return "Unknown error";

  // 1. Axios standard response
  if (error.response?.data) {
    const data = error.response.data;

    // Common patterns in your backend
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.msg) return data.msg;

    // If it's an object with multiple messages
    if (typeof data === 'object') {
      return Object.values(data).join(', ') || "Server error";
    }
  }

  // 2. Network / timeout / cancel cases
  if (error.message) {
    if (error.message.includes("Network Error")) {
      return "Cannot connect to server. Check your internet.";
    }
    if (error.message.includes("timeout")) {
      return "Server timed out. Please try again later.";
    }
    return error.message;
  }

  return "An unexpected error occurred";
};