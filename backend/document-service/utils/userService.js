import axios from "axios";

const AUTH_SERVICE_URL = "http://localhost:4000/api/auth"; // Update with actual URL

export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/users/${userId}`);
    return response.data.user; // Return user details
  } catch (error) {
    console.error("Error fetching user:", error.response?.data || error.message);
    return null;
  }
};
