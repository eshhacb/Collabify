import express from 'express';
import {
  sendInvitation,
  getInvitationByToken,
  acceptInvitation,
  getInvitationsByDocument,
  cancelInvitation,
  cleanupExpiredInvitations
} from '../controllers/invitationController.js';

const router = express.Router();

// Send invitation
router.post('/send', sendInvitation);

// Get invitation by token (for accepting)
router.get('/token/:token', getInvitationByToken);

// Accept invitation
router.post('/accept/:token', acceptInvitation);

// Get all invitations for a document
router.get('/document/:documentId', getInvitationsByDocument);

// Cancel invitation
router.delete('/:invitationId', cancelInvitation);

// Cleanup expired invitations (for cron jobs)
router.post('/cleanup', cleanupExpiredInvitations);

export default router;
