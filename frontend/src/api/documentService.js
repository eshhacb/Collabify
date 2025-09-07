import axios from "axios";
import { config } from "../config.js";

const API_URL = `${config.API_URL}/api/documents`;

// ✅ Always send cookies (which contain the token)
axios.defaults.withCredentials = true;

export const getAllDocuments = async () => {
  const response = await axios.get(`${API_URL}/get-Alldocument`, {
    withCredentials: true,
  });
  return response.data;
};

export const createNewDocument = async (title) => {
  const response = await axios.post(
    `${API_URL}/create-document`,
    { title },
    { withCredentials: true }
  );
  return response.data.document;
};

// RBAC helpers
export const getDocumentById = async (documentId) => {
  const response = await axios.get(`${API_URL}/${documentId}`, { withCredentials: true });
  return response.data; // { document, userRole }
};

export const updateDocumentTitle = async (documentId, title) => {
  const response = await axios.put(
    `${API_URL}/${documentId}`,
    { title },
    { withCredentials: true }
  );
  return response.data;
};

// Collaborators
export const listCollaborators = async (documentId) => {
  const response = await axios.get(`${API_URL}/${documentId}/collaborators`, { withCredentials: true });
  return response.data; // { collaborators }
};

// Collaborator management (admin)
export const addCollaborator = async (documentId, payload) => {
  const response = await axios.post(
    `${API_URL}/${documentId}/collaborators`,
    payload, // { userId, role }
    { withCredentials: true }
  );
  return response.data;
};

export const updateCollaboratorRole = async (documentId, userId, role) => {
  const response = await axios.patch(
    `${API_URL}/${documentId}/collaborators/${userId}`,
    { role },
    { withCredentials: true }
  );
  return response.data;
};

export const removeCollaborator = async (documentId, userId) => {
  const response = await axios.delete(
    `${API_URL}/${documentId}/collaborators/${userId}`,
    { withCredentials: true }
  );
  return response.data;
};