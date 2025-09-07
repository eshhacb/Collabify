import axios from "axios";
import { config } from "../config.js";

const API_URL = `${config.API_URL}/api/documents`;
axios.defaults.withCredentials = true;

export const listTasks = async (documentId) => {
  const res = await axios.get(`${API_URL}/${documentId}/tasks`, { withCredentials: true });
  return res.data; // { tasks }
};

export const createTask = async (documentId, payload) => {
  const res = await axios.post(`${API_URL}/${documentId}/tasks`, payload, { withCredentials: true });
  return res.data; // { task }
};

export const updateTask = async (documentId, taskId, payload) => {
  const res = await axios.put(`${API_URL}/${documentId}/tasks/${taskId}`, payload, { withCredentials: true });
  return res.data;
};

export const deleteTask = async (documentId, taskId) => {
  const res = await axios.delete(`${API_URL}/${documentId}/tasks/${taskId}`, { withCredentials: true });
  return res.data;
};