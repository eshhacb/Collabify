import React, { useEffect, useState } from 'react';
import { config } from '../config';
import {
  Paper, Stack, Typography, Chip, Button, CircularProgress, Alert,
} from '@mui/material';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const userEmail = localStorage.getItem('userEmail'); // ensure this is set on login/accept

  const loadInvites = async () => {
    if (!userEmail) { setError('No user email found'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/invitations/recipient?email=${encodeURIComponent(userEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load invitations');
      setInvitations(data.invitations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (token) => {
    try {
      const res = await fetch(`${config.API_URL}/api/auth/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invitationToken: token, userData: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept invitation');
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user?.email) localStorage.setItem('userEmail', data.user.email);
      await loadInvites();
    } catch (e) {
      setError(e.message);
    }
  };

  const reject = async (token) => {
    try {
      const res = await fetch(`${config.API_URL}/api/invitations/reject/${token}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to reject invitation');
      await loadInvites();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadInvites(); }, []);

  const statusChip = (status) => {
    switch (status) {
      case 'pending': return <Chip size="small" label="Pending" color="warning" />;
      case 'accepted': return <Chip size="small" label="Accepted" color="success" />;
      case 'expired': return <Chip size="small" label="Expired" color="error" />;
      default: return <Chip size="small" label={status} />;
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Your Invitations</Typography>
      {loading ? (
        <Stack direction="row" alignItems="center" spacing={1}><CircularProgress size={18} /><Typography>Loading...</Typography></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : invitations.length === 0 ? (
        <Typography color="text.secondary">No invitations.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {invitations.map((inv) => (
            <Paper key={inv.id} sx={{ p: 1.5 }} variant="outlined">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">{inv.documentTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Role: {inv.role} • Invited by {inv.invitedByName}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {statusChip(inv.status)}
                  {inv.status === 'pending' && (
                    <>
                      <Button size="small" variant="contained" onClick={() => accept(inv.token)}>Accept</Button>
                      <Button size="small" onClick={() => reject(inv.token)}>Reject</Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default Invitations;