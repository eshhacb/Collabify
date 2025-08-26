import axios from "axios";
import { config } from "../config.js";

const API_GATEWAY_URL = `${config.API_URL}/api/auth`;

export const registerUser = async (userData) => {
  return axios.post(`${API_GATEWAY_URL}/register`, userData, { withCredentials: true });
};

export const loginUser = async (userData) => {
  return axios.post(`${API_GATEWAY_URL}/login`, userData, { withCredentials: true });
};
export const logoutUser = async () => {
    return axios.post(`${API_GATEWAY_URL}/logout`, {}, { withCredentials: true });
  };