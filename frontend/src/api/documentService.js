import axios from "axios";

const API_URL = "http://localhost:4001/api/documents";

// ✅ Always send cookies (which contain the token)
axios.defaults.withCredentials = true;

export const getAllDocuments = async () => {
  const response = await axios.get(`${API_URL}/get-Alldocument`, {
    withCredentials: true, // ✅ Send cookies automatically
  });
  return response.data;
};

export const createNewDocument = async (title) => {
   
  const response = await axios.post(`${API_URL}/create-document`, {title}, {
    withCredentials: true, // ✅ Send cookies with the request
  });
 
  return response.data.document;
};
