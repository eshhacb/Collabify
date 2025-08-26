import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

export const sendDocumentInvitation = async (invitationData) => {
  try {
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/invitations/send`,
      invitationData,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending invitation:', error.response?.data || error.message);
    throw new Error(`Failed to send invitation: ${error.response?.data?.message || error.message}`);
  }
};

export const getDocumentInvitations = async (documentId) => {
  try {
    const response = await axios.get(
      `${NOTIFICATION_SERVICE_URL}/api/invitations/document/${documentId}`,
      {
        timeout: 5000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting invitations:', error.response?.data || error.message);
    throw new Error(`Failed to get invitations: ${error.response?.data?.message || error.message}`);
  }
};

export const cancelDocumentInvitation = async (invitationId) => {
  try {
    const response = await axios.delete(
      `${NOTIFICATION_SERVICE_URL}/api/invitations/${invitationId}`,
      {
        timeout: 5000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error cancelling invitation:', error.response?.data || error.message);
    throw new Error(`Failed to cancel invitation: ${error.response?.data?.message || error.message}`);
  }
};
