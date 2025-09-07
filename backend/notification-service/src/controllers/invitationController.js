import Invitation from '../models/Invitation.model.js';
import { sendInvitationEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Normalize emails: strip surrounding quotes and extract address inside angle brackets
const normalizeEmail = (input) => {
  if (!input) return '';
  let s = String(input).trim();
  // If format like: Name <email@domain>
  const angle = s.match(/<([^>]+)>/);
  if (angle) s = angle[1];
  // Remove leading/trailing single or double quotes
  s = s.replace(/^["']+|["']+$/g, '');
  return s.toLowerCase();
};

// Get invitations by recipient email
export const getInvitationsByRecipient = async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'email query is required' });

    const invitations = await Invitation.find({ email });
    invitations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      invitations: invitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        documentId: inv.documentId,
        documentTitle: inv.documentTitle,
        role: inv.role,
        status: inv.status,
        invitedByName: inv.invitedByName,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        token: inv.token,
      })),
    });
  } catch (error) {
    console.error('Error getting recipient invitations:', error);
    res.status(500).json({ message: 'Failed to get invitations', error: error.message });
  }
};

// Reject invitation by token
export const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token });
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.status !== 'pending') return res.status(400).json({ message: 'Can only reject pending invitations' });

    if (typeof invitation.reject === 'function') {
      await invitation.reject();
    } else {
      // Fallback for mongoose doc if reject method not present
      invitation.status = 'rejected';
      await invitation.save();
    }
    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Failed to reject invitation', error: error.message });
  }
};

// Send invitation
export const sendInvitation = async (req, res) => {
  try {
    const { email: rawEmail, documentId, documentTitle, role, invitedBy, invitedByName } = req.body;
    const email = normalizeEmail(rawEmail);

    // Validate required fields
    if (!email || !documentId || !documentTitle || !role || !invitedBy || !invitedByName) {
      return res.status(400).json({
        message: 'Missing required fields: email, documentId, documentTitle, role, invitedBy, invitedByName'
      });
    }

    // Validate role
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Allowed roles: viewer, editor'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }

    // Check if invitation already exists for this email and document
    const existingInvitation = await Invitation.findOne({
      email,
      documentId,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(409).json({
        message: 'An invitation for this email and document already exists'
      });
    }

    // Create invitation token
    const token = uuidv4();
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await Invitation.create({
      email,
      documentId,
      documentTitle,
      role,
      invitedBy,
      invitedByName,
      token,
      expiresAt
    });

    // Generate accept URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const acceptUrl = `${frontendUrl}/invitation/accept/${token}`;

    // Send email
    await sendInvitationEmail(invitation, acceptUrl);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        documentId: invitation.documentId,
        documentTitle: invitation.documentTitle,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      message: 'Failed to send invitation',
      error: error.message
    });
  }
};

// Get invitation by token
export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        message: 'Invitation not found'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired()) {
      await invitation.markAsExpired();
      return res.status(410).json({
        message: 'Invitation has expired'
      });
    }

    // Check if invitation is already accepted or rejected
    if (invitation.status === 'accepted') {
      return res.status(409).json({
        message: 'Invitation has already been accepted'
      });
    }
    if (invitation.status === 'rejected') {
      return res.status(409).json({
        message: 'Invitation has been rejected'
      });
    }

    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        documentId: invitation.documentId,
        documentTitle: invitation.documentTitle,
        role: invitation.role,
        status: invitation.status,
        invitedByName: invitation.invitedByName,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error getting invitation:', error);
    res.status(500).json({
      message: 'Failed to get invitation',
      error: error.message
    });
  }
};

// Accept invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body; // Optional - user might not have account yet

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        message: 'Invitation not found'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired()) {
      await invitation.markAsExpired();
      return res.status(410).json({
        message: 'Invitation has expired'
      });
    }

    // Check if invitation is already accepted or rejected
    if (invitation.status === 'accepted') {
      return res.status(409).json({
        message: 'Invitation has already been accepted'
      });
    }
    if (invitation.status === 'rejected') {
      return res.status(409).json({
        message: 'Invitation has been rejected'
      });
    }

    // Mark invitation as accepted
    await invitation.accept();

    res.json({
      message: 'Invitation accepted successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        documentId: invitation.documentId,
        documentTitle: invitation.documentTitle,
        role: invitation.role
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
};

// Get invitations by document ID
export const getInvitationsByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const invitations = await Invitation.find({ documentId });
    
    // Sort invitations by creation date (newest first)
    invitations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      invitations: invitations.map(inv => ({
        id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedByName: inv.invitedByName,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt
      }))
    });

  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({
      message: 'Failed to get invitations',
      error: error.message
    });
  }
};

// Cancel invitation
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        message: 'Can only cancel pending invitations'
      });
    }

    await invitation.markAsExpired();

    res.json({
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
};

// Clean up expired invitations (cron job endpoint)
export const cleanupExpiredInvitations = async (req, res) => {
  try {
    const result = await Invitation.updateMany(
      { 
        status: 'pending',
        expiresAt: { $lt: new Date() }
      },
      { status: 'expired' }
    );

    res.json({
      message: 'Expired invitations cleaned up',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    res.status(500).json({
      message: 'Failed to cleanup expired invitations',
      error: error.message
    });
  }
};
