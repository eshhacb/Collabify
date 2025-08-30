import React, { useState } from 'react';
import { config } from '../config.js';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const InviteModal = ({ isOpen, onClose, documentId, documentTitle, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflictInvitationId, setConflictInvitationId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), role })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Invitation already exists; surface clearer message and enable Resend option
          setError('An invitation for this email already exists for this document.');
          // Try to find the existing invitation id for convenience
          try {
            const listRes = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations`, {
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              credentials: 'include'
            });
            const listData = await listRes.json();
            if (listRes.ok && Array.isArray(listData.invitations)) {
              const match = listData.invitations.find(inv => inv.email?.toLowerCase() === email.trim().toLowerCase() && inv.status === 'pending');
              if (match?.id) setConflictInvitationId(match.id);
            }
          } catch (_) {}
          return;
        }
        throw new Error(data.message || 'Failed to send invitation');
      }

      setSuccess('Invitation sent successfully!');
      setEmail('');
      setRole('viewer');
      if (onInviteSent) onInviteSent();

      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setRole('viewer');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  const handleResend = async () => {
    const token = localStorage.getItem('token');
    setIsLoading(true);
    try {
      let existingId = conflictInvitationId;
      if (!existingId) {
        const listRes = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        const listData = await listRes.json();
        if (listRes.ok && Array.isArray(listData.invitations)) {
          const match = listData.invitations.find(inv => inv.email?.toLowerCase() === email.trim().toLowerCase() && inv.status === 'pending');
          if (match?.id) existingId = match.id;
        }
      }
      if (existingId) {
        await fetch(`${config.API_URL}/api/documents/invitations/${existingId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
      }
      // retry send
      setConflictInvitationId(null);
      setError('');
      await handleSubmit(new Event('submit'));
    } catch (e) {
      setError(e.message || 'Failed to resend invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Invitation</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <div>
            <InputLabel shrink>Document</InputLabel>
            <div style={{ fontWeight: 500 }}>{documentTitle}</div>
          </div>

          {error && (
            <Alert
              severity="error"
              action={
                conflictInvitationId ? (
                  <Button color="inherit" size="small" onClick={handleResend} disabled={isLoading}>
                    Cancel existing & Resend
                  </Button>
                ) : null
              }
            >
              {error}
            </Alert>
          )}
          {success && <Alert severity="success">{success}</Alert>}

          <form onSubmit={handleSubmit} id="invite-form">
            <Stack spacing={3}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                >
                  <MenuItem value="viewer">Viewer - Can view the document</MenuItem>
                  <MenuItem value="editor">Editor - Can view and edit the document</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </form>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading} variant="outlined">
          Cancel
        </Button>
        <Button
          type="submit"
          form="invite-form"
          disabled={isLoading}
          variant="contained"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteModal;
