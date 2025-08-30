import React, { useState, useEffect } from 'react';
import { config } from '../config.js';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';

const InvitationsList = ({ documentId, userRole }) => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInvitations = async () => {
    if (!documentId || !['admin', 'editor'].includes(userRole)) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invitations');
      }

      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      let data = {};
      try { data = await response.json(); } catch (_) {}

      if (!response.ok) {
        // Common backend messages:
        // - 'Can only cancel pending invitations'
        // - 'Invitation not found'
        setError(data.message || `Failed to cancel invitation (${response.status})`);
      }
      // Refresh the list regardless (status might have changed)
      fetchInvitations();
    } catch (err) {
      setError(err.message);
      fetchInvitations();
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'warning', icon: <ScheduleIcon /> };
      case 'accepted':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'expired':
        return { color: 'error', icon: <CancelIcon /> };
      default:
        return { color: 'default', icon: <ScheduleIcon /> };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchInvitations();
  }, [documentId, userRole]);

  if (!['admin', 'editor'].includes(userRole)) {
    return null;
  }

  return (
    <Paper variant="outlined">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <MailOutlineIcon fontSize="small" color="action" />
        <Typography variant="subtitle1">Pending Invitations</Typography>
      </Stack>

      <div style={{ padding: 16 }}>
        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 2 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading invitations...</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : invitations.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
            <MailOutlineIcon fontSize="large" color="disabled" />
            <Typography color="text.secondary">No pending invitations</Typography>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {invitations.map((invitation) => (
              <Stack key={invitation.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Avatar sx={{ bgcolor: 'background.paper' }}>
                  <PersonIcon color="disabled" />
                </Avatar>
                <Stack flex={1} minWidth={0} spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{invitation.email}</Typography>
                    <Chip size="small" {...getStatusChipProps(invitation.status)} label={getStatusText(invitation.status)} />
                  </Stack>
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
                    <Typography variant="caption" className="capitalize">{invitation.role}</Typography>
                    <Typography variant="caption">Invited by {invitation.invitedByName}</Typography>
                    <Typography variant="caption">{formatDate(invitation.createdAt)}</Typography>
                    {invitation.status === 'pending' && (
                      <Typography variant="caption" color={isExpired(invitation.expiresAt) ? 'error' : 'inherit'}>
                        Expires {formatDate(invitation.expiresAt)}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                {invitation.status === 'pending' && (
                  <Tooltip title="Cancel invitation">
                    <IconButton onClick={() => cancelInvitation(invitation.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </div>
    </Paper>
  );
};

export default InvitationsList;
