import axios from "axios";

const API_GATEWAY_URL = "http://localhost:5000/api/auth";

export const registerUser = async (userData) => {
  return axios.post(`${API_GATEWAY_URL}/register`, userData, { withCredentials: true });
};

export const loginUser = async (userData) => {
  return axios.post(`${API_GATEWAY_URL}/login`, userData, { withCredentials: true });
};
export const logoutUser = async () => {
    return axios.post(`${API_GATEWAY_URL}/logout`, {}, { withCredentials: true });
  };