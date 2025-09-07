import axios from "axios";
import { config } from "../config.js";

const API_URL = `${config.API_URL}/api/auth`;
axios.defaults.withCredentials = true;

export const getUsersByIds = async (ids) => {
  const res = await axios.post(`${API_URL}/users/by-ids`, { ids }, { withCredentials: true });
  return res.data; // { users: [{id, name, email}] }
};